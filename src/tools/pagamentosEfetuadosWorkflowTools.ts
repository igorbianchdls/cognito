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
    fornecedor_nome: z.string().optional().describe('Nome fantasia do fornecedor para busca (parcial, coluna nome_fantasia)'),
    valor: z.number().optional().describe('Valor exato'),
    valor_min: z.number().optional().describe('Valor mínimo'),
    valor_max: z.number().optional().describe('Valor máximo'),
    data_vencimento: z.string().optional().describe('Data de vencimento (YYYY-MM-DD)'),
    de_vencimento: z.string().optional().describe('Vencimento a partir de (YYYY-MM-DD)'),
    ate_vencimento: z.string().optional().describe('Vencimento até (YYYY-MM-DD)'),
    status: z.string().optional().describe('Status (ex.: pendente, pago, cancelado). Se não informado, usa pendente por padrão.'),
    numero_nota_fiscal: z.string().optional().describe('Número da nota fiscal (parcial ou completo)'),
    descricao: z.string().optional().describe('Descrição do lançamento (ILIKE, parcial)'),
    tenant_id: z.number().optional().describe('Tenant ID para filtrar'),
    limite: z.number().int().positive().max(1000).optional().describe('Limite de registros (ex.: 10)'),
    order_by: z.enum(['id','valor','data_vencimento','fornecedor_nome']).optional().describe('Ordenação'),
    order_dir: z.enum(['asc','desc']).optional().describe('Direção da ordenação'),
  }),
  execute: async ({ fornecedor_id, fornecedor_nome, valor, valor_min, valor_max, data_vencimento, de_vencimento, ate_vencimento, status, numero_nota_fiscal, descricao, tenant_id, limite, order_by, order_dir }) => {
    // SQL alinhado com a view 'contas-a-pagar' da rota /api/modulos/financeiro
    const selectSql = `SELECT
      lf.id AS conta_id,
      lf.tipo AS tipo_conta,
      lf.descricao AS descricao_conta,
      lf.valor AS valor_a_pagar,
      lf.status AS status_conta,
      lf.data_lancamento,
      lf.data_vencimento,
      lf.observacao,
      lf.numero_nota_fiscal,
      lf.storage_key AS storage_key,
      lf.nome_arquivo AS nome_arquivo,
      lf.content_type AS content_type,
      lf.tamanho_bytes AS tamanho_bytes,
      COALESCE((SELECT SUM(p.valor)::numeric FROM financeiro.lancamentos_financeiros p
                 WHERE LOWER(p.tipo) = 'pagamento_efetuado' AND p.lancamento_origem_id = lf.id), 0) AS valor_pago,
      cf.nome AS categoria_nome,
      cl.nome AS centro_lucro_nome,
      dep.nome AS departamento_nome,
      fi.nome AS filial_nome,
      pr.nome AS projeto_nome,
      f.nome_fantasia AS fornecedor_nome,
      lf.fornecedor_id AS fornecedor_id,
      f.imagem_url AS fornecedor_imagem_url
    `;
    const baseSql = `FROM financeiro.lancamentos_financeiros lf
      LEFT JOIN financeiro.categorias_financeiras cf ON lf.categoria_id = cf.id
      LEFT JOIN empresa.centros_lucro cl ON lf.centro_lucro_id = cl.id
      LEFT JOIN empresa.departamentos dep ON lf.departamento_id = dep.id
      LEFT JOIN empresa.filiais fi ON lf.filial_id = fi.id
      LEFT JOIN financeiro.projetos pr ON lf.projeto_id = pr.id
      LEFT JOIN entidades.fornecedores f ON lf.fornecedor_id = f.id`;

    const conditions: string[] = ["lf.tipo = 'conta_a_pagar'"];
    const params: unknown[] = [];
    let i = 1;
    if (fornecedor_id) { conditions.push(`lf.fornecedor_id = $${i++}`); params.push(fornecedor_id) }
    if (fornecedor_nome) { conditions.push(`f.nome_fantasia ILIKE $${i++}`); params.push(`%${fornecedor_nome}%`) }
    if (typeof valor === 'number') { conditions.push(`lf.valor = $${i++}`); params.push(valor) }
    if (typeof valor_min === 'number') { conditions.push(`lf.valor >= $${i++}`); params.push(valor_min) }
    if (typeof valor_max === 'number') { conditions.push(`lf.valor <= $${i++}`); params.push(valor_max) }
    if (data_vencimento) { conditions.push(`DATE(lf.data_vencimento) = $${i++}`); params.push(data_vencimento) }
    if (de_vencimento) { conditions.push(`DATE(lf.data_vencimento) >= $${i++}`); params.push(de_vencimento) }
    if (ate_vencimento) { conditions.push(`DATE(lf.data_vencimento) <= $${i++}`); params.push(ate_vencimento) }
    if (numero_nota_fiscal) { conditions.push(`lf.numero_nota_fiscal ILIKE $${i++}`); params.push(`%${numero_nota_fiscal}%`) }
    if (descricao) { conditions.push(`lf.descricao ILIKE $${i++}`); params.push(`%${descricao}%`) }
    // Default status to pendente if not provided explicitly
    if (status && status.trim()) {
      conditions.push(`LOWER(lf.status) = $${i++}`); params.push(status.toLowerCase());
    } else {
      conditions.push(`LOWER(lf.status) = 'pendente'`);
    }
    if (typeof tenant_id === 'number') { conditions.push(`lf.tenant_id = $${i++}`); params.push(tenant_id) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderMap: Record<string,string> = { id: 'lf.id', valor: 'lf.valor', data_vencimento: 'lf.data_vencimento', fornecedor_nome: 'f.nome_fantasia' };
    const ob = orderMap[(order_by || 'data_vencimento')] || 'lf.data_vencimento';
    const od = (order_dir || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const limitVal = Math.max(1, Math.min(1000, limite || 50));
    const sql = `${selectSql} ${baseSql} ${where} ORDER BY ${ob} ${od} LIMIT ${limitVal}`.replace(/\n\s+/g, ' ').trim();

    type Row = {
      conta_id: string | number; tipo_conta: string | null; descricao_conta: string | null;
      valor_a_pagar: number | null; status_conta: string | null; data_lancamento?: string | null;
      data_vencimento?: string | null; observacao?: string | null; categoria_nome?: string | null;
      centro_lucro_nome?: string | null; departamento_nome?: string | null; filial_nome?: string | null;
      projeto_nome?: string | null; fornecedor_nome?: string | null; fornecedor_id?: string | number | null;
      fornecedor_imagem_url?: string | null; numero_nota_fiscal?: string | null; valor_pago?: number | null;
    };
    const rows = await runQuery<Row>(sql, params);

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

    const mapped = rows.map((r) => ({
      id: String(r.conta_id),
      fornecedor_id: r.fornecedor_id ? String(r.fornecedor_id) : '',
      fornecedor_nome: r.fornecedor_nome || '-',
      descricao: r.descricao_conta || '',
      numero_nota_fiscal: r.numero_nota_fiscal ? String(r.numero_nota_fiscal) : undefined,
      valor: Number(r.valor_a_pagar || 0),
      valor_pago: Number(r.valor_pago || 0),
      valor_pendente: Math.max(0, Number(r.valor_a_pagar || 0) - Number(r.valor_pago || 0)),
      data_emissao: r.data_lancamento ? String(r.data_lancamento) : '',
      data_vencimento: r.data_vencimento ? String(r.data_vencimento) : '',
      status: r.status_conta || '',
      categoria_nome: r.categoria_nome || undefined,
      centro_custo_nome: r.centro_lucro_nome || undefined,
    }))

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
