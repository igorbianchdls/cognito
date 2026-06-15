import { authorizedJsonRequest } from '@/products/integracoes/cloud/src/lib/googleAuth'
import { getIntegrationsCloudConfig } from '@/products/integracoes/datawarehouse/config/gcpConfig'
import { getCloudConnector } from '@/products/integracoes/connectors/registry/providerRegistry'
import type { IntegrationProvider } from '@/products/integracoes/shared/providers/providerTypes'

export type ProviderReadinessStatus = 'ready' | 'partial' | 'blocked' | 'manual' | 'unknown'

export type ProviderReadinessCheckStatus = 'present' | 'missing' | 'unknown'

export type ProviderReadinessCheck = {
  key: string
  label: string
  required: boolean
  status: ProviderReadinessCheckStatus
  source: 'env' | 'secret_manager' | 'manual_override' | 'not_applicable' | 'not_checked'
  detail?: string
}

export type ProviderReadinessRow = {
  providerSlug: string
  providerName: string
  domain: string
  authType: string
  status: ProviderReadinessStatus
  connectorRegistered: boolean
  supportsOAuthCallback: boolean
  checks: ProviderReadinessCheck[]
  missingRequired: string[]
  missingOptional: string[]
  unknownChecks: string[]
}

export type ProviderReadinessSummary = {
  totalProviders: number
  readyProviders: number
  partialProviders: number
  blockedProviders: number
  manualProviders: number
  unknownProviders: number
  connectorRegisteredProviders: number
  secretManagerChecked: boolean
  generatedAt: string
}

export type ProviderReadinessSnapshot = {
  summary: ProviderReadinessSummary
  rows: ProviderReadinessRow[]
  generatedAt: string
}

type SecretVersionResponse = {
  state?: string
}

type OAuthCheckDefinition = {
  key: string
  label: string
  envSuffix: string
  secretSuffix?: string
  required: boolean
}

const OAUTH_CHECKS: OAuthCheckDefinition[] = [
  { key: 'clientId', label: 'Client ID', envSuffix: 'CLIENT_ID', secretSuffix: 'client-id', required: true },
  { key: 'clientSecret', label: 'Client secret', envSuffix: 'CLIENT_SECRET', secretSuffix: 'client-secret', required: true },
  { key: 'authorizeUrl', label: 'Authorize URL', envSuffix: 'AUTHORIZE_URL', secretSuffix: 'authorize-url', required: true },
  { key: 'tokenUrl', label: 'Token URL', envSuffix: 'TOKEN_URL', secretSuffix: 'token-url', required: true },
  { key: 'redirectUri', label: 'Redirect URI', envSuffix: 'REDIRECT_URI', required: true },
  { key: 'scopes', label: 'Scopes', envSuffix: 'SCOPES', secretSuffix: 'scopes', required: false },
  { key: 'tokenAuthMethod', label: 'Token auth method', envSuffix: 'TOKEN_AUTH_METHOD', secretSuffix: 'token-auth-method', required: false },
]

const MANUALLY_VERIFIED_OAUTH_PROVIDERS = new Set([
  'conta_azul',
])

function envName(provider: string, suffix: string) {
  return `INTEGRATIONS_OAUTH_${provider.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_${suffix}`
}

function normalizeProviderForSecret(provider: string) {
  return provider.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function providerSecretName(provider: string, suffix: string) {
  const config = getIntegrationsCloudConfig()
  const providerPart = normalizeProviderForSecret(provider)
  return `projects/${config.projectId}/secrets/${config.secrets.prefix}-oauth-${providerPart}-${suffix}`
}

function canCheckSecretManager() {
  return Boolean(
    process.env.GOOGLE_OAUTH_ACCESS_TOKEN?.trim()
    || process.env.K_SERVICE?.trim()
    || process.env.GAE_SERVICE?.trim()
    || process.env.FUNCTION_TARGET?.trim(),
  )
}

function envValueForCheck(provider: string, check: OAuthCheckDefinition) {
  const providerEnv = process.env[envName(provider, check.envSuffix)]?.trim()
  if (providerEnv) return providerEnv

  if (check.key === 'redirectUri') {
    return process.env.INTEGRATIONS_OAUTH_REDIRECT_URI?.trim() || ''
  }

  return ''
}

async function checkSecret(provider: string, check: OAuthCheckDefinition): Promise<ProviderReadinessCheck> {
  if (!check.secretSuffix) {
    return {
      key: check.key,
      label: check.label,
      required: check.required,
      status: 'missing',
      source: 'not_applicable',
      detail: 'Sem secret associado.',
    }
  }

  const secretName = providerSecretName(provider, check.secretSuffix)
  const response = await authorizedJsonRequest<SecretVersionResponse>(
    `https://secretmanager.googleapis.com/v1/${secretName}/versions/latest`,
    { method: 'GET', allowNotFound: true, timeoutMs: 5000, retry: { attempts: 1 } },
  )

  if (!response.ok) {
    return {
      key: check.key,
      label: check.label,
      required: check.required,
      status: 'missing',
      source: 'secret_manager',
      detail: check.secretSuffix,
    }
  }

  const enabled = response.payload?.state === 'ENABLED'
  return {
    key: check.key,
    label: check.label,
    required: check.required,
    status: enabled ? 'present' : 'missing',
    source: 'secret_manager',
    detail: enabled ? check.secretSuffix : `latest ${response.payload?.state || 'sem estado'}`,
  }
}

async function buildOAuthChecks(provider: IntegrationProvider, secretManagerEnabled: boolean): Promise<ProviderReadinessCheck[]> {
  if (MANUALLY_VERIFIED_OAUTH_PROVIDERS.has(provider.slug)) {
    return OAUTH_CHECKS.map((check) => ({
      key: check.key,
      label: check.label,
      required: check.required,
      status: 'present',
      source: 'manual_override',
      detail: 'Verificado manualmente.',
    }))
  }

  return Promise.all(OAUTH_CHECKS.map(async (check) => {
    if (envValueForCheck(provider.slug, check)) {
      return {
        key: check.key,
        label: check.label,
        required: check.required,
        status: 'present',
        source: 'env',
      } satisfies ProviderReadinessCheck
    }

    if (!secretManagerEnabled) {
      return {
        key: check.key,
        label: check.label,
        required: check.required,
        status: 'unknown',
        source: 'not_checked',
        detail: check.key === 'redirectUri' ? 'Env global nao encontrado.' : 'Secret Manager nao verificado neste runtime.',
      } satisfies ProviderReadinessCheck
    }

    try {
      return await checkSecret(provider.slug, check)
    } catch (error) {
      return {
        key: check.key,
        label: check.label,
        required: check.required,
        status: 'unknown',
        source: 'not_checked',
        detail: error instanceof Error ? error.message : 'Falha ao consultar Secret Manager.',
      } satisfies ProviderReadinessCheck
    }
  }))
}

function chooseStatus(input: {
  provider: IntegrationProvider
  connectorRegistered: boolean
  missingRequired: string[]
  missingOptional: string[]
  unknownChecks: string[]
}): ProviderReadinessStatus {
  if (input.provider.authType !== 'oauth2') {
    return input.connectorRegistered ? 'manual' : 'blocked'
  }

  if (!input.provider.supportsOAuthCallback || !input.connectorRegistered || input.missingRequired.length > 0) {
    return 'blocked'
  }

  if (input.unknownChecks.length > 0) return 'unknown'
  if (input.missingOptional.length > 0) return 'partial'
  return 'ready'
}

export async function buildProviderReadinessSnapshot(providers: IntegrationProvider[]): Promise<ProviderReadinessSnapshot> {
  const secretManagerChecked = canCheckSecretManager()
  const rows = await Promise.all(providers.map(async (provider) => {
    const connectorRegistered = Boolean(getCloudConnector(provider.slug))
    const supportsOAuthCallback = provider.supportsOAuthCallback
    const checks = provider.authType === 'oauth2'
      ? await buildOAuthChecks(provider, secretManagerChecked)
      : [{
          key: 'tenantCredential',
          label: 'Credencial do tenant',
          required: true,
          status: connectorRegistered ? 'present' : 'missing',
          source: 'not_applicable',
          detail: provider.authType,
        } satisfies ProviderReadinessCheck]

    const missingRequired = checks
      .filter((check) => check.required && check.status === 'missing')
      .map((check) => check.label)
    const missingOptional = checks
      .filter((check) => !check.required && check.status === 'missing')
      .map((check) => check.label)
    const unknownChecks = checks
      .filter((check) => check.status === 'unknown')
      .map((check) => check.label)
    const status = chooseStatus({
      provider,
      connectorRegistered,
      missingRequired,
      missingOptional,
      unknownChecks,
    })

    return {
      providerSlug: provider.slug,
      providerName: provider.name,
      domain: provider.domain,
      authType: provider.authType,
      status,
      connectorRegistered,
      supportsOAuthCallback,
      checks,
      missingRequired,
      missingOptional,
      unknownChecks,
    }
  }))

  const summary: ProviderReadinessSummary = {
    totalProviders: rows.length,
    readyProviders: rows.filter((row) => row.status === 'ready').length,
    partialProviders: rows.filter((row) => row.status === 'partial').length,
    blockedProviders: rows.filter((row) => row.status === 'blocked').length,
    manualProviders: rows.filter((row) => row.status === 'manual').length,
    unknownProviders: rows.filter((row) => row.status === 'unknown').length,
    connectorRegisteredProviders: rows.filter((row) => row.connectorRegistered).length,
    secretManagerChecked,
    generatedAt: new Date().toISOString(),
  }

  return {
    summary,
    rows,
    generatedAt: summary.generatedAt,
  }
}
