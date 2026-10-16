import { runQuery } from '@/lib/postgres'
import { erpToday } from '@/products/erp/server/erpBusinessDate'
import { resolvePriceTable, tablePrice } from '@/products/erp/server/erpCommercialRules'
import { PluginError } from '../../../shared/contracts'
import type { Proposal } from '../schemas/actionContracts'

// Vendas e orçamentos podem chegar do chat sem preço: antes da prévia, o ERP preenche o valor unitário pela
// tabela de preço (informada, do cliente ou padrão) ou pelo cadastro do item. A proposta guardada já leva os
// preços, então a prévia mostrada é exatamente o que será salvo (e o ERP reaplica mínimo e desconto máximo).
const priced = new Set(['venda', 'orcamento', 'editar_venda', 'editar_orcamento'])
const client = { query: async (sql: string, params?: unknown[]) => ({ rows: await runQuery<Record<string, unknown>>(sql, params ?? []) }) }

export async function fillSalePrices(tenantId: number, proposal: Proposal): Promise<Proposal> {
  if (!priced.has(proposal.tipo)) return proposal
  let dados = proposal.dados as Record<string, unknown> & { itens?: Array<Record<string, unknown>> }
  if(proposal.tipo==='editar_venda'||proposal.tipo==='editar_orcamento'){
    const [current]=await runQuery('SELECT desconto,tipo_desconto,frete,validade_em,previsao_entrega,observacoes_pagamento FROM erp.vendas WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL',[tenantId,dados.registro_id]);
    if(!current)throw new PluginError('NOT_FOUND','Documento não encontrado.',404)
    const [schedule]=await runQuery('SELECT count(*)::int AS quantidade FROM erp.vendas_recebimentos_previstos WHERE empresa_id=$1 AND venda_id=$2 AND excluido_em IS NULL',[tenantId,dados.registro_id]);
    if(Number(schedule.quantidade)>1&&!dados.parcelas)throw new PluginError('INVALID_INPUT','Este documento tem várias parcelas. Envie parcelas com a condição completa; obter_venda retorna os vencimentos e valores.',400,undefined,[{campo:'dados.parcelas',motivo:'Preserve ou revise todas as parcelas.'}]);
    const preserved:Record<string,unknown>={desconto:Number(current.desconto),tipo_desconto:current.tipo_desconto,frete:Number(current.frete),validade_em:current.validade_em instanceof Date?current.validade_em.toISOString().slice(0,10):current.validade_em,previsao_entrega:current.previsao_entrega instanceof Date?current.previsao_entrega.toISOString().slice(0,10):current.previsao_entrega,observacoes_pagamento:current.observacoes_pagamento||''};
    dados={...preserved,...dados};proposal={...proposal,dados} as Proposal;
  }
  if (!Array.isArray(dados.itens) || dados.itens.every(item => Number(item.valor_unitario) > 0)) return proposal
  const date = typeof dados.data_venda === 'string' ? dados.data_venda : erpToday()
  const tableId = await resolvePriceTable(client, tenantId, Number(dados.cliente_id), dados.tabela_preco_id, date)
  const itens = []
  for (const [index, item] of dados.itens.entries()) {
    if (Number(item.valor_unitario) > 0) { itens.push(item); continue }
    const kind = item.tipo === 'servico' ? 'servico' : 'produto', itemId = Number(item.item_id), quantity = Number(item.quantidade)
    const listed = await tablePrice(client, tenantId, tableId, kind, itemId, quantity)
    let price = listed?.preco ?? 0
    if (!price) {
      const [catalog] = await runQuery<{ preco: string }>(kind === 'servico'
        ? 'SELECT preco::text AS preco FROM erp.servicos WHERE empresa_id = $1 AND id = $2 AND ativo AND excluido_em IS NULL'
        : 'SELECT preco_venda::text AS preco FROM erp.produtos WHERE empresa_id = $1 AND id = $2 AND ativo AND excluido_em IS NULL', [tenantId, itemId])
      price = Number(catalog?.preco || 0)
    }
    if (!(price > 0)) throw new PluginError('INVALID_INPUT', `O item ${index + 1} não tem preço na tabela nem no cadastro; informe o valor_unitario.`, 400, undefined,
      [{ campo: `dados.itens.${index}.valor_unitario`, motivo: 'Sem preço cadastrado para este item.' }])
    itens.push({ ...item, valor_unitario: Number(price.toFixed(2)) })
  }
  return { ...proposal, dados: { ...dados, itens } } as Proposal
}

// Devolução: a prévia mostra o valor estimado (item proporcional ao desconto da venda, sem frete), o mesmo
// cálculo que o ERP aplica ao registrar.
export async function estimateReturn(tenantId: number, proposal: Proposal): Promise<Proposal> {
  if (proposal.tipo !== 'devolucao_venda') return proposal
  const dados = proposal.dados
  const [sale] = await runQuery<{ subtotal: string; total: string; frete: string }>(
    'SELECT subtotal::text, total::text, frete::text FROM erp.vendas WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL', [tenantId, dados.registro_id])
  if (!sale) throw new PluginError('NOT_FOUND', 'Venda não encontrada nesta empresa.', 404)
  const factor = Number(sale.subtotal) > 0 ? Math.max(Number(sale.total) - Number(sale.frete), 0) / Number(sale.subtotal) : 0
  let cents = 0
  for (const item of dados.itens) {
    const [row] = await runQuery<{ total: string; quantidade: string }>(
      'SELECT total::text, quantidade::text FROM erp.vendas_itens WHERE empresa_id = $1 AND venda_id = $2 AND id = $3 AND excluido_em IS NULL',
      [tenantId, dados.registro_id, item.venda_item_id])
    if (!row) throw new PluginError('INVALID_INPUT', 'Item não pertence a esta venda.', 400, undefined, [{ campo: 'dados.itens', motivo: `venda_item_id ${item.venda_item_id} não é desta venda.` }])
    cents += Math.round(Number(row.total) / Number(row.quantidade) * factor * item.quantidade * 100)
  }
  return { ...proposal, dados: { ...dados, valor_estimado: cents / 100 } } as Proposal
}
