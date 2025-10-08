import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getComprasData = tool({
  description: 'Busca dados de gestão de compras (fornecedores, pedidos de compra, itens de pedido)',
  inputSchema: z.object({
    table: z.enum([
      'fornecedores',
      'pedidos_compra',
      'pedido_compra_itens'
    ]).describe('Tabela a consultar'),
    limit: z.number().default(20).describe('Número máximo de resultados'),

    // Filtros específicos
    fornecedor_id: z.string().optional()
      .describe('Filtrar por ID do fornecedor (para pedidos_compra)'),
    solicitante_id: z.string().optional()
      .describe('Filtrar por ID do solicitante (para pedidos_compra)'),
    status_pedido: z.string().optional()
      .describe('Filtrar por status (Rascunho, Enviado, Aprovado, Recebido, Cancelado)'),
    numero_pedido: z.string().optional()
      .describe('Filtrar por número do pedido'),
    pedido_compra_id: z.string().optional()
      .describe('Filtrar itens por ID do pedido de compra'),
    avaliacao_minima: z.number().optional()
      .describe('Filtrar fornecedores com avaliação mínima (1-5)'),

    // Filtros de valor
    valor_minimo: z.number().optional()
      .describe('Valor mínimo do pedido'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo do pedido'),

    // Filtros de data
    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),
  }),

  execute: async ({
    table,
    limit,
    fornecedor_id,
    solicitante_id,
    status_pedido,
    numero_pedido,
    pedido_compra_id,
    avaliacao_minima,
    valor_minimo,
    valor_maximo,
    data_de,
    data_ate
  }) => {
    try {
      let query = supabase
        .schema('gestaocompras')
        .from(table)
        .select('*');

      // FILTRO 1: Fornecedor ID
      if (fornecedor_id && table === 'pedidos_compra') {
        query = query.eq('fornecedor_id', fornecedor_id);
      }

      // FILTRO 2: Solicitante ID
      if (solicitante_id && table === 'pedidos_compra') {
        query = query.eq('solicitante_id', solicitante_id);
      }

      // FILTRO 3: Status do pedido
      if (status_pedido && table === 'pedidos_compra') {
        query = query.eq('status_pedido', status_pedido);
      }

      // FILTRO 4: Número do pedido
      if (numero_pedido && table === 'pedidos_compra') {
        query = query.eq('numero_pedido', numero_pedido);
      }

      // FILTRO 5: Pedido de compra ID
      if (pedido_compra_id && table === 'pedido_compra_itens') {
        query = query.eq('pedido_compra_id', pedido_compra_id);
      }

      // FILTRO 6: Avaliação mínima
      if (avaliacao_minima && table === 'fornecedores') {
        query = query.gte('avaliacao_fornecedor', avaliacao_minima);
      }

      // FILTRO 7: Range de valores
      if (valor_minimo && table === 'pedidos_compra') {
        query = query.gte('valor_total', valor_minimo);
      }
      if (valor_maximo && table === 'pedidos_compra') {
        query = query.lte('valor_total', valor_maximo);
      }

      // FILTRO 8: Range de datas
      if (data_de && table === 'pedidos_compra') {
        query = query.gte('data_emissao', data_de);
      }
      if (data_ate && table === 'pedidos_compra') {
        query = query.lte('data_emissao', data_ate);
      }

      // Ordenação dinâmica por tabela
      let orderColumn = 'criado_em';
      let ascending = false;

      if (table === 'pedidos_compra') {
        orderColumn = 'data_emissao';
        ascending = false;
      } else if (table === 'fornecedores') {
        orderColumn = 'codigo_fornecedor';
        ascending = true;
      } else if (table === 'pedido_compra_itens') {
        orderColumn = 'id';
        ascending = false;
      }

      query = query
        .order(orderColumn, { ascending })
        .limit(limit ?? 20);

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: (data || []).length,
        table: table,
        message: `✅ ${(data || []).length} registros encontrados em ${table}`,
        data: data || []
      };

    } catch (error) {
      console.error('ERRO getComprasData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao buscar dados de ${table}`,
        table: table,
        data: []
      };
    }
  }
});
