import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Safeguard: whitelist order-by columns per view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  fornecedores: {
    id: 'f.id',
    nome_fantasia: 'f.nome_fantasia',
    razao_social: 'f.razao_social',
    cnpj: 'f.cnpj',
    pais: 'f.pais',
    status: 'f.ativo',
    cadastrado_em: 'f.criado_em',
  },
  pedidos: {
    id: 'p.id',
    numero_pedido: 'p.numero_pedido',
    fornecedor: 'f.nome_fantasia',
    condicao_pagamento: 'cp.descricao',
    data_pedido: 'p.data_pedido',
    status: 'p.status',
    valor_total: 'p.valor_total',
  },
  recebimentos: {
    id: 'r.id',
    pedido: 'p.numero_pedido',
    fornecedor: 'f.nome_fantasia',
    data_recebimento: 'r.data_recebimento',
    nota_fiscal: 'r.numero_nota_fiscal',
    status: 'r.status',
  },
  'solicitacoes-compra': {
    id: 's.id',
    data_solicitacao: 's.data_solicitacao',
    status: 's.status',
    itens_solicitados: 'itens_solicitados',
  },
  'cotacoes-compra': {
    id: 'c.id',
    fornecedor: 'f.nome_fantasia',
    data_envio: 'c.data_envio',
    data_retorno: 'c.data_retorno',
    status: 'c.status',
    valor_cotado: 'valor_cotado',
  },
};

const parseNumber = (v: string | null, fb?: number) => (v ? Number(v) : fb);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let view = (searchParams.get('view') || '').toLowerCase();
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 });

    // Allow aliases
    if (view === 'solicitacoes' || view === 'solicitacoes-de-compra') view = 'solicitacoes-compra';
    if (view === 'cotacoes' || view === 'cotacoes-de-compra') view = 'cotacoes-compra';

    // Common filters
    const de = searchParams.get('de') || undefined; // YYYY-MM-DD
    const ate = searchParams.get('ate') || undefined; // YYYY-MM-DD
    const q = searchParams.get('q') || undefined; // search

    // Specific filters
    const status = searchParams.get('status') || undefined;
    const fornecedor_id = searchParams.get('fornecedor_id') || undefined;
    const condicao_pagamento_id = searchParams.get('condicao_pagamento_id') || undefined;
    const pedido_id = searchParams.get('pedido_id') || undefined;
    const nota = searchParams.get('nota') || undefined; // recebimentos
    const pais = searchParams.get('pais') || undefined; // fornecedores
    const ativo = searchParams.get('ativo') || undefined; // fornecedores: 'true'|'false'
    const valor_min = parseNumber(searchParams.get('valor_min'));
    const valor_max = parseNumber(searchParams.get('valor_max'));

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

    if (view === 'fornecedores') {
      selectSql = `SELECT f.id AS id,
                          f.nome_fantasia AS nome_fantasia,
                          f.razao_social AS razao_social,
                          f.cnpj AS cnpj,
                          (f.cidade || ' - ' || f.estado) AS cidade_uf,
                          f.telefone AS telefone,
                          f.email AS email,
                          f.pais AS pais,
                          CASE WHEN f.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
                          f.criado_em AS cadastrado_em`;
      baseSql = `FROM compras.fornecedores f`;
      whereDateCol = 'f.criado_em';
      if (status) push(`LOWER(CASE WHEN f.ativo THEN 'ativo' ELSE 'inativo' END) =`, status.toLowerCase());
      if (ativo) push('CAST(f.ativo AS TEXT) =', ativo);
      if (pais) push('LOWER(f.pais) =', pais.toLowerCase());
      if (q) {
        conditions.push(`(f.nome_fantasia ILIKE '%' || $${i} || '%' OR f.razao_social ILIKE '%' || $${i} || '%' OR f.cnpj ILIKE '%' || $${i} || '%' OR f.email ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'pedidos') {
      selectSql = `SELECT p.id AS id,
                          p.numero_pedido AS numero_pedido,
                          f.nome_fantasia AS fornecedor,
                          cp.descricao AS condicao_pagamento,
                          p.data_pedido AS data_pedido,
                          p.status AS status,
                          p.valor_total AS valor_total,
                          p.observacoes AS observacoes`;
      baseSql = `FROM compras.pedidos_compra p
                 LEFT JOIN compras.fornecedores f ON p.fornecedor_id = f.id
                 LEFT JOIN compras.condicoes_pagamento cp ON p.condicao_pagamento_id = cp.id`;
      whereDateCol = 'p.data_pedido';
      if (status) push('LOWER(p.status) =', status.toLowerCase());
      if (fornecedor_id) push('p.fornecedor_id =', fornecedor_id);
      if (condicao_pagamento_id) push('p.condicao_pagamento_id =', condicao_pagamento_id);
      if (valor_min !== undefined) push('p.valor_total >=', valor_min);
      if (valor_max !== undefined) push('p.valor_total <=', valor_max);
      if (q) {
        conditions.push(`(p.numero_pedido ILIKE '%' || $${i} || '%' OR COALESCE(p.observacoes,'') ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'recebimentos') {
      selectSql = `SELECT r.id AS id,
                          p.numero_pedido AS pedido,
                          f.nome_fantasia AS fornecedor,
                          r.data_recebimento AS data_recebimento,
                          r.numero_nota_fiscal AS nota_fiscal,
                          r.status AS status,
                          r.observacoes AS observacoes`;
      baseSql = `FROM compras.recebimentos_compra r
                 LEFT JOIN compras.pedidos_compra p ON r.pedido_id = p.id
                 LEFT JOIN compras.fornecedores f ON p.fornecedor_id = f.id`;
      whereDateCol = 'r.data_recebimento';
      if (status) push('LOWER(r.status) =', status.toLowerCase());
      if (pedido_id) push('r.pedido_id =', pedido_id);
      if (fornecedor_id) push('p.fornecedor_id =', fornecedor_id);
      if (nota) push('r.numero_nota_fiscal ILIKE', `%${nota}%`);
      if (q) {
        conditions.push(`(p.numero_pedido ILIKE '%' || $${i} || '%' OR f.nome_fantasia ILIKE '%' || $${i} || '%' OR r.numero_nota_fiscal ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'solicitacoes-compra') {
      selectSql = `SELECT s.id AS id,
                          s.data_solicitacao AS data_solicitacao,
                          s.status AS status,
                          s.observacoes AS observacoes,
                          COUNT(si.id) AS itens_solicitados`;
      baseSql = `FROM compras.solicitacoes_compra s
                 LEFT JOIN compras.solicitacoes_itens si ON si.solicitacao_id = s.id`;
      whereDateCol = 's.data_solicitacao';
      groupBy = 'GROUP BY s.id, s.data_solicitacao, s.status, s.observacoes';
      if (status) push('LOWER(s.status) =', status.toLowerCase());
      if (q) {
        conditions.push(`(COALESCE(s.observacoes,'') ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i += 1;
      }
    } else if (view === 'cotacoes-compra') {
      selectSql = `SELECT c.id AS id,
                          f.nome_fantasia AS fornecedor,
                          c.data_envio AS data_envio,
                          c.data_retorno AS data_retorno,
                          c.status AS status,
                          COALESCE(SUM(ci.quantidade * ci.preco_unitario), 0) AS valor_cotado,
                          c.observacoes AS observacoes`;
      baseSql = `FROM compras.cotacoes_compra c
                 LEFT JOIN compras.cotacoes_itens ci ON ci.cotacao_id = c.id
                 LEFT JOIN compras.fornecedores f ON c.fornecedor_id = f.id`;
      whereDateCol = 'c.data_envio';
      groupBy = 'GROUP BY c.id, f.nome_fantasia, c.data_envio, c.data_retorno, c.status, c.observacoes';
      if (status) push('LOWER(c.status) =', status.toLowerCase());
      if (fornecedor_id) push('c.fornecedor_id =', fornecedor_id);
      if (q) {
        conditions.push(`(f.nome_fantasia ILIKE '%' || $${i} || '%' OR COALESCE(c.observacoes,'') ILIKE '%' || $${i} || '%')`);
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
    if (Object.keys(ORDER_BY_WHITELIST[view] || {}).length) {
      if (orderBy) orderClause = `ORDER BY ${orderBy} ${orderDir}`;
      else {
        if (view === 'fornecedores') orderClause = 'ORDER BY f.nome_fantasia ASC';
        else if (view === 'pedidos') orderClause = 'ORDER BY p.data_pedido DESC';
        else if (view === 'recebimentos') orderClause = 'ORDER BY r.data_recebimento DESC';
        else if (view === 'solicitacoes-compra') orderClause = 'ORDER BY s.data_solicitacao DESC';
        else if (view === 'cotacoes-compra') orderClause = 'ORDER BY c.data_envio DESC';
      }
    }

    // Pagination: for aggregated views (GROUP BY), do not paginate
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

    // total: for aggregated (groupBy) rely on rows.length; otherwise run COUNT(*)
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
    console.error('📦 API /api/modulos/compras error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

