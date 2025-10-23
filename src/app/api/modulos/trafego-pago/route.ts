import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  campanhas: {
    id: 'c.id',
    conta: 'ca.nome_conta',
    plataforma: 'ca.plataforma',
    nome: 'c.nome',
    objetivo: 'c.objetivo',
    orcamento_total: 'c.orcamento_total',
    status: 'c.status',
    inicio: 'c.inicio',
    fim: 'c.fim',
  },
};

const parseNumber = (v: string | null, fb?: number) => (v ? Number(v) : fb);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = (searchParams.get('view') || '').toLowerCase();
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 });

    const de = searchParams.get('de') || undefined;
    const ate = searchParams.get('ate') || undefined;
    const q = searchParams.get('q') || undefined;

    const plataforma = searchParams.get('plataforma') || undefined;
    const conta_ads_id = searchParams.get('conta_ads_id') || undefined;
    const status = searchParams.get('status') || undefined;
    const objetivo = searchParams.get('objetivo') || undefined;
    const valor_min = parseNumber(searchParams.get('valor_min'));
    const valor_max = parseNumber(searchParams.get('valor_max'));

    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1);
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 20) || 20));
    const offset = (page - 1) * pageSize;

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

    if (view === 'campanhas') {
      selectSql = `SELECT c.id AS id,
                          ca.nome_conta AS conta,
                          ca.plataforma AS plataforma,
                          c.nome AS nome,
                          c.objetivo AS objetivo,
                          c.orcamento_total AS orcamento_total,
                          c.status AS status,
                          c.inicio AS inicio,
                          c.fim AS fim`;
      baseSql = `FROM trafego_pago.campanhas c
                 LEFT JOIN trafego_pago.contas_ads ca ON c.conta_ads_id = ca.id`;
      whereDateCol = 'c.inicio';
      if (plataforma) push('LOWER(ca.plataforma) =', plataforma.toLowerCase());
      if (conta_ads_id) push('c.conta_ads_id =', conta_ads_id);
      if (status) push('LOWER(c.status) =', status.toLowerCase());
      if (objetivo) push('LOWER(c.objetivo) =', objetivo.toLowerCase());
      if (valor_min !== undefined) push('c.orcamento_total >=', valor_min);
      if (valor_max !== undefined) push('c.orcamento_total <=', valor_max);
      if (q) {
        conditions.push(`(c.nome ILIKE '%' || $${i} || '%' OR COALESCE(c.objetivo,'') ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 });
    }

    if (de) push(`${whereDateCol} >=`, de);
    if (ate) push(`${whereDateCol} <=`, ate);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    let orderClause = '';
    if (orderBy) orderClause = `ORDER BY ${orderBy} ${orderDir}`;
    else orderClause = `ORDER BY ${whereDateCol} DESC`;

    const limitOffset = `LIMIT $${i}::int OFFSET $${i + 1}::int`;
    const paramsWithPage = [...params, pageSize, offset];

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${orderClause}
                     ${limitOffset}`.replace(/\s+$/m, '').trim();

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage);
    const totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`;
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
    console.error('📣 API /api/modulos/trafego-pago error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

