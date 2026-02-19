BEGIN;

-- 1) Garante pastas canônicas ativas para narrativa B2B
WITH workspace_base AS (
  SELECT w.id AS workspace_id, w.owner_id
  FROM drive.workspaces w
  WHERE w.archived_at IS NULL
  ORDER BY w.created_at ASC
  LIMIT 1
),
required_folders(name) AS (
  VALUES
    ('Comercial - Propostas e Contratos'),
    ('Financeiro - Faturas, Cobranca e Liquidacoes'),
    ('Compras - Fornecedores e Licencas'),
    ('Estoque - Operacao Separada'),
    ('Administrativo - Juridico e Compliance')
),
missing AS (
  SELECT rf.name
  FROM required_folders rf
  LEFT JOIN drive.folders f
    ON lower(f.name) = lower(rf.name)
   AND f.deleted_at IS NULL
  WHERE f.id IS NULL
)
INSERT INTO drive.folders (
  id,
  workspace_id,
  parent_id,
  name,
  created_by,
  created_at,
  updated_at,
  deleted_at
)
SELECT
  gen_random_uuid(),
  wb.workspace_id,
  NULL,
  m.name,
  COALESCE(wb.owner_id, 1),
  now(),
  now(),
  NULL
FROM missing m
CROSS JOIN workspace_base wb;

-- 2) Reclassifica arquivos de documentos na pasta correta por origem
WITH folder_targets AS (
  SELECT
    (array_agg(id ORDER BY created_at ASC, id ASC) FILTER (WHERE lower(name) LIKE 'comercial%'))[1] AS comercial_id,
    (array_agg(id ORDER BY created_at ASC, id ASC) FILTER (WHERE lower(name) LIKE 'financeiro%'))[1] AS financeiro_id,
    (array_agg(id ORDER BY created_at ASC, id ASC) FILTER (WHERE lower(name) LIKE 'compras%'))[1] AS compras_id,
    (array_agg(id ORDER BY created_at ASC, id ASC) FILTER (WHERE lower(name) LIKE 'administrativo%'))[1] AS adm_id
  FROM drive.folders
  WHERE deleted_at IS NULL
),
doc_targets AS (
  SELECT
    d.id AS documento_id,
    d.drive_file_id,
    d.titulo,
    CASE
      WHEN d.origem_tipo LIKE 'crm.%' THEN ft.comercial_id
      WHEN d.origem_tipo LIKE 'vendas.%' THEN ft.comercial_id
      WHEN d.origem_tipo LIKE 'financeiro.contas_receber%' THEN ft.financeiro_id
      WHEN d.origem_tipo LIKE 'financeiro.contas_pagar%' THEN ft.compras_id
      ELSE ft.adm_id
    END AS folder_id
  FROM documentos.documentos d
  CROSS JOIN folder_targets ft
  WHERE d.tenant_id = 1
    AND d.drive_file_id IS NOT NULL
)
UPDATE drive.files f
SET
  folder_id = dt.folder_id,
  name = 'DOC-' || dt.documento_id::text || '-' ||
         trim(both '-' FROM regexp_replace(lower(COALESCE(dt.titulo, 'documento-' || dt.documento_id::text)), '[^a-z0-9]+', '-', 'g')) || '.pdf',
  updated_at = now(),
  deleted_at = NULL
FROM doc_targets dt
WHERE f.id = dt.drive_file_id
  AND dt.folder_id IS NOT NULL;

-- 3) Normaliza cadastro de clientes (campos faltantes)
WITH refs AS (
  SELECT
    ARRAY['Sao Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Recife','Porto Alegre','Brasilia','Goiania']::text[] AS cidades,
    ARRAY['SP','RJ','MG','PR','PE','RS','DF','GO']::text[] AS estados
)
UPDATE entidades.clientes c
SET
  cidade = COALESCE(NULLIF(c.cidade, ''), refs.cidades[((c.id - 1) % array_length(refs.cidades, 1)) + 1]),
  estado = COALESCE(NULLIF(c.estado, ''), refs.estados[((c.id - 1) % array_length(refs.estados, 1)) + 1]),
  cnpj_cpf = CASE
    WHEN COALESCE(NULLIF(regexp_replace(COALESCE(c.cnpj_cpf, ''), '\D', '', 'g'), ''), '') <> ''
      THEN regexp_replace(c.cnpj_cpf, '\D', '', 'g')
    ELSE lpad((10000000000000 + c.id)::text, 14, '0')
  END,
  telefone = COALESCE(NULLIF(c.telefone, ''), '(11) 9' || lpad((10000000 + (c.id % 89999999))::text, 8, '0')),
  tipo_pessoa = COALESCE(NULLIF(c.tipo_pessoa, ''), 'juridica'),
  canal = COALESCE(NULLIF(c.canal, ''), 'B2B'),
  nome_razao = COALESCE(NULLIF(c.nome_razao, ''), COALESCE(NULLIF(c.nome_fantasia, ''), 'Cliente ' || c.id::text) || ' LTDA'),
  email = CASE
    WHEN COALESCE(NULLIF(c.email, ''), '') <> '' THEN c.email
    ELSE lower(regexp_replace(COALESCE(NULLIF(c.nome_fantasia, ''), NULLIF(c.nome_razao, ''), 'cliente' || c.id::text), '[^a-zA-Z0-9]+', '', 'g')) || '@cliente-b2b.com.br'
  END,
  ativo = COALESCE(c.ativo, true),
  atualizado_em = now()
FROM refs
WHERE c.tenant_id = 1;

-- 4) Normaliza cadastro de fornecedores (campos faltantes)
WITH refs AS (
  SELECT
    ARRAY['Sao Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Recife','Fortaleza','Florianopolis','Campinas']::text[] AS cidades,
    ARRAY['SP','RJ','MG','PR','PE','CE','SC','SP']::text[] AS estados
)
UPDATE entidades.fornecedores f
SET
  cidade = COALESCE(NULLIF(f.cidade, ''), refs.cidades[((f.id - 1) % array_length(refs.cidades, 1)) + 1]),
  estado = COALESCE(NULLIF(f.estado, ''), refs.estados[((f.id - 1) % array_length(refs.estados, 1)) + 1]),
  cnpj = CASE
    WHEN COALESCE(NULLIF(regexp_replace(COALESCE(f.cnpj, ''), '\D', '', 'g'), ''), '') <> ''
      THEN regexp_replace(f.cnpj, '\D', '', 'g')
    ELSE lpad((20000000000000 + f.id)::text, 14, '0')
  END,
  telefone = COALESCE(NULLIF(f.telefone, ''), '(11) 3' || lpad((10000000 + (f.id % 89999999))::text, 8, '0')),
  email = CASE
    WHEN COALESCE(NULLIF(f.email, ''), '') <> '' THEN f.email
    ELSE lower(regexp_replace(COALESCE(NULLIF(f.nome_fantasia, ''), 'fornecedor' || f.id::text), '[^a-zA-Z0-9]+', '', 'g')) || '@fornecedor-b2b.com.br'
  END
FROM refs;

-- 5) Sincroniza snapshots de contas com cadastro mestre
UPDATE financeiro.contas_receber r
SET
  nome_cliente_snapshot = COALESCE(NULLIF(c.nome_fantasia, ''), c.nome_razao, r.nome_cliente_snapshot),
  atualizado_em = now()
FROM entidades.clientes c
WHERE r.tenant_id = 1
  AND c.id = r.cliente_id
  AND COALESCE(r.nome_cliente_snapshot, '') <> COALESCE(NULLIF(c.nome_fantasia, ''), c.nome_razao, '');

UPDATE financeiro.contas_pagar p
SET
  nome_fornecedor_snapshot = COALESCE(NULLIF(f.nome_fantasia, ''), p.nome_fornecedor_snapshot),
  atualizado_em = now()
FROM entidades.fornecedores f
WHERE p.tenant_id = 1
  AND f.id = p.fornecedor_id
  AND COALESCE(p.nome_fornecedor_snapshot, '') <> COALESCE(NULLIF(f.nome_fantasia, ''), '');

-- 6) Aproveita match nominal para preencher cliente_id em oportunidades CRM
UPDATE crm.oportunidades o
SET
  cliente_id = c.id,
  atualizado_em = now()
FROM crm.contas a
JOIN entidades.clientes c
  ON c.tenant_id = 1
 AND lower(c.nome_fantasia) = lower(a.nome)
WHERE o.tenant_id = 1
  AND o.cliente_id IS NULL
  AND o.conta_id = a.id;

-- 7) Email: corrige origem da caixa de operações (não pode ser autoenvio)
UPDATE email.messages m
SET
  from_name = 'WMS Alertas',
  from_email = 'alertas@wms-nexaops.com.br',
  to_recipients = jsonb_build_array(jsonb_build_object('name', 'Operações NexaOps', 'email', 'operacoes@nexaops.com.br')),
  updated_at = now()
FROM email.inboxes i
WHERE m.inbox_id = i.id
  AND i.id = 'ibx-operacoes'
  AND m.sent = false
  AND lower(COALESCE(m.from_email, '')) = lower(COALESCE(i.email, ''));

-- 8) Email: distribui timestamps para reduzir padrão artificial
WITH threads AS (
  SELECT
    m.thread_id,
    dense_rank() OVER (ORDER BY min(m.created_at), m.thread_id) AS thread_rank
  FROM email.messages m
  GROUP BY m.thread_id
),
ranked AS (
  SELECT
    m.id,
    t.thread_rank,
    row_number() OVER (
      PARTITION BY m.thread_id
      ORDER BY
        CASE WHEN m.sent THEN 1 ELSE 2 END,
        m.id
    ) AS msg_rank
  FROM email.messages m
  JOIN threads t ON t.thread_id = m.thread_id
),
calc AS (
  SELECT
    r.id,
    (
      '2026-02-04 11:00:00+00'::timestamptz
      + ((r.thread_rank - 1) * interval '17 hours')
      + ((r.msg_rank - 1) * interval '2 hours')
      + ((abs(hashtext(r.id)) % 37) * interval '1 minute')
    ) AS new_created_at
  FROM ranked r
)
UPDATE email.messages m
SET
  created_at = GREATEST('2026-02-04 08:00:00+00'::timestamptz, LEAST('2026-03-31 22:00:00+00'::timestamptz, c.new_created_at)),
  updated_at = GREATEST('2026-02-04 08:05:00+00'::timestamptz, LEAST('2026-03-31 23:00:00+00'::timestamptz, c.new_created_at + interval '7 minutes'))
FROM calc c
WHERE m.id = c.id;

-- 9) Ajuste final de flags de leitura
UPDATE email.messages
SET
  unread = CASE
    WHEN sent THEN false
    WHEN draft OR junk OR trashed OR archived THEN false
    ELSE true
  END,
  updated_at = now();

COMMIT;
