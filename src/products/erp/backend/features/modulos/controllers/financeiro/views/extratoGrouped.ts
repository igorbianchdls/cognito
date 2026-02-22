import { runQuery } from '@/lib/postgres';
import type { ParsedFinanceiroRequest } from '../query/parseFinanceiroRequest';

type ExtratoGroupedInput = {
  searchParams: URLSearchParams;
  parsed: ParsedFinanceiroRequest;
};

export async function maybeHandleExtratoGroupedView({
  searchParams,
  parsed,
}: ExtratoGroupedInput): Promise<Response | null> {
  const { view, de, ate, status, page, pageSize, offset, orderDir } = parsed;
  if (view !== 'extrato') return null;

  const groupedParam = (searchParams.get('grouped') || '').toLowerCase();
  const grouped = groupedParam === '1' || groupedParam === 'true';
  if (!grouped) return null;

  try {
    const paramsFilt: unknown[] = [];
    let idxG = 1;
    let whereG = 'WHERE 1=1';
    if (de) { whereG += ` AND e.data_extrato >= $${idxG++}`; paramsFilt.push(de); }
    if (ate) { whereG += ` AND e.data_extrato <= $${idxG++}`; paramsFilt.push(ate); }
    if (status) { whereG += ` AND LOWER(e.status) = $${idxG++}`; paramsFilt.push(status.toLowerCase()); }

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
    };
    const obParam = (searchParams.get('order_by') || 'data_extrato').toLowerCase();
    const orderByExtrato = extratoOrderWhitelist[obParam] || 'e.id';

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
    `.replace(/\n\s+/g, ' ').trim();

    const paramsWithPage: unknown[] = [...paramsFilt, pageSize, offset];
    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage);

    const totalSql = `SELECT COUNT(*)::int AS total FROM financeiro.extratos_bancarios e ${whereG}`;
    const totalRows = await runQuery<{ total: number }>(totalSql, paramsFilt);
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
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json({ success: false, message: msg }, { status: 400 });
  }
}
