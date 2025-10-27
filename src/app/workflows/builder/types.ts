export type StepType = 'trigger' | 'action' | 'branch' | 'delay'

export type BaseConfig = Record<string, unknown>

export interface Step {
  id: string
  type: StepType
  text?: string
  config?: BaseConfig
}

