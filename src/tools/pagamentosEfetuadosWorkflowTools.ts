import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

// ============================================
// WORKFLOW TOOLS - PAGAMENTOS EFETUADOS
// ============================================

/**
 * [WORKFLOW] Busca conta a pagar existente
 * Permite buscar por NF, fornecedor, valor ou vencimento
 */
export const buscarContaPagar = tool({
  description: '[WORKFLOW] Busca conta a pagar existente no sistema por fornecedor, valor ou vencimento (consulta ao banco)',
  inputSchema: z.object({
    fornecedor_id: z.string().optional().describe('ID do fornecedor'),
    fornecedor_nome: z.string().optional().describe('Nome do fornecedor para busca (parcial)'),
    valor: z.number().optional().describe('Valor exato'),
    valor_min: z.number().optional().describe('Valor mínimo'),
    valor_max: z.number().optional().describe('Valor máximo'),
    data_vencimento: z.string().optional().describe('Data de vencimento (YYYY-MM-DD)'),
    de_vencimento: z.string().optional().describe('Vencimento a partir de (YYYY-MM-DD)'),
    ate_vencimento: z.string().optional().describe('Vencimento até (YYYY-MM-DD)'),
    status: z.string().optional().describe('Status (ex.: pendente, pago, cancelado)'),
    tenant_id: z.number().optional().describe('Tenant ID para filtrar'),
    limite: z.number().int().positive().max(1000).optional().describe('Limite de registros (ex.: 10)'),
    order_by: z.enum(['id','valor','data_vencimento']).optional().describe('Ordenação'),
    order_dir: z.enum(['asc','desc']).optional().describe('Direção da ordenação'),
  }),
  execute: async ({ fornecedor_id, fornecedor_nome, valor, valor_min, valor_max, data_vencimento, de_vencimento, ate_vencimento, status, tenant_id, limite, order_by, order_dir }) => {
    // SQL base (conforme especificação enviada)
    let sql = `
      SELECT 
        lf.id AS conta_id,
        lf.descricao AS descricao_conta,
        lf.valor AS valor_a_pagar,
        lf.status AS status_conta,
        f.nome AS fornecedor_nome
      FROM financeiro.lancamentos_financeiros lf
      LEFT JOIN entidades.fornecedores f 
             ON lf.fornecedor_id = f.id
      WHERE lf.tipo = 'conta_a_pagar'
    `.replace(/\n\s+/g, ' ')

    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1

    if (fornecedor_id) { conditions.push(`lf.fornecedor_id = $${i++}`); params.push(fornecedor_id) }
    if (fornecedor_nome) { conditions.push(`f.nome ILIKE $${i++}`); params.push(`%${fornecedor_nome}%`) }
    if (typeof valor === 'number') { conditions.push(`lf.valor = $${i++}`); params.push(valor) }
    if (typeof valor_min === 'number') { conditions.push(`lf.valor >= $${i++}`); params.push(valor_min) }
    if (typeof valor_max === 'number') { conditions.push(`lf.valor <= $${i++}`); params.push(valor_max) }
    if (data_vencimento) { conditions.push(`lf.data_vencimento = $${i++}`); params.push(data_vencimento) }
    if (de_vencimento) { conditions.push(`lf.data_vencimento >= $${i++}`); params.push(de_vencimento) }
    if (ate_vencimento) { conditions.push(`lf.data_vencimento <= $${i++}`); params.push(ate_vencimento) }
    if (status) { conditions.push(`LOWER(lf.status) = $${i++}`); params.push(status.toLowerCase()) }
    if (typeof tenant_id === 'number') { conditions.push(`lf.tenant_id = $${i++}`); params.push(tenant_id) }

    if (conditions.length) sql += ' AND ' + conditions.join(' AND ')
    const orderMap: Record<string,string> = { id: 'lf.id', valor: 'lf.valor', data_vencimento: 'lf.data_vencimento' }
    const ob = orderMap[(order_by || 'id')]
    const od = (order_dir || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    const limitVal = Math.max(1, Math.min(1000, limite || 10))
    sql += ` ORDER BY ${ob} ${od} LIMIT ${limitVal}`

    type Row = { conta_id: string | number; descricao_conta: string | null; valor_a_pagar: number | null; status_conta: string | null; fornecedor_nome: string | null }
    const rows = await runQuery<Row>(sql.trim(), params)

    if (!rows.length) {
      return {
        success: true,
        conta_encontrada: false,
        data: null,
        rows: [],
        count: 0,
        message: 'Nenhuma conta a pagar encontrada com os critérios informados',
        title: '⚠️ Conta Não Encontrada',
      } as const
    }

    const mapped = rows.map((r) => {
      const v = Number(r.valor_a_pagar || 0)
      return {
        id: String(r.conta_id),
        fornecedor_id: '',
        fornecedor_nome: r.fornecedor_nome || '-',
        numero_nota_fiscal: undefined,
        valor: v,
        valor_pago: 0,
        valor_pendente: v,
        data_emissao: '',
        data_vencimento: '',
        status: r.status_conta || '',
        categoria_id: undefined,
        categoria_nome: undefined,
        centro_custo_id: undefined,
        centro_custo_nome: undefined,
        descricao: r.descricao_conta || '',
        quantidade_itens: undefined,
      }
    })

    return {
      success: true,
      conta_encontrada: mapped.length > 0,
      data: mapped.length === 1 ? mapped[0] : null,
      rows: mapped.length > 1 ? mapped : mapped,
      count: mapped.length,
      message: mapped.length === 1
        ? `Conta a pagar encontrada: ${mapped[0].descricao || mapped[0].id} - ${mapped[0].fornecedor_nome}`
        : `${mapped.length} contas a pagar encontradas`,
      title: mapped.length === 1 ? '✅ Conta a Pagar Encontrada' : '✅ Contas a Pagar',
    } as const
  }
});

/**
 * [WORKFLOW] Cria registro de pagamento efetuado
 * Registra o pagamento e o sistema baixa a conta automaticamente
 */
export const criarPagamentoEfetuado = tool({
  description: '[WORKFLOW] Prévia de Pagamento Efetuado. IA preenche dados; usuário confirma na UI para criar e baixar a AP.',
  inputSchema: z.object({
    lancamento_origem_id: z.string().describe('ID da conta a pagar (lf.id)'),
    conta_financeira_id: z.string().describe('Conta financeira a debitar'),
    metodo_pagamento_id: z.string().describe('Método de pagamento'),
    descricao: z.string().describe('Descrição do pagamento'),
  }),
  execute: async ({ lancamento_origem_id, conta_financeira_id, metodo_pagamento_id, descricao }) => {
    // Buscar dados da AP: tenant, valor total e soma de pagamentos anteriores
    try {
      const apSql = `
        SELECT lf.tenant_id, lf.valor::numeric AS total,
               COALESCE(
                 (SELECT SUM(p.valor)::numeric FROM financeiro.lancamentos_financeiros p
                   WHERE LOWER(p.tipo) = 'pagamento_efetuado' AND p.lancamento_origem_id = lf.id), 0
               ) AS pagos
          FROM financeiro.lancamentos_financeiros lf
         WHERE lf.id = $1 AND LOWER(lf.tipo) = 'conta_a_pagar'
         LIMIT 1
      `.replace(/\n\s+/g, ' ').trim()
      const rows = await runQuery<{ tenant_id: number | null; total: number; pagos: number }>(apSql, [lancamento_origem_id])
      if (!rows.length) {
        return { success: false, preview: true, message: 'Conta a pagar não encontrada', title: 'Pagamento Efetuado (Prévia)', payload: null, validations: [{ field: 'lancamento_origem_id', status: 'error', message: 'Conta a pagar inexistente' }], metadata: { commitEndpoint: '/api/modulos/financeiro/pagamentos-efetuados' } } as const
      }
      const { tenant_id, total, pagos } = rows[0]
      const pendente = Math.max(0, Number(total || 0) - Number(pagos || 0))
      const hoje = new Date().toISOString().slice(0, 10)

      const validations: Array<{ field: string; status: 'ok'|'warn'|'error'; message?: string }> = []
      if (!conta_financeira_id) validations.push({ field: 'conta_financeira_id', status: 'error', message: 'Conta financeira é obrigatória' })
      if (!metodo_pagamento_id) validations.push({ field: 'metodo_pagamento_id', status: 'error', message: 'Método de pagamento é obrigatório' })
      if (!descricao || !descricao.trim()) validations.push({ field: 'descricao', status: 'error', message: 'Descrição é obrigatória' })
      if (pendente <= 0) validations.push({ field: 'valor', status: 'error', message: 'Título já está totalmente pago' })

      const payload = {
        lancamento_origem_id,
        conta_financeira_id,
        metodo_pagamento_id,
        descricao,
        valor: pendente,
        data_pagamento: hoje,
        tenant_id: tenant_id ?? 1,
      }

      return {
        success: true,
        preview: true,
        title: 'Pagamento Efetuado (Prévia)',
        message: pendente > 0 ? `Pagamento proposto de ${pendente.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}` : 'Título sem valor pendente',
        payload,
        validations,
        metadata: { commitEndpoint: '/api/modulos/financeiro/pagamentos-efetuados' }
      } as const
    } catch (error) {
      return { success: false, preview: true, message: error instanceof Error ? error.message : String(error), title: 'Pagamento Efetuado (Prévia)', payload: null, validations: [{ field: 'lancamento_origem_id', status: 'error', message: 'Falha ao calcular pendente' }], metadata: { commitEndpoint: '/api/modulos/financeiro/pagamentos-efetuados' } } as const
    }
  }
});
