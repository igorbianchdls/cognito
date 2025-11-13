import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  compras: {
    compra_id: 'c.id',
    numero_oc: 'c.numero_oc',
    data_emissao: 'c.data_emissao',
    data_entrega_prevista: 'c.data_entrega_prevista',
    fornecedor: 'f.nome_fantasia',
    filial: 'fil.nome',
    centro_custo: 'cc.nome',
    projeto: 'pr.nome',
    categoria_financeira: 'cat.nome',
    status: 'c.status',
    valor_total: 'c.valor_total',
    criado_em: 'c.criado_em',
  },
};

const parseNumber = (v: string | null, fb?: number) => (v ? Number(v) : fb);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = (searchParams.get('view') || '').toLowerCase();
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 });

    // Common filters
    const de = searchParams.get('de') || undefined;
    const ate = searchParams.get('ate') || undefined;
    const q = searchParams.get('q') || undefined;

    // Specific filters
    const status = searchParams.get('status') || undefined;
    const fornecedor_id = searchParams.get('fornecedor_id') || undefined;

    // Pagination
    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1);
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 20) || 20));
    const offset = (page - 1) * pageSize;

    // Sorting
    const orderByParam = (searchParams.get('order_by') || '').toLowerCase();
    const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase();
    const whitelist = ORDER_BY_WHITELIST[view] || {};
    const orderBy = whitelist[orderByParam] || undefined;
    const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const push = (expr: string, val: unknown) => {
      conditions.push(`${expr} $${i}`);
      params.push(val);
      i += 1;
    };

    let selectSql = '';
    let baseSql = '';
    let whereDateCol = '';

    if (view === 'compras') {
      selectSql = `SELECT
        c.id AS compra_id,
        c.numero_oc,
        c.data_emissao,
        c.data_entrega_prevista,
        c.status,
        c.valor_total,
        c.observacoes,
        c.criado_em,
        f.nome_fantasia AS fornecedor,
        fil.nome AS filial,
        cc.nome AS centro_custo,
        pr.nome AS projeto,
        cat.nome AS categoria_financeira,
        l.id AS linha_id,
        p.nome AS produto,
        l.quantidade,
        l.unidade_medida,
        l.preco_unitario,
        l.total AS total_linha`;
      baseSql = `FROM compras.compras c
        LEFT JOIN entidades.fornecedores f ON f.id = c.fornecedor_id
        LEFT JOIN empresa.filiais fil ON fil.id = c.filial_id
        LEFT JOIN empresa.centros_custo cc ON cc.id = c.centro_custo_id
        LEFT JOIN financeiro.projetos pr ON pr.id = c.projeto_id
        LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = c.categoria_financeira_id
        LEFT JOIN compras.compras_linhas l ON l.compra_id = c.id
        LEFT JOIN produtos.produto p ON p.id = l.produto_id`;
      whereDateCol = 'c.data_emissao';
      if (status) push('LOWER(c.status) =', status.toLowerCase());
      if (fornecedor_id) push('c.fornecedor_id =', fornecedor_id);
      if (q) {
        conditions.push(`(c.numero_oc ILIKE '%' || $${i} || '%' OR f.nome_fantasia ILIKE '%' || $${i} || '%' OR p.nome ILIKE '%' || $${i} || '%' OR c.observacoes ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 });
    }

    if (de && whereDateCol) push(`${whereDateCol} >=`, de);
    if (ate && whereDateCol) push(`${whereDateCol} <=`, ate);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Default ordering
    let orderClause = '';
    if (ORDER_BY_WHITELIST[view] && Object.keys(ORDER_BY_WHITELIST[view]).length) {
      if (orderBy) orderClause = `ORDER BY ${orderBy} ${orderDir}, l.id ASC`;
      else orderClause = 'ORDER BY c.id DESC, l.id ASC';
    }

    const limitOffset = `LIMIT $${i}::int OFFSET $${i + 1}::int`;
    const paramsWithPage = [...params, pageSize, offset];

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${orderClause}
                     ${limitOffset}`.replace(/\s+$/m, '').trim();

    let rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage);

    // Aggregate: group linhas by compra
    if (view === 'compras') {
      type CompraAgregada = {
        compra_id: unknown
        numero_oc: unknown
        data_emissao: unknown
        data_entrega_prevista: unknown
        status: unknown
        valor_total: unknown
        observacoes: unknown
        criado_em: unknown
        fornecedor: unknown
        filial: unknown
        centro_custo: unknown
        projeto: unknown
        categoria_financeira: unknown
        linhas: Array<{
          linha_id: unknown
          produto: unknown
          quantidade: unknown
          unidade_medida: unknown
          preco_unitario: unknown
          total_linha: unknown
        }>
      }
      const comprasMap = new Map<number, CompraAgregada>()

      for (const row of rows) {
        const compraKey = Number(row.compra_id)

        if (!comprasMap.has(compraKey)) {
          comprasMap.set(compraKey, {
            compra_id: row.compra_id,
            numero_oc: row.numero_oc,
            data_emissao: row.data_emissao,
            data_entrega_prevista: row.data_entrega_prevista,
            status: row.status,
            valor_total: row.valor_total,
            observacoes: row.observacoes,
            criado_em: row.criado_em,
            fornecedor: row.fornecedor,
            filial: row.filial,
            centro_custo: row.centro_custo,
            projeto: row.projeto,
            categoria_financeira: row.categoria_financeira,
            linhas: []
          })
        }

        if (row.linha_id) {
          comprasMap.get(compraKey)!.linhas.push({
            linha_id: row.linha_id,
            produto: row.produto,
            quantidade: row.quantidade,
            unidade_medida: row.unidade_medida,
            preco_unitario: row.preco_unitario,
            total_linha: row.total_linha,
          })
        }
      }

      rows = Array.from(comprasMap.values())
    }

    const totalSql = view === 'compras'
      ? `SELECT COUNT(DISTINCT c.id)::int AS total FROM compras.compras c ${whereClause.replace(/c\./g, 'c.').replace(/f\./g, 'f.')}`
      : `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`;
    const totalRows = await runQuery<{ total: number }>(totalSql, params);
    const total = totalRows[0]?.total ?? 0;

    return Response.json({
      success: true,
      view,
      page,
      pageSize,
      total,
      rows,
      sql: listSql,
      params: JSON.stringify(paramsWithPage),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('📦 API /api/modulos/compras error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
