export function getCursorValue(cursor: Record<string, unknown> | undefined, key: string): string | null {
  const value = cursor?.[key]
  return value == null ? null : String(value)
}
