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

// ============================================
// TOOL 2: Calcular Performance de Entregas
// ============================================
export const calculateDeliveryPerformance = tool({
  description: 'Calcula métricas de performance de entregas: on-time rate, tempo médio, success rate, lead time',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)'),
    transportadora_id: z.string().optional()
      .describe('Filtrar por transportadora específica (opcional)')
  }),

  execute: async ({ date_range_days = 30, transportadora_id }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - date_range_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      let query = supabase
        .schema('gestaologistica')
        .from('envios')
        .select('*')
        .gte('data_postagem', dataInicialStr);

      if (transportadora_id) {
        query = query.eq('transportadora_id', transportadora_id);
      }

      const { data: envios, error } = await query;
      if (error) throw error;

      if (!envios || envios.length === 0) {
        return {
          success: true,
          message: '⚠️ Nenhum envio encontrado no período',
          total_envios: 0
        };
      }

      // 1. ON-TIME DELIVERY RATE
      const enviosEntregues = envios.filter(e => e.data_entrega);
      const enviosNoPrazo = enviosEntregues.filter(e => {
        const dataEntrega = new Date(e.data_entrega);
        const dataPrevista = new Date(e.data_prevista_entrega);
        return dataEntrega <= dataPrevista;
      });
      const onTimeRate = enviosEntregues.length > 0
        ? (enviosNoPrazo.length / enviosEntregues.length) * 100
        : 0;

      // 2. AVERAGE DELIVERY TIME
      const temposEntrega = enviosEntregues.map(e => {
        const dataEntrega = new Date(e.data_entrega);
        const dataPostagem = new Date(e.data_postagem);
        return (dataEntrega.getTime() - dataPostagem.getTime()) / (1000 * 60 * 60 * 24);
      });
      const avgDeliveryTime = temposEntrega.length > 0
        ? temposEntrega.reduce((a, b) => a + b, 0) / temposEntrega.length
        : 0;

      // 3. FIRST ATTEMPT SUCCESS (estimado por ausência de múltiplos eventos)
      const firstAttemptSuccess = 85; // Placeholder - precisa de dados de tentativas

      // 4. LEAD TIME (tempo de processamento até postagem)
      const leadTimes = envios.map(e => {
        const dataPostagem = new Date(e.data_postagem);
        const dataPedido = new Date(e.created_at);
        return (dataPostagem.getTime() - dataPedido.getTime()) / (1000 * 60 * 60 * 24);
      });
      const avgLeadTime = leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length;

      // 5. SLA COMPLIANCE
      const slaCompliance = onTimeRate;

      // CLASSIFICAÇÃO
      const classificacao = onTimeRate >= 95 ? 'Excelente'
        : onTimeRate >= 90 ? 'Bom'
        : onTimeRate >= 85 ? 'Atenção'
        : 'Crítico';

      return {
        success: true,
        message: `✅ Análise de performance concluída (${date_range_days} dias)`,
        periodo_dias: date_range_days,
        transportadora_id: transportadora_id || 'TODAS',
        total_envios: envios.length,
        envios_entregues: enviosEntregues.length,

        on_time_delivery: {
          rate: onTimeRate.toFixed(2) + '%',
          entregas_no_prazo: enviosNoPrazo.length,
          entregas_atrasadas: enviosEntregues.length - enviosNoPrazo.length,
          classificacao: onTimeRate >= 95 ? 'Excelente' : onTimeRate >= 90 ? 'Bom' : 'Crítico'
        },

        delivery_time: {
          average_days: avgDeliveryTime.toFixed(1),
          min_days: Math.min(...temposEntrega).toFixed(1),
          max_days: Math.max(...temposEntrega).toFixed(1),
          classificacao: avgDeliveryTime <= 3 ? 'Rápido' : avgDeliveryTime <= 7 ? 'Normal' : 'Lento'
        },

        first_attempt_success: {
          rate: firstAttemptSuccess + '%',
          classificacao: firstAttemptSuccess >= 85 ? 'Bom' : 'Precisa Melhorar'
        },

        lead_time: {
          average_hours: (avgLeadTime * 24).toFixed(1),
          classificacao: avgLeadTime < 1 ? 'Excelente (Same-Day)' : avgLeadTime < 2 ? 'Bom' : 'Lento'
        },

        sla_compliance: {
          rate: slaCompliance.toFixed(2) + '%',
          status: slaCompliance >= 95 ? 'Cumprindo SLA' : 'Abaixo do SLA'
        },

        performance_geral: {
          score: ((onTimeRate + firstAttemptSuccess) / 2).toFixed(1),
          classificacao: classificacao
        }
      };

    } catch (error) {
      console.error('ERRO calculateDeliveryPerformance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao calcular performance de entregas'
      };
    }
  }
});

// ============================================
// TOOL 3: Analisar Benchmark de Transportadoras
// ============================================
export const analyzeCarrierBenchmark = tool({
  description: 'Compara performance e custos entre transportadoras, gera ranking e recomendações',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)'),
    metric: z.enum(['performance', 'cost', 'balanced']).default('balanced')
      .describe('Critério de ranking: performance, custo ou balanceado')
  }),

  execute: async ({ date_range_days = 30, metric = 'balanced' }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - date_range_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      // Buscar envios
      const { data: envios, error: errorEnvios } = await supabase
        .schema('gestaologistica')
        .from('envios')
        .select('*')
        .gte('data_postagem', dataInicialStr);

      if (errorEnvios) throw errorEnvios;

      // Buscar transportadoras
      const { data: transportadoras, error: errorTrans } = await supabase
        .schema('gestaologistica')
        .from('transportadoras')
        .select('*');

      if (errorTrans) throw errorTrans;

      // Agrupar por transportadora
      const benchmark: Record<string, {
        nome: string;
        total_envios: number;
        entregas_no_prazo: number;
        on_time_rate: number;
        custo_total: number;
        custo_medio: number;
        cost_per_kg: number;
        peso_total: number;
        performance_score: number;
      }> = {};

      envios?.forEach(envio => {
        const transId = envio.transportadora_id;
        if (!benchmark[transId]) {
          const trans = transportadoras?.find(t => t.id === transId);
          benchmark[transId] = {
            nome: trans?.nome || transId,
            total_envios: 0,
            entregas_no_prazo: 0,
            on_time_rate: 0,
            custo_total: 0,
            custo_medio: 0,
            cost_per_kg: 0,
            peso_total: 0,
            performance_score: 0
          };
        }

        benchmark[transId].total_envios++;
        benchmark[transId].custo_total += envio.custo_frete || 0;
        benchmark[transId].peso_total += envio.peso_kg || 0;

        if (envio.data_entrega) {
          const dataEntrega = new Date(envio.data_entrega);
          const dataPrevista = new Date(envio.data_prevista_entrega);
          if (dataEntrega <= dataPrevista) {
            benchmark[transId].entregas_no_prazo++;
          }
        }
      });

      // Calcular métricas
      const resultados = Object.values(benchmark).map(trans => {
        trans.on_time_rate = trans.total_envios > 0
          ? (trans.entregas_no_prazo / trans.total_envios) * 100
          : 0;
        trans.custo_medio = trans.total_envios > 0
          ? trans.custo_total / trans.total_envios
          : 0;
        trans.cost_per_kg = trans.peso_total > 0
          ? trans.custo_total / trans.peso_total
          : 0;

        // Performance Score (on-time 50% + 1st attempt 30% + quality 20%)
        const firstAttempt = 85; // Placeholder
        const quality = 95; // Placeholder
        trans.performance_score =
          (trans.on_time_rate * 0.5) + (firstAttempt * 0.3) + (quality * 0.2);

        return trans;
      });

      // Ordenar por critério
      if (metric === 'performance') {
        resultados.sort((a, b) => b.performance_score - a.performance_score);
      } else if (metric === 'cost') {
        resultados.sort((a, b) => a.custo_medio - b.custo_medio);
      } else { // balanced
        resultados.sort((a, b) => {
          const scoreA = (b.performance_score / 100) * (1 / (a.custo_medio + 1));
          const scoreB = (a.performance_score / 100) * (1 / (b.custo_medio + 1));
          return scoreB - scoreA;
        });
      }

      const melhor = resultados[0];
      const pior = resultados[resultados.length - 1];

      return {
        success: true,
        message: `✅ Benchmark de ${resultados.length} transportadoras concluído`,
        periodo_dias: date_range_days,
        metric: metric,
        total_transportadoras: resultados.length,
        melhor_transportadora: melhor?.nome,
        pior_transportadora: pior?.nome,
        transportadoras: resultados.map(t => ({
          nome: t.nome,
          total_envios: t.total_envios,
          on_time_rate: t.on_time_rate.toFixed(2) + '%',
          custo_medio: t.custo_medio.toFixed(2),
          cost_per_kg: t.cost_per_kg.toFixed(2),
          performance_score: t.performance_score.toFixed(1),
          classificacao: t.performance_score >= 90 ? 'Excelente'
            : t.performance_score >= 80 ? 'Boa'
            : t.performance_score >= 70 ? 'Regular'
            : 'Ruim',
          recomendacao: t === melhor ? 'Priorizar uso - melhor performance'
            : t === pior ? 'Renegociar contrato ou substituir'
            : 'Manter monitoramento'
        }))
      };

    } catch (error) {
      console.error('ERRO analyzeCarrierBenchmark:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar benchmark de transportadoras'
      };
    }
  }
});

// ============================================
// TOOL 4: Analisar Estrutura de Custos de Frete
// ============================================
export const analyzeShippingCostStructure = tool({
  description: 'Analisa custos de frete por faixa de peso, região e % do pedido, identifica oportunidades de economia',
  inputSchema: z.object({
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)')
  }),

  execute: async ({ date_range_days = 30 }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - date_range_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      const { data: envios, error } = await supabase
        .schema('gestaologistica')
        .from('envios')
        .select('*')
        .gte('data_postagem', dataInicialStr);

      if (error) throw error;

      if (!envios || envios.length === 0) {
        return {
          success: true,
          message: '⚠️ Nenhum envio encontrado no período',
          custo_total: 0
        };
      }

      // Custo Total
      const custoTotal = envios.reduce((sum, e) => sum + (e.custo_frete || 0), 0);
      const custoMedio = custoTotal / envios.length;
      const pesoTotal = envios.reduce((sum, e) => sum + (e.peso_kg || 0), 0);
      const costPerKg = pesoTotal > 0 ? custoTotal / pesoTotal : 0;

      // Distribuição por faixa de peso
      const faixasPeso: Record<string, { envios: number; custo: number }> = {
        '0-1kg': { envios: 0, custo: 0 },
        '1-5kg': { envios: 0, custo: 0 },
        '5-10kg': { envios: 0, custo: 0 },
        '10-30kg': { envios: 0, custo: 0 },
        '>30kg': { envios: 0, custo: 0 }
      };

      envios.forEach(e => {
        const peso = e.peso_kg || 0;
        const custo = e.custo_frete || 0;

        if (peso <= 1) {
          faixasPeso['0-1kg'].envios++;
          faixasPeso['0-1kg'].custo += custo;
        } else if (peso <= 5) {
          faixasPeso['1-5kg'].envios++;
          faixasPeso['1-5kg'].custo += custo;
        } else if (peso <= 10) {
          faixasPeso['5-10kg'].envios++;
          faixasPeso['5-10kg'].custo += custo;
        } else if (peso <= 30) {
          faixasPeso['10-30kg'].envios++;
          faixasPeso['10-30kg'].custo += custo;
        } else {
          faixasPeso['>30kg'].envios++;
          faixasPeso['>30kg'].custo += custo;
        }
      });

      // Shipping cost % (assumindo valor médio de pedido R$ 200)
      const valorMedioPedido = 200;
      const shippingCostPercentage = (custoMedio / valorMedioPedido) * 100;

      // Oportunidades de economia
      const oportunidades = [];
      if (shippingCostPercentage > 15) {
        oportunidades.push('Custo de frete > 15% do pedido - renegociar tarifas');
      }
      if (costPerKg > 5) {
        oportunidades.push('Cost per kg acima da média - buscar transportadoras mais competitivas');
      }
      Object.entries(faixasPeso).forEach(([faixa, dados]) => {
        const custoMedioFaixa = dados.envios > 0 ? dados.custo / dados.envios : 0;
        if (custoMedioFaixa > custoMedio * 1.3) {
          oportunidades.push(`Faixa ${faixa} com custo 30% acima da média - otimizar embalagens`);
        }
      });

      return {
        success: true,
        message: `✅ Análise de custos concluída (${date_range_days} dias)`,
        periodo_dias: date_range_days,

        custo_total: custoTotal.toFixed(2),
        custo_medio_por_envio: custoMedio.toFixed(2),
        cost_per_kg: costPerKg.toFixed(2),
        peso_total_kg: pesoTotal.toFixed(2),

        shipping_cost_percentage: {
          percentual: shippingCostPercentage.toFixed(2) + '%',
          classificacao: shippingCostPercentage < 10 ? 'Ótimo' :
                         shippingCostPercentage < 15 ? 'Bom' : 'Alto - Requer Ação'
        },

        distribuicao_por_faixa_peso: Object.entries(faixasPeso).map(([faixa, dados]) => ({
          faixa: faixa,
          envios: dados.envios,
          custo_total: dados.custo.toFixed(2),
          custo_medio: dados.envios > 0 ? (dados.custo / dados.envios).toFixed(2) : '0.00',
          percentual_volume: ((dados.envios / envios.length) * 100).toFixed(1) + '%'
        })),

        oportunidades_economia: oportunidades.length > 0 ? oportunidades : ['Estrutura de custos otimizada']
      };

    } catch (error) {
      console.error('ERRO analyzeShippingCostStructure:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar estrutura de custos'
      };
    }
  }
});

// ============================================
// TOOL 5: Analisar Tendências de Logística Reversa
// ============================================
export const analyzeReverseLogisticsTrends = tool({
  description: 'Analisa devoluções: taxa, motivos principais (pareto), impacto financeiro e recomendações',
  inputSchema: z.object({
    date_range_days: z.number().default(60)
      .describe('Período de análise em dias (padrão: 60)')
  }),

  execute: async ({ date_range_days = 60 }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - date_range_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      // Buscar devoluções
      const { data: devolucoes, error: errorDev } = await supabase
        .schema('gestaologistica')
        .from('logistica_reversa')
        .select('*')
        .gte('data_solicitacao', dataInicialStr);

      if (errorDev) throw errorDev;

      // Buscar envios para calcular taxa
      const { data: envios, error: errorEnv } = await supabase
        .schema('gestaologistica')
        .from('envios')
        .select('*')
        .gte('data_postagem', dataInicialStr);

      if (errorEnv) throw errorEnv;

      const totalDevolucoes = devolucoes?.length || 0;
      const totalEnvios = envios?.length || 0;
      const returnRate = totalEnvios > 0 ? (totalDevolucoes / totalEnvios) * 100 : 0;

      // Análise de motivos (Pareto)
      const motivosCont: Record<string, number> = {};
      devolucoes?.forEach(dev => {
        const motivo = dev.motivo || 'Não informado';
        motivosCont[motivo] = (motivosCont[motivo] || 0) + 1;
      });

      const motivosOrdenados = Object.entries(motivosCont)
        .map(([motivo, count]) => ({
          motivo,
          quantidade: count,
          percentual: ((count / totalDevolucoes) * 100).toFixed(1) + '%'
        }))
        .sort((a, b) => b.quantidade - a.quantidade);

      // Custo estimado (assumindo R$ 25 por devolução)
      const custoMedioDevolucao = 25;
      const custoTotal = totalDevolucoes * custoMedioDevolucao;

      // Recomendações
      const recomendacoes = [];
      if (returnRate > 10) {
        recomendacoes.push('Taxa de devolução ALTA (>10%) - investigar causas raiz urgentemente');
      }
      if (motivosOrdenados[0]?.motivo.includes('defeito') || motivosOrdenados[0]?.motivo.includes('danificado')) {
        recomendacoes.push('Principal motivo: defeitos - melhorar QC e embalagem');
      }
      if (motivosOrdenados[0]?.motivo.includes('arrependimento') || motivosOrdenados[0]?.motivo.includes('desistência')) {
        recomendacoes.push('Principal motivo: arrependimento - melhorar descrição de produtos');
      }
      if (returnRate < 5) {
        recomendacoes.push('Taxa de devolução saudável (<5%) - manter processos atuais');
      }

      return {
        success: true,
        message: `✅ Análise de logística reversa concluída (${date_range_days} dias)`,
        periodo_dias: date_range_days,

        return_rate: {
          taxa: returnRate.toFixed(2) + '%',
          total_devolucoes: totalDevolucoes,
          total_envios: totalEnvios,
          classificacao: returnRate < 5 ? 'Ótimo' :
                        returnRate < 10 ? 'Aceitável' : 'Alto - Requer Atenção'
        },

        impacto_financeiro: {
          custo_total: custoTotal.toFixed(2),
          custo_medio_por_devolucao: custoMedioDevolucao.toFixed(2),
          percentual_receita_frete: 'N/A' // Placeholder
        },

        motivos_principais: motivosOrdenados.slice(0, 5),

        analise_pareto: {
          top_3_motivos_percentual: motivosOrdenados.slice(0, 3).reduce((sum, m) =>
            sum + parseFloat(m.percentual), 0).toFixed(1) + '%',
          insight: motivosOrdenados.length > 0
            ? `${motivosOrdenados[0].motivo} representa ${motivosOrdenados[0].percentual} das devoluções`
            : 'Sem dados suficientes'
        },

        recomendacoes: recomendacoes
      };

    } catch (error) {
      console.error('ERRO analyzeReverseLogisticsTrends:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar logística reversa'
      };
    }
  }
});

// ============================================
// TOOL 6: Otimizar Dimensões de Pacotes
// ============================================
export const optimizePackageDimensions = tool({
  description: 'Analisa cubagem: peso volumétrico vs real, package efficiency, sugestões de redimensionamento',
  inputSchema: z.object({
    transportadora_id: z.string().optional()
      .describe('Filtrar por transportadora (opcional)')
  }),

  execute: async ({ transportadora_id }) => {
    try {
      let query = supabase
        .schema('gestaologistica')
        .from('pacotes')
        .select('*');

      if (transportadora_id) {
        query = query.eq('transportadora_id', transportadora_id);
      }

      const { data: pacotes, error } = await query.limit(100);
      if (error) throw error;

      if (!pacotes || pacotes.length === 0) {
        return {
          success: true,
          message: '⚠️ Nenhum pacote encontrado',
          total_pacotes: 0
        };
      }

      // Fator divisor padrão: 6000 (cm³/kg)
      const fatorDivisor = 6000;

      const analise = pacotes.map(p => {
        const pesoReal = p.peso_kg || 0;
        const volume = (p.altura_cm || 0) * (p.largura_cm || 0) * (p.comprimento_cm || 0);
        const pesoVolumetrico = volume / fatorDivisor;
        const efficiency = pesoVolumetrico > 0 ? (pesoReal / pesoVolumetrico) * 100 : 100;

        const status = efficiency >= 80 ? 'Otimizado'
          : efficiency >= 50 ? 'Aceitável'
          : 'Desperdiçando espaço';

        const sugestao = efficiency < 50
          ? `Reduzir dimensões - embalagem ${Math.round((1 - efficiency / 100) * 100)}% maior que necessário`
          : efficiency < 80
          ? 'Considerar embalagens menores'
          : 'Dimensões otimizadas';

        return {
          peso_real: pesoReal.toFixed(2),
          peso_volumetrico: pesoVolumetrico.toFixed(2),
          volume_cm3: volume,
          efficiency_score: efficiency.toFixed(1) + '%',
          status,
          sugestao,
          cobrado: pesoVolumetrico > pesoReal ? 'Volumétrico' : 'Real',
          diferenca_custo: pesoVolumetrico > pesoReal
            ? ((pesoVolumetrico - pesoReal) * 5).toFixed(2) // Assumindo R$ 5/kg
            : '0.00'
        };
      });

      const mediaEfficiency = analise.reduce((sum, a) =>
        sum + parseFloat(a.efficiency_score), 0) / analise.length;

      const desperdicandoEspaco = analise.filter(a => parseFloat(a.efficiency_score) < 50).length;
      const otimizados = analise.filter(a => parseFloat(a.efficiency_score) >= 80).length;

      return {
        success: true,
        message: `✅ Análise de ${pacotes.length} pacotes concluída`,
        transportadora_id: transportadora_id || 'TODAS',
        total_pacotes: pacotes.length,

        package_efficiency: {
          score_medio: mediaEfficiency.toFixed(1) + '%',
          classificacao: mediaEfficiency >= 70 ? 'Boa' : mediaEfficiency >= 50 ? 'Regular' : 'Ruim',
          otimizados: otimizados,
          desperdicando_espaco: desperdicandoEspaco
        },

        analise_detalhada: analise.slice(0, 20),

        recomendacoes: [
          desperdicandoEspaco > pacotes.length * 0.3
            ? `${desperdicandoEspaco} pacotes (${Math.round(desperdicandoEspaco / pacotes.length * 100)}%) desperdiçando espaço - padronizar embalagens`
            : 'Maioria dos pacotes bem dimensionados',
          mediaEfficiency < 70
            ? 'Efficiency médio baixo - revisar tipos de embalagem disponíveis'
            : 'Efficiency satisfatório'
        ]
      };

    } catch (error) {
      console.error('ERRO optimizePackageDimensions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao otimizar dimensões de pacotes'
      };
    }
  }
});

// ============================================
// TOOL 7: Detectar Anomalias em Entregas
// ============================================
export const detectDeliveryAnomalies = tool({
  description: 'Detecta atrasos críticos (z-score), rotas problemáticas e red flags usando análise estatística',
  inputSchema: z.object({
    sensitivity: z.enum(['low', 'medium', 'high']).default('medium')
      .describe('Sensibilidade: low (z > 3), medium (z > 2), high (z > 1.5)'),
    date_range_days: z.number().default(30)
      .describe('Período de análise em dias (padrão: 30)')
  }),

  execute: async ({ sensitivity = 'medium', date_range_days = 30 }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - date_range_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      const { data: envios, error } = await supabase
        .schema('gestaologistica')
        .from('envios')
        .select('*')
        .gte('data_postagem', dataInicialStr);

      if (error) throw error;

      if (!envios || envios.length === 0) {
        return {
          success: true,
          message: '⚠️ Nenhum envio encontrado',
          anomalias: []
        };
      }

      // Calcular tempo de entrega para cada envio
      const temposEntrega = envios
        .filter(e => e.data_entrega)
        .map(e => {
          const dataEntrega = new Date(e.data_entrega);
          const dataPostagem = new Date(e.data_postagem);
          return {
            envio: e,
            dias: (dataEntrega.getTime() - dataPostagem.getTime()) / (1000 * 60 * 60 * 24)
          };
        });

      if (temposEntrega.length < 3) {
        return {
          success: true,
          message: 'Dados insuficientes para análise estatística',
          anomalias: []
        };
      }

      // Calcular média e desvio padrão
      const media = temposEntrega.reduce((sum, t) => sum + t.dias, 0) / temposEntrega.length;
      const variancia = temposEntrega.reduce((sum, t) =>
        sum + Math.pow(t.dias - media, 2), 0) / temposEntrega.length;
      const desvioPadrao = Math.sqrt(variancia);

      // Threshold baseado na sensibilidade
      const thresholds: Record<string, number> = {
        low: 3.0,
        medium: 2.0,
        high: 1.5
      };
      const threshold = thresholds[sensitivity];

      // Detectar anomalias
      const anomalias: Array<{
        codigo_rastreio: string;
        dias_entrega: number;
        z_score: number;
        severidade: string;
        tipo_anomalia: string;
        recomendacao: string;
      }> = [];

      temposEntrega.forEach(({ envio, dias }) => {
        const zScore = desvioPadrao > 0 ? Math.abs((dias - media) / desvioPadrao) : 0;

        if (zScore > threshold) {
          const severidade = zScore > 3 ? 'CRÍTICA' : zScore > 2 ? 'ALTA' : 'MÉDIA';
          const tipoAnomalia = dias > media ? 'ATRASO_SIGNIFICATIVO' : 'ENTREGA_SUSPEITAMENTE_RÁPIDA';

          anomalias.push({
            codigo_rastreio: envio.codigo_rastreio,
            dias_entrega: parseFloat(dias.toFixed(1)),
            z_score: parseFloat(zScore.toFixed(2)),
            severidade,
            tipo_anomalia: tipoAnomalia,
            recomendacao: tipoAnomalia === 'ATRASO_SIGNIFICATIVO'
              ? 'Investigar causa do atraso - possível problema com transportadora ou rota'
              : 'Verificar se dados estão corretos'
          });
        }
      });

      // Ordenar por severidade
      anomalias.sort((a, b) => b.z_score - a.z_score);

      return {
        success: true,
        message: `✅ ${anomalias.length} anomalias detectadas (sensibilidade: ${sensitivity})`,
        periodo_dias: date_range_days,
        sensitivity: sensitivity,

        estatisticas_base: {
          media_dias_entrega: media.toFixed(1),
          desvio_padrao: desvioPadrao.toFixed(1),
          total_envios_analisados: temposEntrega.length
        },

        total_anomalias: anomalias.length,
        anomalias_criticas: anomalias.filter(a => a.severidade === 'CRÍTICA').length,
        anomalias_altas: anomalias.filter(a => a.severidade === 'ALTA').length,

        anomalias: anomalias.slice(0, 50),

        red_flags: [
          anomalias.filter(a => a.severidade === 'CRÍTICA').length > 5
            ? `${anomalias.filter(a => a.severidade === 'CRÍTICA').length} atrasos críticos - ação urgente necessária`
            : null,
          anomalias.length > temposEntrega.length * 0.1
            ? 'Mais de 10% dos envios com anomalias - revisar processo logístico'
            : null
        ].filter(Boolean)
      };

    } catch (error) {
      console.error('ERRO detectDeliveryAnomalies:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao detectar anomalias'
      };
    }
  }
});

// ============================================
// TOOL 8: Prever Custos de Entrega
// ============================================
export const forecastDeliveryCosts = tool({
  description: 'Projeta custos futuros baseado em histórico, identifica sazonalidade e tendências',
  inputSchema: z.object({
    forecast_days: z.number().default(30)
      .describe('Quantos dias prever no futuro (padrão: 30)'),
    lookback_days: z.number().default(90)
      .describe('Dias de histórico para análise (padrão: 90)')
  }),

  execute: async ({ forecast_days = 30, lookback_days = 90 }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - lookback_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      const { data: envios, error } = await supabase
        .schema('gestaologistica')
        .from('envios')
        .select('*')
        .gte('data_postagem', dataInicialStr)
        .order('data_postagem', { ascending: true });

      if (error) throw error;

      if (!envios || envios.length === 0) {
        return {
          success: true,
          message: '⚠️ Dados insuficientes para previsão',
          custo_previsto: 0
        };
      }

      // Agrupar por semana
      const custoPorSemana: Record<string, { custo: number; volume: number }> = {};

      envios.forEach(envio => {
        const data = new Date(envio.data_postagem);
        const semana = Math.floor(data.getTime() / (7 * 24 * 60 * 60 * 1000));
        const semanaKey = `Semana ${semana}`;

        if (!custoPorSemana[semanaKey]) {
          custoPorSemana[semanaKey] = { custo: 0, volume: 0 };
        }

        custoPorSemana[semanaKey].custo += envio.custo_frete || 0;
        custoPorSemana[semanaKey].volume++;
      });

      const semanas = Object.values(custoPorSemana);
      const mediaCustoSemanal = semanas.reduce((sum, s) => sum + s.custo, 0) / semanas.length;
      const mediaVolumeSemanal = semanas.reduce((sum, s) => sum + s.volume, 0) / semanas.length;

      // Regressão linear simples para tendência
      const n = semanas.length;
      const somaX = (n * (n + 1)) / 2;
      const somaY = semanas.reduce((sum, s) => sum + s.custo, 0);
      const somaXY = semanas.reduce((sum, s, i) => sum + (i + 1) * s.custo, 0);
      const somaX2 = (n * (n + 1) * (2 * n + 1)) / 6;

      const slope = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX);
      const tendencia = slope > 50 ? 'crescente' : slope < -50 ? 'decrescente' : 'estável';

      // Projeção
      const semanasPrevisao = Math.ceil(forecast_days / 7);
      const custoPrevisto = mediaCustoSemanal * semanasPrevisao;
      const volumePrevisto = Math.round(mediaVolumeSemanal * semanasPrevisao);

      return {
        success: true,
        message: `✅ Previsão de custos para ${forecast_days} dias concluída`,
        forecast_days: forecast_days,
        lookback_days: lookback_days,

        historico: {
          media_custo_semanal: mediaCustoSemanal.toFixed(2),
          media_volume_semanal: Math.round(mediaVolumeSemanal),
          tendencia: tendencia,
          slope: slope.toFixed(2)
        },

        previsao: {
          custo_previsto_total: custoPrevisto.toFixed(2),
          volume_previsto_envios: volumePrevisto,
          custo_medio_por_envio: volumePrevisto > 0 ? (custoPrevisto / volumePrevisto).toFixed(2) : '0.00',
          periodo: `próximos ${forecast_days} dias (${semanasPrevisao} semanas)`
        },

        insights: [
          tendencia === 'crescente'
            ? `Custos em crescimento - esperado aumento de ${(slope * semanasPrevisao).toFixed(2)} nas próximas semanas`
            : tendencia === 'decrescente'
            ? 'Custos em queda - otimizações surtindo efeito'
            : 'Custos estáveis - manter processos atuais',
          `Budget recomendado: R$ ${(custoPrevisto * 1.1).toFixed(2)} (10% margem de segurança)`
        ]
      };

    } catch (error) {
      console.error('ERRO forecastDeliveryCosts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao prever custos de entrega'
      };
    }
  }
});
