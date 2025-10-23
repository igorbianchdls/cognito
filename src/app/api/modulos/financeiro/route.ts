import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Safeguard: whitelist order by columns per view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  'contas-a-pagar': {
    id: 'cap.id',
    fornecedor: 'f.nome_fornecedor',
    data_emissao: 'cap.data_emissao',
    data_vencimento: 'cap.data_vencimento',
    data_pagamento: 'cap.data_pagamento',
    valor_total: 'cap.valor_total',
    status: 'cap.status',
  },
  'contas-a-receber': {
    id: 'car.id',
    cliente: 'cli.nome_cliente',
    data_emissao: 'car.data_emissao',
    data_vencimento: 'car.data_vencimento',
    data_recebimento: 'car.data_recebimento',
    valor_total: 'car.valor_total',
    status: 'car.status',
  },
  'pagamentos-efetuados': {
    id: 'cap.id',
    fornecedor: 'f.nome_fornecedor',
    data_emissao: 'cap.data_emissao',
    data_vencimento: 'cap.data_vencimento',
    data_pagamento: 'cap.data_pagamento',
    valor_total: 'cap.valor_total',
    status: 'cap.status',
  },
  'pagamentos-recebidos': {
    id: 'car.id',
    cliente: 'cli.nome_cliente',
    data_emissao: 'car.data_emissao',
    data_vencimento: 'car.data_vencimento',
    data_recebimento: 'car.data_recebimento',
    valor_total: 'car.valor_total',
    status: 'car.status',
  },
  movimentos: {
    id: 'm.id',
    data: 'm.data',
    valor: 'm.valor',
  },
};

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = (searchParams.get('view') || '').toLowerCase();
    if (!view) {
      return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 });
    }

    // Common filters
    const de = searchParams.get('de') || undefined; // YYYY-MM-DD
    const ate = searchParams.get('ate') || undefined; // YYYY-MM-DD
    const status = searchParams.get('status') || undefined;
    const cliente_id = searchParams.get('cliente_id') || undefined;
    const fornecedor_id = searchParams.get('fornecedor_id') || undefined;
    const valor_min = parseNumber(searchParams.get('valor_min'));
    const valor_max = parseNumber(searchParams.get('valor_max'));
    const conta_id = searchParams.get('conta_id') || undefined;
    const categoria_id = searchParams.get('categoria_id') || undefined;
    const tipo = searchParams.get('tipo') || undefined; // entrada | saída (movimentos)

    // Pagination
    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1);
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 20) || 20));
    const offset = (page - 1) * pageSize;

    // Sorting
    const orderByParam = (searchParams.get('order_by') || '').toLowerCase();
    const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase();
    const orderWhitelist = ORDER_BY_WHITELIST[view] || {};
    const orderBy = orderWhitelist[orderByParam] || undefined;
    const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC';

    // Build SQL per view
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const push = (expr: string, value: unknown) => {
      conditions.push(`${expr} $${idx}`);
      params.push(value);
      idx += 1;
    };

    let baseSql = '';
    let whereDateCol = '';
    let totalSql = '';
    let selectSql = '';

    if (view === 'contas-a-pagar' || view === 'pagamentos-efetuados') {
      baseSql = `FROM financeiro.contas_a_pagar cap
                 LEFT JOIN financeiro.contas_a_pagar_linhas capl ON cap.id = capl.conta_pagar_id
                 LEFT JOIN financeiro.fornecedores f ON cap.fornecedor_id = f.id
                 LEFT JOIN financeiro.categorias cat ON cap.categoria_id = cat.id
                 LEFT JOIN financeiro.centros_custo cc ON cap.centro_custo_id = cc.id
                 LEFT JOIN financeiro.contas c ON cap.conta_id = c.id`;
      selectSql = `SELECT cap.id AS conta_id,
                          cap.descricao,
                          f.nome_fornecedor AS fornecedor,
                          f.imagem_url AS fornecedor_imagem_url,
                          cat.nome AS fornecedor_categoria,
                          cc.nome AS centro_custo,
                          c.nome_conta AS conta_bancaria,
                          cap.tipo_titulo,
                          cap.valor_total,
                          cap.data_emissao,
                          cap.data_vencimento,
                          cap.data_pagamento,
                          cap.status,
                          capl.numero_parcela,
                          capl.valor_parcela,
                          capl.data_vencimento AS parcela_vencimento,
                          capl.data_pagamento AS parcela_pagamento,
                          capl.status AS parcela_status`;
      // Filtro principal por data: vencimento para contas; pagamento para pagos
      whereDateCol = view === 'pagamentos-efetuados' ? 'cap.data_pagamento' : 'cap.data_vencimento';
      if (view === 'pagamentos-efetuados') {
        conditions.push(`LOWER(cap.status) = 'pago'`);
      }
      if (fornecedor_id) push('cap.fornecedor_id =', fornecedor_id);
      if (status) push('LOWER(cap.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('cap.valor_total >=', valor_min);
      if (valor_max !== undefined) push('cap.valor_total <=', valor_max);
    } else if (view === 'contas-a-receber' || view === 'pagamentos-recebidos') {
      baseSql = `FROM financeiro.contas_a_receber car
                 LEFT JOIN financeiro.contas_a_receber_linhas carl ON car.id = carl.conta_receber_id
                 LEFT JOIN financeiro.clientes cli ON car.cliente_id = cli.id
                 LEFT JOIN financeiro.categorias cat ON car.categoria_id = cat.id
                 LEFT JOIN financeiro.centros_custo cc ON car.centro_custo_id = cc.id
                 LEFT JOIN financeiro.contas c ON car.conta_id = c.id`;
      selectSql = `SELECT car.id AS conta_id,
                          car.descricao,
                          cli.nome_cliente AS cliente,
                          cli.imagem_url AS cliente_imagem_url,
                          cat.nome AS cliente_categoria,
                          cc.nome AS centro_custo,
                          c.nome_conta AS conta_bancaria,
                          car.tipo_titulo,
                          car.valor_total,
                          car.data_emissao,
                          car.data_vencimento,
                          car.data_recebimento,
                          car.status,
                          carl.numero_parcela,
                          carl.valor_parcela,
                          carl.data_vencimento AS parcela_vencimento,
                          carl.data_recebimento AS parcela_recebimento,
                          carl.status AS parcela_status`;
      // Filtro principal por data: vencimento para contas; recebimento para recebidos
      whereDateCol = view === 'pagamentos-recebidos' ? 'car.data_recebimento' : 'car.data_vencimento';
      if (view === 'pagamentos-recebidos') {
        conditions.push(`LOWER(car.status) = 'pago'`);
      }
      if (cliente_id) push('car.cliente_id =', cliente_id);
      if (status) push('LOWER(car.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('car.valor_total >=', valor_min);
      if (valor_max !== undefined) push('car.valor_total <=', valor_max);
    } else if (view === 'movimentos') {
      baseSql = `FROM gestaofinanceira.movimentos m
                 LEFT JOIN gestaofinanceira.categorias cat ON cat.id = m.categoria_id
                 LEFT JOIN gestaofinanceira.contas c ON c.id = m.conta_id`;
      selectSql = `SELECT m.id,
                          m.data,
                          CASE WHEN m.valor > 0 THEN 'entrada' ELSE 'saída' END AS tipo,
                          m.valor,
                          m.categoria_id,
                          COALESCE(cat.nome, 'Sem categoria') AS categoria_nome,
                          m.conta_id,
                          COALESCE(c.nome, 'Sem conta') AS conta_nome,
                          m.centro_custo_id`;
      whereDateCol = 'm.data';
      if (conta_id) push('m.conta_id =', conta_id);
      if (categoria_id) push('m.categoria_id =', categoria_id);
      if (tipo === 'entrada') conditions.push('m.valor > 0');
      if (tipo === 'saída' || tipo === 'saida') conditions.push('m.valor < 0');
      if (valor_min !== undefined) push('m.valor >=', valor_min);
      if (valor_max !== undefined) push('m.valor <=', valor_max);
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 });
    }

    if (de) push(`${whereDateCol} >=`, de);
    if (ate) push(`${whereDateCol} <=`, ate);

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : `ORDER BY ${whereDateCol} DESC`;
    const limitOffsetClause = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`;
    const paramsWithPage = [...params, pageSize, offset];

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${orderClause}
                     ${limitOffsetClause}`.replace(/\s+$/m, '').trim();

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage);

    totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`;
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
    console.error('📊 API /api/modulos/financeiro error:', error);
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
