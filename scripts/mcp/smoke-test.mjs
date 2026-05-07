#!/usr/bin/env node

const DEFAULT_MCP_URL = 'https://cognito-seven.vercel.app/api/mcp'

const mcpUrl = (process.env.COGNITO_MCP_URL || DEFAULT_MCP_URL).trim()
const token = (process.env.COGNITO_MCP_TOKEN || '').trim()

if (!token) {
  console.error('Missing COGNITO_MCP_TOKEN')
  console.error('Usage: COGNITO_MCP_TOKEN=... pnpm mcp:smoke')
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

console.log(`Testing MCP endpoint: ${mcpUrl}`)

const initialize = await callMcp('initialize', {
  protocolVersion: '2025-11-25',
  capabilities: {},
  clientInfo: {
    name: 'cognito-mcp-smoke',
    version: '0.1.0',
  },
})
assert(initialize?.serverInfo?.name === 'cognito', 'initialize did not return cognito serverInfo')
console.log(`initialize ok: ${initialize.serverInfo.name}@${initialize.serverInfo.version}`)

const toolsList = await callMcp('tools/list')
const toolNames = (toolsList?.tools || []).map((tool) => tool.name)
assert(toolNames.includes('dashboard_get_contract'), 'tools/list missing dashboard_get_contract')
assert(toolNames.includes('dashboard_create'), 'tools/list missing dashboard_create')
console.log(`tools/list ok: ${toolNames.join(', ')}`)

const contract = await callMcp('tools/call', {
  name: 'dashboard_get_contract',
  arguments: {
    include_example: true,
  },
})
const structuredContract = contract?.structuredContent
assert(structuredContract?.artifact_type === 'dashboard', 'dashboard_get_contract returned invalid contract')
assert(typeof structuredContract?.example_source === 'string', 'dashboard_get_contract missing example_source')
console.log('dashboard_get_contract ok')

console.log('MCP smoke test passed')

