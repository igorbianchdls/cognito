/** Signed cash by payment date. Reversals affect their own date, not the original period. */
export const cashResultSql = `WITH movements AS (
  SELECT p.id,p.tipo,p.data_pagamento,p.valor_liquido,
    CASE WHEN p.estorno_de_pagamento_id IS NULL THEN 1 ELSE -1 END AS signal,
    COALESCE(r.categoria_id,t.categoria_id) AS categoria_id,
    COALESCE(r.id,0) AS allocation_id,
    CASE WHEN r.id IS NULL THEN p.valor_liquido ELSE round(p.valor_liquido*r.valor/NULLIF(t.valor_total,0),2) END AS portion,
    row_number() OVER(PARTITION BY p.id ORDER BY r.id NULLS FIRST) AS position,
    count(*) OVER(PARTITION BY p.id) AS portions
  FROM erp.pagamentos p
  JOIN LATERAL (
    SELECT cr.id,cr.categoria_id,cr.valor_total FROM erp.contas_receber cr JOIN erp.contas_receber_parcelas cp ON cp.tenant_id=cr.tenant_id AND cp.conta_receber_id=cr.id
      WHERE cr.tenant_id=p.tenant_id AND cp.id=p.conta_receber_parcela_id
    UNION ALL SELECT cr.id,cr.categoria_id,cr.valor_total FROM erp.contas_pagar cr JOIN erp.contas_pagar_parcelas cp ON cp.tenant_id=cr.tenant_id AND cp.conta_pagar_id=cr.id
      WHERE cr.tenant_id=p.tenant_id AND cp.id=p.conta_pagar_parcela_id
  ) t ON true
  LEFT JOIN erp.rateios_financeiros r ON r.tenant_id=p.tenant_id AND r.excluido_em IS NULL AND
    ((p.tipo='receber' AND r.conta_receber_id=t.id) OR (p.tipo='pagar' AND r.conta_pagar_id=t.id))
  WHERE p.tenant_id=$1 AND p.data_pagamento BETWEEN $2 AND $3 AND p.excluido_em IS NULL
), allocated AS (
  SELECT *,CASE WHEN position=portions THEN valor_liquido-COALESCE(sum(portion) OVER(PARTITION BY id ORDER BY position ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),0) ELSE portion END AS amount FROM movements
)
SELECT date_trunc('month',a.data_pagamento)::date AS competencia,COALESCE(c.nome,'Sem categoria') AS categoria,
  CASE WHEN a.tipo='receber' THEN 'recebimento' ELSE 'pagamento' END AS tipo,
  sum(a.amount*a.signal*CASE WHEN a.tipo='receber' THEN 1 ELSE -1 END)::numeric(18,2) AS valor
FROM allocated a LEFT JOIN erp.categorias c ON c.tenant_id=$1 AND c.id=a.categoria_id
GROUP BY 1,c.id,c.nome,3 ORDER BY 1,3,2`
