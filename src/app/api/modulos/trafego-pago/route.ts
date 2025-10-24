import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  'contas-ads': {
    id: 'ca.id',
    conta: 'ca.nome_conta',
    plataforma: 'ca.plataforma',
    conectado_em: 'ca.conectado_em',
    gasto_total: 'gasto_total',
    impressoes: 'impressoes',
    cliques: 'cliques',
    ctr_medio: 'ctr_medio',
    cpc_medio: 'cpc_medio',
    roas_medio: 'roas_medio',
  },
  campanhas: {
    id: 'c.id',
    campanha: 'c.nome',
    objetivo: 'c.objetivo',
    status: 'c.status',
    conta: 'ca.nome_conta',
    plataforma: 'ca.plataforma',
    orcamento_total: 'c.orcamento_total',
    inicio: 'c.inicio',
    fim: 'c.fim',
    gasto_total: 'gasto_total',
    impressoes: 'impressoes',
    cliques: 'cliques',
    conversoes: 'conversoes',
    ctr: 'ctr',
    cpc: 'cpc',
    roas: 'roas',
  },
  'grupos-anuncio': {
    id: 'g.id',
    grupo: 'g.nome',
    campanha: 'c.nome',
    status: 'g.status',
    orcamento_diario: 'g.orcamento_diario',
    gasto_total: 'gasto_total',
    impressoes: 'impressoes',
    cliques: 'cliques',
    ctr: 'ctr',
    cpc: 'cpc',
    roas: 'roas',
  },
  anuncios: {
    id: 'a.id',
    titulo: 'a.titulo',
    plataforma: 'a.plataforma',
    campanha: 'c.nome',
    grupo: 'g.nome',
    status: 'a.status',
    publicado_em: 'a.publicado_em',
    gasto: 'gasto',
    impressoes: 'impressoes',
    cliques: 'cliques',
    ctr: 'ctr',
    cpc: 'cpc',
    conversoes: 'conversoes',
    cpa: 'cpa',
    roas: 'roas',
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
    const campanha_id = searchParams.get('campanha_id') || undefined;
    const grupo_id = searchParams.get('grupo_id') || undefined;
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
    let groupBy = '';

    if (view === 'contas-ads') {
      selectSql = `SELECT ca.id AS id,
                          ca.nome_conta AS conta,
                          ca.plataforma AS plataforma,
                          ca.conectado_em AS conectado_em,
                          ROUND(COALESCE(SUM(m.gasto), 0)::numeric, 2) AS gasto_total,
                          COALESCE(SUM(m.impressoes), 0) AS impressoes,
                          COALESCE(SUM(m.cliques), 0) AS cliques,
                          ROUND(COALESCE(AVG(m.ctr), 0)::numeric, 2) AS ctr_medio,
                          ROUND(COALESCE(AVG(m.cpc), 0)::numeric, 2) AS cpc_medio,
                          ROUND(COALESCE(AVG(m.roas), 0)::numeric, 2) AS roas_medio`;
      baseSql = `FROM marketing.contas_ads ca
                 LEFT JOIN marketing.metricas_anuncios m ON m.conta_ads_id = ca.id`;
      whereDateCol = 'm.data';
      groupBy = 'GROUP BY ca.id, ca.nome_conta, ca.plataforma, ca.conectado_em';
      if (plataforma) push('LOWER(ca.plataforma) =', plataforma.toLowerCase());
      if (conta_ads_id) push('ca.id =', conta_ads_id);
      if (q) {
        conditions.push(`(ca.nome_conta ILIKE '%' || $${i} || '%' OR ca.plataforma ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'campanhas') {
      selectSql = `SELECT c.id AS id,
                          c.nome AS campanha,
                          c.objetivo AS objetivo,
                          c.status AS status,
                          ca.nome_conta AS conta,
                          ca.plataforma AS plataforma,
                          c.orcamento_total AS orcamento_total,
                          c.inicio AS inicio,
                          c.fim AS fim,
                          ROUND(COALESCE(SUM(m.gasto), 0)::numeric, 2) AS gasto_total,
                          COALESCE(SUM(m.impressao), 0) AS impressoes,
                          COALESCE(SUM(m.cliques), 0) AS cliques,
                          COALESCE(SUM(m.conversao), 0) AS conversoes,
                          ROUND(COALESCE(AVG(m.ctr), 0)::numeric, 2) AS ctr,
                          ROUND(COALESCE(AVG(m.cpc), 0)::numeric, 2) AS cpc,
                          ROUND(COALESCE(AVG(m.roas), 0)::numeric, 2) AS roas`;
      baseSql = `FROM marketing.campanhas c
                 LEFT JOIN marketing.contas_ads ca ON c.conta_ads_id = ca.id
                 LEFT JOIN marketing.grupos_de_anuncios g ON g.campanha_id = c.id
                 LEFT JOIN marketing.anuncios_publicados a ON a.grupo_id = g.id
                 LEFT JOIN marketing.metricas_anuncios m ON m.anuncio_publicado_id = a.id`;
      whereDateCol = 'm.data';
      groupBy = 'GROUP BY c.id, c.nome, c.objetivo, c.status, c.orcamento_total, c.inicio, c.fim, ca.nome_conta, ca.plataforma';
      if (plataforma) push('LOWER(ca.plataforma) =', plataforma.toLowerCase());
      if (conta_ads_id) push('c.conta_ads_id =', conta_ads_id);
      if (status) push('LOWER(c.status) =', status.toLowerCase());
      if (objetivo) push('LOWER(c.objetivo) =', objetivo.toLowerCase());
      if (q) {
        conditions.push(`(c.nome ILIKE '%' || $${i} || '%' OR ca.nome_conta ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'grupos-anuncio') {
      selectSql = `SELECT g.id AS id,
                          g.nome AS grupo,
                          c.nome AS campanha,
                          g.status AS status,
                          g.orcamento_diario AS orcamento_diario,
                          ROUND(COALESCE(SUM(m.gasto), 0)::numeric, 2) AS gasto_total,
                          COALESCE(SUM(m.impressao), 0) AS impressoes,
                          COALESCE(SUM(m.cliques), 0) AS cliques,
                          ROUND(COALESCE(AVG(m.ctr), 0)::numeric, 2) AS ctr,
                          ROUND(COALESCE(AVG(m.cpc), 0)::numeric, 2) AS cpc,
                          ROUND(COALESCE(AVG(m.roas), 0)::numeric, 2) AS roas`;
      baseSql = `FROM marketing.grupos_de_anuncios g
                 LEFT JOIN marketing.campanhas c ON g.campanha_id = c.id
                 LEFT JOIN marketing.anuncios_publicados a ON a.grupo_id = g.id
                 LEFT JOIN marketing.metricas_anuncios m ON m.anuncio_publicado_id = a.id`;
      whereDateCol = 'm.data';
      groupBy = 'GROUP BY g.id, g.nome, c.nome, g.status, g.orcamento_diario';
      if (campanha_id) push('g.campanha_id =', campanha_id);
      if (status) push('LOWER(g.status) =', status.toLowerCase());
      if (q) {
        conditions.push(`(g.nome ILIKE '%' || $${i} || '%' OR c.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'anuncios') {
      selectSql = `SELECT a.id AS id,
                          a.titulo AS titulo,
                          a.plataforma AS plataforma,
                          c.nome AS campanha,
                          g.nome AS grupo,
                          a.status AS status,
                          a.publicado_em AS publicado_em,
                          ROUND(COALESCE(SUM(m.gasto), 0)::numeric, 2) AS gasto,
                          COALESCE(SUM(m.impressao), 0) AS impressoes,
                          COALESCE(SUM(m.cliques), 0) AS cliques,
                          ROUND(COALESCE(AVG(m.ctr), 0)::numeric, 2) AS ctr,
                          ROUND(COALESCE(AVG(m.cpc), 0)::numeric, 2) AS cpc,
                          COALESCE(SUM(m.conversao), 0) AS conversoes,
                          ROUND(COALESCE(AVG(m.cpa), 0)::numeric, 2) AS cpa,
                          ROUND(COALESCE(AVG(m.roas), 0)::numeric, 2) AS roas`;
      baseSql = `FROM marketing.anuncios_publicados a
                 LEFT JOIN marketing.grupos_de_anuncios g ON a.grupo_id = g.id
                 LEFT JOIN marketing.campanhas c ON g.campanha_id = c.id
                 LEFT JOIN marketing.metricas_anuncios m ON m.anuncio_publicado_id = a.id`;
      whereDateCol = 'm.data';
      groupBy = 'GROUP BY a.id, a.titulo, a.plataforma, c.nome, g.nome, a.status, a.publicado_em';
      if (plataforma) push('LOWER(a.plataforma) =', plataforma.toLowerCase());
      if (grupo_id) push('a.grupo_id =', grupo_id);
      if (campanha_id) push('g.campanha_id =', campanha_id);
      if (status) push('LOWER(a.status) =', status.toLowerCase());
      if (q) {
        conditions.push(`(a.titulo ILIKE '%' || $${i} || '%' OR c.nome ILIKE '%' || $${i} || '%' OR g.nome ILIKE '%' || $${i} || '%')`);
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
    else {
      if (view === 'contas-ads') orderClause = 'ORDER BY gasto_total DESC NULLS LAST';
      else if (view === 'campanhas') orderClause = 'ORDER BY gasto_total DESC NULLS LAST';
      else if (view === 'grupos-anuncio') orderClause = 'ORDER BY gasto_total DESC NULLS LAST';
      else if (view === 'anuncios') orderClause = 'ORDER BY gasto DESC NULLS LAST';
    }

    const paginate = !(groupBy && groupBy.length);
    const limitOffset = paginate ? `LIMIT $${i}::int OFFSET $${i + 1}::int` : '';
    const paramsWithPage = paginate ? [...params, pageSize, offset] : params;

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${groupBy}
                     ${orderClause}
                     ${limitOffset}`.replace(/\s+$/m, '').trim();

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage);

    let total = rows.length;
    if (!groupBy) {
      const totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`;
      const totalRows = await runQuery<{ total: number }>(totalSql, params);
      total = totalRows[0]?.total ?? 0;
    }

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
