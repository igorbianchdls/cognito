import { BigQuery, type BigQueryOptions } from '@google-cloud/bigquery'

type ServiceAccountCredentials = {
  client_email?: string
  private_key?: string
  project_id?: string
}

function parseCredentialsJson(value: string): ServiceAccountCredentials | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const candidates = [
    trimmed,
    Buffer.from(trimmed, 'base64').toString('utf8'),
  ]

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as ServiceAccountCredentials
      }
    } catch {
      // Try the next format.
    }
  }

  throw new Error('Credenciais BigQuery JSON invalidas.')
}

function getCredentialsFromEnv() {
  const raw = process.env.BIGQUERY_CREDENTIALS_JSON
    || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    || ''
  if (!raw.trim()) return null

  const credentials = parseCredentialsJson(raw)
  if (!credentials?.client_email || !credentials.private_key) {
    throw new Error('Credenciais BigQuery sem client_email/private_key.')
  }

  return credentials
}

export function getBigQueryProjectId(fallback?: string) {
  const credentials = getCredentialsFromEnv()
  return process.env.GCP_PROJECT_ID
    || process.env.GOOGLE_CLOUD_PROJECT
    || process.env.BIGQUERY_PROJECT_ID
    || credentials?.project_id
    || fallback
    || undefined
}

export function createBigQueryClient(input?: { projectId?: string }) {
  const credentials = getCredentialsFromEnv()
  const projectId = input?.projectId || getBigQueryProjectId()
  const options: BigQueryOptions = {
    projectId,
  }

  if (credentials) {
    options.credentials = {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    }
  }

  return new BigQuery(options)
}
