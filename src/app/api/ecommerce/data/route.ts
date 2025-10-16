import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;

type ApiResult<T> = {
  success: boolean;
  message: string;
  count?: number;
  rows?: T[];
  sql_query?: string;
  sql_params?: string;
  error?: string;
};

const isValidDate = (s?: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const data_de = searchParams.get('data_de');
    const data_ate = searchParams.get('data_ate');

    if (!action) {
      return Response.json({ success: false, message: 'Missing action' }, { status: 400 });
    }

    switch (action) {
      case 'desempenho-mensal': {
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
          WHERE ($1::date IS NULL OR p.criado_em::date >= $1::date)
            AND ($2::date IS NULL OR p.criado_em::date <= $2::date)
          GROUP BY mes
          ORDER BY mes ASC;
        `.trim();

        const params = [isValidDate(data_de) ? data_de : null, isValidDate(data_ate) ? data_ate : null];

        const rows = await runQuery<{
          mes: string;
          receita_total: number;
          total_pedidos: number;
          ticket_medio: number;
          itens_por_pedido: number;
        }>(sql, params);

        return Response.json({
          success: true,
          message: 'Desempenho de Vendas Mensal',
          count: rows.length,
          rows,
          sql_query: sql,
          sql_params: JSON.stringify(params),
        });
      }

      case 'top-produtos': {
        const limitRaw = searchParams.get('limit');
        const limit = Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : 20;

        const sql = `
          SELECT
            pv.id AS produto_id,
            pv.sku,
            prod.nome AS nome_produto,
            SUM(ip.quantidade) AS qtd,
            SUM(ip.quantidade * ip.preco_unitario) AS receita_liquida,
            COUNT(DISTINCT ip.pedido_id) AS pedidos_distintos
          FROM gestaovendas.itens_pedido ip
          JOIN gestaovendas.pedidos p ON p.id = ip.pedido_id
          JOIN gestaocatalogo.produto_variacoes pv ON ip.produto_id = pv.id
          JOIN gestaocatalogo.produtos prod ON pv.produto_pai_id = prod.id
          WHERE (
            $1::date IS NULL OR COALESCE(p.data_pedido::date, p.criado_em::date) >= $1::date
          ) AND (
            $2::date IS NULL OR COALESCE(p.data_pedido::date, p.criado_em::date) <= $2::date
          )
          GROUP BY pv.id, prod.nome, pv.sku
          ORDER BY receita_liquida DESC
          LIMIT $3::int;
        `.trim();

        const params = [isValidDate(data_de) ? data_de : null, isValidDate(data_ate) ? data_ate : null, limit];

        const rows = await runQuery<{
          produto_id: number;
          sku: string | null;
          nome_produto: string;
          qtd: number;
          receita_liquida: number;
          pedidos_distintos: number;
        }>(sql, params);

        return Response.json({
          success: true,
          message: 'Top Produtos por Receita Líquida',
          count: rows.length,
          rows,
          sql_query: sql,
          sql_params: JSON.stringify(params),
        });
      }

      // Espaço para novas ações genéricas do e-commerce (ex.: desempenho-canal, categorias, top-clientes etc.)

      default:
        return Response.json({ success: false, message: `Ação não suportada: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('🛒 ECOMMERCE DATA API: erro:', error);
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}
