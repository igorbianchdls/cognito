-- Drive cleanup and realistic organization

WITH ws AS (
  SELECT id, owner_id
  FROM drive.workspaces
  WHERE archived_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1
),
targets(name) AS (
  VALUES
    ('Financeiro - Titulos e Comprovantes'),
    ('Comercial - CRM e Vendas'),
    ('Compras - Fornecedores'),
    ('Estoque - Catalogo e Inventario'),
    ('Administrativo - Contratos')
)
INSERT INTO drive.folders (workspace_id, parent_id, name, created_by)
SELECT ws.id, NULL, targets.name, ws.owner_id
FROM ws
CROSS JOIN targets
WHERE NOT EXISTS (
  SELECT 1
  FROM drive.folders f
  WHERE f.workspace_id = ws.id
    AND f.parent_id IS NULL
    AND lower(f.name) = lower(targets.name)
);

WITH ws AS (
  SELECT id
  FROM drive.workspaces
  WHERE archived_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1
),
finance_folder AS (
  SELECT f.id, f.workspace_id
  FROM drive.folders f
  JOIN ws ON ws.id = f.workspace_id
  WHERE lower(f.name) = lower('Financeiro - Titulos e Comprovantes')
    AND f.parent_id IS NULL
  ORDER BY f.created_at ASC
  LIMIT 1
),
docs AS (
  SELECT * FROM (
    SELECT
      row_number() OVER (ORDER BY cp.valor_liquido DESC, cp.id ASC) AS rn,
      'AP_' || regexp_replace(cp.numero_documento, '[^a-zA-Z0-9_-]+', '-', 'g') || '_' ||
      regexp_replace(coalesce(forn.nome_fantasia, 'fornecedor'), '[^a-zA-Z0-9_-]+', '-', 'g') ||
      '_venc-' || to_char(cp.data_vencimento, 'YYYY-MM-DD') || '.pdf' AS desired_name
    FROM financeiro.contas_pagar cp
    LEFT JOIN entidades.fornecedores forn ON forn.id = cp.fornecedor_id
    WHERE cp.tenant_id = 1
    ORDER BY cp.valor_liquido DESC, cp.id ASC
    LIMIT 3
  ) a
  UNION ALL
  SELECT * FROM (
    SELECT
      row_number() OVER (ORDER BY cr.valor_liquido DESC, cr.id ASC) + 3 AS rn,
      'AR_' || regexp_replace(cr.numero_documento, '[^a-zA-Z0-9_-]+', '-', 'g') || '_' ||
      regexp_replace(coalesce(cli.nome_fantasia, 'cliente'), '[^a-zA-Z0-9_-]+', '-', 'g') ||
      '_venc-' || to_char(cr.data_vencimento, 'YYYY-MM-DD') || '.pdf' AS desired_name
    FROM financeiro.contas_receber cr
    LEFT JOIN entidades.clientes cli ON cli.id = cr.cliente_id
    WHERE cr.tenant_id = 1
    ORDER BY cr.valor_liquido DESC, cr.id ASC
    LIMIT 3
  ) b
),
pdfs AS (
  SELECT
    fl.id,
    row_number() OVER (ORDER BY fl.created_at ASC, fl.id ASC) AS rn
  FROM drive.files fl
  JOIN finance_folder ff ON ff.workspace_id = fl.workspace_id
  WHERE fl.deleted_at IS NULL
    AND lower(coalesce(fl.mime, '')) LIKE '%pdf%'
  ORDER BY fl.created_at ASC, fl.id ASC
  LIMIT 6
),
map_files AS (
  SELECT p.id AS file_id, d.desired_name
  FROM pdfs p
  LEFT JOIN docs d ON d.rn = p.rn
)
UPDATE drive.files fl
SET folder_id = ff.id,
    name = COALESCE(mf.desired_name, fl.name),
    deleted_at = NULL,
    updated_at = now()
FROM finance_folder ff
JOIN map_files mf ON mf.file_id = fl.id
WHERE fl.id = mf.file_id;

WITH ws AS (
  SELECT id
  FROM drive.workspaces
  WHERE archived_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1
),
keep_pdfs AS (
  SELECT
    fl.id
  FROM drive.files fl
  JOIN ws ON ws.id = fl.workspace_id
  WHERE fl.deleted_at IS NULL
    AND lower(coalesce(fl.mime, '')) LIKE '%pdf%'
  ORDER BY fl.created_at ASC, fl.id ASC
  LIMIT 6
)
UPDATE drive.files fl
SET deleted_at = now(),
    updated_at = now()
FROM ws
WHERE fl.workspace_id = ws.id
  AND fl.deleted_at IS NULL
  AND fl.id NOT IN (SELECT id FROM keep_pdfs);

WITH ws AS (
  SELECT id
  FROM drive.workspaces
  WHERE archived_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1
),
targets(name) AS (
  VALUES
    ('Financeiro - Titulos e Comprovantes'),
    ('Comercial - CRM e Vendas'),
    ('Compras - Fornecedores'),
    ('Estoque - Catalogo e Inventario'),
    ('Administrativo - Contratos')
)
UPDATE drive.folders f
SET deleted_at = CASE
                  WHEN lower(f.name) IN (SELECT lower(name) FROM targets) THEN NULL
                  ELSE now()
                END,
    updated_at = now()
FROM ws
WHERE f.workspace_id = ws.id;
