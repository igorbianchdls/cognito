export const AGENTSDK_ERP_MCP_CRUD_TOOL_SCRIPT = `tool('crud','Tool ERP canônica para listar/criar/atualizar/deletar/cancelar recursos de negócio. Use somente resource canônico (com hífen, nunca underscore). Resources suportados: financeiro/contas-financeiras, financeiro/categorias-despesa, financeiro/categorias-receita, financeiro/clientes, financeiro/centros-custo, financeiro/centros-lucro, vendas/pedidos, compras/pedidos, contas-a-pagar, contas-a-receber, crm/contas, crm/contatos, crm/leads, crm/oportunidades, crm/atividades, estoque/almoxarifados, estoque/movimentacoes, estoque/estoque-atual, estoque/tipos-movimentacao. Em recursos transacionais (ex.: vendas/pedidos, compras/pedidos), prefira action=\"cancelar\" em vez de deletar. Para consultas, prefira action=\"listar\" com filtros em params (e data quando necessário).', {
  action: z.enum(['listar','criar','atualizar','deletar','cancelar']),
  resource: z.string().optional(),
  path: z.string().optional(),
  params: z.any().optional(),
  data: z.any().optional(),
  actionSuffix: z.string().optional(),
  method: z.enum(['GET','POST']).optional(),
}, async (args) => callBridge({ action: args.action, args }))`;
