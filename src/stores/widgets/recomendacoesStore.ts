import { atom, computed } from 'nanostores'

// Tipos
export interface Recomendacao {
  id: string
  titulo: string
  descricao: string
  impacto: 'alto' | 'medio' | 'baixo'
  facilidade: 'facil' | 'medio' | 'dificil'
  categoria?: string
  proximosPassos?: string[]
  estimativaResultado?: string
  timestamp: Date
  source?: string
  implemented?: boolean
}

// Load recomendacoes from localStorage on initialization
const loadRecomendacoesFromStorage = (): Recomendacao[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('cognito-recomendacoes')
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return parsed.map((recomendacao: any) => ({
      ...recomendacao,
      timestamp: new Date(recomendacao.timestamp)
    }))
  } catch {
    return []
  }
}

// Main recomendacoes atom with localStorage persistence
export const $recomendacoes = atom<Recomendacao[]>(loadRecomendacoesFromStorage())
export const $recomendacoesLoading = atom<boolean>(false)
export const $recomendacoesError = atom<string | null>(null)

// Auto-save to localStorage whenever recomendacoes change
if (typeof window !== 'undefined') {
  $recomendacoes.subscribe(recomendacoes => {
    localStorage.setItem('cognito-recomendacoes', JSON.stringify(recomendacoes))
  })
}

// Função para calcular prioridade (impacto vs facilidade)
const calcularPrioridade = (recomendacao: Recomendacao): number => {
  const impactoScore = { alto: 3, medio: 2, baixo: 1 }
  const facilidadeScore = { facil: 3, medio: 2, dificil: 1 }
  return (impactoScore[recomendacao.impacto] * 2) + facilidadeScore[recomendacao.facilidade]
}

// Computed stores
export const $totalRecomendacoes = computed([$recomendacoes], (recomendacoes) => recomendacoes.length)

export const $recomendacoesPorImpacto = computed([$recomendacoes], (recomendacoes) => {
  return recomendacoes.reduce((acc, recomendacao) => {
    acc[recomendacao.impacto] = (acc[recomendacao.impacto] || 0) + 1
    return acc
  }, {} as Record<'alto' | 'medio' | 'baixo', number>)
})

export const $recomendacoesPorFacilidade = computed([$recomendacoes], (recomendacoes) => {
  return recomendacoes.reduce((acc, recomendacao) => {
    acc[recomendacao.facilidade] = (acc[recomendacao.facilidade] || 0) + 1
    return acc
  }, {} as Record<'facil' | 'medio' | 'dificil', number>)
})

export const $recomendacoesAtivas = computed([$recomendacoes], (recomendacoes) => {
  return recomendacoes.filter(recomendacao => !recomendacao.implemented)
})

export const $recomendacoesRecentes = computed([$recomendacoes], (recomendacoes) => {
  return recomendacoes
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10)
})

export const $recomendacoesOrdenadas = computed([$recomendacoes], (recomendacoes) => {
  return [...recomendacoes].sort((a, b) => {
    // Ordenar por prioridade (impacto + facilidade), depois por timestamp
    const prioridadeA = calcularPrioridade(a)
    const prioridadeB = calcularPrioridade(b)

    if (prioridadeB !== prioridadeA) {
      return prioridadeB - prioridadeA
    }

    return b.timestamp.getTime() - a.timestamp.getTime()
  })
})

export const $recomendacoesAltaPrioridade = computed([$recomendacoes], (recomendacoes) => {
  return recomendacoes.filter(recomendacao => {
    const prioridade = calcularPrioridade(recomendacao)
    return prioridade >= 7 && !recomendacao.implemented
  })
})

export const $recomendacoesPorCategoria = computed([$recomendacoes], (recomendacoes) => {
  return recomendacoes.reduce((acc, recomendacao) => {
    const categoria = recomendacao.categoria || 'Sem categoria'
    acc[categoria] = (acc[categoria] || 0) + 1
    return acc
  }, {} as Record<string, number>)
})

// Actions
export function addRecomendacoes(newRecomendacoes: Omit<Recomendacao, 'id' | 'timestamp' | 'implemented'>[]): void {
  const recomendacoes = newRecomendacoes.map(recomendacao => ({
    ...recomendacao,
    id: `recomendacao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    implemented: false
  }))

  $recomendacoes.set([...$recomendacoes.get(), ...recomendacoes])
}

export function addRecomendacao(recomendacao: Omit<Recomendacao, 'id' | 'timestamp' | 'implemented'>): void {
  const newRecomendacao: Recomendacao = {
    ...recomendacao,
    id: `recomendacao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    implemented: false
  }

  $recomendacoes.set([...$recomendacoes.get(), newRecomendacao])
}

export function clearRecomendacoes(): void {
  $recomendacoes.set([])
}

export function clearRecomendacoesBySource(source: string): void {
  const currentRecomendacoes = $recomendacoes.get()
  const filteredRecomendacoes = currentRecomendacoes.filter(recomendacao => recomendacao.source !== source)
  $recomendacoes.set(filteredRecomendacoes)
}

export function markAsImplemented(id: string): void {
  const currentRecomendacoes = $recomendacoes.get()
  const updatedRecomendacoes = currentRecomendacoes.map(recomendacao =>
    recomendacao.id === id ? { ...recomendacao, implemented: true } : recomendacao
  )
  $recomendacoes.set(updatedRecomendacoes)
}

export function markAllAsImplemented(): void {
  const currentRecomendacoes = $recomendacoes.get()
  const updatedRecomendacoes = currentRecomendacoes.map(recomendacao => ({ ...recomendacao, implemented: true }))
  $recomendacoes.set(updatedRecomendacoes)
}

export function removeRecomendacao(id: string): void {
  const currentRecomendacoes = $recomendacoes.get()
  const filteredRecomendacoes = currentRecomendacoes.filter(recomendacao => recomendacao.id !== id)
  $recomendacoes.set(filteredRecomendacoes)
}

export function getRecomendacoesByImpacto(impacto: 'alto' | 'medio' | 'baixo'): Recomendacao[] {
  return $recomendacoes.get().filter(recomendacao => recomendacao.impacto === impacto)
}

export function getRecomendacoesByFacilidade(facilidade: 'facil' | 'medio' | 'dificil'): Recomendacao[] {
  return $recomendacoes.get().filter(recomendacao => recomendacao.facilidade === facilidade)
}

export function getRecomendacoesBySource(source: string): Recomendacao[] {
  return $recomendacoes.get().filter(recomendacao => recomendacao.source === source)
}

export function getRecomendacoesByCategoria(categoria: string): Recomendacao[] {
  return $recomendacoes.get().filter(recomendacao => recomendacao.categoria === categoria)
}

export function getPrioridadeRecomendacao(recomendacao: Recomendacao): number {
  return calcularPrioridade(recomendacao)
}

// Loading states
export function setLoading(loading: boolean): void {
  $recomendacoesLoading.set(loading)
}

export function setError(error: string | null): void {
  $recomendacoesError.set(error)
}