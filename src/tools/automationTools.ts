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
        conditions.push(`LOWER(f.nome_fantasia) LIKE LOWER($${i})`)
        params.push(`%${nome}%`)
        i += 1
      }

      if (conditions.length === 0) {
        return { success: false, message: 'Informe cnpj ou nome', rows: [], count: 0 }
      }

      const where = `WHERE ${conditions.join(' AND ')}`
      const sql = `
        SELECT f.id, f.nome_fantasia AS nome, f.cnpj, f.email, f.telefone
        FROM entidades.fornecedores f
        ${where}
        ORDER BY f.nome_fantasia ASC
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
        INSERT INTO entidades.fornecedores (nome_fantasia, cnpj, email, telefone)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nome_fantasia AS nome, cnpj, email, telefone
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
  description: 'Cria conta a pagar (financeiro.lancamentos_financeiros)',
  inputSchema: z.object({
    fornecedor_id: z.string(),
    descricao: z.string(),
    valor_total: z.number().positive(),
    data_emissao: z.string().describe('YYYY-MM-DD'),
    data_vencimento: z.string().describe('YYYY-MM-DD'),
    // Aceita qualquer string e normaliza internamente (ex.: 'Pendente' -> 'pendente')
    status: z.string().optional(),
    categoria_id: z.string().optional(),
    conta_financeira_id: z.string().optional(),
    centro_custo_id: z.string().optional(),
    tenant_id: z.number().optional(),
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
        categoria_id,
        conta_financeira_id,
        centro_custo_id,
        tenant_id,
      } = payload

      // Normaliza status para minúsculo conforme schema unificado
      const normalizedStatusRaw = (status || 'pendente').toString().trim().toLowerCase()
      const normalizedStatus = ['pendente', 'pago', 'cancelado'].includes(normalizedStatusRaw)
        ? normalizedStatusRaw
        : 'pendente'

      // Monta colunas/valores para lancamentos_financeiros
      const columns: string[] = [
        'tenant_id',
        'tipo',
        'descricao',
        'valor',
        'data_lancamento',
        'data_vencimento',
        'status',
        'entidade_id',
      ]
      const entidadeId = fornecedor_id ? Number(fornecedor_id) : null
      const categoriaIdNum = typeof categoria_id !== 'undefined' && categoria_id !== null ? Number(categoria_id) : undefined
      const contaFinanceiraIdNum = typeof conta_financeira_id !== 'undefined' && conta_financeira_id !== null ? Number(conta_financeira_id) : undefined
      const centroCustoIdNum = typeof centro_custo_id !== 'undefined' && centro_custo_id !== null ? Number(centro_custo_id) : undefined

      const values: unknown[] = [
        tenant_id ?? null,
        'conta_a_pagar',
        descricao,
        Math.abs(valor_total),
        data_emissao,
        data_vencimento,
        normalizedStatus,
        entidadeId,
      ]

      const addOpt = (col: string, v: unknown) => {
        if (typeof v !== 'undefined') {
          columns.push(col)
          values.push(v)
        }
      }

      addOpt('categoria_id', typeof categoriaIdNum === 'number' && !Number.isNaN(categoriaIdNum) ? categoriaIdNum : null)
      addOpt('conta_financeira_id', typeof contaFinanceiraIdNum === 'number' && !Number.isNaN(contaFinanceiraIdNum) ? contaFinanceiraIdNum : null)
      addOpt('centro_custo_id', typeof centroCustoIdNum === 'number' && !Number.isNaN(centroCustoIdNum) ? centroCustoIdNum : null)

      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
      const insertSql = `
        INSERT INTO financeiro.lancamentos_financeiros (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING id, tipo, descricao, valor, data_lancamento, data_vencimento, status,
                  entidade_id, categoria_id, conta_financeira_id, centro_custo_id
      `.trim()
      const [row] = await runQuery<Record<string, unknown>>(insertSql, values)

      // Mapeia campos esperados pelo card/resumo
      const conta = row ? {
        id: row['id'],
        descricao: row['descricao'],
        valor: row['valor'],
        data_emissao: row['data_lancamento'],
        data_vencimento: row['data_vencimento'],
        status: row['status'],
        fornecedor_id: row['entidade_id'],
      } : null

      return { success: true, message: 'Conta a pagar criada com sucesso', conta, sql_query: insertSql, sql_params: fmt(values) }
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
