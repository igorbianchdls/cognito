import { getSecretName } from '@/products/integracoes/datawarehouse/config/gcpConfig'
import { authorizedJsonRequest } from '@/products/integracoes/cloud/src/lib/googleAuth'

type SecretAccessResponse = {
  payload?: {
    data?: string
  }
}

function encodeBase64(value: string) {
  return Buffer.from(value, 'utf8').toString('base64')
}

function decodeBase64(value: string) {
  return Buffer.from(value, 'base64').toString('utf8')
}

function normalizeSecretVersionRef(secretRef: string) {
  const ref = secretRef.trim()
  if (!ref) throw new Error('secretRef vazio')
  if (ref.includes('/versions/')) return ref
  return `${ref.replace(/\/+$/, '')}/versions/latest`
}

async function ensureSecret(secretName: string) {
  const segments = secretName.split('/secrets/')
  const parent = segments[0]
  const secretId = segments[1]
  if (!parent || !secretId) throw new Error(`Secret name invalido: ${secretName}`)

  const existing = await authorizedJsonRequest<unknown>(
    `https://secretmanager.googleapis.com/v1/${secretName}`,
    { method: 'GET', allowNotFound: true },
  )
  if (existing.ok) return

  await authorizedJsonRequest<unknown>(
    `https://secretmanager.googleapis.com/v1/${parent}/secrets?secretId=${encodeURIComponent(secretId)}`,
    {
      method: 'POST',
      body: JSON.stringify({
        replication: {
          automatic: {},
        },
      }),
    },
  )
}

export async function readSecret(secretRef: string): Promise<string | null> {
  const response = await authorizedJsonRequest<SecretAccessResponse>(
    `https://secretmanager.googleapis.com/v1/${normalizeSecretVersionRef(secretRef)}:access`,
    { method: 'GET', allowNotFound: true },
  )

  const encoded = response.payload?.payload?.data
  return encoded ? decodeBase64(encoded) : null
}

export async function writeSecret(name: string, value: string): Promise<{ secretRef: string; mode: 'secret_manager' }> {
  const secretName = name.startsWith('projects/') ? name : getSecretName([name])
  await ensureSecret(secretName)
  await authorizedJsonRequest<unknown>(
    `https://secretmanager.googleapis.com/v1/${secretName}:addVersion`,
    {
      method: 'POST',
      body: JSON.stringify({
        payload: {
          data: encodeBase64(value),
        },
      }),
    },
  )

  return {
    secretRef: secretName,
    mode: 'secret_manager',
  }
}

export async function writeConnectionCredentialsSecret(input: {
  tenantId: number
  connectionId: string
  value: string
}): Promise<{ secretRef: string; mode: 'secret_manager' }> {
  return writeSecret(`${input.tenantId}-${input.connectionId}-credentials`, input.value)
}
