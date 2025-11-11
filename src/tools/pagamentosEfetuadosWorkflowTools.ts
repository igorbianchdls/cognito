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
    valor: z.number().optional().describe('Valor da conta a pagar (igualdade exata)'),
    data_vencimento: z.string().optional().describe('Data de vencimento (YYYY-MM-DD)'),
  }),
  execute: async ({ fornecedor_id, fornecedor_nome, valor, data_vencimento }) => {
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
    if (data_vencimento) { conditions.push(`lf.data_vencimento = $${i++}`); params.push(data_vencimento) }

    if (conditions.length) sql += ' AND ' + conditions.join(' AND ')
    sql += ' ORDER BY lf.id DESC LIMIT 1'

    type Row = { conta_id: string | number; descricao_conta: string | null; valor_a_pagar: number | null; status_conta: string | null; fornecedor_nome: string | null }
    const rows = await runQuery<Row>(sql.trim(), params)

    if (!rows.length) {
      return {
        success: true,
        conta_encontrada: false,
        data: null,
        message: 'Nenhuma conta a pagar encontrada com os critérios informados',
        title: '⚠️ Conta Não Encontrada',
      } as const
    }

    const r = rows[0]
    const valorNum = Number(r.valor_a_pagar || 0)
    const data = {
      id: String(r.conta_id),
      fornecedor_id: '',
      fornecedor_nome: r.fornecedor_nome || '-',
      numero_nota_fiscal: undefined,
      valor: valorNum,
      valor_pago: 0,
      valor_pendente: valorNum,
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

    return {
      success: true,
      conta_encontrada: true,
      data,
      message: `Conta a pagar encontrada: ${data.descricao || data.id} - ${data.fornecedor_nome}`,
      title: '✅ Conta a Pagar Encontrada',
      valor_formatado: valorNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      resumo: {
        id: data.id,
        numero_nota_fiscal: data.numero_nota_fiscal || '-',
        fornecedor: data.fornecedor_nome,
        valor: valorNum,
        status: data.status,
        vencimento: data.data_vencimento || '-',
      }
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
