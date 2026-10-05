import { z } from 'zod'
import { financialTitleCreateSchema, financialTitleEditSchema } from '../../shared/financialTitleContracts'
import { ErpDomainError } from '../../shared/erpErrors'

export function readFinancialSide(side: string): 'pagar' | 'receber' {
  if (side !== 'pagar' && side !== 'receber') throw new ErpDomainError('NOT_FOUND', 'Tipo de título não encontrado.', 404)
  return side
}
export const financialTitleBody = (side: 'pagar' | 'receber', edit = false) => z.object({ values: edit ? financialTitleEditSchema(side) : financialTitleCreateSchema(side) }).strict()
export const financialTitleDeleteBody = z.object({ motivo: z.string().trim().min(3).max(1000) }).strict()
export function readTitlePrecondition(headers: Headers) {
  const match = /^"([a-f0-9]{64})"$/.exec(headers.get('if-match') || '')
  if (!match) throw new ErpDomainError('PRECONDITION_REQUIRED', 'Consulte o título e envie o ETag recebido no cabeçalho If-Match.', 428)
  return match[1]
}
