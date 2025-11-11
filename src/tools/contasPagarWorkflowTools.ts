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
import { runQuery } from '@/lib/postgres';

// ========================================
// WORKFLOW TOOL 1: Buscar Classificações Financeiras
// ========================================
export const buscarClassificacoesFinanceiras = tool({
  description:
    '[WORKFLOW] Busca todas as classificações financeiras disponíveis (categorias financeiras, centros de custo, naturezas financeiras, centros de lucro, departamentos, filiais e projetos). Use esta tool para mostrar as opções ao usuário antes de criar uma conta a pagar.',

  inputSchema: z.object({
    termo_busca: z
      .string()
      .optional()
      .describe('Termo opcional para filtrar por nome/tipo. Se não informado, retorna todas.'),
  }),

  execute: async ({ termo_busca }) => {
    try {
      const hasFilter = Boolean(termo_busca && termo_busca.trim().length > 0);
      const searchParam = hasFilter ? `%${termo_busca!.trim()}%` : undefined;

      const sql = `
        SELECT * FROM (
          SELECT 'categoria_financeira'::text AS tipo, id::text AS id, nome::text AS nome FROM financeiro.categorias_financeiras
          UNION ALL
          SELECT 'natureza_financeira'::text AS tipo, id::text AS id, nome::text AS nome FROM financeiro.naturezas_financeiras
          UNION ALL
          SELECT 'projeto'::text AS tipo, id::text AS id, nome::text AS nome FROM financeiro.projetos
          UNION ALL
          SELECT 'filial'::text AS tipo, id::text AS id, nome::text AS nome FROM empresa.filiais
          UNION ALL
          SELECT 'centro_custo'::text AS tipo, id::text AS id, nome::text AS nome FROM empresa.centros_custo
          UNION ALL
          SELECT 'centro_lucro'::text AS tipo, id::text AS id, nome::text AS nome FROM empresa.centros_lucro
          UNION ALL
          SELECT 'departamento'::text AS tipo, id::text AS id, nome::text AS nome FROM empresa.departamentos
        ) u
        ${hasFilter ? 'WHERE u.nome ILIKE $1 OR u.tipo ILIKE $1' : ''}
        ORDER BY u.tipo, u.nome
      `.replace(/\n\s+/g, ' ').trim();

      type Row = { tipo: string; id: string; nome: string };
      const rows = await runQuery<Row>(sql, hasFilter ? [searchParam] : undefined);

      // Buckets principais exigidos pelo UI atual
      const categorias_financeiras: Array<{ id: string; nome: string; tipo: string; descricao: string }> = [];
      const centros_custo: Array<{ id: string; nome: string; descricao: string }> = [];
      const naturezas_financeiras: Array<{ id: string; nome: string; tipo: string }> = [];

      // Buckets adicionais (para uso futuro)
      const centros_lucro: Array<{ id: string; nome: string }> = [];
      const departamentos: Array<{ id: string; nome: string }> = [];
      const filiais: Array<{ id: string; nome: string }> = [];
      const projetos: Array<{ id: string; nome: string }> = [];

      for (const r of rows) {
        switch (r.tipo) {
          case 'categoria_financeira':
            categorias_financeiras.push({ id: r.id, nome: r.nome, tipo: '', descricao: '' });
            break;
          case 'natureza_financeira':
            naturezas_financeiras.push({ id: r.id, nome: r.nome, tipo: '' });
            break;
          case 'centro_custo':
            centros_custo.push({ id: r.id, nome: r.nome, descricao: '' });
            break;
          case 'centro_lucro':
            centros_lucro.push({ id: r.id, nome: r.nome });
            break;
          case 'departamento':
            departamentos.push({ id: r.id, nome: r.nome });
            break;
          case 'filial':
            filiais.push({ id: r.id, nome: r.nome });
            break;
          case 'projeto':
            projetos.push({ id: r.id, nome: r.nome });
            break;
          default:
            break;
        }
      }

      const msgBase = `${categorias_financeiras.length} categorias financeiras, ${centros_custo.length} centros de custo e ${naturezas_financeiras.length} naturezas financeiras disponíveis`;
      const message = hasFilter
        ? `Encontradas ${categorias_financeiras.length} categorias, ${centros_custo.length} centros de custo e ${naturezas_financeiras.length} naturezas para "${termo_busca}"`
        : msgBase;

      return {
        success: true,
        message,
        title: 'Classificações Financeiras',
        data: {
          categorias_financeiras,
          centros_custo,
          naturezas_financeiras,
          // extras (para evolução futura do UI)
          centros_lucro,
          departamentos,
          filiais,
          projetos,
        },
        counts: {
          categorias: categorias_financeiras.length,
          centros_custo: centros_custo.length,
          naturezas: naturezas_financeiras.length,
        },
      };
    } catch (err) {
      return {
        success: false,
        message: 'Falha ao buscar classificações financeiras',
        title: 'Classificações Financeiras',
        data: {
          categorias_financeiras: [],
          centros_custo: [],
          naturezas_financeiras: [],
          centros_lucro: [],
          departamentos: [],
          filiais: [],
          projetos: [],
        },
        counts: { categorias: 0, centros_custo: 0, naturezas: 0 },
        error: err instanceof Error ? err.message : String(err),
      } as const;
    }
  },
});

// ========================================
// WORKFLOW TOOL 2: Buscar Fornecedor
// ========================================
export const buscarFornecedor = tool({
  description:
    '[WORKFLOW] Busca fornecedor existente no sistema por CNPJ ou nome (schema entidades). Use após extrair os dados do documento para verificar se o fornecedor já está cadastrado.',

  inputSchema: z.object({
    cnpj: z
      .string()
      .optional()
      .describe('CNPJ do fornecedor (formato livre; apenas dígitos serão considerados)'),
    nome: z
      .string()
      .optional()
      .describe('Nome do fornecedor para busca caso CNPJ não esteja disponível'),
  }),

  execute: async ({ cnpj, nome }) => {
    if (!cnpj && !nome) {
      return {
        success: false,
        fornecedor_encontrado: false,
        data: null,
        message: 'É necessário informar CNPJ ou nome do fornecedor',
        error: 'Parâmetros insuficientes',
      } as const;
    }

    try {
      // Monta condições dinâmicas
      const conds: string[] = [];
      const params: unknown[] = [];
      let i = 1;

      if (cnpj) {
        const cnpjDigits = cnpj.replace(/\D/g, '');
        if (cnpjDigits.length > 0) {
          conds.push(`REPLACE(REPLACE(REPLACE(f.cnpj, '.', ''), '/', ''), '-', '') = $${i++}`);
          params.push(cnpjDigits);
        }
      }
      if (nome) {
        const term = nome.trim();
        if (term.length > 0) {
          conds.push(`LOWER(f.nome) LIKE LOWER($${i++})`);
          params.push(`%${term}%`);
        }
      }

      if (conds.length === 0) {
        return {
          success: false,
          fornecedor_encontrado: false,
          data: null,
          message: 'Informe um CNPJ válido (com dígitos) ou um nome para busca',
          error: 'Parâmetros inválidos',
        } as const;
      }

      const where = `WHERE ${conds.join(' AND ')}`;
      const sql = `
        SELECT f.id::text AS id,
               COALESCE(f.nome, '')::text AS nome,
               COALESCE(f.cnpj, '')::text AS cnpj,
               COALESCE(f.email, '')::text AS email,
               COALESCE(f.telefone, '')::text AS telefone
          FROM entidades.fornecedores f
          ${where}
         ORDER BY f.nome ASC
         LIMIT 1
      `.replace(/\n\s+/g, ' ').trim();

      type Row = { id: string; nome: string; cnpj: string; email: string; telefone: string };
      const [row] = await runQuery<Row>(sql, params);

      if (row) {
        return {
          success: true,
          fornecedor_encontrado: true,
          data: {
            id: row.id,
            nome: row.nome,
            cnpj: row.cnpj,
            email: row.email || undefined,
            telefone: row.telefone || undefined,
          },
          message: `Fornecedor encontrado: ${row.nome}`,
          title: 'Fornecedor Encontrado',
        };
      }

      return {
        success: true,
        fornecedor_encontrado: false,
        data: null,
        message: cnpj
          ? `Nenhum fornecedor encontrado com CNPJ ${cnpj}. Será necessário criar um novo cadastro.`
          : `Nenhum fornecedor encontrado com o nome "${nome}". Será necessário criar um novo cadastro.`,
        title: 'Fornecedor Não Encontrado',
      } as const;
    } catch (error) {
      return {
        success: false,
        fornecedor_encontrado: false,
        data: null,
        message: 'Erro ao buscar fornecedor',
        error: error instanceof Error ? error.message : String(error),
        title: 'Fornecedor (Erro na Busca)',
      } as const;
    }
  },
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
