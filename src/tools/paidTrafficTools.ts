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

export const analyzeCampaignROAS = tool({
  description: 'Analisa ROI/ROAS por campanha: gasto, receita, conversões, custo por conversão',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar por plataforma'),
  }),
  execute: async ({ date_range_days = 30, plataforma }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);

      let query = supabase
        .schema('trafego_pago')
        .from('metricas_anuncios')
        .select('*')
        .gte('data', dataInicio.toISOString().split('T')[0]);

      if (plataforma) {
        query = query.eq('plataforma', plataforma);
      }

      const { data: metricas } = await query;

      if (!metricas || metricas.length === 0) {
        return {
          success: false,
          message: 'Nenhuma métrica encontrada no período'
        };
      }

      // Agrupar por campanha
      const campanhas = new Map();

      for (const metrica of metricas) {
        const campanha_id = metrica.campanha_id;

        if (!campanhas.has(campanha_id)) {
          campanhas.set(campanha_id, {
            gasto: 0,
            receita: 0,
            conversoes: 0,
            impressoes: 0,
            cliques: 0
          });
        }

        const stats = campanhas.get(campanha_id);
        stats.gasto += metrica.gasto || 0;
        stats.receita += metrica.receita || 0;
        stats.conversoes += metrica.conversao || 0;
        stats.impressoes += metrica.impressoes || 0;
        stats.cliques += metrica.cliques || 0;
      }

      const campanhasArray = [];
      for (const [campanha_id, stats] of campanhas.entries()) {
        const roas = stats.gasto > 0 ? stats.receita / stats.gasto : 0;
        const custo_por_conversao = stats.conversoes > 0 ? stats.gasto / stats.conversoes : 0;
        const ctr = stats.impressoes > 0 ? (stats.cliques / stats.impressoes) * 100 : 0;

        let classificacao = 'Ruim';
        if (roas >= 4) classificacao = 'Excelente';
        else if (roas >= 2.5) classificacao = 'Bom';
        else if (roas >= 1.5) classificacao = 'Regular';

        campanhasArray.push({
          campanha_id,
          gasto: stats.gasto.toFixed(2),
          receita: stats.receita.toFixed(2),
          conversoes: stats.conversoes,
          roas: roas.toFixed(2),
          custo_por_conversao: custo_por_conversao.toFixed(2),
          ctr: ctr.toFixed(2) + '%',
          classificacao
        });
      }

      campanhasArray.sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas));

      return {
        success: true,
        message: `Análise de ${campanhasArray.length} campanhas`,
        periodo_dias: date_range_days,
        plataforma: plataforma || 'Todas',
        total_campanhas: campanhasArray.length,
        melhor_campanha: campanhasArray[0]?.campanha_id,
        campanhas: campanhasArray
      };

    } catch (error) {
      console.error('ERRO analyzeCampaignROAS:', error);
      return {
        success: false,
        message: `Erro ao analisar ROAS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});

export const compareAdsPlatforms = tool({
  description: 'Compara performance entre plataformas: gasto, ROAS, CTR, conversões',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    let sqlQuery: string | undefined;
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);
      const dataInicioISODate = dataInicio.toISOString().split('T')[0];

      sqlQuery = `
SELECT
  plataforma,
  SUM(gasto) AS total_gasto,
  SUM(receita) AS total_receita,
  SUM(conversao) AS total_conversoes,
  SUM(impressoes) AS total_impressoes,
  SUM(cliques) AS total_cliques,
  CASE WHEN SUM(gasto) = 0 THEN 0 ELSE SUM(receita) / SUM(gasto) END AS roas
FROM trafego_pago.metricas_anuncios
WHERE data >= '${dataInicioISODate}'
GROUP BY plataforma
ORDER BY roas DESC;
      `.trim();

      const { data: metricas, error } = await supabase
        .schema('trafego_pago')
        .from('metricas_anuncios')
        .select('*')
        .gte('data', dataInicioISODate);

      if (error) {
        throw error;
      }

      if (!metricas || metricas.length === 0) {
        return {
          success: false,
          message: 'Nenhuma métrica encontrada',
          sql_query: sqlQuery
        };
      }

      const plataformas = new Map();

      for (const metrica of metricas) {
        const plat = metrica.plataforma || 'Desconhecida';

        if (!plataformas.has(plat)) {
          plataformas.set(plat, {
            gasto: 0,
            receita: 0,
            conversoes: 0,
            impressoes: 0,
            cliques: 0
          });
        }

        const stats = plataformas.get(plat);
        stats.gasto += metrica.gasto || 0;
        stats.receita += metrica.receita || 0;
        stats.conversoes += metrica.conversao || 0;
        stats.impressoes += metrica.impressoes || 0;
        stats.cliques += metrica.cliques || 0;
      }

      const plataformasArray = [];
      for (const [plataforma, stats] of plataformas.entries()) {
        const roas = stats.gasto > 0 ? stats.receita / stats.gasto : 0;
        const ctr = stats.impressoes > 0 ? (stats.cliques / stats.impressoes) * 100 : 0;
        const conversion_rate = stats.cliques > 0 ? (stats.conversoes / stats.cliques) * 100 : 0;

        let classificacao = 'Baixa';
        if (roas >= 3) classificacao = 'Excelente';
        else if (roas >= 2) classificacao = 'Boa';
        else if (roas >= 1) classificacao = 'Regular';

        plataformasArray.push({
          plataforma,
          gasto: stats.gasto.toFixed(2),
          receita: stats.receita.toFixed(2),
          conversoes: stats.conversoes,
          roas: roas.toFixed(2),
          ctr: ctr.toFixed(2) + '%',
          conversion_rate: conversion_rate.toFixed(2) + '%',
          classificacao
        });
      }

      plataformasArray.sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas));

      return {
        success: true,
        message: `Análise de ${plataformasArray.length} plataformas`,
        periodo_dias: date_range_days,
        total_plataformas: plataformasArray.length,
        melhor_plataforma: plataformasArray[0]?.plataforma,
        pior_plataforma: plataformasArray[plataformasArray.length - 1]?.plataforma,
        plataformas: plataformasArray,
        sql_query: sqlQuery
      };

    } catch (error) {
      console.error('ERRO compareAdsPlatforms:', error);
      return {
        success: false,
        message: `Erro ao comparar plataformas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        sql_query: sqlQuery
      };
    }
  }
});

export const analyzeCreativePerformance = tool({
  description: 'Analisa performance de criativos: aprovação, CTR, conversões por tipo',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);

      const { data: criativos } = await supabase
        .schema('trafego_pago')
        .from('anuncios_criacao')
        .select('*')
        .gte('criado_em', dataInicio.toISOString());

      if (!criativos || criativos.length === 0) {
        return {
          success: false,
          message: 'Nenhum criativo encontrado'
        };
      }

      const total = criativos.length;
      const aprovados = criativos.filter(c => c.criativo_status === 'aprovado').length;
      const rascunhos = criativos.filter(c => c.criativo_status === 'rascunho').length;
      const em_revisao = criativos.filter(c => c.criativo_status === 'em_revisao').length;
      const rejeitados = criativos.filter(c => c.criativo_status === 'rejeitado').length;

      const taxa_aprovacao = total > 0 ? (aprovados / total) * 100 : 0;

      return {
        success: true,
        message: `Análise de ${total} criativos`,
        periodo_dias: date_range_days,
        total_criativos: total,
        status: {
          aprovados,
          rascunhos,
          em_revisao,
          rejeitados,
          taxa_aprovacao: taxa_aprovacao.toFixed(2) + '%'
        }
      };

    } catch (error) {
      console.error('ERRO analyzeCreativePerformance:', error);
      return {
        success: false,
        message: `Erro ao analisar criativos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});

export const identifyTopAds = tool({
  description: 'Identifica melhores anúncios por ROAS, conversões e CTR',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    limit: z.number().default(10).describe('Número de anúncios a retornar'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar por plataforma'),
  }),
  execute: async ({ date_range_days = 30, limit = 10, plataforma }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);

      let query = supabase
        .schema('trafego_pago')
        .from('metricas_anuncios')
        .select('*')
        .gte('data', dataInicio.toISOString().split('T')[0])
        .gte('conversao', 1);

      if (plataforma) {
        query = query.eq('plataforma', plataforma);
      }

      const { data: metricas } = await query;

      if (!metricas || metricas.length === 0) {
        return {
          success: false,
          message: 'Nenhum anúncio com conversões encontrado'
        };
      }

      const anuncios = new Map();

      for (const metrica of metricas) {
        const anuncio_id = metrica.anuncio_id;

        if (!anuncios.has(anuncio_id)) {
          anuncios.set(anuncio_id, {
            plataforma: metrica.plataforma,
            gasto: 0,
            receita: 0,
            conversoes: 0,
            impressoes: 0,
            cliques: 0
          });
        }

        const stats = anuncios.get(anuncio_id);
        stats.gasto += metrica.gasto || 0;
        stats.receita += metrica.receita || 0;
        stats.conversoes += metrica.conversao || 0;
        stats.impressoes += metrica.impressoes || 0;
        stats.cliques += metrica.cliques || 0;
      }

      const anunciosArray = [];
      for (const [anuncio_id, stats] of anuncios.entries()) {
        const roas = stats.gasto > 0 ? stats.receita / stats.gasto : 0;
        const ctr = stats.impressoes > 0 ? (stats.cliques / stats.impressoes) * 100 : 0;
        const custo_por_conversao = stats.conversoes > 0 ? stats.gasto / stats.conversoes : 0;

        anunciosArray.push({
          anuncio_id,
          plataforma: stats.plataforma,
          gasto: stats.gasto.toFixed(2),
          receita: stats.receita.toFixed(2),
          conversoes: stats.conversoes,
          roas: roas.toFixed(2),
          ctr: ctr.toFixed(2) + '%',
          custo_por_conversao: custo_por_conversao.toFixed(2)
        });
      }

      anunciosArray.sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas));

      const top = anunciosArray.slice(0, limit);

      return {
        success: true,
        message: `Top ${top.length} anúncios identificados`,
        periodo_dias: date_range_days,
        plataforma: plataforma || 'Todas',
        total_analisados: anunciosArray.length,
        top_anuncios: top
      };

    } catch (error) {
      console.error('ERRO identifyTopAds:', error);
      return {
        success: false,
        message: `Erro ao identificar top anúncios: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});

export const analyzeSpendingTrends = tool({
  description: 'Analisa tendências de gasto: diário, semanal, anomalias',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar por plataforma'),
  }),
  execute: async ({ date_range_days = 30, plataforma }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);

      let query = supabase
        .schema('trafego_pago')
        .from('metricas_anuncios')
        .select('data, gasto, receita')
        .gte('data', dataInicio.toISOString().split('T')[0]);

      if (plataforma) {
        query = query.eq('plataforma', plataforma);
      }

      const { data: metricas } = await query;

      if (!metricas || metricas.length === 0) {
        return {
          success: false,
          message: 'Nenhuma métrica encontrada'
        };
      }

      const gastosPorDia = new Map();

      for (const metrica of metricas) {
        const data = metrica.data;
        if (!gastosPorDia.has(data)) {
          gastosPorDia.set(data, { gasto: 0, receita: 0 });
        }
        const stats = gastosPorDia.get(data);
        stats.gasto += metrica.gasto || 0;
        stats.receita += metrica.receita || 0;
      }

      const gastosDiarios = [];
      for (const [data, stats] of gastosPorDia.entries()) {
        gastosDiarios.push({
          data,
          gasto: stats.gasto.toFixed(2),
          receita: stats.receita.toFixed(2)
        });
      }

      gastosDiarios.sort((a, b) => a.data.localeCompare(b.data));

      const gastos = gastosDiarios.map(d => parseFloat(d.gasto));
      const media = gastos.reduce((a, b) => a + b, 0) / gastos.length;
      const max = Math.max(...gastos);
      const min = Math.min(...gastos);

      let tendencia = 'Estável';
      if (gastos.length >= 7) {
        const primeira_semana = gastos.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
        const ultima_semana = gastos.slice(-7).reduce((a, b) => a + b, 0) / 7;
        const variacao = ((ultima_semana - primeira_semana) / primeira_semana) * 100;

        if (variacao > 10) tendencia = 'Crescente';
        else if (variacao < -10) tendencia = 'Decrescente';
      }

      return {
        success: true,
        message: `Análise de gastos: ${gastosDiarios.length} dias`,
        periodo_dias: date_range_days,
        plataforma: plataforma || 'Todas',
        estatisticas: {
          gasto_medio_dia: media.toFixed(2),
          gasto_maximo: max.toFixed(2),
          gasto_minimo: min.toFixed(2),
          tendencia
        },
        gastos_diarios: gastosDiarios
      };

    } catch (error) {
      console.error('ERRO analyzeSpendingTrends:', error);
      return {
        success: false,
        message: `Erro ao analisar tendências: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});

export const calculateCostMetrics = tool({
  description: 'Calcula métricas de custo: CPM, CPC, CPL, CPA',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar por plataforma'),
  }),
  execute: async ({ date_range_days = 30, plataforma }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);

      let query = supabase
        .schema('trafego_pago')
        .from('metricas_anuncios')
        .select('*')
        .gte('data', dataInicio.toISOString().split('T')[0]);

      if (plataforma) {
        query = query.eq('plataforma', plataforma);
      }

      const { data: metricas } = await query;

      if (!metricas || metricas.length === 0) {
        return {
          success: false,
          message: 'Nenhuma métrica encontrada'
        };
      }

      let total_gasto = 0;
      let total_impressoes = 0;
      let total_cliques = 0;
      let total_conversoes = 0;

      for (const metrica of metricas) {
        total_gasto += metrica.gasto || 0;
        total_impressoes += metrica.impressoes || 0;
        total_cliques += metrica.cliques || 0;
        total_conversoes += metrica.conversao || 0;
      }

      const cpm = total_impressoes > 0 ? (total_gasto / total_impressoes) * 1000 : 0;
      const cpc = total_cliques > 0 ? total_gasto / total_cliques : 0;
      const cpa = total_conversoes > 0 ? total_gasto / total_conversoes : 0;
      const ctr = total_impressoes > 0 ? (total_cliques / total_impressoes) * 100 : 0;

      let classificacao_eficiencia = 'Baixa';
      if (cpa < 50 && ctr > 2) classificacao_eficiencia = 'Excelente';
      else if (cpa < 100 && ctr > 1) classificacao_eficiencia = 'Boa';
      else if (cpa < 200) classificacao_eficiencia = 'Regular';

      return {
        success: true,
        message: `Métricas de custo calculadas`,
        periodo_dias: date_range_days,
        plataforma: plataforma || 'Todas',
        metricas: {
          total_gasto: total_gasto.toFixed(2),
          total_impressoes,
          total_cliques,
          total_conversoes,
          cpm: cpm.toFixed(2),
          cpc: cpc.toFixed(2),
          cpa: cpa.toFixed(2),
          ctr: ctr.toFixed(2) + '%',
          classificacao_eficiencia
        }
      };

    } catch (error) {
      console.error('ERRO calculateCostMetrics:', error);
      return {
        success: false,
        message: `Erro ao calcular métricas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});

export const forecastAdPerformance = tool({
  description: 'Previsão de performance: gasto, conversões, ROAS esperado',
  inputSchema: z.object({
    lookback_days: z.number().default(30).describe('Dias históricos para análise'),
    forecast_days: z.number().default(7).describe('Dias a prever'),
    plataforma: z.enum(['Google', 'Meta', 'Facebook', 'TikTok', 'LinkedIn']).optional().describe('Filtrar por plataforma'),
  }),
  execute: async ({ lookback_days = 30, forecast_days = 7, plataforma }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - lookback_days);

      let query = supabase
        .schema('trafego_pago')
        .from('metricas_anuncios')
        .select('*')
        .gte('data', dataInicio.toISOString().split('T')[0]);

      if (plataforma) {
        query = query.eq('plataforma', plataforma);
      }

      const { data: metricas } = await query;

      if (!metricas || metricas.length === 0) {
        return {
          success: false,
          message: 'Dados insuficientes para previsão'
        };
      }

      let total_gasto = 0;
      let total_receita = 0;
      let total_conversoes = 0;

      for (const metrica of metricas) {
        total_gasto += metrica.gasto || 0;
        total_receita += metrica.receita || 0;
        total_conversoes += metrica.conversao || 0;
      }

      const gasto_medio_dia = total_gasto / lookback_days;
      const conversoes_medio_dia = total_conversoes / lookback_days;
      const roas_medio = total_gasto > 0 ? total_receita / total_gasto : 0;

      const gasto_previsto = gasto_medio_dia * forecast_days;
      const conversoes_previstas = Math.round(conversoes_medio_dia * forecast_days);
      const receita_prevista = gasto_previsto * roas_medio;

      return {
        success: true,
        message: `Previsão para ${forecast_days} dias`,
        lookback_days,
        forecast_days,
        plataforma: plataforma || 'Todas',
        historico: {
          gasto_medio_dia: gasto_medio_dia.toFixed(2),
          conversoes_medio_dia: conversoes_medio_dia.toFixed(2),
          roas_medio: roas_medio.toFixed(2)
        },
        previsao: {
          gasto_previsto: gasto_previsto.toFixed(2),
          conversoes_previstas,
          receita_prevista: receita_prevista.toFixed(2),
          roas_esperado: roas_medio.toFixed(2)
        }
      };

    } catch (error) {
      console.error('ERRO forecastAdPerformance:', error);
      return {
        success: false,
        message: `Erro ao prever performance: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});
