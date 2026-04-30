import type { ToolkitDefinition } from '@/products/integracoes/shared/types'

export const MCP_TOP_PRIORITY_ORDER = [
  'GMAIL',
  'GOOGLECALENDAR',
  'GOOGLEDRIVE',
  'GOOGLEDOCS',
  'GOOGLESHEETS',
  'GOOGLESLIDES',
  'WHATSAPP',
  'SLACK',
  'TELEGRAM',
  'DISCORD',
  'METAADS',
  'GOOGLEADS',
  'GOOGLE_ANALYTICS',
  'SHOPIFY',
  'AMAZON',
  'HUBSPOT',
  'SALESFORCE',
  'PIPEDRIVE',
  'STRIPE',
  'ZENDESK',
] as const

export const DATA_CONNECTOR_TOP_PRIORITY_ORDER = [
  'METAADS',
  'GOOGLEADS',
  'GOOGLE_ANALYTICS',
  'SHOPIFY',
  'AMAZON',
  'STRIPE',
  'HUBSPOT',
  'SALESFORCE',
  'SNOWFLAKE',
  'BIGQUERY',
  'POSTGRESQL',
  'SUPABASE',
] as const

export const MCP_DESCRIPTION_OVERRIDES: Record<string, string> = {
  GMAIL:
    'Ler, enviar e organizar emails.',
  GOOGLECALENDAR:
    'Criar e gerenciar eventos e agendas.',
  GOOGLEDRIVE:
    'Organizar arquivos e pastas.',
  GOOGLEDOCS:
    'Criar e editar documentos.',
  GOOGLESHEETS:
    'Ler e atualizar planilhas.',
  GOOGLESLIDES:
    'Criar e atualizar apresentações.',
  WHATSAPP:
    'Enviar mensagens e notificações.',
  SLACK:
    'Automatizar mensagens e alertas.',
  TELEGRAM:
    'Enviar alertas e interações com bots.',
  DISCORD:
    'Enviar mensagens e alertas.',
  METAADS:
    'Consultar campanhas e anúncios.',
  GOOGLEADS:
    'Consultar campanhas e métricas.',
  GOOGLE_ANALYTICS:
    'Ver métricas de tráfego e conversão.',
  SHOPIFY:
    'Gerenciar pedidos, clientes e catálogo.',
  AMAZON:
    'Consultar pedidos e catálogo.',
  HUBSPOT:
    'Gerenciar contatos e negócios.',
  SALESFORCE:
    'Gerenciar contas, leads e oportunidades.',
  PIPEDRIVE:
    'Gerenciar pipeline e negócios.',
  STRIPE:
    'Consultar pagamentos e assinaturas.',
  ZENDESK:
    'Gerenciar tickets de suporte.',
}

export function applyToolkitDescriptionOverrides(
  toolkits: ToolkitDefinition[],
  overrides: Record<string, string>,
): ToolkitDefinition[] {
  return toolkits.map((toolkit) => {
    const key = String(toolkit.slug).toUpperCase()
    const override = overrides[key]
    return override ? { ...toolkit, description: override } : toolkit
  })
}

export default {
  MCP_TOP_PRIORITY_ORDER,
  DATA_CONNECTOR_TOP_PRIORITY_ORDER,
  MCP_DESCRIPTION_OVERRIDES,
  applyToolkitDescriptionOverrides,
}
