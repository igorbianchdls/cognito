import { runQuery } from '@/lib/postgres';
import type { ParsedFinanceiroRequest } from '../query/parseFinanceiroRequest';

type KpisViewInput = {
  searchParams: URLSearchParams;
  parsed: ParsedFinanceiroRequest;
};

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback);

export async function maybeHandleKpisView({
  searchParams,
  parsed,
}: KpisViewInput): Promise<Response | null> {
  const { view, de, ate } = parsed;
  if (view !== 'kpis') return null;

  try {
    const now = new Date();
    const firstDayDefault = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastDayDefault = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const deDate = de || firstDayDefault;
    const ateDate = ate || lastDayDefault;

    const kpiParamsBase: unknown[] = [deDate, ateDate];
    const idxKpi = 3;
    const tenantId = parseNumber(searchParams.get('tenant_id'));
    const kpiParams: unknown[] = tenantId ? [...kpiParamsBase, tenantId] : [...kpiParamsBase];
    const tenantFilterCr = tenantId ? ` AND cr.tenant_id = $${idxKpi}` : '';
    const tenantFilterCp = tenantId ? ` AND cp.tenant_id = $${idxKpi}` : '';
    const tenantFilterPr = tenantId ? ` AND pr.tenant_id = $${idxKpi}` : '';
    const tenantFilterPe = tenantId ? ` AND pe.tenant_id = $${idxKpi}` : '';

    const arSql = `SELECT COALESCE(SUM(cr.valor_liquido), 0) AS total
                     FROM financeiro.contas_receber cr
                    WHERE LOWER(cr.status) NOT IN ('recebido','baixado','liquidado')
                      AND DATE(cr.data_vencimento) BETWEEN $1 AND $2${tenantFilterCr}`.replace(/\s+/g, ' ');
    const [arRow] = await runQuery<{ total: number | null }>(arSql, kpiParams);

    const apSql = `SELECT COALESCE(SUM(cp.valor_liquido), 0) AS total
                     FROM financeiro.contas_pagar cp
                    WHERE LOWER(cp.status) NOT IN ('pago','baixado','liquidado')
                      AND DATE(cp.data_vencimento) BETWEEN $1 AND $2${tenantFilterCp}`.replace(/\s+/g, ' ');
    const [apRow] = await runQuery<{ total: number | null }>(apSql, kpiParams);

    const recSql = `SELECT COALESCE(SUM(pr.valor_total_recebido), 0) AS total
                      FROM financeiro.pagamentos_recebidos pr
                     WHERE DATE(pr.data_recebimento) BETWEEN $1 AND $2${tenantFilterPr}`.replace(/\s+/g, ' ');
    const [recRow] = await runQuery<{ total: number | null }>(recSql, kpiParams);

    const pagoSql = `SELECT COALESCE(SUM(pe.valor_total_pagamento), 0) AS total
                      FROM financeiro.pagamentos_efetuados pe
                     WHERE DATE(pe.data_pagamento) BETWEEN $1 AND $2${tenantFilterPe}`.replace(/\s+/g, ' ');
    const [pagoRow] = await runQuery<{ total: number | null }>(pagoSql, kpiParams);

    const receitaSql = `SELECT COALESCE(SUM(cr.valor_liquido), 0) AS total
                          FROM financeiro.contas_receber cr
                         WHERE DATE(cr.data_vencimento) BETWEEN $1 AND $2${tenantFilterCr}`.replace(/\s+/g, ' ');
    const [receitaRow] = await runQuery<{ total: number | null }>(receitaSql, kpiParams);

    const despesasSql = `SELECT COALESCE(SUM(cp.valor_liquido), 0) AS total
                           FROM financeiro.contas_pagar cp
                          WHERE DATE(cp.data_vencimento) BETWEEN $1 AND $2${tenantFilterCp}`.replace(/\s+/g, ' ');
    const [despesasRow] = await runQuery<{ total: number | null }>(despesasSql, kpiParams);

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
