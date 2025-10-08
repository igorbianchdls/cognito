import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getInventoryData = tool({
  description: 'Busca dados de gestão de estoque (centros de distribuição, estoque por canal, movimentações, preços)',
  inputSchema: z.object({
    table: z.enum([
      'centros_distribuicao',
      'estoque_canal',
      'integracoes_canais',
      'movimentacoes_estoque',
      'precos_canais'
    ]).describe('Tabela a consultar'),
    limit: z.number().default(20).describe('Número máximo de resultados'),

    // Filtros específicos
    ativo: z.boolean().optional()
      .describe('Filtrar por status ativo (para centros_distribuicao)'),
    product_id: z.string().optional()
      .describe('Filtrar por ID do produto (para estoque_canal, movimentacoes_estoque, precos_canais)'),
    channel_id: z.string().optional()
      .describe('Filtrar por ID do canal (para estoque_canal, integracoes_canais, precos_canais)'),
    tipo: z.string().optional()
      .describe('Filtrar por tipo de movimentação (para movimentacoes_estoque: entrada, saida, ajuste)'),

    // Filtros de quantidade
    quantidade_minima: z.number().optional()
      .describe('Quantidade mínima disponível (para estoque_canal)'),
    quantidade_maxima: z.number().optional()
      .describe('Quantidade máxima disponível (para estoque_canal)'),

    // Filtros de data
    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),
  }),

  execute: async ({
    table,
    limit,
    ativo,
    product_id,
    channel_id,
    tipo,
    quantidade_minima,
    quantidade_maxima,
    data_de,
    data_ate
  }) => {
    try {
      let query = supabase
        .schema('gestaoestoque')
        .from(table)
        .select('*');

      // FILTRO 1: Status ativo (para centros_distribuicao)
      if (ativo !== undefined && table === 'centros_distribuicao') {
        query = query.eq('ativo', ativo);
      }

      // FILTRO 2: Product ID
      if (product_id && (table === 'estoque_canal' || table === 'movimentacoes_estoque' || table === 'precos_canais')) {
        query = query.eq('product_id', product_id);
      }

      // FILTRO 3: Channel ID
      if (channel_id && (table === 'estoque_canal' || table === 'integracoes_canais' || table === 'precos_canais')) {
        query = query.eq('channel_id', channel_id);
      }

      // FILTRO 4: Tipo de movimentação
      if (tipo && table === 'movimentacoes_estoque') {
        query = query.eq('type', tipo);
      }

      // FILTRO 5: Quantidade mínima (para estoque_canal)
      if (quantidade_minima !== undefined && table === 'estoque_canal') {
        query = query.gte('quantity_available', quantidade_minima);
      }

      // FILTRO 6: Quantidade máxima (para estoque_canal)
      if (quantidade_maxima !== undefined && table === 'estoque_canal') {
        query = query.lte('quantity_available', quantidade_maxima);
      }

      // FILTRO 7: Range de datas
      if (data_de) {
        let dateColumn = 'created_at';
        if (table === 'estoque_canal') dateColumn = 'last_updated';
        else if (table === 'integracoes_canais') dateColumn = 'last_sync';
        else if (table === 'precos_canais') dateColumn = 'start_date';

        query = query.gte(dateColumn, data_de);
      }

      if (data_ate) {
        let dateColumn = 'created_at';
        if (table === 'estoque_canal') dateColumn = 'last_updated';
        else if (table === 'integracoes_canais') dateColumn = 'last_sync';
        else if (table === 'precos_canais') dateColumn = 'end_date';

        query = query.lte(dateColumn, data_ate);
      }

      // Ordenação (mais recente primeiro)
      query = query
        .order('created_at', { ascending: false })
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
      console.error('ERRO getInventoryData:', error);
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
