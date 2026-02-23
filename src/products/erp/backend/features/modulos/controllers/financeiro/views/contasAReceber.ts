import { runQuery } from '@/lib/postgres';
import type { ParsedFinanceiroRequest } from '../query/parseFinanceiroRequest';

type Input = {
  parsed: ParsedFinanceiroRequest;
};

export async function maybeHandleFinanceiroContasAReceberView({
  parsed,
}: Input): Promise<Response | null> {
  const { view, page, pageSize } = parsed;
  if (view !== 'contas-a-receber') return null;

  const sql = `
SELECT
  cr.id                                AS conta_receber_id,

  cr.numero_documento,
  cr.tipo_documento,
  cr.status,
  cr.data_documento,
  cr.data_lancamento,
  cr.data_vencimento,

  cli.id                               AS cliente_id,
  cli.nome_fantasia                    AS cliente,
  cli.imagem_url                       AS cliente_imagem_url,

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
  cr.id DESC`.replace(/\n\s+/g, ' ').trim();

  const rows = await runQuery<Record<string, unknown>>(sql, []);
  const total = rows.length;
  return Response.json({ success: true, view, page, pageSize, total, rows, sql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } });
}
