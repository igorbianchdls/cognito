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
  description: 'Cria fornecedor (schema entidades)',
  inputSchema: z.object({
    nome: z.string().min(2),
    cnpj: z.string().optional(),
    email: z.string().optional(),
    telefone: z.string().optional()
  }),
  execute: async ({ nome, cnpj, email, telefone }) => {
    try {
      const insertSql = `
        INSERT INTO entidades.fornecedores (nome, cnpj, email, telefone)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nome, cnpj, email, telefone
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
  description: 'Cria conta a pagar (schema financeiro)',
  inputSchema: z.object({
    fornecedor_id: z.string(),
    descricao: z.string(),
    valor_total: z.number().positive(),
    data_emissao: z.string().describe('YYYY-MM-DD'),
    data_vencimento: z.string().describe('YYYY-MM-DD'),
    status: z.enum(['Pendente', 'Pago', 'Cancelado']).default('Pendente'),
    numero_documento: z.string().optional(),
    categoria_id: z.string().optional(),
    conta_financeira_id: z.string().optional(),
    centro_custo_id: z.string().optional(),
    tipo_titulo: z.string().optional(),
  }),
  execute: async (payload) => {
    try {
      const {
        fornecedor_id,
        descricao,
        valor_total,
        data_emissao,
        data_vencimento,
        status,
        numero_documento,
        categoria_id,
        conta_financeira_id,
        centro_custo_id,
        tipo_titulo,
      } = payload

      const columns: string[] = [
        'fornecedor_id',
        'descricao',
        'valor_total',
        'data_emissao',
        'data_vencimento',
        'status',
      ]
      const values: unknown[] = [
        fornecedor_id,
        descricao,
        valor_total,
        data_emissao,
        data_vencimento,
        status,
      ]

      const addOpt = (col: string, v: unknown) => {
        if (typeof v !== 'undefined') {
          columns.push(col)
          values.push(v)
        }
      }

      addOpt('numero_documento', numero_documento ?? null)
      addOpt('categoria_id', categoria_id ?? null)
      addOpt('conta_financeira_id', conta_financeira_id ?? null)
      addOpt('centro_custo_id', centro_custo_id ?? null)
      addOpt('tipo_titulo', tipo_titulo ?? null)

      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
      const insertSql = `
        INSERT INTO financeiro.contas_a_pagar (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING id, fornecedor_id, descricao, valor_total, data_emissao, data_vencimento, status,
                  numero_documento, categoria_id, conta_financeira_id, centro_custo_id, tipo_titulo
      `.trim()
      const [row] = await runQuery<Record<string, unknown>>(insertSql, values)
      return { success: true, message: 'Conta a pagar criada com sucesso', conta: row, sql_query: insertSql, sql_params: fmt(values) }
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
