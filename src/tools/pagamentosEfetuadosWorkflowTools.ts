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
  description: '[WORKFLOW] Cria registro de pagamento efetuado e vincula à conta a pagar. O sistema baixa a conta automaticamente.',
  inputSchema: z.object({
    conta_pagar_id: z.string().describe('ID da conta a pagar'),
    valor_pago: z.number().describe('Valor pago'),
    data_pagamento: z.string().describe('Data do pagamento (YYYY-MM-DD)'),
    forma_pagamento: z.enum(['dinheiro', 'pix', 'transferencia', 'boleto', 'cartao_credito', 'cartao_debito', 'cheque']).describe('Forma de pagamento'),
    conta_financeira_id: z.string().describe('ID da conta financeira que efetuou o pagamento'),
    observacoes: z.string().optional().describe('Observações sobre o pagamento'),
    juros: z.number().optional().describe('Valor de juros pagos'),
    multa: z.number().optional().describe('Valor de multa paga'),
    desconto: z.number().optional().describe('Valor de desconto obtido'),
  }),
  execute: async ({ conta_pagar_id, valor_pago, data_pagamento, forma_pagamento, conta_financeira_id, observacoes, juros, multa, desconto }) => {
    // Mock data - será substituído por insert real no BigQuery

    // Calcular valores
    const valor_juros = juros || 0;
    const valor_multa = multa || 0;
    const valor_desconto = desconto || 0;
    const valor_total = valor_pago + valor_juros + valor_multa - valor_desconto;

    const pagamentoCriado = {
      id: `pgto-efet-${Date.now()}`,
      conta_pagar_id,
      valor_pago,
      valor_juros,
      valor_multa,
      valor_desconto,
      valor_total,
      data_pagamento,
      forma_pagamento,
      conta_financeira_id,
      conta_financeira_nome: 'Banco do Brasil - CC 12345-6',
      observacoes: observacoes || '',
      status: 'pago',
      data_cadastro: new Date().toISOString(),
      // Dados da conta a pagar vinculada
      conta_pagar: {
        numero_nota_fiscal: 'NF-FN-2024-001',
        fornecedor_nome: 'Fornecedor ABC LTDA',
        valor_original: 8500.00,
        status_anterior: 'pendente',
        status_atual: 'pago'
      }
    };

    const formasPagamentoLabels: Record<string, string> = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      transferencia: 'Transferência Bancária',
      boleto: 'Boleto',
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito',
      cheque: 'Cheque'
    };

    return {
      success: true,
      data: pagamentoCriado,
      message: `Pagamento efetuado com sucesso! Conta a pagar ${pagamentoCriado.conta_pagar.numero_nota_fiscal} baixada automaticamente.`,
      title: '💸 Pagamento Efetuado',
      resumo: {
        id: pagamentoCriado.id,
        valor_formatado: valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        data_pagamento,
        forma_pagamento: formasPagamentoLabels[forma_pagamento],
        conta_financeira: pagamentoCriado.conta_financeira_nome,
        nota_fiscal: pagamentoCriado.conta_pagar.numero_nota_fiscal,
        fornecedor: pagamentoCriado.conta_pagar.fornecedor_nome,
        status_conta: 'Baixada automaticamente'
      },
      detalhamento: {
        valor_principal: valor_pago,
        juros: valor_juros,
        multa: valor_multa,
        desconto: valor_desconto,
        total: valor_total
      }
    };
  }
});
