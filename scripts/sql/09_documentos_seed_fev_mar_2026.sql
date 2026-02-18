BEGIN;

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
  (1, 'proposta-comercial', 'Proposta Comercial', 'proposta', 'Template padrão de proposta B2B para semijoias', '{"campos":["cliente","itens","condicoes_pagamento","prazo_entrega"]}'::jsonb, '{"layout":"A4","secoes":["header","itens","totais","assinatura"]}'::jsonb, true, '2026-02-01T09:00:00Z', '2026-03-10T16:00:00Z', 1),
  (1, 'pedido-venda', 'Pedido de Venda', 'outro', 'Pedido interno para separação e expedição', '{"campos":["cliente","pedido_numero","itens","transportadora"]}'::jsonb, '{"layout":"A4","secoes":["header","itens","totais"]}'::jsonb, true, '2026-02-01T09:10:00Z', '2026-03-11T11:00:00Z', 1),
  (1, 'ordem-servico', 'Ordem de Serviço', 'os', 'OS para assistência e troca de peças', '{"campos":["cliente","numero_os","defeito","prazo"]}'::jsonb, '{"layout":"A4","secoes":["header","descricao","servicos","assinatura"]}'::jsonb, true, '2026-02-02T10:00:00Z', '2026-03-12T14:10:00Z', 1),
  (1, 'fatura-cobranca', 'Fatura de Cobrança', 'fatura', 'Fatura para clientes PJ', '{"campos":["cliente","numero_fatura","vencimento","valor_total"]}'::jsonb, '{"layout":"A4","secoes":["header","itens","totais","instrucoes"]}'::jsonb, true, '2026-02-02T10:20:00Z', '2026-03-13T15:00:00Z', 1),
  (1, 'contrato-representacao', 'Contrato de Representação', 'contrato', 'Contrato para representantes e revendedores', '{"campos":["contratante","representante","comissao","vigencia"]}'::jsonb, '{"layout":"A4","secoes":["partes","clausulas","assinaturas"]}'::jsonb, true, '2026-02-03T11:00:00Z', '2026-03-14T17:00:00Z', 1),
  (1, 'nfse-servico', 'NFS-e de Serviço', 'nfse', 'Comprovante para serviços prestados', '{"campos":["tomador","descricao_servico","impostos","valor_liquido"]}'::jsonb, '{"layout":"A4","secoes":["prestador","tomador","tributacao","totais"]}'::jsonb, true, '2026-02-04T08:40:00Z', '2026-03-14T18:20:00Z', 1),
  (1, 'pedido-compra', 'Pedido de Compra', 'outro', 'Pedido para fornecedores nacionais', '{"campos":["fornecedor","pedido_compra","itens","condicoes"]}'::jsonb, '{"layout":"A4","secoes":["header","itens","totais","aprovacao"]}'::jsonb, true, '2026-02-04T09:00:00Z', '2026-03-15T12:40:00Z', 1),
  (1, 'comunicado-interno', 'Comunicado Interno', 'outro', 'Comunicados administrativos da operação', '{"campos":["assunto","mensagem","responsavel"]}'::jsonb, '{"layout":"A4","secoes":["titulo","mensagem","rodape"]}'::jsonb, false, '2026-02-05T09:30:00Z', '2026-03-15T13:00:00Z', 1);

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
    ('proposta-comercial', 1, '{"versao":"1.0","layout":"padrao"}', true,  '2026-02-01T10:00:00Z', 'Versão inicial', '2026-02-01T10:00:00Z', '2026-02-01T10:00:00Z'),
    ('proposta-comercial', 2, '{"versao":"2.0","layout":"padrao","assinatura_digital":true}', true, '2026-03-10T16:00:00Z', 'Inclui assinatura digital', '2026-03-10T16:00:00Z', '2026-03-10T16:00:00Z'),
    ('pedido-venda', 1, '{"versao":"1.0","canhoto_entrega":false}', true, '2026-02-01T10:15:00Z', 'Versão inicial', '2026-02-01T10:15:00Z', '2026-02-01T10:15:00Z'),
    ('ordem-servico', 1, '{"versao":"1.0","laudo_tecnico":false}', true, '2026-02-02T11:00:00Z', 'Versão inicial', '2026-02-02T11:00:00Z', '2026-02-02T11:00:00Z'),
    ('ordem-servico', 2, '{"versao":"2.0","laudo_tecnico":true}', true, '2026-03-12T14:10:00Z', 'Inclui laudo técnico', '2026-03-12T14:10:00Z', '2026-03-12T14:10:00Z'),
    ('fatura-cobranca', 1, '{"versao":"1.0","linha_digitavel":true}', true, '2026-02-02T11:20:00Z', 'Versão inicial', '2026-02-02T11:20:00Z', '2026-02-02T11:20:00Z'),
    ('fatura-cobranca', 2, '{"versao":"2.0","linha_digitavel":true,"pix_qr":true}', true, '2026-03-13T15:00:00Z', 'Adiciona QR Pix', '2026-03-13T15:00:00Z', '2026-03-13T15:00:00Z'),
    ('contrato-representacao', 1, '{"versao":"1.0","vigencia_meses":12}', true, '2026-02-03T12:00:00Z', 'Versão inicial', '2026-02-03T12:00:00Z', '2026-02-03T12:00:00Z'),
    ('nfse-servico', 1, '{"versao":"1.0","reteve_iss":false}', true, '2026-02-04T09:40:00Z', 'Versão inicial', '2026-02-04T09:40:00Z', '2026-02-04T09:40:00Z'),
    ('pedido-compra', 1, '{"versao":"1.0","aprova_duas_etapas":false}', true, '2026-02-04T10:00:00Z', 'Versão inicial', '2026-02-04T10:00:00Z', '2026-02-04T10:00:00Z'),
    ('pedido-compra', 2, '{"versao":"2.0","aprova_duas_etapas":true}', false, NULL, 'Rascunho para Q2', '2026-03-15T12:40:00Z', '2026-03-15T12:40:00Z'),
    ('comunicado-interno', 1, '{"versao":"1.0","assinatura_gerencia":false}', false, NULL, 'Template descontinuado', '2026-02-05T10:00:00Z', '2026-03-15T13:00:00Z')
) AS v(codigo, versao, conteudo_json, publicado, publicado_em, notas, criado_em, atualizado_em)
JOIN documentos.templates t
  ON t.tenant_id = 1
 AND t.codigo = v.codigo;

WITH tv_map AS (
  SELECT
    t.codigo,
    t.id AS template_id,
    v.versao,
    v.id AS template_version_id
  FROM documentos.templates t
  JOIN documentos.template_versions v
    ON v.template_id = t.id
   AND v.tenant_id = t.tenant_id
  WHERE t.tenant_id = 1
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
  tv.template_id,
  tv.template_version_id,
  d.origem_tipo,
  d.origem_id,
  d.titulo,
  d.status,
  d.payload_json::jsonb,
  'application/pdf',
  d.erro_texto,
  d.gerado_em::timestamptz,
  d.enviado_em::timestamptz,
  d.criado_em::timestamptz,
  d.atualizado_em::timestamptz,
  1
FROM (
  VALUES
    ('proposta-comercial', 1, 'oportunidade', 1001, 'Proposta OP-1001 - Boutique Lótus', 'enviado', '{"cliente":"Boutique Lótus","valor_total":24890.00,"condicao":"28 dias","cidade":"Campinas"}', NULL, '2026-02-03T10:10:00Z', '2026-02-03T10:25:00Z', '2026-02-03T10:00:00Z', '2026-02-03T10:25:00Z'),
    ('proposta-comercial', 1, 'oportunidade', 1002, 'Proposta OP-1002 - Revenda Charme Fino', 'assinado', '{"cliente":"Revenda Charme Fino","valor_total":31200.00,"condicao":"35 dias","cidade":"São Paulo"}', NULL, '2026-02-04T14:10:00Z', '2026-02-04T14:30:00Z', '2026-02-04T14:00:00Z', '2026-02-04T14:30:00Z'),
    ('pedido-venda', 1, 'pedido_venda', 2001, 'Pedido PV-2001 - Charme Fino', 'gerado', '{"cliente":"Revenda Charme Fino","itens":58,"valor_total":31200.00}', NULL, '2026-02-05T09:05:00Z', NULL, '2026-02-05T09:00:00Z', '2026-02-05T09:05:00Z'),
    ('fatura-cobranca', 1, 'conta_receber', 3001, 'Fatura FAT-3001 - Charme Fino', 'enviado', '{"cliente":"Revenda Charme Fino","valor_total":31200.00,"vencimento":"2026-03-07"}', NULL, '2026-02-05T10:10:00Z', '2026-02-05T10:18:00Z', '2026-02-05T10:00:00Z', '2026-02-05T10:18:00Z'),
    ('pedido-compra', 1, 'pedido_compra', 4001, 'Pedido Compra PC-4001 - Metalux', 'enviado', '{"fornecedor":"Metalux","valor_total":18950.00,"itens":12}', NULL, '2026-02-06T11:10:00Z', '2026-02-06T11:22:00Z', '2026-02-06T11:00:00Z', '2026-02-06T11:22:00Z'),
    ('ordem-servico', 1, 'ordem_servico', 5001, 'OS-5001 - Polimento lote 77', 'gerado', '{"cliente":"Boutique Lótus","descricao":"Polimento e ajuste de fecho"}', NULL, '2026-02-07T15:25:00Z', NULL, '2026-02-07T15:10:00Z', '2026-02-07T15:25:00Z'),
    ('nfse-servico', 1, 'ordem_servico', 5001, 'NFS-e 5001 - Serviço de Polimento', 'enviado', '{"tomador":"Boutique Lótus","valor_total":780.00}', NULL, '2026-02-07T16:00:00Z', '2026-02-07T16:03:00Z', '2026-02-07T15:58:00Z', '2026-02-07T16:03:00Z'),
    ('proposta-comercial', 1, 'oportunidade', 1003, 'Proposta OP-1003 - Bella Joias', 'erro', '{"cliente":"Bella Joias","valor_total":16420.00}', 'Falha ao gerar PDF (template inválido)', NULL, NULL, '2026-02-10T09:00:00Z', '2026-02-10T09:05:00Z'),
    ('proposta-comercial', 1, 'oportunidade', 1004, 'Proposta OP-1004 - Casa Aurora', 'rascunho', '{"cliente":"Casa Aurora","valor_total":21900.00}', NULL, NULL, NULL, '2026-02-11T11:40:00Z', '2026-02-11T11:40:00Z'),
    ('pedido-venda', 1, 'pedido_venda', 2002, 'Pedido PV-2002 - Casa Aurora', 'gerando', '{"cliente":"Casa Aurora","itens":41,"valor_total":21900.00}', NULL, NULL, NULL, '2026-02-11T12:00:00Z', '2026-02-11T12:00:00Z'),
    ('fatura-cobranca', 1, 'conta_receber', 3002, 'Fatura FAT-3002 - Boutique Lótus', 'assinado', '{"cliente":"Boutique Lótus","valor_total":24890.00,"vencimento":"2026-03-15"}', NULL, '2026-02-12T08:30:00Z', '2026-02-12T08:36:00Z', '2026-02-12T08:20:00Z', '2026-02-12T08:36:00Z'),
    ('contrato-representacao', 1, 'contato', 6001, 'Contrato CR-6001 - Representante Campinas', 'assinado', '{"representante":"Marina Lopes","comissao":0.08}', NULL, '2026-02-13T16:00:00Z', '2026-02-13T16:12:00Z', '2026-02-13T15:45:00Z', '2026-02-13T16:12:00Z'),
    ('pedido-compra', 1, 'pedido_compra', 4002, 'Pedido Compra PC-4002 - Gem Parts', 'gerado', '{"fornecedor":"Gem Parts","valor_total":22340.00,"itens":18}', NULL, '2026-02-15T10:15:00Z', NULL, '2026-02-15T10:00:00Z', '2026-02-15T10:15:00Z'),
    ('proposta-comercial', 2, 'oportunidade', 1010, 'Proposta OP-1010 - Aura Atacado', 'enviado', '{"cliente":"Aura Atacado","valor_total":48200.00,"desconto":0.04}', NULL, '2026-03-10T16:20:00Z', '2026-03-10T16:32:00Z', '2026-03-10T16:05:00Z', '2026-03-10T16:32:00Z'),
    ('proposta-comercial', 2, 'oportunidade', 1011, 'Proposta OP-1011 - Top Shine', 'enviado', '{"cliente":"Top Shine","valor_total":29540.00}', NULL, '2026-03-11T09:10:00Z', '2026-03-11T09:18:00Z', '2026-03-11T09:00:00Z', '2026-03-11T09:18:00Z'),
    ('pedido-venda', 1, 'pedido_venda', 2010, 'Pedido PV-2010 - Aura Atacado', 'gerado', '{"cliente":"Aura Atacado","itens":92,"valor_total":48200.00}', NULL, '2026-03-11T10:30:00Z', NULL, '2026-03-11T10:20:00Z', '2026-03-11T10:30:00Z'),
    ('fatura-cobranca', 2, 'conta_receber', 3010, 'Fatura FAT-3010 - Aura Atacado', 'enviado', '{"cliente":"Aura Atacado","valor_total":48200.00,"vencimento":"2026-04-10"}', NULL, '2026-03-11T11:40:00Z', '2026-03-11T11:49:00Z', '2026-03-11T11:30:00Z', '2026-03-11T11:49:00Z'),
    ('ordem-servico', 2, 'ordem_servico', 5010, 'OS-5010 - Ajuste de lote premium', 'gerado', '{"cliente":"Top Shine","descricao":"Troca de fecho em lote premium"}', NULL, '2026-03-12T14:22:00Z', NULL, '2026-03-12T14:15:00Z', '2026-03-12T14:22:00Z'),
    ('nfse-servico', 1, 'ordem_servico', 5010, 'NFS-e 5010 - Ajuste lote premium', 'enviado', '{"tomador":"Top Shine","valor_total":1220.00}', NULL, '2026-03-12T15:05:00Z', '2026-03-12T15:09:00Z', '2026-03-12T15:00:00Z', '2026-03-12T15:09:00Z'),
    ('fatura-cobranca', 2, 'conta_receber', 3011, 'Fatura FAT-3011 - Top Shine', 'cancelado', '{"cliente":"Top Shine","valor_total":29540.00,"motivo":"renegociação"}', NULL, '2026-03-13T09:30:00Z', NULL, '2026-03-13T09:20:00Z', '2026-03-13T09:30:00Z'),
    ('contrato-representacao', 1, 'contato', 6002, 'Contrato CR-6002 - Representante Litoral', 'enviado', '{"representante":"Carlos Mota","comissao":0.07}', NULL, '2026-03-13T13:30:00Z', '2026-03-13T13:45:00Z', '2026-03-13T13:15:00Z', '2026-03-13T13:45:00Z'),
    ('pedido-compra', 1, 'pedido_compra', 4010, 'Pedido Compra PC-4010 - SilverTech', 'enviado', '{"fornecedor":"SilverTech","valor_total":34110.00,"itens":26}', NULL, '2026-03-14T09:25:00Z', '2026-03-14T09:40:00Z', '2026-03-14T09:10:00Z', '2026-03-14T09:40:00Z'),
    ('proposta-comercial', 2, 'oportunidade', 1012, 'Proposta OP-1012 - Magnólia Store', 'assinado', '{"cliente":"Magnólia Store","valor_total":27680.00,"condicao":"21 dias"}', NULL, '2026-03-15T10:50:00Z', '2026-03-15T11:05:00Z', '2026-03-15T10:40:00Z', '2026-03-15T11:05:00Z'),
    ('fatura-cobranca', 2, 'conta_receber', 3012, 'Fatura FAT-3012 - Magnólia Store', 'enviado', '{"cliente":"Magnólia Store","valor_total":27680.00,"vencimento":"2026-04-12"}', NULL, '2026-03-15T11:40:00Z', '2026-03-15T11:46:00Z', '2026-03-15T11:30:00Z', '2026-03-15T11:46:00Z'),
    ('pedido-venda', 1, 'pedido_venda', 2011, 'Pedido PV-2011 - Magnólia Store', 'gerado', '{"cliente":"Magnólia Store","itens":47,"valor_total":27680.00}', NULL, '2026-03-15T12:15:00Z', NULL, '2026-03-15T12:05:00Z', '2026-03-15T12:15:00Z')
) AS d(codigo, versao, origem_tipo, origem_id, titulo, status, payload_json, erro_texto, gerado_em, enviado_em, criado_em, atualizado_em)
JOIN tv_map tv
  ON tv.codigo = d.codigo
 AND tv.versao = d.versao;

COMMIT;
