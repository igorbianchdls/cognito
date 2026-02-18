-- Local email fallback seed aligned with ERP/CRM data

CREATE SCHEMA IF NOT EXISTS email;

CREATE TABLE IF NOT EXISTS email.inboxes (
  id text PRIMARY KEY,
  username text NOT NULL,
  domain text NOT NULL DEFAULT 'aurorasemijoias.com.br',
  email text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz NULL
);

CREATE TABLE IF NOT EXISTS email.messages (
  id text PRIMARY KEY,
  inbox_id text NOT NULL REFERENCES email.inboxes(id) ON DELETE CASCADE,
  thread_id text NULL,
  subject text NOT NULL,
  snippet text NOT NULL,
  text_body text NULL,
  html_body text NULL,
  from_name text NULL,
  from_email text NULL,
  to_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  cc_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  bcc_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  labels jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  unread boolean NOT NULL DEFAULT true,
  draft boolean NOT NULL DEFAULT false,
  sent boolean NOT NULL DEFAULT false,
  junk boolean NOT NULL DEFAULT false,
  trashed boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_email_messages_inbox_created ON email.messages (inbox_id, created_at DESC);

DELETE FROM email.messages;
DELETE FROM email.inboxes;

INSERT INTO email.inboxes (id, username, domain, email, display_name, created_at, updated_at)
VALUES
  ('ibx-financeiro', 'financeiro', 'aurorasemijoias.com.br', 'financeiro@aurorasemijoias.com.br', 'Financeiro', now(), now()),
  ('ibx-compras', 'compras', 'aurorasemijoias.com.br', 'compras@aurorasemijoias.com.br', 'Compras', now(), now()),
  ('ibx-comercial', 'comercial', 'aurorasemijoias.com.br', 'comercial@aurorasemijoias.com.br', 'Comercial', now(), now()),
  ('ibx-operacoes', 'operacoes', 'aurorasemijoias.com.br', 'operacoes@aurorasemijoias.com.br', 'Operações', now(), now());

-- AR inbound
WITH src AS (
  SELECT
    row_number() OVER (ORDER BY cr.data_vencimento ASC, cr.id ASC) AS rn,
    cr.numero_documento,
    lower(cr.status) AS status,
    cr.data_vencimento,
    cr.valor_liquido,
    c.nome_fantasia AS cliente_nome,
    coalesce(nullif(c.email, ''), 'financeiro.cliente@empresa.com') AS cliente_email
  FROM financeiro.contas_receber cr
  JOIN entidades.clientes c ON c.id = cr.cliente_id
  WHERE cr.tenant_id = 1
  ORDER BY cr.data_vencimento ASC, cr.id ASC
  LIMIT 16
)
INSERT INTO email.messages
  (id, inbox_id, thread_id, subject, snippet, text_body, from_name, from_email, to_recipients, labels, unread, sent, draft, junk, trashed, archived, created_at, updated_at)
SELECT
  'msg-' || substr(md5('ar-in-' || src.rn::text || clock_timestamp()::text), 1, 16),
  'ibx-financeiro',
  'thr-ar-' || regexp_replace(src.numero_documento, '[^a-zA-Z0-9_-]+', '-', 'g'),
  'Título ' || src.numero_documento || ' - ' || src.cliente_nome,
  left('Confirmação de boleto do título ' || src.numero_documento || ' no valor de R$ ' || to_char(src.valor_liquido, 'FM999999990D00') || '.', 180),
  'Olá, time financeiro. Confirmam o envio do boleto do título ' || src.numero_documento || '? Valor R$ ' || to_char(src.valor_liquido, 'FM999999990D00') || ' com vencimento em ' || to_char(src.data_vencimento, 'YYYY-MM-DD') || '.',
  src.cliente_nome,
  src.cliente_email,
  jsonb_build_array(jsonb_build_object('name', 'Financeiro Aurora', 'email', 'financeiro@aurorasemijoias.com.br')),
  jsonb_build_array('inbox', 'updates', 'financeiro', src.status),
  CASE WHEN src.status = 'recebido' THEN false ELSE true END,
  false,
  false,
  false,
  false,
  false,
  timestamp '2026-01-20 10:00:00' + (src.rn || ' hours')::interval,
  now()
FROM src;

-- AR follow-up for overdue
WITH src AS (
  SELECT
    row_number() OVER (ORDER BY cr.id ASC) AS rn,
    cr.numero_documento,
    c.nome_fantasia AS cliente_nome,
    coalesce(nullif(c.email, ''), 'financeiro.cliente@empresa.com') AS cliente_email
  FROM financeiro.contas_receber cr
  JOIN entidades.clientes c ON c.id = cr.cliente_id
  WHERE cr.tenant_id = 1
    AND lower(cr.status) = 'vencido'
  ORDER BY cr.id ASC
  LIMIT 10
)
INSERT INTO email.messages
  (id, inbox_id, thread_id, subject, snippet, text_body, from_name, from_email, to_recipients, labels, unread, sent, draft, junk, trashed, archived, created_at, updated_at)
SELECT
  'msg-' || substr(md5('ar-over-' || src.rn::text || clock_timestamp()::text), 1, 16),
  'ibx-financeiro',
  'thr-ar-' || regexp_replace(src.numero_documento, '[^a-zA-Z0-9_-]+', '-', 'g'),
  'Follow-up cobrança ' || src.numero_documento,
  'Reforço de cobrança do documento ' || src.numero_documento,
  'Prezados, segue reforço da cobrança do documento ' || src.numero_documento || '. Favor programar quitação hoje para evitar bloqueio de novos pedidos.',
  'Financeiro Aurora',
  'financeiro@aurorasemijoias.com.br',
  jsonb_build_array(jsonb_build_object('name', src.cliente_nome, 'email', src.cliente_email)),
  jsonb_build_array('sent', 'financeiro', 'cobranca'),
  false,
  true,
  false,
  false,
  false,
  false,
  timestamp '2026-01-22 09:00:00' + (src.rn || ' hours')::interval,
  now()
FROM src;

-- AP inbound
WITH src AS (
  SELECT
    row_number() OVER (ORDER BY cp.data_vencimento ASC, cp.id ASC) AS rn,
    cp.numero_documento,
    lower(cp.status) AS status,
    cp.data_vencimento,
    cp.valor_liquido,
    f.nome_fantasia AS fornecedor_nome,
    coalesce(nullif(f.email, ''), 'financeiro@fornecedor.com') AS fornecedor_email
  FROM financeiro.contas_pagar cp
  JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
  WHERE cp.tenant_id = 1
  ORDER BY cp.data_vencimento ASC, cp.id ASC
  LIMIT 14
)
INSERT INTO email.messages
  (id, inbox_id, thread_id, subject, snippet, text_body, from_name, from_email, to_recipients, labels, unread, sent, draft, junk, trashed, archived, created_at, updated_at)
SELECT
  'msg-' || substr(md5('ap-in-' || src.rn::text || clock_timestamp()::text), 1, 16),
  'ibx-compras',
  'thr-ap-' || regexp_replace(src.numero_documento, '[^a-zA-Z0-9_-]+', '-', 'g'),
  'Fatura ' || src.numero_documento || ' - ' || src.fornecedor_nome,
  left('Fatura ' || src.numero_documento || ' valor R$ ' || to_char(src.valor_liquido, 'FM999999990D00') || '.', 180),
  'Bom dia. Enviamos a fatura ' || src.numero_documento || ' no valor de R$ ' || to_char(src.valor_liquido, 'FM999999990D00') || ', vencimento ' || to_char(src.data_vencimento, 'YYYY-MM-DD') || '. Favor confirmar programação de pagamento.',
  src.fornecedor_nome,
  src.fornecedor_email,
  jsonb_build_array(jsonb_build_object('name', 'Compras Aurora', 'email', 'compras@aurorasemijoias.com.br')),
  jsonb_build_array('inbox', 'updates', 'fornecedor', src.status),
  CASE WHEN src.status = 'pago' THEN false ELSE true END,
  false,
  false,
  false,
  false,
  false,
  timestamp '2026-01-24 10:00:00' + (src.rn || ' hours')::interval,
  now()
FROM src;

-- AP payment confirmation
WITH src AS (
  SELECT
    row_number() OVER (ORDER BY cp.id ASC) AS rn,
    cp.numero_documento,
    cp.valor_liquido,
    f.nome_fantasia AS fornecedor_nome,
    coalesce(nullif(f.email, ''), 'financeiro@fornecedor.com') AS fornecedor_email
  FROM financeiro.contas_pagar cp
  JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
  WHERE cp.tenant_id = 1
    AND lower(cp.status) = 'pago'
  ORDER BY cp.id ASC
  LIMIT 10
)
INSERT INTO email.messages
  (id, inbox_id, thread_id, subject, snippet, text_body, from_name, from_email, to_recipients, labels, unread, sent, draft, junk, trashed, archived, created_at, updated_at)
SELECT
  'msg-' || substr(md5('ap-paid-' || src.rn::text || clock_timestamp()::text), 1, 16),
  'ibx-compras',
  'thr-ap-' || regexp_replace(src.numero_documento, '[^a-zA-Z0-9_-]+', '-', 'g'),
  'Comprovante de pagamento ' || src.numero_documento,
  'Pagamento efetuado para ' || src.numero_documento,
  'Pagamento do documento ' || src.numero_documento || ' concluído. Valor de R$ ' || to_char(src.valor_liquido, 'FM999999990D00') || ' liquidado e comprovante enviado ao fornecedor.',
  'Financeiro Aurora',
  'financeiro@aurorasemijoias.com.br',
  jsonb_build_array(jsonb_build_object('name', src.fornecedor_nome, 'email', src.fornecedor_email)),
  jsonb_build_array('sent', 'financeiro', 'pagamento'),
  false,
  true,
  false,
  false,
  false,
  false,
  timestamp '2026-01-26 11:00:00' + (src.rn || ' hours')::interval,
  now()
FROM src;

-- CRM sequence (outbound + inbound)
WITH src AS (
  SELECT
    row_number() OVER (ORDER BY o.atualizado_em DESC, o.id DESC) AS rn,
    o.nome AS oportunidade_nome,
    lower(coalesce(o.status, 'aberta')) AS oportunidade_status,
    coalesce(o.valor_estimado, 0) AS valor_estimado,
    coalesce(ct.nome, l.nome, c.nome, 'Contato') AS contato_nome,
    coalesce(nullif(ct.email, ''), nullif(l.email, ''), 'contato@cliente.com') AS contato_email,
    coalesce(c.nome, l.empresa, 'Conta') AS conta_nome
  FROM crm.oportunidades o
  LEFT JOIN crm.leads l ON l.id = o.lead_id
  LEFT JOIN crm.contas c ON c.id = o.conta_id
  LEFT JOIN crm.contatos ct ON ct.id = l.contato_id
  WHERE o.tenant_id = 1
  ORDER BY o.atualizado_em DESC, o.id DESC
  LIMIT 12
)
INSERT INTO email.messages
  (id, inbox_id, thread_id, subject, snippet, text_body, from_name, from_email, to_recipients, labels, unread, sent, draft, junk, trashed, archived, created_at, updated_at)
SELECT
  'msg-' || substr(md5('crm-out-' || src.rn::text || clock_timestamp()::text), 1, 16),
  'ibx-comercial',
  'thr-opp-' || regexp_replace(src.oportunidade_nome, '[^a-zA-Z0-9_-]+', '-', 'g'),
  'Próximos passos - ' || src.oportunidade_nome,
  left('Proposta atualizada para ' || src.conta_nome || '.', 180),
  'Olá, ' || src.contato_nome || '. Segue proposta atualizada para ' || src.conta_nome || ', com escopo revisado e estimativa de R$ ' || to_char(src.valor_estimado, 'FM999999990D00') || '. Podemos fechar agenda de validação comercial amanhã?',
  'Comercial Aurora',
  'comercial@aurorasemijoias.com.br',
  jsonb_build_array(jsonb_build_object('name', src.contato_nome, 'email', src.contato_email)),
  jsonb_build_array('sent', 'crm', src.oportunidade_status),
  false,
  true,
  false,
  false,
  false,
  false,
  timestamp '2026-01-28 09:00:00' + (src.rn || ' hours')::interval,
  now()
FROM src;

WITH src AS (
  SELECT
    row_number() OVER (ORDER BY o.atualizado_em DESC, o.id DESC) AS rn,
    o.nome AS oportunidade_nome,
    coalesce(ct.nome, l.nome, c.nome, 'Contato') AS contato_nome,
    coalesce(nullif(ct.email, ''), nullif(l.email, ''), 'contato@cliente.com') AS contato_email
  FROM crm.oportunidades o
  LEFT JOIN crm.leads l ON l.id = o.lead_id
  LEFT JOIN crm.contas c ON c.id = o.conta_id
  LEFT JOIN crm.contatos ct ON ct.id = l.contato_id
  WHERE o.tenant_id = 1
  ORDER BY o.atualizado_em DESC, o.id DESC
  LIMIT 12
)
INSERT INTO email.messages
  (id, inbox_id, thread_id, subject, snippet, text_body, from_name, from_email, to_recipients, labels, unread, sent, draft, junk, trashed, archived, created_at, updated_at)
SELECT
  'msg-' || substr(md5('crm-in-' || src.rn::text || clock_timestamp()::text), 1, 16),
  'ibx-comercial',
  'thr-opp-' || regexp_replace(src.oportunidade_nome, '[^a-zA-Z0-9_-]+', '-', 'g'),
  'RE: ' || src.oportunidade_nome,
  left('Podemos avançar com cronograma e SLA?', 180),
  'Recebido. Podemos avançar com o cronograma e SLA, mantendo início na próxima semana?',
  src.contato_nome,
  src.contato_email,
  jsonb_build_array(jsonb_build_object('name', 'Comercial Aurora', 'email', 'comercial@aurorasemijoias.com.br')),
  jsonb_build_array('inbox', 'crm', 'updates'),
  true,
  false,
  false,
  false,
  false,
  false,
  timestamp '2026-01-29 10:00:00' + (src.rn || ' hours')::interval,
  now()
FROM src;

-- Inventory alerts
WITH src AS (
  SELECT
    row_number() OVER (ORDER BY sum(e.quantidade_atual) ASC, p.nome ASC) AS rn,
    p.nome AS produto_nome,
    sum(e.quantidade_atual)::int AS saldo_total
  FROM estoque.estoques_atual e
  JOIN produtos.produto p ON p.id = e.produto_id
  WHERE e.tenant_id = 1
  GROUP BY p.id, p.nome
  ORDER BY sum(e.quantidade_atual) ASC, p.nome ASC
  LIMIT 8
)
INSERT INTO email.messages
  (id, inbox_id, thread_id, subject, snippet, text_body, from_name, from_email, to_recipients, labels, unread, sent, draft, junk, trashed, archived, created_at, updated_at)
SELECT
  'msg-' || substr(md5('stock-' || src.rn::text || clock_timestamp()::text), 1, 16),
  'ibx-operacoes',
  'thr-stock-' || regexp_replace(src.produto_nome, '[^a-zA-Z0-9_-]+', '-', 'g'),
  'Alerta de estoque ' || src.produto_nome,
  left('Saldo consolidado de ' || src.saldo_total::text || ' unidades.', 180),
  'Produto ' || src.produto_nome || ' com saldo consolidado de ' || src.saldo_total::text || ' unidades. Recomendar reposição e ajuste de ponto de pedido.',
  'WMS Bot',
  'wms@aurorasemijoias.com.br',
  jsonb_build_array(jsonb_build_object('name', 'Operações Aurora', 'email', 'operacoes@aurorasemijoias.com.br')),
  jsonb_build_array('inbox', 'estoque', CASE WHEN src.saldo_total <= 24 THEN 'updates' ELSE 'forums' END),
  CASE WHEN src.saldo_total <= 45 THEN true ELSE false END,
  false,
  false,
  false,
  false,
  false,
  timestamp '2026-01-30 08:00:00' + (src.rn || ' hours')::interval,
  now()
FROM src;
