BEGIN;

-- 1) Branding e contexto B2B serviços em inboxes
UPDATE email.inboxes
SET
  username = CASE id
    WHEN 'ibx-financeiro' THEN 'financeiro'
    WHEN 'ibx-compras' THEN 'compras'
    WHEN 'ibx-comercial' THEN 'comercial'
    WHEN 'ibx-operacoes' THEN 'operacoes'
    ELSE username
  END,
  domain = 'nexaops.com.br',
  email = CASE id
    WHEN 'ibx-financeiro' THEN 'financeiro@nexaops.com.br'
    WHEN 'ibx-compras' THEN 'compras@nexaops.com.br'
    WHEN 'ibx-comercial' THEN 'comercial@nexaops.com.br'
    WHEN 'ibx-operacoes' THEN 'operacoes@nexaops.com.br'
    ELSE email
  END,
  display_name = CASE id
    WHEN 'ibx-financeiro' THEN 'Financeiro NexaOps'
    WHEN 'ibx-compras' THEN 'Suprimentos NexaOps'
    WHEN 'ibx-comercial' THEN 'Comercial NexaOps'
    WHEN 'ibx-operacoes' THEN 'Operações NexaOps'
    ELSE display_name
  END,
  updated_at = now();

-- 2) Pastas do drive orientadas ao cenário B2B serviços
UPDATE drive.folders
SET
  name = CASE
    WHEN lower(name) LIKE 'financeiro%' THEN 'Financeiro - Faturas, Cobranca e Liquidacoes'
    WHEN lower(name) LIKE 'comercial%' THEN 'Comercial - Propostas e Contratos'
    WHEN lower(name) LIKE 'compras%' THEN 'Compras - Fornecedores e Licencas'
    WHEN lower(name) LIKE 'estoque%' THEN 'Estoque - Operacao Separada'
    WHEN lower(name) LIKE 'administrativo%' THEN 'Administrativo - Juridico e Compliance'
    ELSE name
  END,
  deleted_at = NULL,
  updated_at = now()
WHERE parent_id IS NULL
  AND (
    lower(name) LIKE 'financeiro%'
    OR lower(name) LIKE 'comercial%'
    OR lower(name) LIKE 'compras%'
    OR lower(name) LIKE 'estoque%'
    OR lower(name) LIKE 'administrativo%'
  );

-- 3) Clientes do financeiro/vendas com perfil empresarial (B2B)
WITH used_clientes AS (
  SELECT DISTINCT p.cliente_id AS id
  FROM vendas.pedidos p
  WHERE p.tenant_id = 1 AND p.cliente_id IS NOT NULL
  UNION
  SELECT DISTINCT cr.cliente_id AS id
  FROM financeiro.contas_receber cr
  WHERE cr.tenant_id = 1 AND cr.cliente_id IS NOT NULL
),
ranked_clientes AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn
  FROM used_clientes
),
contas_base AS (
  SELECT c.nome, row_number() OVER (ORDER BY c.id) AS rn
  FROM crm.contas c
  WHERE c.tenant_id = 1
),
mapped AS (
  SELECT rc.id,
         cb.nome
  FROM ranked_clientes rc
  JOIN contas_base cb
    ON cb.rn = ((rc.rn - 1) % (SELECT COUNT(*) FROM contas_base)) + 1
)
UPDATE entidades.clientes ec
SET
  nome_fantasia = mapped.nome,
  nome_razao = mapped.nome || ' LTDA',
  email = lower(regexp_replace(COALESCE(mapped.nome, 'clienteb2b'), '[^a-zA-Z0-9]+', '', 'g')) || '@cliente-b2b.com.br',
  tipo_pessoa = 'juridica',
  canal = 'B2B',
  ativo = true,
  atualizado_em = now()
FROM mapped
WHERE ec.id = mapped.id;

-- 4) Fornecedores com narrativa de serviços (software, infraestrutura, terceiros)
WITH used_fornecedores AS (
  SELECT DISTINCT c.fornecedor_id AS id
  FROM compras.compras c
  WHERE c.tenant_id = 1 AND c.fornecedor_id IS NOT NULL
  UNION
  SELECT DISTINCT cp.fornecedor_id AS id
  FROM financeiro.contas_pagar cp
  WHERE cp.tenant_id = 1 AND cp.fornecedor_id IS NOT NULL
),
ranked_fornecedores AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn
  FROM used_fornecedores
),
seed_fornecedores(nome, email, cidade, estado) AS (
  VALUES
    ('Cloudia Infraestrutura Ltda', 'contato@cloudia.com.br', 'Sao Paulo', 'SP'),
    ('Asaas Pagamentos Corporativos', 'financeiro@asaas.com.br', 'Joinville', 'SC'),
    ('Omie Sistemas Empresariais', 'suporte@omie.com.br', 'Sao Paulo', 'SP'),
    ('Hostinger Cloud Brasil', 'billing@hostinger.com.br', 'Curitiba', 'PR'),
    ('Meta Ads Brasil', 'billing@meta.com', 'Sao Paulo', 'SP'),
    ('Google Workspace Brasil', 'faturamento@google.com', 'Sao Paulo', 'SP'),
    ('NordLink Telecom', 'atendimento@nordlink.com.br', 'Recife', 'PE'),
    ('SegurPro Facilities', 'contratos@segurpro.com.br', 'Belo Horizonte', 'MG'),
    ('FastDesk Field Service', 'comercial@fastdesk.com.br', 'Rio de Janeiro', 'RJ'),
    ('NuvemSign Assinaturas', 'vendas@nuvemsign.com.br', 'Sao Paulo', 'SP'),
    ('Juridico Prime Advisory', 'contato@juridicoprime.com.br', 'Brasilia', 'DF'),
    ('Contabil Mais BPO', 'bpo@contabilmais.com.br', 'Fortaleza', 'CE'),
    ('DataBridge BI Consulting', 'projetos@databridge.com.br', 'Campinas', 'SP'),
    ('Sigma Outsourcing Operacional', 'comercial@sigmaoutsourcing.com.br', 'Curitiba', 'PR'),
    ('Atlas Logistica Tecnica', 'operacoes@atlaslogistica.com.br', 'Sao Paulo', 'SP')
),
ranked_seed AS (
  SELECT nome, email, cidade, estado, row_number() OVER (ORDER BY nome) AS rn
  FROM seed_fornecedores
),
mapped AS (
  SELECT rf.id,
         rs.nome,
         rs.email,
         rs.cidade,
         rs.estado
  FROM ranked_fornecedores rf
  JOIN ranked_seed rs
    ON rs.rn = ((rf.rn - 1) % (SELECT COUNT(*) FROM ranked_seed)) + 1
)
UPDATE entidades.fornecedores ef
SET
  nome_fantasia = mapped.nome,
  email = mapped.email,
  cidade = mapped.cidade,
  estado = mapped.estado
FROM mapped
WHERE ef.id = mapped.id;

-- 5) Narrativa transacional alinhada ao B2B serviços (estoque mantido separado)
UPDATE vendas.pedidos
SET
  descricao = CASE
    WHEN status = 'concluido' THEN 'Servico B2B concluido com aceite formal do cliente.'
    WHEN status = 'aprovado' THEN 'Servico B2B aprovado e aguardando janela de execucao.'
    ELSE 'Proposta de servico B2B em andamento comercial.'
  END,
  observacoes = 'Fluxo comercial de servicos: proposta, contrato, execucao e faturamento.',
  atualizado_em = now()
WHERE tenant_id = 1;

UPDATE compras.compras
SET
  observacoes = 'Compra de licencas, terceiros e infraestrutura para operacao de servicos B2B.',
  atualizado_em = now()
WHERE tenant_id = 1;

UPDATE financeiro.contas_receber
SET
  observacao = 'Titulo gerado por servicos prestados (B2B), com rastreio por proposta/contrato.',
  atualizado_em = now()
WHERE tenant_id = 1;

UPDATE financeiro.contas_pagar
SET
  observacao = 'Titulo de despesas operacionais para entrega de servicos B2B.',
  atualizado_em = now()
WHERE tenant_id = 1;

UPDATE financeiro.liquidacoes
SET
  observacao = CASE
    WHEN tipo = 'receber' THEN 'Liquidacao de recebivel de contrato/projeto de servicos.'
    ELSE 'Liquidacao de custo operacional (fornecedores/infra) de servicos.'
  END,
  atualizado_em = now()
WHERE tenant_id = 1;

-- 6) Reseed completo de documentos com origem real
TRUNCATE TABLE documentos.documentos RESTART IDENTITY CASCADE;
TRUNCATE TABLE documentos.template_versions RESTART IDENTITY CASCADE;
TRUNCATE TABLE documentos.templates RESTART IDENTITY CASCADE;

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
VALUES
  (1, 'proposta-servicos-b2b', 'Proposta Comercial de Servicos', 'proposta', 'Template comercial para vendas consultivas B2B', '{"campos":["conta","contato","escopo","valor_estimado","sla"]}'::jsonb, '{"layout":"A4","secoes":["capa","escopo","investimento","condicoes"]}'::jsonb, true, '2026-02-01T09:00:00Z', '2026-03-31T18:00:00Z', 1),
  (1, 'contrato-prestacao-servicos', 'Contrato de Prestacao de Servicos', 'contrato', 'Contrato principal de servicos recorrentes/projeto', '{"campos":["contratante","escopo","vigencia","sla","valor_mensal"]}'::jsonb, '{"layout":"A4","secoes":["partes","clausulas","anexos","assinaturas"]}'::jsonb, true, '2026-02-01T09:10:00Z', '2026-03-31T18:00:00Z', 1),
  (1, 'ordem-servico-campo', 'Ordem de Servico de Campo', 'os', 'Documento operacional para execucao de servico', '{"campos":["cliente","janela_execucao","atividade","responsavel"]}'::jsonb, '{"layout":"A4","secoes":["cabecalho","checklist","aceite"]}'::jsonb, true, '2026-02-01T09:20:00Z', '2026-03-31T18:00:00Z', 1),
  (1, 'fatura-servicos', 'Fatura de Servicos', 'fatura', 'Fatura vinculada ao contrato/projeto de servicos', '{"campos":["numero_documento","cliente","competencia","valor"]}'::jsonb, '{"layout":"A4","secoes":["cabecalho","itens","totais","instrucao_pagamento"]}'::jsonb, true, '2026-02-01T09:30:00Z', '2026-03-31T18:00:00Z', 1),
  (1, 'aditivo-contratual', 'Aditivo Contratual', 'contrato', 'Aditivo para ajuste de escopo e condicoes comerciais', '{"campos":["contrato","motivo","escopo_adicional","impacto_valor"]}'::jsonb, '{"layout":"A4","secoes":["contexto","aditivo","assinaturas"]}'::jsonb, true, '2026-02-01T09:40:00Z', '2026-03-31T18:00:00Z', 1),
  (1, 'ata-reuniao-comercial', 'Ata de Reuniao Comercial', 'outro', 'Registro de alinhamentos comerciais e tecnicos', '{"campos":["conta","participantes","decisoes","proximos_passos"]}'::jsonb, '{"layout":"A4","secoes":["resumo","decisoes","actions"]}'::jsonb, true, '2026-02-01T09:50:00Z', '2026-03-31T18:00:00Z', 1),
  (1, 'nfse-servicos-b2b', 'NFS-e Servicos B2B', 'nfse', 'Documento fiscal para servicos prestados', '{"campos":["tomador","descricao_servico","base_calculo","valor_liquido"]}'::jsonb, '{"layout":"A4","secoes":["prestador","tomador","tributacao","totais"]}'::jsonb, true, '2026-02-01T10:00:00Z', '2026-03-31T18:00:00Z', 1),
  (1, 'relatorio-execucao', 'Relatorio de Execucao', 'outro', 'Evidencias e consolidacao de execucao de servico', '{"campos":["cliente","periodo","entregaveis","indicadores"]}'::jsonb, '{"layout":"A4","secoes":["sumario","entregas","indicadores","conclusao"]}'::jsonb, true, '2026-02-01T10:10:00Z', '2026-03-31T18:00:00Z', 1);

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
  t.id,
  v.versao,
  v.conteudo_json::jsonb,
  v.publicado,
  v.publicado_em::timestamptz,
  v.notas,
  v.criado_em::timestamptz,
  v.atualizado_em::timestamptz,
  1
FROM (
  VALUES
    ('proposta-servicos-b2b', 1, '{"versao":"1.0","assinatura_digital":false}', true, '2026-02-01T10:30:00Z', 'Base inicial', '2026-02-01T10:30:00Z', '2026-02-01T10:30:00Z'),
    ('proposta-servicos-b2b', 2, '{"versao":"2.0","assinatura_digital":true,"bloco_sla":true}', true, '2026-03-10T10:30:00Z', 'Inclui bloco SLA', '2026-03-10T10:30:00Z', '2026-03-10T10:30:00Z'),
    ('contrato-prestacao-servicos', 1, '{"versao":"1.0","rubrica":false}', true, '2026-02-02T11:00:00Z', 'Versao inicial', '2026-02-02T11:00:00Z', '2026-02-02T11:00:00Z'),
    ('contrato-prestacao-servicos', 2, '{"versao":"2.0","rubrica":true,"clausula_lgpd":true}', true, '2026-03-12T11:00:00Z', 'Inclui LGPD', '2026-03-12T11:00:00Z', '2026-03-12T11:00:00Z'),
    ('ordem-servico-campo', 1, '{"versao":"1.0","checklist":true}', true, '2026-02-02T11:10:00Z', 'Versao inicial', '2026-02-02T11:10:00Z', '2026-02-02T11:10:00Z'),
    ('fatura-servicos', 1, '{"versao":"1.0","linha_digitavel":true}', true, '2026-02-02T11:20:00Z', 'Versao inicial', '2026-02-02T11:20:00Z', '2026-02-02T11:20:00Z'),
    ('fatura-servicos', 2, '{"versao":"2.0","linha_digitavel":true,"pix_qr":true}', true, '2026-03-14T12:00:00Z', 'Inclui QR Pix', '2026-03-14T12:00:00Z', '2026-03-14T12:00:00Z'),
    ('aditivo-contratual', 1, '{"versao":"1.0","aprovacao_dupla":false}', true, '2026-02-05T12:10:00Z', 'Versao inicial', '2026-02-05T12:10:00Z', '2026-02-05T12:10:00Z'),
    ('ata-reuniao-comercial', 1, '{"versao":"1.0","resumo_executivo":true}', true, '2026-02-05T12:20:00Z', 'Versao inicial', '2026-02-05T12:20:00Z', '2026-02-05T12:20:00Z'),
    ('nfse-servicos-b2b', 1, '{"versao":"1.0","retencao_iss":false}', true, '2026-02-06T13:00:00Z', 'Versao inicial', '2026-02-06T13:00:00Z', '2026-02-06T13:00:00Z'),
    ('relatorio-execucao', 1, '{"versao":"1.0","indicadores":true}', true, '2026-02-06T13:10:00Z', 'Versao inicial', '2026-02-06T13:10:00Z', '2026-02-06T13:10:00Z')
) AS v(codigo, versao, conteudo_json, publicado, publicado_em, notas, criado_em, atualizado_em)
JOIN documentos.templates t
  ON t.tenant_id = 1
 AND t.codigo = v.codigo;

WITH opp_base AS (
  SELECT
    o.id,
    o.status,
    o.valor_estimado,
    COALESCE(c.nome, l.empresa, 'Conta B2B') AS conta_nome,
    COALESCE(ct.nome, l.nome, 'Contato') AS contato_nome,
    COALESCE(NULLIF(ct.email, ''), NULLIF(l.email, ''), lower(regexp_replace(COALESCE(c.nome, l.empresa, 'conta'), '[^a-zA-Z0-9]+', '', 'g')) || '@conta-b2b.com.br') AS contato_email,
    COALESCE(o.data_prevista::date, o.criado_em::date, DATE '2026-03-31') AS data_ref,
    row_number() OVER (ORDER BY COALESCE(o.valor_estimado, 0) DESC, o.id DESC) AS rn
  FROM crm.oportunidades o
  LEFT JOIN crm.contas c ON c.id = o.conta_id AND c.tenant_id = o.tenant_id
  LEFT JOIN crm.leads l ON l.id = o.lead_id AND l.tenant_id = o.tenant_id
  LEFT JOIN crm.contatos ct ON ct.id = l.contato_id AND ct.tenant_id = o.tenant_id
  WHERE o.tenant_id = 1
),
ar_base AS (
  SELECT
    cr.id,
    cr.numero_documento,
    cr.status,
    cr.valor_liquido,
    COALESCE(c.nome_fantasia, c.nome_razao, 'Cliente B2B') AS cliente_nome,
    COALESCE(NULLIF(c.email, ''), lower(regexp_replace(COALESCE(c.nome_fantasia, c.nome_razao, 'cliente'), '[^a-zA-Z0-9]+', '', 'g')) || '@cliente-b2b.com.br') AS cliente_email,
    COALESCE(cr.data_documento, cr.data_vencimento, DATE '2026-03-31') AS data_ref,
    COALESCE(cr.data_vencimento, DATE '2026-03-31') AS vencimento,
    row_number() OVER (ORDER BY COALESCE(cr.data_documento, cr.data_vencimento) DESC, cr.id DESC) AS rn
  FROM financeiro.contas_receber cr
  LEFT JOIN entidades.clientes c ON c.id = cr.cliente_id
  WHERE cr.tenant_id = 1
),
ap_base AS (
  SELECT
    cp.id,
    cp.numero_documento,
    cp.status,
    cp.valor_liquido,
    COALESCE(f.nome_fantasia, 'Fornecedor') AS fornecedor_nome,
    COALESCE(NULLIF(f.email, ''), lower(regexp_replace(COALESCE(f.nome_fantasia, 'fornecedor'), '[^a-zA-Z0-9]+', '', 'g')) || '@fornecedor-b2b.com.br') AS fornecedor_email,
    COALESCE(cp.data_documento, cp.data_vencimento, DATE '2026-03-31') AS data_ref,
    row_number() OVER (ORDER BY COALESCE(cp.data_documento, cp.data_vencimento) DESC, cp.id DESC) AS rn
  FROM financeiro.contas_pagar cp
  LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
  WHERE cp.tenant_id = 1
),
pedidos_base AS (
  SELECT
    p.id,
    p.status,
    p.valor_total,
    COALESCE(c.nome_fantasia, c.nome_razao, 'Cliente B2B') AS cliente_nome,
    COALESCE(p.data_documento, p.data_pedido::date, DATE '2026-03-31') AS data_ref,
    row_number() OVER (ORDER BY COALESCE(p.data_documento, p.data_pedido::date) DESC, p.id DESC) AS rn
  FROM vendas.pedidos p
  LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
  WHERE p.tenant_id = 1
),
docs_seed AS (
  -- Propostas comerciais
  SELECT
    'proposta-servicos-b2b'::text AS template_codigo,
    2::int AS template_versao,
    'crm.oportunidades'::text AS origem_tipo,
    ob.id::bigint AS origem_id,
    ('Proposta Comercial - ' || ob.conta_nome || ' (#OP' || ob.id::text || ')')::text AS titulo,
    CASE
      WHEN lower(COALESCE(ob.status, '')) IN ('ganha', 'fechado_ganho', 'won') THEN 'assinado'
      WHEN lower(COALESCE(ob.status, '')) IN ('perdida', 'fechado_perdido', 'lost') THEN 'cancelado'
      WHEN ob.rn % 6 = 0 THEN 'rascunho'
      ELSE 'enviado'
    END::text AS status,
    jsonb_build_object(
      'tipo', 'proposta_servicos',
      'oportunidade_id', ob.id,
      'conta_nome', ob.conta_nome,
      'contato_nome', ob.contato_nome,
      'contato_email', ob.contato_email,
      'valor_estimado', COALESCE(ob.valor_estimado, 0)
    ) AS payload_json,
    NULL::text AS erro_texto,
    (ob.data_ref::timestamp + interval '10 hour')::timestamptz AS gerado_em,
    (ob.data_ref::timestamp + interval '11 hour')::timestamptz AS enviado_em,
    (ob.data_ref::timestamp + interval '09 hour')::timestamptz AS criado_em,
    (ob.data_ref::timestamp + interval '11 hour')::timestamptz AS atualizado_em
  FROM opp_base ob
  WHERE ob.rn <= 14

  UNION ALL

  -- Contratos e aditivos
  SELECT
    CASE WHEN ob.rn % 4 = 0 THEN 'aditivo-contratual' ELSE 'contrato-prestacao-servicos' END AS template_codigo,
    2::int AS template_versao,
    'crm.oportunidades'::text AS origem_tipo,
    ob.id::bigint AS origem_id,
    CASE
      WHEN ob.rn % 4 = 0 THEN ('Aditivo Contratual - ' || ob.conta_nome || ' (#OP' || ob.id::text || ')')
      ELSE ('Contrato de Servicos - ' || ob.conta_nome || ' (#OP' || ob.id::text || ')')
    END AS titulo,
    CASE
      WHEN lower(COALESCE(ob.status, '')) IN ('ganha', 'fechado_ganho', 'won') THEN 'assinado'
      ELSE 'enviado'
    END::text AS status,
    jsonb_build_object(
      'tipo', CASE WHEN ob.rn % 4 = 0 THEN 'aditivo' ELSE 'contrato' END,
      'oportunidade_id', ob.id,
      'conta_nome', ob.conta_nome,
      'valor_estimado', COALESCE(ob.valor_estimado, 0)
    ) AS payload_json,
    NULL::text AS erro_texto,
    (ob.data_ref::timestamp + interval '13 hour')::timestamptz AS gerado_em,
    (ob.data_ref::timestamp + interval '14 hour')::timestamptz AS enviado_em,
    (ob.data_ref::timestamp + interval '12 hour')::timestamptz AS criado_em,
    (ob.data_ref::timestamp + interval '14 hour')::timestamptz AS atualizado_em
  FROM opp_base ob
  WHERE ob.rn <= 10

  UNION ALL

  -- OS operacionais baseadas nos pedidos
  SELECT
    'ordem-servico-campo'::text AS template_codigo,
    1::int AS template_versao,
    'vendas.pedidos'::text AS origem_tipo,
    pb.id::bigint AS origem_id,
    ('OS de Campo - Pedido ' || pb.id::text || ' - ' || pb.cliente_nome)::text AS titulo,
    CASE
      WHEN lower(COALESCE(pb.status, '')) = 'concluido' THEN 'gerado'
      WHEN lower(COALESCE(pb.status, '')) = 'aprovado' THEN 'enviado'
      ELSE 'gerando'
    END::text AS status,
    jsonb_build_object(
      'tipo', 'os_campo',
      'pedido_id', pb.id,
      'cliente_nome', pb.cliente_nome,
      'valor_total', COALESCE(pb.valor_total, 0)
    ) AS payload_json,
    NULL::text AS erro_texto,
    (pb.data_ref::timestamp + interval '09 hour')::timestamptz AS gerado_em,
    CASE WHEN lower(COALESCE(pb.status, '')) IN ('aprovado','concluido') THEN (pb.data_ref::timestamp + interval '10 hour')::timestamptz ELSE NULL::timestamptz END AS enviado_em,
    (pb.data_ref::timestamp + interval '08 hour')::timestamptz AS criado_em,
    (pb.data_ref::timestamp + interval '10 hour')::timestamptz AS atualizado_em
  FROM pedidos_base pb
  WHERE pb.rn <= 10

  UNION ALL

  -- Faturas e NFS-e do contas a receber
  SELECT
    'fatura-servicos'::text AS template_codigo,
    2::int AS template_versao,
    'financeiro.contas_receber'::text AS origem_tipo,
    ab.id::bigint AS origem_id,
    ('Fatura de Servicos - ' || ab.numero_documento || ' - ' || ab.cliente_nome)::text AS titulo,
    CASE
      WHEN lower(COALESCE(ab.status, '')) = 'recebido' THEN 'assinado'
      WHEN lower(COALESCE(ab.status, '')) = 'cancelado' THEN 'cancelado'
      ELSE 'enviado'
    END::text AS status,
    jsonb_build_object(
      'tipo', 'fatura_servicos',
      'conta_receber_id', ab.id,
      'numero_documento', ab.numero_documento,
      'cliente_nome', ab.cliente_nome,
      'cliente_email', ab.cliente_email,
      'valor_liquido', COALESCE(ab.valor_liquido, 0),
      'vencimento', ab.vencimento
    ) AS payload_json,
    NULL::text AS erro_texto,
    (ab.data_ref::timestamp + interval '10 hour')::timestamptz AS gerado_em,
    (ab.data_ref::timestamp + interval '11 hour')::timestamptz AS enviado_em,
    (ab.data_ref::timestamp + interval '09 hour')::timestamptz AS criado_em,
    (ab.data_ref::timestamp + interval '11 hour')::timestamptz AS atualizado_em
  FROM ar_base ab
  WHERE ab.rn <= 12

  UNION ALL

  SELECT
    'nfse-servicos-b2b'::text AS template_codigo,
    1::int AS template_versao,
    'financeiro.contas_receber'::text AS origem_tipo,
    ab.id::bigint AS origem_id,
    ('NFS-e Servicos - ' || ab.numero_documento || ' - ' || ab.cliente_nome)::text AS titulo,
    CASE
      WHEN lower(COALESCE(ab.status, '')) = 'cancelado' THEN 'cancelado'
      ELSE 'enviado'
    END::text AS status,
    jsonb_build_object(
      'tipo', 'nfse',
      'conta_receber_id', ab.id,
      'numero_documento', ab.numero_documento,
      'tomador', ab.cliente_nome,
      'valor_liquido', COALESCE(ab.valor_liquido, 0)
    ) AS payload_json,
    NULL::text AS erro_texto,
    (ab.data_ref::timestamp + interval '15 hour')::timestamptz AS gerado_em,
    (ab.data_ref::timestamp + interval '15 hour 20 minutes')::timestamptz AS enviado_em,
    (ab.data_ref::timestamp + interval '14 hour 40 minutes')::timestamptz AS criado_em,
    (ab.data_ref::timestamp + interval '15 hour 20 minutes')::timestamptz AS atualizado_em
  FROM ar_base ab
  WHERE ab.rn <= 6

  UNION ALL

  -- Relatorios/atas no ciclo comercial
  SELECT
    CASE WHEN ob.rn % 2 = 0 THEN 'relatorio-execucao' ELSE 'ata-reuniao-comercial' END AS template_codigo,
    1::int AS template_versao,
    'crm.oportunidades'::text AS origem_tipo,
    ob.id::bigint AS origem_id,
    CASE WHEN ob.rn % 2 = 0
      THEN ('Relatorio de Execucao - ' || ob.conta_nome || ' (#OP' || ob.id::text || ')')
      ELSE ('Ata Comercial - ' || ob.conta_nome || ' (#OP' || ob.id::text || ')')
    END AS titulo,
    'gerado'::text AS status,
    jsonb_build_object(
      'tipo', CASE WHEN ob.rn % 2 = 0 THEN 'relatorio_execucao' ELSE 'ata_reuniao' END,
      'oportunidade_id', ob.id,
      'conta_nome', ob.conta_nome,
      'contato_nome', ob.contato_nome
    ) AS payload_json,
    NULL::text AS erro_texto,
    (ob.data_ref::timestamp + interval '17 hour')::timestamptz AS gerado_em,
    NULL::timestamptz AS enviado_em,
    (ob.data_ref::timestamp + interval '16 hour')::timestamptz AS criado_em,
    (ob.data_ref::timestamp + interval '17 hour')::timestamptz AS atualizado_em
  FROM opp_base ob
  WHERE ob.rn <= 8

  UNION ALL

  -- Evidencias de compras/custos operacionais
  SELECT
    'relatorio-execucao'::text AS template_codigo,
    1::int AS template_versao,
    'financeiro.contas_pagar'::text AS origem_tipo,
    ap.id::bigint AS origem_id,
    ('Comprovacao de Custo Operacional - ' || ap.numero_documento || ' - ' || ap.fornecedor_nome)::text AS titulo,
    CASE WHEN lower(COALESCE(ap.status, '')) = 'cancelado' THEN 'cancelado' ELSE 'gerado' END::text AS status,
    jsonb_build_object(
      'tipo', 'custo_operacional',
      'conta_pagar_id', ap.id,
      'numero_documento', ap.numero_documento,
      'fornecedor_nome', ap.fornecedor_nome,
      'fornecedor_email', ap.fornecedor_email,
      'valor_liquido', COALESCE(ap.valor_liquido, 0)
    ) AS payload_json,
    NULL::text AS erro_texto,
    (ap.data_ref::timestamp + interval '12 hour')::timestamptz AS gerado_em,
    NULL::timestamptz AS enviado_em,
    (ap.data_ref::timestamp + interval '11 hour')::timestamptz AS criado_em,
    (ap.data_ref::timestamp + interval '12 hour')::timestamptz AS atualizado_em
  FROM ap_base ap
  WHERE ap.rn <= 6
),
docs_enriched AS (
  SELECT
    ds.origem_tipo,
    ds.origem_id,
    ds.titulo,
    ds.status,
    ds.payload_json,
    ds.erro_texto,
    ds.gerado_em,
    ds.enviado_em,
    ds.criado_em,
    ds.atualizado_em,
    t.id AS template_id,
    COALESCE(tv_preferida.id, tv_publicada.id) AS template_version_id
  FROM docs_seed ds
  JOIN documentos.templates t
    ON t.tenant_id = 1
   AND t.codigo = ds.template_codigo
  LEFT JOIN documentos.template_versions tv_preferida
    ON tv_preferida.tenant_id = t.tenant_id
   AND tv_preferida.template_id = t.id
   AND tv_preferida.versao = ds.template_versao
  LEFT JOIN LATERAL (
    SELECT v.id
    FROM documentos.template_versions v
    WHERE v.tenant_id = t.tenant_id
      AND v.template_id = t.id
      AND v.publicado = true
    ORDER BY v.versao DESC, v.id DESC
    LIMIT 1
  ) tv_publicada ON true
)
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
  erro_texto,
  gerado_em,
  enviado_em,
  criado_em,
  atualizado_em,
  criado_por
)
SELECT
  1,
  de.template_id,
  de.template_version_id,
  de.origem_tipo,
  de.origem_id,
  de.titulo,
  de.status,
  de.payload_json,
  'application/pdf',
  de.erro_texto,
  de.gerado_em,
  de.enviado_em,
  de.criado_em,
  de.atualizado_em,
  1
FROM docs_enriched de;

-- 7) Link documentos em arquivos reais do drive (PDF ativos), com round-robin
WITH active_files AS (
  SELECT
    f.id,
    row_number() OVER (ORDER BY f.created_at, f.id) AS rn,
    count(*) OVER () AS total
  FROM drive.files f
  WHERE f.deleted_at IS NULL
    AND lower(COALESCE(f.mime, '')) = 'application/pdf'
),
docs_ranked AS (
  SELECT
    d.id,
    row_number() OVER (ORDER BY d.criado_em, d.id) AS rn
  FROM documentos.documentos d
  WHERE d.tenant_id = 1
    AND d.status IN ('gerado', 'enviado', 'assinado')
),
mapped_files AS (
  SELECT
    dr.id AS doc_id,
    af.id AS file_id
  FROM docs_ranked dr
  JOIN active_files af
    ON af.rn = ((dr.rn - 1) % (SELECT MAX(total) FROM active_files)) + 1
)
UPDATE documentos.documentos d
SET
  drive_file_id = mf.file_id,
  drive_signed_url = '/api/drive/files/' || mf.file_id::text || '/download',
  atualizado_em = now()
FROM mapped_files mf
WHERE d.id = mf.doc_id;

-- 8) Organiza nome/pasta dos arquivos do drive usados pelos documentos
WITH folder_targets AS (
  SELECT
    (array_agg(id ORDER BY id) FILTER (WHERE lower(name) LIKE 'financeiro%'))[1] AS financeiro_id,
    (array_agg(id ORDER BY id) FILTER (WHERE lower(name) LIKE 'comercial%'))[1] AS comercial_id,
    (array_agg(id ORDER BY id) FILTER (WHERE lower(name) LIKE 'compras%'))[1] AS compras_id,
    (array_agg(id ORDER BY id) FILTER (WHERE lower(name) LIKE 'administrativo%'))[1] AS adm_id
  FROM drive.folders
  WHERE deleted_at IS NULL
),
file_doc AS (
  SELECT DISTINCT ON (d.drive_file_id)
    d.drive_file_id,
    d.id AS documento_id,
    d.origem_tipo,
    d.titulo
  FROM documentos.documentos d
  WHERE d.tenant_id = 1
    AND d.drive_file_id IS NOT NULL
  ORDER BY d.drive_file_id, d.id DESC
),
targeted AS (
  SELECT
    fd.drive_file_id,
    fd.documento_id,
    fd.titulo,
    CASE
      WHEN fd.origem_tipo LIKE 'financeiro.contas_receber%' THEN ft.financeiro_id
      WHEN fd.origem_tipo LIKE 'financeiro.contas_pagar%' THEN ft.compras_id
      WHEN fd.origem_tipo LIKE 'crm.%' THEN ft.comercial_id
      WHEN fd.origem_tipo LIKE 'vendas.%' THEN ft.comercial_id
      ELSE ft.adm_id
    END AS folder_id
  FROM file_doc fd
  CROSS JOIN folder_targets ft
)
UPDATE drive.files f
SET
  folder_id = t.folder_id,
  name = 'DOC-' || t.documento_id::text || '-' || trim(both '-' from regexp_replace(lower(t.titulo), '[^a-z0-9]+', '-', 'g')) || '.pdf',
  deleted_at = NULL,
  updated_at = now()
FROM targeted t
WHERE f.id = t.drive_file_id;

-- 9) Reseed de mensagens com anexos de documentos (drive_file_id/documento_id)
DELETE FROM email.messages;

-- Financeiro: entrada de clientes com fatura anexa
WITH ar_docs AS (
  SELECT
    cr.id AS conta_receber_id,
    cr.numero_documento,
    cr.status,
    cr.valor_liquido,
    cr.data_documento,
    cr.data_vencimento,
    COALESCE(c.nome_fantasia, c.nome_razao, 'Cliente B2B') AS cliente_nome,
    COALESCE(NULLIF(c.email, ''), lower(regexp_replace(COALESCE(c.nome_fantasia, c.nome_razao, 'cliente'), '[^a-zA-Z0-9]+', '', 'g')) || '@cliente-b2b.com.br') AS cliente_email,
    d.id AS documento_id,
    d.drive_file_id,
    d.titulo AS documento_titulo,
    row_number() OVER (ORDER BY COALESCE(cr.data_documento, cr.data_vencimento) DESC, cr.id DESC) AS rn
  FROM financeiro.contas_receber cr
  JOIN documentos.documentos d
    ON d.tenant_id = 1
   AND d.origem_tipo = 'financeiro.contas_receber'
   AND d.origem_id = cr.id
  LEFT JOIN entidades.clientes c ON c.id = cr.cliente_id
  WHERE cr.tenant_id = 1
)
INSERT INTO email.messages (
  id, inbox_id, thread_id, subject, snippet, text_body, html_body,
  from_name, from_email, to_recipients, cc_recipients, bcc_recipients,
  labels, attachments, unread, draft, sent, junk, trashed, archived,
  created_at, updated_at
)
SELECT
  'msg-fin-in-' || lpad(ad.rn::text, 4, '0') AS id,
  'ibx-financeiro' AS inbox_id,
  'thr-ar-' || ad.numero_documento AS thread_id,
  'Envio de fatura ' || ad.numero_documento || ' - ' || ad.cliente_nome AS subject,
  ('Segue fatura de serviços no valor de R$ ' || to_char(COALESCE(ad.valor_liquido, 0), 'FM999999990D00')) AS snippet,
  ('Olá financeiro, segue a fatura ' || ad.numero_documento || ' referente aos serviços B2B. Vencimento: ' || ad.data_vencimento::text || '.') AS text_body,
  NULL::text AS html_body,
  ad.cliente_nome AS from_name,
  ad.cliente_email AS from_email,
  jsonb_build_array(jsonb_build_object('name', 'Financeiro NexaOps', 'email', 'financeiro@nexaops.com.br')) AS to_recipients,
  '[]'::jsonb AS cc_recipients,
  '[]'::jsonb AS bcc_recipients,
  jsonb_build_array('inbox', 'financeiro', lower(COALESCE(ad.status, 'pendente'))) AS labels,
  CASE
    WHEN ad.drive_file_id IS NULL THEN '[]'::jsonb
    ELSE jsonb_build_array(jsonb_build_object(
      'documento_id', ad.documento_id,
      'drive_file_id', ad.drive_file_id,
      'filename', COALESCE(df.name, ad.documento_titulo || '.pdf'),
      'contentType', 'application/pdf',
      'url', '/api/drive/files/' || ad.drive_file_id::text || '/download'
    ))
  END AS attachments,
  true AS unread,
  false AS draft,
  false AS sent,
  false AS junk,
  false AS trashed,
  false AS archived,
  (ad.data_documento::timestamp + interval '09 hour')::timestamptz AS created_at,
  now() AS updated_at
FROM ar_docs ad
LEFT JOIN drive.files df ON df.id = ad.drive_file_id
WHERE ad.rn <= 14;

-- Financeiro: resposta com confirmacao/negociacao
WITH ar_docs AS (
  SELECT
    cr.id AS conta_receber_id,
    cr.numero_documento,
    cr.status,
    cr.valor_liquido,
    cr.data_documento,
    COALESCE(c.nome_fantasia, c.nome_razao, 'Cliente B2B') AS cliente_nome,
    COALESCE(NULLIF(c.email, ''), lower(regexp_replace(COALESCE(c.nome_fantasia, c.nome_razao, 'cliente'), '[^a-zA-Z0-9]+', '', 'g')) || '@cliente-b2b.com.br') AS cliente_email,
    row_number() OVER (ORDER BY COALESCE(cr.data_documento, cr.data_vencimento) DESC, cr.id DESC) AS rn
  FROM financeiro.contas_receber cr
  LEFT JOIN entidades.clientes c ON c.id = cr.cliente_id
  WHERE cr.tenant_id = 1
)
INSERT INTO email.messages (
  id, inbox_id, thread_id, subject, snippet, text_body, html_body,
  from_name, from_email, to_recipients, cc_recipients, bcc_recipients,
  labels, attachments, unread, draft, sent, junk, trashed, archived,
  created_at, updated_at
)
SELECT
  'msg-fin-out-' || lpad(ad.rn::text, 4, '0') AS id,
  'ibx-financeiro' AS inbox_id,
  'thr-ar-' || ad.numero_documento AS thread_id,
  CASE
    WHEN lower(COALESCE(ad.status, '')) = 'recebido' THEN 'Baixa confirmada ' || ad.numero_documento
    WHEN lower(COALESCE(ad.status, '')) = 'vencido' THEN 'Follow-up de cobranca ' || ad.numero_documento
    ELSE 'Confirmacao de recebimento da fatura ' || ad.numero_documento
  END AS subject,
  'Retorno do financeiro sobre o título.' AS snippet,
  CASE
    WHEN lower(COALESCE(ad.status, '')) = 'recebido' THEN 'Recebimento confirmado e baixado no ERP. Obrigado.'
    WHEN lower(COALESCE(ad.status, '')) = 'vencido' THEN 'Identificamos pendência de pagamento. Podemos alinhar nova data ainda hoje?'
    ELSE 'Fatura recebida e em processamento no contas a receber.'
  END AS text_body,
  NULL::text AS html_body,
  'Financeiro NexaOps' AS from_name,
  'financeiro@nexaops.com.br' AS from_email,
  jsonb_build_array(jsonb_build_object('name', ad.cliente_nome, 'email', ad.cliente_email)) AS to_recipients,
  '[]'::jsonb AS cc_recipients,
  '[]'::jsonb AS bcc_recipients,
  jsonb_build_array('sent', 'financeiro', 'followup') AS labels,
  '[]'::jsonb AS attachments,
  false AS unread,
  false AS draft,
  true AS sent,
  false AS junk,
  false AS trashed,
  false AS archived,
  (ad.data_documento::timestamp + interval '13 hour')::timestamptz AS created_at,
  now() AS updated_at
FROM ar_docs ad
WHERE ad.rn <= 14;

-- Compras: fornecedores com comprovação operacional anexa
WITH ap_docs AS (
  SELECT
    cp.id AS conta_pagar_id,
    cp.numero_documento,
    cp.status,
    cp.valor_liquido,
    cp.data_documento,
    COALESCE(f.nome_fantasia, 'Fornecedor') AS fornecedor_nome,
    COALESCE(NULLIF(f.email, ''), lower(regexp_replace(COALESCE(f.nome_fantasia, 'fornecedor'), '[^a-zA-Z0-9]+', '', 'g')) || '@fornecedor-b2b.com.br') AS fornecedor_email,
    d.id AS documento_id,
    d.drive_file_id,
    d.titulo AS documento_titulo,
    row_number() OVER (ORDER BY COALESCE(cp.data_documento, cp.data_vencimento) DESC, cp.id DESC) AS rn
  FROM financeiro.contas_pagar cp
  LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
  LEFT JOIN documentos.documentos d
    ON d.tenant_id = 1
   AND d.origem_tipo = 'financeiro.contas_pagar'
   AND d.origem_id = cp.id
  WHERE cp.tenant_id = 1
)
INSERT INTO email.messages (
  id, inbox_id, thread_id, subject, snippet, text_body, html_body,
  from_name, from_email, to_recipients, cc_recipients, bcc_recipients,
  labels, attachments, unread, draft, sent, junk, trashed, archived,
  created_at, updated_at
)
SELECT
  'msg-com-in-' || lpad(ad.rn::text, 4, '0') AS id,
  'ibx-compras' AS inbox_id,
  'thr-ap-' || ad.numero_documento AS thread_id,
  'Fatura operacional ' || ad.numero_documento || ' - ' || ad.fornecedor_nome AS subject,
  'Envio de cobrança de fornecedor para operação de serviços.' AS snippet,
  ('Encaminhamos a cobrança ' || ad.numero_documento || ' referente a serviços/infraestrutura de operação.') AS text_body,
  NULL::text AS html_body,
  ad.fornecedor_nome AS from_name,
  ad.fornecedor_email AS from_email,
  jsonb_build_array(jsonb_build_object('name', 'Suprimentos NexaOps', 'email', 'compras@nexaops.com.br')) AS to_recipients,
  '[]'::jsonb AS cc_recipients,
  '[]'::jsonb AS bcc_recipients,
  jsonb_build_array('inbox', 'compras', lower(COALESCE(ad.status, 'pendente'))) AS labels,
  CASE
    WHEN ad.drive_file_id IS NULL THEN '[]'::jsonb
    ELSE jsonb_build_array(jsonb_build_object(
      'documento_id', ad.documento_id,
      'drive_file_id', ad.drive_file_id,
      'filename', COALESCE(df.name, ad.documento_titulo || '.pdf'),
      'contentType', 'application/pdf',
      'url', '/api/drive/files/' || ad.drive_file_id::text || '/download'
    ))
  END AS attachments,
  true AS unread,
  false AS draft,
  false AS sent,
  false AS junk,
  false AS trashed,
  false AS archived,
  (ad.data_documento::timestamp + interval '09 hour')::timestamptz AS created_at,
  now() AS updated_at
FROM ap_docs ad
LEFT JOIN drive.files df ON df.id = ad.drive_file_id
WHERE ad.rn <= 12;

-- Compras: confirmação de processamento
WITH ap_docs AS (
  SELECT
    cp.id AS conta_pagar_id,
    cp.numero_documento,
    cp.status,
    cp.data_documento,
    COALESCE(f.nome_fantasia, 'Fornecedor') AS fornecedor_nome,
    COALESCE(NULLIF(f.email, ''), lower(regexp_replace(COALESCE(f.nome_fantasia, 'fornecedor'), '[^a-zA-Z0-9]+', '', 'g')) || '@fornecedor-b2b.com.br') AS fornecedor_email,
    row_number() OVER (ORDER BY COALESCE(cp.data_documento, cp.data_vencimento) DESC, cp.id DESC) AS rn
  FROM financeiro.contas_pagar cp
  LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
  WHERE cp.tenant_id = 1
)
INSERT INTO email.messages (
  id, inbox_id, thread_id, subject, snippet, text_body, html_body,
  from_name, from_email, to_recipients, cc_recipients, bcc_recipients,
  labels, attachments, unread, draft, sent, junk, trashed, archived,
  created_at, updated_at
)
SELECT
  'msg-com-out-' || lpad(ad.rn::text, 4, '0') AS id,
  'ibx-compras' AS inbox_id,
  'thr-ap-' || ad.numero_documento AS thread_id,
  CASE
    WHEN lower(COALESCE(ad.status, '')) = 'pago' THEN 'Pagamento confirmado ' || ad.numero_documento
    WHEN lower(COALESCE(ad.status, '')) = 'cancelado' THEN 'Cancelamento operacional ' || ad.numero_documento
    ELSE 'Recebimento e analise ' || ad.numero_documento
  END AS subject,
  'Retorno do time de suprimentos.' AS snippet,
  CASE
    WHEN lower(COALESCE(ad.status, '')) = 'pago' THEN 'Pagamento confirmado e registrado no fluxo de custos operacionais.'
    WHEN lower(COALESCE(ad.status, '')) = 'cancelado' THEN 'Documento cancelado por ajuste de escopo operacional.'
    ELSE 'Documento recebido, em tratativa de aprovação interna.'
  END AS text_body,
  NULL::text AS html_body,
  'Suprimentos NexaOps' AS from_name,
  'compras@nexaops.com.br' AS from_email,
  jsonb_build_array(jsonb_build_object('name', ad.fornecedor_nome, 'email', ad.fornecedor_email)) AS to_recipients,
  '[]'::jsonb AS cc_recipients,
  '[]'::jsonb AS bcc_recipients,
  jsonb_build_array('sent', 'compras', 'followup') AS labels,
  '[]'::jsonb AS attachments,
  false AS unread,
  false AS draft,
  true AS sent,
  false AS junk,
  false AS trashed,
  false AS archived,
  (ad.data_documento::timestamp + interval '13 hour')::timestamptz AS created_at,
  now() AS updated_at
FROM ap_docs ad
WHERE ad.rn <= 12;

-- Comercial: envio de proposta/contrato com anexo
WITH opp_docs AS (
  SELECT
    o.id AS oportunidade_id,
    o.status,
    o.nome AS oportunidade_nome,
    COALESCE(c.nome, l.empresa, 'Conta B2B') AS conta_nome,
    COALESCE(ct.nome, l.nome, 'Contato') AS contato_nome,
    COALESCE(NULLIF(ct.email, ''), NULLIF(l.email, ''), lower(regexp_replace(COALESCE(c.nome, l.empresa, 'conta'), '[^a-zA-Z0-9]+', '', 'g')) || '@conta-b2b.com.br') AS contato_email,
    COALESCE(o.data_prevista::date, o.criado_em::date, DATE '2026-03-31') AS data_ref,
    d.id AS documento_id,
    d.drive_file_id,
    d.titulo AS documento_titulo,
    row_number() OVER (ORDER BY COALESCE(o.data_prevista::date, o.criado_em::date) DESC, o.id DESC) AS rn
  FROM crm.oportunidades o
  LEFT JOIN crm.contas c ON c.id = o.conta_id AND c.tenant_id = o.tenant_id
  LEFT JOIN crm.leads l ON l.id = o.lead_id AND l.tenant_id = o.tenant_id
  LEFT JOIN crm.contatos ct ON ct.id = l.contato_id AND ct.tenant_id = o.tenant_id
  JOIN LATERAL (
    SELECT d2.*
    FROM documentos.documentos d2
    JOIN documentos.templates t2
      ON t2.tenant_id = d2.tenant_id
     AND t2.id = d2.template_id
    WHERE d2.tenant_id = 1
      AND d2.origem_tipo = 'crm.oportunidades'
      AND d2.origem_id = o.id
    ORDER BY
      CASE t2.codigo
        WHEN 'proposta-servicos-b2b' THEN 1
        WHEN 'contrato-prestacao-servicos' THEN 2
        WHEN 'aditivo-contratual' THEN 3
        WHEN 'ata-reuniao-comercial' THEN 4
        WHEN 'relatorio-execucao' THEN 5
        ELSE 99
      END ASC,
      d2.id DESC
    LIMIT 1
  ) d ON true
  WHERE o.tenant_id = 1
)
INSERT INTO email.messages (
  id, inbox_id, thread_id, subject, snippet, text_body, html_body,
  from_name, from_email, to_recipients, cc_recipients, bcc_recipients,
  labels, attachments, unread, draft, sent, junk, trashed, archived,
  created_at, updated_at
)
SELECT
  'msg-crm-out-' || lpad(od.rn::text, 4, '0') AS id,
  'ibx-comercial' AS inbox_id,
  'thr-opp-' || od.oportunidade_id::text AS thread_id,
  'Proposta e próximos passos - ' || od.conta_nome AS subject,
  'Envio de documento comercial para avanço da oportunidade.' AS snippet,
  ('Olá ' || od.contato_nome || ', encaminhei o documento comercial da oportunidade "' || od.oportunidade_nome || '" com escopo, SLA e investimento. Podemos validar ainda esta semana?') AS text_body,
  NULL::text AS html_body,
  'Comercial NexaOps' AS from_name,
  'comercial@nexaops.com.br' AS from_email,
  jsonb_build_array(jsonb_build_object('name', od.contato_nome, 'email', od.contato_email)) AS to_recipients,
  '[]'::jsonb AS cc_recipients,
  '[]'::jsonb AS bcc_recipients,
  jsonb_build_array('sent', 'crm', lower(COALESCE(od.status, 'aberta'))) AS labels,
  CASE
    WHEN od.drive_file_id IS NULL THEN '[]'::jsonb
    ELSE jsonb_build_array(jsonb_build_object(
      'documento_id', od.documento_id,
      'drive_file_id', od.drive_file_id,
      'filename', COALESCE(df.name, od.documento_titulo || '.pdf'),
      'contentType', 'application/pdf',
      'url', '/api/drive/files/' || od.drive_file_id::text || '/download'
    ))
  END AS attachments,
  false AS unread,
  false AS draft,
  true AS sent,
  false AS junk,
  false AS trashed,
  false AS archived,
  (od.data_ref::timestamp + interval '10 hour')::timestamptz AS created_at,
  now() AS updated_at
FROM opp_docs od
LEFT JOIN drive.files df ON df.id = od.drive_file_id
WHERE od.rn <= 14;

-- Comercial: resposta de cliente
WITH opp_docs AS (
  SELECT
    o.id AS oportunidade_id,
    o.status,
    COALESCE(c.nome, l.empresa, 'Conta B2B') AS conta_nome,
    COALESCE(ct.nome, l.nome, 'Contato') AS contato_nome,
    COALESCE(NULLIF(ct.email, ''), NULLIF(l.email, ''), lower(regexp_replace(COALESCE(c.nome, l.empresa, 'conta'), '[^a-zA-Z0-9]+', '', 'g')) || '@conta-b2b.com.br') AS contato_email,
    COALESCE(o.data_prevista::date, o.criado_em::date, DATE '2026-03-31') AS data_ref,
    row_number() OVER (ORDER BY COALESCE(o.data_prevista::date, o.criado_em::date) DESC, o.id DESC) AS rn
  FROM crm.oportunidades o
  LEFT JOIN crm.contas c ON c.id = o.conta_id AND c.tenant_id = o.tenant_id
  LEFT JOIN crm.leads l ON l.id = o.lead_id AND l.tenant_id = o.tenant_id
  LEFT JOIN crm.contatos ct ON ct.id = l.contato_id AND ct.tenant_id = o.tenant_id
  WHERE o.tenant_id = 1
)
INSERT INTO email.messages (
  id, inbox_id, thread_id, subject, snippet, text_body, html_body,
  from_name, from_email, to_recipients, cc_recipients, bcc_recipients,
  labels, attachments, unread, draft, sent, junk, trashed, archived,
  created_at, updated_at
)
SELECT
  'msg-crm-in-' || lpad(od.rn::text, 4, '0') AS id,
  'ibx-comercial' AS inbox_id,
  'thr-opp-' || od.oportunidade_id::text AS thread_id,
  'RE: Proposta e próximos passos - ' || od.conta_nome AS subject,
  'Cliente retornou sobre escopo e condições.' AS snippet,
  'Recebemos internamente e podemos avançar para assinatura após ajuste final de cronograma e SLA.' AS text_body,
  NULL::text AS html_body,
  od.contato_nome AS from_name,
  od.contato_email AS from_email,
  jsonb_build_array(jsonb_build_object('name', 'Comercial NexaOps', 'email', 'comercial@nexaops.com.br')) AS to_recipients,
  '[]'::jsonb AS cc_recipients,
  '[]'::jsonb AS bcc_recipients,
  jsonb_build_array('inbox', 'crm', 'updates') AS labels,
  '[]'::jsonb AS attachments,
  true AS unread,
  false AS draft,
  false AS sent,
  false AS junk,
  false AS trashed,
  false AS archived,
  (od.data_ref::timestamp + interval '15 hour')::timestamptz AS created_at,
  now() AS updated_at
FROM opp_docs od
WHERE od.rn <= 14;

-- Operações: mantém trilha separada de estoque (sem acoplamento obrigatório com comercial)
WITH low_stock AS (
  SELECT
    p.nome AS produto_nome,
    COALESCE(SUM(ea.quantidade), 0)::numeric AS saldo_total,
    row_number() OVER (ORDER BY COALESCE(SUM(ea.quantidade), 0) ASC, p.nome ASC) AS rn
  FROM estoque.estoques_atual ea
  JOIN produtos.produto p ON p.id = ea.produto_id
  GROUP BY p.id, p.nome
)
INSERT INTO email.messages (
  id, inbox_id, thread_id, subject, snippet, text_body, html_body,
  from_name, from_email, to_recipients, cc_recipients, bcc_recipients,
  labels, attachments, unread, draft, sent, junk, trashed, archived,
  created_at, updated_at
)
SELECT
  'msg-ops-in-' || lpad(ls.rn::text, 4, '0') AS id,
  'ibx-operacoes' AS inbox_id,
  'thr-stock-' || lpad(ls.rn::text, 4, '0') AS thread_id,
  'Estoque (dominio separado) - ' || ls.produto_nome AS subject,
  'Monitoramento de estoque para suporte operacional.' AS snippet,
  ('Produto ' || ls.produto_nome || ' com saldo consolidado de ' || ls.saldo_total::text || ' unidades. Estoque segue trilha operacional separada do funil comercial.') AS text_body,
  NULL::text AS html_body,
  'WMS NexaOps' AS from_name,
  'operacoes@nexaops.com.br' AS from_email,
  jsonb_build_array(jsonb_build_object('name', 'Operações NexaOps', 'email', 'operacoes@nexaops.com.br')) AS to_recipients,
  '[]'::jsonb AS cc_recipients,
  '[]'::jsonb AS bcc_recipients,
  jsonb_build_array('inbox', 'estoque', 'separado') AS labels,
  '[]'::jsonb AS attachments,
  true AS unread,
  false AS draft,
  false AS sent,
  false AS junk,
  false AS trashed,
  false AS archived,
  ('2026-03-31'::date::timestamp + interval '09 hour' - (ls.rn || ' hours')::interval)::timestamptz AS created_at,
  now() AS updated_at
FROM low_stock ls
WHERE ls.rn <= 8;

COMMIT;
