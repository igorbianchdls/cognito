import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  'ordens-servico': {
    id: 'os.id',
    numero_os: 'os.numero_os',
    cliente: 'c.nome_fantasia',
    tecnico_responsavel: 't.nome',
    status: 'os.status',
    prioridade: 'os.prioridade',
    data_abertura: 'os.data_abertura',
    data_prevista: 'os.data_prevista',
    data_conclusao: 'os.data_conclusao',
    valor_estimado: 'os.valor_estimado',
    valor_final: 'os.valor_final',
  },
  tecnicos: {
    id: 'tec.id',
    tecnico: 'tec.nome',
    cargo: 'tec.cargo',
    especialidade: 'tec.especialidade',
    custo_hora: 'tec.custo_hora',
    status: 'tec.status',
    admissao: 'tec.data_admissao',
  },
  clientes: {
    id: 'c.id',
    cliente: 'c.nome_fantasia',
    segmento: 'c.segmento',
    status: 'c.status',
    total_ordens: 'total_ordens',
    ultima_os: 'ultima_os',
  },
  agendamentos: {
    id: 'ag.id',
    numero_os: 'os.numero_os',
    tecnico: 't.nome',
    data_agendada: 'ag.data_agendada',
    data_inicio: 'ag.data_inicio',
    data_fim: 'ag.data_fim',
    status: 'ag.status',
  },
  servicos: {
    id: 's.id',
    servico: 's.nome',
    categoria: 's.categoria',
    preco_base: 's.preco_base',
    status: 's.ativo',
    criado_em: 's.criado_em',
    atualizado_em: 's.atualizado_em',
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
    const prioridade = searchParams.get('prioridade') || undefined;
    const cliente_id = searchParams.get('cliente_id') || undefined;
    const tecnico_id = searchParams.get('tecnico_id') || undefined;
    const valor_min = parseNumber(searchParams.get('valor_min'));
    const valor_max = parseNumber(searchParams.get('valor_max'));
    const categoria = searchParams.get('categoria') || undefined;
    const ativo = searchParams.get('ativo') || undefined; // 'true'|'false'

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

    if (view === 'ordens-servico') {
      selectSql = `SELECT os.id AS id,
                          os.numero_os,
                          c.nome_fantasia AS cliente,
                          t.nome AS tecnico_responsavel,
                          os.status,
                          os.prioridade,
                          os.descricao_problema,
                          os.data_abertura,
                          os.data_prevista,
                          os.data_conclusao,
                          os.valor_estimado,
                          os.valor_final,
                          os.observacoes`;
      baseSql = `FROM servicos.ordens_servico os
                 LEFT JOIN servicos.clientes c ON os.cliente_id = c.id
                 LEFT JOIN servicos.tecnicos t ON os.tecnico_responsavel_id = t.id`;
      whereDateCol = 'os.data_abertura';
      if (status) push('LOWER(os.status) =', status.toLowerCase());
      if (prioridade) push('LOWER(os.prioridade) =', prioridade.toLowerCase());
      if (cliente_id) push('os.cliente_id =', cliente_id);
      if (tecnico_id) push('os.tecnico_responsavel_id =', tecnico_id);
      if (valor_min !== undefined) push('os.valor_final >=', valor_min);
      if (valor_max !== undefined) push('os.valor_final <=', valor_max);
      if (q) {
        conditions.push(`(os.numero_os ILIKE '%' || $${i} || '%' OR c.nome_fantasia ILIKE '%' || $${i} || '%' OR t.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'tecnicos') {
      selectSql = `SELECT tec.id AS id,
                          tec.nome AS tecnico,
                          tec.cargo,
                          tec.especialidade,
                          tec.custo_hora,
                          tec.telefone,
                          tec.email,
                          tec.status,
                          COUNT(DISTINCT os.id) AS ordens_servico,
                          COALESCE(SUM(ht.horas), 0) AS horas_trabalhadas,
                          tec.data_admissao AS admissao`;
      baseSql = `FROM servicos.tecnicos tec
                 LEFT JOIN servicos.ordens_servico os ON os.tecnico_responsavel_id = tec.id
                 LEFT JOIN servicos.horas_trabalhadas ht ON ht.tecnico_id = tec.id`;
      whereDateCol = 'tec.data_admissao';
      groupBy = 'GROUP BY tec.id, tec.nome, tec.cargo, tec.especialidade, tec.custo_hora, tec.telefone, tec.email, tec.status, tec.data_admissao';
      if (status) push('LOWER(tec.status) =', status.toLowerCase());
      if (q) {
        conditions.push(`(tec.nome ILIKE '%' || $${i} || '%' OR tec.especialidade ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'clientes') {
      selectSql = `SELECT c.id AS id,
                          c.nome_fantasia AS cliente,
                          c.segmento,
                          c.telefone,
                          c.email,
                          (c.cidade || ' - ' || c.estado) AS cidade_uf,
                          c.status,
                          COUNT(DISTINCT os.id) AS total_ordens,
                          MAX(os.data_abertura) AS ultima_os`;
      baseSql = `FROM servicos.clientes c
                 LEFT JOIN servicos.ordens_servico os ON os.cliente_id = c.id`;
      whereDateCol = 'os.data_abertura';
      groupBy = 'GROUP BY c.id, c.nome_fantasia, c.segmento, c.telefone, c.email, c.cidade, c.estado, c.status';
      if (status) push('LOWER(c.status) =', status.toLowerCase());
      if (q) {
        conditions.push(`(c.nome_fantasia ILIKE '%' || $${i} || '%' OR c.email ILIKE '%' || $${i} || '%' OR c.telefone ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'agendamentos') {
      selectSql = `SELECT ag.id AS id,
                          os.numero_os AS numero_os,
                          t.nome AS tecnico,
                          ag.data_agendada,
                          ag.data_inicio,
                          ag.data_fim,
                          ag.status,
                          ag.observacoes`;
      baseSql = `FROM servicos.agendamentos_servico ag
                 LEFT JOIN servicos.ordens_servico os ON ag.ordem_servico_id = os.id
                 LEFT JOIN servicos.tecnicos t ON ag.tecnico_id = t.id`;
      whereDateCol = 'ag.data_agendada';
      if (status) push('LOWER(ag.status) =', status.toLowerCase());
      if (tecnico_id) push('ag.tecnico_id =', tecnico_id);
      if (q) {
        conditions.push(`(os.numero_os ILIKE '%' || $${i} || '%' OR t.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'servicos') {
      selectSql = `SELECT s.id AS id,
                          s.nome AS servico,
                          s.descricao,
                          s.categoria,
                          s.unidade_medida,
                          s.preco_base,
                          CASE WHEN s.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
                          s.criado_em,
                          s.atualizado_em`;
      baseSql = `FROM servicos.servicos s`;
      whereDateCol = 's.criado_em';
      if (categoria) push('LOWER(s.categoria) =', categoria.toLowerCase());
      if (ativo) push('CAST(s.ativo AS TEXT) =', ativo);
      if (q) {
        conditions.push(`(s.nome ILIKE '%' || $${i} || '%' OR s.descricao ILIKE '%' || $${i} || '%')`);
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
      if (view === 'ordens-servico') orderClause = 'ORDER BY os.data_abertura DESC';
      else if (view === 'tecnicos') orderClause = 'ORDER BY tec.nome ASC';
      else if (view === 'clientes') orderClause = 'ORDER BY ultima_os DESC NULLS LAST';
      else if (view === 'agendamentos') orderClause = 'ORDER BY ag.data_agendada DESC';
      else if (view === 'servicos') orderClause = 'ORDER BY s.categoria ASC, s.nome ASC';
    }

    const paginate = !(view === 'tecnicos' || view === 'clientes');
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
    if (!groupBy && !paginate) {
      // no count for non-paginated views
    } else if (!groupBy) {
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
    console.error('🛠️ API /api/modulos/servicos error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

