import assert from 'node:assert/strict'
import { generateKeyPairSync, randomUUID, sign } from 'node:crypto'
import { verifyToken } from '@clerk/nextjs/server'
import { verifyClerkOAuthToken, type OAuthVerificationDependencies } from '../src/products/chatgptplugin/auth/resolvePrincipal'
import { handlePluginRequest, type HttpDependencies } from '../src/products/chatgptplugin/mcp/handleRequest'
import { PluginError, type PluginPrincipal } from '../src/products/chatgptplugin/shared/contracts'
import type { PluginConfig } from '../src/products/chatgptplugin/shared/config'

// Chaves temporarias e SDK Clerk real; sem .env, rede, banco ou credenciais reais.
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 })
const otherKeys = generateKeyPairSync('rsa', { modulusLength: 2048 })
const publicKey = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString()
const kid = randomUUID()
const config: PluginConfig = {
  resource: 'https://erp.example/api/mcp', issuer: 'https://test.clerk.accounts.dev',
  metadataUrl: 'https://erp.example/.well-known/oauth-protected-resource/api/mcp',
  scope: 'erp:read', clientIds: ['client_test'], origins: ['https://erp.example'],
  toolTimeoutMs: 100, requestsPerMinute: 60,
}
const now = Math.floor(Date.now() / 1000)
const payload = { iss: config.issuer, aud: config.resource, sub: 'user_1', client_id: 'client_test',
  scp: ['erp:read'], exp: now + 3600, iat: now - 10, nbf: now - 10, jti: randomUUID() }
const introspected = { subject: payload.sub, clientId: payload.client_id, scopes: payload.scp,
  revoked: false, expired: false, expiration: payload.exp }
let signatures = 0, introspections = 0, checks = 0
function jwt(overrides: Record<string, unknown> = {}, header: Record<string, unknown> = {}, privateKey = keys.privateKey) {
  const encodedHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'at+jwt', kid, ...header })).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify({ ...payload, ...overrides })).toString('base64url')
  const input = `${encodedHeader}.${encodedPayload}`
  return `${input}.${sign('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url')}`
}
const dependencies: OAuthVerificationDependencies = {
  verifyJwt: async (token, options) => {
    signatures++
    assert.equal(options.audience, config.resource)
    assert.deepEqual(options.headerType, ['at+jwt', 'application/at+jwt'])
    // Substitui somente a origem da chave publica. As validacoes sao as do SDK real.
    return verifyToken(token, { ...options, secretKey: undefined, jwtKey: publicKey })
  },
  introspect: async () => { introspections++; return { ...introspected } },
}
async function check(name: string, fn: () => unknown) { await fn(); checks++; console.log(`Passed: ${name}`) }
const errorWith = (status: number, code = status === 403 ? 'INSUFFICIENT_SCOPE' : 'UNAUTHENTICATED') =>
  (error: unknown) => error instanceof PluginError && error.status === status && error.code === code
async function rejected(token: string, status = 401, deps = dependencies, code?: string) {
  await assert.rejects(verifyClerkOAuthToken(token, config, deps), errorWith(status, code))
}
async function main() {
  await check('JWT assinado com destino e emissor corretos', async () => {
    const result = await verifyClerkOAuthToken(jwt(), config, dependencies)
    assert.equal(result.subject, payload.sub); assert.equal(result.audience, config.resource)
    assert.equal(introspections, 1)
  })
  await check('Audiencia em lista e tipo application/at+jwt', async () => {
    await verifyClerkOAuthToken(jwt({ aud: ['https://other.example/api/mcp', config.resource] }, { typ: 'application/at+jwt' }), config, dependencies)
  })
  for (const [name, overrides] of Object.entries({
    'Audiencia ausente': { aud: undefined }, 'Audiencia nula': { aud: null },
    'Audiencia vazia': { aud: [] }, 'Audiencia malformada': { aud: [config.resource, 7] },
    'Destino de outra API': { aud: 'https://other.example/api/mcp' },
    'Lista sem o MCP': { aud: ['client_test', 'https://other.example/api/mcp'] },
    'Client ID nao e o destino MCP': { aud: payload.client_id },
    'Origem sem caminho nao e o MCP': { aud: 'https://erp.example' },
    'Barra adicional nao e o destino canonico': { aud: config.resource + '/' },
    'Emissor diferente': { iss: 'https://another.clerk.accounts.dev' }, 'Emissor ausente': { iss: undefined },
    'Token expirado': { exp: now - 30 }, 'Expiracao ausente': { exp: undefined },
    'Token ainda nao ativo': { nbf: now + 3600 }, 'Emissao no futuro': { iat: now + 3600 },
    'Cliente nao autorizado': { client_id: 'another' }, 'Subject de organizacao': { sub: 'org_1' },
  })) {
    await check(name, async () => {
      const before = introspections
      await rejected(jwt(overrides)); assert.equal(introspections, before)
    })
  }
  await check('Assinatura de outra chave', () => rejected(jwt({}, {}, otherKeys.privateKey)))
  await check('Payload adulterado conserva assinatura invalida', async () => {
    const parts = jwt({ aud: 'https://other.example/api/mcp' }).split('.')
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url')
    await rejected(parts.join('.'))
  })
  await check('ID token e token de sessao nao substituem OAuth access token', async () => {
    for (const typ of ['JWT', undefined, 'm2m+jwt']) await rejected(jwt({}, { typ }))
  })
  await check('Algoritmo sem assinatura rejeitado', () => rejected(jwt({}, { alg: 'none' })))
  await check('Token opaco sem audiencia comprovada rejeitado', async () => {
    const before = signatures
    await rejected('oat_local_test'); assert.equal(signatures, before)
  })
  await check('Scope ausente retorna 403 antes da introspeccao', async () => {
    const before = introspections
    await rejected(jwt({ scp: [] }), 403); assert.equal(introspections, before)
  })
  await check('Scope string permitido e comparado com Clerk', async () => {
    await verifyClerkOAuthToken(jwt({ scp: undefined, scope: 'erp:read' }), config, dependencies)
  })
  for (const [name, overrides] of Object.entries({
    'Revogado pelo Clerk': { revoked: true }, 'Expirado pelo Clerk': { expired: true },
    'Expiracao da introspeccao vencida': { expiration: now - 30 },
    'Usuario divergente entre JWT e Clerk': { subject: 'user_2' },
    'Scopes divergentes entre JWT e Clerk': { scopes: ['erp:read', 'erp:write'] },
  })) {
    await check(name, () => rejected(jwt(), 401, { ...dependencies, introspect: async () => ({ ...introspected, ...overrides }) }))
  }
  await check('Cliente permitido mas divergente entre JWT e Clerk', async () => {
    await assert.rejects(verifyClerkOAuthToken(jwt(), { ...config, clientIds: ['client_test', 'client_other'] }, {
      ...dependencies, introspect: async () => ({ ...introspected, clientId: 'client_other' }),
    }), errorWith(401))
  })
  await check('Falha de JWKS retorna 503 e nao usa introspeccao como alternativa', async () => {
    const before = introspections
    await rejected(jwt(), 503, { ...dependencies, verifyJwt: async () => { throw { reason: 'jwk-remote-failed-to-load' } } }, 'AUTH_UNAVAILABLE')
    assert.equal(introspections, before)
  })
  await check('Introspeccao indisponivel retorna 503; token recusado retorna 401', async () => {
    for (const status of [400, 401, 404, 429, 500]) {
      await rejected(jwt(), status < 429 ? 401 : 503, {
        ...dependencies, introspect: async () => { throw { status } },
      }, status < 429 ? 'UNAUTHENTICATED' : 'AUTH_UNAVAILABLE')
    }
  })
  await check('HTTP 401 anuncia reconexao e nao acessa ERP, auditoria ou limites', async () => {
    let effects = 0
    const unexpectedQuery = async (): Promise<never> => { effects++; throw new Error('Consulta indevida durante rejeicao OAuth') }
    const http: HttpDependencies = {
      config: () => config, limit: async () => { effects++ },
      resolve: async request => {
        const token = await verifyClerkOAuthToken(request.headers.get('authorization')!.slice(7), config, dependencies)
        effects++
        return { userId: 1, clerkUserId: token.subject, clientId: token.clientId, scopes: token.scopes, companies: [] } as PluginPrincipal
      },
      execution: {
        queries: { customer: unexpectedQuery, fiscal: unexpectedQuery, financialAccounts: unexpectedQuery,
          payments: unexpectedQuery, overview: unexpectedQuery, page: unexpectedQuery, sale: unexpectedQuery,
          stock: unexpectedQuery, purchase: unexpectedQuery, report: unexpectedQuery },
        reserve: async () => { effects++; return randomUUID() }, finish: async () => { effects++ },
      },
    }
    for (const token of [jwt({ aud: undefined }), jwt({ aud: 'https://other.example/api/mcp' })]) {
      const response = await handlePluginRequest(new Request(config.resource, { method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'meu_acesso', arguments: {} } }),
      }), http)
      assert.equal(response.status, 401)
      assert(response.headers.get('www-authenticate')?.includes('error="invalid_token"'))
      assert(response.headers.get('www-authenticate')?.includes(config.metadataUrl))
    }
    assert.equal(effects, 0)
  })
  console.log(JSON.stringify({ passed: checks, signedTokens: true, externalOAuthVerified: false }))
}
void main().catch(error => { console.error(error); process.exitCode = 1 })
