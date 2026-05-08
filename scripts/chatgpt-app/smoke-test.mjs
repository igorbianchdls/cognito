#!/usr/bin/env node

const DEFAULT_CHATGPT_APP_MCP_URL = 'https://cognito-seven.vercel.app/api/chatgpt-app/mcp'

const mcpUrl = (process.env.COGNITO_CHATGPT_APP_MCP_URL || DEFAULT_CHATGPT_APP_MCP_URL).trim()
const token = (process.env.COGNITO_MCP_TOKEN || '').trim()

if (!token) {
  console.error('Missing COGNITO_MCP_TOKEN')
  console.error('Usage: COGNITO_MCP_TOKEN=... pnpm chatgpt-app:smoke')
  process.exit(1)
}

let nextId = 1

async function callMcp(method, params = {}) {
  const id = nextId++
  const response = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
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

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

console.log(`Testing ChatGPT App MCP endpoint: ${mcpUrl}`)

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
assert(toolNames.includes('dashboard_list'), 'tools/list missing dashboard_list')
assert(toolNames.includes('dashboard_render_list'), 'tools/list missing dashboard_render_list')
assert(toolNames.includes('dashboard_render_preview'), 'tools/list missing dashboard_render_preview')
console.log(`tools/list ok: ${toolNames.join(', ')}`)

const resourcesList = await callMcp('resources/list')
const resourceUris = (resourcesList?.resources || []).map((resource) => resource.uri)
assert(resourceUris.includes('ui://widget/dashboard.html'), 'resources/list missing dashboard widget')
console.log(`resources/list ok: ${resourceUris.join(', ')}`)

const widget = await callMcp('resources/read', {
  uri: 'ui://widget/dashboard.html',
})
const html = widget?.contents?.[0]?.text || ''
assert(html.includes('Cognito Dashboards'), 'dashboard widget HTML missing title')
assert(html.includes('CognitoChatGptApp'), 'dashboard widget HTML missing runtime')
console.log('resources/read ok')

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
console.log('dashboard_render_preview ok')

console.log('ChatGPT App smoke test passed')

