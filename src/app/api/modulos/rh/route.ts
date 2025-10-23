import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  funcionarios: {
    id: 'f.funcionarioid',
    funcionario: 'f.nomecompleto',
    cargo: 'c.nome',
    departamento: 'd.nome',
    gestor_direto: 'g.nomecompleto',
    email_corporativo: 'f.emailcorporativo',
    telefone: 'f.telefonecorporativo',
    status: 'f.status',
    data_nascimento: 'f.datanascimento',
    data_criacao: 'f.datadecriacao',
  },
  departamentos: {
    id: 'd.departamentoid',
    departamento: 'd.nome',
    departamento_pai: 'dp.nome',
    gestor: 'g.nomecompleto',
    qtd_funcionarios: 'qtd_funcionarios',
  },
  cargos: {
    id: 'c.cargoid',
    cargo: 'c.nome',
    descricao: 'c.descricao',
    qtd_funcionarios: 'qtd_funcionarios',
  },
  'tipos-ausencia': {
    id: 'ta.tipoausenciaid',
    tipo_de_ausencia: 'ta.nome',
    desconta_saldo_ferias: 'ta.descontadosaldodeferias',
  },
  contratos: {
    id: 'ct.contratoid',
    funcionario: 'f.nomecompleto',
    tipo_de_contrato: 'ct.tipodecontrato',
    admissao: 'ct.dataadmissao',
    demissao: 'ct.datademissao',
    status: 'ct.status',
  },
  'historico-salarial': {
    id: 'hs.historicosalarialid',
    funcionario: 'f.nomecompleto',
    salario_base: 'hs.salariobase',
    tipo_de_pagamento: 'hs.tipodepagamento',
    inicio_vigencia: 'hs.datainiciovigencia',
    fim_vigencia: 'hs.datafimvigencia',
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

    const status = searchParams.get('status') || undefined;
    const cargo_id = searchParams.get('cargo_id') || undefined;
    const departamento_id = searchParams.get('departamento_id') || undefined;
    const gestor_id = searchParams.get('gestor_id') || undefined;

    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1);
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 20) || 20));
    const offset = (page - 1) * pageSize;

    const orderByParam = (searchParams.get('order_by') || '').toLowerCase();
    const orderDirParam = (searchParams.get('order_dir') || 'asc').toLowerCase();
    const whitelist = ORDER_BY_WHITELIST[view] || {};
    const orderBy = whitelist[orderByParam] || undefined;
    const orderDir = orderDirParam === 'desc' ? 'DESC' : 'ASC';

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

    if (view === 'funcionarios') {
      selectSql = `SELECT f.funcionarioid AS id,
                          f.nomecompleto AS funcionario,
                          c.nome AS cargo,
                          d.nome AS departamento,
                          g.nomecompleto AS gestor_direto,
                          f.emailcorporativo AS email_corporativo,
                          f.telefonecorporativo AS telefone,
                          f.status,
                          f.datanascimento AS data_nascimento,
                          f.datadecriacao AS data_criacao`;
      baseSql = `FROM recursoshumanos.funcionarios f
                 LEFT JOIN recursoshumanos.cargos c ON f.cargoid = c.cargoid
                 LEFT JOIN recursoshumanos.departamentos d ON f.departamentoid = d.departamentoid
                 LEFT JOIN recursoshumanos.funcionarios g ON f.gestordiretoid = g.funcionarioid`;
      whereDateCol = 'f.datadecriacao';
      if (status) push('LOWER(f.status) =', status.toLowerCase());
      if (cargo_id) push('f.cargoid =', cargo_id);
      if (departamento_id) push('f.departamentoid =', departamento_id);
      if (gestor_id) push('f.gestordiretoid =', gestor_id);
      if (q) {
        conditions.push(`(f.nomecompleto ILIKE '%' || $${i} || '%' OR f.emailcorporativo ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'departamentos') {
      selectSql = `SELECT d.departamentoid AS id,
                          d.nome AS departamento,
                          dp.nome AS departamento_pai,
                          g.nomecompleto AS gestor,
                          COUNT(f.funcionarioid) AS qtd_funcionarios`;
      baseSql = `FROM recursoshumanos.departamentos d
                 LEFT JOIN recursoshumanos.departamentos dp ON d.departamentopaiid = dp.departamentoid
                 LEFT JOIN recursoshumanos.funcionarios g ON d.gestorid = g.funcionarioid
                 LEFT JOIN recursoshumanos.funcionarios f ON f.departamentoid = d.departamentoid`;
      groupBy = 'GROUP BY d.departamentoid, d.nome, dp.nome, g.nomecompleto';
      if (q) {
        conditions.push(`(d.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'cargos') {
      selectSql = `SELECT c.cargoid AS id,
                          c.nome AS cargo,
                          c.descricao,
                          COUNT(f.funcionarioid) AS qtd_funcionarios`;
      baseSql = `FROM recursoshumanos.cargos c
                 LEFT JOIN recursoshumanos.funcionarios f ON f.cargoid = c.cargoid`;
      groupBy = 'GROUP BY c.cargoid, c.nome, c.descricao';
      if (q) {
        conditions.push(`(c.nome ILIKE '%' || $${i} || '%' OR c.descricao ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'tipos-ausencia') {
      selectSql = `SELECT ta.tipoausenciaid AS id,
                          ta.nome AS tipo_de_ausencia,
                          CASE WHEN ta.descontadosaldodeferias THEN 'Sim' ELSE 'Não' END AS desconta_saldo_ferias`;
      baseSql = `FROM recursoshumanos.tiposdeausencia ta`;
      if (q) {
        conditions.push(`(ta.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'contratos') {
      selectSql = `SELECT ct.contratoid AS id,
                          f.nomecompleto AS funcionario,
                          ct.tipodecontrato AS tipo_de_contrato,
                          ct.dataadmissao AS admissao,
                          ct.datademissao AS demissao,
                          ct.status`;
      baseSql = `FROM recursoshumanos.contratos ct
                 LEFT JOIN recursoshumanos.funcionarios f ON ct.funcionarioid = f.funcionarioid`;
      whereDateCol = 'ct.dataadmissao';
      if (status) push('LOWER(ct.status) =', status.toLowerCase());
      if (q) {
        conditions.push(`(f.nomecompleto ILIKE '%' || $${i} || '%' OR ct.tipodecontrato ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'historico-salarial') {
      selectSql = `SELECT hs.historicosalarialid AS id,
                          f.nomecompleto AS funcionario,
                          hs.salariobase AS salario_base,
                          hs.tipodepagamento AS tipo_de_pagamento,
                          hs.datainiciovigencia AS inicio_vigencia,
                          hs.datafimvigencia AS fim_vigencia`;
      baseSql = `FROM recursoshumanos.historicosalarial hs
                 LEFT JOIN recursoshumanos.contratos ct ON hs.contratoid = ct.contratoid
                 LEFT JOIN recursoshumanos.funcionarios f ON ct.funcionarioid = f.funcionarioid`;
      whereDateCol = 'hs.datainiciovigencia';
      if (q) {
        conditions.push(`(f.nomecompleto ILIKE '%' || $${i} || '%')`);
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
    if (orderBy) orderClause = `ORDER BY ${orderBy} ${orderDir}`;
    else {
      if (view === 'funcionarios') orderClause = 'ORDER BY f.nomecompleto ASC';
      else if (view === 'departamentos') orderClause = 'ORDER BY d.nome ASC';
      else if (view === 'cargos') orderClause = 'ORDER BY c.nome ASC';
      else if (view === 'tipos-ausencia') orderClause = 'ORDER BY ta.nome ASC';
      else if (view === 'contratos') orderClause = 'ORDER BY ct.dataadmissao DESC';
      else if (view === 'historico-salarial') orderClause = 'ORDER BY hs.datainiciovigencia DESC';
    }

    const paginate = !(view === 'departamentos' || view === 'cargos');
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
    if (!groupBy && paginate) {
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
    console.error('👥 API /api/modulos/rh error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
