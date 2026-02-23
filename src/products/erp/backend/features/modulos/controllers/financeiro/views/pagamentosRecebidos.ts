import { runQuery } from '@/lib/postgres';
import type { ParsedFinanceiroRequest } from '../query/parseFinanceiroRequest';

type Input = { parsed: ParsedFinanceiroRequest };

export async function maybeHandleFinanceiroPagamentosRecebidosView({ parsed }: Input): Promise<Response | null> {
  const { view, page, pageSize } = parsed;
  if (view !== 'pagamentos-recebidos') return null;

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

LEFT JOIN financeiro.pagamentos_recebidos_linhas prl
       ON prl.pagamento_id = pr.id
LEFT JOIN financeiro.contas_receber cr
       ON cr.id = prl.conta_receber_id
LEFT JOIN entidades.clientes cli
       ON cli.id = cr.cliente_id
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
  pr.id DESC`.replace(/\n\s+/g, ' ').trim();

  const rows = await runQuery<Record<string, unknown>>(sql, []);
  const total = rows.length;
  return Response.json({ success: true, view, page, pageSize, total, rows, sql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } });
}
