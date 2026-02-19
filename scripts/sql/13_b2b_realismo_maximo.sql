BEGIN;

-- 1) Completa vínculo CRM -> cliente ERP (incluindo criação de cliente para contas sem match)
WITH contas_need AS (
  SELECT DISTINCT
    o.conta_id,
    a.nome AS conta_nome,
    regexp_replace(lower(COALESCE(a.nome, '')), '[^a-z0-9]+', '', 'g') AS norm
  FROM crm.oportunidades o
  JOIN crm.contas a
    ON a.id = o.conta_id
   AND a.tenant_id = o.tenant_id
  WHERE o.tenant_id = 1
    AND o.cliente_id IS NULL
    AND o.conta_id IS NOT NULL
),
existing_clients AS (
  SELECT
    c.id,
    regexp_replace(lower(COALESCE(c.nome_fantasia, '')), '[^a-z0-9]+', '', 'g') AS norm
  FROM entidades.clientes c
  WHERE c.tenant_id = 1
),
mapped_existing AS (
  SELECT
    cn.conta_id,
    MIN(ec.id) AS cliente_id
  FROM contas_need cn
  JOIN existing_clients ec
    ON ec.norm = cn.norm
  GROUP BY cn.conta_id
),
contas_to_create AS (
  SELECT
    cn.conta_id,
    cn.conta_nome,
    cn.norm,
    row_number() OVER (ORDER BY cn.conta_id) AS rn
  FROM contas_need cn
  LEFT JOIN mapped_existing me
    ON me.conta_id = cn.conta_id
  WHERE me.cliente_id IS NULL
),
created_clients AS (
  INSERT INTO entidades.clientes (
    nome_fantasia,
    cnpj_cpf,
    email,
    telefone,
    endereco,
    criado_em,
    tipo_pessoa,
    canal,
    nome_razao,
    tenant_id,
    cidade,
    estado,
    ativo,
    atualizado_em
  )
  SELECT
    ctc.conta_nome AS nome_fantasia,
    lpad((30000000000000 + ctc.rn)::text, 14, '0') AS cnpj_cpf,
    lower(ctc.norm) || '@cliente-b2b.com.br' AS email,
    '(11) 9' || lpad((20000000 + (ctc.rn % 79999999))::text, 8, '0') AS telefone,
    'Endereco corporativo cadastrado automaticamente para narrativa B2B.' AS endereco,
    now(),
    'juridica',
    'B2B',
    ctc.conta_nome || ' LTDA',
    1,
    (ARRAY['Sao Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Recife','Porto Alegre','Brasilia','Goiania'])[((ctc.rn - 1) % 8) + 1],
    (ARRAY['SP','RJ','MG','PR','PE','RS','DF','GO'])[((ctc.rn - 1) % 8) + 1],
    true,
    now()
  FROM contas_to_create ctc
  RETURNING id, nome_fantasia
),
mapped_new AS (
  SELECT
    ctc.conta_id,
    cc.id AS cliente_id
  FROM contas_to_create ctc
  JOIN created_clients cc
    ON regexp_replace(lower(cc.nome_fantasia), '[^a-z0-9]+', '', 'g') = ctc.norm
),
all_map AS (
  SELECT conta_id, cliente_id FROM mapped_existing
  UNION ALL
  SELECT conta_id, cliente_id FROM mapped_new
)
UPDATE crm.oportunidades o
SET
  cliente_id = am.cliente_id,
  atualizado_em = now()
FROM all_map am
WHERE o.tenant_id = 1
  AND o.cliente_id IS NULL
  AND o.conta_id = am.conta_id;

-- 2) Garante template específico para comprovante de custo operacional (contas a pagar)
WITH t AS (
  INSERT INTO documentos.templates (
    tenant_id,
    codigo,
    nome,
    tipo,
    descricao,
    schema_json,
    layout_json,
    ativo,
    criado_em,
    atualizado_em,
    criado_por
  )
  SELECT
    1,
    'comprovacao-custo-operacional',
    'Comprovacao de Custo Operacional',
    'outro',
    'Comprovante/espelho de custos vinculados a fornecedores e despesas operacionais.',
    '{"campos":["fornecedor","numero_documento","valor_liquido","centro_custo","competencia"]}'::jsonb,
    '{"layout":"A4","secoes":["cabecalho","detalhamento","aprovacao"]}'::jsonb,
    true,
    now(),
    now(),
    1
  WHERE NOT EXISTS (
    SELECT 1
    FROM documentos.templates
    WHERE tenant_id = 1
      AND codigo = 'comprovacao-custo-operacional'
  )
  RETURNING id
)
INSERT INTO documentos.template_versions (
  tenant_id,
  template_id,
  versao,
  conteudo_json,
  publicado,
  publicado_em,
  notas,
  criado_em,
  atualizado_em,
  criado_por
)
SELECT
  1,
  x.template_id,
  1,
  '{"versao":"1.0","aprovacao_financeira":true}'::jsonb,
  true,
  now(),
  'Versao inicial para contas a pagar.',
  now(),
  now(),
  1
FROM (
  SELECT id AS template_id FROM t
  UNION ALL
  SELECT id AS template_id
  FROM documentos.templates
  WHERE tenant_id = 1
    AND codigo = 'comprovacao-custo-operacional'
    AND NOT EXISTS (
      SELECT 1
      FROM documentos.template_versions tv
      WHERE tv.tenant_id = 1
        AND tv.template_id = documentos.templates.id
    )
) x;

-- 3) Insere documentos faltantes para cobertura máxima de CRM, Vendas e Financeiro
DROP TABLE IF EXISTS tmp_new_docs;
CREATE TEMP TABLE tmp_new_docs (
  documento_id bigint,
  origem_tipo text,
  titulo text,
  criado_em timestamptz
);

-- 3.1 CRM oportunidades sem documento
WITH tpl AS (
  SELECT
    t.id AS template_id,
    (
      SELECT v.id
      FROM documentos.template_versions v
      WHERE v.tenant_id = 1
        AND v.template_id = t.id
        AND v.publicado = true
      ORDER BY v.versao DESC, v.id DESC
      LIMIT 1
    ) AS template_version_id
  FROM documentos.templates t
  WHERE t.tenant_id = 1
    AND t.codigo = 'ata-reuniao-comercial'
  LIMIT 1
),
opp_missing AS (
  SELECT
    o.id,
    o.status,
    COALESCE(c.nome_fantasia, a.nome, 'Conta B2B') AS cliente_nome,
    COALESCE(o.data_prevista::timestamptz, o.criado_em::timestamptz, now()) AS ts_ref
  FROM crm.oportunidades o
  LEFT JOIN entidades.clientes c ON c.id = o.cliente_id
  LEFT JOIN crm.contas a ON a.id = o.conta_id AND a.tenant_id = o.tenant_id
  WHERE o.tenant_id = 1
    AND NOT EXISTS (
      SELECT 1
      FROM documentos.documentos d
      WHERE d.tenant_id = 1
        AND d.origem_tipo = 'crm.oportunidades'
        AND d.origem_id = o.id
    )
),
ins AS (
  INSERT INTO documentos.documentos (
    tenant_id,
    template_id,
    template_version_id,
    origem_tipo,
    origem_id,
    titulo,
    status,
    payload_json,
    mime,
    gerado_em,
    enviado_em,
    criado_em,
    atualizado_em,
    criado_por
  )
  SELECT
    1,
    tpl.template_id,
    tpl.template_version_id,
    'crm.oportunidades',
    om.id,
    'Ata Comercial - ' || om.cliente_nome || ' (#OP' || om.id::text || ')',
    CASE
      WHEN om.status = 'perdido' THEN 'cancelado'
      WHEN om.status = 'ganha' THEN 'gerado'
      ELSE 'rascunho'
    END,
    jsonb_build_object(
      'oportunidade_id', om.id,
      'cliente', om.cliente_nome,
      'status_oportunidade', om.status
    ),
    'application/pdf',
    om.ts_ref,
    CASE WHEN om.status IN ('ganha') THEN om.ts_ref + interval '4 hours' ELSE NULL END,
    om.ts_ref,
    om.ts_ref,
    1
  FROM opp_missing om
  CROSS JOIN tpl
  RETURNING id, origem_tipo, titulo, criado_em
)
INSERT INTO tmp_new_docs (documento_id, origem_tipo, titulo, criado_em)
SELECT id, origem_tipo, titulo, criado_em FROM ins;

-- 3.2 Vendas pedidos sem documento
WITH tpl AS (
  SELECT
    tp.id AS proposta_template_id,
    (
      SELECT v.id
      FROM documentos.template_versions v
      WHERE v.tenant_id = 1 AND v.template_id = tp.id AND v.publicado = true
      ORDER BY v.versao DESC, v.id DESC
      LIMIT 1
    ) AS proposta_version_id,
    to2.id AS os_template_id,
    (
      SELECT v.id
      FROM documentos.template_versions v
      WHERE v.tenant_id = 1 AND v.template_id = to2.id AND v.publicado = true
      ORDER BY v.versao DESC, v.id DESC
      LIMIT 1
    ) AS os_version_id
  FROM documentos.templates tp
  JOIN documentos.templates to2
    ON to2.tenant_id = tp.tenant_id
  WHERE tp.tenant_id = 1
    AND tp.codigo = 'proposta-servicos-b2b'
    AND to2.codigo = 'ordem-servico-campo'
  LIMIT 1
),
ped_missing AS (
  SELECT
    p.id,
    p.status,
    COALESCE(c.nome_fantasia, 'Cliente B2B') AS cliente_nome,
    COALESCE(p.data_pedido::timestamptz, p.criado_em::timestamptz, now()) AS ts_ref,
    p.valor_total
  FROM vendas.pedidos p
  LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
  WHERE p.tenant_id = 1
    AND NOT EXISTS (
      SELECT 1
      FROM documentos.documentos d
      WHERE d.tenant_id = 1
        AND d.origem_tipo = 'vendas.pedidos'
        AND d.origem_id = p.id
    )
),
ins AS (
  INSERT INTO documentos.documentos (
    tenant_id,
    template_id,
    template_version_id,
    origem_tipo,
    origem_id,
    titulo,
    status,
    payload_json,
    mime,
    gerado_em,
    enviado_em,
    criado_em,
    atualizado_em,
    criado_por
  )
  SELECT
    1,
    CASE WHEN pm.status = 'pendente' THEN tpl.proposta_template_id ELSE tpl.os_template_id END,
    CASE WHEN pm.status = 'pendente' THEN tpl.proposta_version_id ELSE tpl.os_version_id END,
    'vendas.pedidos',
    pm.id,
    CASE
      WHEN pm.status = 'pendente'
        THEN 'Proposta Comercial - Pedido ' || pm.id::text || ' - ' || pm.cliente_nome
      ELSE 'OS de Campo - Pedido ' || pm.id::text || ' - ' || pm.cliente_nome
    END,
    CASE
      WHEN pm.status = 'concluido' THEN 'assinado'
      WHEN pm.status = 'aprovado' THEN 'enviado'
      ELSE 'gerado'
    END,
    jsonb_build_object(
      'pedido_id', pm.id,
      'cliente', pm.cliente_nome,
      'status_pedido', pm.status,
      'valor_total', pm.valor_total
    ),
    'application/pdf',
    pm.ts_ref,
    CASE WHEN pm.status IN ('aprovado', 'concluido') THEN pm.ts_ref + interval '3 hours' ELSE NULL END,
    pm.ts_ref,
    pm.ts_ref,
    1
  FROM ped_missing pm
  CROSS JOIN tpl
  RETURNING id, origem_tipo, titulo, criado_em
)
INSERT INTO tmp_new_docs (documento_id, origem_tipo, titulo, criado_em)
SELECT id, origem_tipo, titulo, criado_em FROM ins;

-- 3.3 Contas a receber sem documento
WITH tpl AS (
  SELECT
    tf.id AS fatura_template_id,
    (
      SELECT v.id
      FROM documentos.template_versions v
      WHERE v.tenant_id = 1 AND v.template_id = tf.id AND v.publicado = true
      ORDER BY v.versao DESC, v.id DESC
      LIMIT 1
    ) AS fatura_version_id,
    tn.id AS nfse_template_id,
    (
      SELECT v.id
      FROM documentos.template_versions v
      WHERE v.tenant_id = 1 AND v.template_id = tn.id AND v.publicado = true
      ORDER BY v.versao DESC, v.id DESC
      LIMIT 1
    ) AS nfse_version_id
  FROM documentos.templates tf
  JOIN documentos.templates tn
    ON tn.tenant_id = tf.tenant_id
  WHERE tf.tenant_id = 1
    AND tf.codigo = 'fatura-servicos'
    AND tn.codigo = 'nfse-servicos-b2b'
  LIMIT 1
),
cr_missing AS (
  SELECT
    r.id,
    r.status,
    r.numero_documento,
    COALESCE(r.nome_cliente_snapshot, c.nome_fantasia, 'Cliente B2B') AS cliente_nome,
    COALESCE(r.data_documento::timestamptz, r.data_lancamento::timestamptz, now()) AS ts_ref,
    r.valor_liquido
  FROM financeiro.contas_receber r
  LEFT JOIN entidades.clientes c ON c.id = r.cliente_id
  WHERE r.tenant_id = 1
    AND NOT EXISTS (
      SELECT 1
      FROM documentos.documentos d
      WHERE d.tenant_id = 1
        AND d.origem_tipo = 'financeiro.contas_receber'
        AND d.origem_id = r.id
    )
),
ins AS (
  INSERT INTO documentos.documentos (
    tenant_id,
    template_id,
    template_version_id,
    origem_tipo,
    origem_id,
    titulo,
    status,
    payload_json,
    mime,
    gerado_em,
    enviado_em,
    criado_em,
    atualizado_em,
    criado_por
  )
  SELECT
    1,
    CASE WHEN crm.status = 'recebido' THEN tpl.nfse_template_id ELSE tpl.fatura_template_id END,
    CASE WHEN crm.status = 'recebido' THEN tpl.nfse_version_id ELSE tpl.fatura_version_id END,
    'financeiro.contas_receber',
    crm.id,
    CASE
      WHEN crm.status = 'recebido'
        THEN 'NFS-e Servicos - ' || COALESCE(crm.numero_documento, 'CR-' || crm.id::text) || ' - ' || crm.cliente_nome
      ELSE 'Fatura de Servicos - ' || COALESCE(crm.numero_documento, 'CR-' || crm.id::text) || ' - ' || crm.cliente_nome
    END,
    CASE
      WHEN crm.status = 'recebido' THEN 'assinado'
      WHEN crm.status = 'cancelado' THEN 'cancelado'
      ELSE 'enviado'
    END,
    jsonb_build_object(
      'conta_receber_id', crm.id,
      'cliente', crm.cliente_nome,
      'status_conta_receber', crm.status,
      'valor_liquido', crm.valor_liquido
    ),
    'application/pdf',
    crm.ts_ref,
    CASE WHEN crm.status <> 'cancelado' THEN crm.ts_ref + interval '2 hours' ELSE NULL END,
    crm.ts_ref,
    crm.ts_ref,
    1
  FROM cr_missing crm
  CROSS JOIN tpl
  RETURNING id, origem_tipo, titulo, criado_em
)
INSERT INTO tmp_new_docs (documento_id, origem_tipo, titulo, criado_em)
SELECT id, origem_tipo, titulo, criado_em FROM ins;

-- 3.4 Contas a pagar sem documento
WITH tpl AS (
  SELECT
    t.id AS template_id,
    (
      SELECT v.id
      FROM documentos.template_versions v
      WHERE v.tenant_id = 1 AND v.template_id = t.id AND v.publicado = true
      ORDER BY v.versao DESC, v.id DESC
      LIMIT 1
    ) AS template_version_id
  FROM documentos.templates t
  WHERE t.tenant_id = 1
    AND t.codigo = 'comprovacao-custo-operacional'
  LIMIT 1
),
cp_missing AS (
  SELECT
    p.id,
    p.status,
    p.numero_documento,
    COALESCE(p.nome_fornecedor_snapshot, f.nome_fantasia, 'Fornecedor') AS fornecedor_nome,
    COALESCE(p.data_documento::timestamptz, p.data_lancamento::timestamptz, now()) AS ts_ref,
    p.valor_liquido
  FROM financeiro.contas_pagar p
  LEFT JOIN entidades.fornecedores f ON f.id = p.fornecedor_id
  WHERE p.tenant_id = 1
    AND NOT EXISTS (
      SELECT 1
      FROM documentos.documentos d
      WHERE d.tenant_id = 1
        AND d.origem_tipo = 'financeiro.contas_pagar'
        AND d.origem_id = p.id
    )
),
ins AS (
  INSERT INTO documentos.documentos (
    tenant_id,
    template_id,
    template_version_id,
    origem_tipo,
    origem_id,
    titulo,
    status,
    payload_json,
    mime,
    gerado_em,
    enviado_em,
    criado_em,
    atualizado_em,
    criado_por
  )
  SELECT
    1,
    tpl.template_id,
    tpl.template_version_id,
    'financeiro.contas_pagar',
    cpm.id,
    'Comprovacao de Custo Operacional - ' || COALESCE(cpm.numero_documento, 'CP-' || cpm.id::text) || ' - ' || cpm.fornecedor_nome,
    CASE WHEN cpm.status = 'cancelado' THEN 'cancelado' ELSE 'gerado' END,
    jsonb_build_object(
      'conta_pagar_id', cpm.id,
      'fornecedor', cpm.fornecedor_nome,
      'status_conta_pagar', cpm.status,
      'valor_liquido', cpm.valor_liquido
    ),
    'application/pdf',
    cpm.ts_ref,
    CASE WHEN cpm.status <> 'cancelado' THEN cpm.ts_ref + interval '90 minutes' ELSE NULL END,
    cpm.ts_ref,
    cpm.ts_ref,
    1
  FROM cp_missing cpm
  CROSS JOIN tpl
  RETURNING id, origem_tipo, titulo, criado_em
)
INSERT INTO tmp_new_docs (documento_id, origem_tipo, titulo, criado_em)
SELECT id, origem_tipo, titulo, criado_em FROM ins;

-- 4) Cria arquivo Drive para novos documentos e vincula
DROP TABLE IF EXISTS tmp_new_doc_files;
CREATE TEMP TABLE tmp_new_doc_files AS
WITH ws AS (
  SELECT w.id AS workspace_id, w.owner_id
  FROM drive.workspaces w
  WHERE w.archived_at IS NULL
  ORDER BY w.created_at ASC
  LIMIT 1
),
ft AS (
  SELECT
    (array_agg(id ORDER BY created_at ASC, id ASC) FILTER (WHERE deleted_at IS NULL AND lower(name) LIKE 'comercial%'))[1] AS comercial_id,
    (array_agg(id ORDER BY created_at ASC, id ASC) FILTER (WHERE deleted_at IS NULL AND lower(name) LIKE 'financeiro%'))[1] AS financeiro_id,
    (array_agg(id ORDER BY created_at ASC, id ASC) FILTER (WHERE deleted_at IS NULL AND lower(name) LIKE 'compras%'))[1] AS compras_id,
    (array_agg(id ORDER BY created_at ASC, id ASC) FILTER (WHERE deleted_at IS NULL AND lower(name) LIKE 'administrativo%'))[1] AS adm_id
  FROM drive.folders
),
rows AS (
  SELECT
    tnd.documento_id,
    tnd.origem_tipo,
    tnd.titulo,
    tnd.criado_em,
    gen_random_uuid() AS file_id,
    ws.workspace_id,
    COALESCE(
      CASE
        WHEN tnd.origem_tipo LIKE 'crm.%' THEN ft.comercial_id
        WHEN tnd.origem_tipo LIKE 'vendas.%' THEN ft.comercial_id
        WHEN tnd.origem_tipo LIKE 'financeiro.contas_receber%' THEN ft.financeiro_id
        WHEN tnd.origem_tipo LIKE 'financeiro.contas_pagar%' THEN ft.compras_id
        ELSE ft.adm_id
      END,
      ft.adm_id
    ) AS folder_id,
    COALESCE(ws.owner_id, 1)::bigint AS created_by
  FROM tmp_new_docs tnd
  CROSS JOIN ws
  CROSS JOIN ft
)
SELECT * FROM rows;

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
  updated_at,
  deleted_at
)
SELECT
  nf.file_id,
  nf.workspace_id,
  nf.folder_id,
  'DOC-' || nf.documento_id::text || '-' ||
  trim(both '-' FROM regexp_replace(lower(COALESCE(nf.titulo, 'documento-' || nf.documento_id::text)), '[^a-z0-9]+', '-', 'g')) || '.pdf',
  'application/pdf',
  (860 + (nf.documento_id % 1900))::bigint,
  'drive',
  nf.workspace_id::text || '/' || COALESCE(nf.folder_id::text, 'root') || '/' || nf.file_id::text || '-DOC-' || nf.documento_id::text || '.pdf',
  'documento:' || nf.documento_id::text,
  nf.created_by,
  nf.criado_em,
  now(),
  NULL
FROM tmp_new_doc_files nf;

UPDATE documentos.documentos d
SET
  drive_file_id = nf.file_id,
  drive_signed_url = '/api/drive/files/' || nf.file_id::text || '/download',
  mime = 'application/pdf',
  atualizado_em = now()
FROM tmp_new_doc_files nf
WHERE d.id = nf.documento_id
  AND d.tenant_id = 1;

-- 5) Profundidade de email: cria resposta para toda thread com 1 mensagem
WITH one_msg_threads AS (
  SELECT m.thread_id, MIN(m.id) AS base_id
  FROM email.messages m
  WHERE m.deleted_at IS NULL
  GROUP BY m.thread_id
  HAVING COUNT(*) = 1
),
base AS (
  SELECT
    m.id,
    m.inbox_id,
    m.thread_id,
    m.subject,
    m.snippet,
    m.text_body,
    m.from_name,
    m.from_email,
    m.to_recipients,
    m.sent,
    m.created_at,
    i.email AS inbox_email,
    i.display_name AS inbox_name,
    COALESCE(NULLIF(m.to_recipients->0->>'email', ''), 'contato@cliente-b2b.com.br') AS first_to_email,
    COALESCE(NULLIF(m.to_recipients->0->>'name', ''), 'Contato') AS first_to_name
  FROM one_msg_threads omt
  JOIN email.messages m ON m.id = omt.base_id
  JOIN email.inboxes i ON i.id = m.inbox_id
),
new_rows AS (
  SELECT
    'msg-auto-' || substr(md5(b.id || '-r1'), 1, 18) AS id,
    b.inbox_id,
    b.thread_id,
    CASE
      WHEN lower(COALESCE(b.subject, '')) LIKE 're:%' THEN b.subject
      ELSE 'RE: ' || COALESCE(b.subject, 'Atualizacao')
    END AS subject,
    CASE
      WHEN b.sent THEN 'Cliente confirmou recebimento e pediu próximos passos.'
      ELSE 'Time interno confirmou recebimento e seguirá com tratativa.'
    END AS snippet,
    CASE
      WHEN b.sent THEN 'Recebemos e validamos. Pode seguir com os próximos passos e cronograma.'
      ELSE 'Documento recebido internamente. Vamos avançar e retornamos com a confirmação final.'
    END AS text_body,
    NULL::text AS html_body,
    CASE WHEN b.sent THEN b.first_to_name ELSE b.inbox_name END AS from_name,
    CASE WHEN b.sent THEN b.first_to_email ELSE b.inbox_email END AS from_email,
    CASE
      WHEN b.sent
        THEN jsonb_build_array(jsonb_build_object('name', b.inbox_name, 'email', b.inbox_email))
      ELSE jsonb_build_array(jsonb_build_object('name', COALESCE(NULLIF(b.from_name, ''), 'Contato'), 'email', COALESCE(NULLIF(b.from_email, ''), b.first_to_email)))
    END AS to_recipients,
    '[]'::jsonb AS cc_recipients,
    '[]'::jsonb AS bcc_recipients,
    CASE
      WHEN b.sent
        THEN jsonb_build_array('inbox', 'reply', 'cliente')
      ELSE jsonb_build_array('sent', 'followup', 'interno')
    END AS labels,
    '[]'::jsonb AS attachments,
    CASE WHEN b.sent THEN true ELSE false END AS unread,
    false AS draft,
    CASE WHEN b.sent THEN false ELSE true END AS sent,
    false AS junk,
    false AS trashed,
    false AS archived,
    LEAST('2026-03-31 22:30:00+00'::timestamptz, b.created_at + CASE WHEN b.sent THEN interval '21 hours' ELSE interval '4 hours' END) AS created_at,
    now() AS updated_at
  FROM base b
)
INSERT INTO email.messages (
  id,
  inbox_id,
  thread_id,
  subject,
  snippet,
  text_body,
  html_body,
  from_name,
  from_email,
  to_recipients,
  cc_recipients,
  bcc_recipients,
  labels,
  attachments,
  unread,
  draft,
  sent,
  junk,
  trashed,
  archived,
  created_at,
  updated_at
)
SELECT
  nr.id,
  nr.inbox_id,
  nr.thread_id,
  nr.subject,
  nr.snippet,
  nr.text_body,
  nr.html_body,
  nr.from_name,
  nr.from_email,
  nr.to_recipients,
  nr.cc_recipients,
  nr.bcc_recipients,
  nr.labels,
  nr.attachments,
  nr.unread,
  nr.draft,
  nr.sent,
  nr.junk,
  nr.trashed,
  nr.archived,
  nr.created_at,
  nr.updated_at
FROM new_rows nr
WHERE NOT EXISTS (
  SELECT 1
  FROM email.messages m
  WHERE m.id = nr.id
);

-- 6) Jitter leve para evitar timestamps iguais e preservar janela fev/mar
UPDATE email.messages m
SET
  created_at = LEAST(
    '2026-03-31 22:50:00+00'::timestamptz,
    GREATEST(
      '2026-02-01 08:00:00+00'::timestamptz,
      m.created_at + ((abs(hashtext(m.id)) % 19) * interval '1 minute')
    )
  ),
  updated_at = now()
WHERE m.deleted_at IS NULL;

-- 7) Recalcula unread em consistência com sent/draft flags
UPDATE email.messages
SET
  unread = CASE
    WHEN sent OR draft OR junk OR trashed OR archived THEN false
    ELSE true
  END,
  updated_at = now()
WHERE deleted_at IS NULL;

COMMIT;
