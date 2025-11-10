import { z } from 'zod';
import { tool } from 'ai';

// ============================================
// WORKFLOW TOOLS - PAGAMENTOS EFETUADOS
// ============================================

/**
 * [WORKFLOW] Busca conta a pagar existente
 * Permite buscar por NF, fornecedor, valor ou vencimento
 */
export const buscarContaPagar = tool({
  description: '[WORKFLOW] Busca conta a pagar existente no sistema por número de NF, fornecedor, valor ou data de vencimento',
  inputSchema: z.object({
    numero_nota_fiscal: z.string().optional().describe('Número da nota fiscal'),
    fornecedor_id: z.string().optional().describe('ID do fornecedor'),
    fornecedor_nome: z.string().optional().describe('Nome do fornecedor para busca'),
    valor: z.number().optional().describe('Valor da conta a pagar'),
    data_vencimento: z.string().optional().describe('Data de vencimento (YYYY-MM-DD)'),
  }),
  execute: async ({ numero_nota_fiscal, fornecedor_id, fornecedor_nome, valor, data_vencimento }) => {
    // Mock data - será substituído por query real do BigQuery
    const mockContasPagar = [
      {
        id: 'cp-001',
        fornecedor_id: 'forn-001',
        fornecedor_nome: 'Fornecedor ABC LTDA',
        numero_nota_fiscal: 'NF-FN-2024-001',
        valor: 8500.00,
        valor_pago: 0,
        valor_pendente: 8500.00,
        data_emissao: '2024-01-10',
        data_vencimento: '2024-02-10',
        status: 'pendente',
        categoria_id: 'cat-003',
        categoria_nome: 'Fornecedores',
        centro_custo_id: 'cc-002',
        centro_custo_nome: 'Operações',
        descricao: 'Material de escritório',
        quantidade_itens: 5
      },
      {
        id: 'cp-002',
        fornecedor_id: 'forn-002',
        fornecedor_nome: 'Serviços Tech XYZ',
        numero_nota_fiscal: 'NF-FN-2024-002',
        valor: 4200.00,
        valor_pago: 0,
        valor_pendente: 4200.00,
        data_emissao: '2024-01-15',
        data_vencimento: '2024-02-15',
        status: 'pendente',
        categoria_id: 'cat-004',
        categoria_nome: 'Serviços de TI',
        centro_custo_id: 'cc-003',
        centro_custo_nome: 'Tecnologia',
        descricao: 'Manutenção de servidores',
        quantidade_itens: 2
      }
    ];

    // Filtrar com base nos critérios fornecidos
    const resultado = mockContasPagar.find(conta => {
      if (numero_nota_fiscal && conta.numero_nota_fiscal === numero_nota_fiscal) return true;
      if (fornecedor_id && conta.fornecedor_id === fornecedor_id) return true;
      if (fornecedor_nome && conta.fornecedor_nome.toLowerCase().includes(fornecedor_nome.toLowerCase())) return true;
      if (valor && Math.abs(conta.valor - valor) < 0.01) return true;
      if (data_vencimento && conta.data_vencimento === data_vencimento) return true;
      return false;
    });

    if (resultado) {
      return {
        success: true,
        conta_encontrada: true,
        data: resultado,
        message: `Conta a pagar encontrada: ${resultado.numero_nota_fiscal} - ${resultado.fornecedor_nome}`,
        title: '✅ Conta a Pagar Encontrada',
        valor_formatado: resultado.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        resumo: {
          id: resultado.id,
          numero_nota_fiscal: resultado.numero_nota_fiscal,
          fornecedor: resultado.fornecedor_nome,
          valor: resultado.valor,
          status: resultado.status,
          vencimento: resultado.data_vencimento
        }
      };
    } else {
      return {
        success: true,
        conta_encontrada: false,
        data: null,
        message: 'Nenhuma conta a pagar encontrada com os critérios informados',
        title: '⚠️ Conta Não Encontrada',
      };
    }
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
