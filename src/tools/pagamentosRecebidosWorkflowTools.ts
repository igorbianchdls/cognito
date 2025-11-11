import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

// ============================================
// WORKFLOW TOOLS - PAGAMENTOS RECEBIDOS
// ============================================

/**
 * [WORKFLOW] Busca conta a receber existente
 * Permite buscar por NF, cliente, valor ou vencimento
 */
export const buscarContaReceber = tool({
  description: '[WORKFLOW] Busca conta a receber existente no sistema (consulta ao banco) com filtros opcionais',
  inputSchema: z.object({
    cliente_id: z.string().optional().describe('ID do cliente'),
    cliente_nome: z.string().optional().describe('Nome do cliente (parcial)'),
    valor: z.number().optional().describe('Valor exato'),
    valor_min: z.number().optional().describe('Valor mínimo'),
    valor_max: z.number().optional().describe('Valor máximo'),
    data_vencimento: z.string().optional().describe('Data de vencimento (YYYY-MM-DD)'),
    de_vencimento: z.string().optional().describe('Vencimento a partir de (YYYY-MM-DD)'),
    ate_vencimento: z.string().optional().describe('Vencimento até (YYYY-MM-DD)'),
    status: z.string().optional().describe('Status (ex.: pendente, pago, cancelado)'),
    tenant_id: z.number().optional().describe('Tenant ID para filtrar'),
    limite: z.number().int().positive().max(1000).optional().describe('Limite (default 10)'),
    order_by: z.enum(['id','valor','data_vencimento']).optional().describe('Ordenação'),
    order_dir: z.enum(['asc','desc']).optional().describe('Direção'),
  }),
  execute: async ({ cliente_id, cliente_nome, valor, valor_min, valor_max, data_vencimento, de_vencimento, ate_vencimento, status, tenant_id, limite, order_by, order_dir }) => {
    let sql = `
      SELECT 
        lf.id AS conta_id,
        lf.descricao AS descricao_conta,
        lf.valor AS valor_a_receber,
        lf.status AS status_conta,
        c.nome_fantasia AS cliente_nome
      FROM financeiro.lancamentos_financeiros lf
      LEFT JOIN entidades.clientes c 
             ON lf.cliente_id = c.id
      WHERE lf.tipo = 'conta_a_receber'
    `.replace(/\n\s+/g, ' ')

    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1

    if (cliente_id) { conditions.push(`lf.cliente_id = $${i++}`); params.push(cliente_id) }
    if (cliente_nome) { conditions.push(`c.nome_fantasia ILIKE $${i++}`); params.push(`%${cliente_nome}%`) }
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

    type Row = { conta_id: string | number; descricao_conta: string | null; valor_a_receber: number | null; status_conta: string | null; cliente_nome: string | null }
    const rows = await runQuery<Row>(sql.trim(), params)

    if (!rows.length) {
      return {
        success: true,
        conta_encontrada: false,
        data: null,
        rows: [],
        count: 0,
        message: 'Nenhuma conta a receber encontrada com os critérios informados',
        title: '⚠️ Conta Não Encontrada',
      } as const
    }

    const mapped = rows.map((r) => {
      const v = Number(r.valor_a_receber || 0)
      return {
        id: String(r.conta_id),
        cliente_id: '',
        cliente_nome: r.cliente_nome || '-',
        numero_nota_fiscal: undefined,
        valor: v,
        valor_recebido: 0,
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
      rows: mapped,
      count: mapped.length,
      message: mapped.length === 1
        ? `Conta a receber encontrada: ${mapped[0].descricao || mapped[0].id} - ${mapped[0].cliente_nome}`
        : `${mapped.length} contas a receber encontradas`,
      title: mapped.length === 1 ? '✅ Conta a Receber Encontrada' : '✅ Contas a Receber',
    } as const
  }
});

/**
 * [WORKFLOW] Cria registro de pagamento recebido
 * Registra o recebimento e o sistema baixa a conta automaticamente
 */
export const criarPagamentoRecebido = tool({
  description: '[WORKFLOW] Prévia de Pagamento Recebido. IA preenche dados; usuário confirma na UI para criar e baixar a AR.',
  inputSchema: z.object({
    lancamento_origem_id: z.string().describe('ID da conta a receber (lf.id)'),
    conta_financeira_id: z.string().describe('Conta financeira a creditar'),
    metodo_pagamento_id: z.string().describe('Método de pagamento'),
    descricao: z.string().describe('Descrição do recebimento'),
  }),
  execute: async ({ lancamento_origem_id, conta_financeira_id, metodo_pagamento_id, descricao }) => {
    try {
      const arSql = `
        SELECT lf.tenant_id, lf.valor::numeric AS total,
               COALESCE(
                 (SELECT SUM(r.valor)::numeric FROM financeiro.lancamentos_financeiros r
                   WHERE LOWER(r.tipo) = 'pagamento_recebido' AND r.lancamento_origem_id = lf.id), 0
               ) AS recebidos
          FROM financeiro.lancamentos_financeiros lf
         WHERE lf.id = $1 AND LOWER(lf.tipo) = 'conta_a_receber'
         LIMIT 1
      `.replace(/\n\s+/g, ' ').trim()
      const rows = await runQuery<{ tenant_id: number | null; total: number; recebidos: number }>(arSql, [lancamento_origem_id])
      if (!rows.length) {
        return { success: false, preview: true, message: 'Conta a receber não encontrada', title: 'Pagamento Recebido (Prévia)', payload: null, validations: [{ field: 'lancamento_origem_id', status: 'error', message: 'Conta a receber inexistente' }], metadata: { commitEndpoint: '/api/modulos/financeiro/pagamentos-recebidos' } } as const
      }
      const { tenant_id, total, recebidos } = rows[0]
      const pendente = Math.max(0, Number(total || 0) - Number(recebidos || 0))
      const hoje = new Date().toISOString().slice(0, 10)

      const validations: Array<{ field: string; status: 'ok'|'warn'|'error'; message?: string }> = []
      if (!conta_financeira_id) validations.push({ field: 'conta_financeira_id', status: 'error', message: 'Conta financeira é obrigatória' })
      if (!metodo_pagamento_id) validations.push({ field: 'metodo_pagamento_id', status: 'error', message: 'Método de pagamento é obrigatório' })
      if (!descricao || !descricao.trim()) validations.push({ field: 'descricao', status: 'error', message: 'Descrição é obrigatória' })
      if (pendente <= 0) validations.push({ field: 'valor', status: 'error', message: 'Título já está totalmente recebido' })

      const payload = {
        lancamento_origem_id,
        conta_financeira_id,
        metodo_pagamento_id,
        descricao,
        valor: pendente,
        data_recebimento: hoje,
        tenant_id: tenant_id ?? 1,
      }

      return {
        success: true,
        preview: true,
        title: 'Pagamento Recebido (Prévia)',
        message: pendente > 0 ? `Recebimento proposto de ${pendente.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}` : 'Título sem valor pendente',
        payload,
        validations,
        metadata: { commitEndpoint: '/api/modulos/financeiro/pagamentos-recebidos' }
      } as const
    } catch (error) {
      return { success: false, preview: true, message: error instanceof Error ? error.message : String(error), title: 'Pagamento Recebido (Prévia)', payload: null, validations: [{ field: 'lancamento_origem_id', status: 'error', message: 'Falha ao calcular pendente' }], metadata: { commitEndpoint: '/api/modulos/financeiro/pagamentos-recebidos' } } as const
    }
  }
});
