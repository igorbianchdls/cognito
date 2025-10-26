import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Safeguard: whitelist order by columns per view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  'contas-a-pagar': {
    id: 'cap.id',
    fornecedor: 'f.nome',
    data_emissao: 'cap.data_emissao',
    data_vencimento: 'cap.data_vencimento',
    data_pagamento: 'cap.data_pagamento',
    valor_total: 'cap.valor_total',
    status: 'cap.status',
  },
  'contas-a-receber': {
    id: 'car.id',
    cliente: 'cli.nome',
    data_emissao: 'car.data_emissao',
    data_vencimento: 'car.data_vencimento',
    data_recebimento: 'car.data_recebimento',
    valor_total: 'car.valor_total',
    status: 'car.status',
  },
  'pagamentos-efetuados': {
    id: 'pe.id',
    fornecedor: 'f.nome',
    data_pagamento: 'pe.data_pagamento',
    valor_total: 'pe.valor_total',
    status: 'pe.status',
  },
  'pagamentos-recebidos': {
    id: 'pr.id',
    cliente: 'cli.nome',
    data_pagamento: 'pr.data_pagamento',
    data_recebimento: 'pr.data_pagamento',
    valor_total: 'pr.valor_total',
    status: 'pr.status',
  },
  'extrato': {
    extrato_id: 'eb.id',
    data_extrato: 'eb.data_extrato',
    banco: 'b.nome_banco',
    conta_financeira: 'cf.nome_conta',
    tipo_conta: 'cf.tipo_conta',
    saldo_inicial: 'eb.saldo_inicial',
    total_creditos: 'eb.total_creditos',
    total_debitos: 'eb.total_debitos',
    saldo_final: 'eb.saldo_final',
    status: 'eb.status',
    transacao_id: 't.id',
    data_transacao: 't.data_transacao',
    tipo_transacao: 't.tipo',
    valor_transacao: 't.valor',
    origem_transacao: 't.origem',
    transacao_conciliada: 't.conciliado',
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

    if (view === 'contas-a-pagar') {
      baseSql = `FROM financeiro.contas_a_pagar cap
                 LEFT JOIN entidades.fornecedores f ON cap.fornecedor_id = f.id
                 LEFT JOIN financeiro.categorias_financeiras cat ON cap.categoria_id = cat.id
                 LEFT JOIN financeiro.contas_financeiras cf ON cap.conta_financeira_id = cf.id`;
      selectSql = `SELECT cap.id AS conta_id,
                          cap.fornecedor_id AS fornecedor_id,
                          cap.descricao,
                          f.nome AS fornecedor,
                          cat.nome AS fornecedor_categoria,
                          cf.nome_conta AS conta_bancaria,
                          cf.nome_conta AS conta_financeira,
                          cap.tipo_titulo,
                          cap.valor_total,
                          cap.data_emissao,
                          cap.data_vencimento,
                          cap.data_pagamento,
                          cap.status`;
      // Filtro principal por data: vencimento para contas
      whereDateCol = 'cap.data_vencimento';
      if (fornecedor_id) push('cap.fornecedor_id =', fornecedor_id);
      if (status) push('LOWER(cap.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('cap.valor_total >=', valor_min);
      if (valor_max !== undefined) push('cap.valor_total <=', valor_max);
    } else if (view === 'pagamentos-efetuados') {
      baseSql = `FROM financeiro.pagamentos_efetuados pe
                 LEFT JOIN entidades.fornecedores f ON f.id = pe.fornecedor_id
                 LEFT JOIN financeiro.contas_financeiras cf ON cf.id = pe.conta_financeira_id
                 LEFT JOIN financeiro.pagamentos_efetuados_linhas pel ON pel.pagamento_id = pe.id
                 LEFT JOIN financeiro.contas_a_pagar cap ON cap.id = pel.conta_pagar_id
                 LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = cap.categoria_id`;
      selectSql = `SELECT pe.id AS pagamento_id,
                          pe.fornecedor_id AS fornecedor_id,
                          cap.id AS conta_id,
                          f.nome AS fornecedor,
                          cat.nome AS fornecedor_categoria,
                          cf.nome_conta AS conta_bancaria,
                          cf.nome_conta AS conta_financeira,
                          cap.descricao AS descricao,
                          pe.valor_total AS valor_total,
                          pe.data_pagamento,
                          pe.tipo_pagamento AS tipo_titulo,
                          pe.status`;
      whereDateCol = 'pe.data_pagamento';
      if (fornecedor_id) push('pe.fornecedor_id =', fornecedor_id);
      if (status) push('LOWER(pe.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('pe.valor_total >=', valor_min);
      if (valor_max !== undefined) push('pe.valor_total <=', valor_max);
    } else if (view === 'pagamentos-recebidos') {
      baseSql = `FROM financeiro.pagamentos_recebidos pr
                 LEFT JOIN entidades.clientes cli ON cli.id = pr.cliente_id
                 LEFT JOIN financeiro.contas_financeiras cf ON cf.id = pr.conta_financeira_id
                 LEFT JOIN financeiro.pagamentos_recebidos_linhas prl ON prl.pagamento_id = pr.id
                 LEFT JOIN financeiro.contas_a_receber car ON car.id = prl.conta_receber_id
                 LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = car.categoria_receita_id`;
      selectSql = `SELECT pr.id AS pagamento_id,
                          pr.cliente_id AS cliente_id,
                          car.id AS conta_id,
                          cli.nome AS cliente,
                          NULL::text AS cliente_imagem_url,
                          cat.nome AS cliente_categoria,
                          cf.nome_conta AS conta_bancaria,
                          cf.nome_conta AS conta_financeira,
                          car.descricao AS descricao,
                          pr.valor_total AS valor_total,
                          pr.data_pagamento AS data_recebimento,
                          car.data_vencimento,
                          pr.tipo_pagamento AS tipo_titulo,
                          pr.status`;
      whereDateCol = 'pr.data_pagamento';
      if (cliente_id) push('pr.cliente_id =', cliente_id);
      if (status) push('LOWER(pr.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('pr.valor_total >=', valor_min);
      if (valor_max !== undefined) push('pr.valor_total <=', valor_max);
    } else if (view === 'contas-a-receber') {
      baseSql = `FROM financeiro.contas_a_receber car
                 LEFT JOIN entidades.clientes cli ON car.cliente_id = cli.id
                 LEFT JOIN financeiro.categorias_financeiras cat ON car.categoria_receita_id = cat.id
                 LEFT JOIN financeiro.contas_financeiras cf ON car.conta_financeira_id = cf.id`;
      selectSql = `SELECT car.id AS conta_id,
                          car.descricao,
                          cli.nome AS cliente,
                          NULL::text AS cliente_imagem_url,
                          cat.nome AS cliente_categoria,
                          cf.nome_conta AS conta_bancaria,
                          cf.nome_conta AS conta_financeira,
                          car.valor_total,
                          car.data_emissao,
                          car.data_vencimento,
                          car.data_recebimento,
                          car.status`;
      // Filtro principal por data: vencimento para contas
      whereDateCol = 'car.data_vencimento';
      if (cliente_id) push('car.cliente_id =', cliente_id);
      if (status) push('LOWER(car.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('car.valor_total >=', valor_min);
      if (valor_max !== undefined) push('car.valor_total <=', valor_max);
    } else if (view === 'extrato') {
      baseSql = `FROM financeiro.extratos_bancarios eb
                 LEFT JOIN financeiro.extrato_transacoes t ON t.extrato_id = eb.id
                 LEFT JOIN financeiro.contas_financeiras cf ON cf.id = eb.conta_financeira_id
                 LEFT JOIN financeiro.bancos b ON b.id = eb.conta_id`;
      selectSql = `SELECT eb.id AS extrato_id,
                          eb.data_extrato,
                          b.nome_banco AS banco,
                          cf.nome_conta AS conta_financeira,
                          cf.tipo_conta,
                          eb.saldo_inicial,
                          eb.total_creditos,
                          eb.total_debitos,
                          eb.saldo_final,
                          eb.status,
                          t.id AS transacao_id,
                          t.data_transacao,
                          t.tipo AS tipo_transacao,
                          t.descricao AS descricao_transacao,
                          t.valor AS valor_transacao,
                          t.origem AS origem_transacao,
                          t.conciliado AS transacao_conciliada`;
      whereDateCol = 'eb.data_extrato';
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
    const orderClause = orderBy
      ? `ORDER BY ${orderBy} ${orderDir}`
      : (view === 'contas-a-pagar'
          ? 'ORDER BY cap.data_vencimento ASC'
          : (view === 'contas-a-receber'
              ? 'ORDER BY car.data_vencimento ASC'
              : (view === 'extrato'
                  ? 'ORDER BY eb.id ASC, t.data_transacao ASC'
                  : `ORDER BY ${whereDateCol} DESC`)));
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
