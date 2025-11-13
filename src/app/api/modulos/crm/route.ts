import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  oportunidades: {
    oportunidade: 'o.id',
    lead: 'l.nome',
    lead_empresa: 'l.empresa',
    cliente: 'cli.nome_fantasia',
    vendedor: 'f.nome',
    territorio: 't.nome',
    fase: 'fp.nome',
    ordem_fase: 'fp.ordem',
    valor_estimado: 'o.valor_estimado',
    probabilidade: 'o.probabilidade',
    data_prevista: 'o.data_prevista',
    status: 'o.status',
    criado_em: 'o.criado_em',
    atualizado_em: 'o.atualizado_em',
  },
  leads: {
    lead: 'l.id',
    nome: 'l.nome',
    empresa: 'l.empresa',
    email: 'l.email',
    telefone: 'l.telefone',
    origem: 'l.origem',
    responsavel: 'l.responsavel',
    status: 'l.status',
    tag: 'l.tag',
    criado_em: 'l.criado_em',
    atualizado_em: 'l.atualizado_em',
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
    const responsavel_id = searchParams.get('responsavel_id') || undefined; // usuarioid

    // Specific filters
    const status = searchParams.get('status') || undefined;
    const origem = searchParams.get('origem') || undefined;

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
    const groupBy = '';
    let whereDateCol = '';

    if (view === 'oportunidades') {
      selectSql = `SELECT
        o.id AS oportunidade,
        l.nome AS lead,
        l.empresa AS lead_empresa,
        cli.nome_fantasia AS cliente,
        f.nome AS vendedor,
        t.nome AS territorio,
        fp.nome AS fase,
        fp.ordem AS ordem_fase,
        fp.probabilidade_padrao AS probabilidade_fase,
        o.valor_estimado,
        o.probabilidade,
        o.data_prevista,
        o.status,
        mp.nome AS motivo_perda,
        o.descricao,
        o.criado_em,
        o.atualizado_em`;
      baseSql = `FROM crm.oportunidades o
        LEFT JOIN crm.leads l ON l.id = o.lead_id
        LEFT JOIN entidades.clientes cli ON cli.id = o.cliente_id
        LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
        LEFT JOIN comercial.territorios t ON t.id = o.territorio_id
        LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
        LEFT JOIN crm.motivos_perda mp ON mp.id = o.motivo_perda_id`;
      whereDateCol = 'o.data_prevista';
      if (status) push('LOWER(o.status) =', status.toLowerCase());
      if (responsavel_id) push('v.funcionario_id =', responsavel_id);
      if (q) {
        conditions.push(`(l.nome ILIKE '%' || $${i} || '%' OR l.empresa ILIKE '%' || $${i} || '%' OR cli.nome_fantasia ILIKE '%' || $${i} || '%' OR f.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'leads') {
      selectSql = `SELECT
        l.id AS lead,
        l.nome,
        l.empresa,
        l.email,
        l.telefone,
        l.origem,
        l.responsavel,
        l.status,
        l.tag,
        l.descricao,
        l.criado_em,
        l.atualizado_em`;
      baseSql = `FROM crm.leads l`;
      if (status) push('LOWER(l.status) =', status.toLowerCase());
      if (origem) push('LOWER(l.origem) =', origem.toLowerCase());
      if (responsavel_id) push('l.responsavel ILIKE', `%${responsavel_id}%`);
      if (q) {
        conditions.push(`(l.nome ILIKE '%' || $${i} || '%' OR l.empresa ILIKE '%' || $${i} || '%' OR l.email ILIKE '%' || $${i} || '%' OR l.responsavel ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 });
    }

    if (de && whereDateCol) push(`${whereDateCol} >=`, de);
    if (ate && whereDateCol) push(`${whereDateCol} <=`, ate);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Default ordering when not provided
    let orderClause = '';
    if (ORDER_BY_WHITELIST[view] && Object.keys(ORDER_BY_WHITELIST[view]).length) {
      if (orderBy) orderClause = `ORDER BY ${orderBy} ${orderDir}`;
      else {
        if (view === 'oportunidades') orderClause = 'ORDER BY o.id DESC';
        else if (view === 'leads') orderClause = 'ORDER BY l.criado_em DESC';
      }
    }

    const limitOffset = `LIMIT $${i}::int OFFSET $${i + 1}::int`;
    const paramsWithPage = [...params, pageSize, offset];

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${groupBy}
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
    console.error('📇 API /api/modulos/crm error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

