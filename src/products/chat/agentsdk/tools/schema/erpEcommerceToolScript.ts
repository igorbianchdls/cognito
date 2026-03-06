export const AGENTSDK_ERP_MCP_ECOMMERCE_TOOL_SCRIPT = `tool('ecommerce','Tool analítica canônica de ecommerce por actions fixas (sem SQL livre). Use para KPIs e cortes padrão de operação/comercial. Não use para SQL customizado; nesse caso use sql_execution. Entrada: action obrigatória + params opcionais (datas YYYY-MM-DD). Saída padronizada: rows, columns, count, chart, sql_query e sql_params.', {
  action: z.enum(['kpis_resumo','vendas_por_canal','pedidos_por_status','faturamento_por_mes','top_produtos_receita','frete_por_transportadora']),
  params: z.object({
    de: z.string().optional(),
    ate: z.string().optional(),
    plataforma: z.string().optional(),
    canal_conta_id: z.string().optional(),
    loja_id: z.string().optional(),
    status: z.string().optional(),
    status_pagamento: z.string().optional(),
    status_fulfillment: z.string().optional(),
    limit: z.union([z.number(), z.string()]).optional(),
  }).passthrough().optional(),
}, async (args) => callEcommerce(args));`;
