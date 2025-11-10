/**
 * WORKFLOW TOOLS: Contas a Pagar
 *
 * Tools específicas para o fluxo de criação de contas a pagar.
 * Fluxo completo:
 * 1. Usuário envia documento (imagem/PDF)
 * 2. Claude extrai dados automaticamente
 * 3. buscarClassificacoesFinanceiras → exibe opções de categorias/centros de custo
 * 4. buscarFornecedor → verifica se fornecedor existe
 * 5. criarFornecedor → cria se não existir
 * 6. criarContaPagar → registra a conta a pagar
 *
 * @workflow contas-a-pagar
 */

import { z } from 'zod';
import { tool } from 'ai';

// ========================================
// WORKFLOW TOOL 1: Buscar Classificações Financeiras
// ========================================
export const buscarClassificacoesFinanceiras = tool({
  description: '[WORKFLOW] Busca todas as classificações financeiras disponíveis: categorias financeiras, centros de custo e naturezas financeiras. Use esta tool para mostrar as opções disponíveis ao usuário antes de criar uma conta a pagar.',

  inputSchema: z.object({
    termo_busca: z.string().optional()
      .describe('Termo opcional para filtrar as classificações. Se não informado, retorna todas.')
  }),

  execute: async ({ termo_busca }) => {
    // TODO: Integrar com BigQuery
    // Tabelas esperadas: categorias_financeiras, centros_custo, naturezas_financeiras

    // Mock data estruturado
    const categoriasFinanceiras = [
      { id: 'cat-001', nome: 'Fornecedores', tipo: 'despesa', descricao: 'Pagamentos a fornecedores' },
      { id: 'cat-002', nome: 'Salários e Encargos', tipo: 'despesa', descricao: 'Folha de pagamento' },
      { id: 'cat-003', nome: 'Impostos', tipo: 'despesa', descricao: 'Tributos e impostos' },
      { id: 'cat-004', nome: 'Aluguel', tipo: 'despesa', descricao: 'Aluguel de imóveis' },
      { id: 'cat-005', nome: 'Serviços de Terceiros', tipo: 'despesa', descricao: 'Serviços contratados' },
      { id: 'cat-006', nome: 'Energia e Água', tipo: 'despesa', descricao: 'Contas de consumo' },
      { id: 'cat-007', nome: 'Telefonia e Internet', tipo: 'despesa', descricao: 'Comunicação' },
      { id: 'cat-008', nome: 'Marketing e Publicidade', tipo: 'despesa', descricao: 'Investimentos em marketing' },
    ];

    const centrosCusto = [
      { id: 'cc-001', nome: 'Administrativo', descricao: 'Despesas administrativas gerais' },
      { id: 'cc-002', nome: 'Comercial', descricao: 'Departamento de vendas' },
      { id: 'cc-003', nome: 'Operações', descricao: 'Operações e produção' },
      { id: 'cc-004', nome: 'TI', descricao: 'Tecnologia da Informação' },
      { id: 'cc-005', nome: 'RH', descricao: 'Recursos Humanos' },
      { id: 'cc-006', nome: 'Financeiro', descricao: 'Departamento financeiro' },
      { id: 'cc-007', nome: 'Marketing', descricao: 'Marketing e comunicação' },
    ];

    const naturezasFinanceiras = [
      { id: 'nat-001', nome: 'Despesa Fixa', tipo: 'despesa' },
      { id: 'nat-002', nome: 'Despesa Variável', tipo: 'despesa' },
      { id: 'nat-003', nome: 'Investimento', tipo: 'despesa' },
      { id: 'nat-004', nome: 'Custo Operacional', tipo: 'despesa' },
    ];

    // Filtrar se termo_busca foi fornecido
    let categoriasFiltradas = categoriasFinanceiras;
    let centrosFiltrados = centrosCusto;
    let naturezasFiltradas = naturezasFinanceiras;

    if (termo_busca) {
      const termo = termo_busca.toLowerCase();
      categoriasFiltradas = categoriasFinanceiras.filter(c =>
        c.nome.toLowerCase().includes(termo) || c.descricao.toLowerCase().includes(termo)
      );
      centrosFiltrados = centrosCusto.filter(cc =>
        cc.nome.toLowerCase().includes(termo) || cc.descricao.toLowerCase().includes(termo)
      );
      naturezasFiltradas = naturezasFinanceiras.filter(n =>
        n.nome.toLowerCase().includes(termo)
      );
    }

    return {
      success: true,
      message: termo_busca
        ? `Encontradas ${categoriasFiltradas.length} categorias, ${centrosFiltrados.length} centros de custo e ${naturezasFiltradas.length} naturezas financeiras para "${termo_busca}"`
        : `${categoriasFinanceiras.length} categorias financeiras, ${centrosCusto.length} centros de custo e ${naturezasFinanceiras.length} naturezas financeiras disponíveis`,
      title: 'Classificações Financeiras',
      data: {
        categorias_financeiras: categoriasFiltradas,
        centros_custo: centrosFiltrados,
        naturezas_financeiras: naturezasFiltradas
      },
      counts: {
        categorias: categoriasFiltradas.length,
        centros_custo: centrosFiltrados.length,
        naturezas: naturezasFiltradas.length
      }
    };
  }
});

// ========================================
// WORKFLOW TOOL 2: Buscar Fornecedor
// ========================================
export const buscarFornecedor = tool({
  description: '[WORKFLOW] Busca fornecedor existente no sistema por CNPJ ou nome. Use após extrair os dados do documento para verificar se o fornecedor já está cadastrado.',

  inputSchema: z.object({
    cnpj: z.string().optional()
      .describe('CNPJ do fornecedor (formato: 00.000.000/0000-00 ou apenas números)'),
    nome: z.string().optional()
      .describe('Nome do fornecedor para busca caso CNPJ não esteja disponível')
  }),

  execute: async ({ cnpj, nome }) => {
    // TODO: Integrar com BigQuery
    // Tabela esperada: fornecedores
    // Query: SELECT * FROM fornecedores WHERE cnpj = ? OR nome ILIKE ?

    if (!cnpj && !nome) {
      return {
        success: false,
        fornecedor_encontrado: false,
        data: null,
        message: 'É necessário informar CNPJ ou nome do fornecedor',
        error: 'Parâmetros insuficientes'
      };
    }

    // Mock data: simular alguns fornecedores cadastrados
    const fornecedoresMock = [
      {
        id: 'forn-001',
        nome: 'Acme Suprimentos Ltda',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua das Flores, 123 - São Paulo, SP',
        telefone: '(11) 1234-5678',
        email: 'contato@acme.com.br',
        data_cadastro: '2024-01-15'
      },
      {
        id: 'forn-002',
        nome: 'Tech Solutions Brasil S.A.',
        cnpj: '98.765.432/0001-10',
        endereco: 'Av. Paulista, 1000 - São Paulo, SP',
        telefone: '(11) 9876-5432',
        email: 'contato@techsolutions.com.br',
        data_cadastro: '2024-03-20'
      }
    ];

    // Simular busca
    const cnpjLimpo = cnpj?.replace(/[^\d]/g, '');
    let fornecedorEncontrado = null;

    if (cnpjLimpo) {
      fornecedorEncontrado = fornecedoresMock.find(f =>
        f.cnpj.replace(/[^\d]/g, '') === cnpjLimpo
      );
    } else if (nome) {
      fornecedorEncontrado = fornecedoresMock.find(f =>
        f.nome.toLowerCase().includes(nome.toLowerCase())
      );
    }

    if (fornecedorEncontrado) {
      return {
        success: true,
        fornecedor_encontrado: true,
        data: fornecedorEncontrado,
        message: `Fornecedor encontrado: ${fornecedorEncontrado.nome}`,
        title: 'Fornecedor Encontrado'
      };
    } else {
      return {
        success: true,
        fornecedor_encontrado: false,
        data: null,
        message: cnpj
          ? `Nenhum fornecedor encontrado com CNPJ ${cnpj}. Será necessário criar um novo cadastro.`
          : `Nenhum fornecedor encontrado com o nome "${nome}". Será necessário criar um novo cadastro.`,
        title: 'Fornecedor Não Encontrado'
      };
    }
  }
});

// ========================================
// WORKFLOW TOOL 3: Criar Fornecedor
// ========================================
export const criarFornecedor = tool({
  description: '[WORKFLOW] Cria novo fornecedor no sistema. Use quando buscarFornecedor não encontrar o fornecedor e for necessário cadastrá-lo antes de criar a conta a pagar.',

  inputSchema: z.object({
    nome: z.string()
      .describe('Nome ou razão social do fornecedor'),
    cnpj: z.string()
      .describe('CNPJ do fornecedor'),
    endereco: z.string().optional()
      .describe('Endereço completo do fornecedor'),
    telefone: z.string().optional()
      .describe('Telefone de contato'),
    email: z.string().optional()
      .describe('E-mail de contato'),
    observacoes: z.string().optional()
      .describe('Observações adicionais sobre o fornecedor')
  }),

  execute: async ({ nome, cnpj, endereco, telefone, email, observacoes }) => {
    // TODO: Integrar com BigQuery
    // Tabela esperada: fornecedores
    // Query: INSERT INTO fornecedores (...) VALUES (...) RETURNING *

    // Validação básica de CNPJ (apenas formato)
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    if (cnpjLimpo.length !== 14) {
      return {
        success: false,
        data: null,
        message: 'CNPJ inválido. O CNPJ deve conter 14 dígitos.',
        error: 'Validação falhou'
      };
    }

    // Simular criação com ID gerado
    const novoFornecedor = {
      id: `forn-${Date.now()}`, // Simula UUID
      nome,
      cnpj,
      endereco: endereco || 'Não informado',
      telefone: telefone || 'Não informado',
      email: email || 'Não informado',
      observacoes: observacoes || '',
      data_cadastro: new Date().toISOString().split('T')[0],
      status: 'ativo'
    };

    return {
      success: true,
      data: novoFornecedor,
      message: `Fornecedor "${nome}" criado com sucesso! ID: ${novoFornecedor.id}`,
      title: 'Fornecedor Criado',
      cnpj_formatado: cnpj
    };
  }
});

// ========================================
// WORKFLOW TOOL 4: Criar Conta a Pagar
// ========================================
export const criarContaPagar = tool({
  description: '[WORKFLOW] Cria nova conta a pagar no sistema. Esta é a etapa final do fluxo. Usa as informações extraídas do documento e os IDs obtidos das tools anteriores (fornecedor, categoria, centro de custo).',

  inputSchema: z.object({
    fornecedor_id: z.string()
      .describe('ID do fornecedor (obtido de buscarFornecedor ou criarFornecedor)'),
    categoria_id: z.string()
      .describe('ID da categoria financeira (obtido de buscarClassificacoesFinanceiras)'),
    centro_custo_id: z.string()
      .describe('ID do centro de custo (obtido de buscarClassificacoesFinanceiras)'),
    natureza_financeira_id: z.string().optional()
      .describe('ID da natureza financeira (opcional, obtido de buscarClassificacoesFinanceiras)'),
    valor: z.number()
      .describe('Valor total da conta a pagar'),
    data_vencimento: z.string()
      .describe('Data de vencimento (formato: YYYY-MM-DD)'),
    data_emissao: z.string().optional()
      .describe('Data de emissão do documento (formato: YYYY-MM-DD)'),
    numero_nota_fiscal: z.string().optional()
      .describe('Número da nota fiscal'),
    descricao: z.string().optional()
      .describe('Descrição ou observações sobre a conta'),
    itens: z.array(z.object({
      descricao: z.string().describe('Descrição do item'),
      quantidade: z.number().describe('Quantidade'),
      valor_unitario: z.number().describe('Valor unitário'),
      valor_total: z.number().optional().describe('Valor total do item (quantidade * valor_unitario)')
    })).optional()
      .describe('Itens detalhados da nota fiscal (opcional)')
  }),

  execute: async ({
    fornecedor_id,
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
    // Tabelas esperadas: contas_a_pagar, contas_a_pagar_itens
    // Query 1: INSERT INTO contas_a_pagar (...) VALUES (...) RETURNING *
    // Query 2: INSERT INTO contas_a_pagar_itens (...) VALUES (...) (se itens existirem)

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

    // Simular criação da conta a pagar
    const novaContaPagar = {
      id: `cp-${Date.now()}`, // Simula UUID
      fornecedor_id,
      categoria_id,
      centro_custo_id,
      natureza_financeira_id: natureza_financeira_id || null,
      valor,
      valor_pago: 0,
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
      data: novaContaPagar,
      message: `Conta a pagar criada com sucesso! ID: ${novaContaPagar.id}`,
      title: 'Conta a Pagar Criada',
      resumo: {
        id: novaContaPagar.id,
        valor_formatado: valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        data_vencimento,
        status_vencimento: statusVencimento,
        dias_para_vencimento: diasParaVencimento,
        numero_nota_fiscal: numero_nota_fiscal || 'Não informado',
        quantidade_itens: novaContaPagar.quantidade_itens
      }
    };
  }
});
