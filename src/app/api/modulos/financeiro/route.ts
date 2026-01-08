import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/postgres';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Safeguard: whitelist order by columns per view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  'contas-a-pagar': {
    id: 'lf.id',
    conta_id: 'lf.id',
    tipo_conta: 'lf.tipo',
    descricao_conta: 'lf.descricao',
    valor_a_pagar: 'lf.valor',
    status_conta: 'lf.status',
    data_lancamento: 'lf.data_lancamento',
    data_vencimento: 'lf.data_vencimento',
    observacao: 'lf.observacao',
    categoria_nome: 'cf.nome',
    centro_lucro_nome: 'cl.nome',
    departamento_nome: 'dep.nome',
    filial_nome: 'fi.nome',
    projeto_nome: 'pr.nome',
    fornecedor_nome: 'f.nome_fantasia',
  },
  'contas-a-receber': {
    id: 'lf.id',
    conta_id: 'lf.id',
    tipo_conta: 'lf.tipo',
    descricao_conta: 'lf.descricao',
    valor_a_receber: 'lf.valor',
    status_conta: 'lf.status',
    data_lancamento: 'lf.data_lancamento',
    data_vencimento: 'lf.data_vencimento',
    observacao: 'lf.observacao',
    categoria_nome: 'cf.nome',
    centro_lucro_nome: 'cl.nome',
    departamento_nome: 'dep.nome',
    filial_nome: 'fi.nome',
    projeto_nome: 'pr.nome',
    cliente_nome: 'c.nome_fantasia',
  },
  'pagamentos-efetuados': {
    id: 'lf.id',
    pagamento_id: 'lf.id',
    titulo_id: 'ap.id',
    descricao_pagamento: 'lf.descricao',
    pagamento_descricao: 'lf.descricao',
    titulo_descricao: 'ap.descricao',
    valor_pago: 'lf.valor',
    valor_titulo: 'ap.valor',
    data_pagamento: 'lf.data_lancamento',
    vencimento_titulo: 'ap.data_vencimento',
    status: 'lf.status',
    fornecedor: 'forn_ap.nome_fantasia',
    categoria_financeira: 'cat_ap.nome',
    categoria: 'cat_ap.nome',
    conta_financeira: 'cf.nome_conta',
    metodo_pagamento: 'mp.nome',
    centro_custo: 'cc_ap.nome',
    departamento: 'dep_ap.nome',
    filial: 'fil_ap.nome',
    projeto: 'prj_ap.nome',
    natureza: "'SAIDA'",
  },
  'pagamentos-recebidos': {
    id: 'lf.id',
    pagamento_id: 'lf.id',
    origem_id: 'orig.id',
    cliente_nome: 'c.nome_fantasia',
    data_lancamento: 'lf.data_lancamento',
    data_pagamento: 'lf.data_lancamento',
    descricao_pagamento: 'lf.descricao',
    descricao_origem: 'orig.descricao',
    valor: 'lf.valor',
    valor_recebido: 'lf.valor',
    status_pagamento: 'lf.status',
    tipo_pagamento: 'lf.tipo',
    observacao: 'lf.observacao',
    conta_financeira_nome: 'cf2.nome_conta',
    categoria_nome: 'cf.nome',
    metodo_pagamento_nome: 'mp.nome',
    centro_lucro_nome: 'cl.nome',
    departamento_nome: 'dep.nome',
    filial_nome: 'fi.nome',
    projeto_nome: 'pr.nome',
  },
  conciliacao: {
    conciliacao_id: 'cb.id',
    periodo_inicio: 'cb.periodo_inicio',
    periodo_fim: 'cb.periodo_fim',
    banco: 'b.nome_banco',
    conta_financeira: 'cf.nome_conta',
    tipo_conta: 'cf.tipo_conta',
    saldo_inicial: 'cb.saldo_inicial',
    saldo_extrato: 'cb.saldo_extrato',
    saldo_sistema: 'cb.saldo_sistema',
    diferenca: 'cb.diferenca',
    status: 'cb.status',
    criado_em: 'cb.criado_em',
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
  bancos: {
    banco_id: 'b.id',
    nome_banco: 'b.nome_banco',
    numero_banco: 'b.numero_banco',
    agencia: 'b.agencia',
    endereco: 'b.endereco',
    criado_em: 'b.criado_em',
    atualizado_em: 'b.atualizado_em',
  },
  contas: {
    conta_id: 'cf.id',
    nome_conta: 'cf.nome_conta',
    tipo_conta: 'cf.tipo_conta',
    agencia: 'cf.agencia',
    numero_conta: 'cf.numero_conta',
    pix_chave: 'cf.pix_chave',
    saldo_inicial: 'cf.saldo_inicial',
    saldo_atual: 'cf.saldo_atual',
    data_abertura: 'cf.data_abertura',
    ativo: 'cf.ativo',
    criado_em: 'cf.criado_em',
    atualizado_em: 'cf.atualizado_em',
  },
  'contas-financeiras': {
    conta_id: 'cf.id',
    nome_conta: 'cf.nome_conta',
    tipo_conta: 'cf.tipo_conta',
    agencia: 'cf.agencia',
    numero_conta: 'cf.numero_conta',
    pix_chave: 'cf.pix_chave',
    saldo_inicial: 'cf.saldo_inicial',
    saldo_atual: 'cf.saldo_atual',
    data_abertura: 'cf.data_abertura',
    ativo: 'cf.ativo',
    criado_em: 'cf.criado_em',
    atualizado_em: 'cf.atualizado_em',
  },
  categorias: {
    id: 'cat.id',
    nome: 'cat.nome',
    tipo: 'cat.tipo',
    descricao: 'cat.descricao',
    ativo: 'cat.ativo',
    criado_em: 'cat.criado_em',
    atualizado_em: 'cat.atualizado_em',
  },
  'centros-de-custo': {
    id: 'cc.id',
    codigo: 'cc.codigo',
    nome: 'cc.nome',
    descricao: 'cc.descricao',
    ativo: 'cc.ativo',
    criado_em: 'cc.criado_em',
    atualizado_em: 'cc.atualizado_em',
  },
  'centros-de-lucro': {
    id: 'cl.id',
    codigo: 'cl.codigo',
    nome: 'cl.nome',
    descricao: 'cl.descricao',
    ativo: 'cl.ativo',
    criado_em: 'cl.criado_em',
    atualizado_em: 'cl.atualizado_em',
  },
  'categorias-despesa': {
    id: 'cd.id',
    codigo: 'cd.codigo',
    nome: 'cd.nome',
    descricao: 'cd.descricao',
    tipo: 'cd.tipo',
    natureza: 'cd.natureza',
    categoria_pai_id: 'cd.categoria_pai_id',
    plano_conta_id: 'cd.plano_conta_id',
    criado_em: 'cd.criado_em',
    atualizado_em: 'cd.atualizado_em',
  },
  'categorias-receita': {
    id: 'cr.id',
    codigo: 'cr.codigo',
    nome: 'cr.nome',
    descricao: 'cr.descricao',
    tipo: 'cr.tipo',
    natureza: 'cr.natureza',
    plano_conta_id: 'cr.plano_conta_id',
    ativo: 'cr.ativo',
    criado_em: 'cr.criado_em',
    atualizado_em: 'cr.atualizado_em',
  },
  projetos: {
    id: 'p.id',
    codigo: 'p.codigo',
    nome: 'p.nome',
    data_inicio: 'p.data_inicio',
    data_fim: 'p.data_fim',
    status: 'p.status',
    descricao: 'p.descricao',
    ativo: 'p.ativo',
    criado_em: 'p.criado_em',
    atualizado_em: 'p.atualizado_em',
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
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 1000) || 1000));
    const offset = (page - 1) * pageSize;

    // Sorting
    const orderByParam = (searchParams.get('order_by') || '').toLowerCase();
    const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase();
  const orderWhitelist = ORDER_BY_WHITELIST[view] || {};
  const orderBy = orderWhitelist[orderByParam] || undefined;
  const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC';

    // Special case: view=extrato grouped (extratos as pais + transacoes como filhos)
    if (view === 'extrato') {
      const groupedParam = (searchParams.get('grouped') || '').toLowerCase()
      const grouped = groupedParam === '1' || groupedParam === 'true'
      if (grouped) {
        try {
          // Filters on extrato header
          const paramsFilt: unknown[] = []
          let idxG = 1
          let whereG = 'WHERE 1=1'
          if (de) { whereG += ` AND e.data_extrato >= $${idxG++}`; paramsFilt.push(de) }
          if (ate) { whereG += ` AND e.data_extrato <= $${idxG++}`; paramsFilt.push(ate) }
          if (status) { whereG += ` AND LOWER(e.status) = $${idxG++}`; paramsFilt.push(status.toLowerCase()) }

          // Whitelist for ordering by extrato-level columns
          const extratoOrderWhitelist: Record<string, string> = {
            extrato_id: 'e.id',
            data_extrato: 'e.data_extrato',
            saldo_inicial: 'e.saldo_inicial',
            total_creditos: 'e.total_creditos',
            total_debitos: 'e.total_debitos',
            saldo_final: 'e.saldo_final',
            status: 'e.status',
            banco: 'b.nome_banco',
            conta_financeira: 'cf.nome_conta',
            tipo_conta: 'cf.tipo_conta',
          }
          const obParam = (searchParams.get('order_by') || 'data_extrato').toLowerCase()
          const orderByExtrato = extratoOrderWhitelist[obParam] || 'e.id'

          // CTE with paginated extratos + joins for bank/account labels; then aggregate transacoes per extrato
          const listSql = `
            WITH e AS (
              SELECT 
                e.id AS extrato_id,
                e.data_extrato,
                e.descricao_extrato,
                e.conta_financeira_id,
                e.saldo_inicial,
                e.total_creditos,
                e.total_debitos,
                e.saldo_final,
                e.status,
                e.arquivo_ofx_url,
                b.nome_banco AS banco,
                b.imagem_url AS banco_imagem_url,
                cf.nome_conta AS conta_financeira,
                cf.tipo_conta AS tipo_conta
              FROM financeiro.extratos_bancarios e
              LEFT JOIN financeiro.contas_financeiras cf ON cf.id = e.conta_financeira_id
              LEFT JOIN financeiro.bancos b ON b.id = e.conta_id
              ${whereG}
              ORDER BY ${orderByExtrato} ${orderDir}
              LIMIT $${idxG}::int OFFSET $${idxG + 1}::int
            )
            SELECT e.*,
                   COALESCE(
                     (
                       SELECT json_agg(
                         json_build_object(
                           'transacao_id', t.id,
                           'tipo_transacao', t.tipo,
                           'data_transacao', t.data_transacao,
                           'descricao_transacao', t.descricao,
                           'valor_transacao', t.valor,
                           'origem_transacao', t.origem,
                           'transacao_conciliada', t.conciliado
                         )
                         ORDER BY t.data_transacao ASC
                       )
                       FROM financeiro.extrato_transacoes t
                       WHERE t.extrato_id = e.extrato_id
                     ),
                     '[]'::json
                   ) AS transacoes
            FROM e
          `.replace(/\n\s+/g, ' ').trim()

          const paramsWithPage: unknown[] = [...paramsFilt, pageSize, offset]
          const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage)

          const totalSql = `SELECT COUNT(*)::int AS total FROM financeiro.extratos_bancarios e ${whereG}`
          const totalRows = await runQuery<{ total: number }>(totalSql, paramsFilt)
          const total = totalRows[0]?.total ?? 0

          return Response.json({
            success: true,
            view,
            page,
            pageSize,
            total,
            rows,
            sql: listSql,
            params: JSON.stringify(paramsWithPage),
          }, { headers: { 'Cache-Control': 'no-store' } })
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error)
          return Response.json({ success: false, message: msg }, { status: 400 })
        }
      }
    }

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

  if (view === 'kpis') {
    try {
      // Intervalo: usa 'de' e 'ate' se vierem; senão mês corrente
      const now = new Date();
      const firstDayDefault = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const lastDayDefault = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

      const deDate = de || firstDayDefault;
      const ateDate = ate || lastDayDefault;

      const kpiParamsBase: unknown[] = [deDate, ateDate];
      let idxKpi = 3;
      // tenant opcional
      const tenantId = parseNumber(searchParams.get('tenant_id'));
      const kpiParams: unknown[] = tenantId ? [...kpiParamsBase, tenantId] : [...kpiParamsBase];
      const tenantFilterCr = tenantId ? ` AND cr.tenant_id = $${idxKpi}` : '';
      const tenantFilterCp = tenantId ? ` AND cp.tenant_id = $${idxKpi}` : '';
      const tenantFilterPr = tenantId ? ` AND pr.tenant_id = $${idxKpi}` : '';
      const tenantFilterPe = tenantId ? ` AND pe.tenant_id = $${idxKpi}` : '';

      // A RECEBER NO PERÍODO (pendentes): contas_receber por vencimento
      const arSql = `SELECT COALESCE(SUM(cr.valor_liquido), 0) AS total
                       FROM financeiro.contas_receber cr
                      WHERE LOWER(cr.status) NOT IN ('recebido','baixado','liquidado')
                        AND DATE(cr.data_vencimento) BETWEEN $1 AND $2${tenantFilterCr}`.replace(/\s+/g, ' ');
      const [arRow] = await runQuery<{ total: number | null }>(arSql, kpiParams);

      // A PAGAR NO PERÍODO (pendentes): contas_pagar por vencimento
      const apSql = `SELECT COALESCE(SUM(cp.valor_liquido), 0) AS total
                       FROM financeiro.contas_pagar cp
                      WHERE LOWER(cp.status) NOT IN ('pago','baixado','liquidado')
                        AND DATE(cp.data_vencimento) BETWEEN $1 AND $2${tenantFilterCp}`.replace(/\s+/g, ' ');
      const [apRow] = await runQuery<{ total: number | null }>(apSql, kpiParams);

      // RECEBIDOS NO PERÍODO (caixa realizado): pagamentos_recebidos por data_recebimento
      const recSql = `SELECT COALESCE(SUM(pr.valor_total_recebido), 0) AS total
                        FROM financeiro.pagamentos_recebidos pr
                       WHERE DATE(pr.data_recebimento) BETWEEN $1 AND $2${tenantFilterPr}`.replace(/\s+/g, ' ');
      const [recRow] = await runQuery<{ total: number | null }>(recSql, kpiParams);

      // PAGOS NO PERÍODO (caixa realizado): pagamentos_efetuados por data_pagamento
      const pagoSql = `SELECT COALESCE(SUM(pe.valor_total_pagamento), 0) AS total
                        FROM financeiro.pagamentos_efetuados pe
                       WHERE DATE(pe.data_pagamento) BETWEEN $1 AND $2${tenantFilterPe}`.replace(/\s+/g, ' ');
      const [pagoRow] = await runQuery<{ total: number | null }>(pagoSql, kpiParams);

      // RECEITA NO PERÍODO (competência): contas_receber por vencimento (sem filtro de status)
      const receitaSql = `SELECT COALESCE(SUM(cr.valor_liquido), 0) AS total
                            FROM financeiro.contas_receber cr
                           WHERE DATE(cr.data_vencimento) BETWEEN $1 AND $2${tenantFilterCr}`.replace(/\s+/g, ' ');
      const [receitaRow] = await runQuery<{ total: number | null }>(receitaSql, kpiParams);

      // DESPESAS NO PERÍODO (competência): contas_pagar por vencimento (sem filtro de status)
      const despesasSql = `SELECT COALESCE(SUM(cp.valor_liquido), 0) AS total
                             FROM financeiro.contas_pagar cp
                            WHERE DATE(cp.data_vencimento) BETWEEN $1 AND $2${tenantFilterCp}`.replace(/\s+/g, ' ');
      const [despesasRow] = await runQuery<{ total: number | null }>(despesasSql, kpiParams);

      // Contagens de títulos pendentes por vencimento
      const arCountSql = `SELECT COUNT(*)::int AS count
                            FROM financeiro.contas_receber cr
                           WHERE LOWER(cr.status) = 'pendente'
                             AND DATE(cr.data_vencimento) BETWEEN $1 AND $2${tenantFilterCr}`.replace(/\s+/g, ' ');
      const [arCountRow] = await runQuery<{ count: number | null }>(arCountSql, kpiParams);

      const apCountSql = `SELECT COUNT(*)::int AS count
                            FROM financeiro.contas_pagar cp
                           WHERE LOWER(cp.status) = 'pendente'
                             AND DATE(cp.data_vencimento) BETWEEN $1 AND $2${tenantFilterCp}`.replace(/\s+/g, ' ');
      const [apCountRow] = await runQuery<{ count: number | null }>(apCountSql, kpiParams);

      return Response.json({
        success: true,
        de: deDate,
        ate: ateDate,
        kpis: {
          ar_mes: Number(arRow?.total ?? 0),
          ap_mes: Number(apRow?.total ?? 0),
          recebidos_mes: Number(recRow?.total ?? 0),
          pagos_mes: Number(pagoRow?.total ?? 0),
          geracao_caixa: Number(recRow?.total ?? 0) - Number(pagoRow?.total ?? 0),
          receita_mes: Number(receitaRow?.total ?? 0),
          despesas_mes: Number(despesasRow?.total ?? 0),
          lucro_mes: Number(receitaRow?.total ?? 0) - Number(despesasRow?.total ?? 0),
          ar_count: Number(arCountRow?.count ?? 0),
          ap_count: Number(apCountRow?.count ?? 0),
        },
        sql_query: {
          a_receber_mes: arSql,
          a_pagar_mes: apSql,
          recebidos_mes: recSql,
          pagos_mes: pagoSql,
          receita_mes: receitaSql,
          despesas_mes: despesasSql,
          ar_count: arCountSql,
          ap_count: apCountSql,
        },
        sql_params: kpiParams,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return Response.json({ success: false, message: msg }, { status: 400 });
    }
  }

    if (view === 'aging') {
      return Response.json({ success: false, message: 'View removida (lancamentos_financeiros descontinuado)' }, { status: 410 });
    } else if (view === 'cashflow-realized') {
      return Response.json({ success: false, message: 'View removida (lancamentos_financeiros descontinuado)' }, { status: 410 });
    } else if (view === 'cashflow-projected') {
      return Response.json({ success: false, message: 'View removida (lancamentos_financeiros descontinuado)' }, { status: 410 });
    } else if (view === 'top-despesas') {
      return Response.json({ success: false, message: 'View removida (lancamentos_financeiros descontinuado)' }, { status: 410 });
    } else if (view === 'top-receitas') {
      return Response.json({ success: false, message: 'View removida (lancamentos_financeiros descontinuado)' }, { status: 410 });
    } else if (view === 'top-receitas-centro-lucro') {
      return Response.json({ success: false, message: 'View removida (lancamentos_financeiros descontinuado)' }, { status: 410 });
    } else if (view === 'contas-a-pagar') {
      // Contas a Pagar — somente CABEÇALHOS (query fornecida)
      const headerSql = `
SELECT
  cp.id                                AS conta_pagar_id,

  cp.numero_documento,
  cp.tipo_documento,
  cp.status,
  cp.data_documento,
  cp.data_lancamento,
  cp.data_vencimento,

  f.nome_fantasia                      AS fornecedor,

  cat_h.nome                           AS categoria_despesa,

  dep_h.nome                           AS departamento,
  cc_h.nome                            AS centro_custo,
  fil.nome                             AS filial,
  un.nome                              AS unidade_negocio,

  cp.valor_bruto,
  cp.valor_desconto,
  cp.valor_impostos,
  cp.valor_liquido,

  cp.observacao                        AS descricao

FROM financeiro.contas_pagar cp

LEFT JOIN entidades.fornecedores f
       ON f.id = cp.fornecedor_id

LEFT JOIN financeiro.categorias_despesa cat_h
       ON cat_h.id = cp.categoria_despesa_id

LEFT JOIN empresa.departamentos dep_h
       ON dep_h.id = cp.departamento_id

LEFT JOIN empresa.centros_custo cc_h
       ON cc_h.id = cp.centro_custo_id

LEFT JOIN empresa.filiais fil
       ON fil.id = cp.filial_id

LEFT JOIN empresa.unidades_negocio un
       ON un.id = cp.unidade_negocio_id

ORDER BY
  cp.data_vencimento DESC,
  cp.id DESC
      `.replace(/\n\s+/g, ' ').trim()

      const rows = await runQuery<Record<string, unknown>>(headerSql, [])
      const total = rows.length
      return Response.json({ success: true, view, page, pageSize, total, rows, sql: headerSql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } })
    } else if (view === 'contas-a-pagar-cabecalhos' || view === 'contas-a-pagar-cabecalhos') {
      // Contas a Pagar — Cabeçalhos (query solicitada)
      try {
        const sql = `
SELECT
  cp.id                                AS conta_pagar_id,

  cp.numero_documento,
  cp.tipo_documento,
  cp.status,
  cp.data_documento,
  cp.data_lancamento,
  cp.data_vencimento,

  f.nome_fantasia                      AS fornecedor,

  cat_h.nome                           AS categoria_despesa,

  dep_h.nome                           AS departamento,
  cc_h.nome                            AS centro_custo,
  fil.nome                             AS filial,
  un.nome                              AS unidade_negocio,

  cp.valor_bruto,
  cp.valor_desconto,
  cp.valor_impostos,
  cp.valor_liquido,

  cp.observacao                        AS descricao

FROM financeiro.contas_pagar cp

LEFT JOIN entidades.fornecedores f
       ON f.id = cp.fornecedor_id

LEFT JOIN financeiro.categorias_despesa cat_h
       ON cat_h.id = cp.categoria_despesa_id

LEFT JOIN empresa.departamentos dep_h
       ON dep_h.id = cp.departamento_id

LEFT JOIN empresa.centros_custo cc_h
       ON cc_h.id = cp.centro_custo_id

LEFT JOIN empresa.filiais fil
       ON fil.id = cp.filial_id

LEFT JOIN empresa.unidades_negocio un
       ON un.id = cp.unidade_negocio_id

ORDER BY
  cp.data_vencimento DESC,
  cp.id DESC;`.replace(/\n\s+/g, ' ').trim()

        const rows = await runQuery<Record<string, unknown>>(sql, [])
        const total = rows.length
        return Response.json({ success: true, view, page, pageSize, total, rows, sql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        return Response.json({ success: false, message: msg }, { status: 400 })
      }
    } else if (view === 'pagamentos-efetuados') {
      // Pagamentos Efetuados — query solicitada (pe/pel/cp/f/cf/mp)
      const sql = `
SELECT
  pe.id                               AS pagamento_id,

  pe.numero_pagamento,
  pe.status,
  pe.data_pagamento,
  pe.data_lancamento,

  f.nome_fantasia                     AS fornecedor,

  cf.nome_conta                       AS conta_financeira,
  mp.nome                             AS metodo_pagamento,

  pe.valor_total_pagamento,

  pe.observacao

FROM financeiro.pagamentos_efetuados pe

-- ligações para descobrir o fornecedor
LEFT JOIN financeiro.pagamentos_efetuados_linhas pel
       ON pel.pagamento_id = pe.id

LEFT JOIN financeiro.contas_pagar cp
       ON cp.id = pel.conta_pagar_id

LEFT JOIN entidades.fornecedores f
       ON f.id = cp.fornecedor_id

-- banco / método
LEFT JOIN financeiro.contas_financeiras cf
       ON cf.id = pe.conta_financeira_id

LEFT JOIN financeiro.metodos_pagamento mp
       ON mp.id = pe.metodo_pagamento_id

GROUP BY
  pe.id,
  pe.numero_pagamento,
  pe.status,
  pe.data_pagamento,
  pe.data_lancamento,
  f.nome_fantasia,
  cf.nome_conta,
  mp.nome,
  pe.valor_total_pagamento,
  pe.observacao

ORDER BY
  pe.data_pagamento DESC,
  pe.id DESC`.replace(/\n\s+/g, ' ').trim()

      const rows = await runQuery<Record<string, unknown>>(sql, [])
      const total = rows.length
      return Response.json({ success: true, view, page, pageSize, total, rows, sql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } })
    } else if (view === 'contas-a-receber') {
      // Contas a Receber — query atualizada (inclui centro_lucro e remove centro_custo)
      const sql = `
SELECT
  cr.id                                AS conta_receber_id,

  cr.numero_documento,
  cr.tipo_documento,
  cr.status,
  cr.data_documento,
  cr.data_lancamento,
  cr.data_vencimento,

  cli.nome_fantasia                    AS cliente,

  cat_h.nome                           AS categoria_financeira,
  cat_r.nome                           AS categoria_receita,

  dep_h.nome                           AS departamento,
  cl.nome                              AS centro_lucro,
  fil.nome                             AS filial,
  un.nome                              AS unidade_negocio,

  cr.valor_bruto,
  cr.valor_desconto,
  cr.valor_impostos,
  cr.valor_liquido,

  cr.observacao                        AS descricao

FROM financeiro.contas_receber cr

LEFT JOIN entidades.clientes cli
       ON cli.id = cr.cliente_id

LEFT JOIN financeiro.categorias_financeiras cat_h
       ON cat_h.id = cr.categoria_financeira_id

LEFT JOIN financeiro.categorias_receita cat_r
       ON cat_r.id = cr.categoria_receita_id

LEFT JOIN empresa.departamentos dep_h
       ON dep_h.id = cr.departamento_id

LEFT JOIN empresa.centros_lucro cl
       ON cl.id = cr.centro_lucro_id

LEFT JOIN empresa.filiais fil
       ON fil.id = cr.filial_id

LEFT JOIN empresa.unidades_negocio un
       ON un.id = cr.unidade_negocio_id

ORDER BY
  cr.data_vencimento DESC,
  cr.id DESC`.replace(/\n\s+/g, ' ').trim()

      const rows = await runQuery<Record<string, unknown>>(sql, [])
      const total = rows.length
      return Response.json({ success: true, view, page, pageSize, total, rows, sql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } })
    } else if (view === 'top5-ap') {
      // Top 5 por Contas a Pagar em aberto (status='aberto')
      const dim = (searchParams.get('dim') || '').toLowerCase(); // fornecedor | centro_custo | filial | categoria | titulo
      const limit = Math.max(1, Math.min(50, parseNumber(searchParams.get('limit'), 5) || 5));
      const tenantId = parseNumber(searchParams.get('tenant_id'));

      const params: unknown[] = []
      let idx = 1
      const filtros: string[] = []
      filtros.push(`LOWER(cp.status) = 'aberto'`)
      if (de) { filtros.push(`cp.data_vencimento >= $${idx++}`); params.push(de) }
      if (ate) { filtros.push(`cp.data_vencimento <= $${idx++}`); params.push(ate) }
      if (tenantId) { filtros.push(`cp.tenant_id = $${idx++}`); params.push(tenantId) }
      const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : ''

      if (dim === 'titulo') {
        // Top 5 títulos (individuais)
        const sql = `
          SELECT cp.id AS conta_pagar_id,
                 COALESCE(NULLIF(TRIM(cp.numero_documento), ''), CONCAT('Conta #', cp.id::text)) AS label,
                 cp.valor_liquido AS total
            FROM financeiro.contas_pagar cp
            ${where}
           ORDER BY cp.valor_liquido DESC NULLS LAST
           LIMIT ${limit}
        `.replace(/\n\s+/g, ' ').trim()
        const rows = await runQuery<{ conta_pagar_id: number; label: string; total: number | null }>(sql, params)
        return Response.json({ success: true, dim: 'titulo', rows, sql_query: sql, sql_params: params })
      }

      // Agrupados por dimensão
      let labelExpr = ''
      if (dim === 'fornecedor') labelExpr = "COALESCE(f.nome_fantasia, 'Sem fornecedor')"
      else if (dim === 'centro_custo' || dim === 'centro-custo') labelExpr = "COALESCE(cc.nome, 'Sem centro de custo')"
      else if (dim === 'filial') labelExpr = "COALESCE(fil.nome, 'Sem filial')"
      else if (dim === 'categoria') labelExpr = "COALESCE(cat.nome, 'Sem categoria')"
      else if (dim === 'departamento') labelExpr = "COALESCE(dep.nome, 'Sem departamento')"
      else if (dim === 'unidade_negocio' || dim === 'unidade-negocio') labelExpr = "COALESCE(un.nome, 'Sem unidade')"
      else {
        return Response.json({ success: false, message: "Parâmetro 'dim' inválido. Use 'fornecedor' | 'centro_custo' | 'filial' | 'categoria' | 'departamento' | 'unidade_negocio' | 'titulo'" }, { status: 400 })
      }

      const sql = `
        SELECT ${labelExpr} AS label,
               COALESCE(SUM(cp.valor_liquido), 0) AS total
          FROM financeiro.contas_pagar cp
          LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
          LEFT JOIN empresa.centros_custo cc ON cc.id = cp.centro_custo_id
          LEFT JOIN empresa.departamentos dep ON dep.id = cp.departamento_id
          LEFT JOIN empresa.unidades_negocio un ON un.id = cp.unidade_negocio_id
          LEFT JOIN empresa.filiais fil ON fil.id = cp.filial_id
          LEFT JOIN financeiro.categorias_despesa cat ON cat.id = cp.categoria_despesa_id
          ${where}
         GROUP BY 1
         ORDER BY total DESC NULLS LAST
         LIMIT ${limit}
      `.replace(/\n\s+/g, ' ').trim()
      const rows = await runQuery<{ label: string; total: number | null }>(sql, params)
      return Response.json({ success: true, dim, rows, sql_query: sql, sql_params: params })

    } else if (view === 'top5-ar') {
      // Top 5 por Contas a Receber (status='aberto') – categorias de receita e centros de lucro
      const dim = (searchParams.get('dim') || '').toLowerCase(); // categoria | categoria_receita | centro_lucro
      const limit = Math.max(1, Math.min(50, parseNumber(searchParams.get('limit'), 5) || 5));
      const tenantId = parseNumber(searchParams.get('tenant_id'));

      const params: unknown[] = []
      let idx = 1
      const filtros: string[] = []
      filtros.push(`LOWER(cr.status) = 'aberto'`)
      if (de) { filtros.push(`cr.data_vencimento >= $${idx++}`); params.push(de) }
      if (ate) { filtros.push(`cr.data_vencimento <= $${idx++}`); params.push(ate) }
      if (tenantId) { filtros.push(`cr.tenant_id = $${idx++}`); params.push(tenantId) }
      const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : ''

      let labelExpr = ''
      if (dim === 'categoria' || dim === 'categoria_receita') labelExpr = "COALESCE(cat.nome, 'Sem categoria')"
      else if (dim === 'centro_lucro' || dim === 'centro-lucro') labelExpr = "COALESCE(cl.nome, 'Sem centro de lucro')"
      else {
        return Response.json({ success: false, message: "Parâmetro 'dim' inválido. Use 'categoria' | 'centro_lucro'" }, { status: 400 })
      }

      const sql = `
        SELECT ${labelExpr} AS label,
               COALESCE(SUM(cr.valor_liquido), 0) AS total
          FROM financeiro.contas_receber cr
          LEFT JOIN financeiro.categorias_receita cat ON cat.id = cr.categoria_receita_id
          LEFT JOIN empresa.centros_lucro cl ON cl.id = cr.centro_lucro_id
          ${where}
         GROUP BY 1
         ORDER BY total DESC NULLS LAST
         LIMIT ${limit}
      `.replace(/\n\s+/g, ' ').trim()
      const rows = await runQuery<{ label: string; total: number | null }>(sql, params)
      return Response.json({ success: true, dim, rows, sql_query: sql, sql_params: params })

    } else if (view === 'pagamentos-recebidos') {
      // Pagamentos Recebidos — query fornecida (pr/prl/cr/cli/cf/mp)
      const sql = `
SELECT
  pr.id                               AS pagamento_recebido_id,

  pr.numero_pagamento,
  pr.status,
  pr.data_recebimento,
  pr.data_lancamento,

  cli.nome_fantasia                   AS cliente,

  cf.nome_conta                       AS conta_financeira,
  mp.nome                             AS metodo_pagamento,

  pr.valor_total_recebido,

  pr.observacao

FROM financeiro.pagamentos_recebidos pr

-- ligações para descobrir o cliente (vem das linhas)
LEFT JOIN financeiro.pagamentos_recebidos_linhas prl
       ON prl.pagamento_id = pr.id

LEFT JOIN financeiro.contas_receber cr
       ON cr.id = prl.conta_receber_id

LEFT JOIN entidades.clientes cli
       ON cli.id = cr.cliente_id

-- banco / método
LEFT JOIN financeiro.contas_financeiras cf
       ON cf.id = pr.conta_financeira_id

LEFT JOIN financeiro.metodos_pagamento mp
       ON mp.id = pr.metodo_pagamento_id

GROUP BY
  pr.id,
  pr.numero_pagamento,
  pr.status,
  pr.data_recebimento,
  pr.data_lancamento,
  cli.nome_fantasia,
  cf.nome_conta,
  mp.nome,
  pr.valor_total_recebido,
  pr.observacao

ORDER BY
  pr.data_recebimento DESC,
  pr.id DESC`.replace(/\n\s+/g, ' ').trim()

      const rows = await runQuery<Record<string, unknown>>(sql, [])
      const total = rows.length
      return Response.json({ success: true, view, page, pageSize, total, rows, sql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } })
    } else if (view === 'extrato') {
      baseSql = `FROM financeiro.extratos_bancarios eb
                 LEFT JOIN financeiro.extrato_transacoes t ON t.extrato_id = eb.id
                 LEFT JOIN financeiro.contas_financeiras cf ON cf.id = eb.conta_financeira_id
                 LEFT JOIN financeiro.bancos b ON b.id = eb.conta_id`;
      selectSql = `SELECT eb.id AS extrato_id,
                          eb.data_extrato,
                          b.nome_banco AS banco,
                          b.id AS banco_id,
                          b.imagem_url AS banco_imagem_url,
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
    } else if (view === 'conciliacao') {
      baseSql = `FROM financeiro.conciliacao_bancaria cb
                 LEFT JOIN financeiro.contas_financeiras cf ON cf.id = cb.conta_id
                 LEFT JOIN financeiro.bancos b ON b.id = cf.banco_id`;
      selectSql = `SELECT cb.id AS conciliacao_id,
                          cb.periodo_inicio,
                          cb.periodo_fim,
                          b.nome_banco AS banco,
                          cf.nome_conta AS conta_financeira,
                          cf.tipo_conta,
                          cb.saldo_inicial,
                          cb.saldo_extrato,
                          cb.saldo_sistema,
                          cb.diferenca,
                          cb.status,
                          cb.criado_em`;
      whereDateCol = 'cb.periodo_fim';
    } else if (view === 'bancos') {
      baseSql = `FROM financeiro.bancos b`;
      selectSql = `SELECT b.id AS banco_id,
                          b.nome_banco,
                          b.numero_banco,
                          b.agencia,
                          b.endereco,
                          b.imagem_url,
                          b.criado_em,
                          b.atualizado_em`;
      whereDateCol = 'b.criado_em';
    } else if (view === 'contas') {
      baseSql = `FROM financeiro.contas_financeiras cf`;
      selectSql = `SELECT cf.id AS conta_id,
                          cf.nome_conta,
                          cf.tipo_conta,
                          cf.agencia,
                          cf.numero_conta,
                          cf.pix_chave,
                          cf.saldo_inicial,
                          cf.saldo_atual,
                          cf.data_abertura,
                          cf.ativo,
                          cf.criado_em,
                          cf.atualizado_em`;
      whereDateCol = 'cf.criado_em';
    } else if (view === 'contas-financeiras') {
      // Contas Financeiras (categorias -> Contas Financeiras)
      baseSql = `FROM financeiro.contas_financeiras cf`;
      selectSql = `SELECT cf.id AS conta_id,
                          cf.tenant_id,
                          cf.criado_por,
                          cf.banco_id,
                          cf.nome_conta,
                          cf.tipo_conta,
                          cf.agencia,
                          cf.numero_conta,
                          cf.pix_chave,
                          cf.moeda_id,
                          cf.saldo_inicial,
                          cf.saldo_atual,
                          cf.data_abertura,
                          cf.ativo,
                          cf.criado_em,
                          cf.atualizado_em,
                          cf.conta_contabil_id`;
      whereDateCol = 'cf.criado_em';
    } else if (view === 'categorias') {
      baseSql = `FROM financeiro.categorias_financeiras cat`;
      selectSql = `SELECT cat.id,
                          cat.tenant_id,
                          cat.criado_por,
                          cat.nome,
                          cat.tipo,
                          cat.descricao,
                          cat.ativo,
                          cat.criado_em,
                          cat.atualizado_em,
                          cat.conta_contabil_id`;
      whereDateCol = 'cat.criado_em';
    } else if (view === 'centros-de-custo') {
      baseSql = `FROM financeiro.centros_custo cc`;
      selectSql = `SELECT cc.id,
                          cc.tenant_id,
                          cc.codigo,
                          cc.nome,
                          cc.descricao,
                          cc.ativo,
                          cc.criado_em,
                          cc.atualizado_em`;
      whereDateCol = 'cc.criado_em';
    } else if (view === 'centros-de-lucro') {
      baseSql = `FROM financeiro.centros_lucro cl`;
      selectSql = `SELECT cl.id,
                          cl.tenant_id,
                          cl.codigo,
                          cl.nome,
                          cl.descricao,
                          cl.ativo,
                          cl.criado_em,
                          cl.atualizado_em`;
      whereDateCol = 'cl.criado_em';
    } else if (view === 'categorias-despesa') {
      baseSql = `FROM financeiro.categorias_despesa cd`;
      selectSql = `SELECT cd.id,
                          cd.codigo,
                          cd.nome,
                          cd.descricao,
                          cd.tipo,
                          cd.natureza,
                          cd.categoria_pai_id,
                          cd.plano_conta_id,
                          cd.criado_em,
                          cd.atualizado_em`;
      whereDateCol = 'cd.criado_em';
    } else if (view === 'categorias-receita') {
      baseSql = `FROM financeiro.categorias_receita cr`;
      selectSql = `SELECT cr.id,
                          cr.codigo,
                          cr.nome,
                          cr.descricao,
                          cr.tipo,
                          cr.natureza,
                          cr.plano_conta_id,
                          cr.ativo,
                          cr.criado_em,
                          cr.atualizado_em`;
      whereDateCol = 'cr.criado_em';
    } else if (view === 'projetos') {
      baseSql = `FROM financeiro.projetos p`;
      selectSql = `SELECT p.id,
                          p.tenant_id,
                          p.codigo,
                          p.nome,
                          p.data_inicio,
                          p.data_fim,
                          p.status,
                          p.descricao,
                          p.ativo,
                          p.criado_em,
                          p.atualizado_em`;
      whereDateCol = 'p.data_inicio';
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

    // Para outras views, aplicar filtros de data depois de montar os blocos
    if ((view as string) !== 'contas-a-pagar') {
      if (de) push(`${whereDateCol} >=`, de);
      if (ate) push(`${whereDateCol} <=`, ate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    let orderClause: string
    if (orderBy) {
      orderClause = `ORDER BY ${orderBy} ${orderDir}`
    } else {
      switch (view) {
        case 'extrato':
          orderClause = 'ORDER BY eb.id ASC, t.data_transacao ASC'
          break
        case 'conciliacao':
          orderClause = 'ORDER BY cb.periodo_fim DESC'
          break
        case 'bancos':
          orderClause = 'ORDER BY b.nome_banco ASC'
          break
        case 'contas':
          orderClause = 'ORDER BY cf.id ASC'
          break
        case 'contas-financeiras':
          orderClause = 'ORDER BY cf.nome_conta ASC'
          break
        case 'categorias':
          orderClause = 'ORDER BY cat.tipo ASC, cat.nome ASC'
          break
        case 'centros-de-custo':
          orderClause = 'ORDER BY cc.codigo ASC'
          break
        case 'centros-de-lucro':
          orderClause = 'ORDER BY cl.codigo ASC'
          break
        case 'projetos':
          orderClause = 'ORDER BY p.data_inicio DESC'
          break
        case 'categorias-despesa':
          orderClause = 'ORDER BY cd.tipo ASC, cd.nome ASC'
          break
        case 'categorias-receita':
          orderClause = 'ORDER BY cr.tipo ASC, cr.nome ASC'
          break
        default:
          orderClause = `ORDER BY ${whereDateCol} DESC`
      }
    }
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
