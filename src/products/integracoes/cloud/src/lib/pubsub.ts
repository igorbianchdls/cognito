import { getIntegrationsCloudConfig } from '@/products/integracoes/cloud/src/config/gcpConfig'
import { getCloudAccessToken } from '@/products/integracoes/cloud/src/lib/googleAuth'
import type { IntegrationSyncTrigger } from '@/products/integracoes/shared/contracts/syncContracts'

export type PublishSyncMessageInput = {
  connectionId: string
  tenantId: number
  runId?: string
  trigger: IntegrationSyncTrigger
  resources?: string[]
  requestedBy?: string
}

export type PublishSyncMessageOutput = {
  ok: boolean
  messageId: string
  mode: 'pubsub'
  topic: string
}

type PubSubPublishResponse = {
  messageIds?: string[]
}

export async function publishSyncMessage(input: PublishSyncMessageInput): Promise<PublishSyncMessageOutput> {
  const config = getIntegrationsCloudConfig()
  const accessToken = await getCloudAccessToken()
  const topic = `projects/${config.projectId}/topics/${config.pubSub.syncTopic}`
  const data = Buffer.from(JSON.stringify({
    type: 'integration.sync.requested',
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    runId: input.runId,
    trigger: input.trigger,
    resources: input.resources || [],
    requestedBy: input.requestedBy || 'control-api',
    requestedAt: new Date().toISOString(),
  })).toString('base64')

  const response = await fetch(`https://pubsub.googleapis.com/v1/${topic}:publish`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{
        data,
        attributes: {
          tenantId: String(input.tenantId),
          connectionId: input.connectionId,
          ...(input.runId ? { runId: input.runId } : {}),
          trigger: input.trigger,
        },
      }],
    }),
  })

  const payload = await response.json().catch(() => ({})) as PubSubPublishResponse & { error?: { message?: string } }
  if (!response.ok) {
    throw new Error(payload.error?.message || `Falha ao publicar no Pub/Sub: ${response.status}`)
  }

  const messageId = payload.messageIds?.[0]
  if (!messageId) {
    throw new Error('Pub/Sub nao retornou messageId')
  }

  return {
    ok: true,
    messageId,
    mode: 'pubsub',
    topic: config.pubSub.syncTopic,
  }
}
