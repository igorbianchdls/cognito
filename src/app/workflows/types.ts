export type WorkflowStatus = 'ativo' | 'rascunho' | 'pausado'
export type WorkflowCategory =
  | 'financeiro'
  | 'vendas'
  | 'marketing'
  | 'operacoes'
  | 'crm'
  | 'suporte'
  | 'outros'

export interface WorkflowSummary {
  id: string
  name: string
  description?: string
  status: WorkflowStatus
  tags?: string[]
  updatedAt: string // ISO date
  createdAt: string // ISO date
  runs?: number
  owner?: string
  category?: WorkflowCategory
  // Campos adicionais (opcionais) para enriquecer a UI futuramente
  isAI?: boolean
  stepsCount?: number
  keyApps?: string[]
  schedule?: string
  lastRunStatus?: 'success' | 'warning' | 'error' | 'never'
}
