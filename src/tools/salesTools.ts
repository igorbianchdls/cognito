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
  description: 'Top 10 Produtos Mais Rentáveis (visão essencial).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      SELECT
        pv.id AS produto_id,
        pv.sku,
        p.nome AS nome_produto,
        SUM(ip.quantidade) AS qtd,
        SUM(ip.quantidade * ip.preco_unitario) AS receita_liquida,
        COUNT(DISTINCT ip.pedido_id) AS pedidos_distintos
      FROM gestaovendas.itens_pedido ip
      JOIN gestaocatalogo.produto_variacoes pv ON ip.produto_id = pv.id
      JOIN gestaocatalogo.produtos p ON pv.produto_pai_id = p.id
      GROUP BY pv.id, p.nome, pv.sku
      ORDER BY receita_liquida DESC
      LIMIT 10;
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
        message: 'Top 10 Produtos Mais Rentáveis',
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

export const getDesempenhoVendasMensal = tool({
  description: 'Desempenho mensal de vendas: receita total, pedidos, ticket médio e itens por pedido.',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      WITH itens_por_pedido AS (
        SELECT pedido_id, SUM(quantidade) AS total_itens
        FROM gestaovendas.itens_pedido
        GROUP BY pedido_id
      )
      SELECT
        DATE_TRUNC('month', p.criado_em)::date AS mes,
        SUM(p.total_liquido) AS receita_total,
        COUNT(p.id) AS total_pedidos,
        ROUND(SUM(p.total_liquido)::numeric / NULLIF(COUNT(p.id), 0), 2) AS ticket_medio,
        ROUND(SUM(ip.total_itens)::numeric / NULLIF(COUNT(p.id), 0), 2) AS itens_por_pedido
      FROM gestaovendas.pedidos p
      LEFT JOIN itens_por_pedido ip ON ip.pedido_id = p.id
      GROUP BY mes
      ORDER BY mes ASC;
    `.trim();

    try {
      const rows = await runQuery<{
        mes: string;
        receita_total: number;
        total_pedidos: number;
        ticket_medio: number;
        itens_por_pedido: number;
      }>(sql);

      return {
        success: true,
        message: 'Desempenho de Vendas Mensal',
        rows,
        sql_query: sql,
        sql_params: '[]',
      };
    } catch (error) {
      console.error('ERRO getDesempenhoVendasMensal:', error);
      return { success: false, message: 'Erro ao calcular desempenho mensal de vendas' };
    }
  },
});

export const analiseDesempenhoCanalVenda = tool({
  description: 'Análise de Desempenho por Canal de Venda (rentabilidade por canal).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      SELECT
        cv.nome AS canal,
        COUNT(p.id) AS total_pedidos,
        SUM(p.valor_total) AS receita_bruta,
        SUM(p.valor_total) / COUNT(p.id) AS ticket_medio,
        SUM(
          CASE
            WHEN cm.taxa_comissao_percentual > 0 THEN p.valor_produtos * (cm.taxa_comissao_percentual / 100.0)
            ELSE 0
          END
        ) AS comissao_marketplace_estimada,
        SUM(p.valor_total) - SUM(
          CASE
            WHEN cm.taxa_comissao_percentual > 0 THEN p.valor_produtos * (cm.taxa_comissao_percentual / 100.0)
            ELSE 0
          END
        ) AS receita_liquida_estimada
      FROM gestaovendas.pedidos p
      JOIN gestaovendas.canais_venda cv ON p.canal_venda_id = cv.id
      LEFT JOIN gestaovendas.configuracoes_marketplace cm ON cv.id = cm.canal_venda_id
      WHERE p.status != 'CANCELADO'
      GROUP BY cv.nome
      ORDER BY receita_liquida_estimada DESC;
    `.trim();

    try {
      const rows = await runQuery<{
        canal: string;
        total_pedidos: number;
        receita_bruta: number;
        ticket_medio: number;
        comissao_marketplace_estimada: number;
        receita_liquida_estimada: number;
      }>(sql);

      return {
        success: true,
        message: 'Análise de Desempenho por Canal de Venda (Rentabilidade)',
        rows,
        sql_query: sql,
        sql_params: '[]',
      };
    } catch (error) {
      console.error('ERRO analiseDesempenhoCanalVenda:', error);
      return { success: false, message: 'Erro ao analisar desempenho por canal de venda' };
    }
  },
});

export const analisePerformanceCategoria = tool({
  description: 'Análise de Performance por Categoria de Produto (visão estratégica).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      SELECT
        COALESCE(cat.nome, 'Sem Categoria') AS categoria,
        SUM(ip.quantidade * ip.preco_unitario) AS receita_total,
        SUM(ip.quantidade) AS total_unidades_vendidas,
        COUNT(DISTINCT ip.pedido_id) AS pedidos_distintos,
        AVG(ip.preco_unitario) AS preco_medio_do_item
      FROM gestaovendas.itens_pedido ip
      JOIN gestaocatalogo.produto_variacoes pv ON ip.produto_id = pv.id
      JOIN gestaocatalogo.produtos p ON pv.produto_pai_id = p.id
      LEFT JOIN gestaocatalogo.categorias cat ON p.categoria_id = cat.id
      GROUP BY categoria
      ORDER BY receita_total DESC;
    `.trim();

    try {
      const rows = await runQuery<{
        categoria: string;
        receita_total: number;
        total_unidades_vendidas: number;
        pedidos_distintos: number;
        preco_medio_do_item: number;
      }>(sql);

      return {
        success: true,
        message: 'Análise de Performance por Categoria de Produto',
        rows,
        sql_query: sql,
        sql_params: '[]',
      };
    } catch (error) {
      console.error('ERRO analisePerformanceCategoria:', error);
      return { success: false, message: 'Erro ao analisar performance por categoria' };
    }
  },
});

export const analiseLTVcliente = tool({
  description: 'Análise de LTV por cliente (total gasto, pedidos, ticket médio e datas).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      SELECT
        c.nome,
        c.email,
        SUM(p.valor_total) AS ltv_total_gasto,
        COUNT(p.id) AS total_de_pedidos,
        AVG(p.valor_total) AS ticket_medio_cliente,
        MIN(p.data_pedido)::date AS data_primeira_compra,
        MAX(p.data_pedido)::date AS data_ultima_compra
      FROM gestaovendas.pedidos p
      JOIN gestaovendas.clientes c ON p.cliente_id = c.id
      WHERE p.status != 'CANCELADO'
      GROUP BY c.id, c.nome, c.email
      ORDER BY ltv_total_gasto DESC
      LIMIT 10;
    `.trim();

    try {
      const rows = await runQuery<{
        nome: string;
        email: string;
        ltv_total_gasto: number;
        total_de_pedidos: number;
        ticket_medio_cliente: number;
        data_primeira_compra: string;
        data_ultima_compra: string;
      }>(sql);

      return {
        success: true,
        message: 'Análise de LTV por Cliente',
        rows,
        sql_query: sql,
        sql_params: '[]',
      };
    } catch (error) {
      console.error('ERRO analiseLTVcliente:', error);
      return { success: false, message: 'Erro ao analisar LTV por cliente' };
    }
  },
});

export const getTopClientesPorReceita = tool({
  description: 'Top clientes por receita (usa totais consolidados do pedido).',
  inputSchema: z.object({
    data_de: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
    data_ate: z.string().optional().describe('Data final (YYYY-MM-DD)'),
    limit: z.number().int().min(1).max(1000).default(50)
  }).optional(),
  execute: async ({ data_de, data_ate, limit = 50 } = {}) => {
    const sql = `
      SELECT
        p.cliente_id,
        c.nome            AS nome_cliente,
        COUNT(*)          AS pedidos,
        SUM(p.total_liquido) AS receita,
        ROUND(AVG(p.total_liquido)::numeric,2) AS ticket_medio
      FROM gestaovendas.pedidos p
      LEFT JOIN gestaovendas.clientes c ON c.id = p.cliente_id
      WHERE ($1::date IS NULL OR p.criado_em::date >= $1::date)
        AND ($2::date IS NULL OR p.criado_em::date <= $2::date)
      GROUP BY 1,2
      ORDER BY receita DESC
      LIMIT $3::int;
    `.trim();

    try {
      const rows = await runQuery<{
        cliente_id: number | null;
        nome_cliente: string | null;
        pedidos: number;
        receita: number;
        ticket_medio: number;
      }>(sql, [data_de ?? null, data_ate ?? null, limit]);

      return {
        success: true,
        message: `Top clientes por receita (limite ${limit})`,
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([data_de ?? null, data_ate ?? null, limit]),
      };
    } catch (error) {
      console.error('ERRO getTopClientesPorReceita:', error);
      return { success: false, message: 'Erro ao calcular top clientes por receita' };
    }
  },
});

export const analiseValorVidaCliente = tool({
  description: 'Análise de Valor de Vida do Cliente (LTV - Lifetime Value).',
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
      console.error('ERRO analiseValorVidaCliente:', error);
      return {
        success: false,
        message: `Erro ao calcular valor de vida do cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const analiseClientesNovosRecorrentes = tool({
  description: 'Análise de Clientes Novos vs. Recorrentes.',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      WITH ranked_orders AS (
        SELECT
          id,
          cliente_id,
          valor_total,
          ROW_NUMBER() OVER (PARTITION BY cliente_id ORDER BY data_pedido ASC) AS ranking_do_pedido
        FROM gestaovendas.pedidos
        WHERE status != 'CANCELADO'
      )
      SELECT
        CASE
          WHEN ranking_do_pedido = 1 THEN 'Novo Cliente'
          ELSE 'Cliente Recorrente'
        END AS tipo_de_cliente,
        COUNT(id) AS total_de_pedidos,
        SUM(valor_total) AS receita_total,
        AVG(valor_total) AS ticket_medio
      FROM ranked_orders
      GROUP BY tipo_de_cliente;
    `.trim();

    try {
      const rows = await runQuery<{
        tipo_de_cliente: string;
        total_de_pedidos: number;
        receita_total: number;
        ticket_medio: number;
      }>(sql);

      return {
        success: true,
        message: 'Análise de Clientes Novos vs. Recorrentes',
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([]),
      };
    } catch (error) {
      console.error('ERRO analiseClientesNovosRecorrentes:', error);
      return {
        success: false,
        message: `Erro ao analisar clientes novos vs. recorrentes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const analisePerformanceLancamento = tool({
  description: 'Análise de Performance de Lançamento de Coleção.',
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
      console.error('ERRO analisePerformanceLancamento:', error);
      return {
        success: false,
        message: `Erro ao analisar performance de lançamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const analiseCestaCompras = tool({
  description: 'Análise de Cesta de Compras (Produtos Comprados Juntos).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      WITH produto_nomes AS (
        SELECT v.id, p.nome
        FROM gestaocatalogo.produto_variacoes v
        JOIN gestaocatalogo.produtos p ON v.produto_pai_id = p.id
      )
      SELECT
        pn1.nome AS produto_A,
        pn2.nome AS produto_B,
        COUNT(DISTINCT item1.pedido_id) AS vezes_comprados_juntos
      FROM gestaovendas.itens_pedido AS item1
      JOIN gestaovendas.itens_pedido AS item2
        ON item1.pedido_id = item2.pedido_id AND item1.produto_id < item2.produto_id
      JOIN produto_nomes pn1 ON item1.produto_id = pn1.id
      JOIN produto_nomes pn2 ON item2.produto_id = pn2.id
      GROUP BY produto_A, produto_B
      ORDER BY vezes_comprados_juntos DESC
      LIMIT 10;
    `.trim();

    try {
      const rows = await runQuery<{
        produto_A: string;
        produto_B: string;
        vezes_comprados_juntos: number;
      }>(sql);

      return {
        success: true,
        message: 'Produtos frequentemente comprados juntos',
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([]),
      };
    } catch (error) {
      console.error('ERRO analiseCestaCompras:', error);
      return {
        success: false,
        message: `Erro ao analisar cesta de compras: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});

export const analiseVendasPorEstado = tool({
  description: 'Análise de Vendas por Estado (Visão Geográfica).',
  inputSchema: z.object({}).optional(),
  execute: async () => {
    const sql = `
      SELECT
        ec.estado,
        SUM(p.valor_total) AS receita_total,
        COUNT(p.id) AS total_pedidos,
        COUNT(DISTINCT p.cliente_id) AS clientes_distintos
      FROM gestaovendas.pedidos p
      JOIN gestaovendas.enderecos_clientes ec ON p.endereco_entrega_id = ec.id
      WHERE p.status != 'CANCELADO'
      GROUP BY ec.estado
      ORDER BY receita_total DESC;
    `.trim();

    try {
      const rows = await runQuery<{
        estado: string;
        receita_total: number;
        total_pedidos: number;
        clientes_distintos: number;
      }>(sql);

      return {
        success: true,
        message: 'Vendas por Estado (Visão Geográfica)',
        rows,
        sql_query: sql,
        sql_params: formatSqlParams([]),
      };
    } catch (error) {
      console.error('ERRO analiseVendasPorEstado:', error);
      return {
        success: false,
        message: `Erro ao analisar vendas por estado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});
