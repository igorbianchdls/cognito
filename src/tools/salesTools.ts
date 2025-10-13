import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const DEFAULT_RANGE = 30;
const MIN_RANGE = 1;
const MAX_RANGE = 365;

const normalizeRange = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_RANGE;
  }
  return Math.min(Math.max(Math.trunc(value), MIN_RANGE), MAX_RANGE);
};

const formatSqlParams = (params: unknown[]) =>
  params.length ? JSON.stringify(params) : '[]';

export const getTopProdutosReceitaLiquida = tool({
  description: 'Top 20 produtos por receita líquida (gestaovendas + gestaocatalogo).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      WITH itens AS (
        SELECT
          p.id                                   AS pedido_id,
          i.produto_id,
          (i.quantidade * i.preco_unitario)      AS receita_bruta_item,
          i.quantidade,
          COALESCE(p.desconto,0)                 AS desconto_pedido,
          COALESCE(p.frete,0)                    AS frete_pedido,
          SUM(i.quantidade * i.preco_unitario) OVER (PARTITION BY p.id) AS soma_bruta_pedido
        FROM gestaovendas.pedidos p
        JOIN gestaovendas.itens_pedido i ON i.pedido_id = p.id
      ),
      itens_rateado AS (
        SELECT
          produto_id,
          quantidade,
          receita_bruta_item,
          CASE WHEN soma_bruta_pedido > 0
               THEN receita_bruta_item / soma_bruta_pedido
               ELSE 0 END                        AS peso,
          desconto_pedido,
          frete_pedido
        FROM itens
      )
      SELECT
        ir.produto_id,
        pr.sku,
        pr.nome AS nome_produto,
        SUM(ir.quantidade) AS qtd,
        SUM(ir.receita_bruta_item - ir.desconto_pedido * ir.peso + ir.frete_pedido * ir.peso) AS receita_liquida
      FROM itens_rateado ir
      JOIN gestaocatalogo.produtos pr ON pr.id = ir.produto_id
      GROUP BY ir.produto_id, pr.sku, pr.nome
      ORDER BY receita_liquida DESC
      LIMIT 20;
    `.trim();

    try {
      const rows = await runQuery<{
        produto_id: number;
        sku: string | null;
        nome_produto: string;
        qtd: number;
        receita_liquida: number;
      }>(sql);

      return {
        success: true,
        message: 'Top 20 produtos por receita líquida',
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([]),
      };
    } catch (error) {
      console.error('ERRO getTopProdutosReceitaLiquida:', error);
      return {
        success: false,
        message: `Erro ao calcular top produtos por receita líquida: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const getSalesCalls = tool({
  description: 'Busca calls de vendas gravadas com filtros opcionais (status, vendedor, limite).',
  inputSchema: z.object({
    limit: z.number().int().min(1).max(100).default(10),
    status: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost']).optional(),
    sales_rep: z.string().optional(),
  }),
  execute: async ({ limit = 10, status, sales_rep }) => {
    // Verifica existência da tabela gestaovendas.calls
    const existsSql = `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'gestaovendas'
        AND table_name = 'calls'
      LIMIT 1;
    `;

    try {
      const existsRows = await runQuery<Record<string, unknown>>(existsSql);
      const tableExists = existsRows.length > 0;

      if (!tableExists) {
        return {
          success: true,
          count: 0,
          data: [],
          message: 'Nenhuma call encontrada (tabela gestaovendas.calls não existe)'
        };
      }

      const sql = `
        SELECT
          id::text AS id,
          call_date,
          duration_minutes,
          client_name,
          client_company,
          sales_rep,
          transcription,
          summary,
          key_points,
          objections_identified,
          objections_handled,
          sentiment_score,
          engagement_score,
          close_probability,
          next_steps,
          follow_up_date,
          status,
          deal_value,
          notes,
          created_at
        FROM gestaovendas.calls
        WHERE ($1::text IS NULL OR status = $1::text)
          AND ($2::text IS NULL OR sales_rep ILIKE '%' || $2::text || '%')
        ORDER BY call_date DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT $3::int;
      `;

      const rows = await runQuery<{
        id: string;
        call_date?: string;
        duration_minutes?: number;
        client_name: string;
        client_company?: string;
        sales_rep: string;
        transcription?: string;
        summary?: string;
        key_points?: string;
        objections_identified?: string;
        objections_handled?: string;
        sentiment_score?: number;
        engagement_score?: number;
        close_probability?: number;
        next_steps?: string;
        follow_up_date?: string;
        status?: string;
        deal_value?: number;
        notes?: string;
        created_at?: string;
      }>(sql, [status ?? null, sales_rep ?? null, limit]);

      return {
        success: true,
        count: rows.length,
        data: rows,
        message: `Calls de vendas (${rows.length})`,
        sql_query: sql,
        sql_params: JSON.stringify([status ?? null, sales_rep ?? null, limit]),
      };
    } catch (error) {
      console.error('ERRO getSalesCalls:', error);
      return {
        success: false,
        count: 0,
        data: [],
        message: 'Erro ao buscar calls de vendas',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  },
});

export const getReceitaPorCanal = tool({
  description: 'Receita líquida por canal com pedidos (rateio proporcional de desconto/frete).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      WITH itens AS (
        SELECT
          p.id                                   AS pedido_id,
          COALESCE(p.canal, 'Sem canal')         AS canal,
          (i.quantidade * i.preco_unitario)      AS receita_bruta_item,
          COALESCE(p.desconto,0)                 AS desconto_pedido,
          COALESCE(p.frete,0)                    AS frete_pedido,
          SUM(i.quantidade * i.preco_unitario) OVER (PARTITION BY p.id) AS soma_bruta_pedido
        FROM gestaovendas.pedidos p
        JOIN gestaovendas.itens_pedido i ON i.pedido_id = p.id
      ),
      itens_rateado AS (
        SELECT
          canal,
          receita_bruta_item,
          CASE WHEN soma_bruta_pedido > 0
               THEN receita_bruta_item / soma_bruta_pedido
               ELSE 0 END                        AS peso,
          desconto_pedido,
          frete_pedido,
          pedido_id
        FROM itens
      )
      SELECT
        canal,
        SUM(receita_bruta_item - desconto_pedido * peso + frete_pedido * peso) AS receita_liquida,
        COUNT(DISTINCT pedido_id)                                              AS pedidos
      FROM itens_rateado
      GROUP BY canal
      ORDER BY receita_liquida DESC;
    `.trim();

    try {
      const rows = await runQuery<{
        canal: string;
        receita_liquida: number;
        pedidos: number;
      }>(sql);

      return {
        success: true,
        message: 'Receita por canal',
        rows,
        sql_query: sql,
        sql_params: '[]',
      };
    } catch (error) {
      console.error('ERRO getReceitaPorCanal:', error);
      return { success: false, message: 'Erro ao calcular receita por canal' };
    }
  },
});

export const getMixReceitaPorCategoria = tool({
  description: 'Mix de receita por categoria e participação % (rateio proporcional).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      WITH itens AS (
        SELECT
          p.id                                   AS pedido_id,
          pr.categoria_id,
          (i.quantidade * i.preco_unitario)      AS receita_bruta_item,
          COALESCE(p.desconto,0)                 AS desconto_pedido,
          COALESCE(p.frete,0)                    AS frete_pedido,
          SUM(i.quantidade * i.preco_unitario) OVER (PARTITION BY p.id) AS soma_bruta_pedido
        FROM gestaovendas.pedidos p
        JOIN gestaovendas.itens_pedido i   ON i.pedido_id = p.id
        JOIN gestaocatalogo.produtos pr    ON pr.id       = i.produto_id
      ),
      itens_rateado AS (
        SELECT
          categoria_id,
          receita_bruta_item,
          CASE WHEN soma_bruta_pedido > 0
               THEN receita_bruta_item / soma_bruta_pedido
               ELSE 0 END                        AS peso,
          desconto_pedido,
          frete_pedido
        FROM itens
      )
      SELECT
        COALESCE(cat.nome, 'Sem categoria') AS categoria,
        SUM(receita_bruta_item - desconto_pedido * peso + frete_pedido * peso) AS receita,
        100.0 * SUM(receita_bruta_item - desconto_pedido * peso + frete_pedido * peso)
              / NULLIF(SUM(SUM(receita_bruta_item - desconto_pedido * peso + frete_pedido * peso)) OVER (), 0) AS pct_receita
      FROM itens_rateado ir
      LEFT JOIN gestaocatalogo.categorias cat ON cat.id = ir.categoria_id
      GROUP BY categoria
      ORDER BY receita DESC;
    `.trim();

    try {
      const rows = await runQuery<{
        categoria: string;
        receita: number;
        pct_receita: number;
      }>(sql);

      return {
        success: true,
        message: 'Mix de receita por categoria',
        rows,
        sql_query: sql,
        sql_params: '[]',
      };
    } catch (error) {
      console.error('ERRO getMixReceitaPorCategoria:', error);
      return { success: false, message: 'Erro ao calcular mix por categoria' };
    }
  },
});

export const getTicketMedioVendas = tool({
  description: 'Ticket médio de vendas (pedidos, receita total e ticket médio).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      SELECT
        COUNT(*) AS pedidos,
        SUM(total_liquido) AS receita,
        ROUND(SUM(total_liquido)::numeric / NULLIF(COUNT(*),0), 2) AS ticket_medio
      FROM gestaovendas.pedidos;
    `.trim();

    try {
      const rows = await runQuery<{
        pedidos: number;
        receita: number;
        ticket_medio: number;
      }>(sql);

      return {
        success: true,
        message: 'Ticket médio de vendas',
        rows,
        sql_query: sql,
        sql_params: '[]',
      };
    } catch (error) {
      console.error('ERRO getTicketMedioVendas:', error);
      return { success: false, message: 'Erro ao calcular ticket médio' };
    }
  },
});

export const getRevenueMetrics = tool({
  description: 'Métricas de receita por canal de venda.',
  inputSchema: z.object({
    date_range_days: z.number().default(DEFAULT_RANGE)
      .describe('Período em dias para analisar receita por canal'),
  }),
  execute: async ({ date_range_days = DEFAULT_RANGE }) => {
    const range = normalizeRange(date_range_days);

    const sql = `
      WITH orders AS (
        SELECT
          channel_id,
          COUNT(*) AS pedidos,
          SUM(total) AS receita_total,
          SUM(subtotal) AS subtotal_total,
          SUM(discount) AS desconto_total,
          SUM(shipping_cost) AS frete_total,
          COUNT(DISTINCT customer_id) AS clientes_unicos
        FROM vendasecommerce.orders
        WHERE order_date >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
        GROUP BY channel_id
      ),
      returns AS (
        SELECT
          o.channel_id,
          COUNT(*) AS devolucoes,
          SUM(r.refund_amount) AS valor_reembolsado
        FROM vendasecommerce.returns r
        JOIN vendasecommerce.orders o ON o.id = r.order_id
        WHERE r.return_date >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
        GROUP BY o.channel_id
      ),
      totals AS (
        SELECT SUM(receita_total) AS receita_geral FROM orders
      )
      SELECT
        COALESCE(c.name, 'Sem canal') AS canal,
        o.pedidos,
        o.receita_total,
        o.subtotal_total,
        o.desconto_total,
        o.frete_total,
        o.clientes_unicos,
        COALESCE(r.devolucoes, 0) AS devolucoes,
        COALESCE(r.valor_reembolsado, 0) AS valor_reembolsado,
        CASE WHEN o.pedidos > 0 THEN o.receita_total / o.pedidos ELSE 0 END AS ticket_medio,
        CASE WHEN o.clientes_unicos > 0 THEN o.receita_total / o.clientes_unicos ELSE 0 END AS receita_por_cliente,
        CASE WHEN totals.receita_geral > 0 THEN (o.receita_total / totals.receita_geral) * 100 ELSE 0 END AS participacao_receita_percent
      FROM orders o
      LEFT JOIN returns r ON r.channel_id = o.channel_id
      LEFT JOIN vendasecommerce.channels c ON c.id = o.channel_id
      CROSS JOIN totals
      ORDER BY o.receita_total DESC;
    `.trim();

    try {
      const rows = await runQuery<{
        canal: string;
        pedidos: number;
        receita_total: number;
        subtotal_total: number;
        desconto_total: number;
        frete_total: number;
        clientes_unicos: number;
        devolucoes: number;
        valor_reembolsado: number;
        ticket_medio: number;
        receita_por_cliente: number;
        participacao_receita_percent: number;
      }>(sql, [range]);

      return {
        success: true,
        message: `Métricas de receita por canal (${range} dias)`,
        periodo_dias: range,
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO getRevenueMetrics:', error);
      return {
        success: false,
        message: `Erro ao calcular métricas de receita: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const getCustomerMetrics = tool({
  description: 'Segmentação de clientes por valor e frequência de compra.',
  inputSchema: z.object({
    date_range_days: z.number().default(DEFAULT_RANGE)
      .describe('Período de referência para identificação de clientes recentes'),
  }),
  execute: async ({ date_range_days = DEFAULT_RANGE }) => {
    const range = normalizeRange(date_range_days);

    const sql = `
      WITH clientes AS (
        SELECT
          id,
          total_spent,
          total_orders,
          CASE
            WHEN total_spent >= 5000 THEN 'Alta receita'
            WHEN total_spent >= 2000 THEN 'Crescimento'
            WHEN total_spent >= 500 THEN 'Emergentes'
            ELSE 'Novos'
          END AS segmento,
          CASE
            WHEN total_orders > 1 THEN 1
            ELSE 0
          END AS recorrente
        FROM vendasecommerce.customers
      )
      SELECT
        segmento,
        COUNT(*) AS clientes,
        ROUND(COUNT(*)::numeric / NULLIF(SUM(COUNT(*)) OVER (), 0) * 100, 2) AS percentual_clientes,
        SUM(total_spent) AS receita_total,
        AVG(total_spent) AS ticket_medio_cliente,
        AVG(total_orders) AS pedidos_medios,
        SUM(recorrente) AS clientes_recorrentes
      FROM clientes
      GROUP BY segmento
      ORDER BY receita_total DESC;
    `.trim();

    try {
      const rows = await runQuery<{
        segmento: string;
        clientes: number;
        percentual_clientes: number;
        receita_total: number;
        ticket_medio_cliente: number;
        pedidos_medios: number;
        clientes_recorrentes: number;
      }>(sql);

      return {
        success: true,
        message: 'Segmentação por perfil de clientes',
        periodo_dias: range,
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([]),
      };
    } catch (error) {
      console.error('ERRO getCustomerMetrics:', error);
      return {
        success: false,
        message: `Erro ao calcular métricas de clientes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const getProductPerformance = tool({
  description: 'Top produtos por receita e unidades vendidas.',
  inputSchema: z.object({
    date_range_days: z.number().default(DEFAULT_RANGE)
      .describe('Período em dias para analisar performance dos produtos'),
    limit: z.number().default(20)
      .describe('Número máximo de produtos a retornar'),
  }),
  execute: async ({ date_range_days = DEFAULT_RANGE, limit = 20 }) => {
    const range = normalizeRange(date_range_days);
    const top = Math.min(Math.max(Math.trunc(limit), 1), 100);

    const sql = `
      WITH filtro_pedidos AS (
        SELECT id
        FROM vendasecommerce.orders
        WHERE order_date >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
      ),
      itens AS (
        SELECT
          oi.product_id,
          SUM(oi.quantity) AS unidades_vendidas,
          SUM(oi.subtotal) AS receita_total,
          AVG(oi.unit_price) AS preco_medio
        FROM vendasecommerce.order_items oi
        JOIN filtro_pedidos f ON f.id = oi.order_id
        GROUP BY oi.product_id
      )
      SELECT
        COALESCE(p.name, 'Produto sem nome') AS produto,
        p.sku,
        p.category,
        itens.unidades_vendidas,
        itens.receita_total,
        itens.preco_medio,
        COALESCE(p.stock_quantity, 0) AS estoque_atual,
        CASE
          WHEN COALESCE(p.stock_quantity, 0) > 0
            THEN ROUND((itens.unidades_vendidas::numeric / p.stock_quantity) * 100, 2)
          ELSE NULL
        END AS sell_through_percent
      FROM itens
      LEFT JOIN vendasecommerce.products p ON p.id = itens.product_id
      ORDER BY itens.receita_total DESC
      LIMIT $2;
    `.trim();

    try {
      const rows = await runQuery<{
        produto: string;
        sku: string | null;
        category: string | null;
        unidades_vendidas: number;
        receita_total: number;
        preco_medio: number;
        estoque_atual: number;
        sell_through_percent: number | null;
      }>(sql, [range, top]);

      return {
        success: true,
        message: `Top ${rows.length} produtos por receita (${range} dias)`,
        periodo_dias: range,
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([range, top]),
      };
    } catch (error) {
      console.error('ERRO getProductPerformance:', error);
      return {
        success: false,
        message: `Erro ao analisar performance de produtos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const getCouponEffectiveness = tool({
  description: 'Efetividade dos cupons de desconto.',
  inputSchema: z.object({
    date_range_days: z.number().default(DEFAULT_RANGE)
      .describe('Período em dias para analisar pedidos com cupons'),
  }),
  execute: async ({ date_range_days = DEFAULT_RANGE }) => {
    const range = normalizeRange(date_range_days);

    const sql = `
      WITH pedidos_com_cupom AS (
        SELECT
          o.coupon_id,
          COUNT(*) AS pedidos,
          SUM(o.total) AS receita_bruta,
          SUM(o.discount) AS desconto_total
        FROM vendasecommerce.orders o
        WHERE o.order_date >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
          AND o.coupon_id IS NOT NULL
        GROUP BY o.coupon_id
      )
      SELECT
        c.code,
        c.discount_type,
        c.discount_value,
        c.valid_from,
        c.valid_until,
        c.usage_limit,
        c.times_used,
        COALESCE(p.pedidos, 0) AS pedidos_periodo,
        COALESCE(p.receita_bruta, 0) AS receita_associada,
        COALESCE(p.desconto_total, 0) AS desconto_concedido,
        CASE
          WHEN COALESCE(c.usage_limit, 0) > 0
            THEN ROUND((c.times_used::numeric / c.usage_limit) * 100, 2)
          ELSE NULL
        END AS utilizacao_total_percent
      FROM vendasecommerce.coupons c
      LEFT JOIN pedidos_com_cupom p ON p.coupon_id = c.id
      ORDER BY COALESCE(p.receita_bruta, 0) DESC, c.times_used DESC;
    `.trim();

    try {
      const rows = await runQuery<{
        code: string;
        discount_type: string;
        discount_value: number;
        valid_from: string | null;
        valid_until: string | null;
        usage_limit: number | null;
        times_used: number;
        pedidos_periodo: number;
        receita_associada: number;
        desconto_concedido: number;
        utilizacao_total_percent: number | null;
      }>(sql, [range]);

      return {
        success: true,
        message: `Efetividade dos cupons (${range} dias)`,
        periodo_dias: range,
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO getCouponEffectiveness:', error);
      return {
        success: false,
        message: `Erro ao analisar cupons: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const getChannelAnalysis = tool({
  description: 'Análise detalhada de canais de venda.',
  inputSchema: z.object({
    date_range_days: z.number().default(DEFAULT_RANGE)
      .describe('Período em dias para analisar canais'),
  }),
  execute: async ({ date_range_days = DEFAULT_RANGE }) => {
    const range = normalizeRange(date_range_days);

    const sql = `
      WITH orders AS (
        SELECT
          o.channel_id,
          COUNT(*) AS pedidos,
          SUM(o.total) AS receita_total,
          SUM(o.shipping_cost) AS frete_total,
          SUM(o.discount) AS desconto_total,
          COUNT(DISTINCT o.customer_id) AS clientes_unicos
        FROM vendasecommerce.orders o
        WHERE o.order_date >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
        GROUP BY o.channel_id
      ),
      returns AS (
        SELECT
          o.channel_id,
          COUNT(*) AS devolucoes,
          SUM(r.refund_amount) AS valor_reembolsado
        FROM vendasecommerce.returns r
        JOIN vendasecommerce.orders o ON o.id = r.order_id
        WHERE r.return_date >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
        GROUP BY o.channel_id
      ),
      payments AS (
        SELECT
          o.channel_id,
          SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) AS receita_confirmada
        FROM vendasecommerce.payments p
        JOIN vendasecommerce.orders o ON o.id = p.order_id
        WHERE p.payment_date >= CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day'
        GROUP BY o.channel_id
      )
      SELECT
        COALESCE(c.name, 'Sem canal') AS canal,
        o.pedidos,
        o.receita_total,
        COALESCE(pay.receita_confirmada, 0) AS receita_confirmada,
        o.desconto_total,
        o.frete_total,
        o.clientes_unicos,
        COALESCE(r.devolucoes, 0) AS devolucoes,
        CASE WHEN o.pedidos > 0 THEN o.receita_total / o.pedidos ELSE 0 END AS ticket_medio,
        CASE WHEN o.clientes_unicos > 0 THEN o.pedidos::numeric / o.clientes_unicos ELSE 0 END AS pedidos_por_cliente,
        CASE WHEN o.pedidos > 0 THEN COALESCE(r.devolucoes, 0)::numeric / o.pedidos * 100 ELSE 0 END AS taxa_devolucao_percent
      FROM orders o
      LEFT JOIN returns r ON r.channel_id = o.channel_id
      LEFT JOIN payments pay ON pay.channel_id = o.channel_id
      LEFT JOIN vendasecommerce.channels c ON c.id = o.channel_id
      ORDER BY o.receita_total DESC;
    `.trim();

    try {
      const rows = await runQuery<{
        canal: string;
        pedidos: number;
        receita_total: number;
        receita_confirmada: number;
        desconto_total: number;
        frete_total: number;
        clientes_unicos: number;
        devolucoes: number;
        ticket_medio: number;
        pedidos_por_cliente: number;
        taxa_devolucao_percent: number;
      }>(sql, [range]);

      return {
        success: true,
        message: `Análise de canais (${range} dias)`,
        periodo_dias: range,
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([range]),
      };
    } catch (error) {
      console.error('ERRO getChannelAnalysis:', error);
      return {
        success: false,
        message: `Erro ao analisar canais: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});
