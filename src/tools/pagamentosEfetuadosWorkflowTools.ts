import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

// ============================================
// WORKFLOW TOOLS - PAGAMENTOS EFETUADOS
// ============================================

/**
 * [WORKFLOW] Busca conta a pagar existente (schema novo)
 * Permite buscar por NF, fornecedor, valor ou vencimento
 */
export const buscarContaPagar = tool({
  description: '[WORKFLOW] Busca conta a pagar existente no sistema por fornecedor, valor ou vencimento (consulta ao banco — schema novo)',
  inputSchema: z.object({
    fornecedor_id: z.string().optional().describe('ID do fornecedor'),
    fornecedor_nome: z.string().optional().describe('Nome fantasia do fornecedor (ILIKE)'),
    valor: z.number().optional().describe('Valor exato'),
    valor_min: z.number().optional().describe('Valor mínimo'),
    valor_max: z.number().optional().describe('Valor máximo'),
    data_vencimento: z.string().optional().describe('Data de vencimento (YYYY-MM-DD)'),
    de_vencimento: z.string().optional().describe('Vencimento a partir de (YYYY-MM-DD)'),
    ate_vencimento: z.string().optional().describe('Vencimento até (YYYY-MM-DD)'),
    status: z.string().optional().describe('Status (ex.: pendente, pago, cancelado). Se não informado, usa pendente por padrão.'),
    numero_nota_fiscal: z.string().optional().describe('Número do documento/nota (ILIKE)'),
    descricao: z.string().optional().describe('Descrição/observação (ILIKE)'),
    tenant_id: z.number().optional().describe('Tenant ID para filtrar'),
    limite: z.number().int().positive().max(1000).optional().describe('Limite de registros (ex.: 10, default 20)'),
    order_by: z.enum(['id','valor','data_vencimento','fornecedor_nome']).optional().describe('Ordenação'),
    order_dir: z.enum(['asc','desc']).optional().describe('Direção da ordenação'),
  }),
  execute: async ({ fornecedor_id, fornecedor_nome, valor, valor_min, valor_max, data_vencimento, de_vencimento, ate_vencimento, status, numero_nota_fiscal, descricao, tenant_id, limite, order_by, order_dir }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1

    if (fornecedor_id) { conditions.push(`cp.fornecedor_id = $${i++}`); params.push(fornecedor_id) }
    if (fornecedor_nome) { conditions.push(`f.nome_fantasia ILIKE $${i++}`); params.push(`%${fornecedor_nome}%`) }
    if (typeof valor === 'number') { conditions.push(`cp.valor_liquido = $${i++}`); params.push(valor) }
    if (typeof valor_min === 'number') { conditions.push(`cp.valor_liquido >= $${i++}`); params.push(valor_min) }
    if (typeof valor_max === 'number') { conditions.push(`cp.valor_liquido <= $${i++}`); params.push(valor_max) }
    if (data_vencimento) { conditions.push(`DATE(cp.data_vencimento) = $${i++}`); params.push(data_vencimento) }
    if (de_vencimento) { conditions.push(`DATE(cp.data_vencimento) >= $${i++}`); params.push(de_vencimento) }
    if (ate_vencimento) { conditions.push(`DATE(cp.data_vencimento) <= $${i++}`); params.push(ate_vencimento) }
    if (numero_nota_fiscal) { conditions.push(`cp.numero_documento ILIKE $${i++}`); params.push(`%${numero_nota_fiscal}%`) }
    if (descricao) { conditions.push(`cp.observacao ILIKE $${i++}`); params.push(`%${descricao}%`) }
    if (status && status.trim()) {
      conditions.push(`LOWER(cp.status) = $${i++}`); params.push(status.toLowerCase())
    } else {
      conditions.push(`LOWER(cp.status) = 'pendente'`)
    }
    if (typeof tenant_id === 'number') { conditions.push(`cp.tenant_id = $${i++}`); params.push(tenant_id) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const orderMap: Record<string, string> = {
      id: 'cp.id',
      valor: 'cp.valor_liquido',
      data_vencimento: 'cp.data_vencimento',
      fornecedor_nome: 'f.nome_fantasia',
    }
    const ob = (order_by && orderMap[order_by]) || 'cp.data_vencimento'
    const od = (order_dir && order_dir.toLowerCase() === 'asc') ? 'ASC' : 'DESC'
    const limitVal = Math.max(1, Math.min(1000, typeof limite === 'number' ? limite : 20))

    const sql = `
      SELECT
        cp.id                                   AS conta_id,
        'conta_a_pagar'::text                   AS tipo_conta,
        cp.observacao                           AS descricao_conta,
        cp.valor_liquido                        AS valor_a_pagar,
        cp.status                               AS status_conta,
        cp.data_lancamento,
        cp.data_vencimento,
        cp.observacao,
        cp.numero_documento                     AS numero_nota_fiscal,
        NULL::text                              AS storage_key,
        NULL::text                              AS nome_arquivo,
        NULL::text                              AS content_type,
        NULL::bigint                            AS tamanho_bytes,
        (
          SELECT COALESCE(SUM(pel.valor_pago),0)::numeric
            FROM financeiro.pagamentos_efetuados_linhas pel
           WHERE pel.conta_pagar_id = cp.id
        ) AS valor_pago,
        cd.nome                                 AS categoria_nome,
        cc.nome                                 AS centro_custo_nome,
        dep.nome                                AS departamento_nome,
        fil.nome                                AS filial_nome,
        un.nome                                 AS unidade_negocio_nome,
        f.nome_fantasia                         AS fornecedor_nome,
        cp.fornecedor_id                        AS fornecedor_id,
        f.imagem_url                            AS fornecedor_imagem_url
      FROM financeiro.contas_pagar cp
      LEFT JOIN entidades.fornecedores f         ON f.id = cp.fornecedor_id
      LEFT JOIN financeiro.categorias_despesa cd ON cd.id = cp.categoria_despesa_id
      LEFT JOIN empresa.centros_custo cc         ON cc.id = cp.centro_custo_id
      LEFT JOIN empresa.departamentos dep        ON dep.id = cp.departamento_id
      LEFT JOIN empresa.unidades_negocio un      ON un.id = cp.unidade_negocio_id
      LEFT JOIN empresa.filiais fil              ON fil.id = cp.filial_id
      ${where}
      ORDER BY ${ob} ${od}
      LIMIT ${limitVal}
    `.replace(/\n\s+/g, ' ').trim()

    type Row = {
      conta_id: number
      descricao_conta: string | null
      valor_a_pagar: number | string | null
      status_conta: string | null
      data_lancamento: string | null
      data_vencimento: string | null
      observacao: string | null
      numero_nota_fiscal: string | null
      valor_pago: number | string | null
      categoria_nome: string | null
      centro_custo_nome: string | null
      departamento_nome: string | null
      filial_nome: string | null
      unidade_negocio_nome: string | null
      fornecedor_nome: string | null
      fornecedor_id: number | string | null
      fornecedor_imagem_url: string | null
    }

    const rows = await runQuery<Row>(sql, params)
    const mapped = rows.map((r) => ({
      id: Number(r.conta_id),
      conta_id: Number(r.conta_id),
      tipo: 'conta_a_pagar',
      descricao: r.descricao_conta || r.observacao || null,
      valor: Number(r.valor_a_pagar ?? 0),
      status: r.status_conta || null,
      data_lancamento: r.data_lancamento || null,
      data_vencimento: r.data_vencimento || null,
      numero_nota_fiscal: r.numero_nota_fiscal || null,
      storage_key: null,
      nome_arquivo: null,
      content_type: null,
      tamanho_bytes: null,
      valor_pago: Number(r.valor_pago ?? 0),
      valor_pendente: Math.max(0, Number(r.valor_a_pagar ?? 0) - Number(r.valor_pago ?? 0)),
      categoria_nome: r.categoria_nome || undefined,
      centro_custo_nome: r.centro_custo_nome || undefined,
      departamento_nome: r.departamento_nome || undefined,
      filial_nome: r.filial_nome || undefined,
      unidade_negocio_nome: r.unidade_negocio_nome || undefined,
      fornecedor_nome: r.fornecedor_nome || undefined,
      fornecedor_id: r.fornecedor_id ? String(r.fornecedor_id) : undefined,
      fornecedor_imagem_url: r.fornecedor_imagem_url || undefined,
    }))

    return {
      success: true,
      conta_encontrada: mapped.length > 0,
      data: mapped.length === 1 ? mapped[0] : null,
      rows: mapped,
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
        SELECT
          cp.tenant_id,
          cp.valor_liquido::numeric AS total,
          COALESCE(
            (SELECT SUM(pel.valor_pago)::numeric
               FROM financeiro.pagamentos_efetuados_linhas pel
              WHERE pel.conta_pagar_id = cp.id),
            0
          ) AS pagos
        FROM financeiro.contas_pagar cp
        WHERE cp.id = $1
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

