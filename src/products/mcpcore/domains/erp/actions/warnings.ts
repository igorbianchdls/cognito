// Avisos da prévia: situações permitidas que merecem atenção antes de confirmar (não bloqueiam).
import { runQuery } from '@/lib/postgres'
import { accountBalance } from '@/products/erp/server/erpBankRules'
import { avisoTituloParecidoComVenda } from '@/products/erp/regras/contas-receber'
import { avisoSaldoNegativo } from '@/products/erp/regras/contas-bancarias'
import type { Proposal } from '../schemas/actionContracts'

export async function proposalWarnings(tenantId: number, proposal: Proposal): Promise<string[]> {
  const avisos: string[] = []
  const dados = proposal.dados as Record<string, unknown>
  if (proposal.tipo === 'conta_receber' && dados.cliente_id && dados.valor_total) {
    // CR-03: venda confirmada do mesmo cliente, mesmo total, a até 60 dias da competência do título.
    const vendas = await runQuery<{ numero: string; total: string }>(
      `SELECT numero, total FROM erp.vendas WHERE empresa_id=$1 AND cliente_id=$2 AND tipo_documento='venda' AND status='confirmada'
         AND excluido_em IS NULL AND total=$3::numeric AND abs(data_venda - coalesce($4::date, CURRENT_DATE)) <= 60
       ORDER BY data_venda DESC LIMIT 3`,
      [tenantId, dados.cliente_id, dados.valor_total, dados.data_competencia || null])
    const aviso = avisoTituloParecidoComVenda({ vendas: vendas.map(venda => ({ numero: venda.numero, total: Number(venda.total) })) })
    if (aviso) avisos.push(aviso)
  }
  if (proposal.tipo === 'transferencia_financeira') {
    // CB-10: saldo do ERP na conta de origem depois da transferência.
    const origem = Number(dados.conta_origem_id)
    const [conta] = await runQuery<{ nome: string }>('SELECT nome FROM erp.contas_financeiras WHERE empresa_id=$1 AND id=$2', [tenantId, origem])
    const saldo = await accountBalance(tenantId, origem)
    const aviso = saldo == null || !conta ? null : avisoSaldoNegativo({ conta: conta.nome, saldo, valor: Number(dados.valor) })
    if (aviso) avisos.push(aviso)
  }
  return avisos
}
