import { getIntegrationsCloudConfig } from '@/products/integracoes/cloud/src/config/gcpConfig'
import type { IntegrationSyncTrigger } from '@/products/integracoes/shared/contracts/syncContracts'

export type PublishSyncMessageInput = {
  connectionId: string
  tenantId: number
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

type MetadataTokenResponse = {
  access_token?: string
}

type PubSubPublishResponse = {
  messageIds?: string[]
}

async function getCloudRunAccessToken(): Promise<string> {
  const response = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
    headers: {
      'Metadata-Flavor': 'Google',
    },
    signal: AbortSignal.timeout(5000),
  })

  if (!response.ok) {
    throw new Error(`Falha ao obter token da metadata server: ${response.status}`)
  }

  const payload = await response.json() as MetadataTokenResponse
  if (!payload.access_token) {
    throw new Error('Metadata server nao retornou access_token')
  }

  return payload.access_token
}

export async function publishSyncMessage(input: PublishSyncMessageInput): Promise<PublishSyncMessageOutput> {
  const config = getIntegrationsCloudConfig()
  const accessToken = await getCloudRunAccessToken()
  const topic = `projects/${config.projectId}/topics/${config.pubSub.syncTopic}`
  const data = Buffer.from(JSON.stringify({
    type: 'integration.sync.requested',
    tenantId: input.tenantId,
    connectionId: input.connectionId,
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
