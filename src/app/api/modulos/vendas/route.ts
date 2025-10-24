import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  pedidos: {
    id: 'p.id',
    numero_pedido: 'p.numero_pedido',
    cliente: 'c.nome',
    canal_venda: 'cv.nome',
    vendedor: 'v.nome',
    status: 'p.status',
    data_pedido: 'p.data_pedido',
    valor_total_pedido: 'p.valor_total',
    created_at: 'p.created_at',
  },
  clientes: {
    id: 'c.id',
    cliente: 'c.nome',
    vendedor_responsavel: 'v.nome',
    territorio: 't.nome',
    status_cliente: 'c.status_cliente',
    cliente_desde: 'c.cliente_desde',
    data_ultima_compra: 'c.data_ultima_compra',
    faturamento_estimado_anual: 'c.faturamento_estimado_anual',
  },
  territorios: {
    id: 't.id',
    territorio: 't.nome',
    created_at: 't.created_at',
  },
  equipes: {
    id: 'eq.id',
    equipe: 'eq.nome',
    created_at: 'eq.created_at',
  },
  canais: {
    id: 'cv.id',
    canal_venda: 'cv.nome',
    qtd_pedidos: 'qtd_pedidos',
    total_vendido: 'total_vendido',
    primeira_venda: 'primeira_venda',
    ultima_venda: 'ultima_venda',
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
    const status = searchParams.get('status') || undefined;
    const cliente_id = searchParams.get('cliente_id') || undefined;
    const vendedor_id = searchParams.get('vendedor_id') || undefined;
    const canal_venda_id = searchParams.get('canal_venda_id') || undefined;
    const valor_min = parseNumber(searchParams.get('valor_min'));
    const valor_max = parseNumber(searchParams.get('valor_max'));
    const ativo = searchParams.get('ativo') || undefined; // clientes/equipes
    const territorio_id = searchParams.get('territorio_id') || undefined; // clientes
    const q = searchParams.get('q') || undefined; // search

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

    if (view === 'pedidos') {
      selectSql = `SELECT p.id,
                          p.numero_pedido,
                          p.cliente_id AS cliente_id,
                          c.nome AS cliente,
                          c.segmento AS segmento_cliente,
                          c.imagem_url AS cliente_imagem_url,
                          p.canal_venda_id AS canal_id,
                          cv.nome AS canal_venda,
                          cv.imagem_url AS canal_imagem_url,
                          v.nome AS vendedor,
                          p.status,
                          p.data_pedido,
                          p.valor_produtos,
                          p.valor_frete,
                          p.valor_desconto,
                          p.valor_total AS valor_total_pedido,
                          (e.cidade || ' - ' || e.estado) AS cidade_uf,
                          p.created_at`;
      baseSql = `FROM gestaovendas.pedidos p
                 LEFT JOIN gestaovendas.clientes c ON p.cliente_id = c.id
                 LEFT JOIN gestaovendas.canais_venda cv ON p.canal_venda_id = cv.id
                 LEFT JOIN gestaovendas.vendedores v ON p.usuario_id = v.id
                 LEFT JOIN gestaovendas.enderecos_clientes e ON p.endereco_entrega_id = e.id`;
      whereDateCol = 'p.data_pedido';
      if (status) push('LOWER(p.status) =', status.toLowerCase());
      if (cliente_id) push('p.cliente_id =', cliente_id);
      if (vendedor_id) push('p.usuario_id =', vendedor_id);
      if (canal_venda_id) push('p.canal_venda_id =', canal_venda_id);
      if (valor_min !== undefined) push('p.valor_total >=', valor_min);
      if (valor_max !== undefined) push('p.valor_total <=', valor_max);
      if (q) {
        conditions.push(`(c.nome ILIKE '%' || $${i} || '%' OR p.numero_pedido ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'clientes') {
      selectSql = `SELECT c.id,
                          c.nome AS cliente,
                          COALESCE(c.nome_fantasia, c.razao_social) AS nome_fantasia_ou_razao,
                          c.cpf_cnpj,
                          c.email,
                          c.telefone,
                          v.nome AS vendedor_responsavel,
                          t.nome AS territorio,
                          c.canal_origem,
                          c.categoria_cliente,
                          c.status_cliente,
                          c.cliente_desde,
                          c.data_ultima_compra,
                          c.faturamento_estimado_anual,
                          c.frequencia_pedidos_mensal,
                          c.ativo`;
      baseSql = `FROM gestaovendas.clientes c
                 LEFT JOIN gestaovendas.vendedores v ON c.vendedor_id = v.id
                 LEFT JOIN gestaovendas.territorios_venda t ON c.territorio_id = t.id`;
      whereDateCol = 'c.cliente_desde';
      if (ativo) push('CAST(c.ativo AS TEXT) =', ativo);
      if (vendedor_id) push('c.vendedor_id =', vendedor_id);
      if (territorio_id) push('c.territorio_id =', territorio_id);
      if (status) push('LOWER(c.status_cliente) =', status.toLowerCase());
      if (q) {
        conditions.push(`(c.nome ILIKE '%' || $${i} || '%' OR c.cpf_cnpj ILIKE '%' || $${i} || '%' OR c.email ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'territorios') {
      selectSql = `SELECT t.id,
                          t.nome AS territorio,
                          COUNT(DISTINCT c.id) AS qtd_clientes,
                          COUNT(DISTINCT v.id) AS qtd_vendedores,
                          t.created_at`;
      baseSql = `FROM gestaovendas.territorios_venda t
                 LEFT JOIN gestaovendas.clientes c ON c.territorio_id = t.id
                 LEFT JOIN gestaovendas.vendedores v ON v.territorio_id = t.id`;
      whereDateCol = 't.created_at';
      groupBy = 'GROUP BY t.id, t.nome, t.created_at';
      if (q) {
        conditions.push(`(t.nome ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'equipes') {
      selectSql = `SELECT eq.id,
                          eq.nome AS equipe,
                          eq.descricao,
                          COUNT(DISTINCT v.id) AS qtd_vendedores,
                          STRING_AGG(DISTINCT t.nome, ', ') AS territorios_atendidos,
                          eq.ativo,
                          eq.created_at`;
      baseSql = `FROM gestaovendas.equipes_venda eq
                 LEFT JOIN gestaovendas.vendedores v ON v.equipe_id = eq.id
                 LEFT JOIN gestaovendas.territorios_venda t ON v.territorio_id = t.id`;
      whereDateCol = 'eq.created_at';
      groupBy = 'GROUP BY eq.id, eq.nome, eq.descricao, eq.ativo, eq.created_at';
      if (ativo) push('CAST(eq.ativo AS TEXT) =', ativo);
      if (q) {
        conditions.push(`(eq.nome ILIKE '%' || $${i} || '%' OR eq.descricao ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'canais') {
      selectSql = `SELECT cv.id,
                          cv.nome AS canal_venda,
                          COUNT(p.id) AS qtd_pedidos,
                          COALESCE(SUM(p.valor_total), 0) AS total_vendido,
                          MIN(p.data_pedido) AS primeira_venda,
                          MAX(p.data_pedido) AS ultima_venda`;
      baseSql = `FROM gestaovendas.canais_venda cv
                 LEFT JOIN gestaovendas.pedidos p ON p.canal_venda_id = cv.id`;
      whereDateCol = 'p.data_pedido';
      groupBy = 'GROUP BY cv.id, cv.nome';
      if (q) {
        conditions.push(`(cv.nome ILIKE '%' || $${i} || '%')`);
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
    if (orderBy) {
      orderClause = `ORDER BY ${orderBy} ${orderDir}`;
    } else {
      if (view === 'pedidos') orderClause = `ORDER BY ${whereDateCol} DESC`;
      else if (view === 'clientes') orderClause = 'ORDER BY c.nome ASC';
      else if (view === 'territorios') orderClause = 'ORDER BY t.nome ASC';
      else if (view === 'equipes') orderClause = 'ORDER BY eq.nome ASC';
      else if (view === 'canais') orderClause = 'ORDER BY cv.nome ASC';
    }
    const limitOffset = view === 'territorios' || view === 'equipes' || view === 'canais'
      ? ''
      : `LIMIT $${i}::int OFFSET $${i + 1}::int`;
    const paramsWithPage = (limitOffset ? [...params, pageSize, offset] : params);

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${groupBy}
                     ${orderClause}
                     ${limitOffset}`.replace(/\s+$/m, '').trim();

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage);

    // total: para agregações, usar COUNT do grupo; para demais, COUNT(*)
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
    console.error('🛒 API /api/modulos/vendas error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
