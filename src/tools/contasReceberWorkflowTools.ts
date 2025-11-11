/**
 * WORKFLOW TOOLS: Contas a Receber
 *
 * Tools específicas para o fluxo de criação de contas a receber.
 * Fluxo completo:
 * 1. Usuário envia documento (nota fiscal/fatura)
 * 2. Claude extrai dados automaticamente
 * 3. buscarClassificacoesFinanceiras → exibe opções (REUTILIZADA de contas a pagar)
 * 4. buscarCliente → verifica se cliente existe
 * 5. criarCliente → cria se não existir
 * 6. criarContaReceber → registra a conta a receber
 *
 * @workflow contas-a-receber
 */

import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

// ========================================
// WORKFLOW TOOL 1: Buscar Cliente
// ========================================
export const buscarCliente = tool({
  description: '[WORKFLOW] Busca cliente no banco por CPF/CNPJ, nome ou lista todos quando não houver filtro.',

  inputSchema: z.object({
    cpf_cnpj: z.string().optional()
      .describe('CPF (11 dígitos) ou CNPJ (14 dígitos) do cliente'),
    nome: z.string().optional()
      .describe('Nome do cliente (parcial ou completo). Se ausente e sem CPF/CNPJ, lista todos.'),
    limite: z.number().int().positive().max(10000).optional()
      .describe('Limite de resultados na listagem geral (default sem limite).')
  }),

  execute: async ({ cpf_cnpj, nome, limite }) => {
    try {
      const conds: string[] = []
      const params: unknown[] = []
      let i = 1

      if (cpf_cnpj) {
        const digits = cpf_cnpj.replace(/\D/g, '')
        if (digits.length > 0) {
          conds.push(`REPLACE(REPLACE(REPLACE(c.cpf_cnpj, '.', ''), '/', ''), '-', '') = $${i++}`)
          params.push(digits)
        }
      }
      if (nome) {
        const term = nome.trim()
        if (term.length > 0) {
          conds.push(`c.nome_fantasia ILIKE $${i++}`)
          params.push(`%${term}%`)
        }
      }

      const listAll = conds.length === 0
      const where = listAll ? '' : `WHERE ${conds.join(' AND ')}`
      const limitClause = listAll && limite ? `LIMIT ${Math.max(1, Math.min(10000, limite))}` : ''

      const sql = `
        SELECT c.id::text AS id,
               c.nome_fantasia::text AS nome
          FROM entidades.clientes c
          ${where}
         ORDER BY c.nome_fantasia ASC
         ${limitClause}
      `.replace(/\n\s+/g, ' ').trim()

      type Row = { id: string; nome: string }
      const rows = await runQuery<Row>(sql, params)

      if (listAll) {
        return {
          success: true,
          cliente_encontrado: rows.length > 0,
          data: null,
          rows,
          count: rows.length,
          message: rows.length ? `${rows.length} cliente(s) encontrado(s)` : 'Nenhum cliente cadastrado',
          title: 'Clientes'
        } as const
      }

      if (rows.length === 1) {
        return {
          success: true,
          cliente_encontrado: true,
          data: rows[0],
          message: `Cliente encontrado: ${rows[0].nome}`,
          title: 'Cliente Encontrado'
        } as const
      }

      if (rows.length > 1) {
        return {
          success: true,
          cliente_encontrado: true,
          data: null,
          rows,
          count: rows.length,
          message: `${rows.length} clientes encontrados para o filtro`,
          title: 'Clientes'
        } as const
      }

      return {
        success: true,
        cliente_encontrado: false,
        data: null,
        rows: [],
        count: 0,
        message: cpf_cnpj
          ? `Nenhum cliente encontrado com CPF/CNPJ ${cpf_cnpj}. Será necessário criar um novo cadastro.`
          : `Nenhum cliente encontrado com o nome "${nome}". Será necessário criar um novo cadastro.`,
        title: 'Cliente Não Encontrado'
      } as const
    } catch (error) {
      return {
        success: false,
        cliente_encontrado: false,
        data: null,
        message: 'Erro ao buscar cliente',
        error: error instanceof Error ? error.message : String(error),
        title: 'Cliente (Erro na Busca)'
      } as const
    }
  }
});

// ========================================
// WORKFLOW TOOL 2: Criar Cliente
// ========================================
export const criarCliente = tool({
  description: '[WORKFLOW] Cria novo cliente no sistema. Use quando buscarCliente não encontrar o cliente e for necessário cadastrá-lo antes de criar a conta a receber.',

  inputSchema: z.object({
    nome: z.string()
      .describe('Nome completo (pessoa física) ou razão social (pessoa jurídica)'),
    cpf_cnpj: z.string()
      .describe('CPF (11 dígitos) ou CNPJ (14 dígitos) do cliente'),
    tipo_pessoa: z.enum(['fisica', 'juridica']).optional()
      .describe('Tipo de pessoa: "fisica" para CPF ou "juridica" para CNPJ'),
    endereco: z.string().optional()
      .describe('Endereço completo do cliente'),
    telefone: z.string().optional()
      .describe('Telefone de contato'),
    email: z.string().optional()
      .describe('E-mail de contato'),
    observacoes: z.string().optional()
      .describe('Observações adicionais sobre o cliente')
  }),

  execute: async ({ nome, cpf_cnpj, tipo_pessoa, endereco, telefone, email, observacoes }) => {
    // TODO: Integrar com BigQuery
    // Tabela esperada: clientes
    // Query: INSERT INTO clientes (...) VALUES (...) RETURNING *

    // Validação básica de CPF/CNPJ (apenas formato)
    const docLimpo = cpf_cnpj.replace(/[^\d]/g, '');
    if (docLimpo.length !== 11 && docLimpo.length !== 14) {
      return {
        success: false,
        data: null,
        message: 'CPF/CNPJ inválido. CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos.',
        error: 'Validação falhou'
      };
    }

    // Auto-detectar tipo de pessoa se não informado
    let tipoPessoaFinal = tipo_pessoa;
    if (!tipoPessoaFinal) {
      tipoPessoaFinal = docLimpo.length === 11 ? 'fisica' : 'juridica';
    }

    // Simular criação com ID gerado
    const novoCliente = {
      id: `cli-${Date.now()}`, // Simula UUID
      nome,
      cpf_cnpj,
      tipo_pessoa: tipoPessoaFinal,
      endereco: endereco || 'Não informado',
      telefone: telefone || 'Não informado',
      email: email || 'Não informado',
      observacoes: observacoes || '',
      data_cadastro: new Date().toISOString().split('T')[0],
      status: 'ativo'
    };

    return {
      success: true,
      data: novoCliente,
      message: `Cliente "${nome}" criado com sucesso! ID: ${novoCliente.id}`,
      title: 'Cliente Criado',
      cpf_cnpj_formatado: cpf_cnpj
    };
  }
});

// ========================================
// WORKFLOW TOOL 3: Criar Conta a Receber
// ========================================
export const criarContaReceber = tool({
  description: '[WORKFLOW] Cria nova conta a receber no sistema. Esta é a etapa final do fluxo. Usa as informações extraídas do documento e os IDs obtidos das tools anteriores (cliente, categoria, centro de custo).',

  inputSchema: z.object({
    cliente_id: z.string()
      .describe('ID do cliente (obtido de buscarCliente ou criarCliente)'),
    categoria_id: z.string()
      .describe('ID da categoria financeira (obtido de buscarClassificacoesFinanceiras)'),
    centro_custo_id: z.string()
      .describe('ID do centro de custo (obtido de buscarClassificacoesFinanceiras)'),
    natureza_financeira_id: z.string().optional()
      .describe('ID da natureza financeira (opcional, obtido de buscarClassificacoesFinanceiras)'),
    valor: z.number()
      .describe('Valor total da conta a receber'),
    data_vencimento: z.string()
      .describe('Data de vencimento (formato: YYYY-MM-DD)'),
    data_emissao: z.string().optional()
      .describe('Data de emissão do documento (formato: YYYY-MM-DD)'),
    numero_nota_fiscal: z.string().optional()
      .describe('Número da nota fiscal ou fatura'),
    descricao: z.string().optional()
      .describe('Descrição ou observações sobre a conta'),
    itens: z.array(z.object({
      descricao: z.string().describe('Descrição do item/serviço'),
      quantidade: z.number().describe('Quantidade'),
      valor_unitario: z.number().describe('Valor unitário'),
      valor_total: z.number().optional().describe('Valor total do item (quantidade * valor_unitario)')
    })).optional()
      .describe('Itens detalhados da nota fiscal (opcional)')
  }),

  execute: async ({
    cliente_id,
    categoria_id,
    centro_custo_id,
    natureza_financeira_id,
    valor,
    data_vencimento,
    data_emissao,
    numero_nota_fiscal,
    descricao,
    itens
  }) => {
    // TODO: Integrar com BigQuery
    // Tabelas esperadas: contas_a_receber, contas_a_receber_itens
    // Query 1: INSERT INTO contas_a_receber (...) VALUES (...) RETURNING *
    // Query 2: INSERT INTO contas_a_receber_itens (...) VALUES (...) (se itens existirem)

    // Validações básicas
    if (valor <= 0) {
      return {
        success: false,
        data: null,
        message: 'O valor da conta deve ser maior que zero',
        error: 'Validação falhou'
      };
    }

    // Validar data de vencimento
    const vencimento = new Date(data_vencimento);
    if (isNaN(vencimento.getTime())) {
      return {
        success: false,
        data: null,
        message: 'Data de vencimento inválida',
        error: 'Validação falhou'
      };
    }

    // Calcular total dos itens se existirem
    let valorTotalItens = 0;
    const itensProcessados = itens?.map(item => {
      const valorTotalItem = item.valor_total || (item.quantidade * item.valor_unitario);
      valorTotalItens += valorTotalItem;
      return {
        ...item,
        valor_total: valorTotalItem
      };
    });

    // Verificar se soma dos itens bate com o valor total (com margem de erro de R$ 0.10)
    if (itensProcessados && Math.abs(valorTotalItens - valor) > 0.10) {
      return {
        success: false,
        data: null,
        message: `A soma dos itens (R$ ${valorTotalItens.toFixed(2)}) não corresponde ao valor total (R$ ${valor.toFixed(2)})`,
        error: 'Validação falhou'
      };
    }

    // Simular criação da conta a receber
    const novaContaReceber = {
      id: `cr-${Date.now()}`, // Simula UUID
      cliente_id,
      categoria_id,
      centro_custo_id,
      natureza_financeira_id: natureza_financeira_id || null,
      valor,
      valor_recebido: 0,
      valor_pendente: valor,
      data_vencimento,
      data_emissao: data_emissao || new Date().toISOString().split('T')[0],
      data_cadastro: new Date().toISOString(),
      numero_nota_fiscal: numero_nota_fiscal || null,
      descricao: descricao || '',
      status: 'pendente',
      itens: itensProcessados || [],
      quantidade_itens: itensProcessados?.length || 0
    };

    // Determinar se está vencida
    const hoje = new Date();
    const diasParaVencimento = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    let statusVencimento = '';
    if (diasParaVencimento < 0) {
      statusVencimento = `⚠️ VENCIDA há ${Math.abs(diasParaVencimento)} dias`;
    } else if (diasParaVencimento === 0) {
      statusVencimento = '⚠️ Vence HOJE';
    } else if (diasParaVencimento <= 7) {
      statusVencimento = `🔔 Vence em ${diasParaVencimento} dias`;
    } else {
      statusVencimento = `✅ Vence em ${diasParaVencimento} dias`;
    }

    return {
      success: true,
      data: novaContaReceber,
      message: `Conta a receber criada com sucesso! ID: ${novaContaReceber.id}`,
      title: 'Conta a Receber Criada',
      resumo: {
        id: novaContaReceber.id,
        valor_formatado: valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        data_vencimento,
        status_vencimento: statusVencimento,
        dias_para_vencimento: diasParaVencimento,
        numero_nota_fiscal: numero_nota_fiscal || 'Não informado',
        quantidade_itens: novaContaReceber.quantidade_itens
      }
    };
  }
});
