export type BlockKind =
  | 'agente'
  | 'ferramenta'
  | 'condicao'
  | 'resposta'
  | 'inicio'
  | 'nota'
  | 'loop'
  | 'aprovacao'
  | 'transform'
  | 'setstate'
  | 'step'
  | 'prepareStep'
  | 'stopWhen'

export interface Branch {
  label: string
  next: string | null
}

// Configs específicas por tipo (MVP)
export interface AgentBlockConfig {
  model?: string
  systemPrompt?: string
  temperature?: number
}

export interface ToolBlockConfig {
  toolIds?: string[]
}

export interface ConditionBlockConfig {
  expression?: string
}

export interface ResponseBlockConfig {
  template?: string
}

export interface StepBlockConfig {
  maxSteps?: number
  toolChoice?: 'auto' | 'none' | 'required'
  prepareStepEnabled?: boolean
  notes?: string
}

export interface PrepareStepBlockConfig {
  compressAfterMessages?: number
  keepLastMessages?: number
  stopOnTools?: string[]
  defaultModel?: string
  defaultToolChoice?: 'auto' | 'none'
}

export interface StopWhenBlockConfig {
  stepLimit?: number
  stopOnTools?: string[]
}

export interface Block {
  id: string
  kind: BlockKind
  name?: string
  config?: Record<string, unknown>
  next?: string | null
  branches?: Branch[]
}

export interface Graph {
  headId: string | null
  blocks: Block[]
}
