export type PublishSyncMessageInput = {
  connectionId: string
  tenantId: number
  resources?: string[]
}

export async function publishSyncMessage(input: PublishSyncMessageInput): Promise<{ ok: boolean; messageId: string; mode: 'stub' }> {
  return {
    ok: true,
    messageId: `stub-${input.tenantId}-${input.connectionId}`,
    mode: 'stub',
  }
}
