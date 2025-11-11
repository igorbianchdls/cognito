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
          conds.push(`REPLACE(REPLACE(REPLACE(c.cnpj_cpf, '.', ''), '/', ''), '-', '') = $${i++}`)
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
               c.nome_fantasia::text AS nome,
               COALESCE(c.cnpj_cpf, '')::text AS cpf_cnpj
          FROM entidades.clientes c
          ${where}
         ORDER BY c.nome_fantasia ASC
         ${limitClause}
      `.replace(/\n\s+/g, ' ').trim()

      type Row = { id: string; nome: string; cpf_cnpj: string }
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
  description: '[WORKFLOW] Prévia de criação de cliente. A IA preenche os campos; o usuário revisa e confirma na UI para criar de fato.',

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
    const payload = {
      nome: String(nome || '').trim(),
      cpf_cnpj: String(cpf_cnpj || '').trim(),
      tipo_pessoa: tipo_pessoa,
      endereco: endereco ? String(endereco).trim() : '',
      telefone: telefone ? String(telefone).trim() : '',
      email: email ? String(email).trim() : '',
      observacoes: observacoes ? String(observacoes).trim() : ''
    };

    const validations: Array<{ field: string; status: 'ok' | 'warn' | 'error'; message?: string }> = [];
    if (!payload.nome) validations.push({ field: 'nome', status: 'error', message: 'Nome é obrigatório' });
    if (payload.cpf_cnpj) {
      const digits = payload.cpf_cnpj.replace(/\D/g, '');
      if (digits.length !== 11 && digits.length !== 14) validations.push({ field: 'cpf_cnpj', status: 'warn', message: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos' });
    } else {
      validations.push({ field: 'cpf_cnpj', status: 'warn', message: 'CPF/CNPJ ausente' });
    }
    // Inferir tipo_pessoa se ausente
    if (!payload.tipo_pessoa && payload.cpf_cnpj) {
      const d = payload.cpf_cnpj.replace(/\D/g, '');
      if (d.length === 11) payload.tipo_pessoa = 'fisica';
      else if (d.length === 14) payload.tipo_pessoa = 'juridica';
    }

    return {
      success: true,
      preview: true,
      title: 'Cliente (Prévia)',
      message: 'Revise os dados e clique em Criar para confirmar.',
      payload,
      validations,
      metadata: { entity: 'cliente', action: 'create', commitEndpoint: '/api/modulos/financeiro/clientes' }
    } as const;
  }
});

// ========================================
// WORKFLOW TOOL 3: Criar Conta a Receber
// ========================================
export const criarContaReceber = tool({
  description: '[WORKFLOW] Prévia de criação de Conta a Receber. A IA preenche os campos; o usuário revisa e confirma na UI para criar de fato.',

  inputSchema: z.object({
    cliente_id: z.string()
      .describe('ID do cliente (obtido de buscarCliente ou criarCliente)'),
    categoria_id: z.string()
      .describe('ID da categoria financeira (obtido de buscarClassificacoesFinanceiras)'),
    centro_custo_id: z.string()
      .describe('ID do centro de custo (obtido de buscarClassificacoesFinanceiras)'),
    natureza_financeira_id: z.string().optional()
      .describe('ID da natureza financeira (opcional, obtido de buscarClassificacoesFinanceiras)'),
    tenant_id: z.number().optional()
      .describe('Tenant ID (se não informado, assume 1 por padrão).'),
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
    tenant_id,
    valor,
    data_vencimento,
    data_emissao,
    numero_nota_fiscal,
    descricao,
    itens
  }) => {
    const payload = {
      cliente_id: String(cliente_id || ''),
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
    if (!payload.cliente_id) validations.push({ field: 'cliente_id', status: 'error', message: 'Cliente é obrigatório' });
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
      title: 'Conta a Receber (Prévia)',
      message: 'Revise os dados e clique em Criar para confirmar.',
      payload,
      validations,
      metadata: { entity: 'conta_a_receber', action: 'create', commitEndpoint: '/api/modulos/financeiro/contas-a-receber' }
    } as const;
  }
});
