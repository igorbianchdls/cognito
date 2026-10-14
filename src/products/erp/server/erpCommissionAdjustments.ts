import type { SQLClient } from '@/lib/postgres'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { financialCompositionSql } from './erpFinancialComposition'
import { assertErpPeriodOpen } from './erpPeriodRepository'
import { erpToday } from './erpBusinessDate'

type Query = Pick<SQLClient, 'query'>
type AdjustmentInput = { tenantId: number; actorId: number; saleId: number; motivo: string; cancel?: boolean; reductions?: Array<{ itemId: number; valor: number }> }
const cents = (value: unknown) => Math.round(Number(value || 0) * 100)
const amount = (value: number) => value / 100

// Provisões conservam valor original e registram os ajustes por item; baixas nunca são reescritas.
export async function adjustSaleCommissions(client: Query, input: AdjustmentInput) {
  const sellers = (await client.query("SELECT DISTINCT vendedor_id FROM erp.comissoes_lancamentos WHERE empresa_id=$1 AND venda_id=$2 AND status='ativa' ORDER BY vendedor_id", [input.tenantId, input.saleId])).rows
  for (const seller of sellers) await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`erp:comissao:${input.tenantId}:${seller.vendedor_id}`])
  const rows = (await client.query("SELECT * FROM erp.comissoes_lancamentos WHERE empresa_id=$1 AND venda_id=$2 AND status='ativa' ORDER BY id FOR UPDATE", [input.tenantId, input.saleId])).rows
  const changes = rows.map(row => {
    const reduction = input.reductions?.find(item => item.itemId === Number(row.venda_item_id))?.valor || 0
    const base = input.cancel ? 0 : Math.max(cents(row.valor_base) - cents(reduction), 0)
    const value = Math.round(base * Number(row.percentual) / 100)
    return { row, base, value, cut: Math.max(cents(row.valor_pago) - value, 0) }
  })
  const cuts: Array<{ itemId: number; paymentId: number; titleId: number; cut: number }> = []
  if (changes.some(change => change.cut > 0)) {
    const allowed = (await client.query('SELECT shared.has_erp_capability($1::bigint,$2::text) AS ok', [input.tenantId, 'erp.financeiro.gerenciar'])).rows[0]?.ok
    if (!allowed) throw new ErpDomainError('COMMISSION_FINANCIAL_PERMISSION', 'Esta venda possui comissão provisionada. Quem gerencia o financeiro precisa registrar esta alteração.', 403)
    for (const change of changes.filter(change => change.cut > 0)) {
      const links = (await client.query(
        `SELECT i.id,i.pagamento_id,p.conta_pagar_id,i.valor-i.valor_ajustado AS saldo
         FROM erp.comissoes_pagamentos_itens i JOIN erp.comissoes_pagamentos p ON p.empresa_id=i.empresa_id AND p.id=i.pagamento_id
         WHERE i.empresa_id=$1 AND i.lancamento_id=$2 AND i.valor>i.valor_ajustado ORDER BY i.id DESC FOR UPDATE OF i,p`, [input.tenantId, change.row.id])).rows
      let remaining = change.cut
      for (const link of links) {
        const cut = Math.min(remaining, cents(link.saldo))
        if (cut > 0) cuts.push({ itemId: Number(link.id), paymentId: Number(link.pagamento_id), titleId: Number(link.conta_pagar_id), cut })
        remaining -= cut
        if (!remaining) break
      }
      if (remaining) throw new ErpDomainError('COMMISSION_PROVISION_INCONSISTENT', 'A comissão não corresponde às provisões disponíveis. Confira o histórico antes de alterar a venda.', 409)
    }
  }
  for (const cut of cuts) await client.query('UPDATE erp.comissoes_pagamentos_itens SET valor_ajustado=valor_ajustado+$3 WHERE empresa_id=$1 AND id=$2', [input.tenantId,cut.itemId,amount(cut.cut)])
  for (const paymentId of new Set(cuts.map(cut => cut.paymentId))) {
    const total = cuts.filter(cut => cut.paymentId===paymentId).reduce((sum,cut) => sum+cut.cut,0)
    await client.query(`UPDATE erp.comissoes_pagamentos SET valor_ajustado=valor_ajustado+$3,
      ajustes=ajustes||jsonb_build_array(jsonb_build_object('venda_id',$4::bigint,'valor',$3::numeric,'motivo',$5::text,'ator_id',$6::bigint,'em',now())),atualizado_por=$6
      WHERE empresa_id=$1 AND id=$2`,[input.tenantId,paymentId,amount(total),input.saleId,input.motivo,input.actorId])
  }
  for (const titleId of [...new Set(cuts.map(cut => cut.titleId))].sort((a,b) => a-b)) {
    const reduction = cuts.filter(cut => cut.titleId === titleId).reduce((sum, cut) => sum + cut.cut, 0)
    const title = (await client.query('SELECT id,valor_total,status,data_competencia::text FROM erp.contas_pagar WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL FOR UPDATE', [input.tenantId, titleId])).rows[0]
    if (!title || !['aberto','vencido'].includes(String(title.status))) throw new ErpDomainError('COMMISSION_PROVISION_SETTLED', 'A comissão possui pagamento, renegociação ou provisão já encerrada. Trate o financeiro antes de cancelar ou devolver a venda.', 409)
    const parts = (await client.query(`SELECT parcelas.*,composicao.dinheiro,composicao.credito,composicao.transferido
      FROM erp.contas_pagar_parcelas parcelas ${financialCompositionSql('pagar')}
      WHERE parcelas.empresa_id=$1 AND parcelas.conta_pagar_id=$2 AND parcelas.excluido_em IS NULL AND parcelas.status<>'cancelado'
      ORDER BY parcelas.id DESC FOR UPDATE OF parcelas`, [input.tenantId, titleId])).rows
    if (!parts.length || parts.some(part => cents(part.dinheiro) || cents(part.credito) || cents(part.transferido) || part.conciliado)) throw new ErpDomainError('COMMISSION_PROVISION_SETTLED', 'A comissão já possui baixa ou conciliação. Estorne ou compense a comissão no financeiro antes de alterar a venda.', 409)
    if (parts.reduce((sum,part) => sum+cents(part.valor),0) !== cents(title.valor_total) || reduction > cents(title.valor_total)) throw new ErpDomainError('COMMISSION_PROVISION_INCONSISTENT', 'O valor da provisão de comissão não corresponde às parcelas. Confira o financeiro.', 409)
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: String(title.data_competencia || erpToday()) })
    const nextTotal = cents(title.valor_total) - reduction
    let left = reduction
    for (const part of parts) {
      const cut = Math.min(left, cents(part.valor)), next = cents(part.valor) - cut
      if (cut) await client.query(`UPDATE erp.contas_pagar_parcelas SET
        valor=CASE WHEN $3=0 THEN valor ELSE $3 END,
        valor_bruto=CASE WHEN $3=0 THEN valor_bruto ELSE $3 END,
        valor_liquido=CASE WHEN $3=0 THEN valor_liquido ELSE $3 END,
        status=CASE WHEN $3=0 THEN 'cancelado' ELSE status END,atualizado_por=$4
        WHERE empresa_id=$1 AND id=$2`, [input.tenantId, part.id, amount(next), input.actorId])
      left -= cut
    }
    await client.query(`UPDATE erp.contas_pagar SET valor_total=CASE WHEN $3=0 THEN valor_total ELSE $3 END,
      status=CASE WHEN $3=0 THEN 'cancelado' ELSE status END,
      cancelado_em=CASE WHEN $3=0 THEN now() ELSE cancelado_em END,
      motivo_cancelamento=CASE WHEN $3=0 THEN $5 ELSE motivo_cancelamento END,atualizado_por=$4
      WHERE empresa_id=$1 AND id=$2`, [input.tenantId,titleId,amount(nextTotal),input.actorId,input.motivo])
    await client.query(`INSERT INTO erp.contas_pagar_eventos(empresa_id,conta_pagar_id,evento,dados,criado_por)
      VALUES($1,$2,'comissao_ajustada',$3::jsonb,$4)`, [input.tenantId,titleId,JSON.stringify({ venda_id:input.saleId,motivo:input.motivo,valor_anterior:amount(cents(title.valor_total)),reducao:amount(reduction),valor_ativo:amount(nextTotal) }),input.actorId])
  }
  for (const {row,base,value,cut} of changes) await client.query(`UPDATE erp.comissoes_lancamentos SET valor_base=$3,valor=$4,valor_pago=valor_pago-$5,
    status=CASE WHEN $7 THEN 'cancelada' ELSE status END,cancelado_em=CASE WHEN $7 THEN now() ELSE cancelado_em END,atualizado_por=$6
    WHERE empresa_id=$1 AND id=$2`,[input.tenantId,row.id,amount(base),amount(value),amount(cut),input.actorId,Boolean(input.cancel)])
}
