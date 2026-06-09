import { DASHBOARD_WIDGET_RESOURCE_URI } from '@/products/chatgpt-app/server/appResources'
import {
  callCognitoPluginTool,
  listCognitoPluginTools,
} from '@/products/plugin/server/appTools'
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
    case 'open_artifact':
      return ['Abrindo artifact...', 'Artifact carregado.']
    case 'artifact_authoring':
      return ['Atualizando artifact...', 'Artifact atualizado.']
    case 'chart':
      return ['Renderizando grafico...', 'Grafico renderizado.']
    case 'analysis':
      return ['Montando analise...', 'Analise carregada.']
    case 'table':
      return ['Montando tabela...', 'Tabela carregada.']
    case 'actions':
      return ['Preparando acao...', 'Acao preparada.']
    case 'alerts':
      return ['Atualizando alertas...', 'Alertas atualizados.']
    case 'schedules':
      return ['Atualizando agendamentos...', 'Agendamentos atualizados.']
    case 'connectors':
      return ['Verificando conectores...', 'Conectores carregados.']
    case 'dashboard_render_list':
    case 'dashboard_render_preview':
    case 'dashboard_embed_preview':
      return ['Renderizando dashboard...', 'Dashboard renderizado.']
    case 'dashboard_read':
    case 'fetch':
      return ['Abrindo dashboard...', 'Dashboard carregado.']
    case 'search':
      return ['Buscando dashboards...', 'Busca concluida.']
    case 'erp':
      return ['Consultando registros...', 'Registros carregados.']
    case 'erp_acoes':
      return ['Preparando acao no ERP...', 'Acao do ERP processada.']
    case 'crm':
      return ['Consultando CRM...', 'Dados de CRM carregados.']
    case 'data_catalog':
      return ['Lendo catalogo de dados...', 'Catalogo de dados carregado.']
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
  const result = listCognitoPluginTools()
  return {
    tools: result.tools.map((tool) => withOpenAiToolMeta(tool as JsonRecord)),
  }
}

export async function callCognitoChatGptAppTool(
  name: string,
  args: unknown,
  context: CognitoMcpServerContext = {},
) {
  return callCognitoPluginTool(name, args, context)
}
