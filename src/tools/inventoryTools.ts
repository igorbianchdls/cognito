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

// ============================================
// TOOL 2: Calcular Métricas de Inventário
// ============================================
export const calculateInventoryMetrics = tool({
  description: 'Calcula KPIs de inventário: turnover, cobertura, stockout rate, classificação ABC e valor imobilizado',
  inputSchema: z.object({
    product_id: z.string().optional()
      .describe('ID do produto específico (opcional - se não fornecido, calcula para todos)'),
    date_range_days: z.number().default(90)
      .describe('Período de análise em dias (padrão: 90 dias)'),
    metrics: z.array(z.enum(['turnover', 'coverage', 'stockout_rate', 'abc_class', 'valor_imobilizado']))
      .default(['turnover', 'coverage', 'stockout_rate', 'valor_imobilizado'])
      .describe('Métricas a calcular')
  }),

  execute: async ({ product_id, date_range_days = 90, metrics = ['turnover', 'coverage', 'stockout_rate', 'valor_imobilizado'] }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - date_range_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      // Buscar movimentações do período
      let queryMovimentacoes = supabase
        .schema('gestaoestoque')
        .from('movimentacoes_estoque')
        .select('*')
        .gte('created_at', dataInicialStr);

      if (product_id) {
        queryMovimentacoes = queryMovimentacoes.eq('product_id', product_id);
      }

      const { data: movimentacoes, error: errorMov } = await queryMovimentacoes;
      if (errorMov) throw errorMov;

      // Buscar estoque atual
      let queryEstoque = supabase
        .schema('gestaoestoque')
        .from('estoque_canal')
        .select('*');

      if (product_id) {
        queryEstoque = queryEstoque.eq('product_id', product_id);
      }

      const { data: estoqueAtual, error: errorEst } = await queryEstoque;
      if (errorEst) throw errorEst;

      // Calcular métricas
      const resultados: Record<string, unknown> = {};

      // TURNOVER (Giro de Estoque)
      if (metrics.includes('turnover')) {
        const saidas = movimentacoes?.filter(m => m.type === 'saida').reduce((sum, m) => sum + (m.quantity || 0), 0) || 0;
        const estoqueTotal = estoqueAtual?.reduce((sum, e) => sum + (e.quantity_available || 0), 0) || 1;
        const turnoverAnual = (saidas / estoqueTotal) * (365 / date_range_days);

        resultados.turnover = {
          ratio: turnoverAnual.toFixed(2),
          classificacao: turnoverAnual > 8 ? 'Alto (Excelente)' : turnoverAnual > 4 ? 'Médio (Bom)' : turnoverAnual > 2 ? 'Baixo (Atenção)' : 'Muito Baixo (Crítico)',
          saidas_periodo: saidas,
          estoque_medio: estoqueTotal
        };
      }

      // COVERAGE (Cobertura de Estoque em dias)
      if (metrics.includes('coverage')) {
        const saidas = movimentacoes?.filter(m => m.type === 'saida').reduce((sum, m) => sum + (m.quantity || 0), 0) || 0;
        const mediaDiaria = saidas / date_range_days;
        const estoqueTotal = estoqueAtual?.reduce((sum, e) => sum + (e.quantity_available || 0), 0) || 0;
        const diasCobertura = mediaDiaria > 0 ? estoqueTotal / mediaDiaria : 999;

        resultados.coverage = {
          dias: diasCobertura.toFixed(1),
          classificacao: diasCobertura < 30 ? 'Crítico (Risco de Ruptura)' : diasCobertura < 60 ? 'Baixo' : diasCobertura < 120 ? 'Ideal' : 'Excesso (Capital Imobilizado)',
          estoque_atual: estoqueTotal,
          demanda_diaria: mediaDiaria.toFixed(2)
        };
      }

      // STOCKOUT RATE (Taxa de Ruptura)
      if (metrics.includes('stockout_rate')) {
        const totalItens = estoqueAtual?.length || 0;
        const itensEsgotados = estoqueAtual?.filter(e => (e.quantity_available || 0) === 0).length || 0;
        const taxaRuptura = totalItens > 0 ? (itensEsgotados / totalItens) * 100 : 0;

        resultados.stockout_rate = {
          percentual: taxaRuptura.toFixed(2) + '%',
          classificacao: taxaRuptura < 5 ? 'Excelente' : taxaRuptura < 10 ? 'Bom' : taxaRuptura < 20 ? 'Atenção' : 'Crítico',
          itens_esgotados: itensEsgotados,
          total_itens: totalItens
        };
      }

      // VALOR IMOBILIZADO
      if (metrics.includes('valor_imobilizado')) {
        const valorTotal = estoqueAtual?.reduce((sum, e) => {
          const quantidade = e.quantity_available || 0;
          const valorUnitario = e.unit_cost || 0;
          return sum + (quantidade * valorUnitario);
        }, 0) || 0;

        resultados.valor_imobilizado = {
          total: valorTotal.toFixed(2),
          moeda: 'BRL',
          itens_computados: estoqueAtual?.length || 0,
          observacao: valorTotal > 100000 ? 'Alto capital imobilizado - avaliar oportunidades de redução' : 'Dentro do esperado'
        };
      }

      return {
        success: true,
        message: `✅ Métricas calculadas para período de ${date_range_days} dias`,
        product_id: product_id || 'TODOS',
        periodo_dias: date_range_days,
        data_inicial: dataInicialStr,
        metricas: resultados
      };

    } catch (error) {
      console.error('ERRO calculateInventoryMetrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao calcular métricas de inventário'
      };
    }
  }
});

// ============================================
// TOOL 3: Analisar Tendências de Movimentação
// ============================================
export const analyzeStockMovementTrends = tool({
  description: 'Analisa tendências e padrões de movimentação de estoque, identifica sazonalidade e prevê demanda futura',
  inputSchema: z.object({
    product_id: z.string().optional()
      .describe('ID do produto (opcional - se não fornecido, analisa todos)'),
    period: z.enum(['daily', 'weekly', 'monthly']).default('weekly')
      .describe('Período de agrupamento da análise'),
    lookback_days: z.number().default(90)
      .describe('Quantos dias analisar no histórico (padrão: 90)')
  }),

  execute: async ({ product_id, period = 'weekly', lookback_days = 90 }) => {
    try {
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - lookback_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      let query = supabase
        .schema('gestaoestoque')
        .from('movimentacoes_estoque')
        .select('*')
        .gte('created_at', dataInicialStr)
        .order('created_at', { ascending: true });

      if (product_id) {
        query = query.eq('product_id', product_id);
      }

      const { data: movimentacoes, error } = await query;
      if (error) throw error;

      if (!movimentacoes || movimentacoes.length === 0) {
        return {
          success: true,
          message: '⚠️ Nenhuma movimentação encontrada no período',
          tendencia: 'sem_dados'
        };
      }

      // Agrupar por período
      const grupos: Record<string, { entradas: number; saidas: number; ajustes: number }> = {};

      movimentacoes.forEach(mov => {
        const data = new Date(mov.created_at);
        let chave = '';

        if (period === 'daily') {
          chave = data.toISOString().split('T')[0];
        } else if (period === 'weekly') {
          const semana = Math.floor(data.getTime() / (7 * 24 * 60 * 60 * 1000));
          chave = `Semana ${semana}`;
        } else {
          chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!grupos[chave]) {
          grupos[chave] = { entradas: 0, saidas: 0, ajustes: 0 };
        }

        if (mov.type === 'entrada') grupos[chave].entradas += mov.quantity || 0;
        else if (mov.type === 'saida') grupos[chave].saidas += mov.quantity || 0;
        else if (mov.type === 'ajuste') grupos[chave].ajustes += mov.quantity || 0;
      });

      // Calcular tendência (regressão linear simples das saídas)
      const periodos = Object.keys(grupos);
      const saidas = periodos.map(p => grupos[p].saidas);

      const n = saidas.length;
      const somaX = (n * (n + 1)) / 2;
      const somaY = saidas.reduce((a, b) => a + b, 0);
      const somaXY = saidas.reduce((sum, y, i) => sum + (i + 1) * y, 0);
      const somaX2 = (n * (n + 1) * (2 * n + 1)) / 6;

      const slope = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX);
      const tendencia = slope > 0.5 ? 'crescente' : slope < -0.5 ? 'decrescente' : 'estável';

      // Média de movimentações
      const mediaSaidas = somaY / n;

      return {
        success: true,
        message: `✅ Análise de tendências concluída (${lookback_days} dias)`,
        product_id: product_id || 'TODOS',
        periodo_analise: period,
        dias_analisados: lookback_days,
        tendencia: tendencia,
        slope_tendencia: slope.toFixed(4),
        media_saidas_por_periodo: mediaSaidas.toFixed(2),
        total_periodos: periodos.length,
        movimentacoes_por_periodo: grupos,
        previsao_proximo_periodo: (mediaSaidas + slope).toFixed(2),
        insights: tendencia === 'crescente'
          ? 'Demanda em crescimento - considerar aumentar níveis de estoque'
          : tendencia === 'decrescente'
          ? 'Demanda em queda - considerar reduzir reposição'
          : 'Demanda estável - manter níveis atuais'
      };

    } catch (error) {
      console.error('ERRO analyzeStockMovementTrends:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao analisar tendências de movimentação'
      };
    }
  }
});

// ============================================
// TOOL 4: Prever Necessidades de Reposição
// ============================================
export const forecastRestockNeeds = tool({
  description: 'Prevê necessidades de reposição baseado em histórico de movimentações e estima data de ruptura',
  inputSchema: z.object({
    forecast_days: z.number().default(30)
      .describe('Quantos dias prever no futuro (padrão: 30)'),
    confidence_level: z.enum(['baixo', 'medio', 'alto']).default('medio')
      .describe('Nível de confiança da previsão (afeta margem de segurança)')
  }),

  execute: async ({ forecast_days = 30, confidence_level = 'medio' }) => {
    try {
      // Buscar estoque atual
      const { data: estoqueAtual, error: errorEstoque } = await supabase
        .schema('gestaoestoque')
        .from('estoque_canal')
        .select('*');

      if (errorEstoque) throw errorEstoque;

      // Buscar movimentações dos últimos 60 dias para calcular média de consumo
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - 60);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      const { data: movimentacoes, error: errorMov } = await supabase
        .schema('gestaoestoque')
        .from('movimentacoes_estoque')
        .select('*')
        .eq('type', 'saida')
        .gte('created_at', dataInicialStr);

      if (errorMov) throw errorMov;

      // Agrupar movimentações por produto
      const consumoPorProduto: Record<string, number[]> = {};
      movimentacoes?.forEach(mov => {
        if (!consumoPorProduto[mov.product_id]) {
          consumoPorProduto[mov.product_id] = [];
        }
        consumoPorProduto[mov.product_id].push(mov.quantity || 0);
      });

      // Calcular previsões por produto
      const previsoes = estoqueAtual?.map(estoque => {
        const consumo = consumoPorProduto[estoque.product_id] || [];
        const consumoMedio = consumo.length > 0
          ? consumo.reduce((a, b) => a + b, 0) / consumo.length
          : 0;

        const consumoDiario = consumoMedio / 60; // Média diária

        // Margem de segurança baseada no nível de confiança
        const margem = confidence_level === 'alto' ? 1.5 : confidence_level === 'medio' ? 1.2 : 1.0;
        const consumoPrevisto = consumoDiario * forecast_days * margem;

        const estoqueDisponivel = estoque.quantity_available || 0;
        const diasAteRuptura = consumoDiario > 0 ? estoqueDisponivel / consumoDiario : 999;

        const necessitaReposicao = diasAteRuptura < forecast_days;
        const quantidadeSugerida = necessitaReposicao
          ? Math.ceil(consumoPrevisto - estoqueDisponivel)
          : 0;

        const urgencia = diasAteRuptura < 7 ? 'CRÍTICO'
          : diasAteRuptura < 15 ? 'ALTO'
          : diasAteRuptura < 30 ? 'MÉDIO'
          : 'BAIXO';

        return {
          product_id: estoque.product_id,
          channel_id: estoque.channel_id,
          estoque_atual: estoqueDisponivel,
          consumo_diario_medio: consumoDiario.toFixed(2),
          dias_ate_ruptura: diasAteRuptura.toFixed(1),
          necessita_reposicao: necessitaReposicao,
          quantidade_sugerida: quantidadeSugerida,
          urgencia: urgencia,
          data_ruptura_estimada: diasAteRuptura < 999
            ? new Date(Date.now() + diasAteRuptura * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : 'Sem previsão de ruptura'
        };
      }).filter(p => p.necessita_reposicao) || [];

      // Ordenar por urgência
      previsoes.sort((a, b) => {
        const ordem: Record<string, number> = { 'CRÍTICO': 0, 'ALTO': 1, 'MÉDIO': 2, 'BAIXO': 3 };
        return ordem[a.urgencia] - ordem[b.urgencia];
      });

      return {
        success: true,
        message: `✅ Previsão de reposição calculada para ${forecast_days} dias`,
        forecast_days: forecast_days,
        confidence_level: confidence_level,
        produtos_com_necessidade_reposicao: previsoes.length,
        criticos: previsoes.filter(p => p.urgencia === 'CRÍTICO').length,
        previsoes: previsoes.slice(0, 50) // Limitar a 50 produtos
      };

    } catch (error) {
      console.error('ERRO forecastRestockNeeds:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao prever necessidades de reposição'
      };
    }
  }
});

// ============================================
// TOOL 5: Identificar Itens de Baixo Giro
// ============================================
export const identifySlowMovingItems = tool({
  description: 'Identifica produtos com baixo giro (slow-moving) ou sem movimentação (dead stock)',
  inputSchema: z.object({
    min_days_no_movement: z.number().default(90)
      .describe('Dias mínimos sem movimentação para considerar slow-moving (padrão: 90)'),
    min_stock_value: z.number().default(0)
      .describe('Valor mínimo em estoque para alertar (evita alertas de itens de baixo valor)')
  }),

  execute: async ({ min_days_no_movement = 90, min_stock_value = 0 }) => {
    try {
      // Buscar estoque atual
      const { data: estoqueAtual, error: errorEstoque } = await supabase
        .schema('gestaoestoque')
        .from('estoque_canal')
        .select('*');

      if (errorEstoque) throw errorEstoque;

      // Buscar última movimentação de cada produto
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - min_days_no_movement);
      const dataLimiteStr = dataLimite.toISOString().split('T')[0];

      const { data: movimentacoesRecentes, error: errorMov } = await supabase
        .schema('gestaoestoque')
        .from('movimentacoes_estoque')
        .select('product_id, created_at')
        .gte('created_at', dataLimiteStr)
        .order('created_at', { ascending: false });

      if (errorMov) throw errorMov;

      // Criar set de produtos com movimentação recente
      const produtosAtivos = new Set(movimentacoesRecentes?.map(m => m.product_id) || []);

      // Identificar slow-moving items
      const slowMovingItems = estoqueAtual?.filter(estoque => {
        const estoqueDisponivel = estoque.quantity_available || 0;
        const valorEstoque = estoqueDisponivel * (estoque.unit_cost || 0);
        const temMovimentacao = produtosAtivos.has(estoque.product_id);

        return !temMovimentacao &&
               estoqueDisponivel > 0 &&
               valorEstoque >= min_stock_value;
      }).map(estoque => {
        const estoqueDisponivel = estoque.quantity_available || 0;
        const valorUnitario = estoque.unit_cost || 0;
        const valorTotal = estoqueDisponivel * valorUnitario;

        return {
          product_id: estoque.product_id,
          channel_id: estoque.channel_id,
          quantidade_estoque: estoqueDisponivel,
          valor_unitario: valorUnitario.toFixed(2),
          valor_total_imobilizado: valorTotal.toFixed(2),
          dias_sem_movimentacao: `>${min_days_no_movement}`,
          recomendacao: valorTotal > 5000
            ? 'Liquidar urgentemente - alto valor imobilizado'
            : valorTotal > 1000
            ? 'Promover ou devolver ao fornecedor'
            : 'Descontinuar ou baixar estoque'
        };
      }) || [];

      // Calcular valor total imobilizado
      const valorTotalImobilizado = slowMovingItems.reduce((sum, item) =>
        sum + parseFloat(item.valor_total_imobilizado), 0
      );

      return {
        success: true,
        message: `✅ ${slowMovingItems.length} itens de baixo giro identificados`,
        criterio_dias: min_days_no_movement,
        valor_minimo_filtro: min_stock_value,
        total_slow_moving_items: slowMovingItems.length,
        valor_total_imobilizado: valorTotalImobilizado.toFixed(2),
        slow_moving_items: slowMovingItems.slice(0, 100) // Limitar a 100 itens
      };

    } catch (error) {
      console.error('ERRO identifySlowMovingItems:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao identificar itens de baixo giro'
      };
    }
  }
});

// ============================================
// TOOL 6: Comparar Performance entre Canais
// ============================================
export const compareChannelPerformance = tool({
  description: 'Compara performance de vendas e níveis de estoque entre diferentes canais',
  inputSchema: z.object({
    product_id: z.string().optional()
      .describe('ID do produto específico (opcional)'),
    metric: z.enum(['stock_level', 'turnover', 'price_variance']).default('stock_level')
      .describe('Métrica para comparar entre canais')
  }),

  execute: async ({ product_id, metric = 'stock_level' }) => {
    try {
      // Buscar estoque por canal
      let queryEstoque = supabase
        .schema('gestaoestoque')
        .from('estoque_canal')
        .select('*');

      if (product_id) {
        queryEstoque = queryEstoque.eq('product_id', product_id);
      }

      const { data: estoqueCanais, error: errorEstoque } = await queryEstoque;
      if (errorEstoque) throw errorEstoque;

      // Buscar preços por canal
      let queryPrecos = supabase
        .schema('gestaoestoque')
        .from('precos_canais')
        .select('*');

      if (product_id) {
        queryPrecos = queryPrecos.eq('product_id', product_id);
      }

      const { data: precosCanais, error: errorPrecos } = await queryPrecos;
      if (errorPrecos) throw errorPrecos;

      // Buscar movimentações dos últimos 30 dias
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - 30);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      let queryMov = supabase
        .schema('gestaoestoque')
        .from('movimentacoes_estoque')
        .select('*')
        .gte('created_at', dataInicialStr);

      if (product_id) {
        queryMov = queryMov.eq('product_id', product_id);
      }

      const { data: movimentacoes, error: errorMov } = await queryMov;
      if (errorMov) throw errorMov;

      // Agrupar por canal
      const canais: Record<string, {
        channel_id: string;
        total_estoque: number;
        valor_estoque: number;
        produtos: number;
        saidas_30d: number;
        precos?: Array<{ product_id: string; preco: number }>;
      }> = {};

      estoqueCanais?.forEach(estoque => {
        const channelId = estoque.channel_id;
        if (!canais[channelId]) {
          canais[channelId] = {
            channel_id: channelId,
            total_estoque: 0,
            valor_estoque: 0,
            produtos: 0,
            saidas_30d: 0
          };
        }

        canais[channelId].total_estoque += estoque.quantity_available || 0;
        canais[channelId].valor_estoque += (estoque.quantity_available || 0) * (estoque.unit_cost || 0);
        canais[channelId].produtos += 1;
      });

      // Adicionar movimentações por canal
      movimentacoes?.forEach(mov => {
        // Nota: movimentacoes_estoque não tem channel_id, vamos assumir distribuição uniforme
        Object.keys(canais).forEach(channelId => {
          if (mov.type === 'saida') {
            canais[channelId].saidas_30d += (mov.quantity || 0) / Object.keys(canais).length;
          }
        });
      });

      // Adicionar preços
      precosCanais?.forEach(preco => {
        const channelId = preco.channel_id;
        if (canais[channelId]) {
          if (!canais[channelId].precos) {
            canais[channelId].precos = [];
          }
          canais[channelId].precos.push({
            product_id: preco.product_id,
            preco: preco.price
          });
        }
      });

      // Calcular métricas por canal
      const resultados = Object.values(canais).map(canal => {
        const turnover = canal.total_estoque > 0
          ? (canal.saidas_30d / canal.total_estoque * 12).toFixed(2)
          : '0.00';

        const precoMedio = canal.precos && canal.precos.length > 0
          ? canal.precos.reduce((sum, p) => sum + (p.preco || 0), 0) / canal.precos.length
          : 0;

        return {
          ...canal,
          turnover_anual: turnover,
          preco_medio: precoMedio.toFixed(2),
          valor_estoque: canal.valor_estoque.toFixed(2)
        };
      });

      // Ordenar pelo metric escolhido
      if (metric === 'stock_level') {
        resultados.sort((a, b) => b.total_estoque - a.total_estoque);
      } else if (metric === 'turnover') {
        resultados.sort((a, b) => parseFloat(b.turnover_anual) - parseFloat(a.turnover_anual));
      } else if (metric === 'price_variance') {
        resultados.sort((a, b) => parseFloat(b.preco_medio) - parseFloat(a.preco_medio));
      }

      const melhorCanal = resultados[0]?.channel_id || 'N/A';
      const piorCanal = resultados[resultados.length - 1]?.channel_id || 'N/A';

      return {
        success: true,
        message: `✅ Comparação de performance entre ${resultados.length} canais`,
        metric: metric,
        product_id: product_id || 'TODOS',
        melhor_canal: melhorCanal,
        pior_canal: piorCanal,
        canais: resultados
      };

    } catch (error) {
      console.error('ERRO compareChannelPerformance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao comparar performance entre canais'
      };
    }
  }
});

// ============================================
// TOOL 7: Gerar Análise ABC
// ============================================
export const generateABCAnalysis = tool({
  description: 'Classifica produtos em categorias ABC baseado em valor (Curva de Pareto)',
  inputSchema: z.object({
    criteria: z.enum(['value', 'quantity', 'margin']).default('value')
      .describe('Critério para classificação ABC'),
    period_days: z.number().default(90)
      .describe('Período de análise em dias (padrão: 90)')
  }),

  execute: async ({ criteria = 'value', period_days = 90 }) => {
    try {
      // Buscar estoque atual
      const { data: estoqueAtual, error: errorEstoque } = await supabase
        .schema('gestaoestoque')
        .from('estoque_canal')
        .select('*');

      if (errorEstoque) throw errorEstoque;

      // Buscar movimentações do período
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - period_days);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      const { data: movimentacoes, error: errorMov } = await supabase
        .schema('gestaoestoque')
        .from('movimentacoes_estoque')
        .select('*')
        .gte('created_at', dataInicialStr);

      if (errorMov) throw errorMov;

      // Calcular valor/quantidade por produto
      const produtosAgrupados: Record<string, { valor: number; quantidade: number; margem: number }> = {};

      estoqueAtual?.forEach(estoque => {
        const productId = estoque.product_id;
        if (!produtosAgrupados[productId]) {
          produtosAgrupados[productId] = { valor: 0, quantidade: 0, margem: 0 };
        }

        const quantidade = estoque.quantity_available || 0;
        const custo = estoque.unit_cost || 0;
        const valor = quantidade * custo;

        produtosAgrupados[productId].valor += valor;
        produtosAgrupados[productId].quantidade += quantidade;
      });

      // Adicionar movimentações (vendas)
      movimentacoes?.forEach(mov => {
        if (mov.type === 'saida') {
          const productId = mov.product_id;
          if (!produtosAgrupados[productId]) {
            produtosAgrupados[productId] = { valor: 0, quantidade: 0, margem: 0 };
          }
          // Aproximação: assumir margem de 30% nas vendas
          produtosAgrupados[productId].margem += (mov.quantity || 0) * 0.3;
        }
      });

      // Criar array e ordenar pelo critério escolhido
      const produtos = Object.entries(produtosAgrupados).map(([productId, dados]) => ({
        product_id: productId,
        valor: dados.valor,
        quantidade: dados.quantidade,
        margem: dados.margem
      }));

      if (criteria === 'value') {
        produtos.sort((a, b) => b.valor - a.valor);
      } else if (criteria === 'quantity') {
        produtos.sort((a, b) => b.quantidade - a.quantidade);
      } else {
        produtos.sort((a, b) => b.margem - a.margem);
      }

      // Calcular percentual acumulado
      const valorTotal = produtos.reduce((sum, p) => {
        const val = criteria === 'value' ? p.valor : criteria === 'quantity' ? p.quantidade : p.margem;
        return sum + val;
      }, 0);
      let acumulado = 0;

      const produtosComClasse = produtos.map(produto => {
        const val = criteria === 'value' ? produto.valor : criteria === 'quantity' ? produto.quantidade : produto.margem;
        acumulado += val;
        const percentualAcumulado = (acumulado / valorTotal) * 100;

        const classe = percentualAcumulado <= 80 ? 'A'
          : percentualAcumulado <= 95 ? 'B'
          : 'C';

        return {
          ...produto,
          percentual_acumulado: percentualAcumulado.toFixed(2),
          classe_abc: classe
        };
      });

      // Estatísticas por classe
      const classeA = produtosComClasse.filter(p => p.classe_abc === 'A');
      const classeB = produtosComClasse.filter(p => p.classe_abc === 'B');
      const classeC = produtosComClasse.filter(p => p.classe_abc === 'C');

      return {
        success: true,
        message: `✅ Análise ABC concluída (critério: ${criteria})`,
        criteria: criteria,
        period_days: period_days,
        total_produtos: produtos.length,
        distribuicao: {
          classe_a: {
            produtos: classeA.length,
            percentual_produtos: ((classeA.length / produtos.length) * 100).toFixed(2) + '%',
            contribuicao_valor: '~80%',
            recomendacao: 'Controle rigoroso - monitoramento diário'
          },
          classe_b: {
            produtos: classeB.length,
            percentual_produtos: ((classeB.length / produtos.length) * 100).toFixed(2) + '%',
            contribuicao_valor: '~15%',
            recomendacao: 'Controle moderado - revisão semanal'
          },
          classe_c: {
            produtos: classeC.length,
            percentual_produtos: ((classeC.length / produtos.length) * 100).toFixed(2) + '%',
            contribuicao_valor: '~5%',
            recomendacao: 'Controle simples - revisão mensal'
          }
        },
        produtos_classificados: produtosComClasse.slice(0, 100) // Limitar a 100
      };

    } catch (error) {
      console.error('ERRO generateABCAnalysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao gerar análise ABC'
      };
    }
  }
});

// ============================================
// TOOL 8: Detectar Anomalias
// ============================================
export const detectAnomalies = tool({
  description: 'Detecta anomalias e movimentações suspeitas no estoque (picos, quedas abruptas, discrepâncias)',
  inputSchema: z.object({
    sensitivity: z.enum(['low', 'medium', 'high']).default('medium')
      .describe('Sensibilidade de detecção de anomalias (low = apenas anomalias óbvias, high = mais sensível)')
  }),

  execute: async ({ sensitivity = 'medium' }) => {
    try {
      // Buscar movimentações dos últimos 30 dias
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - 30);
      const dataInicialStr = dataInicial.toISOString().split('T')[0];

      const { data: movimentacoes, error: errorMov } = await supabase
        .schema('gestaoestoque')
        .from('movimentacoes_estoque')
        .select('*')
        .gte('created_at', dataInicialStr)
        .order('created_at', { ascending: true });

      if (errorMov) throw errorMov;

      // Buscar estoque atual
      const { data: estoqueAtual, error: errorEstoque } = await supabase
        .schema('gestaoestoque')
        .from('estoque_canal')
        .select('*');

      if (errorEstoque) throw errorEstoque;

      // Definir threshold baseado na sensibilidade
      const thresholds: Record<string, number> = {
        low: 3.0,    // 3x desvio padrão
        medium: 2.0, // 2x desvio padrão
        high: 1.5    // 1.5x desvio padrão
      };
      const threshold = thresholds[sensitivity];

      // Agrupar movimentações por produto
      const movPorProduto: Record<string, number[]> = {};
      movimentacoes?.forEach(mov => {
        if (!movPorProduto[mov.product_id]) {
          movPorProduto[mov.product_id] = [];
        }
        movPorProduto[mov.product_id].push(mov.quantity || 0);
      });

      // Detectar anomalias
      const anomalias: Array<{
        product_id: string;
        tipo_anomalia: string;
        quantidade_anomala?: number;
        media_esperada?: string;
        desvio_padrao?: string;
        z_score?: string;
        severidade: string;
        recomendacao: string;
        max_estoque?: number;
        min_estoque?: number;
        diferenca?: number;
      }> = [];

      Object.entries(movPorProduto).forEach(([productId, quantidades]) => {
        if (quantidades.length < 3) return; // Precisa de pelo menos 3 movimentações

        const media = quantidades.reduce((a, b) => a + b, 0) / quantidades.length;
        const variancia = quantidades.reduce((sum, q) => sum + Math.pow(q - media, 2), 0) / quantidades.length;
        const desvioPadrao = Math.sqrt(variancia);

        quantidades.forEach((quantidade) => {
          const zScore = desvioPadrao > 0 ? Math.abs((quantidade - media) / desvioPadrao) : 0;

          if (zScore > threshold) {
            anomalias.push({
              product_id: productId,
              tipo_anomalia: quantidade > media ? 'PICO_MOVIMENTACAO' : 'QUEDA_ABRUPTA',
              quantidade_anomala: quantidade,
              media_esperada: media.toFixed(2),
              desvio_padrao: desvioPadrao.toFixed(2),
              z_score: zScore.toFixed(2),
              severidade: zScore > 3 ? 'ALTA' : zScore > 2 ? 'MÉDIA' : 'BAIXA',
              recomendacao: quantidade > media
                ? 'Verificar se houve venda em lote ou erro de lançamento'
                : 'Verificar possível extravio ou erro de sistema'
            });
          }
        });
      });

      // Detectar discrepâncias entre canais (mesmo produto, estoque muito diferente)
      const estoquePorProduto: Record<string, number[]> = {};
      estoqueAtual?.forEach(estoque => {
        const productId = estoque.product_id;
        if (!estoquePorProduto[productId]) {
          estoquePorProduto[productId] = [];
        }
        estoquePorProduto[productId].push(estoque.quantity_available || 0);
      });

      Object.entries(estoquePorProduto).forEach(([productId, quantidades]) => {
        if (quantidades.length < 2) return; // Precisa estar em pelo menos 2 canais

        const max = Math.max(...quantidades);
        const min = Math.min(...quantidades);
        const media = quantidades.reduce((a, b) => a + b, 0) / quantidades.length;

        // Se diferença for > 80% da média, pode ser discrepância
        if (max - min > media * 0.8) {
          anomalias.push({
            product_id: productId,
            tipo_anomalia: 'DISCREPANCIA_ENTRE_CANAIS',
            max_estoque: max,
            min_estoque: min,
            diferenca: max - min,
            severidade: 'MÉDIA',
            recomendacao: 'Verificar redistribuição de estoque entre canais ou erro de sincronização'
          });
        }
      });

      return {
        success: true,
        message: `✅ ${anomalias.length} anomalias detectadas (sensibilidade: ${sensitivity})`,
        sensitivity: sensitivity,
        total_anomalias: anomalias.length,
        anomalias_alta_severidade: anomalias.filter(a => a.severidade === 'ALTA').length,
        anomalias: anomalias.slice(0, 50) // Limitar a 50
      };

    } catch (error) {
      console.error('ERRO detectAnomalies:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao detectar anomalias'
      };
    }
  }
});
