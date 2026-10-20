import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PluginPrincipal } from '../../shared/contracts'
import type { PluginConfig } from '../../shared/config'
import { executeTool, type ExecutionDependencies } from '../../application/executeTool'
import { accessSchema, tools } from '../../tools/catalog'
import { envelope, outputs, profileFields } from '../../tools/outputs'
import { actionTools } from '../../actions/catalog'
import { toolDescription } from '../../tools/descriptions'
import { registerTables } from '../../mcp/registerTables'
import { registerApps } from '../../mcp/registerApps'
import { registerWhatsApp } from '../../mcp/registerWhatsApp'
import type { Host } from './instructions'

// How a host marks the tools: metadata of reads and writes, and which writes count as destructive.
export type ToolStyle = {
  card: Record<string, unknown>
  readMeta: Record<string, unknown>
  writeMeta: Record<string, unknown>
  accessMeta?: Record<string, unknown>
  destructive: (action: (typeof actionTools)[number]) => boolean
  /** Host tools registered right after meu_acesso (keeps the order people see). */
  afterAccess?: () => void
}

/** The same catalog in every host: access, ERP reads and writes, Tables, Apps and WhatsApp. */
export async function registerCommonTools(server: McpServer, principal: PluginPrincipal, config: PluginConfig, dependencies: ExecutionDependencies, host: Host, style: ToolStyle) {
  // MCP Apps is negotiated as a capability extension: hosts that follow the spec only treat the ui://
  // resources as cards when the server declares it. Merged with the extensions already registered.
  server.server.registerCapabilities({ extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: ['text/html;profile=mcp-app'] } } })
  // _meta tells the card which tool produced the result.
  const run = (name: string) => async (input: unknown) => {
    const result = await executeTool(principal, name, input, config, dependencies)
    return { ...result, _meta: { ...result._meta, 'cognito/tool': name } }
  }
  const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  server.registerTool('meu_acesso', { title: 'Meu acesso', description: toolDescription('meu_acesso'), inputSchema: accessSchema, outputSchema: envelope(outputs.access).extend(profileFields), annotations: readOnly, _meta: { ...style.readMeta, ...style.card, ...style.accessMeta } }, run('meu_acesso'))
  style.afterAccess?.()
  for (const tool of tools) server.registerTool(tool.name, { title: tool.title, description: tool.description, inputSchema: tool.schema, outputSchema: envelope(tool.output), annotations: { ...readOnly, readOnlyHint: !tool.write, destructiveHint: Boolean(tool.write && host === 'claude') }, _meta: { ...(tool.write ? style.writeMeta : style.readMeta), ...style.card } }, run(tool.name))
  for (const action of actionTools) server.registerTool(action.name, { title: action.title, description: action.description, inputSchema: action.schema, outputSchema: envelope(outputs.draft),
    annotations: { readOnlyHint: false, destructiveHint: style.destructive(action), idempotentHint: true, openWorldHint: false }, _meta: { ...style.writeMeta, ...style.card } }, run(action.name))
  registerTables(server, principal, config, dependencies, host)
  registerApps(server, principal, config, dependencies, host)
  await registerWhatsApp(server, principal, config, dependencies, host)
}
