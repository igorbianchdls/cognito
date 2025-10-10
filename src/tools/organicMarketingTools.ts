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

// ============================================
// TOOL 2: Analisar Performance de Conteúdo
// ============================================
export const analyzeContentPerformance = tool({
  description: 'Analisa performance de conteúdo: engagement rate, alcance, impressões, performance por tipo',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)'),
    plataforma: z.enum(['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'YouTube', 'TikTok']).optional()
      .describe('Filtrar por plataforma específica (opcional)')
  }),

  execute: async ({ date_range_days = 30, plataforma }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - date_range_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      // Buscar publicações
      const { data: publicacoes, error: errorPub } = await supabase
        .schema('marketing_organico')
        .from('publicacoes')
        .select('*')
        .eq('status', 'publicado')
        .gte('publicado_em', dataInicialStr);

      if (errorPub) throw errorPub;

      // Buscar métricas
      const { data: metricas, error: errorMetr } = await supabase
        .schema('marketing_organico')
        .from('metricas_publicacoes')
        .select('*')
        .gte('registrado_em', dataInicialStr);
      if (errorMetr) throw errorMetr;

      if (!publicacoes || publicacoes.length === 0) {
        return {
          success: true,
          message: '⚠️ Nenhuma publicação encontrada no período',
          total_posts: 0
        };
      }

      // Calcular métricas gerais
      const totalPosts = publicacoes.length;
      const totalCurtidas = metricas?.reduce((sum, m) => sum + (m.curtidas || 0), 0) || 0;
      const totalComentarios = metricas?.reduce((sum, m) => sum + (m.comentarios || 0), 0) || 0;
      const totalCompartilhamentos = metricas?.reduce((sum, m) => sum + (m.compartilhamentos || 0), 0) || 0;
      const totalVisualizacoes = metricas?.reduce((sum, m) => sum + (m.visualizacoes || 0), 0) || 0;
      const totalAlcance = metricas?.reduce((sum, m) => sum + (m.alcance || 0), 0) || 0;

      const engagementTotal = totalCurtidas + totalComentarios + totalCompartilhamentos;
      const engagementRate = totalAlcance > 0 ? (engagementTotal / totalAlcance) * 100 : 0;

      // Performance por tipo de conteúdo
      const porTipo: Record<string, { posts: number; engagement: number; alcance: number }> = {};

      publicacoes.forEach(pub => {
        const tipo = pub.tipo_post || 'outros';
        if (!porTipo[tipo]) {
          porTipo[tipo] = { posts: 0, engagement: 0, alcance: 0 };
        }
        porTipo[tipo].posts++;

        const metrica = metricas?.find(m => m.publicacao_id === pub.id);
        if (metrica) {
          porTipo[tipo].engagement += (metrica.curtidas || 0) + (metrica.comentarios || 0) + (metrica.compartilhamentos || 0);
          porTipo[tipo].alcance += metrica.alcance || 0;
        }
      });

      const performancePorTipo = Object.entries(porTipo).map(([tipo, dados]) => ({
        tipo,
        total_posts: dados.posts,
        engagement_total: dados.engagement,
        alcance_total: dados.alcance,
        engagement_medio_por_post: dados.posts > 0 ? (dados.engagement / dados.posts).toFixed(1) : '0',
        engagement_rate: dados.alcance > 0 ? ((dados.engagement / dados.alcance) * 100).toFixed(2) + '%' : '0%'
      })).sort((a, b) => parseFloat(b.engagement_rate) - parseFloat(a.engagement_rate));

      return {
        success: true,
        message: `✅ Análise de ${totalPosts} posts concluída (${date_range_days} dias)`,
        periodo_dias: date_range_days,
        plataforma: plataforma || 'TODAS',

        metricas_gerais: {
          total_posts: totalPosts,
          total_curtidas: totalCurtidas,
          total_comentarios: totalComentarios,
          total_compartilhamentos: totalCompartilhamentos,
          total_visualizacoes: totalVisualizacoes,
          total_alcance: totalAlcance,
          engagement_total: engagementTotal,
          engagement_rate: engagementRate.toFixed(2) + '%',
          alcance_medio_por_post: totalPosts > 0 ? (totalAlcance / totalPosts).toFixed(0) : '0',
          classificacao: engagementRate >= 5 ? 'Excelente' : engagementRate >= 3 ? 'Bom' : engagementRate >= 1 ? 'Regular' : 'Baixo'
        },

        performance_por_tipo: performancePorTipo
      };

    } catch (error) {
      console.error('ERRO analyzeContentPerformance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar performance de conteúdo'
      };
    }
  }
});

// ============================================
// TOOL 3: Comparar Performance de Plataformas
// ============================================
export const comparePlatformPerformance = tool({
  description: 'Compara performance entre plataformas: engagement, alcance, crescimento, ranking',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)')
  }),

  execute: async ({ date_range_days = 30 }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - date_range_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      // Buscar contas sociais
      const { data: contas, error: errorContas } = await supabase
        .schema('marketing_organico')
        .from('contas_sociais')
        .select('*');

      if (errorContas) throw errorContas;

      // Buscar resumos
      const { data: resumos, error: errorResumos } = await supabase
        .schema('marketing_organico')
        .from('resumos_conta')
        .select('*')
        .gte('registrado_em', dataInicialStr);

      if (errorResumos) throw errorResumos;

      const benchmark: Record<string, {
        plataforma: string;
        contas_ativas: number;
        total_seguidores: number;
        total_publicacoes: number;
        total_alcance: number;
        engagement_total: number;
        engagement_rate: number;
      }> = {};

      contas?.forEach(conta => {
        const plat = conta.plataforma;
        if (!benchmark[plat]) {
          benchmark[plat] = {
            plataforma: plat,
            contas_ativas: 0,
            total_seguidores: 0,
            total_publicacoes: 0,
            total_alcance: 0,
            engagement_total: 0,
            engagement_rate: 0
          };
        }
        benchmark[plat].contas_ativas++;

        // Buscar resumos dessa conta
        const resumosConta = resumos?.filter(r => r.conta_social_id === conta.id);
        resumosConta?.forEach(resumo => {
          benchmark[plat].total_seguidores += resumo.seguidores || 0;
          benchmark[plat].total_publicacoes += resumo.total_publicacoes || 0;
          benchmark[plat].total_alcance += resumo.alcance_total || 0;

          const engagement = (resumo.curtidas_total || 0) + (resumo.comentarios_total || 0) + (resumo.compartilhamentos_total || 0);
          benchmark[plat].engagement_total += engagement;
        });
      });

      // Calcular engagement rate
      const plataformas = Object.values(benchmark).map(plat => {
        plat.engagement_rate = plat.total_alcance > 0 ? (plat.engagement_total / plat.total_alcance) * 100 : 0;
        return plat;
      }).sort((a, b) => b.engagement_rate - a.engagement_rate);

      const melhorPlataforma = plataformas[0];
      const piorPlataforma = plataformas[plataformas.length - 1];

      return {
        success: true,
        message: `✅ Benchmark de ${plataformas.length} plataformas concluído`,
        periodo_dias: date_range_days,
        total_plataformas: plataformas.length,
        melhor_plataforma: melhorPlataforma?.plataforma,
        pior_plataforma: piorPlataforma?.plataforma,

        plataformas: plataformas.map(p => ({
          plataforma: p.plataforma,
          contas_ativas: p.contas_ativas,
          total_seguidores: p.total_seguidores,
          total_publicacoes: p.total_publicacoes,
          total_alcance: p.total_alcance,
          engagement_total: p.engagement_total,
          engagement_rate: p.engagement_rate.toFixed(2) + '%',
          alcance_medio_por_post: p.total_publicacoes > 0 ? (p.total_alcance / p.total_publicacoes).toFixed(0) : '0',
          classificacao: p.engagement_rate >= 5 ? 'Excelente' : p.engagement_rate >= 3 ? 'Boa' : p.engagement_rate >= 1 ? 'Regular' : 'Ruim',
          recomendacao: p === melhorPlataforma ? 'Priorizar investimento - melhor performance' :
                        p === piorPlataforma ? 'Revisar estratégia ou reduzir esforço' :
                        'Manter estratégia atual'
        }))
      };

    } catch (error) {
      console.error('ERRO comparePlatformPerformance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao comparar performance de plataformas'
      };
    }
  }
});

// ============================================
// TOOL 4: Analisar Crescimento de Audiência
// ============================================
export const analyzeAudienceGrowth = tool({
  description: 'Analisa crescimento de seguidores: taxa de crescimento, tendências, previsão',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)')
  }),

  execute: async ({ date_range_days = 30 }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - date_range_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      const { data: resumos, error } = await supabase
        .schema('marketing_organico')
        .from('resumos_conta')
        .select('*')
        .gte('registrado_em', dataInicialStr)
        .order('registrado_em', { ascending: true });

      if (error) throw error;

      if (!resumos || resumos.length === 0) {
        return {
          success: true,
          message: '⚠️ Dados insuficientes para análise de crescimento',
          crescimento_total: 0
        };
      }

      // Agrupar por período (semana)
      const porSemana: Record<string, { seguidores: number; data: string }> = {};

      resumos.forEach(resumo => {
        const data = new Date(resumo.registrado_em);
        const semana = Math.floor(data.getTime() / (7 * 24 * 60 * 60 * 1000));
        const semanaKey = `Semana ${semana}`;

        if (!porSemana[semanaKey] || new Date(resumo.registrado_em) > new Date(porSemana[semanaKey].data)) {
          porSemana[semanaKey] = {
            seguidores: resumo.seguidores || 0,
            data: resumo.registrado_em
          };
        }
      });

      const semanas = Object.values(porSemana).sort((a, b) =>
        new Date(a.data).getTime() - new Date(b.data).getTime()
      );

      const seguidoresInicial = semanas[0]?.seguidores || 0;
      const seguidoresFinal = semanas[semanas.length - 1]?.seguidores || 0;
      const crescimentoTotal = seguidoresFinal - seguidoresInicial;
      const taxaCrescimento = seguidoresInicial > 0 ? (crescimentoTotal / seguidoresInicial) * 100 : 0;

      // Calcular crescimento médio semanal
      const crescimentoSemanal = semanas.length > 1 ? crescimentoTotal / (semanas.length - 1) : 0;

      // Previsão para próximas 4 semanas
      const previsao4Semanas = seguidoresFinal + (crescimentoSemanal * 4);

      return {
        success: true,
        message: `✅ Análise de crescimento concluída (${date_range_days} dias)`,
        periodo_dias: date_range_days,

        crescimento: {
          seguidores_inicial: seguidoresInicial,
          seguidores_final: seguidoresFinal,
          crescimento_total: crescimentoTotal,
          taxa_crescimento: taxaCrescimento.toFixed(2) + '%',
          crescimento_medio_semanal: Math.round(crescimentoSemanal),
          classificacao: taxaCrescimento >= 10 ? 'Crescimento Acelerado' :
                        taxaCrescimento >= 5 ? 'Crescimento Saudável' :
                        taxaCrescimento >= 0 ? 'Crescimento Lento' :
                        'Perda de Seguidores'
        },

        previsao: {
          seguidores_previstos_4_semanas: Math.round(previsao4Semanas),
          crescimento_esperado: Math.round(previsao4Semanas - seguidoresFinal)
        },

        historico_semanal: semanas.slice(-8).map((semana, idx) => ({
          periodo: `Semana ${idx + 1}`,
          seguidores: semana.seguidores,
          data: semana.data.split('T')[0]
        }))
      };

    } catch (error) {
      console.error('ERRO analyzeAudienceGrowth:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar crescimento de audiência'
      };
    }
  }
});

// ============================================
// TOOL 5: Identificar Top Conteúdos
// ============================================
export const identifyTopContent = tool({
  description: 'Identifica top performers: melhores posts por engajamento e viralidade',
  inputSchema: z.object({
    limit: z.number().default(10)
      .describe('Número de top posts a retornar (padrão: 10)'),
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)')
  }),

  execute: async ({ limit = 10, date_range_days = 30 }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - date_range_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      const { data: metricas, error } = await supabase
        .schema('marketing_organico')
        .from('metricas_publicacoes')
        .select('*, publicacoes(*)')
        .gte('registrado_em', dataInicialStr)
        .order('curtidas', { ascending: false })
        .limit(limit * 3); // Buscar mais para filtrar depois

      if (error) throw error;

      if (!metricas || metricas.length === 0) {
        return {
          success: true,
          message: '⚠️ Nenhuma métrica encontrada no período',
          top_posts: []
        };
      }

      const topPosts = metricas.map(metrica => {
        const engagement = (metrica.curtidas || 0) + (metrica.comentarios || 0) + (metrica.compartilhamentos || 0);
        const engagementRate = metrica.alcance > 0 ? (engagement / metrica.alcance) * 100 : 0;
        const viralityScore = engagementRate * Math.log10((metrica.alcance || 0) + 1);

        return {
          publicacao_id: metrica.publicacao_id,
          titulo: metrica.publicacoes?.titulo || 'Sem título',
          tipo_post: metrica.publicacoes?.tipo_post || 'N/A',
          plataforma: metrica.publicacoes?.plataforma || 'N/A',
          publicado_em: metrica.publicacoes?.publicado_em?.split('T')[0] || 'N/A',
          curtidas: metrica.curtidas || 0,
          comentarios: metrica.comentarios || 0,
          compartilhamentos: metrica.compartilhamentos || 0,
          visualizacoes: metrica.visualizacoes || 0,
          alcance: metrica.alcance || 0,
          engagement_total: engagement,
          engagement_rate: engagementRate.toFixed(2) + '%',
          virality_score: viralityScore.toFixed(1),
          classificacao: engagementRate >= 10 ? 'Viral' :
                        engagementRate >= 5 ? 'Excelente' :
                        engagementRate >= 3 ? 'Muito Bom' :
                        engagementRate >= 1 ? 'Bom' : 'Regular'
        };
      })
      .sort((a, b) => parseFloat(b.virality_score) - parseFloat(a.virality_score))
      .slice(0, limit);

      return {
        success: true,
        message: `✅ Top ${limit} posts identificados`,
        periodo_dias: date_range_days,
        total_analisados: metricas.length,
        top_posts: topPosts
      };

    } catch (error) {
      console.error('ERRO identifyTopContent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao identificar top conteúdos'
      };
    }
  }
});

// ============================================
// TOOL 6: Analisar Mix de Conteúdo
// ============================================
export const analyzeContentMix = tool({
  description: 'Analisa mix de conteúdo: distribuição de tipos, frequência de postagem, gaps',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)')
  }),

  execute: async ({ date_range_days = 30 }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - date_range_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      const { data: publicacoes, error } = await supabase
        .schema('marketing_organico')
        .from('publicacoes')
        .select('*')
        .eq('status', 'publicado')
        .gte('publicado_em', dataInicialStr);

      if (error) throw error;

      if (!publicacoes || publicacoes.length === 0) {
        return {
          success: true,
          message: '⚠️ Nenhuma publicação encontrada no período',
          total_posts: 0
        };
      }

      // Distribuição por tipo
      const porTipo: Record<string, number> = {};
      publicacoes.forEach(pub => {
        const tipo = pub.tipo_post || 'outros';
        porTipo[tipo] = (porTipo[tipo] || 0) + 1;
      });

      const distribuicao = Object.entries(porTipo).map(([tipo, count]) => ({
        tipo,
        quantidade: count,
        percentual: ((count / publicacoes.length) * 100).toFixed(1) + '%'
      })).sort((a, b) => b.quantidade - a.quantidade);

      // Frequência de postagem
      const totalPosts = publicacoes.length;
      const postagensoPorDia = totalPosts / date_range_days;
      const postagensPorSemana = postagensoPorDia * 7;

      // Identificar gaps (dias sem postagem)
      const datasPub = publicacoes.map(p => new Date(p.publicado_em).toISOString().split('T')[0]);
      const datasUnicas = [...new Set(datasPub)];
      const diasComPostagem = datasUnicas.length;
      const diasSemPostagem = date_range_days - diasComPostagem;

      return {
        success: true,
        message: `✅ Análise de mix de conteúdo concluída (${date_range_days} dias)`,
        periodo_dias: date_range_days,
        total_posts: totalPosts,

        frequencia: {
          posts_por_dia: postagensoPorDia.toFixed(2),
          posts_por_semana: postagensPorSemana.toFixed(1),
          dias_com_postagem: diasComPostagem,
          dias_sem_postagem: diasSemPostagem,
          consistencia: ((diasComPostagem / date_range_days) * 100).toFixed(1) + '%',
          classificacao: postagensoPorDia >= 1 ? 'Alta Frequência' :
                        postagensoPorDia >= 0.5 ? 'Boa Frequência' :
                        postagensoPorDia >= 0.2 ? 'Frequência Moderada' :
                        'Baixa Frequência'
        },

        distribuicao_por_tipo: distribuicao,

        recomendacoes: [
          diasSemPostagem > date_range_days * 0.3 ? `${diasSemPostagem} dias sem postagem (${(diasSemPostagem / date_range_days * 100).toFixed(1)}%) - aumentar consistência` : 'Consistência de postagem boa',
          distribuicao[0] && (distribuicao[0].quantidade / totalPosts) > 0.7 ? `${distribuicao[0].tipo} representa ${distribuicao[0].percentual} - diversificar tipos de conteúdo` : 'Mix de conteúdo balanceado'
        ]
      };

    } catch (error) {
      console.error('ERRO analyzeContentMix:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar mix de conteúdo'
      };
    }
  }
});

// ============================================
// TOOL 7: Prever Engajamento
// ============================================
export const forecastEngagement = tool({
  description: 'Previsão de engajamento futuro baseado em tendências históricas',
  inputSchema: z.object({
    forecast_days: z.number().default(30)
      .describe('Quantos dias prever no futuro (padrão: 30)'),
    lookback_days: z.number().default(60)
      .describe('Dias de histórico para análise (padrão: 60)')
  }),

  execute: async ({ forecast_days = 30, lookback_days = 60 }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - lookback_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      const { data: metricas, error } = await supabase
        .schema('marketing_organico')
        .from('metricas_publicacoes')
        .select('*')
        .gte('registrado_em', dataInicialStr)
        .order('registrado_em', { ascending: true });

      if (error) throw error;

      if (!metricas || metricas.length < 5) {
        return {
          success: true,
          message: '⚠️ Dados insuficientes para previsão',
          engagement_previsto: 0
        };
      }

      // Agrupar por semana
      const porSemana: Record<string, { engagement: number; alcance: number; posts: number }> = {};

      metricas.forEach(metrica => {
        const data = new Date(metrica.registrado_em);
        const semana = Math.floor(data.getTime() / (7 * 24 * 60 * 60 * 1000));
        const semanaKey = `Semana ${semana}`;

        if (!porSemana[semanaKey]) {
          porSemana[semanaKey] = { engagement: 0, alcance: 0, posts: 0 };
        }

        const engagement = (metrica.curtidas || 0) + (metrica.comentarios || 0) + (metrica.compartilhamentos || 0);
        porSemana[semanaKey].engagement += engagement;
        porSemana[semanaKey].alcance += metrica.alcance || 0;
        porSemana[semanaKey].posts++;
      });

      const semanas = Object.values(porSemana);
      const mediaEngagementSemanal = semanas.reduce((sum, s) => sum + s.engagement, 0) / semanas.length;
      const mediaAlcanceSemanal = semanas.reduce((sum, s) => sum + s.alcance, 0) / semanas.length;

      // Regressão linear simples para tendência
      const n = semanas.length;
      const somaX = (n * (n + 1)) / 2;
      const somaY = semanas.reduce((sum, s) => sum + s.engagement, 0);
      const somaXY = semanas.reduce((sum, s, i) => sum + (i + 1) * s.engagement, 0);
      const somaX2 = (n * (n + 1) * (2 * n + 1)) / 6;

      const slope = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX);
      const tendencia = slope > 100 ? 'crescente' : slope < -100 ? 'decrescente' : 'estável';

      // Projeção
      const semanasPrevisao = Math.ceil(forecast_days / 7);
      const engagementPrevisto = mediaEngagementSemanal * semanasPrevisao;
      const alcancePrevisto = mediaAlcanceSemanal * semanasPrevisao;

      return {
        success: true,
        message: `✅ Previsão de engajamento para ${forecast_days} dias concluída`,
        forecast_days: forecast_days,
        lookback_days: lookback_days,

        historico: {
          media_engagement_semanal: Math.round(mediaEngagementSemanal),
          media_alcance_semanal: Math.round(mediaAlcanceSemanal),
          tendencia: tendencia,
          slope: slope.toFixed(2)
        },

        previsao: {
          engagement_previsto_total: Math.round(engagementPrevisto),
          alcance_previsto_total: Math.round(alcancePrevisto),
          engagement_rate_previsto: alcancePrevisto > 0 ? ((engagementPrevisto / alcancePrevisto) * 100).toFixed(2) + '%' : '0%',
          periodo: `próximos ${forecast_days} dias (${semanasPrevisao} semanas)`
        },

        insights: [
          tendencia === 'crescente'
            ? `Engajamento em crescimento - esperado aumento de ${(slope * semanasPrevisao).toFixed(0)} interações`
            : tendencia === 'decrescente'
            ? 'Engajamento em queda - revisar estratégia de conteúdo'
            : 'Engajamento estável - manter estratégia atual'
        ]
      };

    } catch (error) {
      console.error('ERRO forecastEngagement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao prever engajamento'
      };
    }
  }
});

// ============================================
// TOOL 8: Calcular ROI de Conteúdo
// ============================================
export const calculateContentROI = tool({
  description: 'Calcula ROI do marketing orgânico: custo de produção vs resultados',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)'),
    custo_producao_por_post: z.number().default(50)
      .describe('Custo médio de produção por post (padrão: R$ 50)')
  }),

  execute: async ({ date_range_days = 30, custo_producao_por_post = 50 }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - date_range_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      const { data: publicacoes, error: errorPub } = await supabase
        .schema('marketing_organico')
        .from('publicacoes')
        .select('*')
        .eq('status', 'publicado')
        .gte('publicado_em', dataInicialStr);

      if (errorPub) throw errorPub;

      const { data: metricas, error: errorMetr } = await supabase
        .schema('marketing_organico')
        .from('metricas_publicacoes')
        .select('*')
        .gte('registrado_em', dataInicialStr);

      if (errorMetr) throw errorMetr;

      if (!publicacoes || publicacoes.length === 0) {
        return {
          success: true,
          message: '⚠️ Nenhuma publicação encontrada no período',
          roi: 0
        };
      }

      const totalPosts = publicacoes.length;
      const custoTotal = totalPosts * custo_producao_por_post;

      const totalAlcance = metricas?.reduce((sum, m) => sum + (m.alcance || 0), 0) || 0;
      const totalEngagement = metricas?.reduce((sum, m) =>
        sum + (m.curtidas || 0) + (m.comentarios || 0) + (m.compartilhamentos || 0), 0) || 0;

      // Valor estimado (R$ 0.10 por alcance, R$ 0.50 por engagement)
      const valorAlcance = totalAlcance * 0.10;
      const valorEngagement = totalEngagement * 0.50;
      const valorTotal = valorAlcance + valorEngagement;

      const roi = custoTotal > 0 ? ((valorTotal - custoTotal) / custoTotal) * 100 : 0;

      return {
        success: true,
        message: `✅ ROI calculado para ${totalPosts} posts (${date_range_days} dias)`,
        periodo_dias: date_range_days,
        total_posts: totalPosts,

        custos: {
          custo_por_post: custo_producao_por_post.toFixed(2),
          custo_total: custoTotal.toFixed(2)
        },

        resultados: {
          total_alcance: totalAlcance,
          total_engagement: totalEngagement,
          valor_alcance: valorAlcance.toFixed(2),
          valor_engagement: valorEngagement.toFixed(2),
          valor_total_gerado: valorTotal.toFixed(2)
        },

        roi: {
          percentual: roi.toFixed(2) + '%',
          valor_retorno: (valorTotal - custoTotal).toFixed(2),
          custo_por_alcance: totalAlcance > 0 ? (custoTotal / totalAlcance).toFixed(4) : '0',
          custo_por_engagement: totalEngagement > 0 ? (custoTotal / totalEngagement).toFixed(2) : '0',
          classificacao: roi >= 200 ? 'ROI Excelente' :
                        roi >= 100 ? 'ROI Muito Bom' :
                        roi >= 50 ? 'ROI Bom' :
                        roi >= 0 ? 'ROI Positivo' :
                        'ROI Negativo - Revisar Estratégia'
        }
      };

    } catch (error) {
      console.error('ERRO calculateContentROI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao calcular ROI de conteúdo'
      };
    }
  }
});
