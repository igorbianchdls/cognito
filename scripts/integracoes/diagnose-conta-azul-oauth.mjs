#!/usr/bin/env node

import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { Client } from 'pg'

const ENV_FILES = [
  '.env.local',
  '.env',
  '.env.development.local',
  '.env.development',
  '.env.production.local',
  '.env.production',
  '.next/cache/plugin-cli/vercel-production.env',
]

function getArg(name) {
  const index = process.argv.indexOf(name)
  return index === -1 ? null : process.argv[index + 1] ?? null
}

function hasFlag(name) {
  return process.argv.includes(name)
}

function usage() {
  return [
    'Uso:',
    '  node scripts/integracoes/diagnose-conta-azul-oauth.mjs --tenant <id> --connection <id>',
    '',
    'Opcoes:',
    '  --tenant <id>          Tenant da conexao.',
    '  --connection <id>      ID da conexao Conta Azul.',
    '  --provider <slug>      Provider. Default: conta_azul.',
    '  --refresh-and-save     Executa refresh real e persiste imediatamente o novo token no Secret Manager.',
    '  --skip-refresh         Alias legado; diagnostico ja e read-only por padrao.',
    '  --timeout <ms>         Timeout HTTP. Default: 30000.',
    '  --help                 Mostra esta ajuda.',
  ].join('\n')
}

function loadEnvFiles() {
  const loaded = []
  for (const file of ENV_FILES) {
    const filePath = path.join(process.cwd(), file)
    if (!fs.existsSync(filePath)) continue
    dotenv.config({ path: filePath, override: false, quiet: true })
    loaded.push(file)
  }
  return loaded
}

function requiredPositiveInt(name) {
  const value = getArg(name)
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`)
  }
  return parsed
}

function optionalPositiveInt(name, fallback) {
  const value = getArg(name)
  if (value == null || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`)
  }
  return parsed
}

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parseJsonRecord(value, label) {
  const parsed = JSON.parse(value)
  if (!isRecord(parsed)) throw new Error(`${label} nao e objeto JSON.`)
  return parsed
}

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function maskSecret(value) {
  const normalized = text(value)
  if (!normalized) return null
  if (normalized.length <= 10) return `${normalized.slice(0, 2)}…${normalized.slice(-2)} (${normalized.length})`
  return `${normalized.slice(0, 6)}…${normalized.slice(-4)} (${normalized.length})`
}

const gcpAuthDiagnostics = {
  source: null,
  attempts: [],
}
let cachedGcpAccessTokenPromise = null

function recordGcpAttempt(source, ok, error = null) {
  gcpAuthDiagnostics.attempts.push({
    source,
    ok,
    error: error ? String(error) : null,
  })
  if (ok && !gcpAuthDiagnostics.source) gcpAuthDiagnostics.source = source
}

function tokenInfo(credentials, keyA, keyB) {
  const value = text(credentials[keyA]) || text(credentials[keyB])
  return {
    present: Boolean(value),
    length: value ? value.length : 0,
    masked: maskSecret(value),
  }
}

function expiresInfo(credentials) {
  const expiresAt = text(credentials.expiresAt) || text(credentials.expires_at)
  const parsed = expiresAt ? Date.parse(expiresAt) : NaN
  const valid = Number.isFinite(parsed)
  const msUntilExpiry = valid ? parsed - Date.now() : null
  return {
    expiresAt: expiresAt || null,
    valid,
    expired: valid ? msUntilExpiry <= 0 : null,
    msUntilExpiry,
    minutesUntilExpiry: typeof msUntilExpiry === 'number' ? Math.round(msUntilExpiry / 60000) : null,
  }
}

function parseServiceAccountCredentials(value) {
  const normalized = text(value)
  if (!normalized) return null
  const candidates = [
    normalized,
    normalized.replace(
      /("private_key"\s*:\s*")([\s\S]*?)("\s*,\s*"client_email")/,
      (_match, prefix, privateKey, suffix) => `${prefix}${privateKey.replace(/\r?\n/g, '\\n')}${suffix}`,
    ),
  ]
  try {
    candidates.push(Buffer.from(normalized, 'base64').toString('utf8'))
  } catch {
    // ignore
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (isRecord(parsed)) return parsed
    } catch {
      // try next
    }
  }
  return null
}

function tryRun(command, args) {
  try {
    return execFileSync(command, args, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15000,
    }).trim()
  } catch {
    return ''
  }
}

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

async function getServiceAccountAccessToken() {
  const raw = process.env.BIGQUERY_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || ''
  const inline = parseServiceAccountCredentials(raw)
  const filePath = text(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  const fromFile = !inline && filePath && fs.existsSync(filePath)
    ? parseServiceAccountCredentials(fs.readFileSync(filePath, 'utf8'))
    : null
  const credentials = inline || fromFile
  if (!credentials?.client_email || !credentials?.private_key) return null

  const tokenUri = text(credentials.token_uri) || 'https://oauth2.googleapis.com/token'
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  }))
  const unsigned = `${header}.${payload}`
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(credentials.private_key)
  const assertion = `${unsigned}.${base64Url(signature)}`
  const body = new URLSearchParams()
  body.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer')
  body.set('assertion', assertion)

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15000),
  })
  const payloadJson = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payloadJson?.error_description || payloadJson?.error || `Falha ao obter token GCP: ${response.status}`)
  }
  return payloadJson?.access_token || null
}

async function getGcpAccessToken() {
  if (cachedGcpAccessTokenPromise) return cachedGcpAccessTokenPromise
  cachedGcpAccessTokenPromise = resolveGcpAccessToken()
  return cachedGcpAccessTokenPromise
}

async function resolveGcpAccessToken() {
  const explicit = text(process.env.GOOGLE_OAUTH_ACCESS_TOKEN)
  if (explicit) {
    recordGcpAttempt('GOOGLE_OAUTH_ACCESS_TOKEN', true)
    return explicit
  }

  try {
    const serviceAccountToken = await getServiceAccountAccessToken()
    if (serviceAccountToken) {
      recordGcpAttempt('service_account_env_or_file', true)
      return serviceAccountToken
    }
    recordGcpAttempt('service_account_env_or_file', false, 'credencial ausente')
  } catch (error) {
    recordGcpAttempt('service_account_env_or_file', false, error instanceof Error ? error.message : String(error))
  }

  const linuxToken = tryRun('gcloud', ['auth', 'print-access-token'])
  if (linuxToken) {
    recordGcpAttempt('gcloud', true)
    return linuxToken
  }

  const windowsToken = tryRun('cmd.exe', ['/c', 'gcloud', 'auth', 'print-access-token'])
  if (windowsToken) {
    recordGcpAttempt('gcloud_windows', true)
    return windowsToken
  }

  recordGcpAttempt('gcloud', false, 'gcloud auth print-access-token nao retornou token')
  throw new Error('Credencial GCP ausente. Defina BIGQUERY_CREDENTIALS_JSON, GOOGLE_APPLICATION_CREDENTIALS_JSON, GOOGLE_APPLICATION_CREDENTIALS ou GOOGLE_OAUTH_ACCESS_TOKEN.')
}

async function gcpJson(url, init = {}) {
  const token = await getGcpAccessToken()
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal: init.signal || AbortSignal.timeout(init.timeoutMs || 30000),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok && !(init.allowNotFound && response.status === 404)) {
    throw new Error(payload?.error?.message || `Falha GCP ${response.status}`)
  }
  return { ok: response.ok, status: response.status, payload }
}

function normalizeSecretVersionRef(secretRef) {
  const ref = text(secretRef)
  if (!ref) throw new Error('secret_ref vazio.')
  return ref.includes('/versions/') ? ref : `${ref.replace(/\/+$/, '')}/versions/latest`
}

async function readSecret(secretRef) {
  const response = await gcpJson(
    `https://secretmanager.googleapis.com/v1/${normalizeSecretVersionRef(secretRef)}:access`,
    { method: 'GET' },
  )
  const encoded = response.payload?.payload?.data
  return encoded ? Buffer.from(encoded, 'base64').toString('utf8') : ''
}

function normalizeSecretNameRef(secretRef) {
  return text(secretRef).replace(/\/versions\/[^/]+$/, '').replace(/\/+$/, '')
}

async function addSecretVersion(secretRef, value) {
  const response = await gcpJson(
    `https://secretmanager.googleapis.com/v1/${normalizeSecretNameRef(secretRef)}:addVersion`,
    {
      method: 'POST',
      body: JSON.stringify({
        payload: {
          data: Buffer.from(value, 'utf8').toString('base64'),
        },
      }),
    },
  )
  return response.payload?.name || `${normalizeSecretNameRef(secretRef)}/versions/latest`
}

function getCloudConfig() {
  return {
    projectId: text(process.env.GCP_PROJECT_ID) || 'creatto-463117',
    secretPrefix: text(process.env.SECRET_PREFIX) || 'integrations',
  }
}

function envName(provider, suffix) {
  return `INTEGRATIONS_OAUTH_${provider.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_${suffix}`
}

function normalizeProviderForSecret(provider) {
  return provider.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function providerSecretRef(provider, suffix) {
  const config = getCloudConfig()
  return `projects/${config.projectId}/secrets/${config.secretPrefix}-oauth-${normalizeProviderForSecret(provider)}-${suffix}`
}

async function envOrSecret(provider, envSuffix, secretSuffix) {
  const envValue = text(process.env[envName(provider, envSuffix)])
  if (envValue) return { value: envValue, source: 'env' }
  const secret = await readSecret(providerSecretRef(provider, secretSuffix))
  return { value: text(secret), source: 'secret_manager' }
}

function normalizeTokenAuthMethod(provider, value) {
  const normalized = text(value).toLowerCase()
  if (normalized === 'basic' || normalized === 'client_secret_basic') return 'client_secret_basic'
  if (normalized === 'post' || normalized === 'body' || normalized === 'client_secret_post') return 'client_secret_post'
  return normalizeProviderForSecret(provider) === 'conta-azul'
    ? 'client_secret_basic'
    : 'client_secret_post'
}

async function getOAuthConfig(provider) {
  const [
    clientId,
    clientSecret,
    authorizeUrl,
    tokenUrl,
    scopes,
    tokenAuthMethodRaw,
  ] = await Promise.all([
    envOrSecret(provider, 'CLIENT_ID', 'client-id'),
    envOrSecret(provider, 'CLIENT_SECRET', 'client-secret'),
    envOrSecret(provider, 'AUTHORIZE_URL', 'authorize-url'),
    envOrSecret(provider, 'TOKEN_URL', 'token-url'),
    envOrSecret(provider, 'SCOPES', 'scopes'),
    envOrSecret(provider, 'TOKEN_AUTH_METHOD', 'token-auth-method'),
  ])

  const redirectUri = {
    value: text(process.env[envName(provider, 'REDIRECT_URI')]) || text(process.env.INTEGRATIONS_OAUTH_REDIRECT_URI),
    source: process.env[envName(provider, 'REDIRECT_URI')] ? 'env_provider' : process.env.INTEGRATIONS_OAUTH_REDIRECT_URI ? 'env_global' : 'missing',
  }

  return {
    clientId,
    clientSecret,
    authorizeUrl,
    tokenUrl,
    redirectUri,
    scopes,
    tokenAuthMethod: {
      value: normalizeTokenAuthMethod(provider, tokenAuthMethodRaw.value),
      source: tokenAuthMethodRaw.source,
      raw: tokenAuthMethodRaw.value || null,
    },
  }
}

function createBasicAuthHeader(clientId, clientSecret) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')}`
}

async function tokenRequest(input) {
  const body = new URLSearchParams()
  body.set('grant_type', 'refresh_token')
  body.set('refresh_token', input.refreshToken)

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
  if (input.tokenAuthMethod === 'client_secret_basic') {
    headers.Authorization = createBasicAuthHeader(input.clientId, input.clientSecret)
  } else {
    body.set('client_id', input.clientId)
    body.set('client_secret', input.clientSecret)
  }

  const response = await fetch(input.tokenUrl, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(input.timeoutMs),
  })
  const payload = await response.json().catch(async () => {
    const textPayload = await response.text().catch(() => '')
    return textPayload ? { raw: textPayload } : null
  })

  return {
    ok: response.ok,
    status: response.status,
    payload,
  }
}

function mergeRefreshedCredentials(credentials, tokenPayload) {
  if (!tokenPayload?.access_token) throw new Error('OAuth refresh nao retornou access_token.')
  return {
    ...credentials,
    authType: credentials.authType || credentials.auth_type || 'oauth2',
    accessToken: tokenPayload.access_token,
    refreshToken: tokenPayload.refresh_token || text(credentials.refreshToken) || text(credentials.refresh_token),
    expiresAt: tokenPayload.expires_in
      ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000).toISOString()
      : text(credentials.expiresAt) || text(credentials.expires_at) || null,
    tokenType: tokenPayload.token_type || credentials.tokenType || credentials.token_type || null,
    scope: tokenPayload.scope || credentials.scope || null,
  }
}

async function persistRefreshedCredentials(client, input) {
  const secretRef = await addSecretVersion(input.secretRef, JSON.stringify(input.credentials))
  await client.query(
    `UPDATE integrations.connections
     SET secret_ref = $3,
         status = 'connected',
         metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
         updated_at = now()
     WHERE tenant_id = $1 AND id = $2`,
    [
      input.tenantId,
      String(input.connectionId),
      secretRef,
      JSON.stringify({
        oauthRefreshedAt: new Date().toISOString(),
        oauthRefreshError: null,
        oauthRefreshFailedAt: null,
        lastAuthErrorSource: null,
        lastAuthErrorCode: null,
        lastAuthErrorMessage: null,
        tokenExpiresAt: input.credentials.expiresAt || null,
      }),
    ],
  )
  await client.query(
    `INSERT INTO integrations.events
      (tenant_id, connection_id, event_type, severity, actor, message, metadata)
     VALUES
      ($1, $2, 'connection.oauth.refreshed', 'info', 'diagnostics', $3, $4::jsonb)`,
    [
      input.tenantId,
      String(input.connectionId),
      'Token OAuth renovado e persistido pelo diagnostico seguro.',
      JSON.stringify({
        provider: input.provider,
        tokenExpiresAt: input.credentials.expiresAt || null,
        persisted: true,
        diagnostic: true,
      }),
    ],
  )
  return secretRef
}

function summarizeProviderPayload(payload) {
  if (Array.isArray(payload)) return { type: 'array', length: payload.length }
  if (!isRecord(payload)) return { type: typeof payload }
  const keys = Object.keys(payload)
  return {
    type: 'object',
    keys: keys.slice(0, 12),
    itemCounts: Object.fromEntries(keys
      .filter((key) => Array.isArray(payload[key]))
      .slice(0, 6)
      .map((key) => [key, payload[key].length])),
  }
}

async function testAccessToken(credentials, timeoutMs) {
  const accessToken = text(credentials.accessToken) || text(credentials.access_token)
  if (!accessToken) {
    return { skipped: true, reason: 'access token ausente' }
  }

  const url = new URL('https://api-v2.contaazul.com/v1/pessoas')
  url.searchParams.set('pagina', '1')
  url.searchParams.set('tamanho_pagina', '10')
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(timeoutMs),
  })
  const payload = await response.json().catch(async () => {
    const raw = await response.text().catch(() => '')
    return raw ? { raw } : null
  })
  return {
    ok: response.ok,
    status: response.status,
    payloadSummary: summarizeProviderPayload(payload),
    error: response.ok ? null : payload,
  }
}

async function fetchConnection(client, tenantId, connectionId, provider) {
  const result = await client.query(
    `SELECT id, tenant_id, domain, provider, display_name, status, selected_resources, secret_ref, metadata, updated_at
     FROM integrations.connections
     WHERE tenant_id = $1 AND id = $2 AND provider = $3
     LIMIT 1`,
    [tenantId, String(connectionId), provider],
  )
  return result.rows[0] || null
}

function redactOAuthConfig(config) {
  return {
    clientId: {
      present: Boolean(config.clientId.value),
      source: config.clientId.source,
      masked: maskSecret(config.clientId.value),
    },
    clientSecret: {
      present: Boolean(config.clientSecret.value),
      source: config.clientSecret.source,
      masked: maskSecret(config.clientSecret.value),
    },
    authorizeUrl: {
      present: Boolean(config.authorizeUrl.value),
      source: config.authorizeUrl.source,
      value: config.authorizeUrl.value || null,
    },
    tokenUrl: {
      present: Boolean(config.tokenUrl.value),
      source: config.tokenUrl.source,
      value: config.tokenUrl.value || null,
    },
    redirectUri: {
      present: Boolean(config.redirectUri.value),
      source: config.redirectUri.source,
      value: config.redirectUri.value || null,
    },
    scopes: {
      present: Boolean(config.scopes.value),
      source: config.scopes.source,
      value: config.scopes.value || null,
    },
    tokenAuthMethod: config.tokenAuthMethod,
  }
}

async function main() {
  if (hasFlag('--help')) {
    console.log(usage())
    return 0
  }

  const loadedEnv = loadEnvFiles()
  const tenantId = requiredPositiveInt('--tenant')
  const connectionId = requiredPositiveInt('--connection')
  const provider = text(getArg('--provider')) || 'conta_azul'
  const timeoutMs = optionalPositiveInt('--timeout', 30000)
  const refreshAndSave = hasFlag('--refresh-and-save')
  if (hasFlag('--refresh')) {
    throw new Error('Refresh sem persistencia e bloqueado. Conta Azul pode rotacionar refresh token; use --refresh-and-save.')
  }
  const dbUrl = text(process.env.SUPABASE_DB_URL) || text(process.env.DATABASE_URL)
  if (!dbUrl) throw new Error('SUPABASE_DB_URL/DATABASE_URL ausente.')

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    const connection = await fetchConnection(client, tenantId, connectionId, provider)
    if (!connection) throw new Error(`Conexao ${provider}/${connectionId} nao encontrada para tenant ${tenantId}.`)

    const oauthConfig = await getOAuthConfig(provider)
    const rawSecret = await readSecret(connection.secret_ref)
    const credentials = parseJsonRecord(rawSecret, 'secret credentials')
    const refreshToken = text(credentials.refreshToken) || text(credentials.refresh_token)
    const accessTokenResult = await testAccessToken(credentials, timeoutMs).catch((error) => ({
      ok: false,
      networkError: error instanceof Error ? error.message : String(error),
      cause: error?.cause?.code || error?.cause?.message || null,
    }))

    let refreshResult = {
      skipped: true,
      reason: refreshAndSave
        ? 'refresh ainda nao executado'
        : 'diagnostico read-only por padrao; use --refresh-and-save para renovar e persistir',
    }
    if (refreshAndSave) {
      if (!refreshToken) {
        refreshResult = { skipped: true, reason: 'refresh token ausente' }
      } else if (!oauthConfig.clientId.value || !oauthConfig.clientSecret.value || !oauthConfig.tokenUrl.value) {
        refreshResult = { skipped: true, reason: 'OAuth config incompleta para refresh' }
      } else {
        refreshResult = await tokenRequest({
          refreshToken,
          clientId: oauthConfig.clientId.value,
          clientSecret: oauthConfig.clientSecret.value,
          tokenUrl: oauthConfig.tokenUrl.value,
          tokenAuthMethod: oauthConfig.tokenAuthMethod.value,
          timeoutMs,
        }).then(async (result) => {
          if (!result.ok) {
            return {
              ok: false,
              status: result.status,
              returnedAccessToken: Boolean(result.payload?.access_token),
              returnedRefreshToken: Boolean(result.payload?.refresh_token),
              returnedExpiresIn: result.payload?.expires_in ?? null,
              persisted: false,
              error: result.payload,
            }
          }
          const merged = mergeRefreshedCredentials(credentials, result.payload)
          const persistedSecretRef = await persistRefreshedCredentials(client, {
            tenantId,
            connectionId,
            provider,
            secretRef: connection.secret_ref,
            credentials: merged,
          })
          return {
            ok: true,
            status: result.status,
            returnedAccessToken: Boolean(result.payload?.access_token),
            returnedRefreshToken: Boolean(result.payload?.refresh_token),
            returnedExpiresIn: result.payload?.expires_in ?? null,
            persisted: true,
            secretRef: `${String(persistedSecretRef).split('/versions/')[0]}/versions/latest`,
            tokenExpiresAt: merged.expiresAt || null,
            error: null,
          }
        }).catch((error) => ({
          ok: false,
          persisted: false,
          networkError: error instanceof Error ? error.message : String(error),
          cause: error?.cause?.code || error?.cause?.message || null,
        }))
      }
    }

    const report = {
      ok: true,
      loadedEnv,
      connection: {
        id: String(connection.id),
        tenantId: connection.tenant_id,
        domain: connection.domain,
        provider: connection.provider,
        displayName: connection.display_name,
        status: connection.status,
        hasSecretRef: Boolean(connection.secret_ref),
        secretRef: connection.secret_ref ? `${String(connection.secret_ref).split('/versions/')[0]}/versions/latest` : null,
        updatedAt: connection.updated_at,
        metadata: {
          tokenStoredAt: connection.metadata?.tokenStoredAt ?? null,
          tokenExpiresAt: connection.metadata?.tokenExpiresAt ?? null,
          oauthRefreshError: connection.metadata?.oauthRefreshError ?? null,
          oauthRefreshFailedAt: connection.metadata?.oauthRefreshFailedAt ?? null,
          dataReadiness: connection.metadata?.dataReadiness ?? null,
          dataReadinessError: connection.metadata?.dataReadinessError ?? null,
        },
      },
      oauthConfig: redactOAuthConfig(oauthConfig),
      gcpAuth: gcpAuthDiagnostics,
      credentials: {
        authType: credentials.authType || credentials.auth_type || null,
        accessToken: tokenInfo(credentials, 'accessToken', 'access_token'),
        refreshToken: tokenInfo(credentials, 'refreshToken', 'refresh_token'),
        tokenType: credentials.tokenType || credentials.token_type || null,
        scope: credentials.scope || null,
        expiry: expiresInfo(credentials),
      },
      tests: {
        accessTokenRead: accessTokenResult,
        refreshToken: refreshResult,
      },
    }

    console.log(JSON.stringify(report, null, 2))
    return 0
  } finally {
    await client.end().catch(() => {})
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      cause: error?.cause?.code || error?.cause?.message || null,
    }, null, 2))
    process.exit(1)
  })
