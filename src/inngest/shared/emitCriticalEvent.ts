type EmitCriticalEventInput = {
  eventName: string
  payload: Record<string, unknown>
  origin?: string
  originId?: number | string | null
}

type EmitCriticalEventResult = {
  sent: boolean
  outboxId: number | null
  status: 'disabled'
}

export async function emitCriticalEvent(_input: EmitCriticalEventInput): Promise<EmitCriticalEventResult> {
  return {
    sent: false,
    outboxId: null,
    status: 'disabled',
  }
}
