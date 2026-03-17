export const AGENTSDK_ERP_MCP_MARKETING_TOOL_SCRIPT = `tool('marketing','Tool analítica canônica de marketing/tráfego pago por actions fixas (sem SQL livre). Use para KPIs e cortes padrão de mídia. Não use para SQL customizado; nesse caso use sql_execution. Entrada: action obrigatória + params opcionais (datas YYYY-MM-DD). Saída padronizada: rows, columns, count, chart, sql_query e sql_params.', {
  action: z.enum(['kpis_resumo','desempenho_diario','gasto_por_campanha','roas_por_campanha','gasto_por_conta','top_anuncios']),
  params: z.object({
    de: z.string().optional(),
    ate: z.string().optional(),
    plataforma: z.string().optional(),
    nivel: z.string().optional(),
    conta_id: z.string().optional(),
    campanha_id: z.string().optional(),
    grupo_id: z.string().optional(),
    anuncio_id: z.string().optional(),
    limit: z.union([z.number(), z.string()]).optional(),
  }).passthrough().optional(),
}, async (args) => callMarketing(args));`;
