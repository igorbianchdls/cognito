import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getLogisticsData = tool({
  description: 'Busca dados de gestão logística (envios, rastreamento, logística reversa, pacotes, transportadoras)',
  inputSchema: z.object({
    table: z.enum([
      'envios',
      'eventos_rastreio',
      'logistica_reversa',
      'pacotes',
      'transportadoras'
    ]).describe('Tabela a consultar'),
    limit: z.number().default(20).describe('Número máximo de resultados'),

    // Filtros específicos
    status_atual: z.string().optional()
      .describe('Filtrar por status atual (para envios, logistica_reversa)'),
    transportadora_id: z.string().optional()
      .describe('Filtrar por ID da transportadora (para envios, pacotes)'),
    codigo_rastreio: z.string().optional()
      .describe('Filtrar por código de rastreio (para envios, eventos_rastreio)'),
    order_id: z.string().optional()
      .describe('Filtrar por ID do pedido (para envios, logistica_reversa)'),
    ativo: z.boolean().optional()
      .describe('Filtrar por status ativo (para transportadoras)'),

    // Filtros de data
    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),
  }),

  execute: async ({
    table,
    limit,
    status_atual,
    transportadora_id,
    codigo_rastreio,
    order_id,
    ativo,
    data_de,
    data_ate
  }) => {
    try {
      let query = supabase
        .schema('gestaologistica')
        .from(table)
        .select('*');

      // FILTRO 1: Status atual
      if (status_atual && (table === 'envios' || table === 'logistica_reversa')) {
        query = query.eq('status_atual', status_atual);
      }

      // FILTRO 2: Transportadora ID
      if (transportadora_id && (table === 'envios' || table === 'pacotes')) {
        query = query.eq('transportadora_id', transportadora_id);
      }

      // FILTRO 3: Código de rastreio
      if (codigo_rastreio) {
        if (table === 'envios') {
          query = query.eq('codigo_rastreio', codigo_rastreio);
        } else if (table === 'eventos_rastreio') {
          query = query.eq('codigo_rastreio', codigo_rastreio);
        }
      }

      // FILTRO 4: Order ID
      if (order_id && (table === 'envios' || table === 'logistica_reversa')) {
        query = query.eq('order_id', order_id);
      }

      // FILTRO 5: Ativo (para transportadoras)
      if (ativo !== undefined && table === 'transportadoras') {
        query = query.eq('ativo', ativo);
      }

      // FILTRO 6: Range de datas
      if (data_de) {
        let dateColumn = 'created_at';
        if (table === 'envios') dateColumn = 'data_postagem';
        else if (table === 'eventos_rastreio') dateColumn = 'data_evento';
        else if (table === 'logistica_reversa') dateColumn = 'data_solicitacao';

        query = query.gte(dateColumn, data_de);
      }

      if (data_ate) {
        let dateColumn = 'created_at';
        if (table === 'envios') dateColumn = 'data_postagem';
        else if (table === 'eventos_rastreio') dateColumn = 'data_evento';
        else if (table === 'logistica_reversa') dateColumn = 'data_solicitacao';

        query = query.lte(dateColumn, data_ate);
      }

      // Ordenação dinâmica por tabela
      let orderColumn = 'created_at';
      const ascending = false;

      if (table === 'envios') {
        orderColumn = 'data_postagem';
      } else if (table === 'eventos_rastreio') {
        orderColumn = 'data_evento';
      } else if (table === 'logistica_reversa') {
        orderColumn = 'data_solicitacao';
      } else if (table === 'pacotes') {
        orderColumn = 'id';
      } else if (table === 'transportadoras') {
        orderColumn = 'nome';
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
      console.error('ERRO getLogisticsData:', error);
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
