import { z } from 'zod';
import { tool } from 'ai';

// ============================================
// WORKFLOW TOOLS - PAGAMENTOS RECEBIDOS
// ============================================

/**
 * [WORKFLOW] Busca conta a receber existente
 * Permite buscar por NF, cliente, valor ou vencimento
 */
export const buscarContaReceber = tool({
  description: '[WORKFLOW] Busca conta a receber existente no sistema por número de NF, cliente, valor ou data de vencimento',
  inputSchema: z.object({
    numero_nota_fiscal: z.string().optional().describe('Número da nota fiscal'),
    cliente_id: z.string().optional().describe('ID do cliente'),
    cliente_nome: z.string().optional().describe('Nome do cliente para busca'),
    valor: z.number().optional().describe('Valor da conta a receber'),
    data_vencimento: z.string().optional().describe('Data de vencimento (YYYY-MM-DD)'),
  }),
  execute: async ({ numero_nota_fiscal, cliente_id, cliente_nome, valor, data_vencimento }) => {
    // Mock data - será substituído por query real do BigQuery
    const mockContasReceber = [
      {
        id: 'cr-001',
        cliente_id: 'cli-001',
        cliente_nome: 'Tech Solutions LTDA',
        numero_nota_fiscal: 'NF-2024-001',
        valor: 5500.00,
        valor_recebido: 0,
        valor_pendente: 5500.00,
        data_emissao: '2024-01-15',
        data_vencimento: '2024-02-15',
        status: 'pendente',
        categoria_id: 'cat-001',
        categoria_nome: 'Prestação de Serviços',
        centro_custo_id: 'cc-001',
        centro_custo_nome: 'Vendas',
        descricao: 'Desenvolvimento de Sistema',
        quantidade_itens: 3
      },
      {
        id: 'cr-002',
        cliente_id: 'cli-002',
        cliente_nome: 'João Silva - Consultoria',
        numero_nota_fiscal: 'NF-2024-002',
        valor: 3200.00,
        valor_recebido: 0,
        valor_pendente: 3200.00,
        data_emissao: '2024-01-20',
        data_vencimento: '2024-02-20',
        status: 'pendente',
        categoria_id: 'cat-002',
        categoria_nome: 'Consultoria',
        centro_custo_id: 'cc-001',
        centro_custo_nome: 'Vendas',
        descricao: 'Consultoria Empresarial',
        quantidade_itens: 1
      }
    ];

    // Filtrar com base nos critérios fornecidos
    let resultado = mockContasReceber.find(conta => {
      if (numero_nota_fiscal && conta.numero_nota_fiscal === numero_nota_fiscal) return true;
      if (cliente_id && conta.cliente_id === cliente_id) return true;
      if (cliente_nome && conta.cliente_nome.toLowerCase().includes(cliente_nome.toLowerCase())) return true;
      if (valor && Math.abs(conta.valor - valor) < 0.01) return true;
      if (data_vencimento && conta.data_vencimento === data_vencimento) return true;
      return false;
    });

    if (resultado) {
      return {
        success: true,
        conta_encontrada: true,
        data: resultado,
        message: `Conta a receber encontrada: ${resultado.numero_nota_fiscal} - ${resultado.cliente_nome}`,
        title: '✅ Conta a Receber Encontrada',
        valor_formatado: resultado.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        resumo: {
          id: resultado.id,
          numero_nota_fiscal: resultado.numero_nota_fiscal,
          cliente: resultado.cliente_nome,
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
        message: 'Nenhuma conta a receber encontrada com os critérios informados',
        title: '⚠️ Conta Não Encontrada',
      };
    }
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
