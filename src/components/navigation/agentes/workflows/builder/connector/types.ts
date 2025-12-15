export type ConnectorKind = 'action' | 'trigger' | 'helper' | 'core'

export type StepType = 'action' | 'branch' | 'delay' | 'trigger'

export interface Connector {
  id: string
  label: string
  hint?: string
  kind: ConnectorKind
  stepType?: StepType
  icon?: React.ReactNode
  tags?: string[]
}

export interface Provider {
  id: string
  name: string
  count?: number
  connectors: Connector[]
}

export interface ConnectorCatalog {
  actionBlocks: Connector[]
  providers: Provider[]
}

