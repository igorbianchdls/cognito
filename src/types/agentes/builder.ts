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
