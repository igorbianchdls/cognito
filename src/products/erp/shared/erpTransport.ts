import { z } from 'zod'
import { nonNegativeDecimal } from './erpMoney'
import { ErpDomainError } from './erpErrors'

export const erpVersionSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
export const erpIdempotencyKeySchema = z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9:._-]+$/, 'Identificação de operação inválida.')
export const erpDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(value + 'T12:00:00Z')
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}, 'Data inválida.')
export const erpMoneySchema = z.union([z.string().min(1), z.number().finite()]).transform((value, ctx) => {
  try { return nonNegativeDecimal(value) } catch { ctx.addIssue({ code: 'custom', message: 'Valor monetário inválido.' }); return z.NEVER }
})
const controlledFields = new Set(['tenant_id', 'criado_por', 'atualizado_por', 'requisicao_original', 'requisicao_idempotente', 'historico_estados', 'snapshot_efetivado_em', 'desconto_calculado'])
export const erpValuesSchema = z.record(z.string(), z.unknown()).superRefine((values, ctx) => {
  for (const field of Object.keys(values)) if (controlledFields.has(field)) ctx.addIssue({ code: 'custom', path: [field], message: 'Campo controlado pelo sistema.' })
})
export const erpCreateEnvelopeSchema = z.object({ values: erpValuesSchema.default({}) }).strict()
export const erpUpdateEnvelopeSchema = z.object({ values: erpValuesSchema, expectedVersion: erpVersionSchema }).strict()
const erpRecordSchema = z.object({ id: z.union([z.string().min(1), z.number().int().positive().max(Number.MAX_SAFE_INTEGER)]).transform(String) }).passthrough()
export const erpRecordEnvelopeSchema = z.object({ record: erpRecordSchema }).passthrough()
export const erpListEnvelopeSchema = z.object({
  records: z.array(erpRecordSchema), total: z.number().int().nonnegative(),
  page: z.number().int().positive(), pageSize: z.number().int().positive(),
}).passthrough()
export function readErpIdempotencyKey(headers: Headers, required = false): string | undefined {
  const value = headers.get('idempotency-key')
  if (value === null && !required) return undefined
  const parsed = erpIdempotencyKeySchema.safeParse(value)
  if (!parsed.success) throw new ErpDomainError('INVALID_OPERATION_KEY', 'A identificação da operação está ausente ou é inválida.')
  return parsed.data
}
export type ErpFinancialPosition = Readonly<{
  principal: string; principalBaixado: string; caixaRealizado: string
  creditoAplicado: string; saldoRenegociado: string; saldoAberto: string
}>
export type ErpContractCycle = Readonly<{
  id: string; contratoId: string; versaoId: string; periodoInicio: string; periodoFim: string
  vendaId: string | null; status: string
}>
