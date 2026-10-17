import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createHash } from 'node:crypto'
import type { PluginPrincipal } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'
import { executeTool, type ExecutionDependencies } from '../application/executeTool'
import { appsTools, appsEnvelope } from '../domains/apps/tools/catalog'
import { renderAppsCard } from '../domains/apps/tools/card'

export const APPS_INSTRUCTIONS = ' Ferramentas apps_ criam e mantêm apps da empresa com interface livre (React por padrão, ou HTML), que rodam isolados. Dentro do app: otto.ready() antes de tudo; dados do Tables com otto.tables.listar/obter/criar/editar/resumir/campos(fonte, ...), usando campos e opções pelo nome, e declarando cada fonte em manifesto.tabelas (chave, tabela_id, operacoes); dados internos com otto.data.list/save/remove(colecao, ...). Só react e react-dom estão disponíveis; não há rede nem outros pacotes. Fluxo: apps_criar, depois apps_salvar_codigo; leia erro_compilacao e corrija antes de publicar. Prefira editar trechos a reescrever arquivos. Mostre o link da prévia. Publicar e tirar do ar exigem prévia e confirmação explícita.'
export function registerApps(server: McpServer, principal: PluginPrincipal, config: PluginConfig, deps: ExecutionDependencies, host: 'chatgpt' | 'claude') {
  const uri = `ui://${config.integration}plugin/apps/v1.html`
  server.registerResource('apps-cards', uri, { mimeType: 'text/html;profile=mcp-app' }, async () => ({ contents: [{ uri, mimeType: 'text/html;profile=mcp-app', text: renderAppsCard(host), _meta: { ui: { prefersBorder: true, ...(host === 'claude' ? { domain: `${createHash('sha256').update(config.resource).digest('hex').slice(0, 32)}.claudemcpcontent.com` } : {}), csp: { connectDomains: [], resourceDomains: [] } } } }] }))
  for (const tool of appsTools) server.registerTool(tool.name, {
    title: tool.title, description: tool.description, inputSchema: tool.schema, outputSchema: appsEnvelope,
    annotations: { readOnlyHint: !tool.write && !tool.control, destructiveHint: tool.destructive, idempotentHint: true, openWorldHint: false },
    _meta: { ui: { resourceUri: uri }, ...(host === 'chatgpt' ? { securitySchemes: [{ type: 'oauth2', scopes: tool.write || tool.control ? [config.scope, 'erp:write'] : [config.scope] }] } : {}) },
  }, async input => { const result = await executeTool(principal, tool.name, input, config, deps); return { ...result, _meta: { ...result._meta, 'cognito/tool': tool.name } } })
}
