import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getAnalyticsData = tool({
  description: 'Busca dados de analytics web (sessões, eventos, visitantes, transações, métricas agregadas)',
  inputSchema: z.object({
    table: z.enum([
      'agregado_diario_por_fonte',
      'agregado_diario_por_pagina',
      'consentimentos_visitante',
      'eventos',
      'itens_transacao',
      'metas',
      'propriedades_analytics',
      'propriedades_visitante',
      'sessoes',
      'transacoes_analytics',
      'visitantes'
    ]).describe('Tabela a consultar'),
    limit: z.number().default(20).describe('Número máximo de resultados'),

    // Filtros específicos
    visitor_id: z.string().optional()
      .describe('Filtrar por ID do visitante (para sessoes, eventos, propriedades_visitante, consentimentos_visitante)'),
    session_id: z.string().optional()
      .describe('Filtrar por ID da sessão (para eventos, transacoes_analytics)'),
    fonte: z.string().optional()
      .describe('Filtrar por fonte de tráfego (para agregado_diario_por_fonte, sessoes)'),
    pagina: z.string().optional()
      .describe('Filtrar por página (para agregado_diario_por_pagina, eventos)'),
    eh_bot: z.boolean().optional()
      .describe('Filtrar por bot (para sessoes)'),
    event_name: z.string().optional()
      .describe('Filtrar por nome do evento (para eventos)'),

    // Filtros de data
    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),
  }),

  execute: async ({
    table,
    limit,
    visitor_id,
    session_id,
    fonte,
    pagina,
    eh_bot,
    event_name,
    data_de,
    data_ate
  }) => {
    try {
      let query = supabase
        .schema('gestaoanalytics')
        .from(table)
        .select('*');

      // FILTRO 1: Visitor ID
      if (visitor_id && (table === 'sessoes' || table === 'eventos' || table === 'propriedades_visitante' || table === 'consentimentos_visitante')) {
        query = query.eq('visitor_id', visitor_id);
      }

      // FILTRO 2: Session ID
      if (session_id && (table === 'eventos' || table === 'transacoes_analytics')) {
        query = query.eq('session_id', session_id);
      }

      // FILTRO 3: Fonte
      if (fonte) {
        if (table === 'agregado_diario_por_fonte') {
          query = query.eq('fonte', fonte);
        } else if (table === 'sessoes') {
          query = query.eq('utm_source', fonte);
        }
      }

      // FILTRO 4: Página
      if (pagina) {
        if (table === 'agregado_diario_por_pagina') {
          query = query.eq('pagina', pagina);
        } else if (table === 'eventos') {
          query = query.eq('page_url', pagina);
        }
      }

      // FILTRO 5: Bot
      if (eh_bot !== undefined && table === 'sessoes') {
        query = query.eq('eh_bot', eh_bot);
      }

      // FILTRO 6: Event name
      if (event_name && table === 'eventos') {
        query = query.eq('event_name', event_name);
      }

      // FILTRO 7: Range de datas
      if (data_de) {
        let dateColumn = 'data';
        if (table === 'sessoes') dateColumn = 'session_start';
        else if (table === 'eventos') dateColumn = 'event_timestamp';
        else if (table === 'transacoes_analytics') dateColumn = 'transaction_timestamp';
        else if (table === 'visitantes') dateColumn = 'first_seen';
        else if (table === 'consentimentos_visitante') dateColumn = 'consent_timestamp';
        else if (table === 'propriedades_visitante' || table === 'propriedades_analytics') dateColumn = 'created_at';

        query = query.gte(dateColumn, data_de);
      }

      if (data_ate) {
        let dateColumn = 'data';
        if (table === 'sessoes') dateColumn = 'session_end';
        else if (table === 'eventos') dateColumn = 'event_timestamp';
        else if (table === 'transacoes_analytics') dateColumn = 'transaction_timestamp';
        else if (table === 'visitantes') dateColumn = 'last_seen';
        else if (table === 'consentimentos_visitante') dateColumn = 'consent_timestamp';
        else if (table === 'propriedades_visitante' || table === 'propriedades_analytics') dateColumn = 'updated_at';

        query = query.lte(dateColumn, data_ate);
      }

      // Ordenação dinâmica por tabela
      let orderColumn = 'data';
      const ascending = false;

      if (table === 'agregado_diario_por_fonte' || table === 'agregado_diario_por_pagina') {
        orderColumn = 'data';
      } else if (table === 'sessoes') {
        orderColumn = 'session_start';
      } else if (table === 'eventos') {
        orderColumn = 'event_timestamp';
      } else if (table === 'transacoes_analytics') {
        orderColumn = 'transaction_timestamp';
      } else if (table === 'visitantes') {
        orderColumn = 'last_seen';
      } else if (table === 'consentimentos_visitante') {
        orderColumn = 'consent_timestamp';
      } else if (table === 'propriedades_visitante' || table === 'propriedades_analytics') {
        orderColumn = 'created_at';
      } else if (table === 'itens_transacao' || table === 'metas') {
        orderColumn = 'id';
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
      console.error('ERRO getAnalyticsData:', error);
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
