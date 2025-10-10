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

export const analyzeTrafficOverview = tool({
  description: 'Analisa visão geral de tráfego: sessões, usuários, pageviews, bounce rate, duração média, tendências',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);
      const dataFim = new Date();

      // Buscar sessões
      const { data: sessoes } = await supabase
        .schema('gestaoanalytics')
        .from('sessoes')
        .select('*')
        .gte('session_start', dataInicio.toISOString())
        .lte('session_start', dataFim.toISOString())
        .eq('eh_bot', false);

      if (!sessoes || sessoes.length === 0) {
        return {
          success: false,
          message: 'Nenhuma sessão encontrada no período'
        };
      }

      // Buscar visitantes únicos
      const { data: visitantes } = await supabase
        .schema('gestaoanalytics')
        .from('visitantes')
        .select('*')
        .gte('first_seen', dataInicio.toISOString());

      const totalSessoes = sessoes.length;
      const totalUsuarios = new Set(sessoes.map(s => s.visitor_id)).size;
      const totalPageviews = sessoes.reduce((acc, s) => acc + (s.pages_viewed || 0), 0);

      const sessoesBounce = sessoes.filter(s => (s.pages_viewed || 0) <= 1).length;
      const bounceRate = totalSessoes > 0 ? (sessoesBounce / totalSessoes) * 100 : 0;

      const duracaoTotal = sessoes.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
      const avgDuration = totalSessoes > 0 ? duracaoTotal / totalSessoes : 0;

      const pagesPerSession = totalSessoes > 0 ? totalPageviews / totalSessoes : 0;

      // Calcular retorno
      const visitantesRecorrentes = visitantes?.filter(v => (v.total_sessions || 0) > 1).length || 0;
      const returnRate = visitantes && visitantes.length > 0 ? (visitantesRecorrentes / visitantes.length) * 100 : 0;

      // Classificação de saúde
      let classificacao = 'Ruim';
      if (bounceRate < 60 && avgDuration > 120 && pagesPerSession > 3) {
        classificacao = 'Excelente';
      } else if (bounceRate < 70 && avgDuration > 90 && pagesPerSession > 2.5) {
        classificacao = 'Bom';
      } else if (bounceRate < 80 && avgDuration > 60) {
        classificacao = 'Regular';
      }

      return {
        success: true,
        message: `Análise de tráfego: ${totalSessoes} sessões em ${date_range_days} dias`,
        periodo_dias: date_range_days,
        metricas: {
          total_sessoes: totalSessoes,
          total_usuarios: totalUsuarios,
          total_pageviews: totalPageviews,
          bounce_rate: bounceRate.toFixed(2) + '%',
          avg_duration_seconds: Math.round(avgDuration),
          avg_duration_minutos: (avgDuration / 60).toFixed(2),
          pages_per_session: pagesPerSession.toFixed(2),
          return_visitor_rate: returnRate.toFixed(2) + '%',
          classificacao
        }
      };

    } catch (error) {
      console.error('ERRO analyzeTrafficOverview:', error);
      return {
        success: false,
        message: `Erro ao analisar tráfego: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});

export const compareTrafficSources = tool({
  description: 'Compara fontes de tráfego: distribuição, quality score, conversão por canal',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);
      const dataFim = new Date();

      const { data: sessoes } = await supabase
        .schema('gestaoanalytics')
        .from('sessoes')
        .select('*')
        .gte('session_start', dataInicio.toISOString())
        .lte('session_start', dataFim.toISOString())
        .eq('eh_bot', false);

      if (!sessoes || sessoes.length === 0) {
        return {
          success: false,
          message: 'Nenhuma sessão encontrada no período'
        };
      }

      // Buscar transações
      const { data: transacoes } = await supabase
        .schema('gestaoanalytics')
        .from('transacoes_analytics')
        .select('session_id')
        .gte('transaction_timestamp', dataInicio.toISOString());

      const sessionIdsComTransacao = new Set(transacoes?.map(t => t.session_id) || []);

      // Agrupar por fonte
      const fontes = new Map();

      sessoes.forEach(sessao => {
        const fonte = sessao.utm_source || 'direct';

        if (!fontes.has(fonte)) {
          fontes.set(fonte, {
            sessoes: 0,
            pageviews: 0,
            duracao_total: 0,
            conversoes: 0
          });
        }

        const stats = fontes.get(fonte);
        stats.sessoes++;
        stats.pageviews += sessao.pages_viewed || 0;
        stats.duracao_total += sessao.duration_seconds || 0;
        if (sessionIdsComTransacao.has(sessao.id)) {
          stats.conversoes++;
        }
      });

      const fontesArray = Array.from(fontes.entries()).map(([fonte, stats]) => {
        const avgDuration = stats.sessoes > 0 ? stats.duracao_total / stats.sessoes : 0;
        const pagesPerSession = stats.sessoes > 0 ? stats.pageviews / stats.sessoes : 0;
        const conversionRate = stats.sessoes > 0 ? (stats.conversoes / stats.sessoes) * 100 : 0;

        // Quality Score
        const qualityScore = (conversionRate * 100 + pagesPerSession * 10 + avgDuration * 0.01) / stats.sessoes;

        let classificacao = 'Baixa';
        if (qualityScore > 15) classificacao = 'Excelente';
        else if (qualityScore > 10) classificacao = 'Boa';
        else if (qualityScore > 5) classificacao = 'Regular';

        return {
          fonte,
          sessoes: stats.sessoes,
          percentual_trafego: ((stats.sessoes / sessoes.length) * 100).toFixed(2) + '%',
          pages_per_session: pagesPerSession.toFixed(2),
          avg_duration_seconds: Math.round(avgDuration),
          conversoes: stats.conversoes,
          conversion_rate: conversionRate.toFixed(2) + '%',
          quality_score: qualityScore.toFixed(2),
          classificacao
        };
      });

      fontesArray.sort((a, b) => parseFloat(b.quality_score) - parseFloat(a.quality_score));

      return {
        success: true,
        message: `Análise de ${fontesArray.length} fontes de tráfego`,
        periodo_dias: date_range_days,
        total_fontes: fontesArray.length,
        melhor_fonte: fontesArray[0]?.fonte,
        pior_fonte: fontesArray[fontesArray.length - 1]?.fonte,
        fontes: fontesArray
      };

    } catch (error) {
      console.error('ERRO compareTrafficSources:', error);
      return {
        success: false,
        message: `Erro ao comparar fontes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});

export const analyzeConversionFunnel = tool({
  description: 'Analisa funil de conversão: steps, drop-off, tempo médio, gargalos',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    funnel_events: z.array(z.string()).describe('Lista de eventos que compõem o funil, em ordem'),
  }),
  execute: async ({ date_range_days = 30, funnel_events }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);

      const { data: eventos } = await supabase
        .schema('gestaoanalytics')
        .from('eventos')
        .select('*')
        .gte('event_timestamp', dataInicio.toISOString())
        .in('event_name', funnel_events);

      if (!eventos || eventos.length === 0) {
        return {
          success: false,
          message: 'Nenhum evento encontrado para o funil'
        };
      }

      // Agrupar por sessão
      const sessoesFunil = new Map();
      eventos.forEach(evento => {
        if (!sessoesFunil.has(evento.session_id)) {
          sessoesFunil.set(evento.session_id, []);
        }
        sessoesFunil.get(evento.session_id).push(evento);
      });

      const steps = funnel_events.map((eventName, idx) => {
        const sessoesComEvento = Array.from(sessoesFunil.values()).filter(eventosSession =>
          eventosSession.some(e => e.event_name === eventName)
        ).length;

        const dropOff = idx > 0 ?
          ((steps[idx - 1].usuarios - sessoesComEvento) / steps[idx - 1].usuarios) * 100 : 0;

        return {
          step: idx + 1,
          event_name: eventName,
          usuarios: sessoesComEvento,
          drop_off: dropOff.toFixed(2) + '%',
        };
      });

      const conversionRate = steps.length > 0 && steps[0].usuarios > 0 ?
        (steps[steps.length - 1].usuarios / steps[0].usuarios) * 100 : 0;

      const gargalos = steps.filter((s, i) => i > 0 && parseFloat(s.drop_off) > 50);

      return {
        success: true,
        message: `Funil de ${funnel_events.length} steps analisado`,
        periodo_dias: date_range_days,
        total_steps: funnel_events.length,
        conversion_rate: conversionRate.toFixed(2) + '%',
        steps,
        gargalos: gargalos.map(g => `Step ${g.step}: ${g.event_name} (drop ${g.drop_off})`)
      };

    } catch (error) {
      console.error('ERRO analyzeConversionFunnel:', error);
      return {
        success: false,
        message: `Erro ao analisar funil: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});

export const identifyTopLandingPages = tool({
  description: 'Identifica melhores e piores landing pages: pageviews, bounce rate, conversão',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    limit: z.number().default(10).describe('Número de páginas a retornar'),
  }),
  execute: async ({ date_range_days = 30, limit = 10 }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);

      const { data: agregado } = await supabase
        .schema('gestaoanalytics')
        .from('agregado_diario_por_pagina')
        .select('*')
        .gte('data', dataInicio.toISOString().split('T')[0]);

      if (!agregado || agregado.length === 0) {
        return {
          success: false,
          message: 'Nenhum dado de página encontrado'
        };
      }

      // Agrupar por página
      const paginas = new Map();
      agregado.forEach(dia => {
        if (!paginas.has(dia.pagina)) {
          paginas.set(dia.pagina, { pageviews: 0 });
        }
        paginas.get(dia.pagina).pageviews += dia.pageviews || 0;
      });

      const paginasArray = Array.from(paginas.entries()).map(([pagina, stats]) => ({
        pagina,
        pageviews: stats.pageviews,
      }));

      paginasArray.sort((a, b) => b.pageviews - a.pageviews);

      const top = paginasArray.slice(0, limit);
      const bottom = paginasArray.slice(-Math.min(5, limit));

      return {
        success: true,
        message: `Análise de ${paginasArray.length} landing pages`,
        periodo_dias: date_range_days,
        total_paginas: paginasArray.length,
        top_pages: top,
        worst_pages: bottom
      };

    } catch (error) {
      console.error('ERRO identifyTopLandingPages:', error);
      return {
        success: false,
        message: `Erro ao identificar landing pages: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});

export const analyzeDevicePerformance = tool({
  description: 'Analisa performance por dispositivo: desktop/mobile/tablet, browser, conversão',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);

      const { data: sessoes } = await supabase
        .schema('gestaoanalytics')
        .from('sessoes')
        .select('visitor_id, duration_seconds, pages_viewed')
        .gte('session_start', dataInicio.toISOString())
        .eq('eh_bot', false);

      const { data: propriedades } = await supabase
        .schema('gestaoanalytics')
        .from('propriedades_visitante')
        .select('*');

      if (!propriedades || propriedades.length === 0) {
        return {
          success: false,
          message: 'Nenhuma propriedade de visitante encontrada'
        };
      }

      const propMap = new Map();
      propriedades.forEach(p => {
        propMap.set(p.visitor_id, p);
      });

      const devices = new Map();
      const browsers = new Map();

      sessoes?.forEach(sessao => {
        const prop = propMap.get(sessao.visitor_id);
        if (!prop) return;

        const deviceType = prop.device_type || 'unknown';
        const browser = prop.browser || 'unknown';

        if (!devices.has(deviceType)) {
          devices.set(deviceType, { sessoes: 0, duracao: 0, pageviews: 0 });
        }
        if (!browsers.has(browser)) {
          browsers.set(browser, { sessoes: 0 });
        }

        const devStats = devices.get(deviceType);
        devStats.sessoes++;
        devStats.duracao += sessao.duration_seconds || 0;
        devStats.pageviews += sessao.pages_viewed || 0;

        browsers.get(browser).sessoes++;
      });

      const devicesArray = Array.from(devices.entries()).map(([device, stats]) => ({
        device_type: device,
        sessoes: stats.sessoes,
        percentual: ((stats.sessoes / (sessoes?.length || 1)) * 100).toFixed(2) + '%',
        avg_duration: stats.sessoes > 0 ? Math.round(stats.duracao / stats.sessoes) : 0,
        avg_pageviews: stats.sessoes > 0 ? (stats.pageviews / stats.sessoes).toFixed(2) : '0'
      }));

      const browsersArray = Array.from(browsers.entries())
        .map(([browser, stats]) => ({
          browser,
          sessoes: stats.sessoes,
          percentual: ((stats.sessoes / (sessoes?.length || 1)) * 100).toFixed(2) + '%'
        }))
        .sort((a, b) => b.sessoes - a.sessoes)
        .slice(0, 5);

      return {
        success: true,
        message: `Análise de dispositivos e browsers`,
        periodo_dias: date_range_days,
        devices: devicesArray,
        top_browsers: browsersArray
      };

    } catch (error) {
      console.error('ERRO analyzeDevicePerformance:', error);
      return {
        success: false,
        message: `Erro ao analisar dispositivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});

export const detectTrafficAnomalies = tool({
  description: 'Detecta anomalias no tráfego: picos, quedas, bounce rate anormal, tráfego bot',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
    sensitivity: z.number().default(2).describe('Sensibilidade (z-score threshold, padrão 2)'),
  }),
  execute: async ({ date_range_days = 30, sensitivity = 2 }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);

      const { data: agregado } = await supabase
        .schema('gestaoanalytics')
        .from('agregado_diario_por_fonte')
        .select('*')
        .gte('data', dataInicio.toISOString().split('T')[0]);

      if (!agregado || agregado.length === 0) {
        return {
          success: false,
          message: 'Dados insuficientes para análise de anomalias'
        };
      }

      // Análise estatística
      const sessoesPorDia = new Map();
      agregado.forEach(dia => {
        const data = dia.data;
        if (!sessoesPorDia.has(data)) {
          sessoesPorDia.set(data, 0);
        }
        sessoesPorDia.set(data, sessoesPorDia.get(data) + (dia.sessoes || 0));
      });

      const valores = Array.from(sessoesPorDia.values());
      const media = valores.reduce((a, b) => a + b, 0) / valores.length;
      const variancia = valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / valores.length;
      const desvio = Math.sqrt(variancia);

      const anomalias = [];
      sessoesPorDia.forEach((sessoes, data) => {
        const zScore = desvio > 0 ? (sessoes - media) / desvio : 0;
        if (Math.abs(zScore) > sensitivity) {
          anomalias.push({
            data,
            sessoes,
            media: Math.round(media),
            z_score: zScore.toFixed(2),
            tipo: zScore > 0 ? 'Pico' : 'Queda',
            severidade: Math.abs(zScore) > 3 ? 'CRÍTICA' : 'ALTA'
          });
        }
      });

      // Checar bots
      const { data: sessoesBot } = await supabase
        .schema('gestaoanalytics')
        .from('sessoes')
        .select('id')
        .gte('session_start', dataInicio.toISOString())
        .eq('eh_bot', true);

      const { data: sessoesTotal } = await supabase
        .schema('gestaoanalytics')
        .from('sessoes')
        .select('id')
        .gte('session_start', dataInicio.toISOString());

      const botRate = sessoesTotal && sessoesTotal.length > 0 ?
        ((sessoesBot?.length || 0) / sessoesTotal.length) * 100 : 0;

      const redFlags = [];
      if (botRate > 30) redFlags.push(`Tráfego bot alto: ${botRate.toFixed(2)}%`);
      if (anomalias.filter(a => a.severidade === 'CRÍTICA').length > 0) {
        redFlags.push(`${anomalias.filter(a => a.severidade === 'CRÍTICA').length} anomalias críticas detectadas`);
      }

      return {
        success: true,
        message: `${anomalias.length} anomalias detectadas`,
        periodo_dias: date_range_days,
        sensitivity,
        estatisticas: {
          media_sessoes_dia: Math.round(media),
          desvio_padrao: Math.round(desvio)
        },
        total_anomalias: anomalias.length,
        bot_rate: botRate.toFixed(2) + '%',
        anomalias,
        red_flags: redFlags
      };

    } catch (error) {
      console.error('ERRO detectTrafficAnomalies:', error);
      return {
        success: false,
        message: `Erro ao detectar anomalias: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});

export const analyzeUserBehavior = tool({
  description: 'Analisa comportamento de usuários: novos vs recorrentes, frequência, engagement',
  inputSchema: z.object({
    date_range_days: z.number().default(30).describe('Período de análise em dias'),
  }),
  execute: async ({ date_range_days = 30 }) => {
    try {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - date_range_days);

      const { data: visitantes } = await supabase
        .schema('gestaoanalytics')
        .from('visitantes')
        .select('*')
        .gte('first_seen', dataInicio.toISOString());

      const { data: sessoes } = await supabase
        .schema('gestaoanalytics')
        .from('sessoes')
        .select('visitor_id, session_start')
        .gte('session_start', dataInicio.toISOString())
        .eq('eh_bot', false);

      const { data: eventos } = await supabase
        .schema('gestaoanalytics')
        .from('eventos')
        .select('session_id')
        .gte('event_timestamp', dataInicio.toISOString());

      if (!visitantes || visitantes.length === 0) {
        return {
          success: false,
          message: 'Nenhum visitante encontrado'
        };
      }

      const novos = visitantes.filter(v => (v.total_sessions || 0) === 1).length;
      const recorrentes = visitantes.length - novos;

      const frequenciaMedia = visitantes.reduce((acc, v) => acc + (v.total_sessions || 0), 0) / visitantes.length;

      // Engagement rate
      const sessoesComEvento = new Set(eventos?.map(e => e.session_id) || []).size;
      const engagementRate = sessoes && sessoes.length > 0 ?
        (sessoesComEvento / sessoes.length) * 100 : 0;

      let classificacao = 'Baixo';
      if (engagementRate > 70 && recorrentes / visitantes.length > 0.4) {
        classificacao = 'Excelente';
      } else if (engagementRate > 50 && recorrentes / visitantes.length > 0.3) {
        classificacao = 'Bom';
      } else if (engagementRate > 30) {
        classificacao = 'Regular';
      }

      return {
        success: true,
        message: `Análise de ${visitantes.length} visitantes`,
        periodo_dias: date_range_days,
        comportamento: {
          total_visitantes: visitantes.length,
          novos_visitantes: novos,
          visitantes_recorrentes: recorrentes,
          percentual_novos: ((novos / visitantes.length) * 100).toFixed(2) + '%',
          percentual_recorrentes: ((recorrentes / visitantes.length) * 100).toFixed(2) + '%',
          frequencia_media_visitas: frequenciaMedia.toFixed(2),
          engagement_rate: engagementRate.toFixed(2) + '%',
          classificacao
        }
      };

    } catch (error) {
      console.error('ERRO analyzeUserBehavior:', error);
      return {
        success: false,
        message: `Erro ao analisar comportamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
});
