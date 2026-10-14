import { z } from 'zod'

export const ACCOUNTING_CLASSIFICATIONS = [
  { value: 'ativo', label: 'Ativo' }, { value: 'passivo', label: 'Passivo' },
  { value: 'patrimonio_liquido', label: 'Patrimônio líquido' }, { value: 'receita', label: 'Receitas' },
  { value: 'custo', label: 'Custos' }, { value: 'despesa', label: 'Despesas' },
] as const

export const accountingLinkSchema = z.preprocess(value =>
  value === '' || value === 'nenhuma' || value == null ? null : value,
  z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable(),
)
export const accountingAccountSchema = z.object({
  codigo: z.string().trim().min(1).max(60).regex(/^\d+(\.\d+)*$/, 'Use um código numérico, como 1.1.01.'),
  nome: z.string().trim().min(1).max(180),
  descricao: z.string().trim().max(2000).optional().default(''),
  conta_pai_id: accountingLinkSchema,
  tipo: z.enum(['sintetica', 'analitica']),
  classificacao: z.enum(['ativo', 'passivo', 'patrimonio_liquido', 'receita', 'custo', 'despesa']),
  natureza: z.enum(['devedora', 'credora']),
  status: z.preprocess(value => value === '' || value == null ? 'ativo' : value, z.enum(['ativo', 'inativo'])),
}).strict()
export type AccountingAccountValues = z.infer<typeof accountingAccountSchema>
