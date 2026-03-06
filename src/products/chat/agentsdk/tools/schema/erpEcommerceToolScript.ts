export const AGENTSDK_ERP_MCP_ECOMMERCE_TOOL_SCRIPT = `tool('ecommerce','Consulta métricas canônicas de ecommerce via actions pré-definidas (sem SQL livre). Use para KPIs e rankings operacionais/comerciais.', {
  action: z.enum(['kpis_resumo','vendas_por_canal','pedidos_por_status','faturamento_por_mes','top_produtos_receita','frete_por_transportadora']),
  params: z.any().optional(),
}, async (args) => callEcommerce(args));`;
