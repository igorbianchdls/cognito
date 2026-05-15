import { DASHBOARD_WIDGET_RESOURCE_URI } from '@/products/chatgpt-app/server/appResources'
import {
  callCognitoMcpAppTool,
  listCognitoMcpAppTools,
} from '@/products/mcp-apps/server/appTools'
import type { CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'

type JsonRecord = Record<string, unknown>

type ChatGptAppTool = JsonRecord & {
  name: string
  _meta: JsonRecord
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function getToolInvocationText(name: string) {
  switch (name) {
    case 'dashboards':
    case 'dashboard_list':
      return ['Listando dashboards...', 'Dashboards listados.']
    case 'open_dashboard':
    case 'dashboard_read':
    case 'fetch':
      return ['Abrindo dashboard...', 'Dashboard carregado.']
    case 'dashboard_authoring':
      return ['Atualizando dashboard...', 'Dashboard atualizado.']
    case 'dashboard_get_contract':
      return ['Lendo contrato...', 'Contrato carregado.']
    case 'dashboard_create':
      return ['Criando dashboard...', 'Dashboard criado.']
    case 'dashboard_patch':
      return ['Editando dashboard...', 'Dashboard editado.']
    case 'dashboard_update_full':
      return ['Atualizando dashboard...', 'Dashboard atualizado.']
    case 'dashboard_render_list':
    case 'dashboard_render_preview':
    case 'dashboard_embed_preview':
      return ['Renderizando dashboard...', 'Dashboard renderizado.']
    case 'search':
      return ['Buscando dashboards...', 'Busca concluida.']
    case 'erp':
      return ['Consultando registros...', 'Registros carregados.']
    case 'erp_acoes':
      return ['Preparando acao no ERP...', 'Acao do ERP processada.']
    case 'crm':
      return ['Consultando CRM...', 'Dados de CRM carregados.']
    case 'ecommerce':
      return ['Calculando ecommerce...', 'Metricas de ecommerce carregadas.']
    case 'sql':
    case 'sql_execution':
      return ['Executando SQL...', 'SQL executado.']
    case 'marketing':
      return ['Calculando marketing...', 'Metricas de marketing carregadas.']
    default:
      return ['Executando tool...', 'Tool executada.']
  }
}

function hasWidgetUi(meta: JsonRecord) {
  const ui = asRecord(meta.ui)
  return ui.resourceUri === DASHBOARD_WIDGET_RESOURCE_URI
}

function withOpenAiToolMeta(tool: JsonRecord): ChatGptAppTool {
  const meta = asRecord(tool._meta)
  const name = String(tool.name || '')
  const [invoking, invoked] = getToolInvocationText(String(tool.name || ''))
  const openAiWidgetMeta = hasWidgetUi(meta)
    ? {
        'openai/outputTemplate': DASHBOARD_WIDGET_RESOURCE_URI,
        'openai/widgetAccessible': true,
      }
    : {}

  return {
    ...tool,
    name,
    _meta: {
      ...meta,
      ...openAiWidgetMeta,
      'openai/toolInvocation/invoking': invoking,
      'openai/toolInvocation/invoked': invoked,
    },
  }
}

export function listCognitoChatGptAppTools(): { tools: ChatGptAppTool[] } {
  const result = listCognitoMcpAppTools()
  return {
    tools: result.tools.map((tool) => withOpenAiToolMeta(tool as JsonRecord)),
  }
}

export async function callCognitoChatGptAppTool(
  name: string,
  args: unknown,
  context: CognitoMcpServerContext = {},
) {
  return callCognitoMcpAppTool(name, args, context)
}
