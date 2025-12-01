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
    query: z
      .string()
      .optional()
      .describe('Alias genérico: se só dígitos, trata como CNPJ; caso contrário, filtra por nome_fantasia (LIKE).'),
    cnpj: z
      .string()
      .optional()
      .describe('CNPJ do fornecedor (formato livre; apenas dígitos serão considerados)'),
    nome: z
      .string()
      .optional()
      .describe('Nome do fornecedor (nome_fantasia) para busca (parcial ou completo). Se não informado e sem CNPJ, lista todos.'),
    limite: z
      .number()
      .int()
      .positive()
      .max(10000)
      .optional()
      .describe('Limite opcional de resultados ao listar (default: sem limite).'),
  }),

  execute: async ({ query, cnpj, nome, limite }) => {
    try {
      // Normaliza alias 'query' para cnpj/nome
      if (query && query.trim().length > 0) {
        const q = query.trim();
        const digits = q.replace(/\D/g, '');
        if (digits.length >= 11) {
          // assume CNPJ/CPF conforme dígitos (usa igualdade exata sobre CNPJ)
          cnpj = q;
        } else {
          nome = q;
        }
      }
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
          conds.push(`LOWER(f.nome_fantasia) LIKE LOWER($${i++})`);
          params.push(`%${term}%`);
        }
      }

      // Se não houver filtros, listar todos (com limite opcional)
      const listAll = conds.length === 0;
      const where = listAll ? '' : `WHERE ${conds.join(' AND ')}`;
      const defaultLimit = 100;
      const effLimit = Math.max(1, Math.min(10000, typeof limite === 'number' ? limite : defaultLimit));
      const limitClause = listAll ? `LIMIT ${effLimit}` : '';

      const sql = `
        SELECT f.id::text AS id,
               COALESCE(f.nome_fantasia, '')::text AS nome,
               COALESCE(f.cnpj, '')::text AS cnpj,
               COALESCE(f.email, '')::text AS email,
               COALESCE(f.telefone, '')::text AS telefone
          FROM entidades.fornecedores f
          ${where}
         ORDER BY f.nome_fantasia ASC
         ${limitClause}
      `.replace(/\n\s+/g, ' ').trim();

      type Row = { id: string; nome: string; cnpj: string; email: string; telefone: string };
      const rows = await runQuery<Row>(sql, params);

      if (listAll) {
        return {
          success: true,
          fornecedor_encontrado: rows.length > 0,
          data: null,
          rows: rows.map(r => ({
            id: r.id,
            nome: r.nome,
            cnpj: r.cnpj,
            email: r.email || undefined,
            telefone: r.telefone || undefined,
          })),
          count: rows.length,
          message: rows.length ? `${rows.length} fornecedor(es) encontrado(s)` : 'Nenhum fornecedor cadastrado',
          title: 'Fornecedores',
        } as const;
      }

      if (rows.length === 1) {
        const r = rows[0];
        return {
          success: true,
          fornecedor_encontrado: true,
          data: {
            id: r.id,
            nome: r.nome,
            cnpj: r.cnpj,
            email: r.email || undefined,
            telefone: r.telefone || undefined,
          },
          message: `Fornecedor encontrado: ${r.nome}`,
          title: 'Fornecedor Encontrado',
        } as const;
      }

      if (rows.length > 1) {
        return {
          success: true,
          fornecedor_encontrado: true,
          data: null,
          rows: rows.map(r => ({
            id: r.id,
            nome: r.nome,
            cnpj: r.cnpj,
            email: r.email || undefined,
            telefone: r.telefone || undefined,
          })),
          count: rows.length,
          message: `${rows.length} fornecedores encontrados para o filtro`,
          title: 'Fornecedores',
        } as const;
      }

      return {
        success: true,
        fornecedor_encontrado: false,
        data: null,
        rows: [],
        count: 0,
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
  description: '[WORKFLOW] Prévia de criação de fornecedor. A IA preenche os campos; o usuário revisa e confirma na UI para criar de fato.',

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
    const payload = {
      nome: String(nome || '').trim(),
      cnpj: String(cnpj || '').trim(),
      endereco: endereco ? String(endereco).trim() : '',
      telefone: telefone ? String(telefone).trim() : '',
      email: email ? String(email).trim() : '',
      observacoes: observacoes ? String(observacoes).trim() : ''
    };

    const validations: Array<{ field: string; status: 'ok' | 'warn' | 'error'; message?: string }> = [];
    if (!payload.nome) validations.push({ field: 'nome', status: 'error', message: 'Nome é obrigatório' });
    if (payload.cnpj) {
      const digits = payload.cnpj.replace(/\D/g, '');
      if (digits.length !== 14) validations.push({ field: 'cnpj', status: 'warn', message: 'CNPJ com formato incompleto (14 dígitos esperados)' });
    } else {
      validations.push({ field: 'cnpj', status: 'warn', message: 'CNPJ ausente' });
    }

    return {
      success: true,
      preview: true,
      title: 'Fornecedor (Prévia)',
      message: 'Revise os dados e clique em Criar para confirmar.',
      payload,
      validations,
      metadata: { entity: 'fornecedor', action: 'create', commitEndpoint: '/api/modulos/financeiro/fornecedores' }
    } as const;
  }
});

// ========================================
// WORKFLOW TOOL 4: Criar Conta a Pagar
// ========================================
export const criarContaPagar = tool({
  description: '[WORKFLOW] Prévia de criação de Conta a Pagar. A IA preenche os campos; o usuário revisa e confirma na UI para criar de fato.',

  inputSchema: z.object({
    fornecedor_id: z.string()
      .describe('ID do fornecedor (obtido de buscarFornecedor ou criarFornecedor)'),
    categoria_id: z.string()
      .describe('ID da categoria financeira (obtido de buscarClassificacoesFinanceiras)'),
    centro_custo_id: z.string()
      .describe('ID do centro de custo (obtido de buscarClassificacoesFinanceiras)'),
    natureza_financeira_id: z.string().optional()
      .describe('ID da natureza financeira (opcional, obtido de buscarClassificacoesFinanceiras)'),
    tenant_id: z.number().optional()
      .describe('Tenant ID (se não informado, assume 1 por padrão).'),
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
    tenant_id,
    valor,
    data_vencimento,
    data_emissao,
    numero_nota_fiscal,
    descricao,
    itens
  }) => {
    const payload = {
      fornecedor_id: String(fornecedor_id || ''),
      categoria_id: String(categoria_id || ''),
      centro_custo_id: String(centro_custo_id || ''),
      natureza_financeira_id: natureza_financeira_id ? String(natureza_financeira_id) : '',
      tenant_id: typeof tenant_id === 'number' ? tenant_id : 1,
      valor: Number(valor || 0),
      data_vencimento: String(data_vencimento || ''),
      data_emissao: String(data_emissao || ''),
      numero_nota_fiscal: numero_nota_fiscal ? String(numero_nota_fiscal) : '',
      descricao: descricao ? String(descricao) : '',
      itens: (itens || []).map((it) => ({
        descricao: String(it.descricao || ''),
        quantidade: Number(it.quantidade || 0),
        valor_unitario: Number(it.valor_unitario || 0),
        valor_total: it.valor_total ? Number(it.valor_total) : undefined,
      })),
    };

    const validations: Array<{ field: string; status: 'ok' | 'warn' | 'error'; message?: string }> = [];
    if (!payload.fornecedor_id) validations.push({ field: 'fornecedor_id', status: 'error', message: 'Fornecedor é obrigatório' });
    if (!payload.data_vencimento) validations.push({ field: 'data_vencimento', status: 'error', message: 'Data de vencimento é obrigatória' });
    if (!payload.valor || payload.valor <= 0) validations.push({ field: 'valor', status: 'error', message: 'Valor deve ser maior que zero' });
    if (tenant_id === undefined || tenant_id === null) validations.push({ field: 'tenant_id', status: 'warn', message: 'Tenant ID não informado. Assumido padrão 1.' });

    let valorTotalItens = 0;
    for (const item of payload.itens) {
      const vt = (item.valor_total ?? (item.quantidade * item.valor_unitario)) || 0;
      valorTotalItens += vt;
    }
    if (payload.itens.length > 0 && Math.abs(valorTotalItens - payload.valor) > 0.1) {
      validations.push({ field: 'itens', status: 'warn', message: `Soma dos itens (R$ ${valorTotalItens.toFixed(2)}) difere do total (R$ ${payload.valor.toFixed(2)})` });
    }

    return {
      success: true,
      preview: true,
      title: 'Conta a Pagar (Prévia)',
      message: 'Revise os dados e clique em Criar para confirmar.',
      payload,
      validations,
      metadata: { entity: 'conta_a_pagar', action: 'create', commitEndpoint: '/api/modulos/financeiro/contas-a-pagar' }
    } as const;
  }
});
