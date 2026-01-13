import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

// ============================================
// WORKFLOW TOOLS - PAGAMENTOS RECEBIDOS
// ============================================

/**
 * [WORKFLOW] Busca conta a receber existente (schema novo)
 * Permite buscar por NF, cliente, valor ou vencimento
 */
export const buscarContaReceber = tool({
  description: '[WORKFLOW] Busca conta a receber existente no sistema (consulta ao banco — schema novo) com filtros opcionais',
  inputSchema: z.object({
    cliente_id: z.string().optional().describe('ID do cliente'),
    cliente_nome: z.string().optional().describe('Nome fantasia do cliente (ILIKE)'),
    valor: z.number().optional().describe('Valor exato'),
    valor_min: z.number().optional().describe('Valor mínimo'),
    valor_max: z.number().optional().describe('Valor máximo'),
    data_vencimento: z.string().optional().describe('Data de vencimento (YYYY-MM-DD)'),
    de_vencimento: z.string().optional().describe('Vencimento a partir de (YYYY-MM-DD)'),
    ate_vencimento: z.string().optional().describe('Vencimento até (YYYY-MM-DD)'),
    status: z.string().optional().describe('Status (ex.: pendente, pago, cancelado). Se não informar, assume pendente por padrão.'),
    numero_nota_fiscal: z.string().optional().describe('Número da nota/documento (ILIKE)'),
    descricao: z.string().optional().describe('Descrição do título (ILIKE, parcial)'),
    tenant_id: z.number().optional().describe('Tenant ID para filtrar'),
    limite: z.number().int().positive().max(1000).optional().describe('Limite (default 20)'),
    order_by: z.enum(['id','valor','data_vencimento','cliente_nome']).optional().describe('Ordenação'),
    order_dir: z.enum(['asc','desc']).optional().describe('Direção'),
  }),
  execute: async ({ cliente_id, cliente_nome, valor, valor_min, valor_max, data_vencimento, de_vencimento, ate_vencimento, status, numero_nota_fiscal, descricao, tenant_id, limite, order_by, order_dir }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1

    if (cliente_id) { conditions.push(`cr.cliente_id = $${i++}`); params.push(cliente_id) }
    if (cliente_nome) { conditions.push(`cli.nome_fantasia ILIKE $${i++}`); params.push(`%${cliente_nome}%`) }
    if (typeof valor === 'number') { conditions.push(`cr.valor_liquido = $${i++}`); params.push(valor) }
    if (typeof valor_min === 'number') { conditions.push(`cr.valor_liquido >= $${i++}`); params.push(valor_min) }
    if (typeof valor_max === 'number') { conditions.push(`cr.valor_liquido <= $${i++}`); params.push(valor_max) }
    if (data_vencimento) { conditions.push(`DATE(cr.data_vencimento) = $${i++}`); params.push(data_vencimento) }
    if (de_vencimento) { conditions.push(`DATE(cr.data_vencimento) >= $${i++}`); params.push(de_vencimento) }
    if (ate_vencimento) { conditions.push(`DATE(cr.data_vencimento) <= $${i++}`); params.push(ate_vencimento) }
    if (numero_nota_fiscal) { conditions.push(`cr.numero_documento ILIKE $${i++}`); params.push(`%${numero_nota_fiscal}%`) }
    if (descricao) { conditions.push(`cr.observacao ILIKE $${i++}`); params.push(`%${descricao}%`) }
    if (status && status.trim()) { conditions.push(`LOWER(cr.status) = $${i++}`); params.push(status.toLowerCase()) } else { conditions.push(`LOWER(cr.status) = 'pendente'`) }
    if (typeof tenant_id === 'number') { conditions.push(`cr.tenant_id = $${i++}`); params.push(tenant_id) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const orderMap: Record<string, string> = {
      id: 'cr.id',
      valor: 'cr.valor_liquido',
      data_vencimento: 'cr.data_vencimento',
      cliente_nome: 'cli.nome_fantasia',
    }
    const ob = (order_by && orderMap[order_by]) || 'cr.data_vencimento'
    const od = (order_dir && order_dir.toLowerCase() === 'asc') ? 'ASC' : 'DESC'
    const limitVal = Math.max(1, Math.min(1000, typeof limite === 'number' ? limite : 20))

    const sql = `
      SELECT
        cr.id                                   AS conta_id,
        'conta_a_receber'::text                 AS tipo_conta,
        cr.observacao                           AS descricao_conta,
        cr.valor_liquido                        AS valor_a_receber,
        cr.status                               AS status_conta,
        cr.data_lancamento,
        cr.data_vencimento,
        cr.observacao,
        cr.numero_documento                     AS numero_nota_fiscal,
        NULL::text                              AS storage_key,
        NULL::text                              AS nome_arquivo,
        NULL::text                              AS content_type,
        NULL::bigint                            AS tamanho_bytes,
        (
          SELECT COALESCE(SUM(prl.valor_recebido),0)::numeric
            FROM financeiro.pagamentos_recebidos_linhas prl
           WHERE prl.conta_receber_id = cr.id
        ) AS valor_recebido,
        cat_r.nome                              AS categoria_nome,
        cl.nome                                 AS centro_lucro_nome,
        dep.nome                                AS departamento_nome,
        fil.nome                                AS filial_nome,
        cli.nome_fantasia                       AS cliente_nome,
        cr.cliente_id                           AS cliente_id,
        cli.imagem_url                          AS cliente_imagem_url
      FROM financeiro.contas_receber cr
      LEFT JOIN entidades.clientes cli            ON cli.id = cr.cliente_id
      LEFT JOIN financeiro.categorias_receita cat_r ON cat_r.id = cr.categoria_receita_id
      LEFT JOIN empresa.centros_lucro cl          ON cl.id = cr.centro_lucro_id
      LEFT JOIN empresa.departamentos dep         ON dep.id = cr.departamento_id
      LEFT JOIN empresa.filiais fil               ON fil.id = cr.filial_id
      ${where}
      ORDER BY ${ob} ${od}
      LIMIT ${limitVal}
    `.replace(/\n\s+/g, ' ').trim()

    type Row = {
      conta_id: number
      descricao_conta: string | null
      valor_a_receber: number | string | null
      status_conta: string | null
      data_lancamento: string | null
      data_vencimento: string | null
      observacao: string | null
      numero_nota_fiscal: string | null
      valor_recebido: number | string | null
      categoria_nome: string | null
      centro_lucro_nome: string | null
      departamento_nome: string | null
      filial_nome: string | null
      cliente_nome: string | null
      cliente_id: number | string | null
      cliente_imagem_url: string | null
    }

    const rows = await runQuery<Row>(sql, params)
    const mapped = rows.map((r) => ({
      id: Number(r.conta_id),
      conta_id: Number(r.conta_id),
      tipo: 'conta_a_receber',
      descricao: r.descricao_conta || r.observacao || null,
      valor: Number(r.valor_a_receber ?? 0),
      status: r.status_conta || null,
      data_lancamento: r.data_lancamento || null,
      data_vencimento: r.data_vencimento || null,
      numero_nota_fiscal: r.numero_nota_fiscal || null,
      storage_key: null,
      nome_arquivo: null,
      content_type: null,
      tamanho_bytes: null,
      valor_recebido: Number(r.valor_recebido ?? 0),
      valor_pendente: Math.max(0, Number(r.valor_a_receber ?? 0) - Number(r.valor_recebido ?? 0)),
      categoria_nome: r.categoria_nome || undefined,
      centro_lucro_nome: r.centro_lucro_nome || undefined,
      departamento_nome: r.departamento_nome || undefined,
      filial_nome: r.filial_nome || undefined,
      cliente_nome: r.cliente_nome || undefined,
      cliente_id: r.cliente_id ? String(r.cliente_id) : undefined,
      cliente_imagem_url: r.cliente_imagem_url || undefined,
    }))

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
        SELECT
          cr.tenant_id,
          cr.valor_liquido::numeric AS total,
          COALESCE(
            (SELECT SUM(prl.valor_recebido)::numeric
               FROM financeiro.pagamentos_recebidos_linhas prl
              WHERE prl.conta_receber_id = cr.id),
            0
          ) AS recebidos
        FROM financeiro.contas_receber cr
        WHERE cr.id = $1
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

