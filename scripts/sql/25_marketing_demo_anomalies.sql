WITH paused_campaign AS (
  SELECT id
  FROM trafegopago.campanhas
  WHERE tenant_id = 1
    AND plataforma = 'meta_ads'
    AND nome ILIKE '%UGC Creative Testing%'
  ORDER BY id
  LIMIT 1
)
UPDATE trafegopago.campanhas c
SET
  status = 'paused',
  ativo = false,
  data_fim = DATE '2026-04-15',
  metadata_json = COALESCE(c.metadata_json, '{}'::jsonb) || jsonb_build_object(
    'demo_anomaly', 'paused_campaign_with_late_spend',
    'paused_at', '2026-04-15'
  ),
  atualizado_em = now()
FROM paused_campaign p
WHERE c.id = p.id;

WITH tracking_gap AS (
  SELECT dd.id
  FROM trafegopago.desempenho_diario dd
  JOIN trafegopago.campanhas c ON c.id = dd.campanha_id AND c.tenant_id = dd.tenant_id
  WHERE dd.tenant_id = 1
    AND dd.plataforma = 'google_ads'
    AND dd.nivel IN ('campanha', 'grupo', 'anuncio')
    AND c.nome ILIKE '%PMax%'
    AND dd.data_ref::date BETWEEN DATE '2026-04-08' AND DATE '2026-04-10'
)
UPDATE trafegopago.desempenho_diario dd
SET
  conversoes = 0,
  receita_atribuida = 0,
  metadata_json = COALESCE(dd.metadata_json, '{}'::jsonb) || jsonb_build_object(
    'demo_anomaly', 'tracking_gap',
    'note', 'Janela simulada com falha de tag/conversao.'
  )
FROM tracking_gap g
WHERE dd.id = g.id;

WITH high_spend_no_conversion AS (
  SELECT dd.id
  FROM trafegopago.desempenho_diario dd
  JOIN trafegopago.campanhas c ON c.id = dd.campanha_id AND c.tenant_id = dd.tenant_id
  WHERE dd.tenant_id = 1
    AND dd.plataforma = 'meta_ads'
    AND dd.nivel = 'anuncio'
    AND c.nome ILIKE '%Interests Skincare%'
    AND dd.data_ref::date BETWEEN DATE '2026-03-18' AND DATE '2026-03-22'
  ORDER BY dd.gasto DESC
  LIMIT 20
)
UPDATE trafegopago.desempenho_diario dd
SET
  conversoes = 0,
  receita_atribuida = 0,
  metadata_json = COALESCE(dd.metadata_json, '{}'::jsonb) || jsonb_build_object(
    'demo_anomaly', 'high_spend_no_conversion',
    'note', 'Anuncios com gasto relevante e zero conversao no periodo.'
  )
FROM high_spend_no_conversion h
WHERE dd.id = h.id;
