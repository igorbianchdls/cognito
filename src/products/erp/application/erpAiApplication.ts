import { runQuery } from '@/lib/postgres'
import {
  cancelErpPurchase,
  cancelErpSale,
  confirmErpPurchase,
  confirmErpSale,
  createErpEntityRecord,
  getErpEntityRecord,
  getErpPurchaseDetails,
  getErpSaleDetails,
  listErpEntityPage,
  listErpPayments,
  reverseErpPayment,
  searchErpCatalog,
  settlePayableInstallment,
  settleReceivableInstallment,
  updateErpEntityRecord,
  updateErpPurchaseDraft,
  updateErpSaleDraft,
} from '@/products/erp/server/erpRepository'
import {
  convertQuoteToSale,
  createServiceOrder,
  getProfessionalOverview,
  getServiceOrder,
  listProfessionalReport,
  listServiceOrders,
  runQuoteAction,
  runServiceOrderAction,
} from '@/products/erp/server/erpProfessionalRepository'
import type { ErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'
import type { ServiceOrderCreateInput } from '@/products/erp/shared/professionalContracts'

type Actor = { tenantId: number; actorId: number }
type Page = { query?: string; filters?: Record<string, string>; page?: number; pageSize?: number }

export const erpAiApplication = {
  listModule: (input: { tenantId: number; entityId: ErpConnectedModuleId } & Page) => listErpEntityPage(input),
  getModuleRecord: (input: { tenantId: number; entityId: ErpConnectedModuleId; id: number }) => getErpEntityRecord(input),
  saveModuleRecord: (input: Actor & {
    entityId: ErpConnectedModuleId
    id?: number
    expectedVersion?: number
    values: Record<string, unknown>
    idempotencyKey?: string
  }) => input.id
    ? updateErpEntityRecord({ ...input, id: input.id, expectedVersion: input.expectedVersion || 1 })
    : createErpEntityRecord(input),
  searchCatalog: searchErpCatalog,
  getSale: (tenantId: number, id: number) => getErpSaleDetails(tenantId, id),
  saveSale: (input: Actor & { id?: number; expectedVersion?: number; values: Record<string, unknown>; idempotencyKey?: string }) => input.id
    ? updateErpSaleDraft({ ...input, id: input.id, expectedVersion: input.expectedVersion || 1 })
    : createErpEntityRecord({ ...input, entityId: 'pedidos' }),
  confirmSale: (input: Actor & { id: number }) => confirmErpSale({ ...input, saleId: input.id }),
  cancelSale: (input: Actor & { id: number; reason?: string | null }) => cancelErpSale(input),
  getPurchase: (tenantId: number, id: number) => getErpPurchaseDetails(tenantId, id),
  savePurchase: (input: Actor & { id?: number; expectedVersion?: number; values: Record<string, unknown>; idempotencyKey?: string }) => input.id
    ? updateErpPurchaseDraft({ ...input, id: input.id, expectedVersion: input.expectedVersion || 1 })
    : createErpEntityRecord({ ...input, entityId: 'pedidos-compra' }),
  confirmPurchase: (input: Actor & { id: number }) => confirmErpPurchase(input),
  cancelPurchase: (input: Actor & { id: number }) => cancelErpPurchase(input),
  listPayments: listErpPayments,
  settleReceivable: (input: Actor & { id: number; values: Record<string, unknown>; idempotencyKey?: string }) => settleReceivableInstallment(input),
  settlePayable: (input: Actor & { id: number; values: Record<string, unknown>; idempotencyKey?: string }) => settlePayableInstallment(input),
  reversePayment: (input: Actor & { id: number; reason?: string | null; idempotencyKey?: string }) => reverseErpPayment(input),
  listServiceOrders,
  getServiceOrder,
  createServiceOrder: (input: Actor & { values: ServiceOrderCreateInput; idempotencyKey?: string }) => createServiceOrder(input),
  runServiceOrderAction,
  runQuoteAction,
  convertQuoteToSale,
  getOverview: getProfessionalOverview,
  runReport: listProfessionalReport,
}

export async function listErpCostCenters(input: { tenantId: number; query?: string; active?: boolean }) {
  return runQuery<Record<string, unknown>>(
    `SELECT id::text, nome, codigo, ativo, criado_em, atualizado_em
     FROM erp.centros_custo
     WHERE tenant_id = $1 AND excluido_em IS NULL
       AND ($2 = '' OR concat_ws(' ', nome, codigo) ILIKE '%' || $2 || '%')
       AND ($3::boolean IS NULL OR ativo = $3)
     ORDER BY nome LIMIT 200`,
    [input.tenantId, input.query || '', input.active ?? null],
  )
}

export async function saveErpCostCenter(input: Actor & {
  id?: number
  name: string
  code?: string | null
  active?: boolean
}) {
  const rows = input.id
    ? await runQuery<Record<string, unknown>>(
      `UPDATE erp.centros_custo SET nome = $3, codigo = $4, ativo = $5, atualizado_por = $6
       WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL
       RETURNING id::text, nome, codigo, ativo`,
      [input.tenantId, input.id, input.name.trim(), input.code?.trim() || null, input.active ?? true, input.actorId],
    )
    : await runQuery<Record<string, unknown>>(
      `INSERT INTO erp.centros_custo (tenant_id, nome, codigo, ativo, criado_por, atualizado_por)
       VALUES ($1,$2,$3,$4,$5,$5) RETURNING id::text, nome, codigo, ativo`,
      [input.tenantId, input.name.trim(), input.code?.trim() || null, input.active ?? true, input.actorId],
    )
  if (!rows[0]) throw new Error('Centro de custo nao encontrado.')
  return rows[0]
}
