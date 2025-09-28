import { atom, computed } from 'nanostores'

// Tipos
export interface Insight {
  id: string
  titulo: string
  descricao: string
  dados?: string
  importancia: 'alta' | 'media' | 'baixa'
  timestamp: Date
  source?: string
  read?: boolean
}

// Mock data para insights
const mockInsights: Insight[] = [
  {
    id: 'insight_1',
    titulo: "Conversões aumentaram 15%",
    descricao: "Campanhas de retargeting no Instagram e Facebook mostraram excelente performance nas últimas 2 semanas.",
    dados: "CTR: 3.2% | CPM: R$12,50 | ROAS: 4.8x",
    importancia: 'alta',
    timestamp: new Date(),
    source: 'optimization-test',
    read: false
  },
  {
    id: 'insight_2',
    titulo: "Bounce rate melhorou 8%",
    descricao: "Otimizações de UX implementadas na página inicial resultaram em maior engajamento e permanência dos usuários.",
    dados: "Bounce rate: 42% vs 50% (mês anterior)",
    importancia: 'baixa',
    timestamp: new Date(),
    source: 'optimization-test',
    read: false
  },
  {
    id: 'insight_3',
    titulo: "ROI do email marketing subiu 22%",
    descricao: "Segmentação mais precisa e subject lines personalizadas aumentaram significativamente as taxas de abertura.",
    dados: "Open rate: 28% | Click rate: 6.5% | ROI: 122%",
    importancia: 'media',
    timestamp: new Date(),
    source: 'optimization-test',
    read: false
  }
]

// Load insights from localStorage on initialization
const loadInsightsFromStorage = (): Insight[] => {
  if (typeof window === 'undefined') return mockInsights
  try {
    const stored = localStorage.getItem('cognito-insights')
    if (!stored) return mockInsights
    const parsed = JSON.parse(stored) as Array<{
      id: string
      titulo: string
      descricao: string
      dados?: string
      importancia: 'alta' | 'media' | 'baixa'
      timestamp: string
      source?: string
      read?: boolean
    }>
    return parsed.map((insight) => ({
      ...insight,
      timestamp: new Date(insight.timestamp)
    }))
  } catch {
    return []
  }
}

// Main insights atom with localStorage persistence
export const $insights = atom<Insight[]>(loadInsightsFromStorage())
export const $insightsLoading = atom<boolean>(false)
export const $insightsError = atom<string | null>(null)

// Auto-save to localStorage whenever insights change
if (typeof window !== 'undefined') {
  $insights.subscribe(insights => {
    localStorage.setItem('cognito-insights', JSON.stringify(insights))
  })
}

// Computed stores
export const $totalInsights = computed([$insights], (insights) => insights.length)

export const $insightsPorImportancia = computed([$insights], (insights) => {
  return insights.reduce((acc, insight) => {
    acc[insight.importancia] = (acc[insight.importancia] || 0) + 1
    return acc
  }, {} as Record<'alta' | 'media' | 'baixa', number>)
})

export const $insightsRecentes = computed([$insights], (insights) => {
  return insights
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10)
})

export const $insightsNaoLidos = computed([$insights], (insights) => {
  return insights.filter(insight => !insight.read)
})

export const $insightsOrdenados = computed([$insights], (insights) => {
  const ordem = { alta: 0, media: 1, baixa: 2 }
  return [...insights].sort((a, b) => {
    // Primeiro por importância, depois por timestamp
    const importanciaComp = ordem[a.importancia] - ordem[b.importancia]
    if (importanciaComp !== 0) return importanciaComp
    return b.timestamp.getTime() - a.timestamp.getTime()
  })
})

// Actions
export function addInsights(newInsights: Omit<Insight, 'id' | 'timestamp' | 'read'>[]): void {
  const insights = newInsights.map(insight => ({
    ...insight,
    id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    read: false
  }))

  $insights.set([...$insights.get(), ...insights])
}

export function addInsight(insight: Omit<Insight, 'id' | 'timestamp' | 'read'>): void {
  const newInsight: Insight = {
    ...insight,
    id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    read: false
  }

  $insights.set([...$insights.get(), newInsight])
}

export function clearInsights(): void {
  $insights.set([])
}

export function clearInsightsBySource(source: string): void {
  const currentInsights = $insights.get()
  const filteredInsights = currentInsights.filter(insight => insight.source !== source)
  $insights.set(filteredInsights)
}

export function markAsRead(id: string): void {
  const currentInsights = $insights.get()
  const updatedInsights = currentInsights.map(insight =>
    insight.id === id ? { ...insight, read: true } : insight
  )
  $insights.set(updatedInsights)
}

export function markAllAsRead(): void {
  const currentInsights = $insights.get()
  const updatedInsights = currentInsights.map(insight => ({ ...insight, read: true }))
  $insights.set(updatedInsights)
}

export function removeInsight(id: string): void {
  const currentInsights = $insights.get()
  const filteredInsights = currentInsights.filter(insight => insight.id !== id)
  $insights.set(filteredInsights)
}

export function getInsightsByImportancia(importancia: 'alta' | 'media' | 'baixa'): Insight[] {
  return $insights.get().filter(insight => insight.importancia === importancia)
}

export function getInsightsBySource(source: string): Insight[] {
  return $insights.get().filter(insight => insight.source === source)
}

// Loading states
export function setLoading(loading: boolean): void {
  $insightsLoading.set(loading)
}

export function setError(error: string | null): void {
  $insightsError.set(error)
}