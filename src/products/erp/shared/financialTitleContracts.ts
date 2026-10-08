import { z } from 'zod'
import { erpDateSchema } from './erpTransport'

const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const money = z.number().finite().min(0).max(100000000).multipleOf(0.01)
const installments = z.array(z.object({ data_vencimento: erpDateSchema, valor: money.refine(value => value > 0) }).strict()).min(1).max(48)

export function financialTitleCreateSchema(side: 'pagar' | 'receber') {
  return z.object({ ...(side === 'pagar' ? { fornecedor_id: id } : { cliente_id: id }),
    descricao: z.string().trim().min(1).max(200), numero_documento: z.string().trim().max(60).optional(),
    valor_total: money.refine(value => value > 0), data_competencia: erpDateSchema, data_emissao: erpDateSchema,
    categoria_id: id, centro_custo_id: id.optional(), conta_financeira_id: id.optional(),
    observacoes: z.string().trim().max(2000).optional(), parcelas: installments,
    // Previsão: entra no fluxo de caixa projetado, não no resultado, e só recebe baixa depois de efetivada.
    tipo_lancamento: z.enum(['previsao', 'efetivo']).optional(),
  }).strict().superRefine((value, context) => {
    const total = value.parcelas.reduce((sum, part) => sum + Math.round(part.valor * 100), 0)
    if (total !== Math.round(value.valor_total * 100)) context.addIssue({ code: 'custom', path: ['parcelas'], message: 'A soma das parcelas deve corresponder ao valor total.' })
  })
}

/** Full edit of the title and schedule; omitted optional fields retain their current values. */
export function financialTitleEditSchema(side: 'pagar' | 'receber') {
  return financialTitleCreateSchema(side).innerType().extend({
    numero_documento: z.string().trim().max(60).nullable().optional(), centro_custo_id: id.nullable().optional(),
    conta_financeira_id: id.nullable().optional(), observacoes: z.string().trim().max(2000).nullable().optional(),
  }).strict().superRefine((value, context) => {
    if (value.parcelas.reduce((sum, part) => sum + Math.round(part.valor * 100), 0) !== Math.round(value.valor_total * 100)) context.addIssue({ code: 'custom', path: ['parcelas'], message: 'A soma das parcelas deve corresponder ao valor total.' })
  })
}
