import { z } from 'zod'

const column = z.string().trim().min(1).max(80)
// Mapeamento das colunas do CSV do banco (salvo na conta para as próximas importações).
export const csvMappingSchema = z.object({
  separador: z.enum([';', ',', '\t']).optional(), linhas_ignorar: z.number().int().min(0).max(50).optional(),
  formato_data: z.enum(['dd/mm/aaaa', 'aaaa-mm-dd']).optional(), decimal: z.enum([',', '.']).optional(),
  coluna_data: column, coluna_descricao: column, coluna_valor: column.optional(), coluna_credito: column.optional(),
  coluna_debito: column.optional(), coluna_documento: column.optional(), coluna_saldo: column.optional(),
}).strict()

export const bankImportBody = z.object({
  accountId: z.union([z.number(), z.string().regex(/^[1-9]\d*$/).transform(Number)]).pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER)),
  fileName: z.string().trim().min(1).max(255).default('extrato.ofx'),
  content: z.string().min(1).max(4 * 1024 * 1024),
  // OFX (padrão) ou CSV; no CSV, sem mapeamento usa o salvo na conta.
  format: z.enum(['ofx', 'csv']).optional(),
  mapping: csvMappingSchema.optional(),
  // Regras de lançamento (tarifa, IOF, rendimento…) aplicadas às transações novas; padrão: sim.
  applyRules: z.boolean().optional(),
}).strict()
