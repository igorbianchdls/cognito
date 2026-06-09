CREATE SCHEMA IF NOT EXISTS crm;

TRUNCATE TABLE
  crm.interacoes,
  crm.atividades,
  crm.leads,
  crm.oportunidades,
  crm.contatos,
  crm.contas,
  crm.motivos_perda,
  crm.origens_lead,
  crm.fases_pipeline,
  crm.pipelines
RESTART IDENTITY CASCADE;

INSERT INTO crm.pipelines (tenant_id, nome, descricao, ativo, criado_em, atualizado_em)
VALUES
  (1, 'Pipeline Enterprise', 'Contas grandes e ciclo consultivo', true, '2026-01-01 09:00:00', '2026-01-01 09:00:00'),
  (1, 'Pipeline Inside Sales', 'Ciclo curto e medio ticket', true, '2026-01-01 09:00:00', '2026-01-01 09:00:00'),
  (1, 'Pipeline Expansao', 'Upsell, renovacao e ampliacao de escopo', true, '2026-01-01 09:00:00', '2026-01-01 09:00:00');

WITH pipeline_ids AS (
  SELECT id, nome FROM crm.pipelines WHERE tenant_id = 1
),
fase_seed AS (
  SELECT * FROM (VALUES
    ('Pipeline Enterprise', 'Mapeamento', 1, 10),
    ('Pipeline Enterprise', 'Diagnostico', 2, 25),
    ('Pipeline Enterprise', 'Business Case', 3, 45),
    ('Pipeline Enterprise', 'Proposta Enviada', 4, 60),
    ('Pipeline Enterprise', 'Negociacao', 5, 78),
    ('Pipeline Enterprise', 'Fechado', 6, 100),
    ('Pipeline Inside Sales', 'Novo SQL', 1, 15),
    ('Pipeline Inside Sales', 'Apresentacao', 2, 35),
    ('Pipeline Inside Sales', 'Proposta', 3, 58),
    ('Pipeline Inside Sales', 'Fechamento', 4, 88),
    ('Pipeline Expansao', 'Identificacao', 1, 20),
    ('Pipeline Expansao', 'Validacao de Escopo', 2, 45),
    ('Pipeline Expansao', 'Renovacao/Upgrade', 3, 75),
    ('Pipeline Expansao', 'Renovado', 4, 100)
  ) AS f(pipeline_nome, nome, ordem, probabilidade_padrao)
)
INSERT INTO crm.fases_pipeline (tenant_id, pipeline_id, nome, ordem, probabilidade_padrao, ativo, criado_em, atualizado_em)
SELECT 1, p.id, f.nome, f.ordem, f.probabilidade_padrao, true, '2026-01-01 09:00:00', '2026-01-01 09:00:00'
FROM fase_seed f
JOIN pipeline_ids p ON p.nome = f.pipeline_nome;

INSERT INTO crm.origens_lead (tenant_id, nome, descricao, ativo, criado_em, atualizado_em)
SELECT 1, nome, NULL, true, '2026-01-01 09:00:00', '2026-01-01 09:00:00'
FROM (VALUES
  ('Google Ads'),
  ('Meta Ads'),
  ('LinkedIn Ads'),
  ('Organico (SEO)'),
  ('Indicacao'),
  ('WhatsApp'),
  ('Evento'),
  ('Outbound'),
  ('Parceiro'),
  ('Email'),
  ('Site (form)'),
  ('Reativacao'),
  ('Webinar'),
  ('Base antiga')
) AS origem(nome);

INSERT INTO crm.motivos_perda (tenant_id, nome, descricao, ativo, criado_em, atualizado_em)
SELECT 1, nome, NULL, true, '2026-01-01 09:00:00', '2026-01-01 09:00:00'
FROM (VALUES
  ('Preco'),
  ('Sem orcamento'),
  ('Timing'),
  ('Concorrente'),
  ('Sem fit'),
  ('Decisor indisponivel'),
  ('Sem retorno'),
  ('Prioridade mudou'),
  ('Contrato vigente'),
  ('Projeto cancelado')
) AS motivo(nome);

WITH vendedores AS (
  SELECT
    v.id,
    row_number() OVER (ORDER BY v.id) AS rn
  FROM comercial.vendedores v
  WHERE v.tenant_id = 1 AND COALESCE(v.ativo, true) = true
  ORDER BY v.id
  LIMIT 8
),
conta_seed AS (
  SELECT
    gs AS n,
    (ARRAY['Alfa','Atlas','Horizonte','Norte','Sul','Prime','Omega','Nova','Sigma','Ponto','Verde','Atria'])[(gs % 12) + 1] AS n1,
    (ARRAY['Servicos','Manutencao','Facilities','Engenharia','Tecnologia','Consultoria','Operacoes','Industrial','Predial','Logistica'])[(gs % 10) + 1] AS n2,
    (ARRAY['SP','RJ','MG','PR','SC','RS','BA','PE','CE','GO','DF','ES'])[(gs % 12) + 1] AS uf,
    (ARRAY['Sao Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Florianopolis','Porto Alegre','Salvador','Recife','Fortaleza','Goiania','Brasilia','Vitoria'])[(gs % 12) + 1] AS cidade,
    (ARRAY['11','21','31','41','48','51','71','81','85','62','61','27'])[(gs % 12) + 1] AS ddd,
    (ARRAY['Industria','Logistica','Construcao','Saude','Educacao','Varejo','Servicos','Tecnologia','Energia'])[(gs % 9) + 1] AS setor,
    (ARRAY['SMB','Middle Market','Enterprise','Expansion'])[(gs % 4) + 1] AS segmento,
    (ARRAY['LTDA','ME','S/A','EIRELI'])[(gs % 4) + 1] AS tipo,
    (DATE '2026-01-01' + ((gs * 5) % 170) * INTERVAL '1 day' + TIME '09:00')::timestamp AS criado_em,
    ((gs - 1) % (SELECT COUNT(*) FROM vendedores)) + 1 AS vendedor_rn
  FROM generate_series(1, 240) gs
)
INSERT INTO crm.contas (tenant_id, nome, setor, site, telefone, endereco_cobranca, responsavel_id, criado_em, atualizado_em)
SELECT
  1,
  CONCAT(n1, ' ', n2, ' ', uf, ' ', tipo),
  CONCAT(setor, ' - ', segmento),
  CASE WHEN n % 10 = 0 THEN NULL ELSE CONCAT('https://www.', lower(n1), lower(n2), n::text, '.com.br') END,
  CASE WHEN n % 17 = 0 THEN NULL ELSE CONCAT('(', ddd, ') 9', lpad(((7000 + n * 37) % 10000)::text, 4, '0'), '-', lpad(((1000 + n * 53) % 10000)::text, 4, '0')) END,
  CONCAT(cidade, '/', uf, ' - ', (ARRAY['Centro','Industrial','Jardins','Zona Sul','Zona Norte'])[(n % 5) + 1], ', ', (ARRAY['Rua','Av.'])[(n % 2) + 1], ' ', (ARRAY['Brasil','Paulista','das Nacoes','Independencia'])[(n % 4) + 1], ' ', 40 + n * 7),
  v.id,
  criado_em,
  criado_em
FROM conta_seed s
JOIN vendedores v ON v.rn = s.vendedor_rn;

WITH contas AS (
  SELECT
    c.*,
    row_number() OVER (ORDER BY c.id) AS rn
  FROM crm.contas c
  WHERE c.tenant_id = 1
),
contato_seed AS (
  SELECT
    c.id AS conta_id,
    c.responsavel_id,
    c.criado_em,
    c.rn,
    contact_n
  FROM contas c
  CROSS JOIN LATERAL generate_series(1, 2 + (c.rn % 3)) contact_n
)
INSERT INTO crm.contatos (tenant_id, conta_id, nome, cargo, email, telefone, responsavel_id, criado_em, atualizado_em)
SELECT
  1,
  conta_id,
  CONCAT((ARRAY['Joao','Maria','Ana','Carlos','Fernanda','Marcos','Patricia','Camila','Rafael','Juliana','Bruno','Leticia','Felipe','Mariana','Diego','Renata','Paulo','Beatriz','Rodrigo','Aline'])[((rn + contact_n) % 20) + 1], ' ', (ARRAY['Silva','Souza','Oliveira','Santos','Pereira','Almeida','Costa','Rodrigues','Ferreira','Gomes','Ribeiro','Carvalho','Araujo','Moura','Barbosa','Lima','Cardoso','Teixeira','Vieira','Batista'])[((rn * contact_n) % 20) + 1]),
  (ARRAY['Diretor','Gerente de Operacoes','Compras','Financeiro','TI','RH','Coordenador','Supervisor','Head de Facilities'])[((rn + contact_n) % 9) + 1],
  CASE WHEN (rn + contact_n) % 14 = 0 THEN NULL ELSE CONCAT('contato', rn, '.', contact_n, '@empresa', conta_id, '.com.br') END,
  CASE WHEN (rn + contact_n) % 23 = 0 THEN NULL ELSE CONCAT('(11) 9', lpad(((7000 + rn * 31 + contact_n) % 10000)::text, 4, '0'), '-', lpad(((1000 + rn * 47 + contact_n) % 10000)::text, 4, '0')) END,
  responsavel_id,
  criado_em + (contact_n || ' days')::interval,
  criado_em + (contact_n || ' days')::interval
FROM contato_seed;

WITH vendedores AS (
  SELECT v.id, row_number() OVER (ORDER BY v.id) AS rn
  FROM comercial.vendedores v
  WHERE v.tenant_id = 1 AND COALESCE(v.ativo, true) = true
  ORDER BY v.id
  LIMIT 8
),
origens AS (
  SELECT id, nome, row_number() OVER (ORDER BY id) AS rn FROM crm.origens_lead WHERE tenant_id = 1
),
contas AS (
  SELECT id, nome, row_number() OVER (ORDER BY id) AS rn FROM crm.contas WHERE tenant_id = 1
),
lead_seed AS (
  SELECT
    gs AS n,
    (DATE '2026-01-01' + ((gs * 11) % 181) * INTERVAL '1 day' + TIME '10:00')::timestamp AS criado_em,
    ((gs - 1) % (SELECT COUNT(*) FROM vendedores)) + 1 AS vendedor_rn,
    ((gs - 1) % (SELECT COUNT(*) FROM origens)) + 1 AS origem_rn,
    ((gs - 1) % (SELECT COUNT(*) FROM contas)) + 1 AS conta_rn
  FROM generate_series(1, 900) gs
)
INSERT INTO crm.leads (tenant_id, nome, empresa, email, telefone, origem_id, responsavel_id, status, tag, descricao, criado_em, atualizado_em)
SELECT
  1,
  CONCAT((ARRAY['Joao','Maria','Ana','Carlos','Fernanda','Marcos','Patricia','Camila','Rafael','Juliana','Bruno','Leticia','Felipe','Mariana','Diego','Renata','Paulo','Beatriz','Rodrigo','Aline'])[(n % 20) + 1], ' ', (ARRAY['Silva','Souza','Oliveira','Santos','Pereira','Almeida','Costa','Rodrigues','Ferreira','Gomes','Ribeiro','Carvalho','Araujo','Moura','Barbosa','Lima','Cardoso','Teixeira','Vieira','Batista'])[((n * 3) % 20) + 1]),
  CASE WHEN n % 5 = 0 THEN CONCAT('Prospect ', n, ' ', (ARRAY['SP','RJ','MG','PR','SC','RS','BA','PE','CE','GO','DF','ES'])[(n % 12) + 1]) ELSE c.nome END,
  CASE WHEN n % 25 = 0 THEN NULL ELSE CONCAT('lead', n, '@prospect', n, '.com.br') END,
  CASE WHEN n % 33 = 0 THEN NULL ELSE CONCAT('(11) 9', lpad(((5000 + n * 13) % 10000)::text, 4, '0'), '-', lpad(((1000 + n * 29) % 10000)::text, 4, '0')) END,
  CASE WHEN n % 29 = 0 THEN NULL ELSE o.id END,
  v.id,
  CASE
    WHEN n % 100 < 37 THEN 'novo'
    WHEN n % 100 < 78 THEN 'qualificado'
    WHEN n % 100 < 92 THEN 'descartado'
    ELSE 'nutricao'
  END,
  CASE WHEN n % 3 = 0 THEN (ARRAY['alto_potencial','urgente','multiunidades','sem_orcamento','concorrencia','renovacao','baixo_fit'])[(n % 7) + 1] ELSE NULL END,
  (ARRAY[
    'Solicitou proposta e quer comparar fornecedores.',
    'Indicacao com interesse em contrato recorrente.',
    'Cliente quer reduzir custo operacional e melhorar SLA.',
    'Avaliando troca de fornecedor por baixa qualidade.',
    'Precisa de implantacao em multiplas unidades.',
    'Contato frio; ainda sem decisor mapeado.'
  ])[(n % 6) + 1],
  criado_em,
  criado_em
FROM lead_seed s
JOIN vendedores v ON v.rn = s.vendedor_rn
JOIN origens o ON o.rn = s.origem_rn
JOIN contas c ON c.rn = s.conta_rn;

WITH selected_leads AS (
  SELECT
    l.*,
    row_number() OVER (ORDER BY l.criado_em, l.id) AS rn
  FROM crm.leads l
  WHERE l.tenant_id = 1 AND l.status = 'qualificado'
  ORDER BY l.criado_em, l.id
  LIMIT 320
),
contas AS (
  SELECT id, nome, row_number() OVER (ORDER BY id) AS rn FROM crm.contas WHERE tenant_id = 1
),
fases AS (
  SELECT id, nome, probabilidade_padrao, row_number() OVER (ORDER BY id) AS rn FROM crm.fases_pipeline WHERE tenant_id = 1
),
motivos AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn FROM crm.motivos_perda WHERE tenant_id = 1
),
clientes AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn FROM entidades.clientes WHERE tenant_id = 1
),
opp_seed AS (
  SELECT
    l.id AS lead_id,
    l.responsavel_id,
    l.rn,
    c.id AS conta_id,
    c.nome AS conta_nome,
    f.id AS fase_id,
    f.nome AS fase_nome,
    f.probabilidade_padrao,
    m.id AS motivo_id,
    cli.id AS cliente_id,
    (l.criado_em + ((l.rn % 22) + 2) * INTERVAL '1 day')::timestamp AS criado_oportunidade
  FROM selected_leads l
  JOIN contas c ON c.rn = ((l.rn - 1) % (SELECT COUNT(*) FROM contas)) + 1
  JOIN fases f ON f.rn = ((l.rn - 1) % (SELECT COUNT(*) FROM fases)) + 1
  LEFT JOIN motivos m ON m.rn = ((l.rn - 1) % (SELECT COUNT(*) FROM motivos)) + 1
  LEFT JOIN clientes cli ON cli.rn = ((l.rn - 1) % NULLIF((SELECT COUNT(*) FROM clientes), 0)) + 1
)
INSERT INTO crm.oportunidades
  (tenant_id, nome, lead_id, conta_id, cliente_id, vendedor_id, territorio_id, fase_pipeline_id, valor_estimado, probabilidade, data_prevista, data_fechamento, status, motivo_perda_id, descricao, criado_em, atualizado_em)
SELECT
  1,
  CONCAT('Contrato - ', opp_seed.conta_nome, ' (', opp_seed.fase_nome, ')'),
  opp_seed.lead_id,
  opp_seed.conta_id,
  CASE WHEN opp_seed.rn % 10 IN (0, 1) THEN opp_seed.cliente_id ELSE NULL END,
  opp_seed.responsavel_id,
  NULL,
  opp_seed.fase_id,
  (6000 + ((opp_seed.rn * 7919) % 240000))::numeric,
  CASE
    WHEN opp_seed.rn % 10 IN (0, 1) THEN 100
    WHEN opp_seed.rn % 10 IN (2, 3, 4) THEN GREATEST(5, LEAST(80, opp_seed.probabilidade_padrao - 12 + (opp_seed.rn % 19)))
    ELSE GREATEST(5, LEAST(95, opp_seed.probabilidade_padrao - 10 + (opp_seed.rn % 23)))
  END,
  (opp_seed.criado_oportunidade::date + ((opp_seed.rn % 55) + 12)::int)::date,
  CASE WHEN opp_seed.rn % 10 IN (0, 1, 2, 3, 4) THEN (opp_seed.criado_oportunidade::date + ((opp_seed.rn % 45) + 8)::int)::date ELSE NULL END,
  CASE WHEN opp_seed.rn % 10 IN (0, 1) THEN 'ganha' WHEN opp_seed.rn % 10 IN (2, 3, 4) THEN 'perdido' ELSE 'aberta' END,
  CASE WHEN opp_seed.rn % 10 IN (2, 3, 4) AND opp_seed.rn % 13 <> 0 THEN opp_seed.motivo_id ELSE NULL END,
  (ARRAY[
    'Escopo com SLA mensal e implantacao assistida.',
    'Projeto consultivo com validacao tecnica e contrato recorrente.',
    'Cliente avaliando fornecedores para reduzir falhas operacionais.',
    'Contrato com multiplas unidades e onboarding faseado.'
  ])[(opp_seed.rn % 4) + 1],
  opp_seed.criado_oportunidade,
  opp_seed.criado_oportunidade
FROM opp_seed;

WITH contas AS (
  SELECT c.*, row_number() OVER (ORDER BY c.id) AS rn FROM crm.contas c WHERE c.tenant_id = 1
),
fases AS (
  SELECT id, nome, probabilidade_padrao, row_number() OVER (ORDER BY id) AS rn FROM crm.fases_pipeline WHERE tenant_id = 1 AND nome IN ('Identificacao', 'Validacao de Escopo', 'Renovacao/Upgrade', 'Renovado')
),
motivos AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn FROM crm.motivos_perda WHERE tenant_id = 1
),
clientes AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn FROM entidades.clientes WHERE tenant_id = 1
),
extra_seed AS (
  SELECT
    gs AS n,
    c.id AS conta_id,
    c.nome AS conta_nome,
    c.responsavel_id,
    f.id AS fase_id,
    f.nome AS fase_nome,
    f.probabilidade_padrao,
    m.id AS motivo_id,
    cli.id AS cliente_id,
    (DATE '2026-01-01' + ((gs * 13) % 181) * INTERVAL '1 day' + TIME '11:00')::timestamp AS criado_em
  FROM generate_series(1, 190) gs
  JOIN contas c ON c.rn = ((gs - 1) % (SELECT COUNT(*) FROM contas)) + 1
  JOIN fases f ON f.rn = ((gs - 1) % (SELECT COUNT(*) FROM fases)) + 1
  LEFT JOIN motivos m ON m.rn = ((gs - 1) % (SELECT COUNT(*) FROM motivos)) + 1
  LEFT JOIN clientes cli ON cli.rn = ((gs - 1) % NULLIF((SELECT COUNT(*) FROM clientes), 0)) + 1
)
INSERT INTO crm.oportunidades
  (tenant_id, nome, lead_id, conta_id, cliente_id, vendedor_id, territorio_id, fase_pipeline_id, valor_estimado, probabilidade, data_prevista, data_fechamento, status, motivo_perda_id, descricao, criado_em, atualizado_em)
SELECT
  1,
  CONCAT('Expansao - ', extra_seed.conta_nome, ' (', extra_seed.fase_nome, ')'),
  NULL,
  extra_seed.conta_id,
  CASE WHEN extra_seed.n % 10 IN (0, 1, 2) THEN extra_seed.cliente_id ELSE NULL END,
  extra_seed.responsavel_id,
  NULL,
  extra_seed.fase_id,
  (9000 + ((extra_seed.n * 10457) % 320000))::numeric,
  CASE
    WHEN extra_seed.n % 10 IN (0, 1, 2) THEN 100
    WHEN extra_seed.n % 10 IN (3, 4) THEN GREATEST(5, LEAST(80, extra_seed.probabilidade_padrao - 16 + (extra_seed.n % 15)))
    ELSE GREATEST(5, LEAST(95, extra_seed.probabilidade_padrao - 8 + (extra_seed.n % 18)))
  END,
  (extra_seed.criado_em::date + ((extra_seed.n % 50) + 10)::int)::date,
  CASE WHEN extra_seed.n % 10 IN (0, 1, 2, 3, 4) THEN (extra_seed.criado_em::date + ((extra_seed.n % 40) + 9)::int)::date ELSE NULL END,
  CASE WHEN extra_seed.n % 10 IN (0, 1, 2) THEN 'ganha' WHEN extra_seed.n % 10 IN (3, 4) THEN 'perdido' ELSE 'aberta' END,
  CASE WHEN extra_seed.n % 10 IN (3, 4) AND extra_seed.n % 11 <> 0 THEN extra_seed.motivo_id ELSE NULL END,
  (ARRAY[
    'Conta atual com oportunidade de expandir escopo.',
    'Renovacao contratual com reajuste e novos servicos.',
    'Upgrade de SLA e aumento de cobertura.',
    'Cliente quer centralizar contratos regionais.'
  ])[(extra_seed.n % 4) + 1],
  extra_seed.criado_em,
  extra_seed.criado_em
FROM extra_seed;

UPDATE crm.leads l
SET
  conta_id = o.conta_id,
  contato_id = (
    SELECT ct.id
    FROM crm.contatos ct
    WHERE ct.tenant_id = l.tenant_id AND ct.conta_id = o.conta_id
    ORDER BY ct.id
    LIMIT 1
  ),
  oportunidade_id = o.id,
  convertido_em = o.criado_em,
  atualizado_em = o.criado_em
FROM crm.oportunidades o
WHERE o.tenant_id = l.tenant_id
  AND o.lead_id = l.id
  AND l.tenant_id = 1;

WITH opps AS (
  SELECT
    o.*,
    row_number() OVER (ORDER BY o.id) AS rn
  FROM crm.oportunidades o
  WHERE o.tenant_id = 1
),
activity_seed AS (
  SELECT
    o.*,
    s.n AS seq,
    (o.criado_em + ((s.n * 7 + o.rn) % 95) * INTERVAL '1 day')::timestamp AS data_prevista_calc
  FROM opps o
  CROSS JOIN LATERAL generate_series(1, 4 + (o.rn % 4)) s(n)
)
INSERT INTO crm.atividades
  (tenant_id, conta_id, contato_id, lead_id, oportunidade_id, tipo, descricao, data_prevista, data_conclusao, status, responsavel_id, assunto, anotacoes, criado_em, atualizado_em)
SELECT
  1,
  activity_seed.conta_id,
  (
    SELECT ct.id
    FROM crm.contatos ct
    WHERE ct.tenant_id = 1 AND ct.conta_id = activity_seed.conta_id
    ORDER BY ct.id
    LIMIT 1
  ),
  activity_seed.lead_id,
  activity_seed.id,
  (ARRAY['ligacao','reuniao','email','followup','visita','tarefa'])[((rn + seq) % 6) + 1],
  (ARRAY[
    'Alinhar escopo e SLA',
    'Reuniao de diagnostico',
    'Follow-up da proposta',
    'Coletar dados tecnicos',
    'Negociar condicoes comerciais',
    'Validar decisor e processo de compras',
    'Apresentacao institucional',
    'Revisar cronograma e inicio',
    'Recuperar oportunidade parada'
  ])[((rn + seq) % 9) + 1],
  LEAST(data_prevista_calc, TIMESTAMP '2026-06-30 18:00:00'),
  CASE WHEN (rn + seq) % 10 < 6 THEN LEAST(data_prevista_calc + ((seq % 4) * INTERVAL '1 day'), TIMESTAMP '2026-06-30 18:00:00') ELSE NULL END,
  CASE WHEN (rn + seq) % 10 < 6 THEN 'concluida' ELSE 'pendente' END,
  activity_seed.vendedor_id,
  (ARRAY[
    'Alinhar escopo e SLA',
    'Reuniao de diagnostico',
    'Follow-up da proposta',
    'Coletar dados tecnicos',
    'Negociar condicoes comerciais',
    'Validar decisor e processo de compras',
    'Apresentacao institucional',
    'Revisar cronograma e inicio',
    'Recuperar oportunidade parada'
  ])[((rn + seq) % 9) + 1],
  CASE WHEN (rn + seq) % 3 = 0 THEN (ARRAY[
    'Cliente pediu ajuste de escopo.',
    'Aguardando retorno do decisor.',
    'Enviar proposta revisada ainda hoje.',
    'Mapear concorrentes e contrato atual.',
    'Confirmar visita tecnica.',
    'Risco de perda por timing.'
  ])[((rn + seq) % 6) + 1] ELSE NULL END,
  GREATEST(activity_seed.criado_em, LEAST(data_prevista_calc - INTERVAL '2 days', TIMESTAMP '2026-06-30 18:00:00')),
  GREATEST(activity_seed.criado_em, LEAST(data_prevista_calc - INTERVAL '2 days', TIMESTAMP '2026-06-30 18:00:00'))
FROM activity_seed;

WITH opps AS (
  SELECT
    o.*,
    row_number() OVER (ORDER BY o.id) AS rn
  FROM crm.oportunidades o
  WHERE o.tenant_id = 1
),
interaction_seed AS (
  SELECT
    o.*,
    s.n AS seq,
    (o.criado_em + ((s.n * 5 + o.rn) % 105) * INTERVAL '1 day')::timestamp AS data_interacao_calc
  FROM opps o
  CROSS JOIN LATERAL generate_series(1, 7 + (o.rn % 4)) s(n)
)
INSERT INTO crm.interacoes
  (tenant_id, conta_id, contato_id, lead_id, oportunidade_id, canal, conteudo, data_interacao, responsavel_id, criado_em, atualizado_em)
SELECT
  1,
  interaction_seed.conta_id,
  (
    SELECT ct.id
    FROM crm.contatos ct
    WHERE ct.tenant_id = 1 AND ct.conta_id = interaction_seed.conta_id
    ORDER BY ct.id
    LIMIT 1
  ),
  interaction_seed.lead_id,
  interaction_seed.id,
  (ARRAY['email','ligacao','nota','reuniao','whatsapp','visita'])[((rn + seq) % 6) + 1],
  (ARRAY[
    'Enviado resumo do escopo e proximos passos.',
    'Cliente confirmou reuniao para alinhamento.',
    'Sem retorno. Reforcar contato amanha.',
    'Proposta enviada. Aguardando feedback do financeiro.',
    'Solicitou ajuste de prazo e forma de pagamento.',
    'Concorrente entrou com desconto. Reavaliar condicoes.',
    'Decisor pediu case e referencias.',
    'Agendada visita tecnica.',
    'Cliente pediu minuta de contrato.',
    'Negociacao em andamento. Retornar com contraproposta.'
  ])[((rn + seq) % 10) + 1],
  LEAST(data_interacao_calc, TIMESTAMP '2026-06-30 18:00:00'),
  interaction_seed.vendedor_id,
  LEAST(data_interacao_calc, TIMESTAMP '2026-06-30 18:00:00'),
  LEAST(data_interacao_calc, TIMESTAMP '2026-06-30 18:00:00')
FROM interaction_seed;

WITH totals AS (
  SELECT
    1 AS tenant_id,
    (
      (SELECT COUNT(*) FROM crm.contas WHERE tenant_id = 1) +
      (SELECT COUNT(*) FROM crm.contatos WHERE tenant_id = 1) +
      (SELECT COUNT(*) FROM crm.leads WHERE tenant_id = 1) +
      (SELECT COUNT(*) FROM crm.oportunidades WHERE tenant_id = 1) +
      (SELECT COUNT(*) FROM crm.atividades WHERE tenant_id = 1) +
      (SELECT COUNT(*) FROM crm.interacoes WHERE tenant_id = 1)
    )::int AS records_synced,
    GREATEST(
      COALESCE((SELECT MAX(atualizado_em) FROM crm.contas WHERE tenant_id = 1), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM crm.contatos WHERE tenant_id = 1), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM crm.leads WHERE tenant_id = 1), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM crm.oportunidades WHERE tenant_id = 1), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM crm.atividades WHERE tenant_id = 1), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM crm.interacoes WHERE tenant_id = 1), 'epoch'::timestamp)
    )::timestamptz AS last_sync_at
),
upsert_connector AS (
  INSERT INTO plugin.connectors
    (tenant_id, domain, provider, name, status, external_account_id, scopes_json, last_sync_at, records_synced, source_table, source_id, metadata_json, updated_at)
  SELECT
    tenant_id,
    'crm',
    'crm',
    'CRM Operacional',
    'connected',
    'operacional',
    '[]'::jsonb,
    last_sync_at,
    records_synced,
    'operacional',
    'operacional',
    jsonb_build_object('source', 'operational_data', 'seed', 'crm_seed_b2b_2026h1', 'includes_interacoes', true),
    now()
  FROM totals
  ON CONFLICT (tenant_id, domain, provider, external_account_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    last_sync_at = EXCLUDED.last_sync_at,
    records_synced = EXCLUDED.records_synced,
    metadata_json = EXCLUDED.metadata_json,
    updated_at = now()
  RETURNING id, tenant_id, last_sync_at, records_synced
)
INSERT INTO plugin.connector_sync_runs
  (tenant_id, connector_id, status, started_at, finished_at, records_in, records_updated, records_failed, metadata_json)
SELECT
  tenant_id,
  id,
  'success',
  last_sync_at,
  last_sync_at,
  records_synced,
  records_synced,
  0,
  jsonb_build_object('seed', 'crm_seed_b2b_2026h1', 'backfill', true)
FROM upsert_connector;

DO $$
DECLARE
  v_leads integer;
  v_opps integer;
  v_won integer;
  v_lost integer;
  v_activities integer;
  v_interactions integer;
BEGIN
  SELECT COUNT(*) INTO v_leads FROM crm.leads WHERE tenant_id = 1;
  SELECT COUNT(*) INTO v_opps FROM crm.oportunidades WHERE tenant_id = 1;
  SELECT COUNT(*) INTO v_won FROM crm.oportunidades WHERE tenant_id = 1 AND status = 'ganha';
  SELECT COUNT(*) INTO v_lost FROM crm.oportunidades WHERE tenant_id = 1 AND status = 'perdido';
  SELECT COUNT(*) INTO v_activities FROM crm.atividades WHERE tenant_id = 1;
  SELECT COUNT(*) INTO v_interactions FROM crm.interacoes WHERE tenant_id = 1;

  IF v_leads < 850 OR v_opps < 450 OR v_won < 80 OR v_lost < 120 OR v_activities < 2500 OR v_interactions < 3800 THEN
    RAISE EXCEPTION 'CRM seed H1 insuficiente: leads %, opps %, won %, lost %, activities %, interactions %',
      v_leads, v_opps, v_won, v_lost, v_activities, v_interactions;
  END IF;
END $$;
