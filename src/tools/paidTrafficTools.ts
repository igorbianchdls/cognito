import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getPaidTrafficData = tool({
  description: 'Busca dados de tráfego pago (contas ads, campanhas, anúncios, métricas)',
  inputSchema: z.object({
    table: z.enum([
      'contas_ads',
      'campanhas',
      'grupos_de_anuncios',
      'anuncios_criacao',
      'anuncios_colaboradores',
      'anuncios_publicados',
      'metricas_anuncios',
      'resumos_campanhas'
    ]).describe('Tabela a consultar'),
    limit: z.number().default(20).describe('Número máximo de resultados'),

    // Filtros de plataforma
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional()
      .describe('Filtrar por plataforma (para contas_ads, anuncios_publicados, metricas_anuncios)'),

    // Filtros de status
    status: z.enum(['ativa', 'ativo', 'pausada', 'pausado', 'encerrada', 'encerrado', 'rejeitado']).optional()
      .describe('Filtrar por status (para campanhas, grupos_de_anuncios, anuncios_publicados)'),
    criativo_status: z.enum(['aprovado', 'rascunho', 'em_revisao', 'rejeitado']).optional()
      .describe('Filtrar por status criativo (para anuncios_criacao)'),

    // Filtros de campanha
    objetivo: z.string().optional()
      .describe('Filtrar por objetivo da campanha (para campanhas)'),

    // Filtros de data
    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),

    // Filtros de performance (para metricas_anuncios)
    roas_minimo: z.number().optional()
      .describe('ROAS mínimo (ex: 2.0 = 2x)'),
    gasto_minimo: z.number().optional()
      .describe('Gasto mínimo em reais'),
    gasto_maximo: z.number().optional()
      .describe('Gasto máximo em reais'),
    conversoes_minimo: z.number().optional()
      .describe('Número mínimo de conversões'),
    ctr_minimo: z.number().optional()
      .describe('CTR mínimo (0-1, ex: 0.05 = 5%)'),
  }),

  execute: async ({
    table,
    limit,
    plataforma,
    status,
    criativo_status,
    objetivo,
    data_de,
    data_ate,
    roas_minimo,
    gasto_minimo,
    gasto_maximo,
    conversoes_minimo,
    ctr_minimo
  }) => {
    try {
      let query = supabase
        .schema('trafego_pago')
        .from(table)
        .select('*');

      // FILTRO 1: Plataforma
      if (plataforma && (table === 'contas_ads' || table === 'anuncios_publicados' || table === 'metricas_anuncios')) {
        query = query.eq('plataforma', plataforma);
      }

      // FILTRO 2: Status (campanhas, grupos, anuncios publicados)
      if (status && (table === 'campanhas' || table === 'grupos_de_anuncios' || table === 'anuncios_publicados')) {
        query = query.eq('status', status);
      }

      // FILTRO 3: Status criativo (anuncios_criacao)
      if (criativo_status && table === 'anuncios_criacao') {
        query = query.eq('criativo_status', criativo_status);
      }

      // FILTRO 4: Objetivo (campanhas)
      if (objetivo && table === 'campanhas') {
        query = query.eq('objetivo', objetivo);
      }

      // FILTRO 5: Range de datas
      if (data_de) {
        let dateColumn = 'criado_em';
        if (table === 'contas_ads') dateColumn = 'conectado_em';
        else if (table === 'campanhas') dateColumn = 'inicio';
        else if (table === 'anuncios_criacao') dateColumn = 'criado_em';
        else if (table === 'anuncios_colaboradores' || table === 'resumos_campanhas') dateColumn = 'registrado_em';
        else if (table === 'anuncios_publicados') dateColumn = 'publicado_em';
        else if (table === 'metricas_anuncios') dateColumn = 'data';

        query = query.gte(dateColumn, data_de);
      }

      if (data_ate) {
        let dateColumn = 'criado_em';
        if (table === 'contas_ads') dateColumn = 'conectado_em';
        else if (table === 'campanhas') dateColumn = 'fim';
        else if (table === 'anuncios_criacao') dateColumn = 'criado_em';
        else if (table === 'anuncios_colaboradores' || table === 'resumos_campanhas') dateColumn = 'registrado_em';
        else if (table === 'anuncios_publicados') dateColumn = 'publicado_em';
        else if (table === 'metricas_anuncios') dateColumn = 'data';

        query = query.lte(dateColumn, data_ate);
      }

      // FILTRO 6: ROAS mínimo (metricas_anuncios)
      if (roas_minimo !== undefined && table === 'metricas_anuncios') {
        query = query.gte('roas', roas_minimo);
      }

      // FILTRO 7: Gasto mínimo (metricas_anuncios)
      if (gasto_minimo !== undefined && table === 'metricas_anuncios') {
        query = query.gte('gasto', gasto_minimo);
      }

      // FILTRO 8: Gasto máximo (metricas_anuncios)
      if (gasto_maximo !== undefined && table === 'metricas_anuncios') {
        query = query.lte('gasto', gasto_maximo);
      }

      // FILTRO 9: Conversões mínimas (metricas_anuncios)
      if (conversoes_minimo !== undefined && table === 'metricas_anuncios') {
        query = query.gte('conversao', conversoes_minimo);
      }

      // FILTRO 10: CTR mínimo (metricas_anuncios)
      if (ctr_minimo !== undefined && table === 'metricas_anuncios') {
        query = query.gte('ctr', ctr_minimo);
      }

      // Ordenação dinâmica por tabela
      let orderColumn = 'criado_em';
      const ascending = false;

      if (table === 'contas_ads') {
        orderColumn = 'conectado_em';
      } else if (table === 'campanhas') {
        orderColumn = 'inicio';
      } else if (table === 'grupos_de_anuncios') {
        orderColumn = 'id';
      } else if (table === 'anuncios_criacao') {
        orderColumn = 'criado_em';
      } else if (table === 'anuncios_colaboradores' || table === 'resumos_campanhas') {
        orderColumn = 'registrado_em';
      } else if (table === 'anuncios_publicados') {
        orderColumn = 'publicado_em';
      } else if (table === 'metricas_anuncios') {
        orderColumn = 'data';
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
      console.error('ERRO getPaidTrafficData:', error);
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
