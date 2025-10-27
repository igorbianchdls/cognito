export type WorkflowStatus = 'ativo' | 'rascunho' | 'pausado'

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
}

