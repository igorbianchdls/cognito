import { z } from 'zod'

// Contratos de saída declarados no tools/list. O SDK valida structuredContent contra eles,
// por isso tipos estritos só onde o formato é garantido; os demais campos são documentados.
const row = z.record(z.unknown())
const rows = z.array(row)
export function envelope(data: z.ZodTypeAny) {
  return z.object({ ok: z.literal(true), execution_id: z.string().uuid(), empresa_id: z.number().nullable(), data })
}
export const profileFields = {
  id: z.string().min(1).describe('Identificador estável da conta conectada.'), name: z.string(),
  nickname: z.string().optional(), email: z.string().optional(),
}
export const outputs = {
  access: z.object({
    usuario_id: z.number(),
    empresas: z.array(z.object({ id: z.number(), name: z.string(), profile: z.string(), capabilities: z.array(z.string()) }).passthrough())
      .describe('Empresas autorizadas; use id como empresa_id nas demais tools.'),
    empresa_selecionada: z.number().nullable(),
  }).passthrough(),
  page: z.object({
    records: rows.describe('Registros da página atual.'),
    page: z.unknown().optional(), pageSize: z.unknown().optional(),
    total: z.unknown().optional().describe('Total de registros filtrados, quando disponível.'),
    hasMore: z.boolean().optional().describe('Há mais páginas; não afirme totais somando apenas esta página.'),
    summary: row.optional().describe('Totais de todos os registros filtrados, inclusive de outras páginas.'),
  }).passthrough(),
  record: z.object({ record: row.optional() }).passthrough(),
  sale: z.object({ sale: row, items: rows, totalItems: z.number(), itemsTruncated: z.boolean(), installments: rows.optional() }).passthrough(),
  purchase: z.object({ purchase: row, items: rows, totalItems: z.number(), itemsTruncated: z.boolean(), installments: rows.optional() }).passthrough(),
  financialTitle: z.object({ record: row.optional(), installments: rows.optional(), history: rows.optional() }).passthrough(),
  installment: z.object({ record: row.optional(), history: rows.optional() }).passthrough(),
  analysis: z.object({ tipo: z.string(), inicio: z.string(), fim: z.string(), summary: row.optional(), records: rows }).passthrough(),
  report: z.object({ report: z.string(), records: rows, hasMore: z.boolean().optional() }).passthrough(),
  overview: row,
  draft: z.object({
    rascunho_id: z.string().uuid(), empresa_id: z.number(),
    status: z.enum(['pending','saved','cancelled','expired']).describe('Somente saved com registro_id confirma a execução.'),
    registro_id: z.string().nullable(),
    etapa: z.enum(['previa','executado']),
    proposta: row.describe('Dados da operação com totais calculados pelo ERP.'),
    alvo: row.nullable().describe('Estado atual do registro alterado, para comparar antes e depois.'),
    expira_em: z.unknown(),
    confirmar: z.object({ tool: z.string(), argumentos: row }).optional()
      .describe('Chamada para executar, somente após confirmação explícita do usuário.'),
  }).passthrough(),
}
