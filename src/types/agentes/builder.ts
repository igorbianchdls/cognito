export type BlockKind = 'agente' | 'ferramenta' | 'condicao' | 'resposta' | 'inicio'

export interface Branch {
  label: string
  next: string | null
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

