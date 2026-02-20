export type ChatErrorSource =
  | 'sandbox'
  | 'api'
  | 'stream'
  | 'tool'
  | 'network'
  | 'unknown'

export type ChatErrorNotification = {
  id: string
  createdAt: string
  source: ChatErrorSource
  message: string
  details?: string
  read: boolean
}

export type PushChatErrorInput = {
  source: ChatErrorSource
  error?: unknown
  message?: string
  details?: unknown
}
