export const AGENTSDK_ERP_MCP_MARKETING_TOOL_SCRIPT = `tool('marketing','Consulta métricas canônicas de tráfego pago (Meta/Google Ads) via actions pré-definidas (sem SQL livre). Use para cortes de performance e KPIs de mídia.', {
  action: z.enum(['kpis_resumo','desempenho_diario','gasto_por_campanha','roas_por_campanha','gasto_por_conta','top_anuncios']),
  params: z.any().optional(),
}, async (args) => callMarketing(args));`;
