// Runs an approved proposal against the ERP: the one path used both by the confirmation and by the
// preview's dry run, so both apply exactly the same business rules.
import { randomUUID } from 'node:crypto'
import { withTransaction, runWithErpTransactionClient, type SQLClient } from '@/lib/postgres'
import { runWithErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { runDryRun } from '@/lib/dryRun'
import { createErpEntityWithClient } from '@/products/erp/server/erpRepository'
import { createManualFinancialTitle } from '@/products/erp/server/erpCrudRepository'
import { createServiceInvoice } from '@/products/erp/server/fiscal/serviceInvoiceRepository'
import { createServiceOrder } from '@/products/erp/server/erpProfessionalRepository'
import { serviceOrderCreateSchema } from '@/products/erp/shared/professionalContracts'
import { createManagementOperation } from '@/products/erp/server/erpManagementRepository'
import { createStockOperation } from '@/products/erp/server/erpStockRepository'
import { createSalesContract } from '@/products/erp/server/erpSalesContracts'
import { proposalEntity, proposalValues, type Proposal } from '../schemas/actionContracts'
import { executeOperation, operationSnapshot } from './operations'
import { proposalReferences } from './references'
import { PluginError } from '../../../shared/contracts'

type Session = { tenantId: number; sharedUserId: number }

/** Executes the proposal with the given client (inside the caller's transaction) and returns the record id. */
export async function runProposal(client: SQLClient, session: Session, proposal: Proposal, idempotencyKey: string): Promise<string> {
  const { tenantId, sharedUserId: actorId } = session
  if ('registro_id' in proposal.dados) {
    return runWithErpTransactionClient(client, () => executeOperation(tenantId, actorId, proposal, idempotencyKey))
  }
  if (proposal.tipo === 'ordem_servico') {
    return String((await runWithErpTransactionClient(client, () => createServiceOrder({ tenantId, actorId, values: serviceOrderCreateSchema.parse(proposal.dados), idempotencyKey }))).id)
  }
  if (proposal.tipo === 'nota_servico') {
    return (await runWithErpTransactionClient(client, () => createServiceInvoice(tenantId, actorId, proposal.dados, idempotencyKey))).record.id
  }
  if (proposal.tipo === 'transferencia_financeira') {
    const d = proposal.dados
    const created = await runWithErpTransactionClient(client, () => createManagementOperation({ tenantId, actorId, resource: 'transferencias-financeiras',
      values: { conta_origem_id: d.conta_origem_id, conta_destino_id: d.conta_destino_id, valor: d.valor, data: d.data, descricao: d.descricao }, idempotencyKey }))
    return String((created as { id: string }).id)
  }
  if (proposal.tipo === 'movimento_estoque') {
    const d = proposal.dados
    // Without a location, the company's default stock location is used.
    const local = d.local_estoque_id ?? Number((await client.query("SELECT id FROM erp.locais_estoque WHERE empresa_id=$1 AND ativo AND excluido_em IS NULL ORDER BY padrao DESC, id LIMIT 1", [tenantId])).rows[0]?.id || 0)
    if (!local) throw new PluginError('INVALID_REFERENCE', 'Cadastre um local de estoque no ERP antes de movimentar.')
    const created = await runWithErpTransactionClient(client, () => createStockOperation({ tenantId, actorId, resource: 'movimentacoes',
      values: { produto_id: d.produto_id, local_estoque_id: local, quantidade: d.quantidade, tipo: d.movimento, custo_unitario: d.custo_unitario, data: d.data, motivo: d.motivo }, idempotencyKey }))
    return String((created as { id: unknown }).id)
  }
  if (proposal.tipo === 'contrato') {
    const d = proposal.dados
    const created = await runWithErpTransactionClient(client, () => createSalesContract(client, { tenantId, actorId, idempotencyKey,
      values: { cliente_id: d.cliente_id, numero: d.numero ?? '', descricao: d.descricao, produto_id: d.produto_id ?? null, servico_id: d.servico_id ?? null, quantidade: d.quantidade,
        valor_unitario: d.valor_unitario, data_inicio: d.data_inicio, data_fim: d.data_fim ?? null, periodicidade: d.periodicidade, dia_vencimento: d.dia_vencimento } }))
    return String(created.id)
  }
  if (proposal.tipo === 'conta_pagar' || proposal.tipo === 'conta_receber') {
    return createManualFinancialTitle(client, tenantId, actorId, proposal.tipo === 'conta_pagar' ? 'pagar' : 'receber', proposal.dados, idempotencyKey)
  }
  const record = await createErpEntityWithClient(client, { tenantId, actorId, entityId: proposalEntity(proposal), values: proposalValues(proposal), idempotencyKey })
  return String(record.id)
}

/**
 * Preview check: runs the proposal for real and rolls everything back, so the preview fails with the same
 * message the confirmation would (balance, credit limit, stock, closed period, fiscal data...).
 * The ERP's document numbers come from a counter table, so they are rolled back too and no number is skipped.
 */
export async function dryRunProposal(session: Session & { timeZone?: string }, proposal: Proposal) {
  await runWithErpDatabaseContext({ tenantId: session.tenantId, userId: session.sharedUserId, statementTimeoutMs: 10000, timeZone: session.timeZone }, () =>
    runDryRun(rollback => withTransaction(async client => {
      await client.query("SELECT set_config('statement_timeout','10000',true),set_config('lock_timeout','3000',true)")
      // The company/user context (app.erp_user_id...) is applied by the first erp.* query of the transaction.
      // Apply it now: some operations start with shared.* checks (has_erp_capability) that read it.
      await client.query('SELECT 1 FROM erp.contas_financeiras WHERE empresa_id=$1 LIMIT 1', [session.tenantId])
      // Same sequence as the confirmation (decideDraft): references, the record snapshot with its locks, then the operation.
      await proposalReferences(session.tenantId, proposal, client)
      if ('registro_id' in proposal.dados) await operationSnapshot(session.tenantId, proposal, client)
      // Every nested ERP transaction joins this one, so nothing commits on its own.
      await runWithErpTransactionClient(client, () => runProposal(client, session, proposal, `dryrun:${randomUUID()}`))
      rollback()
    })))
}
