import { atom, computed } from 'nanostores'

// Tipos
export interface Alerta {
  id: string
  titulo: string
  descricao: string
  dados?: string
  nivel: 'critico' | 'alto' | 'medio' | 'baixo'
  acao?: string
  timestamp: Date
  source?: string
  resolved?: boolean
}

// Mock data para alertas
const mockAlertas: Alerta[] = [
  {
    id: 'alerta_1',
    titulo: "Orçamento Google Ads próximo do limite",
    descricao: "Campaign 'Black Friday 2024' está com 85% do orçamento consumido. Considere aumentar o budget ou pausar ads de baixa performance.",
    dados: "Gasto: R$8.500 / R$10.000 | CPA atual: R$45",
    acao: "Revisar palavras-chave com CPC alto e pausar anúncios com CTR < 1%",
    nivel: 'critico',
    timestamp: new Date(),
    source: 'optimization-test',
    resolved: false
  },
  {
    id: 'alerta_2',
    titulo: "CTR do Facebook abaixo da média",
    descricao: "Campanha 'Promoção Verão' apresenta CTR de 0.8%, bem abaixo da média de 2.1% do segmento.",
    dados: "CTR: 0.8% vs 2.1% (benchmark) | Impressões: 45k",
    acao: "Testar novos criativos e revisar targeting de audiência",
    nivel: 'alto',
    timestamp: new Date(),
    source: 'optimization-test',
    resolved: false
  },
  {
    id: 'alerta_3',
    titulo: "Landing page com alta taxa de saída",
    descricao: "Página de checkout está com 65% de abandono, indicando possíveis problemas de UX ou performance.",
    dados: "Taxa de saída: 65% | Tempo na página: 1m23s",
    acao: "Implementar testes A/B no formulário de checkout",
    nivel: 'medio',
    timestamp: new Date(),
    source: 'optimization-test',
    resolved: false
  }
]

// Load alertas from localStorage on initialization
const loadAlertasFromStorage = (): Alerta[] => {
  if (typeof window === 'undefined') return mockAlertas
  try {
    const stored = localStorage.getItem('cognito-alertas')
    if (!stored) return mockAlertas
    const parsed = JSON.parse(stored) as Array<{
      id: string
      titulo: string
      descricao: string
      dados?: string
      nivel: 'critico' | 'alto' | 'medio' | 'baixo'
      acao?: string
      timestamp: string
      source?: string
      resolved?: boolean
    }>
    return parsed.map((alerta) => ({
      ...alerta,
      timestamp: new Date(alerta.timestamp)
    }))
  } catch {
    return []
  }
}

// Main alertas atom with localStorage persistence
export const $alertas = atom<Alerta[]>(loadAlertasFromStorage())
export const $alertasLoading = atom<boolean>(false)
export const $alertasError = atom<string | null>(null)

// Auto-save to localStorage whenever alertas change
if (typeof window !== 'undefined') {
  $alertas.subscribe(alertas => {
    localStorage.setItem('cognito-alertas', JSON.stringify(alertas))
  })
}

// Computed stores
export const $totalAlertas = computed([$alertas], (alertas) => alertas.length)

export const $alertasPorNivel = computed([$alertas], (alertas) => {
  return alertas.reduce((acc, alerta) => {
    acc[alerta.nivel] = (acc[alerta.nivel] || 0) + 1
    return acc
  }, {} as Record<'critico' | 'alto' | 'medio' | 'baixo', number>)
})

export const $alertasCriticos = computed([$alertas], (alertas) => {
  return alertas.filter(alerta => alerta.nivel === 'critico' && !alerta.resolved)
})

export const $alertasAtivos = computed([$alertas], (alertas) => {
  return alertas.filter(alerta => !alerta.resolved)
})

export const $alertasRecentes = computed([$alertas], (alertas) => {
  return alertas
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10)
})

export const $alertasOrdenados = computed([$alertas], (alertas) => {
  const ordem = { critico: 0, alto: 1, medio: 2, baixo: 3 }
  return [...alertas].sort((a, b) => {
    // Primeiro por nivel, depois por timestamp
    const nivelComp = ordem[a.nivel] - ordem[b.nivel]
    if (nivelComp !== 0) return nivelComp
    return b.timestamp.getTime() - a.timestamp.getTime()
  })
})

export const $alertasComAcao = computed([$alertas], (alertas) => {
  return alertas.filter(alerta => alerta.acao && !alerta.resolved)
})

// Actions
export function addAlertas(newAlertas: Omit<Alerta, 'id' | 'timestamp' | 'resolved'>[]): void {
  const alertas = newAlertas.map(alerta => ({
    ...alerta,
    id: `alerta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    resolved: false
  }))

  $alertas.set([...$alertas.get(), ...alertas])
}

export function addAlerta(alerta: Omit<Alerta, 'id' | 'timestamp' | 'resolved'>): void {
  const newAlerta: Alerta = {
    ...alerta,
    id: `alerta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    resolved: false
  }

  $alertas.set([...$alertas.get(), newAlerta])
}

export function clearAlertas(): void {
  $alertas.set([])
}

export function clearAlertasBySource(source: string): void {
  const currentAlertas = $alertas.get()
  const filteredAlertas = currentAlertas.filter(alerta => alerta.source !== source)
  $alertas.set(filteredAlertas)
}

export function markAsResolved(id: string): void {
  const currentAlertas = $alertas.get()
  const updatedAlertas = currentAlertas.map(alerta =>
    alerta.id === id ? { ...alerta, resolved: true } : alerta
  )
  $alertas.set(updatedAlertas)
}

export function markAllAsResolved(): void {
  const currentAlertas = $alertas.get()
  const updatedAlertas = currentAlertas.map(alerta => ({ ...alerta, resolved: true }))
  $alertas.set(updatedAlertas)
}

export function removeAlerta(id: string): void {
  const currentAlertas = $alertas.get()
  const filteredAlertas = currentAlertas.filter(alerta => alerta.id !== id)
  $alertas.set(filteredAlertas)
}

export function getAlertasByNivel(nivel: 'critico' | 'alto' | 'medio' | 'baixo'): Alerta[] {
  return $alertas.get().filter(alerta => alerta.nivel === nivel)
}

export function getAlertasBySource(source: string): Alerta[] {
  return $alertas.get().filter(alerta => alerta.source === source)
}

export function executeAction(id: string): void {
  // Marca o alerta como resolvido quando a ação é executada
  markAsResolved(id)
}

// Loading states
export function setLoading(loading: boolean): void {
  $alertasLoading.set(loading)
}

export function setError(error: string | null): void {
  $alertasError.set(error)
}