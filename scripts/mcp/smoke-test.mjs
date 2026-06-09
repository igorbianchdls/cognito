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
assert(toolNames.includes('artifact_authoring'), 'tools/list missing artifact_authoring')
assert(!toolNames.includes('dashboard_get_contract'), 'tools/list should not expose dashboard_get_contract')
assert(!toolNames.includes('dashboard_create'), 'tools/list should not expose dashboard_create')
assert(!toolNames.includes('dashboard_patch'), 'tools/list should not expose dashboard_patch')
console.log(`tools/list ok: ${toolNames.join(', ')}`)

const contract = await callMcp('tools/call', {
  name: 'artifact_authoring',
  arguments: {
    kind: 'dashboard',
    action: 'get_contract',
    include_example: true,
  },
})
const structuredContract = contract?.structuredContent
assert(structuredContract?.kind === 'dashboard', 'artifact_authoring dashboard contract returned invalid kind')
assert(structuredContract?.contract?.artifact_type === 'dashboard', 'artifact_authoring returned invalid dashboard contract')
assert(typeof structuredContract?.contract?.example_source === 'string', 'artifact_authoring missing dashboard example_source')
console.log('artifact_authoring dashboard contract ok')

console.log('MCP smoke test passed')
