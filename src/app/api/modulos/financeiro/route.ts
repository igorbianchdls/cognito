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
      const tenantFilter = tenantId ? ` AND lf.tenant_id = $${idxKpi++}` : '';
      const kpiParams: unknown[] = tenantId ? [...kpiParamsBase, tenantId] : [...kpiParamsBase];

      // A RECEBER NO MÊS — usar exatamente a query solicitada (DATE() + BETWEEN, tipo/status literais)
      const arSql = `SELECT COALESCE(SUM(lf.valor), 0) AS total
                     FROM financeiro.lancamentos_financeiros lf
                    WHERE lf.tipo = 'conta_a_receber'
                      AND lf.status = 'pendente'
                      AND DATE(lf.data_vencimento) BETWEEN $1 AND $2${tenantFilter}`.replace(/\s+/g, ' ');
      const [arRow] = await runQuery<{ total: number | null }>(arSql, kpiParams);

      // A PAGAR NO MÊS (vencimento dentro do período, pendente)
      // A PAGAR NO MÊS — usar exatamente a query solicitada (DATE() + BETWEEN, tipo/status literais)
      const apSql = `SELECT COALESCE(SUM(lf.valor), 0) AS total
                     FROM financeiro.lancamentos_financeiros lf
                    WHERE lf.tipo = 'conta_a_pagar'
                      AND lf.status = 'pendente'
                      AND DATE(lf.data_vencimento) BETWEEN $1 AND $2${tenantFilter}`.replace(/\s+/g, ' ');
      const [apRow] = await runQuery<{ total: number | null }>(apSql, kpiParams);

      // RECEBIDO NO MÊS — usar exatamente a query solicitada (DATE() + BETWEEN, tipo/status por AR recebido)
      const recSql = `SELECT COALESCE(SUM(lf.valor), 0) AS total
                       FROM financeiro.lancamentos_financeiros lf
                      WHERE lf.tipo = 'conta_a_receber'
                        AND lf.status = 'recebido'
                        AND DATE(lf.data_vencimento) BETWEEN $1 AND $2${tenantFilter}`.replace(/\s+/g, ' ');
      const [recRow] = await runQuery<{ total: number | null }>(recSql, kpiParams);

      // CONTAS PAGAS NO MÊS — usar exatamente a query solicitada (DATE() + BETWEEN, tipo/status literais)
      const pagoSql = `SELECT COALESCE(SUM(lf.valor), 0) AS total
                        FROM financeiro.lancamentos_financeiros lf
                       WHERE lf.tipo = 'conta_a_pagar'
                         AND lf.status = 'pago'
                         AND DATE(lf.data_vencimento) BETWEEN $1 AND $2${tenantFilter}`.replace(/\s+/g, ' ');
      const [pagoRow] = await runQuery<{ total: number | null }>(pagoSql, kpiParams);

      return Response.json({
        success: true,
        de: deDate,
        ate: ateDate,
        kpis: {
          ar_mes: Number(arRow?.total ?? 0),
          ap_mes: Number(apRow?.total ?? 0),
          recebidos_mes: Number(recRow?.total ?? 0),
          pagos_mes: Number(pagoRow?.total ?? 0),
        },
        sql_query: {
          a_receber_mes: arSql,
          a_pagar_mes: apSql,
          recebidos_mes: recSql,
          pagos_mes: pagoSql,
        },
        sql_params: kpiParams,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return Response.json({ success: false, message: msg }, { status: 400 });
    }
  }

    if (view === 'aging') {
      // Aging buckets por tipo (AR | AP) com somatórios
      const tipo = (searchParams.get('tipo') || '').toLowerCase(); // 'ar' | 'ap'
      if (tipo !== 'ar' && tipo !== 'ap') {
        return Response.json({ success: false, message: "Parâmetro 'tipo' deve ser 'ar' ou 'ap'" }, { status: 400 });
      }

      const tipoLancamento = tipo === 'ar' ? 'conta_a_receber' : 'conta_a_pagar';
      const tenantId = parseNumber(searchParams.get('tenant_id'));
      // Data de referência para aging: ?ref=YYYY-MM-DD, senão usa 'ate', senão CURRENT_DATE
      const ref = searchParams.get('ref') || ate || undefined;
      const paramsAging: unknown[] = [];
      let idxA = 1;
      const refFilterExpr = ref ? `$${idxA++}` : 'CURRENT_DATE';
      if (ref) paramsAging.push(ref);
      const tenantFilter = tenantId ? ` AND lf.tenant_id = $${idxA++}` : '';
      if (tenantId) paramsAging.push(tenantId);

      const agingSql = `
        WITH buckets AS (
          SELECT 1 AS ord, 'Vencido >30'::text AS bucket
          UNION ALL SELECT 2, 'Vencido 1–30'
          UNION ALL SELECT 3, 'Vence 1–7'
          UNION ALL SELECT 4, 'Vence 8–15'
          UNION ALL SELECT 5, 'Vence 16–30'
        ), agg AS (
          SELECT
            CASE
              WHEN lf.data_vencimento < ${refFilterExpr} - INTERVAL '30 days' THEN 'Vencido >30'
              WHEN lf.data_vencimento < ${refFilterExpr} THEN 'Vencido 1–30'
              WHEN lf.data_vencimento <= ${refFilterExpr} + INTERVAL '7 days' THEN 'Vence 1–7'
              WHEN lf.data_vencimento <= ${refFilterExpr} + INTERVAL '15 days' THEN 'Vence 8–15'
              WHEN lf.data_vencimento <= ${refFilterExpr} + INTERVAL '30 days' THEN 'Vence 16–30'
            END AS bucket,
            SUM(lf.valor) AS total
          FROM financeiro.lancamentos_financeiros lf
          WHERE LOWER(lf.tipo) = '${tipoLancamento}'
            AND LOWER(lf.status) = 'pendente'
            ${tenantFilter}
          GROUP BY 1
        )
        SELECT b.bucket, COALESCE(a.total, 0) AS total
        FROM buckets b
        LEFT JOIN agg a ON a.bucket = b.bucket
        ORDER BY b.ord
      `.replace(/\n\s+/g, ' ').trim();

      const rows = await runQuery<{ bucket: string; total: number | null }>(agingSql, paramsAging);
      return Response.json({ success: true, ref: ref || null, rows, sql_query: agingSql, sql_params: paramsAging });
    } else if (view === 'cashflow-realized') {
      // Fluxo de Caixa Realizado: entradas (pagamento_recebido) x saídas (pagamento_efetuado)
      const gb = (searchParams.get('group_by') || 'month').toLowerCase(); // day|week|month
      const valid = gb === 'day' || gb === 'week' || gb === 'month';
      const groupBy = valid ? gb : 'month';
      const tenantId = parseNumber(searchParams.get('tenant_id'));
      const contaId = parseNumber(searchParams.get('conta_id'));

      const bucketExpr = `date_trunc('${groupBy}', lf.data_lancamento)::date`;
      const paramsR: unknown[] = [];
      let idxR = 1;
      let whereBase = `WHERE 1=1`;
      if (de) { whereBase += ` AND lf.data_lancamento >= $${idxR++}`; paramsR.push(de); }
      if (ate) { whereBase += ` AND lf.data_lancamento <= $${idxR++}`; paramsR.push(ate); }
      if (tenantId) { whereBase += ` AND lf.tenant_id = $${idxR++}`; paramsR.push(tenantId); }

      // Optional account filter via header (ap/ar)
      const contaFiltroReceb = contaId ? ` AND ar.conta_financeira_id = $${idxR++}` : '';
      if (contaId) paramsR.push(contaId);
      const contaFiltroPago = contaId ? ` AND ap.conta_financeira_id = $${idxR++}` : '';
      if (contaId) paramsR.push(contaId);

      const sql = `
        SELECT period,
               SUM(entradas) AS entradas,
               SUM(saidas)   AS saidas
          FROM (
            SELECT ${bucketExpr} AS period, SUM(lf.valor) AS entradas, 0::numeric AS saidas
              FROM financeiro.lancamentos_financeiros lf
              JOIN financeiro.lancamentos_financeiros ar ON ar.id = lf.lancamento_origem_id
              ${whereBase} AND LOWER(lf.tipo) = 'pagamento_recebido'${contaFiltroReceb}
              GROUP BY 1
            UNION ALL
            SELECT ${bucketExpr} AS period, 0::numeric AS entradas, SUM(lf.valor) AS saidas
              FROM financeiro.lancamentos_financeiros lf
              JOIN financeiro.lancamentos_financeiros ap ON ap.id = lf.lancamento_origem_id
              ${whereBase} AND LOWER(lf.tipo) = 'pagamento_efetuado'${contaFiltroPago}
              GROUP BY 1
          ) s
         GROUP BY period
         ORDER BY period ASC
      `.replace(/\n\s+/g, ' ').trim();

      const rows = await runQuery<{ period: string; entradas: number | null; saidas: number | null }>(sql, paramsR);
      const data = rows.map(r => ({
        period: r.period,
        entradas: Number(r.entradas || 0),
        saidas: Number(r.saidas || 0),
        net: Number(r.entradas || 0) - Number(r.saidas || 0)
      }));
      return Response.json({ success: true, rows: data, sql_query: sql, sql_params: paramsR, group_by: groupBy });
    } else if (view === 'cashflow-projected') {
      // Fluxo de Caixa Projetado: títulos pendentes por vencimento (AR/AP)
      const gb = (searchParams.get('group_by') || 'month').toLowerCase(); // day|week|month
      const valid = gb === 'day' || gb === 'week' || gb === 'month';
      const groupBy = valid ? gb : 'month';
      const tenantId = parseNumber(searchParams.get('tenant_id'));
      const saldoInicial = parseNumber(searchParams.get('saldo_inicial'), 0) || 0;

      const bucketExpr = `date_trunc('${groupBy}', lf.data_vencimento)::date`;
      const paramsP: unknown[] = [];
      let idxP = 1;
      let wherePend = `WHERE LOWER(lf.status) = 'pendente'`;
      if (de) { wherePend += ` AND lf.data_vencimento >= $${idxP++}`; paramsP.push(de); }
      if (ate) { wherePend += ` AND lf.data_vencimento <= $${idxP++}`; paramsP.push(ate); }
      if (tenantId) { wherePend += ` AND lf.tenant_id = $${idxP++}`; paramsP.push(tenantId); }

      const sql = `
        SELECT period,
               SUM(entradas) AS entradas,
               SUM(saidas)   AS saidas
          FROM (
            SELECT ${bucketExpr} AS period, SUM(lf.valor) AS entradas, 0::numeric AS saidas
              FROM financeiro.lancamentos_financeiros lf
              ${wherePend} AND LOWER(lf.tipo) = 'conta_a_receber'
              GROUP BY 1
            UNION ALL
            SELECT ${bucketExpr} AS period, 0::numeric AS entradas, SUM(lf.valor) AS saidas
              FROM financeiro.lancamentos_financeiros lf
              ${wherePend} AND LOWER(lf.tipo) = 'conta_a_pagar'
              GROUP BY 1
          ) s
         GROUP BY period
         ORDER BY period ASC
      `.replace(/\n\s+/g, ' ').trim();

      const rows = await runQuery<{ period: string; entradas: number | null; saidas: number | null }>(sql, paramsP);
      // Compute saldo projetado acumulado
      let saldo = saldoInicial;
      const data = rows.map(r => {
        const entradas = Number(r.entradas || 0);
        const saidas = Number(r.saidas || 0);
        const net = entradas - saidas;
        saldo += net;
        return { period: r.period, entradas, saidas, net, saldo_projetado: saldo };
      });
      return Response.json({ success: true, saldo_inicial: saldoInicial, rows: data, sql_query: sql, sql_params: paramsP, group_by: groupBy });
    } else if (view === 'top-despesas') {
      // Top N despesas por dimensão (categoria | centro_custo | departamento)
      const dim = (searchParams.get('dim') || '').toLowerCase();
      const limit = Math.max(1, Math.min(50, parseNumber(searchParams.get('limit'), 5) || 5));

      let dimExpr = '';
      if (dim === 'categoria') dimExpr = "COALESCE(cat_ap.nome, 'Sem categoria')";
      else if (dim === 'centro_custo' || dim === 'centro-custo') dimExpr = "COALESCE(cc_ap.nome, 'Sem centro de custo')";
      else if (dim === 'departamento') dimExpr = "COALESCE(dep_ap.nome, 'Sem departamento')";
      else if (dim === 'centro_lucro' || dim === 'centro-lucro') dimExpr = "COALESCE(cl_ap.nome, 'Sem centro de lucro')";
      else if (dim === 'filial') dimExpr = "COALESCE(fil_ap.nome, 'Sem filial')";
      else if (dim === 'projeto') dimExpr = "COALESCE(prj_ap.nome, 'Sem projeto')";
      else if (dim === 'fornecedor') dimExpr = "COALESCE(forn_ap.nome, 'Sem fornecedor')";
      else {
        return Response.json({ success: false, message: "Parâmetro 'dim' inválido. Use 'categoria' | 'centro_custo' | 'departamento' | 'centro_lucro' | 'projeto' | 'filial' | 'fornecedor'" }, { status: 400 });
      }

      const tenantId = parseNumber(searchParams.get('tenant_id'));
      const params: unknown[] = [];
      let idx = 1;
      let where = `WHERE lf.tipo = 'pagamento_efetuado'`;

      // Período em data de pagamento (realizado)
      if (de) { where += ` AND lf.data_lancamento >= $${idx++}`; params.push(de); }
      if (ate) { where += ` AND lf.data_lancamento <= $${idx++}`; params.push(ate); }
      if (tenantId) { where += ` AND lf.tenant_id = $${idx++}`; params.push(tenantId); }

      const sql = `
        SELECT ${dimExpr} AS label, COALESCE(SUM(lf.valor), 0) AS total
          FROM financeiro.lancamentos_financeiros lf
          JOIN financeiro.lancamentos_financeiros ap ON ap.id = lf.lancamento_origem_id
          LEFT JOIN financeiro.categorias_financeiras cat_ap ON cat_ap.id = ap.categoria_id
          LEFT JOIN empresa.centros_custo cc_ap ON cc_ap.id = ap.centro_custo_id
          LEFT JOIN empresa.departamentos dep_ap ON dep_ap.id = ap.departamento_id
          LEFT JOIN empresa.centros_lucro cl_ap ON cl_ap.id = ap.centro_lucro_id
          LEFT JOIN empresa.filiais fil_ap ON fil_ap.id = ap.filial_id
          LEFT JOIN financeiro.projetos prj_ap ON prj_ap.id = ap.projeto_id
          LEFT JOIN entidades.fornecedores forn_ap ON forn_ap.id = ap.fornecedor_id
          ${where}
          GROUP BY 1
          ORDER BY total DESC
          LIMIT ${limit}
      `.replace(/\n\s+/g, ' ').trim();

      const rows = await runQuery<{ label: string; total: number | null }>(sql, params);
      return Response.json({ success: true, rows, sql_query: sql, sql_params: params });
    } else if (view === 'top-receitas') {
      // Top N receitas por cliente (contas a receber no período)
      const dim = (searchParams.get('dim') || '').toLowerCase();
      const limit = Math.max(1, Math.min(50, parseNumber(searchParams.get('limit'), 5) || 5));
      if (dim !== 'cliente') {
        return Response.json({ success: false, message: "Parâmetro 'dim' inválido. Use 'cliente'" }, { status: 400 });
      }

      const tenantId = parseNumber(searchParams.get('tenant_id'));
      const params: unknown[] = [];
      let idx = 1;
      let where = `WHERE l.tipo = 'conta_a_receber' AND (l.status IS NULL OR l.status NOT IN ('cancelado'))`;
      if (de) { where += ` AND l.data_vencimento >= $${idx++}`; params.push(de); }
      if (ate) { where += ` AND l.data_vencimento <= $${idx++}`; params.push(ate); }
      if (tenantId) { where += ` AND l.tenant_id = $${idx++}`; params.push(tenantId); }

      const sql = `
        SELECT
          COALESCE(c.nome_fantasia, 'Sem cliente') AS label,
          COALESCE(SUM(l.valor), 0) AS total
        FROM financeiro.lancamentos_financeiros l
        LEFT JOIN entidades.clientes c ON c.id = l.cliente_id
        ${where}
        GROUP BY c.nome_fantasia
        ORDER BY total DESC
        LIMIT ${limit}
      `.replace(/\n\s+/g, ' ').trim();

      const rows = await runQuery<{ label: string; total: number | null }>(sql, params);
      return Response.json({ success: true, rows, sql_query: sql, sql_params: params });
    } else if (view === 'top-receitas-centro-lucro') {
      // Top N centros de lucro por contas a receber
      const limit = Math.max(1, Math.min(50, parseNumber(searchParams.get('limit'), 5) || 5));
      const tenantId = parseNumber(searchParams.get('tenant_id'));
      const params: unknown[] = [];
      let idx = 1;
      let where = `WHERE l.tipo = 'conta_a_receber' AND (l.status IS NULL OR l.status NOT IN ('cancelado'))`;
      if (de) { where += ` AND l.data_vencimento >= $${idx++}`; params.push(de); }
      if (ate) { where += ` AND l.data_vencimento <= $${idx++}`; params.push(ate); }
      if (tenantId) { where += ` AND l.tenant_id = $${idx++}`; params.push(tenantId); }

      const sql = `
        SELECT
          COALESCE(cl.nome, 'Sem centro de lucro') AS label,
          COALESCE(SUM(l.valor), 0) AS total
        FROM financeiro.lancamentos_financeiros l
        LEFT JOIN empresa.centros_lucro cl ON cl.id = l.centro_lucro_id
        ${where}
        GROUP BY cl.nome
        ORDER BY total DESC
        LIMIT ${limit}
      `.replace(/\n\s+/g, ' ').trim();

      const rows = await runQuery<{ label: string; total: number | null }>(sql, params);
      return Response.json({ success: true, rows, sql_query: sql, sql_params: params });
    } else if (view === 'contas-a-pagar') {
      // Contas a Pagar – nova estrutura simplificada
      baseSql = `FROM financeiro.lancamentos_financeiros lf
                 LEFT JOIN financeiro.categorias_financeiras cf
                        ON lf.categoria_id = cf.id
                 LEFT JOIN empresa.centros_lucro cl
                        ON lf.centro_lucro_id = cl.id
                 LEFT JOIN empresa.departamentos dep
                        ON lf.departamento_id = dep.id
                 LEFT JOIN empresa.filiais fi
                        ON lf.filial_id = fi.id
                 LEFT JOIN financeiro.projetos pr
                        ON lf.projeto_id = pr.id
                 LEFT JOIN entidades.fornecedores f
                        ON lf.fornecedor_id = f.id`;
      selectSql = `SELECT
                        lf.id AS conta_id,
                        lf.tipo AS tipo_conta,
                        lf.descricao AS descricao_conta,
                        lf.valor AS valor_a_pagar,
                        lf.status AS status_conta,
                        lf.data_lancamento,
                        lf.data_vencimento,
                        lf.observacao,
                        lf.storage_key AS storage_key,
                        lf.nome_arquivo AS nome_arquivo,
                        lf.content_type AS content_type,
                        lf.tamanho_bytes AS tamanho_bytes,
                        cf.nome AS categoria_nome,
                        cl.nome AS centro_lucro_nome,
                        dep.nome AS departamento_nome,
                        fi.nome AS filial_nome,
                        pr.nome AS projeto_nome,
                        f.nome_fantasia AS fornecedor_nome,
                        lf.fornecedor_id AS fornecedor_id,
                        f.imagem_url AS fornecedor_imagem_url`;
      whereDateCol = 'lf.data_vencimento';
      conditions.push(`lf.tipo = 'conta_a_pagar'`);
      if (fornecedor_id) push('lf.fornecedor_id =', fornecedor_id);
      if (status) push('LOWER(lf.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('lf.valor >=', valor_min);
      if (valor_max !== undefined) push('lf.valor <=', valor_max);
      if (de) push(`${whereDateCol} >=`, de);
      if (ate) push(`${whereDateCol} <=`, ate);
    } else if (view === 'pagamentos-efetuados') {
      // Pagamentos Efetuados – dimensões vindas do cabeçalho (conta_a_pagar)
      baseSql = `FROM financeiro.lancamentos_financeiros lf
                 JOIN financeiro.lancamentos_financeiros ap ON ap.id = lf.lancamento_origem_id
                 LEFT JOIN financeiro.metodos_pagamento mp ON mp.id = ap.metodo_pagamento_id
                 LEFT JOIN financeiro.contas_financeiras cf ON cf.id = ap.conta_financeira_id
                 LEFT JOIN financeiro.categorias_financeiras cat_ap ON cat_ap.id = ap.categoria_id
                 LEFT JOIN empresa.centros_custo cc_ap ON cc_ap.id = ap.centro_custo_id
                 LEFT JOIN empresa.departamentos dep_ap ON dep_ap.id = ap.departamento_id
                 LEFT JOIN empresa.filiais fil_ap ON fil_ap.id = ap.filial_id
                 LEFT JOIN financeiro.projetos prj_ap ON prj_ap.id = ap.projeto_id
                 LEFT JOIN entidades.fornecedores forn_ap ON forn_ap.id = ap.fornecedor_id`;
      selectSql = `SELECT
                        lf.id AS pagamento_id,
                        ap.id AS titulo_id,
                        lf.data_lancamento AS data_pagamento,
                        ap.data_vencimento AS vencimento_titulo,
                        ap.valor AS valor_titulo,
                        lf.valor AS valor_pago,
                        'SAIDA' AS natureza,
                        mp.nome AS metodo_pagamento,
                        cf.nome_conta AS conta_financeira,
                        cat_ap.nome AS categoria,
                        cat_ap.nome AS categoria_financeira,
                        cc_ap.nome AS centro_custo,
                        dep_ap.nome AS departamento,
                        fil_ap.nome AS filial,
                        prj_ap.nome AS projeto,
                        lf.storage_key AS storage_key,
                        lf.nome_arquivo AS nome_arquivo,
                        lf.content_type AS content_type,
                        lf.tamanho_bytes AS tamanho_bytes,
                        forn_ap.nome_fantasia AS fornecedor,
                        ap.fornecedor_id AS fornecedor_id,
                        forn_ap.imagem_url AS fornecedor_imagem_url,
                        ap.descricao AS titulo_descricao,
                        lf.descricao AS pagamento_descricao,
                        lf.descricao AS descricao_pagamento,
                        lf.status`;
      whereDateCol = 'lf.data_lancamento';
      conditions.push(`lf.tipo = 'pagamento_efetuado'`);
      if (fornecedor_id) push('ap.fornecedor_id =', fornecedor_id);
      if (status) push('LOWER(lf.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('lf.valor >=', valor_min);
      if (valor_max !== undefined) push('lf.valor <=', valor_max);
    } else if (view === 'pagamentos-recebidos') {
      // Pagamentos Recebidos – nova estrutura com dados herdados da origem
      baseSql = `FROM financeiro.lancamentos_financeiros lf
                 LEFT JOIN financeiro.lancamentos_financeiros orig
                        ON lf.lancamento_origem_id = orig.id
                 LEFT JOIN financeiro.categorias_financeiras cf
                        ON orig.categoria_id = cf.id
                 LEFT JOIN empresa.centros_lucro cl
                        ON orig.centro_lucro_id = cl.id
                 LEFT JOIN empresa.departamentos dep
                        ON orig.departamento_id = dep.id
                 LEFT JOIN empresa.filiais fi
                        ON orig.filial_id = fi.id
                 LEFT JOIN financeiro.projetos pr
                        ON orig.projeto_id = pr.id
                 LEFT JOIN entidades.clientes c
                        ON orig.cliente_id = c.id
                 LEFT JOIN financeiro.contas_financeiras cf2
                        ON lf.conta_financeira_id = cf2.id
                 LEFT JOIN financeiro.metodos_pagamento mp
                        ON lf.metodo_pagamento_id = mp.id`;
      selectSql = `SELECT
                          lf.id AS pagamento_id,
                          lf.tipo AS tipo_pagamento,
                          lf.descricao AS descricao_pagamento,
                          lf.valor AS valor_recebido,
                          lf.status AS status_pagamento,
                          lf.data_lancamento AS data_pagamento,
                          lf.observacao,
                          lf.storage_key AS storage_key,
                          lf.nome_arquivo AS nome_arquivo,
                          lf.content_type AS content_type,
                          lf.tamanho_bytes AS tamanho_bytes,
                          orig.id AS origem_id,
                          orig.cliente_id AS cliente_id,
                          orig.descricao AS descricao_origem,
                          cf.nome AS categoria_nome,
                          cl.nome AS centro_lucro_nome,
                          dep.nome AS departamento_nome,
                          fi.nome AS filial_nome,
                          pr.nome AS projeto_nome,
                          c.nome_fantasia AS cliente_nome,
                          c.imagem_url AS cliente_imagem_url,
                          mp.nome AS metodo_pagamento_nome,
                          cf2.nome_conta AS conta_financeira_nome`;
      whereDateCol = 'lf.data_lancamento';
      conditions.push(`lf.tipo = 'pagamento_recebido'`);
      if (cliente_id) push('orig.cliente_id =', cliente_id);
      if (status) push('LOWER(lf.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('lf.valor >=', valor_min);
      if (valor_max !== undefined) push('lf.valor <=', valor_max);
    } else if (view === 'contas-a-receber') {
      // Contas a Receber – nova estrutura simplificada
      baseSql = `FROM financeiro.lancamentos_financeiros lf
                 LEFT JOIN financeiro.categorias_financeiras cf
                        ON lf.categoria_id = cf.id
                 LEFT JOIN empresa.centros_lucro cl
                        ON lf.centro_lucro_id = cl.id
                 LEFT JOIN empresa.departamentos dep
                        ON lf.departamento_id = dep.id
                 LEFT JOIN empresa.filiais fi
                        ON lf.filial_id = fi.id
                 LEFT JOIN financeiro.projetos pr
                        ON lf.projeto_id = pr.id
                 LEFT JOIN entidades.clientes c
                        ON lf.cliente_id = c.id`;
      selectSql = `SELECT
                          lf.id AS conta_id,
                          lf.tipo AS tipo_conta,
                          lf.descricao AS descricao_conta,
                          lf.valor AS valor_a_receber,
                          lf.status AS status_conta,
                          lf.data_lancamento,
                          lf.data_vencimento,
                          lf.observacao,
                          lf.storage_key AS storage_key,
                          lf.nome_arquivo AS nome_arquivo,
                          lf.content_type AS content_type,
                          lf.tamanho_bytes AS tamanho_bytes,
                          cf.nome AS categoria_nome,
                          cl.nome AS centro_lucro_nome,
                          dep.nome AS departamento_nome,
                          fi.nome AS filial_nome,
                          pr.nome AS projeto_nome,
                          c.nome_fantasia AS cliente_nome,
                          c.imagem_url AS cliente_imagem_url,
                          lf.cliente_id AS cliente_id`;
      // Filtro principal por data: vencimento
      whereDateCol = 'lf.data_vencimento';
      conditions.push(`lf.tipo = 'conta_a_receber'`);
      if (cliente_id) push('lf.cliente_id =', cliente_id);
      if (status) push('LOWER(lf.status) =', status.toLowerCase());
      if (valor_min !== undefined) push('lf.valor >=', valor_min);
      if (valor_max !== undefined) push('lf.valor <=', valor_max);
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
    if (view !== 'contas-a-pagar') {
      if (de) push(`${whereDateCol} >=`, de);
      if (ate) push(`${whereDateCol} <=`, ate);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    let orderClause: string
    if (orderBy) {
      orderClause = `ORDER BY ${orderBy} ${orderDir}`
    } else {
      switch (view) {
        case 'contas-a-pagar':
          orderClause = 'ORDER BY lf.data_vencimento ASC NULLS LAST, lf.id ASC'
          break
        case 'pagamentos-efetuados':
          orderClause = 'ORDER BY lf.data_lancamento DESC, lf.id DESC'
          break
        case 'pagamentos-recebidos':
          orderClause = 'ORDER BY lf.data_lancamento DESC, lf.id DESC'
          break
        case 'contas-a-receber':
          orderClause = 'ORDER BY lf.data_vencimento ASC NULLS LAST, lf.id ASC'
          break
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
