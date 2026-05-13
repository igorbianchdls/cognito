#!/usr/bin/env node

const DEFAULT_CHATGPT_APP_MCP_URL = 'https://cognito-seven.vercel.app/api/chatgpt-app/mcp'

const mcpUrl = (process.env.COGNITO_CHATGPT_APP_MCP_URL || DEFAULT_CHATGPT_APP_MCP_URL).trim()
const baseUrl = new URL(mcpUrl).origin
const token = (process.env.COGNITO_MCP_TOKEN || '').trim()

if (!token) {
  console.error('Missing COGNITO_MCP_TOKEN')
  console.error('Usage: COGNITO_MCP_TOKEN=... pnpm chatgpt-app:smoke')
  process.exit(1)
}

let nextId = 1

async function callMcp(method, params = {}) {
  return callMcpWithToken(token, method, params)
}

async function callMcpWithToken(bearerToken, method, params = {}) {
  const id = nextId++
  const response = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    }),
  })

  const text = await response.text()
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    throw new Error(`Non-JSON response from ${method}: HTTP ${response.status} ${text.slice(0, 500)}`)
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${method}: ${JSON.stringify(json)}`)
  }

  if (json?.error) {
    throw new Error(`JSON-RPC error from ${method}: ${JSON.stringify(json.error)}`)
  }

  return json?.result
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, init)
  const text = await response.text()
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    throw new Error(`Non-JSON response from ${url}: HTTP ${response.status} ${text.slice(0, 500)}`)
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}: ${JSON.stringify(json)}`)
  }

  return json
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertEmbedUrl(value, message) {
  assert(typeof value === 'string' && value.length > 0, `${message}: missing embed_url`)
  const url = new URL(value)
  assert(url.origin === baseUrl, `${message}: embed_url origin should be ${baseUrl}`)
  assert(url.pathname.startsWith('/artifacts/dashboards/'), `${message}: embed_url should point to dashboard route`)
  assert(url.searchParams.get('embed') === '1', `${message}: embed_url missing embed=1`)
  assert(url.searchParams.get('token'), `${message}: embed_url missing signed token`)
}

console.log(`Testing ChatGPT App MCP endpoint: ${mcpUrl}`)

const unauthorized = await fetch(mcpUrl, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 0,
    method: 'initialize',
    params: {},
  }),
})
assert(unauthorized.status === 401, 'unauthorized MCP call should return 401')
assert(unauthorized.headers.get('www-authenticate')?.includes('oauth-protected-resource'), '401 missing OAuth WWW-Authenticate metadata')
console.log('oauth challenge ok')

const protectedResourceMetadata = await fetchJson(`${baseUrl}/.well-known/oauth-protected-resource`)
assert(
  protectedResourceMetadata?.authorization_servers?.[0]?.includes('/api/chatgpt-app/oauth'),
  'protected resource metadata missing authorization server',
)
console.log('oauth protected resource metadata ok')

const authorizationServerMetadata = await fetchJson(`${baseUrl}/.well-known/oauth-authorization-server`)
assert(
  authorizationServerMetadata?.authorization_endpoint?.includes('/api/chatgpt-app/oauth/authorize'),
  'authorization server metadata missing authorize endpoint',
)
assert(
  authorizationServerMetadata?.token_endpoint?.includes('/api/chatgpt-app/oauth/token'),
  'authorization server metadata missing token endpoint',
)
console.log('oauth authorization server metadata ok')

const registration = await fetchJson(`${baseUrl}/api/chatgpt-app/oauth/register`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    redirect_uris: ['https://example.com/oauth/callback'],
    token_endpoint_auth_method: 'client_secret_post',
  }),
})
assert(registration?.client_id, 'oauth registration missing client_id')
console.log('oauth registration ok')

const authorizeUrl = new URL(`${baseUrl}/api/chatgpt-app/oauth/authorize`)
authorizeUrl.searchParams.set('response_type', 'code')
authorizeUrl.searchParams.set('client_id', registration.client_id)
authorizeUrl.searchParams.set('redirect_uri', 'https://example.com/oauth/callback')
authorizeUrl.searchParams.set('scope', 'dashboards:read dashboards:write')
authorizeUrl.searchParams.set('state', 'smoke-state')

const authorize = await fetch(authorizeUrl, { redirect: 'manual' })
assert(authorize.status === 302 || authorize.status === 307, 'oauth authorize should redirect')
const location = authorize.headers.get('location')
assert(location, 'oauth authorize missing redirect location')
const callbackUrl = new URL(location)
const authorizationCode = callbackUrl.searchParams.get('code')
assert(authorizationCode, 'oauth authorize missing code')
assert(callbackUrl.searchParams.get('state') === 'smoke-state', 'oauth authorize did not preserve state')
console.log('oauth authorize ok')

const oauthToken = await fetchJson(`${baseUrl}/api/chatgpt-app/oauth/token`, {
  method: 'POST',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: 'https://example.com/oauth/callback',
    client_id: registration.client_id,
    client_secret: registration.client_secret || '',
  }),
})
assert(oauthToken?.access_token, 'oauth token endpoint missing access_token')
console.log('oauth token ok')

const oauthInitialize = await callMcpWithToken(oauthToken.access_token, 'initialize', {
  protocolVersion: '2025-11-25',
  capabilities: {},
  clientInfo: {
    name: 'cognito-chatgpt-app-oauth-smoke',
    version: '0.1.0',
  },
})
assert(oauthInitialize?.serverInfo?.name === 'cognito-chatgpt-app', 'oauth initialize failed')
console.log('oauth MCP initialize ok')

const initialize = await callMcp('initialize', {
  protocolVersion: '2025-11-25',
  capabilities: {},
  clientInfo: {
    name: 'cognito-chatgpt-app-smoke',
    version: '0.1.0',
  },
})
assert(initialize?.serverInfo?.name === 'cognito-chatgpt-app', 'initialize did not return ChatGPT App serverInfo')
assert(initialize?.capabilities?.resources, 'initialize missing resources capability')
console.log(`initialize ok: ${initialize.serverInfo.name}@${initialize.serverInfo.version}`)

const toolsList = await callMcp('tools/list')
const toolNames = (toolsList?.tools || []).map((tool) => tool.name)
assert(toolNames.includes('search'), 'tools/list missing search')
assert(toolNames.includes('fetch'), 'tools/list missing fetch')
assert(toolNames.includes('erp'), 'tools/list missing erp')
assert(toolNames.includes('sql_execution'), 'tools/list missing sql_execution')
assert(toolNames.includes('ecommerce'), 'tools/list missing ecommerce')
assert(toolNames.includes('marketing'), 'tools/list missing marketing')
assert(toolNames.includes('dashboard_list'), 'tools/list missing dashboard_list')
assert(toolNames.includes('dashboard_embed_preview'), 'tools/list missing dashboard_embed_preview')
assert(toolNames.includes('dashboard_render_list'), 'tools/list missing dashboard_render_list')
assert(toolNames.includes('dashboard_render_preview'), 'tools/list missing dashboard_render_preview')
const renderPreviewTool = (toolsList?.tools || []).find((tool) => tool.name === 'dashboard_render_preview')
assert(renderPreviewTool?._meta?.['openai/outputTemplate'] === 'ui://widget/dashboard.html', 'dashboard_render_preview missing OpenAI outputTemplate')
assert(renderPreviewTool?._meta?.['openai/widgetAccessible'] === true, 'dashboard_render_preview missing OpenAI widgetAccessible')
assert(renderPreviewTool?._meta?.ui?.resourceUri === 'ui://widget/dashboard.html', 'dashboard_render_preview missing MCP Apps ui.resourceUri')
const embedPreviewTool = (toolsList?.tools || []).find((tool) => tool.name === 'dashboard_embed_preview')
assert(embedPreviewTool?._meta?.['openai/outputTemplate'] === 'ui://widget/dashboard.html', 'dashboard_embed_preview missing OpenAI outputTemplate')
assert(embedPreviewTool?._meta?.ui?.resourceUri === 'ui://widget/dashboard.html', 'dashboard_embed_preview missing MCP Apps ui.resourceUri')
console.log(`tools/list ok: ${toolNames.join(', ')}`)

const resourcesList = await callMcp('resources/list')
const resourceUris = (resourcesList?.resources || []).map((resource) => resource.uri)
assert(resourceUris.includes('ui://widget/dashboard.html'), 'resources/list missing dashboard widget')
console.log(`resources/list ok: ${resourceUris.join(', ')}`)

const widget = await callMcp('resources/read', {
  uri: 'ui://widget/dashboard.html',
})
const widgetContent = widget?.contents?.[0] || {}
const html = widgetContent.text || ''
assert(html.includes('Cognito Dashboards'), 'dashboard widget HTML missing title')
assert(html.includes('CognitoChatGptApp'), 'dashboard widget HTML missing runtime')
assert(html.includes('<iframe'), 'dashboard widget HTML missing iframe renderer')
assert(html.includes('dashboard-embed-frame'), 'dashboard widget HTML missing embed frame styles')
const widgetCsp = widgetContent?._meta?.['openai/widgetCSP']
assert(widgetCsp?.resource_domains?.includes(baseUrl), 'widget CSP missing app resource domain')
assert(widgetCsp?.connect_domains?.includes(baseUrl), 'widget CSP missing app connect domain')
assert(widgetContent?._meta?.ui?.csp?.resourceDomains?.includes(baseUrl), 'widget MCP Apps CSP missing app resource domain')
assert(widgetContent?._meta?.['openai/widgetDescription'], 'widget missing OpenAI widgetDescription')
console.log('resources/read ok')

const embedToken = await fetchJson(`${baseUrl}/api/chatgpt-app/embed-token`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    artifact_id: 'smoke-dashboard',
    ttl_seconds: 120,
  }),
})
assert(embedToken?.ok === true, 'embed-token endpoint should return ok=true')
assert(embedToken?.artifact_id === 'smoke-dashboard', 'embed-token endpoint should preserve artifact_id')
assert(typeof embedToken?.token === 'string' && embedToken.token.includes('.'), 'embed-token endpoint missing signed token')
console.log('embed-token ok')

const renderList = await callMcp('tools/call', {
  name: 'dashboard_render_list',
  arguments: {
    title: 'Smoke dashboards',
    dashboards: [
      {
        id: 'smoke-dashboard',
        title: 'Smoke Dashboard',
        status: 'draft',
        current_draft_version: 1,
        updated_at: '2026-05-07T00:00:00.000Z',
        url: 'https://cognito-seven.vercel.app',
      },
    ],
  },
})
assert(renderList?.structuredContent?.view === 'dashboard_list', 'dashboard_render_list returned invalid view')
console.log('dashboard_render_list ok')

const renderPreview = await callMcp('tools/call', {
  name: 'dashboard_render_preview',
  arguments: {
    dashboard: {
      id: 'smoke-dashboard',
      title: 'Smoke Dashboard',
      source: '<Dashboard title="Smoke" />',
    },
  },
})
assert(renderPreview?.structuredContent?.view === 'dashboard_preview', 'dashboard_render_preview returned invalid view')
assertEmbedUrl(renderPreview?.structuredContent?.dashboard?.embed_url, 'dashboard_render_preview')
console.log('dashboard_render_preview ok')

const dashboardList = await callMcp('tools/call', {
  name: 'dashboard_list',
  arguments: {
    limit: 1,
  },
})
assert(Array.isArray(dashboardList?.structuredContent?.dashboards), 'dashboard_list structuredContent must wrap dashboards array')
if (dashboardList.structuredContent.dashboards.length) {
  assertEmbedUrl(dashboardList.structuredContent.dashboards[0]?.embed_url, 'dashboard_list')
}
console.log('dashboard_list output shape ok')

const search = await callMcp('tools/call', {
  name: 'search',
  arguments: {
    query: 'dashboard',
  },
})
assert(Array.isArray(search?.structuredContent?.results), 'search structuredContent must include results array')
if (search.structuredContent.results.length) {
  assertEmbedUrl(search.structuredContent.results[0]?.embed_url, 'search')
}
console.log('search ok')

console.log('ChatGPT App smoke test passed')
