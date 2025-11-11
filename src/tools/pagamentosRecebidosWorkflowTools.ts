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
  description: '[WORKFLOW] Cria registro de pagamento recebido e vincula à conta a receber. O sistema baixa a conta automaticamente.',
  inputSchema: z.object({
    conta_receber_id: z.string().describe('ID da conta a receber'),
    valor_recebido: z.number().describe('Valor recebido'),
    data_recebimento: z.string().describe('Data do recebimento (YYYY-MM-DD)'),
    forma_pagamento: z.enum(['dinheiro', 'pix', 'transferencia', 'boleto', 'cartao_credito', 'cartao_debito', 'cheque']).describe('Forma de pagamento'),
    conta_financeira_id: z.string().describe('ID da conta financeira que recebeu'),
    observacoes: z.string().optional().describe('Observações sobre o recebimento'),
    juros: z.number().optional().describe('Valor de juros recebidos'),
    multa: z.number().optional().describe('Valor de multa recebida'),
    desconto: z.number().optional().describe('Valor de desconto concedido'),
  }),
  execute: async ({ conta_receber_id, valor_recebido, data_recebimento, forma_pagamento, conta_financeira_id, observacoes, juros, multa, desconto }) => {
    // Mock data - será substituído por insert real no BigQuery

    // Calcular valores
    const valor_juros = juros || 0;
    const valor_multa = multa || 0;
    const valor_desconto = desconto || 0;
    const valor_total = valor_recebido + valor_juros + valor_multa - valor_desconto;

    const pagamentoCriado = {
      id: `pgto-rec-${Date.now()}`,
      conta_receber_id,
      valor_recebido,
      valor_juros,
      valor_multa,
      valor_desconto,
      valor_total,
      data_recebimento,
      forma_pagamento,
      conta_financeira_id,
      conta_financeira_nome: 'Banco do Brasil - CC 12345-6',
      observacoes: observacoes || '',
      status: 'recebido',
      data_cadastro: new Date().toISOString(),
      // Dados da conta a receber vinculada
      conta_receber: {
        numero_nota_fiscal: 'NF-2024-001',
        cliente_nome: 'Tech Solutions LTDA',
        valor_original: 5500.00,
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
      message: `Pagamento recebido com sucesso! Conta a receber ${pagamentoCriado.conta_receber.numero_nota_fiscal} baixada automaticamente.`,
      title: '💰 Pagamento Recebido',
      resumo: {
        id: pagamentoCriado.id,
        valor_formatado: valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        data_recebimento,
        forma_pagamento: formasPagamentoLabels[forma_pagamento],
        conta_financeira: pagamentoCriado.conta_financeira_nome,
        nota_fiscal: pagamentoCriado.conta_receber.numero_nota_fiscal,
        cliente: pagamentoCriado.conta_receber.cliente_nome,
        status_conta: 'Baixada automaticamente'
      },
      detalhamento: {
        valor_principal: valor_recebido,
        juros: valor_juros,
        multa: valor_multa,
        desconto: valor_desconto,
        total: valor_total
      }
    };
  }
});
