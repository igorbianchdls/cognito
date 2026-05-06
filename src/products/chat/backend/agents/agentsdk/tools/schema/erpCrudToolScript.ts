export const AGENTSDK_ERP_MCP_CRUD_TOOL_SCRIPT = `tool('crud','Tool canônica para listar/criar/atualizar/deletar/aprovar/concluir/cancelar/reabrir/baixar/estornar recursos de negócio. Use somente resource canônico (com hífen, nunca underscore). Resources suportados: financeiro/contas-financeiras, financeiro/categorias-despesa, financeiro/categorias-receita, financeiro/clientes, financeiro/centros-custo, financeiro/centros-lucro, vendas/pedidos, compras/pedidos, contas-a-pagar, contas-a-receber, crm/contas, crm/contatos, crm/leads, crm/oportunidades, crm/atividades, estoque/almoxarifados, estoque/movimentacoes, estoque/estoque-atual, estoque/tipos-movimentacao. Matriz prática: vendas/pedidos -> aprovar|concluir|cancelar|reabrir; compras/pedidos -> aprovar|cancelar|reabrir|marcar_como_recebido|marcar_recebimento_parcial; contas-a-pagar/contas-a-receber -> baixar|estornar|cancelar|reabrir. Em recursos transacionais, prefira ações de negócio em vez de deletar. Para consultas, prefira action=\"listar\" com filtros em params.', {
  action: z.enum(['listar','criar','atualizar','deletar','aprovar','concluir','cancelar','reabrir','baixar','estornar','marcar_como_recebido','marcar_recebimento_parcial']),
  resource: z.string().optional(),
  path: z.string().optional(),
  params: z.any().optional(),
  data: z.any().optional(),
  actionSuffix: z.string().optional(),
  method: z.enum(['GET','POST']).optional(),
}, async (args) => callBridge({ action: args.action, args }))`;
