UPDATE trafegopago.campanhas
SET nome = replace(nome, '2026Q1', '2026H1'),
    atualizado_em = now()
WHERE tenant_id = 1
  AND plataforma IN ('meta_ads', 'google_ads')
  AND nome LIKE '%2026Q1%';
