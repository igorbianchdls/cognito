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
    'Ler, buscar, responder e enviar emails; organizar caixas, acompanhar conversas e automatizar follow-ups.',
  GOOGLECALENDAR:
    'Criar, atualizar e consultar eventos/reuniões; gerenciar agendas, disponibilidade e convites.',
  GOOGLEDRIVE:
    'Navegar pastas, criar/organizar arquivos, mover documentos e estruturar repositórios de trabalho.',
  GOOGLEDOCS:
    'Criar e editar documentos colaborativos para propostas, contratos, atas e conteúdos.',
  GOOGLESHEETS:
    'Ler/escrever planilhas, atualizar células e alimentar controles operacionais ou relatórios.',
  GOOGLESLIDES:
    'Gerar e atualizar apresentações para propostas comerciais, reuniões e reports executivos.',
  WHATSAPP:
    'Enviar mensagens, notificações e updates operacionais em fluxos de atendimento, cobrança e vendas.',
  SLACK:
    'Automatizar alertas, status e ações em canais/equipes, integrando operações com o chat do time.',
  TELEGRAM:
    'Disparar notificações e interações com bots/canais para automações e acompanhamento operacional.',
  DISCORD:
    'Enviar mensagens e integrações em comunidades/equipes para alertas e coordenação de operações.',
  METAADS:
    'Consultar campanhas, conjuntos e anúncios; apoiar análises, ajustes operacionais e automações de marketing.',
  GOOGLEADS:
    'Consultar métricas/campanhas e apoiar otimização operacional de mídia paga e automações.',
  GOOGLE_ANALYTICS:
    'Acessar métricas de tráfego e conversão para análises, auditorias e rotinas operacionais.',
  SHOPIFY:
    'Ler pedidos, clientes e catálogo; automatizar rotinas de e-commerce, atendimento e operação.',
  AMAZON:
    'Consultar pedidos/catálogo e apoiar automações de marketplace, operação comercial e atendimento.',
  HUBSPOT:
    'Trabalhar com contatos, negócios e atividades; automatizar CRM, follow-ups e rotinas comerciais.',
  SALESFORCE:
    'Acessar contas, leads e oportunidades; suportar automações complexas de CRM e processos de vendas.',
  PIPEDRIVE:
    'Gerenciar pipeline, negócios e atividades com automações de vendas e acompanhamento de etapas.',
  STRIPE:
    'Consultar pagamentos, clientes e assinaturas; apoiar cobranças, conciliações e automações financeiras.',
  ZENDESK:
    'Ler e atualizar tickets; automatizar atendimento, priorização e fluxos de suporte.',
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
