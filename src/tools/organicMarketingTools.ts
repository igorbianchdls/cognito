import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getOrganicMarketingData = tool({
  description: 'Busca dados de marketing orgânico (contas sociais, publicações, métricas)',
  inputSchema: z.object({
    table: z.enum(['contas_sociais', 'publicacoes', 'metricas_publicacoes', 'resumos_conta'])
      .describe('Tabela a consultar'),
    limit: z.number().default(20).describe('Número máximo de resultados'),

    // Filtros específicos
    plataforma: z.enum(['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'YouTube', 'TikTok']).optional()
      .describe('Filtrar por plataforma (para contas_sociais)'),
    status: z.enum(['rascunho', 'agendado', 'publicado', 'cancelado']).optional()
      .describe('Filtrar por status (para publicacoes)'),
    tipo_post: z.enum(['carrossel', 'imagem', 'video', 'reels', 'story']).optional()
      .describe('Filtrar por tipo de post (para publicacoes)'),

    // Filtros de data
    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),

    // Filtros de performance
    engajamento_minimo: z.number().optional()
      .describe('Taxa mínima de engajamento (0-1, ex: 0.05 = 5%)'),
    curtidas_minimo: z.number().optional()
      .describe('Número mínimo de curtidas'),
  }),

  execute: async ({
    table,
    limit,
    plataforma,
    status,
    tipo_post,
    data_de,
    data_ate,
    engajamento_minimo,
    curtidas_minimo
  }) => {
    try {
      let query = supabase
        .schema('marketing_organico')
        .from(table)
        .select('*');

      // FILTRO 1: Plataforma (para contas_sociais)
      if (plataforma && table === 'contas_sociais') {
        query = query.eq('plataforma', plataforma);
      }

      // FILTRO 2: Status (para publicacoes)
      if (status && table === 'publicacoes') {
        query = query.eq('status', status);
      }

      // FILTRO 3: Tipo de post (para publicacoes)
      if (tipo_post && table === 'publicacoes') {
        query = query.eq('tipo_post', tipo_post);
      }

      // FILTRO 4: Range de datas
      if (data_de) {
        // Escolher coluna de data apropriada
        let dateColumn = 'criado_em';
        if (table === 'contas_sociais') dateColumn = 'conectado_em';
        else if (table === 'metricas_publicacoes' || table === 'resumos_conta') dateColumn = 'registrado_em';
        else if (table === 'publicacoes') dateColumn = 'publicado_em';

        query = query.gte(dateColumn, data_de);
      }

      if (data_ate) {
        let dateColumn = 'criado_em';
        if (table === 'contas_sociais') dateColumn = 'conectado_em';
        else if (table === 'metricas_publicacoes' || table === 'resumos_conta') dateColumn = 'registrado_em';
        else if (table === 'publicacoes') dateColumn = 'publicado_em';

        query = query.lte(dateColumn, data_ate);
      }

      // FILTRO 5: Engajamento mínimo (para metricas_publicacoes e resumos_conta)
      if (engajamento_minimo !== undefined && (table === 'metricas_publicacoes' || table === 'resumos_conta')) {
        query = query.gte('taxa_engajamento', engajamento_minimo);
      }

      // FILTRO 6: Curtidas mínimas (para metricas_publicacoes)
      if (curtidas_minimo !== undefined && table === 'metricas_publicacoes') {
        query = query.gte('curtidas', curtidas_minimo);
      }

      // Ordenação por data (mais recente primeiro)
      let orderColumn = 'criado_em';
      if (table === 'contas_sociais') orderColumn = 'conectado_em';
      else if (table === 'metricas_publicacoes' || table === 'resumos_conta') orderColumn = 'registrado_em';
      else if (table === 'publicacoes') orderColumn = 'criado_em';

      query = query
        .order(orderColumn, { ascending: false })
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
      console.error('ERRO getOrganicMarketingData:', error);
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
