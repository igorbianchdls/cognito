export async function updateConnectionStatus(_input: {
  connectionId: string
  tenantId: number
  status: string
  metadata?: Record<string, unknown>
}): Promise<{ ok: boolean; mode: 'stub' }> {
  return { ok: true, mode: 'stub' }
}
