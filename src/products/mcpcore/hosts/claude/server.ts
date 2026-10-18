import { createHash } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PluginPrincipal } from '../../shared/contracts'
import type { PluginConfig } from '../../shared/config'
import { executionDependencies, type ExecutionDependencies } from '../../application/executeTool'
import { renderCardsHtml } from '../../ui/resource'
import { serverInstructions } from '../shared/instructions'
import { registerCommonTools } from '../shared/registerTools'
import { CLAUDEPLUGIN_VERSION } from './version'

export const SERVER_INFO = { name: 'cognito-claudeplugin', version: CLAUDEPLUGIN_VERSION }
export const CARDS_URI = 'ui://claudeplugin/cards/v1.html'
export const SERVER_INSTRUCTIONS = serverInstructions('claude')

// Origin of the cards sandbox in Claude: first 32 hex of the SHA-256 of the server URL.
export function claudeUiDomain(serverUrl: string) {
  return `${createHash('sha256').update(serverUrl).digest('hex').slice(0, 32)}.claudemcpcontent.com`
}

export async function createClaudeServer(principal: PluginPrincipal, config: PluginConfig, dependencies: ExecutionDependencies = executionDependencies) {
  const server = new McpServer(SERVER_INFO, { instructions: SERVER_INSTRUCTIONS })
  server.registerResource('erp-cards', CARDS_URI, { mimeType: 'text/html;profile=mcp-app' }, async () => ({ contents: [{ uri: CARDS_URI, mimeType: 'text/html;profile=mcp-app',
    text: renderCardsHtml({ name: 'claudeplugin-cards', version: CLAUDEPLUGIN_VERSION, host: 'claude' }),
    _meta: { ui: { prefersBorder: true, domain: claudeUiDomain(config.resource), csp: { connectDomains: [], resourceDomains: [] } } } }] }))
  // Claude asks that every tool that changes data be marked destructive, creating and editing included.
  await registerCommonTools(server, principal, config, dependencies, 'claude', { card: { ui: { resourceUri: CARDS_URI } }, readMeta: {}, writeMeta: {}, destructive: () => true })
  return server
}
