import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getEcommerceSalesData = tool({
  description: 'Busca dados de vendas e-commerce (canais, cupons, clientes, pedidos, produtos, devoluções)',
  inputSchema: z.object({
    table: z.enum([
      'channels',
      'coupons',
      'customers',
      'loyalty_points',
      'loyalty_rewards',
      'order_items',
      'orders',
      'payments',
      'products',
      'returns'
    ]).describe('Tabela a consultar'),
    limit: z.number().default(20).describe('Número máximo de resultados'),

    // Filtros específicos
    is_active: z.boolean().optional()
      .describe('Filtrar por status ativo (para channels)'),
    status: z.string().optional()
      .describe('Filtrar por status (para orders, returns, payments)'),
    customer_id: z.string().optional()
      .describe('Filtrar por ID do cliente (para orders, payments, loyalty_points)'),
    channel_id: z.string().optional()
      .describe('Filtrar por ID do canal (para orders)'),
    product_id: z.string().optional()
      .describe('Filtrar por ID do produto (para order_items)'),
    order_id: z.string().optional()
      .describe('Filtrar por ID do pedido (para order_items, payments, returns)'),

    // Filtros de valor
    valor_minimo: z.number().optional()
      .describe('Valor mínimo (para orders, payments)'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo (para orders, payments)'),

    // Filtros de data
    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),
  }),

  execute: async ({
    table,
    limit,
    is_active,
    status,
    customer_id,
    channel_id,
    product_id,
    order_id,
    valor_minimo,
    valor_maximo,
    data_de,
    data_ate
  }) => {
    try {
      let query = supabase
        .schema('vendasecommerce')
        .from(table)
        .select('*');

      // FILTRO 1: Status ativo (para channels)
      if (is_active !== undefined && table === 'channels') {
        query = query.eq('is_active', is_active);
      }

      // FILTRO 2: Status (para orders, returns, payments)
      if (status && (table === 'orders' || table === 'returns' || table === 'payments')) {
        query = query.eq('status', status);
      }

      // FILTRO 3: Customer ID
      if (customer_id && (table === 'orders' || table === 'payments' || table === 'loyalty_points')) {
        query = query.eq('customer_id', customer_id);
      }

      // FILTRO 4: Channel ID
      if (channel_id && table === 'orders') {
        query = query.eq('channel_id', channel_id);
      }

      // FILTRO 5: Product ID
      if (product_id && table === 'order_items') {
        query = query.eq('product_id', product_id);
      }

      // FILTRO 6: Order ID
      if (order_id && (table === 'order_items' || table === 'payments' || table === 'returns')) {
        query = query.eq('order_id', order_id);
      }

      // FILTRO 7: Valor mínimo
      if (valor_minimo !== undefined && (table === 'orders' || table === 'payments')) {
        const valueColumn = table === 'orders' ? 'total_value' : 'amount';
        query = query.gte(valueColumn, valor_minimo);
      }

      // FILTRO 8: Valor máximo
      if (valor_maximo !== undefined && (table === 'orders' || table === 'payments')) {
        const valueColumn = table === 'orders' ? 'total_value' : 'amount';
        query = query.lte(valueColumn, valor_maximo);
      }

      // FILTRO 9: Range de datas
      if (data_de) {
        let dateColumn = 'criado_em';
        if (table === 'orders') dateColumn = 'order_date';
        else if (table === 'payments') dateColumn = 'payment_date';
        else if (table === 'returns') dateColumn = 'return_date';
        else if (table === 'loyalty_points') dateColumn = 'earned_date';

        query = query.gte(dateColumn, data_de);
      }

      if (data_ate) {
        let dateColumn = 'criado_em';
        if (table === 'orders') dateColumn = 'order_date';
        else if (table === 'payments') dateColumn = 'payment_date';
        else if (table === 'returns') dateColumn = 'return_date';
        else if (table === 'loyalty_points') dateColumn = 'earned_date';

        query = query.lte(dateColumn, data_ate);
      }

      // Ordenação dinâmica por tabela
      let orderColumn = 'criado_em';
      const ascending = false;

      if (table === 'orders') {
        orderColumn = 'order_date';
      } else if (table === 'payments') {
        orderColumn = 'payment_date';
      } else if (table === 'returns') {
        orderColumn = 'return_date';
      } else if (table === 'loyalty_points') {
        orderColumn = 'earned_date';
      } else if (table === 'order_items') {
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
      console.error('ERRO getEcommerceSalesData:', error);
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

export const getRevenueMetrics = tool({
  description: 'Calcula métricas de receita do e-commerce: AOV (ticket médio), receita total, número de pedidos, taxa de crescimento. Use quando precisar analisar performance financeira de vendas.',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final (formato YYYY-MM-DD)'),
    comparar_com_periodo_anterior: z.boolean().default(false)
      .describe('Calcular crescimento comparando com período anterior de mesma duração'),
    channel_id: z.string().optional()
      .describe('Filtrar por canal específico'),
  }),

  execute: async ({ data_de, data_ate, comparar_com_periodo_anterior, channel_id }) => {
    try {
      let queryAtual = supabase
        .schema('vendasecommerce')
        .from('orders')
        .select('*')
        .gte('criado_em', data_de)
        .lte('criado_em', data_ate)
        .in('status', ['completed', 'processing']);

      if (channel_id) {
        queryAtual = queryAtual.eq('channel_id', channel_id);
      }

      const { data: pedidosAtuais, error: errorAtual } = await queryAtual;
      if (errorAtual) throw errorAtual;

      const pedidos = pedidosAtuais || [];
      const numPedidos = pedidos.length;
      const receitaTotal = pedidos.reduce((sum, p) => sum + (p.total || 0), 0);
      const aov = numPedidos > 0 ? receitaTotal / numPedidos : 0;
      const descontoTotal = pedidos.reduce((sum, p) => sum + (p.discount || 0), 0);
      const freteTotal = pedidos.reduce((sum, p) => sum + (p.shipping_cost || 0), 0);

      const metricas = {
        periodo: { data_de, data_ate },
        receita_total: receitaTotal,
        numero_pedidos: numPedidos,
        aov: aov,
        desconto_total: descontoTotal,
        frete_total: freteTotal,
        receita_liquida: receitaTotal - descontoTotal,
        comparacao: undefined as {
          periodo_anterior: { data_de: string; data_ate: string };
          receita_anterior: number;
          pedidos_anterior: number;
          aov_anterior: number;
          crescimento_receita_percentual: number;
          crescimento_pedidos_percentual: number;
          crescimento_aov_percentual: number;
        } | undefined
      };

      if (comparar_com_periodo_anterior && numPedidos > 0) {
        const diasPeriodo = Math.ceil((new Date(data_ate).getTime() - new Date(data_de).getTime()) / (1000 * 60 * 60 * 24));
        const dataAnteriorDe = new Date(new Date(data_de).getTime() - diasPeriodo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const dataAnteriorAte = new Date(new Date(data_de).getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        let queryAnterior = supabase
          .schema('vendasecommerce')
          .from('orders')
          .select('*')
          .gte('criado_em', dataAnteriorDe)
          .lte('criado_em', dataAnteriorAte)
          .in('status', ['completed', 'processing']);

        if (channel_id) {
          queryAnterior = queryAnterior.eq('channel_id', channel_id);
        }

        const { data: pedidosAnteriores, error: errorAnterior } = await queryAnterior;
        if (!errorAnterior && pedidosAnteriores) {
          const numPedidosAnt = pedidosAnteriores.length;
          const receitaTotalAnt = pedidosAnteriores.reduce((sum, p) => sum + (p.total || 0), 0);
          const aovAnt = numPedidosAnt > 0 ? receitaTotalAnt / numPedidosAnt : 0;

          metricas.comparacao = {
            periodo_anterior: { data_de: dataAnteriorDe, data_ate: dataAnteriorAte },
            receita_anterior: receitaTotalAnt,
            pedidos_anterior: numPedidosAnt,
            aov_anterior: aovAnt,
            crescimento_receita_percentual: receitaTotalAnt > 0 ? ((receitaTotal - receitaTotalAnt) / receitaTotalAnt) * 100 : 0,
            crescimento_pedidos_percentual: numPedidosAnt > 0 ? ((numPedidos - numPedidosAnt) / numPedidosAnt) * 100 : 0,
            crescimento_aov_percentual: aovAnt > 0 ? ((aov - aovAnt) / aovAnt) * 100 : 0,
          };
        }
      }

      return {
        success: true,
        message: `✅ Métricas de receita calculadas: AOV R$ ${aov.toFixed(2)} | ${numPedidos} pedidos | Receita R$ ${receitaTotal.toFixed(2)}`,
        data: metricas
      };

    } catch (error) {
      console.error('ERRO getRevenueMetrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao calcular métricas de receita`,
        data: null
      };
    }
  }
});

export const getCustomerMetrics = tool({
  description: 'Calcula métricas de clientes: LTV (lifetime value), taxa de recompra, segmentação de clientes (novos vs recorrentes), top clientes. Use para análise de retenção e valor do cliente.',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial para análise (formato YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final para análise (formato YYYY-MM-DD)'),
    top_clientes_limit: z.number().default(10).describe('Número de top clientes a retornar'),
  }),

  execute: async ({ data_de, data_ate, top_clientes_limit }) => {
    try {
      const { data: clientes, error: errorClientes } = await supabase
        .schema('vendasecommerce')
        .from('customers')
        .select('*');

      if (errorClientes) throw errorClientes;

      const { data: pedidos, error: errorPedidos } = await supabase
        .schema('vendasecommerce')
        .from('orders')
        .select('*')
        .gte('criado_em', data_de)
        .lte('criado_em', data_ate)
        .in('status', ['completed', 'processing']);

      if (errorPedidos) throw errorPedidos;

      const { data: pedidosHistoricos, error: errorHistorico } = await supabase
        .schema('vendasecommerce')
        .from('orders')
        .select('*')
        .in('status', ['completed', 'processing']);

      if (errorHistorico) throw errorHistorico;

      const totalClientes = (clientes || []).length;
      const pedidosDoPeriodo = pedidos || [];
      const todosOsPedidos = pedidosHistoricos || [];

      const metricasPorCliente = new Map();

      todosOsPedidos.forEach(pedido => {
        const customerId = pedido.customer_id;
        if (!metricasPorCliente.has(customerId)) {
          metricasPorCliente.set(customerId, {
            customer_id: customerId,
            total_pedidos: 0,
            total_gasto: 0,
            primeiro_pedido: pedido.criado_em,
            ultimo_pedido: pedido.criado_em,
          });
        }
        const metricas = metricasPorCliente.get(customerId);
        metricas.total_pedidos += 1;
        metricas.total_gasto += pedido.total || 0;
        if (new Date(pedido.criado_em) < new Date(metricas.primeiro_pedido)) {
          metricas.primeiro_pedido = pedido.criado_em;
        }
        if (new Date(pedido.criado_em) > new Date(metricas.ultimo_pedido)) {
          metricas.ultimo_pedido = pedido.criado_em;
        }
      });

      const valoresLTV = Array.from(metricasPorCliente.values()).map(m => m.total_gasto);
      const ltvMedio = valoresLTV.length > 0 ? valoresLTV.reduce((sum, v) => sum + v, 0) / valoresLTV.length : 0;

      const clientesComRecompra = Array.from(metricasPorCliente.values()).filter(m => m.total_pedidos > 1).length;
      const taxaRecompra = totalClientes > 0 ? (clientesComRecompra / totalClientes) * 100 : 0;

      const clientesDoPeriodo = new Set(pedidosDoPeriodo.map(p => p.customer_id));
      let novosClientes = 0;
      let clientesRecorrentes = 0;

      clientesDoPeriodo.forEach(customerId => {
        const metricas = metricasPorCliente.get(customerId);
        if (metricas) {
          const primeiroPedidoNoPeriodo = new Date(metricas.primeiro_pedido) >= new Date(data_de) &&
                                          new Date(metricas.primeiro_pedido) <= new Date(data_ate);
          if (primeiroPedidoNoPeriodo) {
            novosClientes++;
          } else {
            clientesRecorrentes++;
          }
        }
      });

      const topClientes = Array.from(metricasPorCliente.entries())
        .map(([customer_id, metricas]) => ({
          customer_id,
          ...metricas,
        }))
        .sort((a, b) => b.total_gasto - a.total_gasto)
        .slice(0, top_clientes_limit);

      return {
        success: true,
        message: `✅ Métricas de clientes calculadas: LTV médio R$ ${ltvMedio.toFixed(2)} | Taxa de recompra ${taxaRecompra.toFixed(1)}%`,
        data: {
          periodo: { data_de, data_ate },
          total_clientes: totalClientes,
          ltv_medio: ltvMedio,
          taxa_recompra_percentual: taxaRecompra,
          clientes_com_recompra: clientesComRecompra,
          segmentacao_periodo: {
            novos_clientes: novosClientes,
            clientes_recorrentes: clientesRecorrentes,
            total_clientes_periodo: novosClientes + clientesRecorrentes,
          },
          top_clientes: topClientes,
        }
      };

    } catch (error) {
      console.error('ERRO getCustomerMetrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao calcular métricas de clientes`,
        data: null
      };
    }
  }
});

export const getProductPerformance = tool({
  description: 'Analisa performance de produtos: best-sellers, produtos com baixo sell-through, análise de margem, taxa de devolução por produto. Use para otimizar mix de produtos e pricing.',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial para análise (formato YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final para análise (formato YYYY-MM-DD)'),
    top_products_limit: z.number().default(10).describe('Número de top produtos a retornar'),
    categoria: z.string().optional().describe('Filtrar por categoria específica'),
  }),

  execute: async ({ data_de, data_ate, top_products_limit, categoria }) => {
    try {
      let queryProdutos = supabase
        .schema('vendasecommerce')
        .from('products')
        .select('*');

      if (categoria) {
        queryProdutos = queryProdutos.eq('category', categoria);
      }

      const { data: produtos, error: errorProdutos } = await queryProdutos;
      if (errorProdutos) throw errorProdutos;

      const { data: orderItems, error: errorItems } = await supabase
        .schema('vendasecommerce')
        .from('order_items')
        .select('*')
        .gte('criado_em', data_de)
        .lte('criado_em', data_ate);

      if (errorItems) throw errorItems;

      const metricasPorProduto = new Map();

      (produtos || []).forEach(produto => {
        metricasPorProduto.set(produto.id, {
          product_id: produto.id,
          name: produto.name,
          sku: produto.sku,
          category: produto.category,
          price: produto.price || 0,
          cost: produto.cost || 0,
          stock_quantity: produto.stock_quantity || 0,
          unidades_vendidas: 0,
          receita_total: 0,
          margem_percentual: 0,
          sell_through_rate: 0,
          devolucoes: 0,
        });
      });

      (orderItems || []).forEach(item => {
        const produtoId = item.product_id;
        if (metricasPorProduto.has(produtoId)) {
          const metricas = metricasPorProduto.get(produtoId);
          metricas.unidades_vendidas += item.quantity || 0;
          metricas.receita_total += item.total || 0;
        }
      });

      metricasPorProduto.forEach((metricas, produtoId) => {
        const produto = (produtos || []).find(p => p.id === produtoId);
        if (produto) {
          if (produto.price && produto.price > 0) {
            metricas.margem_percentual = ((produto.price - (produto.cost || 0)) / produto.price) * 100;
          }

          const totalDisponivel = metricas.unidades_vendidas + (produto.stock_quantity || 0);
          if (totalDisponivel > 0) {
            metricas.sell_through_rate = (metricas.unidades_vendidas / totalDisponivel) * 100;
          }
        }
      });

      const topProdutos = Array.from(metricasPorProduto.values())
        .filter(m => m.unidades_vendidas > 0)
        .sort((a, b) => b.receita_total - a.receita_total)
        .slice(0, top_products_limit);

      const produtosBaixoSellThrough = Array.from(metricasPorProduto.values())
        .filter(m => m.sell_through_rate > 0 && m.sell_through_rate < 50)
        .sort((a, b) => a.sell_through_rate - b.sell_through_rate)
        .slice(0, 10);

      const produtosComVendas = Array.from(metricasPorProduto.values()).filter(m => m.unidades_vendidas > 0);
      const margemMedia = produtosComVendas.length > 0
        ? produtosComVendas.reduce((sum, m) => sum + m.margem_percentual, 0) / produtosComVendas.length
        : 0;

      const receitaTotal = produtosComVendas.reduce((sum, m) => sum + m.receita_total, 0);
      const unidadesTotais = produtosComVendas.reduce((sum, m) => sum + m.unidades_vendidas, 0);

      return {
        success: true,
        message: `✅ Performance de produtos analisada: ${unidadesTotais} unidades vendidas | Margem média ${margemMedia.toFixed(1)}%`,
        data: {
          periodo: { data_de, data_ate },
          resumo: {
            total_produtos: (produtos || []).length,
            produtos_com_vendas: produtosComVendas.length,
            unidades_vendidas_total: unidadesTotais,
            receita_total: receitaTotal,
            margem_media_percentual: margemMedia,
          },
          top_produtos_por_receita: topProdutos,
          produtos_baixo_sell_through: produtosBaixoSellThrough,
        }
      };

    } catch (error) {
      console.error('ERRO getProductPerformance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao analisar performance de produtos`,
        data: null
      };
    }
  }
});

export const getCouponEffectiveness = tool({
  description: 'Analisa efetividade de cupons/promoções: cupons mais usados, impacto no AOV, ROI de campanhas, taxa de uso. Use para otimizar estratégias promocionais.',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial para análise (formato YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final para análise (formato YYYY-MM-DD)'),
  }),

  execute: async ({ data_de, data_ate }) => {
    try {
      const { data: cupons, error: errorCupons } = await supabase
        .schema('vendasecommerce')
        .from('coupons')
        .select('*')
        .lte('start_date', data_ate)
        .gte('end_date', data_de);

      if (errorCupons) throw errorCupons;

      const { data: pedidosComCupom, error: errorComCupom } = await supabase
        .schema('vendasecommerce')
        .from('orders')
        .select('*')
        .gte('criado_em', data_de)
        .lte('criado_em', data_ate)
        .not('coupon_id', 'is', null)
        .in('status', ['completed', 'processing']);

      if (errorComCupom) throw errorComCupom;

      const { data: pedidosSemCupom, error: errorSemCupom } = await supabase
        .schema('vendasecommerce')
        .from('orders')
        .select('*')
        .gte('criado_em', data_de)
        .lte('criado_em', data_ate)
        .is('coupon_id', null)
        .in('status', ['completed', 'processing']);

      if (errorSemCupom) throw errorSemCupom;

      const totalPedidos = (pedidosComCupom || []).length + (pedidosSemCupom || []).length;
      const pedidosComCupomList = pedidosComCupom || [];
      const pedidosSemCupomList = pedidosSemCupom || [];

      const taxaUsoCupons = totalPedidos > 0 ? (pedidosComCupomList.length / totalPedidos) * 100 : 0;

      const receitaComCupom = pedidosComCupomList.reduce((sum, p) => sum + (p.total || 0), 0);
      const receitaSemCupom = pedidosSemCupomList.reduce((sum, p) => sum + (p.total || 0), 0);
      const descontoTotal = pedidosComCupomList.reduce((sum, p) => sum + (p.discount || 0), 0);

      const aovComCupom = pedidosComCupomList.length > 0 ? receitaComCupom / pedidosComCupomList.length : 0;
      const aovSemCupom = pedidosSemCupomList.length > 0 ? receitaSemCupom / pedidosSemCupomList.length : 0;

      const impactoAOV = aovSemCupom > 0 ? ((aovComCupom - aovSemCupom) / aovSemCupom) * 100 : 0;

      const metricasPorCupom = new Map();

      pedidosComCupomList.forEach(pedido => {
        const cupomId = pedido.coupon_id;
        if (!metricasPorCupom.has(cupomId)) {
          metricasPorCupom.set(cupomId, {
            coupon_id: cupomId,
            vezes_usado: 0,
            receita_gerada: 0,
            desconto_concedido: 0,
            aov: 0,
          });
        }
        const metricas = metricasPorCupom.get(cupomId);
        metricas.vezes_usado += 1;
        metricas.receita_gerada += pedido.total || 0;
        metricas.desconto_concedido += pedido.discount || 0;
      });

      metricasPorCupom.forEach((metricas, cupomId) => {
        metricas.aov = metricas.vezes_usado > 0 ? metricas.receita_gerada / metricas.vezes_usado : 0;

        const cupom = (cupons || []).find(c => c.id === cupomId);
        if (cupom) {
          metricas.coupon_code = cupom.code;
          metricas.coupon_type = cupom.type;
          metricas.coupon_value = cupom.value;
        }
      });

      const topCuponsPorUso = Array.from(metricasPorCupom.values())
        .sort((a, b) => b.vezes_usado - a.vezes_usado)
        .slice(0, 10);

      const topCuponsPorReceita = Array.from(metricasPorCupom.values())
        .sort((a, b) => b.receita_gerada - a.receita_gerada)
        .slice(0, 10);

      const roiMedio = descontoTotal > 0 ? ((receitaComCupom - descontoTotal) / descontoTotal) * 100 : 0;

      return {
        success: true,
        message: `✅ Efetividade de cupons analisada: ${pedidosComCupomList.length} pedidos com cupom (${taxaUsoCupons.toFixed(1)}%)`,
        data: {
          periodo: { data_de, data_ate },
          resumo: {
            total_pedidos: totalPedidos,
            pedidos_com_cupom: pedidosComCupomList.length,
            pedidos_sem_cupom: pedidosSemCupomList.length,
            taxa_uso_cupons_percentual: taxaUsoCupons,
            receita_com_cupom: receitaComCupom,
            receita_sem_cupom: receitaSemCupom,
            desconto_total_concedido: descontoTotal,
            aov_com_cupom: aovComCupom,
            aov_sem_cupom: aovSemCupom,
            impacto_aov_percentual: impactoAOV,
            roi_medio_percentual: roiMedio,
          },
          top_cupons_por_uso: topCuponsPorUso,
          top_cupons_por_receita: topCuponsPorReceita,
        }
      };

    } catch (error) {
      console.error('ERRO getCouponEffectiveness:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao analisar efetividade de cupons`,
        data: null
      };
    }
  }
});

export const getChannelAnalysis = tool({
  description: 'Analisa performance de canais de venda: receita por canal, AOV por canal, taxa de conversão, distribuição de vendas. Use para otimizar mix de canais e alocação de recursos.',
  inputSchema: z.object({
    data_de: z.string().describe('Data inicial para análise (formato YYYY-MM-DD)'),
    data_ate: z.string().describe('Data final para análise (formato YYYY-MM-DD)'),
  }),

  execute: async ({ data_de, data_ate }) => {
    try {
      const { data: canais, error: errorCanais } = await supabase
        .schema('vendasecommerce')
        .from('channels')
        .select('*')
        .eq('is_active', true);

      if (errorCanais) throw errorCanais;

      const { data: pedidos, error: errorPedidos } = await supabase
        .schema('vendasecommerce')
        .from('orders')
        .select('*')
        .gte('criado_em', data_de)
        .lte('criado_em', data_ate)
        .in('status', ['completed', 'processing']);

      if (errorPedidos) throw errorPedidos;

      const pedidosList = pedidos || [];
      const canaisList = canais || [];

      const metricasPorCanal = new Map();

      canaisList.forEach(canal => {
        metricasPorCanal.set(canal.id, {
          channel_id: canal.id,
          channel_name: canal.name,
          channel_type: canal.type,
          numero_pedidos: 0,
          receita_total: 0,
          aov: 0,
          desconto_total: 0,
          frete_total: 0,
        });
      });

      pedidosList.forEach(pedido => {
        const canalId = pedido.channel_id;
        if (metricasPorCanal.has(canalId)) {
          const metricas = metricasPorCanal.get(canalId);
          metricas.numero_pedidos += 1;
          metricas.receita_total += pedido.total || 0;
          metricas.desconto_total += pedido.discount || 0;
          metricas.frete_total += pedido.shipping_cost || 0;
        }
      });

      metricasPorCanal.forEach(metricas => {
        metricas.aov = metricas.numero_pedidos > 0 ? metricas.receita_total / metricas.numero_pedidos : 0;
      });

      const canaisOrdenados = Array.from(metricasPorCanal.values())
        .sort((a, b) => b.receita_total - a.receita_total);

      const receitaTotal = canaisOrdenados.reduce((sum, c) => sum + c.receita_total, 0);
      const pedidosTotais = canaisOrdenados.reduce((sum, c) => sum + c.numero_pedidos, 0);

      const distribuicao = canaisOrdenados.map(canal => ({
        ...canal,
        percentual_receita: receitaTotal > 0 ? (canal.receita_total / receitaTotal) * 100 : 0,
        percentual_pedidos: pedidosTotais > 0 ? (canal.numero_pedidos / pedidosTotais) * 100 : 0,
      }));

      const melhorCanal = canaisOrdenados.length > 0 ? canaisOrdenados[0] : null;
      const piorCanal = canaisOrdenados.length > 0 ? canaisOrdenados[canaisOrdenados.length - 1] : null;

      return {
        success: true,
        message: `✅ Análise de canais concluída: ${canaisList.length} canais | Receita total R$ ${receitaTotal.toFixed(2)}`,
        data: {
          periodo: { data_de, data_ate },
          resumo: {
            total_canais: canaisList.length,
            receita_total: receitaTotal,
            pedidos_totais: pedidosTotais,
            aov_geral: pedidosTotais > 0 ? receitaTotal / pedidosTotais : 0,
          },
          canais_performance: distribuicao,
          melhor_canal: melhorCanal ? {
            name: melhorCanal.channel_name,
            receita: melhorCanal.receita_total,
            pedidos: melhorCanal.numero_pedidos,
            aov: melhorCanal.aov,
          } : null,
          pior_canal: piorCanal ? {
            name: piorCanal.channel_name,
            receita: piorCanal.receita_total,
            pedidos: piorCanal.numero_pedidos,
            aov: piorCanal.aov,
          } : null,
        }
      };

    } catch (error) {
      console.error('ERRO getChannelAnalysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao analisar canais de venda`,
        data: null
      };
    }
  }
});
