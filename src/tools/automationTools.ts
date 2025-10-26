import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

const fmt = (params: unknown[]) => (params.length ? JSON.stringify(params) : '[]')

export const findFornecedor = tool({
  description: 'Busca fornecedor por CNPJ ou nome (schema entidades)',
  inputSchema: z.object({
    cnpj: z.string().optional().describe('CNPJ numérico, com ou sem pontuação'),
    nome: z.string().optional().describe('Nome do fornecedor (parcial ou completo)')
  }),
  execute: async ({ cnpj, nome }) => {
    try {
      const conditions: string[] = []
      const params: unknown[] = []
      let i = 1

      if (cnpj) {
        conditions.push(`REPLACE(REPLACE(REPLACE(f.cnpj, '.', ''), '/', ''), '-', '') = $${i}`)
        params.push(cnpj.replace(/\D/g, ''))
        i += 1
      }
      if (nome) {
        conditions.push(`LOWER(f.nome) LIKE LOWER($${i})`)
        params.push(`%${nome}%`)
        i += 1
      }

      if (conditions.length === 0) {
        return { success: false, message: 'Informe cnpj ou nome', rows: [], count: 0 }
      }

      const where = `WHERE ${conditions.join(' AND ')}`
      const sql = `
        SELECT f.id, f.nome AS nome, f.cnpj, f.email, f.telefone
        FROM entidades.fornecedores f
        ${where}
        ORDER BY f.nome ASC
        LIMIT 5
      `.trim()

      const rows = await runQuery<{ id: string; nome: string; cnpj: string | null; email: string | null; telefone: string | null }>(sql, params)
      return { success: rows.length > 0, message: rows.length ? `Encontrado(s) ${rows.length} fornecedor(es)` : 'Nenhum fornecedor encontrado', rows, count: rows.length, sql_query: sql, sql_params: fmt(params) }
    } catch (error) {
      return { success: false, message: `Erro ao buscar fornecedor: ${error instanceof Error ? error.message : String(error)}`, rows: [], count: 0 }
    }
  }
})

export const createFornecedor = tool({
  description: 'Cria fornecedor (schema gestaofinanceira)',
  inputSchema: z.object({
    nome: z.string().min(2),
    cnpj: z.string().optional(),
    email: z.string().optional(),
    telefone: z.string().optional()
  }),
  execute: async ({ nome, cnpj, email, telefone }) => {
    try {
      const insertSql = `
        INSERT INTO gestaofinanceira.fornecedores (nome_fornecedor, cnpj, email, telefone)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nome_fornecedor AS nome, cnpj, email, telefone
      `.trim()
      const params = [nome, cnpj ?? null, email ?? null, telefone ?? null]
      const [row] = await runQuery<{ id: string; nome: string; cnpj: string | null; email: string | null; telefone: string | null }>(insertSql, params)
      return { success: true, message: `Fornecedor criado: ${row?.nome}`, fornecedor: row, sql_query: insertSql, sql_params: fmt(params) }
    } catch (error) {
      return { success: false, message: `Erro ao criar fornecedor: ${error instanceof Error ? error.message : String(error)}` }
    }
  }
})

export const createContaAPagar = tool({
  description: 'Cria conta a pagar (schema gestaofinanceira)',
  inputSchema: z.object({
    fornecedor_id: z.string(),
    descricao: z.string(),
    valor: z.number().positive(),
    data_emissao: z.string().describe('YYYY-MM-DD'),
    data_vencimento: z.string().describe('YYYY-MM-DD'),
    numero_documento: z.string().optional(),
    categoria_id: z.string().optional(),
    status: z.enum(['Pendente', 'Pago', 'Cancelado']).default('Pendente')
  }),
  execute: async ({ fornecedor_id, descricao, valor, data_emissao, data_vencimento, numero_documento, categoria_id, status }) => {
    try {
      const insertSql = `
        INSERT INTO gestaofinanceira.contas_a_pagar
          (fornecedor_id, descricao, valor, data_emissao, data_vencimento, status, numero_documento, categoria_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, fornecedor_id, descricao, valor, data_emissao, data_vencimento, status, numero_documento, categoria_id
      `.trim()
      const params = [fornecedor_id, descricao, valor, data_emissao, data_vencimento, status, numero_documento ?? null, categoria_id ?? null]
      const [row] = await runQuery(insertSql, params)
      return { success: true, message: 'Conta a pagar criada com sucesso', conta: row, sql_query: insertSql, sql_params: fmt(params) }
    } catch (error) {
      return { success: false, message: `Erro ao criar conta a pagar: ${error instanceof Error ? error.message : String(error)}` }
    }
  }
})

export const automationSummarySchema = z.object({
  ocr: z.object({
    fornecedor_nome: z.string().optional(),
    fornecedor_cnpj: z.string().optional(),
    numero_documento: z.string().optional(),
    data_emissao: z.string().optional(),
    data_vencimento: z.string().optional(),
    valor_total: z.number().optional(),
  }).optional(),
  fornecedor: z.object({
    found: z.boolean(),
    id: z.string().optional(),
    nome: z.string().optional(),
    cnpj: z.string().optional(),
  }).optional(),
  contaAPagar: z.object({
    id: z.string().optional(),
    descricao: z.string().optional(),
    data_vencimento: z.string().optional(),
    valor: z.number().optional(),
  }).optional(),
  warnings: z.array(z.string()).optional(),
})

export const automationSummary = tool({
  description: 'Exibe resumo de automação executada (UI)',
  inputSchema: automationSummarySchema,
  execute: async (payload) => {
    return { success: true, ...payload }
  },
})

export type AutomationSummaryOutput = z.infer<typeof automationSummarySchema>
