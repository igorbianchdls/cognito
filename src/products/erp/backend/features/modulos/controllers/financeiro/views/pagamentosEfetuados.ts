import { runQuery } from '@/lib/postgres';
import type { ParsedFinanceiroRequest } from '../query/parseFinanceiroRequest';

type Input = { parsed: ParsedFinanceiroRequest };

export async function maybeHandleFinanceiroPagamentosEfetuadosView({ parsed }: Input): Promise<Response | null> {
  const { view, page, pageSize } = parsed;
  if (view !== 'pagamentos-efetuados') return null;

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

LEFT JOIN financeiro.pagamentos_efetuados_linhas pel
       ON pel.pagamento_id = pe.id
LEFT JOIN financeiro.contas_pagar cp
       ON cp.id = pel.conta_pagar_id
LEFT JOIN entidades.fornecedores f
       ON f.id = cp.fornecedor_id
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
  pe.id DESC`.replace(/\n\s+/g, ' ').trim();

  const rows = await runQuery<Record<string, unknown>>(sql, []);
  const total = rows.length;
  return Response.json({ success: true, view, page, pageSize, total, rows, sql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } });
}
