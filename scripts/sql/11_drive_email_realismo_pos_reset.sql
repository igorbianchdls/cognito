-- Pos-reset hardening para realismo de dados (Drive + Email + Documentos)
-- Tenant alvo: 1

-- 1) Garante 1 arquivo de drive dedicado por documento (evita reuso artificial de poucos arquivos)
DROP TABLE IF EXISTS tmp_doc_file_map;
CREATE TEMP TABLE tmp_doc_file_map AS
WITH workspace_base AS (
  SELECT w.id AS workspace_id, w.owner_id
  FROM drive.workspaces w
  WHERE w.archived_at IS NULL
  ORDER BY w.created_at ASC
  LIMIT 1
),
folder_base AS (
  SELECT f.id AS folder_id
  FROM drive.folders f
  JOIN workspace_base wb ON wb.workspace_id = f.workspace_id
  WHERE f.deleted_at IS NULL
  ORDER BY f.created_at ASC
  LIMIT 1
)
SELECT
  d.id AS documento_id,
  gen_random_uuid() AS new_file_id,
  COALESCE(df.workspace_id, wb.workspace_id) AS workspace_id,
  COALESCE(df.folder_id, fb.folder_id) AS folder_id,
  COALESCE(df.created_by, wb.owner_id, 1)::bigint AS created_by,
  COALESCE(d.criado_em, d.gerado_em, now()) AS created_at_ref,
  COALESCE(NULLIF(btrim(d.titulo), ''), 'Documento ' || d.id::text) AS titulo
FROM documentos.documentos d
LEFT JOIN drive.files df ON df.id = d.drive_file_id
CROSS JOIN workspace_base wb
CROSS JOIN folder_base fb
WHERE d.tenant_id = 1;

INSERT INTO drive.files (
  id,
  workspace_id,
  folder_id,
  name,
  mime,
  size_bytes,
  bucket_id,
  storage_path,
  checksum,
  created_by,
  created_at,
  updated_at
)
SELECT
  m.new_file_id,
  m.workspace_id,
  m.folder_id,
  ('DOC-' || m.documento_id::text || '-' ||
    regexp_replace(lower(m.titulo), '[^a-z0-9]+', '-', 'g') || '.pdf')::text AS name,
  'application/pdf'::text AS mime,
  (900 + (m.documento_id % 1200))::bigint AS size_bytes,
  'drive'::text AS bucket_id,
  (m.workspace_id::text || '/' || COALESCE(m.folder_id::text, 'root') || '/' || m.new_file_id::text || '-DOC-' || m.documento_id::text || '.pdf')::text AS storage_path,
  ('documento:' || m.documento_id::text) AS checksum,
  m.created_by,
  m.created_at_ref,
  now()
FROM tmp_doc_file_map m;

UPDATE documentos.documentos d
SET
  drive_file_id = m.new_file_id,
  drive_signed_url = '/api/drive/files/' || m.new_file_id::text || '/download',
  mime = 'application/pdf',
  atualizado_em = now()
FROM tmp_doc_file_map m
WHERE d.id = m.documento_id
  AND d.tenant_id = 1;

-- 1.1) Remove arquivos DOC ativos que ficaram sem referência após o remapeamento
UPDATE drive.files f
SET deleted_at = now(), updated_at = now()
WHERE f.deleted_at IS NULL
  AND f.name LIKE 'DOC-%'
  AND NOT EXISTS (
    SELECT 1
    FROM documentos.documentos d
    WHERE d.tenant_id = 1
      AND d.drive_file_id = f.id
  );

-- 2) Reconstrói anexos de email para refletir novos drive_file_id por documento
WITH rebuilt AS (
  SELECT
    em.id,
    COALESCE(
      jsonb_agg(
        CASE
          WHEN e.elem ? 'documento_id'
           AND (e.elem->>'documento_id') ~ '^[0-9]+$'
           AND d.id IS NOT NULL
          THEN jsonb_build_object(
            'name', COALESCE(d.titulo, e.elem->>'name', 'Documento'),
            'mime', COALESCE(d.mime, 'application/pdf'),
            'size', COALESCE(df.size_bytes, NULL),
            'documento_id', d.id,
            'drive_file_id', d.drive_file_id,
            'url', '/api/drive/files/' || d.drive_file_id::text || '/download'
          )
          ELSE e.elem
        END
        ORDER BY e.ord
      ) FILTER (WHERE e.elem IS NOT NULL),
      '[]'::jsonb
    ) AS new_attachments
  FROM email.messages em
  LEFT JOIN LATERAL jsonb_array_elements(COALESCE(em.attachments, '[]'::jsonb)) WITH ORDINALITY e(elem, ord) ON TRUE
  LEFT JOIN documentos.documentos d
    ON e.elem ? 'documento_id'
   AND (e.elem->>'documento_id') ~ '^[0-9]+$'
   AND d.id = (e.elem->>'documento_id')::bigint
   AND d.tenant_id = 1
  LEFT JOIN drive.files df ON df.id = d.drive_file_id
  GROUP BY em.id
)
UPDATE email.messages em
SET
  attachments = r.new_attachments,
  updated_at = now()
FROM rebuilt r
WHERE em.id = r.id;

-- 3) Remove duplicidade de pasta ativa por nome (mantém a mais antiga)
WITH ranked AS (
  SELECT
    f.id,
    row_number() OVER (PARTITION BY f.name ORDER BY f.created_at ASC, f.id ASC) AS rn
  FROM drive.folders f
  WHERE f.deleted_at IS NULL
)
UPDATE drive.folders f
SET deleted_at = now(), updated_at = now()
FROM ranked r
WHERE f.id = r.id
  AND r.rn > 1;

-- 4) Limpa artefato de nome empresarial duplicado
UPDATE entidades.clientes
SET
  nome_razao = regexp_replace(nome_razao, '(\s+LTDA)(\s+LTDA)+$', ' LTDA', 'i'),
  atualizado_em = now()
WHERE nome_razao ~* '(\s+LTDA)(\s+LTDA)+$';

-- 5) Força liquidações para janela fev/mar 2026 quando estiverem fora
UPDATE financeiro.liquidacoes
SET
  data_liquidacao = (date '2026-02-01' + ((id % 59)::int))::date,
  atualizado_em = now()
WHERE data_liquidacao::date < date '2026-02-01'
   OR data_liquidacao::date > date '2026-03-31';
