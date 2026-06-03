export type CloudLogLevel = 'debug' | 'info' | 'warn' | 'error'

export function logCloudEvent(level: CloudLogLevel, message: string, metadata?: Record<string, unknown>) {
  const entry = {
    severity: level.toUpperCase(),
    level,
    message,
    metadata: metadata || {},
    timestamp: new Date().toISOString(),
  }

  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)

  return entry
}
