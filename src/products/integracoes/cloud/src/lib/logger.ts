export type CloudLogLevel = 'debug' | 'info' | 'warn' | 'error'

export function logCloudEvent(level: CloudLogLevel, message: string, metadata?: Record<string, unknown>) {
  return {
    level,
    message,
    metadata: metadata || {},
  }
}
