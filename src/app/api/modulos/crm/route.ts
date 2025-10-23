import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  oportunidades: {
    id: 'o.oportunidadeid',
    oportunidade: 'o.nome',
    conta: 'c.nome',
    responsavel: 'u.nome',
    estagio: 'o.estagio',
    valor: 'o.valor',
    probabilidade: 'o.probabilidade',
    data_fechamento: 'o.datadefechamento',
    prioridade: 'prioridade',
  },
  leads: {
    id: 'l.leadid',
    lead: 'l.primeironome',
    empresa: 'l.empresa',
    email: 'l.email',
    telefone: 'l.telefone',
    origem: 'l.fontedolead',
    status: 'l.status',
    responsavel: 'u.nome',
  },
  contas: {
    id: 'c.contaid',
    conta: 'c.nome',
    setor: 'c.setor',
    site: 'c.site',
    telefone: 'c.telefone',
    responsavel: 'u.nome',
  },
  contatos: {
    id: 'ct.contatoid',
    contato: 'ct.primeironome',
    cargo: 'ct.cargo',
    email: 'ct.email',
    telefone: 'ct.telefone',
    conta: 'c.nome',
    responsavel: 'u.nome',
  },
  atividades: {
    id: 'a.atividadeid',
    assunto: 'a.assunto',
    tipo: 'a.tipo',
    status: 'a.status',
    data_vencimento: 'a.datadevencimento',
    responsavel: 'u.nome',
  },
  campanhas: {
    id: 'camp.campanhaid',
    campanha: 'camp.nome',
    tipo: 'camp.tipo',
    status: 'camp.status',
    inicio: 'camp.datainicio',
    fim: 'camp.datafim',
    responsavel: 'u.nome',
    total_membros: 'total_membros',
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
    const estagio = searchParams.get('estagio') || undefined;
    const prob_min = parseNumber(searchParams.get('prob_min'));
    const prob_max = parseNumber(searchParams.get('prob_max'));
    const valor_min = parseNumber(searchParams.get('valor_min'));
    const valor_max = parseNumber(searchParams.get('valor_max'));
    const origem = searchParams.get('origem') || undefined;
    const setor = searchParams.get('setor') || undefined;
    const conta_id = searchParams.get('conta_id') || undefined;
    const oportunidade_id = searchParams.get('oportunidade_id') || undefined;
    const lead_id = searchParams.get('lead_id') || undefined;
    const contato_id = searchParams.get('contato_id') || undefined;
    const tipo = searchParams.get('tipo') || undefined; // atividades/campanhas

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
    let groupBy = '';
    let whereDateCol = '';

    if (view === 'oportunidades') {
      selectSql = `SELECT o.oportunidadeid AS id,
                          o.nome AS oportunidade,
                          c.nome AS conta,
                          u.nome AS responsavel,
                          o.estagio,
                          o.valor,
                          o.probabilidade,
                          o.datadefechamento AS data_fechamento,
                          CASE WHEN o.probabilidade >= 80 THEN 'Alta'
                               WHEN o.probabilidade >= 50 THEN 'Média'
                               ELSE 'Baixa' END AS prioridade`;
      baseSql = `FROM crm.oportunidades o
                 LEFT JOIN crm.contas c ON o.contaid = c.contaid
                 LEFT JOIN gestaovendas.vendedores u ON o.usuarioid = u.id`;
      whereDateCol = 'o.datadefechamento';
      if (status) push('LOWER(o.status) =', status.toLowerCase());
      if (estagio) push('LOWER(o.estagio) =', estagio.toLowerCase());
      if (prob_min !== undefined) push('o.probabilidade >=', prob_min);
      if (prob_max !== undefined) push('o.probabilidade <=', prob_max);
      if (valor_min !== undefined) push('o.valor >=', valor_min);
      if (valor_max !== undefined) push('o.valor <=', valor_max);
      if (responsavel_id) push('o.usuarioid =', responsavel_id);
      if (q) {
        conditions.push(`(o.nome ILIKE '%' || $${i} || '%' OR c.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'leads') {
      selectSql = `SELECT l.leadid AS id,
                          (l.primeironome || ' ' || l.sobrenome) AS lead,
                          l.empresa,
                          l.email,
                          l.telefone,
                          l.fontedolead AS origem,
                          l.status,
                          u.nome AS responsavel`;
      baseSql = `FROM crm.leads l
                 LEFT JOIN gestaovendas.vendedores u ON l.usuarioid = u.id`;
      if (status) push('LOWER(l.status) =', status.toLowerCase());
      if (origem) push('LOWER(l.fontedolead) =', origem.toLowerCase());
      if (responsavel_id) push('l.usuarioid =', responsavel_id);
      if (q) {
        conditions.push(`(l.primeironome ILIKE '%' || $${i} || '%' OR l.sobrenome ILIKE '%' || $${i} || '%' OR l.empresa ILIKE '%' || $${i} || '%' OR l.email ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'contas') {
      selectSql = `SELECT c.contaid AS id,
                          c.nome AS conta,
                          c.setor,
                          c.site,
                          c.telefone,
                          c.enderecocobranca AS endereco_cobranca,
                          u.nome AS responsavel`;
      baseSql = `FROM crm.contas c
                 LEFT JOIN gestaovendas.vendedores u ON c.usuarioid = u.id`;
      if (setor) push('LOWER(c.setor) =', setor.toLowerCase());
      if (responsavel_id) push('c.usuarioid =', responsavel_id);
      if (q) {
        conditions.push(`(c.nome ILIKE '%' || $${i} || '%' OR c.site ILIKE '%' || $${i} || '%' OR c.telefone ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'contatos') {
      selectSql = `SELECT ct.contatoid AS id,
                          (ct.primeironome || ' ' || ct.sobrenome) AS contato,
                          ct.cargo,
                          ct.email,
                          ct.telefone,
                          c.nome AS conta,
                          u.nome AS responsavel`;
      baseSql = `FROM crm.contatos ct
                 LEFT JOIN crm.contas c ON ct.contaid = c.contaid
                 LEFT JOIN gestaovendas.vendedores u ON ct.usuarioid = u.id`;
      if (conta_id) push('ct.contaid =', conta_id);
      if (responsavel_id) push('ct.usuarioid =', responsavel_id);
      if (q) {
        conditions.push(`(ct.primeironome ILIKE '%' || $${i} || '%' OR ct.sobrenome ILIKE '%' || $${i} || '%' OR ct.email ILIKE '%' || $${i} || '%' OR ct.telefone ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'atividades') {
      selectSql = `SELECT a.atividadeid AS id,
                          a.assunto,
                          a.tipo,
                          a.status,
                          a.datadevencimento AS data_vencimento,
                          COALESCE(c.nome, '—') AS conta,
                          COALESCE(ct.primeironome || ' ' || ct.sobrenome, '—') AS contato,
                          COALESCE(l.primeironome || ' ' || l.sobrenome, '—') AS lead,
                          COALESCE(o.nome, '—') AS oportunidade,
                          u.nome AS responsavel,
                          a.anotacoes`;
      baseSql = `FROM crm.atividades a
                 LEFT JOIN crm.contas c ON a.contaid = c.contaid
                 LEFT JOIN crm.contatos ct ON a.contatoid = ct.contatoid
                 LEFT JOIN crm.leads l ON a.leadid = l.leadid
                 LEFT JOIN crm.oportunidades o ON a.oportunidadeid = o.oportunidadeid
                 LEFT JOIN gestaovendas.vendedores u ON a.usuarioid = u.id`;
      whereDateCol = 'a.datadevencimento';
      if (status) push('LOWER(a.status) =', status.toLowerCase());
      if (tipo) push('LOWER(a.tipo) =', tipo.toLowerCase());
      if (responsavel_id) push('a.usuarioid =', responsavel_id);
      if (oportunidade_id) push('a.oportunidadeid =', oportunidade_id);
      if (conta_id) push('a.contaid =', conta_id);
      if (lead_id) push('a.leadid =', lead_id);
      if (contato_id) push('a.contatoid =', contato_id);
      if (q) {
        conditions.push(`(a.assunto ILIKE '%' || $${i} || '%' OR a.anotacoes ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'campanhas') {
      selectSql = `SELECT camp.campanhaid AS id,
                          camp.nome AS campanha,
                          camp.tipo,
                          camp.status,
                          camp.datainicio AS inicio,
                          camp.datafim AS fim,
                          u.nome AS responsavel,
                          COUNT(DISTINCT mc.contatoid) + COUNT(DISTINCT mc.leadid) AS total_membros`;
      baseSql = `FROM crm.campanhas camp
                 LEFT JOIN crm.membrosdecampanha mc ON camp.campanhaid = mc.campanhaid
                 LEFT JOIN gestaovendas.vendedores u ON camp.usuarioid = u.id`;
      whereDateCol = 'camp.datainicio';
      if (status) push('LOWER(camp.status) =', status.toLowerCase());
      if (tipo) push('LOWER(camp.tipo) =', tipo.toLowerCase());
      if (responsavel_id) push('camp.usuarioid =', responsavel_id);
      if (q) {
        conditions.push(`(camp.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
      groupBy = 'GROUP BY camp.campanhaid, camp.nome, camp.tipo, camp.status, camp.datainicio, camp.datafim, u.nome';
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
        if (view === 'oportunidades') orderClause = 'ORDER BY o.datadefechamento DESC NULLS LAST';
        else if (view === 'leads') orderClause = 'ORDER BY l.status ASC, l.primeironome ASC';
        else if (view === 'contas') orderClause = 'ORDER BY c.nome ASC';
        else if (view === 'contatos') orderClause = 'ORDER BY ct.primeironome ASC';
        else if (view === 'atividades') orderClause = 'ORDER BY a.datadevencimento DESC NULLS LAST';
        else if (view === 'campanhas') orderClause = 'ORDER BY camp.datainicio DESC';
      }
    }

    const limitOffset = view === 'campanhas' ? '' : `LIMIT $${i}::int OFFSET $${i + 1}::int`;
    const paramsWithPage = limitOffset ? [...params, pageSize, offset] : params;

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
    console.error('📇 API /api/modulos/crm error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

