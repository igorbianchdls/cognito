import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  contas: {
    id: 'cs.id',
    conta: 'cs.nome_conta',
    plataforma: 'cs.plataforma',
    seguidores: 'rc.seguidores',
    seguindo: 'rc.seguindo',
    total_publicacoes: 'rc.total_publicacoes',
    taxa_engajamento: 'rc.taxa_engajamento',
    registrado_em: 'rc.registrado_em',
  },
  publicacoes: {
    id: 'p.id',
    conta: 'cs.nome_conta',
    titulo: 'p.titulo',
    tipo: 'p.tipo_post',
    status: 'p.status',
    criado_em: 'p.criado_em',
    atualizado_em: 'p.atualizado_em',
  },
  metricas: {
    id_publicacao: 'p.id',
    curtidas: 'SUM(mp.curtidas)',
    comentarios: 'SUM(mp.comentarios)',
    compartilhamentos: 'SUM(mp.compartilhamentos)',
    visualizacoes: 'SUM(mp.visualizacoes)',
    impressoes: 'SUM(mp.impressoes)',
    taxa_engajamento: "(SUM(mp.curtidas + mp.comentarios + mp.compartilhamentos)::numeric / NULLIF(SUM(mp.impressoes), 0))",
    ultimo_registro: 'MAX(mp.registrado_em)'
  }
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

    const plataforma = searchParams.get('plataforma') || undefined; // contas/publicacoes
    const conta_id = searchParams.get('conta_id') || undefined; // conta_social_id
    const status = searchParams.get('status') || undefined; // publicacoes
    const tipo = searchParams.get('tipo') || undefined; // publicacoes.tipo_post

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
    let groupBy = '';
    let whereDateCol = '';

    if (view === 'contas') {
      selectSql = `SELECT cs.id AS id,
                          cs.nome_conta AS conta,
                          cs.plataforma AS plataforma,
                          cs.imagem_url AS plataforma_imagem_url,
                          rc.seguidores AS seguidores,
                          rc.seguindo AS seguindo,
                          rc.total_publicacoes AS total_publicacoes,
                          ROUND(rc.taxa_engajamento::numeric, 2) AS taxa_engajamento,
                          rc.registrado_em AS registrado_em`;
      baseSql = `FROM marketing.contas_sociais cs
                 LEFT JOIN marketing.resumos_conta rc ON rc.conta_social_id = cs.id`;
      whereDateCol = 'rc.registrado_em';
      if (plataforma) push('LOWER(cs.plataforma) =', plataforma.toLowerCase());
      if (conta_id) push('cs.id =', conta_id);
      if (q) {
        conditions.push(`(cs.nome_conta ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'publicacoes') {
      selectSql = `SELECT p.id AS id,
                          cs.nome_conta AS conta,
                          p.titulo AS titulo,
                          p.tipo_post AS tipo,
                          p.status AS status,
                          p.legenda AS legenda,
                          ARRAY_TO_STRING(p.hashtags, ', ') AS hashtags,
                          p.criado_em AS criado_em,
                          p.atualizado_em AS atualizado_em`;
      baseSql = `FROM marketing.publicacoes p
                 LEFT JOIN marketing.contas_sociais cs ON p.conta_social_id = cs.id`;
      whereDateCol = 'p.criado_em';
      if (plataforma) push('LOWER(cs.plataforma) =', plataforma.toLowerCase());
      if (conta_id) push('p.conta_social_id =', conta_id);
      if (status) push('LOWER(p.status) =', status.toLowerCase());
      if (tipo) push('LOWER(p.tipo_post) =', tipo.toLowerCase());
      if (q) {
        conditions.push(`(p.titulo ILIKE '%' || $${i} || '%' OR COALESCE(p.legenda,'') ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'metricas') {
      selectSql = `SELECT p.id AS id_publicacao,
                          cs.nome_conta AS conta,
                          p.titulo AS titulo,
                          p.tipo_post AS tipo,
                          COALESCE(SUM(mp.curtidas), 0) AS curtidas,
                          COALESCE(SUM(mp.comentarios), 0) AS comentarios,
                          COALESCE(SUM(mp.compartilhamentos), 0) AS compartilhamentos,
                          COALESCE(SUM(mp.visualizacoes), 0) AS visualizacoes,
                          COALESCE(SUM(mp.impressoes), 0) AS impressoes,
                          ROUND((COALESCE(SUM(mp.curtidas + mp.comentarios + mp.compartilhamentos),0)::numeric / NULLIF(COALESCE(SUM(mp.impressoes),0), 0)) * 100, 2) AS taxa_engajamento,
                          MAX(mp.registrado_em) AS ultimo_registro`;
      baseSql = `FROM marketing.metricas_publicacoes mp
                 LEFT JOIN marketing.publicacoes p ON mp.publicacao_id = p.id
                 LEFT JOIN marketing.contas_sociais cs ON p.conta_social_id = cs.id`;
      whereDateCol = 'mp.registrado_em';
      groupBy = 'GROUP BY p.id, cs.nome_conta, p.titulo, p.tipo_post';
      if (plataforma) push('LOWER(cs.plataforma) =', plataforma.toLowerCase());
      if (conta_id) push('p.conta_social_id =', conta_id);
      if (tipo) push('LOWER(p.tipo_post) =', tipo.toLowerCase());
      if (q) {
        conditions.push(`(p.titulo ILIKE '%' || $${i} || '%' OR cs.nome_conta ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 });
    }

    if (de && whereDateCol) push(`${whereDateCol} >=`, de);
    if (ate && whereDateCol) push(`${whereDateCol} <=`, ate);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderClause = '';
    if (Object.keys(ORDER_BY_WHITELIST[view] || {}).length) {
      if (orderBy) orderClause = `ORDER BY ${orderBy} ${orderDir}`;
      else {
        if (view === 'contas') orderClause = 'ORDER BY rc.registrado_em DESC NULLS LAST';
        else if (view === 'publicacoes') orderClause = 'ORDER BY p.criado_em DESC';
        else if (view === 'metricas') orderClause = 'ORDER BY taxa_engajamento DESC NULLS LAST';
      }
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
    console.error('📣 API /api/modulos/marketing error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
