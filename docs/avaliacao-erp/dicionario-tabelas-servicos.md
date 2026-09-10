# Dicionário das tabelas avaliadas

Fonte: consulta de metadados de 2026-09-08T14:52:13.596Z.

50 tabelas fora dos módulos fiscal e estoque. Produtos e fornecedores de produtos constam apenas como cadastros referenciados. Campos e vínculos de fiscal/estoque das tabelas compartilhadas são omitidos abaixo; o catálogo bruto preserva os metadados completos para rastreabilidade.

Este arquivo descreve a estrutura existente. As recomendações estão em [Avaliação completa](avaliacao-tabelas-servicos.md).

## erp.arquivos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| bucket | text | Não | — |
| caminho | text | Não | — |
| nome | text | Não | — |
| mime_type | text | Sim | — |
| tamanho_bytes | int8 | Sim | — |
| hash_sha256 | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
arquivos_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
arquivos_caminho_chk: CHECK (((btrim(bucket) <> ''::text) AND (btrim(caminho) <> ''::text) AND (btrim(nome) <> ''::text)))
arquivos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
arquivos_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
arquivos_pkey: PRIMARY KEY (id)
arquivos_tamanho_chk: CHECK (((tamanho_bytes IS NULL) OR (tamanho_bytes >= 0)))
arquivos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
arquivos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX arquivos_caminho_unico_idx ON erp.arquivos USING btree (tenant_id, bucket, caminho) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX arquivos_pkey ON erp.arquivos USING btree (id)
CREATE UNIQUE INDEX arquivos_tenant_id_id_key ON erp.arquivos USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.arquivos FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text)
```

## erp.cadastros_eventos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| entidade_tipo | text | Não | — |
| entidade_id | int8 | Não | — |
| evento | text | Não | — |
| versao | int4 | Não | — |
| dados | jsonb | Não | '{}'::jsonb |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
cadastros_eventos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
cadastros_eventos_dados_object_chk: CHECK ((jsonb_typeof(dados) = 'object'::text))
cadastros_eventos_pkey: PRIMARY KEY (id)
cadastros_eventos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
cadastros_eventos_tenant_id_id_key: UNIQUE (tenant_id, id)
cadastros_eventos_tipo_chk: CHECK ((entidade_tipo = ANY (ARRAY['entidade'::text, 'categoria'::text, 'produto'::text, 'servico'::text, 'conta_financeira'::text])))
cadastros_eventos_versao_chk: CHECK ((versao > 0))
```

Índices:

```sql
CREATE INDEX cadastros_eventos_entidade_idx ON erp.cadastros_eventos USING btree (tenant_id, entidade_tipo, entidade_id, criado_em DESC)
CREATE UNIQUE INDEX cadastros_eventos_pkey ON erp.cadastros_eventos USING btree (id)
CREATE UNIQUE INDEX cadastros_eventos_tenant_id_id_key ON erp.cadastros_eventos USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER bloquear_mutacao_evento BEFORE DELETE OR UPDATE ON erp.cadastros_eventos FOR EACH ROW EXECUTE FUNCTION erp.bloquear_mutacao_evento()
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
```

## erp.categorias

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| nome | text | Não | — |
| codigo | text | Sim | — |
| tipo | text | Não | 'geral'::text |
| categoria_pai_id | int8 | Sim | — |
| entrada_dre | bool | Não | false |
| considera_custo_dre | bool | Não | false |
| ativo | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| versao | int4 | Não | 1 |

Restrições e relacionamentos:

```sql
categorias_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
categorias_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
categorias_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
categorias_pai_fk: FOREIGN KEY (tenant_id, categoria_pai_id) REFERENCES erp.categorias(tenant_id, id) ON DELETE RESTRICT
categorias_pkey: PRIMARY KEY (id)
categorias_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
categorias_tenant_id_id_key: UNIQUE (tenant_id, id)
categorias_tipo_chk: CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text, 'produto'::text, 'servico'::text, 'geral'::text])))
categorias_versao_chk: CHECK ((versao > 0))
```

Índices:

```sql
CREATE UNIQUE INDEX categorias_codigo_unico_idx ON erp.categorias USING btree (tenant_id, codigo) WHERE ((codigo IS NOT NULL) AND (codigo <> ''::text) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX categorias_pkey ON erp.categorias USING btree (id)
CREATE UNIQUE INDEX categorias_tenant_id_id_key ON erp.categorias USING btree (tenant_id, id)
CREATE INDEX categorias_tenant_tipo_idx ON erp.categorias USING btree (tenant_id, tipo) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.categorias FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
```

## erp.centros_custo

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| nome | text | Não | — |
| codigo | text | Sim | — |
| ativo | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
centros_custo_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
centros_custo_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
centros_custo_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
centros_custo_pkey: PRIMARY KEY (id)
centros_custo_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
centros_custo_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX centros_custo_codigo_unico_idx ON erp.centros_custo USING btree (tenant_id, codigo) WHERE ((codigo IS NOT NULL) AND (codigo <> ''::text) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX centros_custo_pkey ON erp.centros_custo USING btree (id)
CREATE UNIQUE INDEX centros_custo_tenant_id_id_key ON erp.centros_custo USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.centros_custo FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
```

## erp.cobrancas

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| conta_receber_parcela_id | int8 | Não | — |
| provedor | text | Sim | — |
| tipo | text | Não | — |
| referencia_externa | text | Sim | — |
| chave_idempotencia | text | Não | — |
| status | text | Não | 'rascunho'::text |
| valor | numeric(18,2) | Não | — |
| data_vencimento | date | Não | — |
| cobranca_emails | _text | Não | ARRAY[]::text[] |
| cobranca_whatsapp | text | Sim | — |
| configuracao_lembretes | jsonb | Não | '{}'::jsonb |
| linha_digitavel | text | Sim | — |
| codigo_barras | text | Sim | — |
| pix_copia_cola | text | Sim | — |
| qr_code_url | text | Sim | — |
| link_pagamento_url | text | Sim | — |
| payload_enviado | jsonb | Não | '{}'::jsonb |
| resposta_provedor | jsonb | Não | '{}'::jsonb |
| erro_codigo | text | Sim | — |
| erro_mensagem | text | Sim | — |
| emitida_em | timestamptz | Sim | — |
| enviada_em | timestamptz | Sim | — |
| visualizada_em | timestamptz | Sim | — |
| paga_em | timestamptz | Sim | — |
| cancelada_em | timestamptz | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
cobrancas_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
cobrancas_configuracao_lembretes_object_chk: CHECK ((jsonb_typeof(configuracao_lembretes) = 'object'::text))
cobrancas_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
cobrancas_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
cobrancas_parcela_fk: FOREIGN KEY (tenant_id, conta_receber_parcela_id) REFERENCES erp.contas_receber_parcelas(tenant_id, id) ON DELETE RESTRICT
cobrancas_payload_object_chk: CHECK ((jsonb_typeof(payload_enviado) = 'object'::text))
cobrancas_pkey: PRIMARY KEY (id)
cobrancas_resposta_object_chk: CHECK ((jsonb_typeof(resposta_provedor) = 'object'::text))
cobrancas_status_chk: CHECK ((status = ANY (ARRAY['rascunho'::text, 'pendente'::text, 'emitida'::text, 'enviada'::text, 'visualizada'::text, 'paga'::text, 'vencida'::text, 'cancelada'::text, 'falha'::text])))
cobrancas_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
cobrancas_tenant_id_id_key: UNIQUE (tenant_id, id)
cobrancas_tipo_chk: CHECK ((tipo = ANY (ARRAY['boleto'::text, 'pix'::text, 'link'::text, 'cartao'::text])))
cobrancas_valor_chk: CHECK ((valor > (0)::numeric))
```

Índices:

```sql
CREATE UNIQUE INDEX cobrancas_chave_idempotencia_unica_idx ON erp.cobrancas USING btree (tenant_id, chave_idempotencia) WHERE (excluido_em IS NULL)
CREATE INDEX cobrancas_parcela_status_idx ON erp.cobrancas USING btree (tenant_id, conta_receber_parcela_id, status) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX cobrancas_parcela_tipo_ativa_unica_idx ON erp.cobrancas USING btree (tenant_id, conta_receber_parcela_id, tipo) WHERE ((excluido_em IS NULL) AND (status <> ALL (ARRAY['cancelada'::text, 'falha'::text])))
CREATE UNIQUE INDEX cobrancas_pkey ON erp.cobrancas USING btree (id)
CREATE UNIQUE INDEX cobrancas_referencia_externa_unica_idx ON erp.cobrancas USING btree (tenant_id, provedor, referencia_externa) WHERE ((referencia_externa IS NOT NULL) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX cobrancas_tenant_id_id_key ON erp.cobrancas USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.cobrancas FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.cobrancas_eventos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| cobranca_id | int8 | Não | — |
| evento_externo_id | text | Sim | — |
| hash_evento | text | Sim | — |
| evento | text | Não | — |
| status_anterior | text | Sim | — |
| status_novo | text | Sim | — |
| payload | jsonb | Não | '{}'::jsonb |
| ocorrido_em | timestamptz | Sim | — |
| recebido_em | timestamptz | Não | now() |
| processado_em | timestamptz | Sim | — |
| erro_mensagem | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
cobrancas_eventos_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
cobrancas_eventos_cobranca_fk: FOREIGN KEY (tenant_id, cobranca_id) REFERENCES erp.cobrancas(tenant_id, id) ON DELETE CASCADE
cobrancas_eventos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
cobrancas_eventos_identificacao_chk: CHECK (((evento_externo_id IS NOT NULL) OR (hash_evento IS NOT NULL)))
cobrancas_eventos_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
cobrancas_eventos_payload_object_chk: CHECK ((jsonb_typeof(payload) = 'object'::text))
cobrancas_eventos_pkey: PRIMARY KEY (id)
cobrancas_eventos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
cobrancas_eventos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX cobrancas_eventos_externo_unico_idx ON erp.cobrancas_eventos USING btree (tenant_id, evento_externo_id) WHERE ((evento_externo_id IS NOT NULL) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX cobrancas_eventos_hash_unico_idx ON erp.cobrancas_eventos USING btree (tenant_id, hash_evento) WHERE ((hash_evento IS NOT NULL) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX cobrancas_eventos_pkey ON erp.cobrancas_eventos USING btree (id)
CREATE UNIQUE INDEX cobrancas_eventos_tenant_id_id_key ON erp.cobrancas_eventos USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER bloquear_mutacao_evento BEFORE DELETE OR UPDATE ON erp.cobrancas_eventos FOR EACH ROW EXECUTE FUNCTION erp.bloquear_mutacao_evento()
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.cobrancas_eventos FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.cobrancas_notificacoes

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| cobranca_id | int8 | Não | — |
| canal | text | Não | — |
| destinatario | text | Não | — |
| referencia_externa | text | Sim | — |
| status | text | Não | 'agendada'::text |
| agendada_em | timestamptz | Não | — |
| enviada_em | timestamptz | Sim | — |
| entregue_em | timestamptz | Sim | — |
| visualizada_em | timestamptz | Sim | — |
| erro_mensagem | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
cobrancas_notificacoes_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
cobrancas_notificacoes_canal_chk: CHECK ((canal = ANY (ARRAY['email'::text, 'sms'::text, 'whatsapp'::text])))
cobrancas_notificacoes_cobranca_fk: FOREIGN KEY (tenant_id, cobranca_id) REFERENCES erp.cobrancas(tenant_id, id) ON DELETE CASCADE
cobrancas_notificacoes_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
cobrancas_notificacoes_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
cobrancas_notificacoes_pkey: PRIMARY KEY (id)
cobrancas_notificacoes_status_chk: CHECK ((status = ANY (ARRAY['agendada'::text, 'enviando'::text, 'enviada'::text, 'entregue'::text, 'visualizada'::text, 'falha'::text, 'cancelada'::text])))
cobrancas_notificacoes_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
cobrancas_notificacoes_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE INDEX cobrancas_notificacoes_agendamento_idx ON erp.cobrancas_notificacoes USING btree (tenant_id, status, agendada_em) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX cobrancas_notificacoes_pkey ON erp.cobrancas_notificacoes USING btree (id)
CREATE UNIQUE INDEX cobrancas_notificacoes_tenant_id_id_key ON erp.cobrancas_notificacoes USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.cobrancas_notificacoes FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.compras

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| fornecedor_id | int8 | Não | — |
| numero | text | Sim | — |
| data_compra | date | Não | CURRENT_DATE |
| data_competencia | date | Sim | — |
| status | text | Não | 'rascunho'::text |
| categoria_id | int8 | Sim | — |
| centro_custo_id | int8 | Sim | — |
| conta_financeira_id | int8 | Sim | — |
| metodo_pagamento_id | int8 | Sim | — |
| subtotal | numeric(18,2) | Não | 0 |
| tipo_desconto | text | Sim | — |
| desconto | numeric(18,2) | Não | 0 |
| frete | numeric(18,2) | Não | 0 |
| total | numeric(18,2) | Não | 0 |
| condicao_pagamento | jsonb | Não | '{}'::jsonb |
| observacoes | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| gera_financeiro | bool | Não | true |
| confirmada_em | timestamptz | Sim | — |
| recebida_em | timestamptz | Sim | — |
| cancelada_em | timestamptz | Sim | — |
| tipo_compra | text | Não | 'produto'::text |
| tipo_movimento | text | Não | 'cotacao'::text |
| natureza_operacao_id | int8 | Sim | — |
| data_prevista_entrega | date | Sim | — |
| responsavel_id | int8 | Sim | — |
| origem | text | Não | 'manual'::text |
| fornecedor_nome_snapshot | text | Sim | — |
| fornecedor_documento_snapshot | text | Sim | — |
| seguro | numeric(18,2) | Não | 0 |
| outras_despesas | numeric(18,2) | Não | 0 |
| versao | int4 | Não | 1 |
| motivo_cancelamento | text | Sim | — |
| chave_idempotencia | text | Sim | — |

Restrições e relacionamentos:

```sql
compras_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_categoria_fk: FOREIGN KEY (tenant_id, categoria_id) REFERENCES erp.categorias(tenant_id, id) ON DELETE RESTRICT
compras_centro_custo_fk: FOREIGN KEY (tenant_id, centro_custo_id) REFERENCES erp.centros_custo(tenant_id, id) ON DELETE RESTRICT
compras_chave_idempotencia_chk: CHECK (((chave_idempotencia IS NULL) OR (btrim(chave_idempotencia) <> ''::text)))
compras_condicao_pagamento_object_chk: CHECK ((jsonb_typeof(condicao_pagamento) = 'object'::text))
compras_conta_financeira_fk: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
compras_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_fornecedor_fk: FOREIGN KEY (tenant_id, fornecedor_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
compras_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
compras_metodo_pagamento_fk: FOREIGN KEY (tenant_id, metodo_pagamento_id) REFERENCES erp.metodos_pagamento(tenant_id, id) ON DELETE RESTRICT
compras_natureza_fk: FOREIGN KEY (tenant_id, natureza_operacao_id) REFERENCES erp.naturezas_operacao_compra(tenant_id, id) ON DELETE RESTRICT
compras_origem_chk: CHECK ((origem = ANY (ARRAY['manual'::text, 'xml'::text, 'api'::text, 'recorrencia'::text, 'integracao'::text])))
compras_pkey: PRIMARY KEY (id)
compras_responsavel_tenant_fk: FOREIGN KEY (tenant_id, responsavel_id) REFERENCES shared.tenant_memberships(tenant_id, user_id) ON DELETE SET NULL (responsavel_id)
compras_status_chk: CHECK ((status = ANY (ARRAY['rascunho'::text, 'confirmada'::text, 'parcialmente_recebida'::text, 'recebida'::text, 'cancelada'::text])))
compras_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
compras_tenant_id_id_key: UNIQUE (tenant_id, id)
compras_tipo_compra_chk: CHECK ((tipo_compra = ANY (ARRAY['produto'::text, 'servico'::text])))
compras_tipo_desconto_chk: CHECK (((tipo_desconto IS NULL) OR (tipo_desconto = ANY (ARRAY['valor'::text, 'percentual'::text]))))
compras_tipo_movimento_chk: CHECK ((tipo_movimento = ANY (ARRAY['cotacao'::text, 'pedido_recorrente'::text, 'pedido_compra'::text, 'compra'::text, 'cancelada'::text])))
compras_valores_chk: CHECK (((subtotal >= (0)::numeric) AND (desconto >= (0)::numeric) AND (frete >= (0)::numeric) AND (total >= (0)::numeric)))
compras_valores_completos_chk: CHECK (((seguro >= (0)::numeric) AND (outras_despesas >= (0)::numeric) AND (impostos_retidos >= (0)::numeric)))
compras_versao_chk: CHECK ((versao > 0))
validar_documento_diferido: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Índices:

```sql
CREATE UNIQUE INDEX compras_chave_idempotencia_unica_idx ON erp.compras USING btree (tenant_id, chave_idempotencia) WHERE ((chave_idempotencia IS NOT NULL) AND (excluido_em IS NULL))
CREATE INDEX compras_fornecedor_data_idx ON erp.compras USING btree (tenant_id, fornecedor_id, data_compra DESC) WHERE (excluido_em IS NULL)
CREATE INDEX compras_movimento_data_idx ON erp.compras USING btree (tenant_id, tipo_movimento, data_compra DESC) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX compras_numero_unico_idx ON erp.compras USING btree (tenant_id, numero) WHERE ((numero IS NOT NULL) AND (numero <> ''::text) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX compras_pkey ON erp.compras USING btree (id)
CREATE INDEX compras_status_data_idx ON erp.compras USING btree (tenant_id, status, data_compra DESC) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX compras_tenant_id_id_key ON erp.compras USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.compras FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE CONSTRAINT TRIGGER validar_documento_diferido AFTER INSERT OR DELETE OR UPDATE ON erp.compras DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_documento_diferido()
CREATE TRIGGER validar_periodo_operacional_aberto BEFORE INSERT OR UPDATE ON erp.compras FOR EACH ROW EXECUTE FUNCTION erp.validar_periodo_operacional_aberto()
DELETE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
```

## erp.compras_arquivos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| compra_id | int8 | Não | — |
| arquivo_id | int8 | Não | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
compras_arquivos_arquivo_fk: FOREIGN KEY (tenant_id, arquivo_id) REFERENCES erp.arquivos(tenant_id, id) ON DELETE RESTRICT
compras_arquivos_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_arquivos_compra_fk: FOREIGN KEY (tenant_id, compra_id) REFERENCES erp.compras(tenant_id, id) ON DELETE CASCADE
compras_arquivos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_arquivos_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
compras_arquivos_pkey: PRIMARY KEY (id)
compras_arquivos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
compras_arquivos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX compras_arquivos_pkey ON erp.compras_arquivos USING btree (id)
CREATE UNIQUE INDEX compras_arquivos_tenant_id_id_key ON erp.compras_arquivos USING btree (tenant_id, id)
CREATE UNIQUE INDEX compras_arquivos_unico_idx ON erp.compras_arquivos USING btree (tenant_id, compra_id, arquivo_id) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.compras_arquivos FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
```

## erp.compras_eventos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| compra_id | int8 | Não | — |
| evento | text | Não | — |
| dados | jsonb | Não | '{}'::jsonb |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
compras_eventos_compra_fk: FOREIGN KEY (tenant_id, compra_id) REFERENCES erp.compras(tenant_id, id) ON DELETE CASCADE
compras_eventos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_eventos_dados_object_chk: CHECK ((jsonb_typeof(dados) = 'object'::text))
compras_eventos_pkey: PRIMARY KEY (id)
compras_eventos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
compras_eventos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX compras_eventos_pkey ON erp.compras_eventos USING btree (id)
CREATE UNIQUE INDEX compras_eventos_tenant_id_id_key ON erp.compras_eventos USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER bloquear_mutacao_evento BEFORE DELETE OR UPDATE ON erp.compras_eventos FOR EACH ROW EXECUTE FUNCTION erp.bloquear_mutacao_evento()
DELETE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
```

## erp.compras_itens

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| compra_id | int8 | Não | — |
| produto_id | int8 | Sim | — |
| servico_id | int8 | Sim | — |
| descricao | text | Não | — |
| quantidade | numeric(18,4) | Não | 1 |
| valor_unitario | numeric(18,4) | Não | 0 |
| total | numeric(18,2) | Não | 0 |
| centro_custo_id | int8 | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| unidade | text | Sim | — |
| detalhes | text | Sim | — |
| percentual_desconto | numeric(9,4) | Sim | — |
| valor_desconto | numeric(18,2) | Não | 0 |
| valor_bruto | numeric(18,2) | Não | 0 |
| valor_liquido | numeric(18,2) | Não | 0 |
| item_codigo_snapshot | text | Sim | — |
| item_descricao_snapshot | text | Sim | — |
| item_unidade_snapshot | text | Sim | — |
| quantidade_recebida | numeric(18,4) | Não | 0 |

Restrições e relacionamentos:

```sql
compras_itens_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_itens_centro_custo_fk: FOREIGN KEY (tenant_id, centro_custo_id) REFERENCES erp.centros_custo(tenant_id, id) ON DELETE RESTRICT
compras_itens_compra_fk: FOREIGN KEY (tenant_id, compra_id) REFERENCES erp.compras(tenant_id, id) ON DELETE CASCADE
compras_itens_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_itens_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
compras_itens_origem_chk: CHECK ((((produto_id IS NOT NULL) AND (servico_id IS NULL)) OR ((produto_id IS NULL) AND (servico_id IS NOT NULL))))
compras_itens_pkey: PRIMARY KEY (id)
compras_itens_produto_fk: FOREIGN KEY (tenant_id, produto_id) REFERENCES erp.produtos(tenant_id, id) ON DELETE RESTRICT
compras_itens_quantidade_recebida_chk: CHECK (((quantidade_recebida >= (0)::numeric) AND (quantidade_recebida <= quantidade)))
compras_itens_servico_fk: FOREIGN KEY (tenant_id, servico_id) REFERENCES erp.servicos(tenant_id, id) ON DELETE RESTRICT
compras_itens_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
compras_itens_tenant_id_id_key: UNIQUE (tenant_id, id)
compras_itens_valores_chk: CHECK (((quantidade > (0)::numeric) AND (valor_unitario >= (0)::numeric) AND (total >= (0)::numeric)))
compras_itens_valores_completos_chk: CHECK (((valor_desconto >= (0)::numeric) AND (valor_bruto >= (0)::numeric) AND (valor_liquido >= (0)::numeric) AND ((percentual_desconto IS NULL) OR ((percentual_desconto >= (0)::numeric) AND (percentual_desconto <= (100)::numeric)))))
validar_documento_diferido: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Índices:

```sql
CREATE INDEX compras_itens_compra_idx ON erp.compras_itens USING btree (tenant_id, compra_id) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX compras_itens_pkey ON erp.compras_itens USING btree (id)
CREATE UNIQUE INDEX compras_itens_tenant_id_id_key ON erp.compras_itens USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.compras_itens FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE CONSTRAINT TRIGGER validar_documento_diferido AFTER INSERT OR DELETE OR UPDATE ON erp.compras_itens DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_documento_diferido()
DELETE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
```

## erp.compras_parcelas_previstas

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| compra_id | int8 | Não | — |
| numero_parcela | int4 | Não | — |
| descricao | text | Sim | — |
| data_vencimento | date | Não | — |
| valor | numeric(18,2) | Não | — |
| percentual | numeric(9,4) | Sim | — |
| conta_financeira_id | int8 | Sim | — |
| metodo_pagamento_id | int8 | Sim | — |
| observacoes | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
compras_parcelas_previstas_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_parcelas_previstas_compra_fk: FOREIGN KEY (tenant_id, compra_id) REFERENCES erp.compras(tenant_id, id) ON DELETE CASCADE
compras_parcelas_previstas_conta_fk: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
compras_parcelas_previstas_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_parcelas_previstas_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
compras_parcelas_previstas_metodo_fk: FOREIGN KEY (tenant_id, metodo_pagamento_id) REFERENCES erp.metodos_pagamento(tenant_id, id) ON DELETE RESTRICT
compras_parcelas_previstas_pkey: PRIMARY KEY (id)
compras_parcelas_previstas_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
compras_parcelas_previstas_tenant_id_id_key: UNIQUE (tenant_id, id)
compras_parcelas_previstas_valores_chk: CHECK (((numero_parcela > 0) AND (numero_parcela <= 48) AND (valor > (0)::numeric) AND ((percentual IS NULL) OR ((percentual > (0)::numeric) AND (percentual <= (100)::numeric)))))
validar_documento_diferido: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Índices:

```sql
CREATE UNIQUE INDEX compras_parcelas_previstas_numero_unico_idx ON erp.compras_parcelas_previstas USING btree (tenant_id, compra_id, numero_parcela) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX compras_parcelas_previstas_pkey ON erp.compras_parcelas_previstas USING btree (id)
CREATE UNIQUE INDEX compras_parcelas_previstas_tenant_id_id_key ON erp.compras_parcelas_previstas USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.compras_parcelas_previstas FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE CONSTRAINT TRIGGER validar_documento_diferido AFTER INSERT OR DELETE OR UPDATE ON erp.compras_parcelas_previstas DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_documento_diferido()
DELETE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
```

## erp.compras_recorrencias

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| compra_modelo_id | int8 | Não | — |
| intervalo | int4 | Não | 1 |
| frequencia | text | Não | 'mes'::text |
| inicio_em | date | Não | — |
| termino_tipo | text | Não | 'ocorrencias'::text |
| termino_em | date | Sim | — |
| quantidade_ocorrencias | int4 | Sim | — |
| proxima_competencia | date | Sim | — |
| ativa | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
compras_recorrencias_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_recorrencias_compra_fk: FOREIGN KEY (tenant_id, compra_modelo_id) REFERENCES erp.compras(tenant_id, id) ON DELETE RESTRICT
compras_recorrencias_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_recorrencias_frequencia_chk: CHECK ((frequencia = ANY (ARRAY['dia'::text, 'semana'::text, 'mes'::text, 'ano'::text])))
compras_recorrencias_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
compras_recorrencias_pkey: PRIMARY KEY (id)
compras_recorrencias_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
compras_recorrencias_tenant_id_id_key: UNIQUE (tenant_id, id)
compras_recorrencias_termino_chk: CHECK ((termino_tipo = ANY (ARRAY['data'::text, 'ocorrencias'::text, 'indeterminado'::text])))
compras_recorrencias_valores_chk: CHECK (((intervalo > 0) AND ((quantidade_ocorrencias IS NULL) OR ((quantidade_ocorrencias >= 1) AND (quantidade_ocorrencias <= 366)))))
```

Índices:

```sql
CREATE UNIQUE INDEX compras_recorrencias_compra_unica_idx ON erp.compras_recorrencias USING btree (tenant_id, compra_modelo_id) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX compras_recorrencias_pkey ON erp.compras_recorrencias USING btree (id)
CREATE UNIQUE INDEX compras_recorrencias_tenant_id_id_key ON erp.compras_recorrencias USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.compras_recorrencias FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
```

## erp.compras_recorrencias_geracoes

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| recorrencia_id | int8 | Não | — |
| compra_id | int8 | Não | — |
| competencia | date | Não | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
compras_recorrencias_geracoes_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_recorrencias_geracoes_compra_fk: FOREIGN KEY (tenant_id, compra_id) REFERENCES erp.compras(tenant_id, id) ON DELETE RESTRICT
compras_recorrencias_geracoes_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
compras_recorrencias_geracoes_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
compras_recorrencias_geracoes_pkey: PRIMARY KEY (id)
compras_recorrencias_geracoes_recorrencia_fk: FOREIGN KEY (tenant_id, recorrencia_id) REFERENCES erp.compras_recorrencias(tenant_id, id) ON DELETE CASCADE
compras_recorrencias_geracoes_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
compras_recorrencias_geracoes_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX compras_recorrencias_geracoes_pkey ON erp.compras_recorrencias_geracoes USING btree (id)
CREATE UNIQUE INDEX compras_recorrencias_geracoes_tenant_id_id_key ON erp.compras_recorrencias_geracoes USING btree (tenant_id, id)
CREATE UNIQUE INDEX compras_recorrencias_geracoes_unica_idx ON erp.compras_recorrencias_geracoes USING btree (tenant_id, recorrencia_id, competencia) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.compras_recorrencias_geracoes FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
```

## erp.conciliacoes_bancarias

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| conta_financeira_id | int8 | Não | — |
| periodo_inicio | date | Sim | — |
| periodo_fim | date | Sim | — |
| status | text | Não | 'aberta'::text |
| saldo_extrato | numeric(18,2) | Sim | — |
| saldo_sistema | numeric(18,2) | Sim | — |
| conciliado_em | timestamptz | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
conciliacoes_bancarias_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
conciliacoes_bancarias_conta_fk: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
conciliacoes_bancarias_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
conciliacoes_bancarias_periodo_chk: CHECK (((periodo_fim IS NULL) OR (periodo_inicio IS NULL) OR (periodo_fim >= periodo_inicio)))
conciliacoes_bancarias_pkey: PRIMARY KEY (id)
conciliacoes_bancarias_status_chk: CHECK ((status = ANY (ARRAY['aberta'::text, 'concluida'::text, 'cancelada'::text])))
conciliacoes_bancarias_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
conciliacoes_bancarias_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX conciliacoes_bancarias_pkey ON erp.conciliacoes_bancarias USING btree (id)
CREATE UNIQUE INDEX conciliacoes_bancarias_tenant_id_id_key ON erp.conciliacoes_bancarias USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.conciliacoes_bancarias FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.conciliacoes_bancarias_itens

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| conciliacao_id | int8 | Não | — |
| transacao_bancaria_id | int8 | Não | — |
| pagamento_id | int8 | Sim | — |
| transferencia_financeira_id | int8 | Sim | — |
| valor_conciliado | numeric(18,2) | Não | — |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |
| origem_conciliacao | text | Não | 'manual'::text |
| desfeito_em | timestamptz | Sim | — |
| desfeito_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
conciliacoes_bancarias_itens_conciliacao_fk: FOREIGN KEY (tenant_id, conciliacao_id) REFERENCES erp.conciliacoes_bancarias(tenant_id, id) ON DELETE CASCADE
conciliacoes_bancarias_itens_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
conciliacoes_bancarias_itens_desfeito_por_fkey: FOREIGN KEY (desfeito_por) REFERENCES shared.users(id) ON DELETE SET NULL
conciliacoes_bancarias_itens_origem_chk: CHECK (((((pagamento_id IS NOT NULL))::integer + ((transferencia_financeira_id IS NOT NULL))::integer) = 1))
conciliacoes_bancarias_itens_origem_conciliacao_chk: CHECK ((origem_conciliacao = ANY (ARRAY['manual'::text, 'sugerida'::text])))
conciliacoes_bancarias_itens_pagamento_fk: FOREIGN KEY (tenant_id, pagamento_id) REFERENCES erp.pagamentos(tenant_id, id) ON DELETE RESTRICT
conciliacoes_bancarias_itens_pkey: PRIMARY KEY (id)
conciliacoes_bancarias_itens_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
conciliacoes_bancarias_itens_tenant_id_id_key: UNIQUE (tenant_id, id)
conciliacoes_bancarias_itens_transacao_fk: FOREIGN KEY (tenant_id, transacao_bancaria_id) REFERENCES erp.transacoes_bancarias(tenant_id, id) ON DELETE RESTRICT
conciliacoes_bancarias_itens_transferencia_fk: FOREIGN KEY (tenant_id, transferencia_financeira_id) REFERENCES erp.transferencias_financeiras(tenant_id, id) ON DELETE RESTRICT
conciliacoes_bancarias_itens_valor_chk: CHECK ((valor_conciliado > (0)::numeric))
```

Índices:

```sql
CREATE UNIQUE INDEX conciliacoes_bancarias_itens_pkey ON erp.conciliacoes_bancarias_itens USING btree (id)
CREATE UNIQUE INDEX conciliacoes_bancarias_itens_tenant_id_id_key ON erp.conciliacoes_bancarias_itens USING btree (tenant_id, id)
CREATE UNIQUE INDEX conciliacoes_bancarias_itens_transacao_ativa_idx ON erp.conciliacoes_bancarias_itens USING btree (tenant_id, transacao_bancaria_id) WHERE (desfeito_em IS NULL)
```

Gatilhos e políticas:

```text
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.contas_financeiras

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| nome | text | Não | — |
| tipo | text | Não | 'banco'::text |
| banco | text | Sim | — |
| agencia | text | Sim | — |
| conta | text | Sim | — |
| digito | text | Sim | — |
| saldo_inicial | numeric(18,2) | Não | 0 |
| data_saldo_inicial | date | Sim | — |
| ativo | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| padrao | bool | Não | false |
| versao | int4 | Não | 1 |

Restrições e relacionamentos:

```sql
contas_financeiras_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_financeiras_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_financeiras_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
contas_financeiras_pkey: PRIMARY KEY (id)
contas_financeiras_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contas_financeiras_tenant_id_id_key: UNIQUE (tenant_id, id)
contas_financeiras_tipo_chk: CHECK ((tipo = ANY (ARRAY['caixa'::text, 'banco'::text, 'carteira'::text, 'cartao'::text, 'outro'::text])))
contas_financeiras_versao_chk: CHECK ((versao > 0))
```

Índices:

```sql
CREATE UNIQUE INDEX contas_financeiras_padrao_unica_idx ON erp.contas_financeiras USING btree (tenant_id) WHERE ((padrao = true) AND (ativo = true) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX contas_financeiras_pkey ON erp.contas_financeiras USING btree (id)
CREATE UNIQUE INDEX contas_financeiras_tenant_id_id_key ON erp.contas_financeiras USING btree (tenant_id, id)
CREATE INDEX contas_financeiras_tenant_tipo_idx ON erp.contas_financeiras USING btree (tenant_id, tipo) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.contas_financeiras FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.contas_pagar

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| fornecedor_id | int8 | Não | — |
| compra_id | int8 | Sim | — |
| descricao | text | Não | — |
| numero_documento | text | Sim | — |
| data_competencia | date | Sim | — |
| data_emissao | date | Não | CURRENT_DATE |
| valor_total | numeric(18,2) | Não | 0 |
| status | text | Não | 'aberto'::text |
| categoria_id | int8 | Sim | — |
| centro_custo_id | int8 | Sim | — |
| observacoes | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| origem | text | Não | 'manual'::text |
| tipo_lancamento | text | Não | 'efetivo'::text |
| compra_recorrencia_id | int8 | Sim | — |
| fornecedor_nome_snapshot | text | Sim | — |
| fornecedor_documento_snapshot | text | Sim | — |
| efetivado_em | timestamptz | Sim | — |
| cancelado_em | timestamptz | Sim | — |
| motivo_cancelamento | text | Sim | — |
| recorrencia_financeira_id | int8 | Sim | — |
| chave_idempotencia | text | Sim | — |

Restrições e relacionamentos:

```sql
contas_pagar_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_pagar_categoria_fk: FOREIGN KEY (tenant_id, categoria_id) REFERENCES erp.categorias(tenant_id, id) ON DELETE RESTRICT
contas_pagar_centro_custo_fk: FOREIGN KEY (tenant_id, centro_custo_id) REFERENCES erp.centros_custo(tenant_id, id) ON DELETE RESTRICT
contas_pagar_chave_idempotencia_chk: CHECK (((chave_idempotencia IS NULL) OR (btrim(chave_idempotencia) <> ''::text)))
contas_pagar_compra_fk: FOREIGN KEY (tenant_id, compra_id) REFERENCES erp.compras(tenant_id, id) ON DELETE RESTRICT
contas_pagar_compra_recorrencia_fk: FOREIGN KEY (tenant_id, compra_recorrencia_id) REFERENCES erp.compras_recorrencias(tenant_id, id) ON DELETE RESTRICT
contas_pagar_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_pagar_fornecedor_fk: FOREIGN KEY (tenant_id, fornecedor_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
contas_pagar_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
contas_pagar_origem_chk: CHECK ((origem = ANY (ARRAY['manual'::text, 'compra'::text, 'recorrencia'::text, 'xml'::text, 'api'::text, 'integracao'::text])))
contas_pagar_pkey: PRIMARY KEY (id)
contas_pagar_recorrencia_financeira_fk: FOREIGN KEY (tenant_id, recorrencia_financeira_id) REFERENCES erp.recorrencias_financeiras(tenant_id, id) ON DELETE RESTRICT
contas_pagar_status_chk: CHECK ((status = ANY (ARRAY['aberto'::text, 'parcial'::text, 'pago'::text, 'cancelado'::text, 'vencido'::text])))
contas_pagar_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contas_pagar_tenant_id_id_key: UNIQUE (tenant_id, id)
contas_pagar_tipo_lancamento_chk: CHECK ((tipo_lancamento = ANY (ARRAY['previsao'::text, 'efetivo'::text])))
contas_pagar_valor_chk: CHECK ((valor_total >= (0)::numeric))
validar_documento_diferido: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Índices:

```sql
CREATE UNIQUE INDEX contas_pagar_chave_idempotencia_unica_idx ON erp.contas_pagar USING btree (tenant_id, chave_idempotencia) WHERE ((chave_idempotencia IS NOT NULL) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX contas_pagar_compra_unica_idx ON erp.contas_pagar USING btree (tenant_id, compra_id) WHERE ((compra_id IS NOT NULL) AND (excluido_em IS NULL))
CREATE INDEX contas_pagar_data_emissao_idx ON erp.contas_pagar USING btree (tenant_id, data_emissao DESC) WHERE (excluido_em IS NULL)
CREATE INDEX contas_pagar_fornecedor_status_idx ON erp.contas_pagar USING btree (tenant_id, fornecedor_id, status) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX contas_pagar_pkey ON erp.contas_pagar USING btree (id)
CREATE UNIQUE INDEX contas_pagar_recorrencia_competencia_unica_idx ON erp.contas_pagar USING btree (tenant_id, recorrencia_financeira_id, data_competencia) WHERE ((recorrencia_financeira_id IS NOT NULL) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX contas_pagar_tenant_id_id_key ON erp.contas_pagar USING btree (tenant_id, id)
CREATE INDEX contas_pagar_tipo_vencimento_idx ON erp.contas_pagar USING btree (tenant_id, tipo_lancamento, status) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.contas_pagar FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE CONSTRAINT TRIGGER validar_documento_diferido AFTER INSERT OR DELETE OR UPDATE ON erp.contas_pagar DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_documento_diferido()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.contas_pagar_arquivos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| conta_pagar_id | int8 | Não | — |
| arquivo_id | int8 | Não | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
contas_pagar_arquivos_arquivo_fk: FOREIGN KEY (tenant_id, arquivo_id) REFERENCES erp.arquivos(tenant_id, id) ON DELETE RESTRICT
contas_pagar_arquivos_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_pagar_arquivos_conta_fk: FOREIGN KEY (tenant_id, conta_pagar_id) REFERENCES erp.contas_pagar(tenant_id, id) ON DELETE CASCADE
contas_pagar_arquivos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_pagar_arquivos_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
contas_pagar_arquivos_pkey: PRIMARY KEY (id)
contas_pagar_arquivos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contas_pagar_arquivos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX contas_pagar_arquivos_pkey ON erp.contas_pagar_arquivos USING btree (id)
CREATE UNIQUE INDEX contas_pagar_arquivos_tenant_id_id_key ON erp.contas_pagar_arquivos USING btree (tenant_id, id)
CREATE UNIQUE INDEX contas_pagar_arquivos_unico_idx ON erp.contas_pagar_arquivos USING btree (tenant_id, conta_pagar_id, arquivo_id) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.contas_pagar_arquivos FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.contas_pagar_eventos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| conta_pagar_id | int8 | Não | — |
| evento | text | Não | — |
| dados | jsonb | Não | '{}'::jsonb |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
contas_pagar_eventos_conta_fk: FOREIGN KEY (tenant_id, conta_pagar_id) REFERENCES erp.contas_pagar(tenant_id, id) ON DELETE CASCADE
contas_pagar_eventos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_pagar_eventos_dados_object_chk: CHECK ((jsonb_typeof(dados) = 'object'::text))
contas_pagar_eventos_pkey: PRIMARY KEY (id)
contas_pagar_eventos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contas_pagar_eventos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX contas_pagar_eventos_pkey ON erp.contas_pagar_eventos USING btree (id)
CREATE UNIQUE INDEX contas_pagar_eventos_tenant_id_id_key ON erp.contas_pagar_eventos USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER bloquear_mutacao_evento BEFORE DELETE OR UPDATE ON erp.contas_pagar_eventos FOR EACH ROW EXECUTE FUNCTION erp.bloquear_mutacao_evento()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.contas_pagar_parcelas

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| conta_pagar_id | int8 | Não | — |
| numero_parcela | int4 | Não | 1 |
| codigo_referencia | text | Sim | — |
| descricao | text | Sim | — |
| data_vencimento | date | Não | — |
| data_pagamento_previsto | date | Sim | — |
| data_pagamento | date | Sim | — |
| valor | numeric(18,2) | Não | 0 |
| valor_bruto | numeric(18,2) | Não | 0 |
| valor_liquido | numeric(18,2) | Não | 0 |
| valor_pago | numeric(18,2) | Não | 0 |
| juros | numeric(18,2) | Não | 0 |
| multa | numeric(18,2) | Não | 0 |
| desconto | numeric(18,2) | Não | 0 |
| taxa | numeric(18,2) | Não | 0 |
| status | text | Não | 'aberto'::text |
| conta_financeira_id | int8 | Sim | — |
| metodo_pagamento_id | int8 | Sim | — |
| nsu | text | Sim | — |
| conciliado | bool | Não | false |
| observacoes | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
contas_pagar_parcelas_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_pagar_parcelas_conta_financeira_fk: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
contas_pagar_parcelas_conta_fk: FOREIGN KEY (tenant_id, conta_pagar_id) REFERENCES erp.contas_pagar(tenant_id, id) ON DELETE CASCADE
contas_pagar_parcelas_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_pagar_parcelas_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
contas_pagar_parcelas_metodo_pagamento_fk: FOREIGN KEY (tenant_id, metodo_pagamento_id) REFERENCES erp.metodos_pagamento(tenant_id, id) ON DELETE RESTRICT
contas_pagar_parcelas_pkey: PRIMARY KEY (id)
contas_pagar_parcelas_status_chk: CHECK ((status = ANY (ARRAY['aberto'::text, 'parcial'::text, 'pago'::text, 'cancelado'::text, 'vencido'::text])))
contas_pagar_parcelas_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contas_pagar_parcelas_tenant_id_id_key: UNIQUE (tenant_id, id)
contas_pagar_parcelas_valores_chk: CHECK (((numero_parcela > 0) AND (valor >= (0)::numeric) AND (valor_bruto >= (0)::numeric) AND (valor_liquido >= (0)::numeric) AND (valor_pago >= (0)::numeric) AND (juros >= (0)::numeric) AND (multa >= (0)::numeric) AND (desconto >= (0)::numeric) AND (taxa >= (0)::numeric)))
validar_documento_diferido: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Índices:

```sql
CREATE INDEX contas_pagar_parcelas_conta_idx ON erp.contas_pagar_parcelas USING btree (tenant_id, conta_pagar_id) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX contas_pagar_parcelas_numero_unico_idx ON erp.contas_pagar_parcelas USING btree (tenant_id, conta_pagar_id, numero_parcela) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX contas_pagar_parcelas_pkey ON erp.contas_pagar_parcelas USING btree (id)
CREATE UNIQUE INDEX contas_pagar_parcelas_tenant_id_id_key ON erp.contas_pagar_parcelas USING btree (tenant_id, id)
CREATE INDEX contas_pagar_parcelas_vencimento_idx ON erp.contas_pagar_parcelas USING btree (tenant_id, data_vencimento, status) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.contas_pagar_parcelas FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE CONSTRAINT TRIGGER validar_documento_diferido AFTER INSERT OR DELETE OR UPDATE ON erp.contas_pagar_parcelas DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_documento_diferido()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.contas_receber

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| cliente_id | int8 | Não | — |
| venda_id | int8 | Sim | — |
| descricao | text | Não | — |
| numero_documento | text | Sim | — |
| data_competencia | date | Sim | — |
| data_emissao | date | Não | CURRENT_DATE |
| valor_total | numeric(18,2) | Não | 0 |
| status | text | Não | 'aberto'::text |
| categoria_id | int8 | Sim | — |
| centro_custo_id | int8 | Sim | — |
| observacoes | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| origem | text | Não | 'manual'::text |
| cliente_nome_snapshot | text | Sim | — |
| cliente_documento_snapshot | text | Sim | — |
| cobranca_emails | _text | Não | ARRAY[]::text[] |
| cobranca_whatsapp | text | Sim | — |
| configuracao_lembretes | jsonb | Não | '{}'::jsonb |
| cancelado_em | timestamptz | Sim | — |
| motivo_cancelamento | text | Sim | — |

Restrições e relacionamentos:

```sql
contas_receber_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_receber_categoria_fk: FOREIGN KEY (tenant_id, categoria_id) REFERENCES erp.categorias(tenant_id, id) ON DELETE RESTRICT
contas_receber_centro_custo_fk: FOREIGN KEY (tenant_id, centro_custo_id) REFERENCES erp.centros_custo(tenant_id, id) ON DELETE RESTRICT
contas_receber_cliente_fk: FOREIGN KEY (tenant_id, cliente_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
contas_receber_configuracao_lembretes_object_chk: CHECK ((jsonb_typeof(configuracao_lembretes) = 'object'::text))
contas_receber_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_receber_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
contas_receber_origem_chk: CHECK ((origem = ANY (ARRAY['manual'::text, 'venda'::text, 'contrato'::text, 'api'::text, 'importacao'::text])))
contas_receber_pkey: PRIMARY KEY (id)
contas_receber_status_chk: CHECK ((status = ANY (ARRAY['aberto'::text, 'parcial'::text, 'pago'::text, 'cancelado'::text, 'vencido'::text])))
contas_receber_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contas_receber_tenant_id_id_key: UNIQUE (tenant_id, id)
contas_receber_valor_chk: CHECK ((valor_total >= (0)::numeric))
contas_receber_venda_fk: FOREIGN KEY (tenant_id, venda_id) REFERENCES erp.vendas(tenant_id, id) ON DELETE RESTRICT
validar_documento_diferido: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Índices:

```sql
CREATE INDEX contas_receber_cliente_status_idx ON erp.contas_receber USING btree (tenant_id, cliente_id, status) WHERE (excluido_em IS NULL)
CREATE INDEX contas_receber_data_emissao_idx ON erp.contas_receber USING btree (tenant_id, data_emissao DESC) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX contas_receber_pkey ON erp.contas_receber USING btree (id)
CREATE UNIQUE INDEX contas_receber_tenant_id_id_key ON erp.contas_receber USING btree (tenant_id, id)
CREATE UNIQUE INDEX contas_receber_venda_unica_idx ON erp.contas_receber USING btree (tenant_id, venda_id) WHERE ((venda_id IS NOT NULL) AND (excluido_em IS NULL))
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.contas_receber FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE CONSTRAINT TRIGGER validar_documento_diferido AFTER INSERT OR DELETE OR UPDATE ON erp.contas_receber DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_documento_diferido()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.contas_receber_parcelas

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| conta_receber_id | int8 | Não | — |
| numero_parcela | int4 | Não | 1 |
| codigo_referencia | text | Sim | — |
| descricao | text | Sim | — |
| data_vencimento | date | Não | — |
| data_pagamento_previsto | date | Sim | — |
| data_pagamento | date | Sim | — |
| valor | numeric(18,2) | Não | 0 |
| valor_bruto | numeric(18,2) | Não | 0 |
| valor_liquido | numeric(18,2) | Não | 0 |
| valor_pago | numeric(18,2) | Não | 0 |
| juros | numeric(18,2) | Não | 0 |
| multa | numeric(18,2) | Não | 0 |
| desconto | numeric(18,2) | Não | 0 |
| taxa | numeric(18,2) | Não | 0 |
| status | text | Não | 'aberto'::text |
| conta_financeira_id | int8 | Sim | — |
| metodo_pagamento_id | int8 | Sim | — |
| nsu | text | Sim | — |
| conciliado | bool | Não | false |
| observacoes | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
contas_receber_parcelas_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_receber_parcelas_conta_financeira_fk: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
contas_receber_parcelas_conta_fk: FOREIGN KEY (tenant_id, conta_receber_id) REFERENCES erp.contas_receber(tenant_id, id) ON DELETE CASCADE
contas_receber_parcelas_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contas_receber_parcelas_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
contas_receber_parcelas_metodo_pagamento_fk: FOREIGN KEY (tenant_id, metodo_pagamento_id) REFERENCES erp.metodos_pagamento(tenant_id, id) ON DELETE RESTRICT
contas_receber_parcelas_pkey: PRIMARY KEY (id)
contas_receber_parcelas_status_chk: CHECK ((status = ANY (ARRAY['aberto'::text, 'parcial'::text, 'pago'::text, 'cancelado'::text, 'vencido'::text])))
contas_receber_parcelas_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contas_receber_parcelas_tenant_id_id_key: UNIQUE (tenant_id, id)
contas_receber_parcelas_valores_chk: CHECK (((numero_parcela > 0) AND (valor >= (0)::numeric) AND (valor_bruto >= (0)::numeric) AND (valor_liquido >= (0)::numeric) AND (valor_pago >= (0)::numeric) AND (juros >= (0)::numeric) AND (multa >= (0)::numeric) AND (desconto >= (0)::numeric) AND (taxa >= (0)::numeric)))
validar_documento_diferido: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Índices:

```sql
CREATE INDEX contas_receber_parcelas_conta_idx ON erp.contas_receber_parcelas USING btree (tenant_id, conta_receber_id) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX contas_receber_parcelas_numero_unico_idx ON erp.contas_receber_parcelas USING btree (tenant_id, conta_receber_id, numero_parcela) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX contas_receber_parcelas_pkey ON erp.contas_receber_parcelas USING btree (id)
CREATE UNIQUE INDEX contas_receber_parcelas_tenant_id_id_key ON erp.contas_receber_parcelas USING btree (tenant_id, id)
CREATE INDEX contas_receber_parcelas_vencimento_idx ON erp.contas_receber_parcelas USING btree (tenant_id, data_vencimento, status) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.contas_receber_parcelas FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE CONSTRAINT TRIGGER validar_documento_diferido AFTER INSERT OR DELETE OR UPDATE ON erp.contas_receber_parcelas DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_documento_diferido()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.contratos_vendas

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| cliente_id | int8 | Não | — |
| numero | text | Não | — |
| descricao | text | Não | — |
| data_inicio | date | Não | — |
| data_fim | date | Sim | — |
| periodicidade | text | Não | 'mensal'::text |
| dia_vencimento | int4 | Não | 1 |
| proxima_geracao_em | date | Sim | — |
| status | text | Não | 'rascunho'::text |
| reajuste_indice | text | Sim | — |
| reajuste_percentual | numeric(9,4) | Sim | — |
| categoria_id | int8 | Sim | — |
| centro_custo_id | int8 | Sim | — |
| conta_financeira_id | int8 | Sim | — |
| metodo_pagamento_id | int8 | Sim | — |
| observacoes | text | Sim | — |
| chave_idempotencia | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| versao | int4 | Não | 1 |

Restrições e relacionamentos:

```sql
contratos_vendas_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contratos_vendas_categoria_fk: FOREIGN KEY (tenant_id, categoria_id) REFERENCES erp.categorias(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_centro_custo_fk: FOREIGN KEY (tenant_id, centro_custo_id) REFERENCES erp.centros_custo(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_cliente_fk: FOREIGN KEY (tenant_id, cliente_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_conta_financeira_fk: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contratos_vendas_datas_chk: CHECK (((data_fim IS NULL) OR (data_fim >= data_inicio)))
contratos_vendas_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
contratos_vendas_metodo_pagamento_fk: FOREIGN KEY (tenant_id, metodo_pagamento_id) REFERENCES erp.metodos_pagamento(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_periodicidade_chk: CHECK ((periodicidade = ANY (ARRAY['semanal'::text, 'quinzenal'::text, 'mensal'::text, 'bimestral'::text, 'trimestral'::text, 'semestral'::text, 'anual'::text])))
contratos_vendas_pkey: PRIMARY KEY (id)
contratos_vendas_reajuste_chk: CHECK (((reajuste_percentual IS NULL) OR (reajuste_percentual >= (0)::numeric)))
contratos_vendas_status_chk: CHECK ((status = ANY (ARRAY['rascunho'::text, 'ativo'::text, 'pausado'::text, 'encerrado'::text, 'cancelado'::text])))
contratos_vendas_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contratos_vendas_tenant_id_id_key: UNIQUE (tenant_id, id)
contratos_vendas_vencimento_chk: CHECK (((dia_vencimento >= 1) AND (dia_vencimento <= 31)))
contratos_vendas_versao_chk: CHECK ((versao > 0))
```

Índices:

```sql
CREATE UNIQUE INDEX contratos_vendas_idempotencia_idx ON erp.contratos_vendas USING btree (tenant_id, chave_idempotencia) WHERE (chave_idempotencia IS NOT NULL)
CREATE UNIQUE INDEX contratos_vendas_numero_unico_idx ON erp.contratos_vendas USING btree (tenant_id, numero) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX contratos_vendas_pkey ON erp.contratos_vendas USING btree (id)
CREATE UNIQUE INDEX contratos_vendas_tenant_id_id_key ON erp.contratos_vendas USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.contratos_vendas FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
```

## erp.contratos_vendas_geracoes

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| contrato_id | int8 | Não | — |
| competencia | date | Não | — |
| venda_id | int8 | Sim | — |
| status | text | Não | 'pendente'::text |
| erro | text | Sim | — |
| chave_idempotencia | text | Não | — |
| processado_em | timestamptz | Sim | — |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
contratos_vendas_geracoes_contrato_fk: FOREIGN KEY (tenant_id, contrato_id) REFERENCES erp.contratos_vendas(tenant_id, id) ON DELETE CASCADE
contratos_vendas_geracoes_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contratos_vendas_geracoes_pkey: PRIMARY KEY (id)
contratos_vendas_geracoes_status_chk: CHECK ((status = ANY (ARRAY['pendente'::text, 'processando'::text, 'concluida'::text, 'falha'::text, 'ignorada'::text])))
contratos_vendas_geracoes_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contratos_vendas_geracoes_tenant_id_id_key: UNIQUE (tenant_id, id)
contratos_vendas_geracoes_venda_fk: FOREIGN KEY (tenant_id, venda_id) REFERENCES erp.vendas(tenant_id, id) ON DELETE RESTRICT
```

Índices:

```sql
CREATE UNIQUE INDEX contratos_vendas_geracoes_competencia_idx ON erp.contratos_vendas_geracoes USING btree (tenant_id, contrato_id, competencia)
CREATE UNIQUE INDEX contratos_vendas_geracoes_idempotencia_idx ON erp.contratos_vendas_geracoes USING btree (tenant_id, chave_idempotencia)
CREATE UNIQUE INDEX contratos_vendas_geracoes_pkey ON erp.contratos_vendas_geracoes USING btree (id)
CREATE UNIQUE INDEX contratos_vendas_geracoes_tenant_id_id_key ON erp.contratos_vendas_geracoes USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
DELETE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
```

## erp.contratos_vendas_itens

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| contrato_id | int8 | Não | — |
| produto_id | int8 | Sim | — |
| servico_id | int8 | Sim | — |
| descricao | text | Não | — |
| quantidade | numeric(18,4) | Não | 1 |
| valor_unitario | numeric(18,4) | Não | 0 |
| desconto | numeric(18,2) | Não | 0 |
| total | numeric(18,2) | Não | 0 |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
contratos_vendas_itens_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contratos_vendas_itens_contrato_fk: FOREIGN KEY (tenant_id, contrato_id) REFERENCES erp.contratos_vendas(tenant_id, id) ON DELETE CASCADE
contratos_vendas_itens_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
contratos_vendas_itens_origem_chk: CHECK ((((produto_id IS NOT NULL) AND (servico_id IS NULL)) OR ((produto_id IS NULL) AND (servico_id IS NOT NULL))))
contratos_vendas_itens_pkey: PRIMARY KEY (id)
contratos_vendas_itens_produto_fk: FOREIGN KEY (tenant_id, produto_id) REFERENCES erp.produtos(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_itens_servico_fk: FOREIGN KEY (tenant_id, servico_id) REFERENCES erp.servicos(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_itens_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contratos_vendas_itens_tenant_id_id_key: UNIQUE (tenant_id, id)
contratos_vendas_itens_valores_chk: CHECK (((quantidade > (0)::numeric) AND (valor_unitario >= (0)::numeric) AND (desconto >= (0)::numeric) AND (total >= (0)::numeric)))
```

Índices:

```sql
CREATE UNIQUE INDEX contratos_vendas_itens_pkey ON erp.contratos_vendas_itens USING btree (id)
CREATE UNIQUE INDEX contratos_vendas_itens_tenant_id_id_key ON erp.contratos_vendas_itens USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.contratos_vendas_itens FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
```

## erp.entidades

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| tipo_pessoa | text | Não | 'juridica'::text |
| nome | text | Não | — |
| nome_fantasia | text | Sim | — |
| codigo | text | Sim | — |
| documento | text | Sim | — |
| rg | text | Sim | — |
| data_nascimento | date | Sim | — |
| email | text | Sim | — |
| telefone | text | Sim | — |
| celular | text | Sim | — |
| cep | text | Sim | — |
| logradouro | text | Sim | — |
| numero | text | Sim | — |
| complemento | text | Sim | — |
| bairro | text | Sim | — |
| cidade | text | Sim | — |
| uf | text | Sim | — |
| pais | text | Não | 'Brasil'::text |
| contato_cobranca_emails | _text | Não | ARRAY[]::text[] |
| contato_cobranca_whatsapp | text | Sim | — |
| orgao_publico | bool | Não | false |
| eh_cliente | bool | Não | false |
| eh_fornecedor | bool | Não | false |
| eh_transportadora | bool | Não | false |
| eh_vendedor | bool | Não | false |
| ativo | bool | Não | true |
| observacoes | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| versao | int4 | Não | 1 |

Restrições e relacionamentos:

```sql
entidades_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
entidades_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
entidades_indicador_ie_chk: CHECK (((indicador_inscricao_estadual IS NULL) OR (indicador_inscricao_estadual = ANY (ARRAY['contribuinte'::text, 'contribuinte_isento'::text, 'nao_contribuinte'::text]))))
entidades_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
entidades_papel_chk: CHECK ((eh_cliente OR eh_fornecedor OR eh_transportadora OR eh_vendedor))
entidades_pkey: PRIMARY KEY (id)
entidades_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
entidades_tenant_id_id_key: UNIQUE (tenant_id, id)
entidades_tipo_pessoa_chk: CHECK ((tipo_pessoa = ANY (ARRAY['fisica'::text, 'juridica'::text, 'estrangeira'::text])))
entidades_versao_chk: CHECK ((versao > 0))
```

Índices:

```sql
CREATE UNIQUE INDEX entidades_codigo_unico_idx ON erp.entidades USING btree (tenant_id, codigo) WHERE ((codigo IS NOT NULL) AND (codigo <> ''::text) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX entidades_documento_unico_idx ON erp.entidades USING btree (tenant_id, documento) WHERE ((documento IS NOT NULL) AND (documento <> ''::text) AND (excluido_em IS NULL))
CREATE INDEX entidades_papeis_idx ON erp.entidades USING btree (tenant_id, eh_cliente, eh_fornecedor, eh_transportadora, eh_vendedor) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX entidades_pkey ON erp.entidades USING btree (id)
CREATE UNIQUE INDEX entidades_tenant_id_id_key ON erp.entidades USING btree (tenant_id, id)
CREATE INDEX entidades_tenant_nome_idx ON erp.entidades USING btree (tenant_id, nome)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.entidades FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
```

## erp.execucoes_automacao

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| tipo | text | Não | — |
| competencia | date | Não | CURRENT_DATE |
| status | text | Não | 'pendente'::text |
| tentativas | int4 | Não | 0 |
| resultado | jsonb | Não | '{}'::jsonb |
| erro | text | Sim | — |
| chave_idempotencia | text | Não | — |
| iniciado_em | timestamptz | Sim | — |
| finalizado_em | timestamptz | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
execucoes_automacao_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
execucoes_automacao_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
execucoes_automacao_json_chk: CHECK (((jsonb_typeof(resultado) = 'object'::text) AND (jsonb_typeof(metadata) = 'object'::text)))
execucoes_automacao_pkey: PRIMARY KEY (id)
execucoes_automacao_status_chk: CHECK ((status = ANY (ARRAY['pendente'::text, 'processando'::text, 'concluida'::text, 'falha'::text])))
execucoes_automacao_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
execucoes_automacao_tenant_id_id_key: UNIQUE (tenant_id, id)
execucoes_automacao_tentativas_chk: CHECK ((tentativas >= 0))
execucoes_automacao_tipo_chk: CHECK ((tipo = ANY (ARRAY['contratos'::text, 'recorrencias_financeiras'::text, 'titulos_vencidos'::text, 'indicadores'::text, 'estoque_minimo'::text])))
```

Índices:

```sql
CREATE UNIQUE INDEX execucoes_automacao_idempotencia_idx ON erp.execucoes_automacao USING btree (tenant_id, chave_idempotencia)
CREATE UNIQUE INDEX execucoes_automacao_pkey ON erp.execucoes_automacao USING btree (id)
CREATE UNIQUE INDEX execucoes_automacao_tenant_id_id_key ON erp.execucoes_automacao USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.execucoes_automacao FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text)
```

## erp.fechamentos_periodos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| modulo | text | Não | — |
| periodo_inicio | date | Não | — |
| periodo_fim | date | Não | — |
| motivo | text | Sim | — |
| fechado_em | timestamptz | Não | now() |
| reaberto_em | timestamptz | Sim | — |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |
| reaberto_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
fechamentos_periodos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
fechamentos_periodos_datas_chk: CHECK ((periodo_fim >= periodo_inicio))
fechamentos_periodos_modulo_chk: CHECK ((modulo = ANY (ARRAY['financeiro'::text, 'estoque'::text, 'vendas'::text, 'compras'::text, 'todos'::text])))
fechamentos_periodos_pkey: PRIMARY KEY (id)
fechamentos_periodos_reaberto_por_fkey: FOREIGN KEY (reaberto_por) REFERENCES shared.users(id) ON DELETE SET NULL
fechamentos_periodos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
fechamentos_periodos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX fechamentos_periodos_ativo_idx ON erp.fechamentos_periodos USING btree (tenant_id, modulo, periodo_inicio, periodo_fim) WHERE (reaberto_em IS NULL)
CREATE UNIQUE INDEX fechamentos_periodos_ativo_unico_idx ON erp.fechamentos_periodos USING btree (tenant_id, modulo, periodo_inicio, periodo_fim) WHERE (reaberto_em IS NULL)
CREATE UNIQUE INDEX fechamentos_periodos_pkey ON erp.fechamentos_periodos USING btree (id)
CREATE UNIQUE INDEX fechamentos_periodos_tenant_id_id_key ON erp.fechamentos_periodos USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
DELETE: shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text)
```

## erp.fornecedores_produtos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| fornecedor_id | int8 | Não | — |
| produto_id | int8 | Não | — |
| codigo_fornecedor | text | Não | — |
| descricao_fornecedor | text | Sim | — |
| unidade_fornecedor | text | Sim | — |
| ultimo_custo | numeric(18,4) | Sim | — |
| ultima_compra_em | date | Sim | — |
| ativo | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| fator_conversao | numeric(18,6) | Não | 1 |

Restrições e relacionamentos:

```sql
fornecedores_produtos_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
fornecedores_produtos_codigo_chk: CHECK ((btrim(codigo_fornecedor) <> ''::text))
fornecedores_produtos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
fornecedores_produtos_custo_chk: CHECK (((ultimo_custo IS NULL) OR (ultimo_custo >= (0)::numeric)))
fornecedores_produtos_fornecedor_fk: FOREIGN KEY (tenant_id, fornecedor_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
fornecedores_produtos_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
fornecedores_produtos_pkey: PRIMARY KEY (id)
fornecedores_produtos_produto_fk: FOREIGN KEY (tenant_id, produto_id) REFERENCES erp.produtos(tenant_id, id) ON DELETE RESTRICT
fornecedores_produtos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
fornecedores_produtos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX fornecedores_produtos_codigo_unico_idx ON erp.fornecedores_produtos USING btree (tenant_id, fornecedor_id, lower(codigo_fornecedor)) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX fornecedores_produtos_pkey ON erp.fornecedores_produtos USING btree (id)
CREATE UNIQUE INDEX fornecedores_produtos_tenant_id_id_key ON erp.fornecedores_produtos USING btree (tenant_id, id)
CREATE UNIQUE INDEX fornecedores_produtos_vinculo_unico_idx ON erp.fornecedores_produtos USING btree (tenant_id, fornecedor_id, produto_id) WHERE ((excluido_em IS NULL) AND ativo)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.fornecedores_produtos FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
```

## erp.importacoes_bancarias

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| conta_financeira_id | int8 | Não | — |
| formato | text | Não | 'ofx'::text |
| nome_arquivo | text | Não | — |
| hash_arquivo | text | Não | — |
| periodo_inicio | date | Sim | — |
| periodo_fim | date | Sim | — |
| status | text | Não | 'processando'::text |
| total_linhas | int4 | Não | 0 |
| total_importadas | int4 | Não | 0 |
| total_ignoradas | int4 | Não | 0 |
| erro | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| concluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
importacoes_bancarias_conta_fk: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
importacoes_bancarias_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
importacoes_bancarias_formato_chk: CHECK ((formato = ANY (ARRAY['ofx'::text, 'csv'::text, 'api'::text])))
importacoes_bancarias_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
importacoes_bancarias_pkey: PRIMARY KEY (id)
importacoes_bancarias_status_chk: CHECK ((status = ANY (ARRAY['processando'::text, 'concluida'::text, 'parcial'::text, 'falha'::text])))
importacoes_bancarias_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
importacoes_bancarias_tenant_id_id_key: UNIQUE (tenant_id, id)
importacoes_bancarias_totais_chk: CHECK (((total_linhas >= 0) AND (total_importadas >= 0) AND (total_ignoradas >= 0)))
```

Índices:

```sql
CREATE UNIQUE INDEX importacoes_bancarias_hash_idx ON erp.importacoes_bancarias USING btree (tenant_id, conta_financeira_id, hash_arquivo)
CREATE UNIQUE INDEX importacoes_bancarias_pkey ON erp.importacoes_bancarias USING btree (id)
CREATE UNIQUE INDEX importacoes_bancarias_tenant_id_id_key ON erp.importacoes_bancarias USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.importacoes_dados

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| tipo | text | Não | — |
| nome_arquivo | text | Não | — |
| hash_arquivo | text | Não | — |
| status | text | Não | 'validando'::text |
| total_linhas | int4 | Não | 0 |
| total_validas | int4 | Não | 0 |
| total_importadas | int4 | Não | 0 |
| total_erros | int4 | Não | 0 |
| mapeamento | jsonb | Não | '{}'::jsonb |
| erro | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| concluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
importacoes_dados_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
importacoes_dados_mapeamento_chk: CHECK ((jsonb_typeof(mapeamento) = 'object'::text))
importacoes_dados_pkey: PRIMARY KEY (id)
importacoes_dados_status_chk: CHECK ((status = ANY (ARRAY['validando'::text, 'pronta'::text, 'processando'::text, 'concluida'::text, 'parcial'::text, 'falha'::text, 'cancelada'::text])))
importacoes_dados_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
importacoes_dados_tenant_id_id_key: UNIQUE (tenant_id, id)
importacoes_dados_tipo_chk: CHECK ((tipo = ANY (ARRAY['clientes'::text, 'fornecedores'::text, 'produtos'::text, 'servicos'::text, 'contas_receber'::text, 'contas_pagar'::text])))
importacoes_dados_totais_chk: CHECK (((total_linhas >= 0) AND (total_validas >= 0) AND (total_importadas >= 0) AND (total_erros >= 0)))
```

Índices:

```sql
CREATE UNIQUE INDEX importacoes_dados_hash_idx ON erp.importacoes_dados USING btree (tenant_id, tipo, hash_arquivo) WHERE (status <> 'cancelada'::text)
CREATE UNIQUE INDEX importacoes_dados_pkey ON erp.importacoes_dados USING btree (id)
CREATE UNIQUE INDEX importacoes_dados_tenant_id_id_key ON erp.importacoes_dados USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
DELETE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
```

## erp.importacoes_dados_linhas

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| importacao_id | int8 | Não | — |
| numero_linha | int4 | Não | — |
| dados_originais | jsonb | Não | — |
| dados_normalizados | jsonb | Sim | — |
| status | text | Não | 'pendente'::text |
| erros | jsonb | Não | '[]'::jsonb |
| registro_id | int8 | Sim | — |
| criado_em | timestamptz | Não | now() |
| processado_em | timestamptz | Sim | — |

Restrições e relacionamentos:

```sql
importacoes_dados_linhas_importacao_fk: FOREIGN KEY (tenant_id, importacao_id) REFERENCES erp.importacoes_dados(tenant_id, id) ON DELETE CASCADE
importacoes_dados_linhas_json_chk: CHECK (((jsonb_typeof(dados_originais) = 'object'::text) AND ((dados_normalizados IS NULL) OR (jsonb_typeof(dados_normalizados) = 'object'::text)) AND (jsonb_typeof(erros) = 'array'::text)))
importacoes_dados_linhas_numero_chk: CHECK ((numero_linha > 0))
importacoes_dados_linhas_numero_key: UNIQUE (tenant_id, importacao_id, numero_linha)
importacoes_dados_linhas_pkey: PRIMARY KEY (id)
importacoes_dados_linhas_status_chk: CHECK ((status = ANY (ARRAY['pendente'::text, 'valida'::text, 'erro'::text, 'importada'::text, 'ignorada'::text])))
importacoes_dados_linhas_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
importacoes_dados_linhas_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX importacoes_dados_linhas_numero_key ON erp.importacoes_dados_linhas USING btree (tenant_id, importacao_id, numero_linha)
CREATE UNIQUE INDEX importacoes_dados_linhas_pkey ON erp.importacoes_dados_linhas USING btree (id)
CREATE UNIQUE INDEX importacoes_dados_linhas_tenant_id_id_key ON erp.importacoes_dados_linhas USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
DELETE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
```

## erp.metodos_pagamento

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| nome | text | Não | — |
| tipo | text | Não | 'outro'::text |
| ativo | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
metodos_pagamento_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
metodos_pagamento_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
metodos_pagamento_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
metodos_pagamento_pkey: PRIMARY KEY (id)
metodos_pagamento_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
metodos_pagamento_tenant_id_id_key: UNIQUE (tenant_id, id)
metodos_pagamento_tipo_chk: CHECK ((tipo = ANY (ARRAY['pix'::text, 'boleto'::text, 'dinheiro'::text, 'cartao_credito'::text, 'cartao_debito'::text, 'transferencia'::text, 'deposito'::text, 'cheque'::text, 'outro'::text])))
```

Índices:

```sql
CREATE UNIQUE INDEX metodos_pagamento_pkey ON erp.metodos_pagamento USING btree (id)
CREATE UNIQUE INDEX metodos_pagamento_tenant_id_id_key ON erp.metodos_pagamento USING btree (tenant_id, id)
CREATE INDEX metodos_pagamento_tenant_tipo_idx ON erp.metodos_pagamento USING btree (tenant_id, tipo) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.metodos_pagamento FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'::text)
```

## erp.naturezas_operacao_compra

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| nome | text | Não | — |
| codigo | text | Sim | — |
| gera_financeiro_padrao | bool | Não | true |
| ativo | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
naturezas_operacao_compra_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
naturezas_operacao_compra_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
naturezas_operacao_compra_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
naturezas_operacao_compra_nome_chk: CHECK ((btrim(nome) <> ''::text))
naturezas_operacao_compra_pkey: PRIMARY KEY (id)
naturezas_operacao_compra_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
naturezas_operacao_compra_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX naturezas_operacao_compra_codigo_unico_idx ON erp.naturezas_operacao_compra USING btree (tenant_id, codigo) WHERE ((codigo IS NOT NULL) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX naturezas_operacao_compra_pkey ON erp.naturezas_operacao_compra USING btree (id)
CREATE UNIQUE INDEX naturezas_operacao_compra_tenant_id_id_key ON erp.naturezas_operacao_compra USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.naturezas_operacao_compra FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.compras.gerenciar'::text)
```

## erp.ordens_servico

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| cliente_id | int8 | Não | — |
| responsavel_id | int8 | Sim | — |
| numero | text | Não | — |
| status | text | Não | 'rascunho'::text |
| data_inicio | date | Não | CURRENT_DATE |
| previsao_entrega | date | Sim | — |
| concluida_em | timestamptz | Sim | — |
| equipamento | text | Sim | — |
| marca | text | Sim | — |
| modelo | text | Sim | — |
| numero_serie | text | Sim | — |
| problema_informado | text | Sim | — |
| diagnostico | text | Sim | — |
| observacoes_publicas | text | Sim | — |
| observacoes_internas | text | Sim | — |
| subtotal | numeric(18,2) | Não | 0 |
| desconto | numeric(18,2) | Não | 0 |
| total | numeric(18,2) | Não | 0 |
| orcamento_id | int8 | Sim | — |
| venda_id | int8 | Sim | — |
| chave_idempotencia | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| versao | int4 | Não | 1 |

Restrições e relacionamentos:

```sql
ordens_servico_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
ordens_servico_cliente_fk: FOREIGN KEY (tenant_id, cliente_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
ordens_servico_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
ordens_servico_datas_chk: CHECK (((previsao_entrega IS NULL) OR (previsao_entrega >= data_inicio)))
ordens_servico_metadata_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
ordens_servico_orcamento_fk: FOREIGN KEY (tenant_id, orcamento_id) REFERENCES erp.vendas(tenant_id, id) ON DELETE RESTRICT
ordens_servico_pkey: PRIMARY KEY (id)
ordens_servico_responsavel_fk: FOREIGN KEY (tenant_id, responsavel_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
ordens_servico_status_chk: CHECK ((status = ANY (ARRAY['rascunho'::text, 'orcamento_pendente'::text, 'aprovada'::text, 'em_execucao'::text, 'concluida'::text, 'cancelada'::text])))
ordens_servico_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
ordens_servico_tenant_id_id_key: UNIQUE (tenant_id, id)
ordens_servico_valores_chk: CHECK (((subtotal >= (0)::numeric) AND (desconto >= (0)::numeric) AND (total >= (0)::numeric)))
ordens_servico_venda_fk: FOREIGN KEY (tenant_id, venda_id) REFERENCES erp.vendas(tenant_id, id) ON DELETE RESTRICT
```

Índices:

```sql
CREATE UNIQUE INDEX ordens_servico_idempotencia_idx ON erp.ordens_servico USING btree (tenant_id, chave_idempotencia) WHERE ((chave_idempotencia IS NOT NULL) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX ordens_servico_numero_unico_idx ON erp.ordens_servico USING btree (tenant_id, numero) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX ordens_servico_pkey ON erp.ordens_servico USING btree (id)
CREATE INDEX ordens_servico_status_idx ON erp.ordens_servico USING btree (tenant_id, status, previsao_entrega) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX ordens_servico_tenant_id_id_key ON erp.ordens_servico USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.ordens_servico FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
```

## erp.ordens_servico_eventos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| ordem_servico_id | int8 | Não | — |
| evento | text | Não | — |
| status_anterior | text | Sim | — |
| status_novo | text | Sim | — |
| dados | jsonb | Não | '{}'::jsonb |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
ordens_servico_eventos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
ordens_servico_eventos_dados_chk: CHECK ((jsonb_typeof(dados) = 'object'::text))
ordens_servico_eventos_ordem_fk: FOREIGN KEY (tenant_id, ordem_servico_id) REFERENCES erp.ordens_servico(tenant_id, id) ON DELETE CASCADE
ordens_servico_eventos_pkey: PRIMARY KEY (id)
ordens_servico_eventos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
ordens_servico_eventos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX ordens_servico_eventos_pkey ON erp.ordens_servico_eventos USING btree (id)
CREATE UNIQUE INDEX ordens_servico_eventos_tenant_id_id_key ON erp.ordens_servico_eventos USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
```

## erp.ordens_servico_itens

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| ordem_servico_id | int8 | Não | — |
| produto_id | int8 | Sim | — |
| servico_id | int8 | Sim | — |
| descricao | text | Não | — |
| quantidade | numeric(18,4) | Não | 1 |
| valor_unitario | numeric(18,4) | Não | 0 |
| desconto | numeric(18,2) | Não | 0 |
| total | numeric(18,2) | Não | 0 |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
ordens_servico_itens_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
ordens_servico_itens_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
ordens_servico_itens_ordem_fk: FOREIGN KEY (tenant_id, ordem_servico_id) REFERENCES erp.ordens_servico(tenant_id, id) ON DELETE CASCADE
ordens_servico_itens_origem_chk: CHECK (((((produto_id IS NOT NULL))::integer + ((servico_id IS NOT NULL))::integer) = 1))
ordens_servico_itens_pkey: PRIMARY KEY (id)
ordens_servico_itens_produto_fk: FOREIGN KEY (tenant_id, produto_id) REFERENCES erp.produtos(tenant_id, id) ON DELETE RESTRICT
ordens_servico_itens_servico_fk: FOREIGN KEY (tenant_id, servico_id) REFERENCES erp.servicos(tenant_id, id) ON DELETE RESTRICT
ordens_servico_itens_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
ordens_servico_itens_tenant_id_id_key: UNIQUE (tenant_id, id)
ordens_servico_itens_valores_chk: CHECK (((quantidade > (0)::numeric) AND (valor_unitario >= (0)::numeric) AND (desconto >= (0)::numeric) AND (total >= (0)::numeric)))
```

Índices:

```sql
CREATE UNIQUE INDEX ordens_servico_itens_pkey ON erp.ordens_servico_itens USING btree (id)
CREATE UNIQUE INDEX ordens_servico_itens_tenant_id_id_key ON erp.ordens_servico_itens USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.ordens_servico_itens FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
```

## erp.pagamentos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| tipo | text | Não | — |
| conta_receber_parcela_id | int8 | Sim | — |
| conta_pagar_parcela_id | int8 | Sim | — |
| conta_financeira_id | int8 | Não | — |
| metodo_pagamento_id | int8 | Sim | — |
| data_pagamento | date | Não | — |
| data_credito | date | Sim | — |
| valor | numeric(18,2) | Não | 0 |
| juros | numeric(18,2) | Não | 0 |
| multa | numeric(18,2) | Não | 0 |
| desconto | numeric(18,2) | Não | 0 |
| taxa | numeric(18,2) | Não | 0 |
| valor_liquido | numeric(18,2) | Não | 0 |
| nsu | text | Sim | — |
| conciliado | bool | Não | false |
| observacoes | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| estornado_em | timestamptz | Sim | — |
| estorno_de_pagamento_id | int8 | Sim | — |
| origem | text | Não | 'manual'::text |
| chave_idempotencia | text | Sim | — |
| motivo_estorno | text | Sim | — |

Restrições e relacionamentos:

```sql
pagamentos_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
pagamentos_chave_idempotencia_chk: CHECK (((chave_idempotencia IS NULL) OR (btrim(chave_idempotencia) <> ''::text)))
pagamentos_conta_financeira_fk: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
pagamentos_conta_pagar_parcela_fk: FOREIGN KEY (tenant_id, conta_pagar_parcela_id) REFERENCES erp.contas_pagar_parcelas(tenant_id, id) ON DELETE RESTRICT
pagamentos_conta_receber_parcela_fk: FOREIGN KEY (tenant_id, conta_receber_parcela_id) REFERENCES erp.contas_receber_parcelas(tenant_id, id) ON DELETE RESTRICT
pagamentos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
pagamentos_estorno_fk: FOREIGN KEY (tenant_id, estorno_de_pagamento_id) REFERENCES erp.pagamentos(tenant_id, id) ON DELETE RESTRICT
pagamentos_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
pagamentos_metodo_pagamento_fk: FOREIGN KEY (tenant_id, metodo_pagamento_id) REFERENCES erp.metodos_pagamento(tenant_id, id) ON DELETE RESTRICT
pagamentos_origem_chk: CHECK ((((tipo = 'receber'::text) AND (conta_receber_parcela_id IS NOT NULL) AND (conta_pagar_parcela_id IS NULL)) OR ((tipo = 'pagar'::text) AND (conta_pagar_parcela_id IS NOT NULL) AND (conta_receber_parcela_id IS NULL))))
pagamentos_origem_operacional_chk: CHECK ((origem = ANY (ARRAY['manual'::text, 'conciliacao'::text, 'boleto'::text, 'pix'::text, 'cartao'::text, 'api'::text, 'estorno'::text])))
pagamentos_pkey: PRIMARY KEY (id)
pagamentos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
pagamentos_tenant_id_id_key: UNIQUE (tenant_id, id)
pagamentos_tipo_chk: CHECK ((tipo = ANY (ARRAY['receber'::text, 'pagar'::text])))
pagamentos_valores_chk: CHECK (((valor >= (0)::numeric) AND (juros >= (0)::numeric) AND (multa >= (0)::numeric) AND (desconto >= (0)::numeric) AND (taxa >= (0)::numeric) AND (valor_liquido >= (0)::numeric)))
```

Índices:

```sql
CREATE UNIQUE INDEX pagamentos_chave_idempotencia_unica_idx ON erp.pagamentos USING btree (tenant_id, chave_idempotencia) WHERE ((chave_idempotencia IS NOT NULL) AND (excluido_em IS NULL))
CREATE INDEX pagamentos_conta_financeira_idx ON erp.pagamentos USING btree (tenant_id, conta_financeira_id, data_pagamento DESC) WHERE (excluido_em IS NULL)
CREATE INDEX pagamentos_data_idx ON erp.pagamentos USING btree (tenant_id, data_pagamento DESC, tipo) WHERE (excluido_em IS NULL)
CREATE INDEX pagamentos_estorno_idx ON erp.pagamentos USING btree (tenant_id, estorno_de_pagamento_id) WHERE (estorno_de_pagamento_id IS NOT NULL)
CREATE UNIQUE INDEX pagamentos_pkey ON erp.pagamentos USING btree (id)
CREATE UNIQUE INDEX pagamentos_tenant_id_id_key ON erp.pagamentos USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.pagamentos FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE TRIGGER validar_periodo_operacional_aberto BEFORE INSERT OR UPDATE ON erp.pagamentos FOR EACH ROW EXECUTE FUNCTION erp.validar_periodo_operacional_aberto()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.produtos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| nome | text | Não | — |
| codigo | text | Sim | — |
| sku | text | Sim | — |
| codigo_barras | text | Sim | — |
| descricao | text | Sim | — |
| unidade_medida | text | Sim | — |
| preco_venda | numeric(18,2) | Não | 0 |
| custo | numeric(18,2) | Não | 0 |
| categoria_id | int8 | Sim | — |
| centro_custo_id | int8 | Sim | — |
| formato | text | Não | 'simples'::text |
| origem | text | Sim | — |
| tipo_produto | text | Sim | — |
| peso_bruto | numeric(18,3) | Sim | — |
| peso_liquido | numeric(18,3) | Sim | — |
| altura | numeric(18,3) | Sim | — |
| largura | numeric(18,3) | Sim | — |
| profundidade | numeric(18,3) | Sim | — |
| ativo | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| versao | int4 | Não | 1 |
| ponto_reposicao | numeric(18,4) | Não | 0 |

Restrições e relacionamentos:

```sql
produtos_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
produtos_categoria_fk: FOREIGN KEY (tenant_id, categoria_id) REFERENCES erp.categorias(tenant_id, id) ON DELETE RESTRICT
produtos_centro_custo_fk: FOREIGN KEY (tenant_id, centro_custo_id) REFERENCES erp.centros_custo(tenant_id, id) ON DELETE RESTRICT
produtos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
produtos_formato_chk: CHECK ((formato = ANY (ARRAY['simples'::text, 'variacao'::text])))
produtos_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
produtos_pkey: PRIMARY KEY (id)
produtos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
produtos_tenant_id_id_key: UNIQUE (tenant_id, id)
produtos_valores_chk: CHECK (((preco_venda >= (0)::numeric) AND (custo >= (0)::numeric) AND ((peso_bruto IS NULL) OR (peso_bruto >= (0)::numeric)) AND ((peso_liquido IS NULL) OR (peso_liquido >= (0)::numeric)) AND ((altura IS NULL) OR (altura >= (0)::numeric)) AND ((largura IS NULL) OR (largura >= (0)::numeric)) AND ((profundidade IS NULL) OR (profundidade >= (0)::numeric))))
produtos_versao_chk: CHECK ((versao > 0))
```

Índices:

```sql
CREATE UNIQUE INDEX produtos_codigo_unico_idx ON erp.produtos USING btree (tenant_id, codigo) WHERE ((codigo IS NOT NULL) AND (codigo <> ''::text) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX produtos_pkey ON erp.produtos USING btree (id)
CREATE UNIQUE INDEX produtos_sku_unico_idx ON erp.produtos USING btree (tenant_id, sku) WHERE ((sku IS NOT NULL) AND (sku <> ''::text) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX produtos_tenant_id_id_key ON erp.produtos USING btree (tenant_id, id)
CREATE INDEX produtos_tenant_nome_idx ON erp.produtos USING btree (tenant_id, nome) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.produtos FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
```

## erp.rateios_financeiros

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| tipo | text | Não | — |
| conta_receber_id | int8 | Sim | — |
| conta_pagar_id | int8 | Sim | — |
| categoria_id | int8 | Sim | — |
| centro_custo_id | int8 | Sim | — |
| valor | numeric(18,2) | Sim | — |
| percentual | numeric(9,4) | Sim | — |
| observacoes | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
rateios_financeiros_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
rateios_financeiros_categoria_fk: FOREIGN KEY (tenant_id, categoria_id) REFERENCES erp.categorias(tenant_id, id) ON DELETE RESTRICT
rateios_financeiros_centro_custo_fk: FOREIGN KEY (tenant_id, centro_custo_id) REFERENCES erp.centros_custo(tenant_id, id) ON DELETE RESTRICT
rateios_financeiros_conta_pagar_fk: FOREIGN KEY (tenant_id, conta_pagar_id) REFERENCES erp.contas_pagar(tenant_id, id) ON DELETE CASCADE
rateios_financeiros_conta_receber_fk: FOREIGN KEY (tenant_id, conta_receber_id) REFERENCES erp.contas_receber(tenant_id, id) ON DELETE CASCADE
rateios_financeiros_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
rateios_financeiros_dimensao_chk: CHECK (((categoria_id IS NOT NULL) OR (centro_custo_id IS NOT NULL)))
rateios_financeiros_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
rateios_financeiros_origem_chk: CHECK ((((tipo = 'receber'::text) AND (conta_receber_id IS NOT NULL) AND (conta_pagar_id IS NULL)) OR ((tipo = 'pagar'::text) AND (conta_pagar_id IS NOT NULL) AND (conta_receber_id IS NULL))))
rateios_financeiros_pkey: PRIMARY KEY (id)
rateios_financeiros_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
rateios_financeiros_tenant_id_id_key: UNIQUE (tenant_id, id)
rateios_financeiros_tipo_chk: CHECK ((tipo = ANY (ARRAY['receber'::text, 'pagar'::text])))
rateios_financeiros_valor_chk: CHECK ((((valor IS NOT NULL) OR (percentual IS NOT NULL)) AND ((valor IS NULL) OR (valor >= (0)::numeric)) AND ((percentual IS NULL) OR ((percentual >= (0)::numeric) AND (percentual <= (100)::numeric)))))
```

Índices:

```sql
CREATE INDEX rateios_financeiros_categoria_centro_idx ON erp.rateios_financeiros USING btree (tenant_id, categoria_id, centro_custo_id) WHERE (excluido_em IS NULL)
CREATE INDEX rateios_financeiros_pagar_idx ON erp.rateios_financeiros USING btree (tenant_id, conta_pagar_id) WHERE ((conta_pagar_id IS NOT NULL) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX rateios_financeiros_pkey ON erp.rateios_financeiros USING btree (id)
CREATE INDEX rateios_financeiros_receber_idx ON erp.rateios_financeiros USING btree (tenant_id, conta_receber_id) WHERE ((conta_receber_id IS NOT NULL) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX rateios_financeiros_tenant_id_id_key ON erp.rateios_financeiros USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.rateios_financeiros FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.recorrencias_financeiras

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| tipo | text | Não | 'pagar'::text |
| intervalo | int4 | Não | 1 |
| frequencia | text | Não | 'mes'::text |
| inicio_em | date | Não | — |
| termino_tipo | text | Não | 'ocorrencias'::text |
| termino_em | date | Sim | — |
| quantidade_ocorrencias | int4 | Sim | — |
| ativa | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| proxima_competencia | date | Sim | — |
| gerado_ate | date | Sim | — |
| pausada_em | timestamptz | Sim | — |
| encerrada_em | timestamptz | Sim | — |

Restrições e relacionamentos:

```sql
recorrencias_financeiras_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
recorrencias_financeiras_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
recorrencias_financeiras_frequencia_chk: CHECK ((frequencia = ANY (ARRAY['dia'::text, 'semana'::text, 'mes'::text, 'ano'::text])))
recorrencias_financeiras_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
recorrencias_financeiras_pkey: PRIMARY KEY (id)
recorrencias_financeiras_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
recorrencias_financeiras_tenant_id_id_key: UNIQUE (tenant_id, id)
recorrencias_financeiras_termino_chk: CHECK ((termino_tipo = ANY (ARRAY['data'::text, 'ocorrencias'::text, 'indeterminado'::text])))
recorrencias_financeiras_tipo_chk: CHECK ((tipo = ANY (ARRAY['pagar'::text, 'receber'::text])))
recorrencias_financeiras_valores_chk: CHECK (((intervalo > 0) AND ((quantidade_ocorrencias IS NULL) OR ((quantidade_ocorrencias >= 1) AND (quantidade_ocorrencias <= 366)))))
```

Índices:

```sql
CREATE UNIQUE INDEX recorrencias_financeiras_pkey ON erp.recorrencias_financeiras USING btree (id)
CREATE INDEX recorrencias_financeiras_proxima_idx ON erp.recorrencias_financeiras USING btree (tenant_id, proxima_competencia) WHERE ((excluido_em IS NULL) AND ativa AND (pausada_em IS NULL) AND (encerrada_em IS NULL))
CREATE UNIQUE INDEX recorrencias_financeiras_tenant_id_id_key ON erp.recorrencias_financeiras USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.recorrencias_financeiras FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.regras_conciliacao_bancaria

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| conta_financeira_id | int8 | Sim | — |
| nome | text | Não | — |
| correspondencia_exata | bool | Não | true |
| correspondencia_aproximada | bool | Não | true |
| tolerancia_dias | int4 | Não | 5 |
| tolerancia_valor | numeric(18,2) | Não | 0 |
| ativo | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
regras_conciliacao_bancaria_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
regras_conciliacao_bancaria_conta_fk: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE CASCADE
regras_conciliacao_bancaria_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
regras_conciliacao_bancaria_pkey: PRIMARY KEY (id)
regras_conciliacao_bancaria_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
regras_conciliacao_bancaria_tenant_id_id_key: UNIQUE (tenant_id, id)
regras_conciliacao_bancaria_tolerancia_chk: CHECK ((((tolerancia_dias >= 0) AND (tolerancia_dias <= 30)) AND (tolerancia_valor >= (0)::numeric)))
```

Índices:

```sql
CREATE UNIQUE INDEX regras_conciliacao_bancaria_pkey ON erp.regras_conciliacao_bancaria USING btree (id)
CREATE UNIQUE INDEX regras_conciliacao_bancaria_tenant_id_id_key ON erp.regras_conciliacao_bancaria USING btree (tenant_id, id)
CREATE UNIQUE INDEX regras_conciliacao_conta_unica_idx ON erp.regras_conciliacao_bancaria USING btree (tenant_id, COALESCE(conta_financeira_id, (0)::bigint)) WHERE ((excluido_em IS NULL) AND (ativo = true))
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.regras_conciliacao_bancaria FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.servicos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| nome | text | Não | — |
| codigo | text | Sim | — |
| descricao | text | Sim | — |
| preco | numeric(18,2) | Não | 0 |
| custo | numeric(18,2) | Não | 0 |
| categoria_id | int8 | Sim | — |
| centro_custo_id | int8 | Sim | — |
| tipo_servico | text | Sim | — |
| ativo | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| versao | int4 | Não | 1 |

Restrições e relacionamentos:

```sql
servicos_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
servicos_categoria_fk: FOREIGN KEY (tenant_id, categoria_id) REFERENCES erp.categorias(tenant_id, id) ON DELETE RESTRICT
servicos_centro_custo_fk: FOREIGN KEY (tenant_id, centro_custo_id) REFERENCES erp.centros_custo(tenant_id, id) ON DELETE RESTRICT
servicos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
servicos_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
servicos_pkey: PRIMARY KEY (id)
servicos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
servicos_tenant_id_id_key: UNIQUE (tenant_id, id)
servicos_valores_chk: CHECK (((preco >= (0)::numeric) AND (custo >= (0)::numeric)))
servicos_versao_chk: CHECK ((versao > 0))
```

Índices:

```sql
CREATE UNIQUE INDEX servicos_codigo_unico_idx ON erp.servicos USING btree (tenant_id, codigo) WHERE ((codigo IS NOT NULL) AND (codigo <> ''::text) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX servicos_pkey ON erp.servicos USING btree (id)
CREATE UNIQUE INDEX servicos_tenant_id_id_key ON erp.servicos USING btree (tenant_id, id)
CREATE INDEX servicos_tenant_nome_idx ON erp.servicos USING btree (tenant_id, nome) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.servicos FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
DELETE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'::text)
```

## erp.transacoes_bancarias

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| conta_financeira_id | int8 | Não | — |
| importacao_bancaria_id | int8 | Sim | — |
| identificador_externo | text | Sim | — |
| data_transacao | date | Não | — |
| data_compensacao | date | Sim | — |
| tipo | text | Não | — |
| valor | numeric(18,2) | Não | — |
| descricao | text | Não | — |
| documento | text | Sim | — |
| contraparte | text | Sim | — |
| saldo_apos | numeric(18,2) | Sim | — |
| status | text | Não | 'pendente'::text |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
transacoes_bancarias_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
transacoes_bancarias_conta_fk: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
transacoes_bancarias_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
transacoes_bancarias_importacao_fk: FOREIGN KEY (tenant_id, importacao_bancaria_id) REFERENCES erp.importacoes_bancarias(tenant_id, id) ON DELETE SET NULL
transacoes_bancarias_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
transacoes_bancarias_pkey: PRIMARY KEY (id)
transacoes_bancarias_status_chk: CHECK ((status = ANY (ARRAY['pendente'::text, 'conciliada'::text, 'ignorada'::text])))
transacoes_bancarias_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
transacoes_bancarias_tenant_id_id_key: UNIQUE (tenant_id, id)
transacoes_bancarias_tipo_chk: CHECK ((tipo = ANY (ARRAY['credito'::text, 'debito'::text])))
transacoes_bancarias_valor_chk: CHECK ((valor > (0)::numeric))
```

Índices:

```sql
CREATE UNIQUE INDEX transacoes_bancarias_externa_idx ON erp.transacoes_bancarias USING btree (tenant_id, conta_financeira_id, identificador_externo) WHERE ((identificador_externo IS NOT NULL) AND (excluido_em IS NULL))
CREATE INDEX transacoes_bancarias_pendentes_idx ON erp.transacoes_bancarias USING btree (tenant_id, conta_financeira_id, data_transacao DESC) WHERE ((status = 'pendente'::text) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX transacoes_bancarias_pkey ON erp.transacoes_bancarias USING btree (id)
CREATE UNIQUE INDEX transacoes_bancarias_tenant_id_id_key ON erp.transacoes_bancarias USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.transacoes_bancarias FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE TRIGGER validar_periodo_operacional_aberto BEFORE INSERT OR UPDATE ON erp.transacoes_bancarias FOR EACH ROW EXECUTE FUNCTION erp.validar_periodo_operacional_aberto()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.transferencias_financeiras

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| conta_origem_id | int8 | Não | — |
| conta_destino_id | int8 | Não | — |
| data_transferencia | date | Não | CURRENT_DATE |
| valor | numeric(18,2) | Não | 0 |
| descricao | text | Sim | — |
| status | text | Não | 'pendente'::text |
| observacoes | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
transferencias_financeiras_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
transferencias_financeiras_conta_destino_fk: FOREIGN KEY (tenant_id, conta_destino_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
transferencias_financeiras_conta_origem_fk: FOREIGN KEY (tenant_id, conta_origem_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
transferencias_financeiras_contas_diferentes_chk: CHECK ((conta_origem_id <> conta_destino_id))
transferencias_financeiras_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
transferencias_financeiras_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
transferencias_financeiras_pkey: PRIMARY KEY (id)
transferencias_financeiras_status_chk: CHECK ((status = ANY (ARRAY['pendente'::text, 'concluida'::text, 'cancelada'::text])))
transferencias_financeiras_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
transferencias_financeiras_tenant_id_id_key: UNIQUE (tenant_id, id)
transferencias_financeiras_valor_chk: CHECK ((valor > (0)::numeric))
```

Índices:

```sql
CREATE INDEX transferencias_financeiras_data_idx ON erp.transferencias_financeiras USING btree (tenant_id, data_transferencia DESC, status) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX transferencias_financeiras_pkey ON erp.transferencias_financeiras USING btree (id)
CREATE UNIQUE INDEX transferencias_financeiras_tenant_id_id_key ON erp.transferencias_financeiras USING btree (tenant_id, id)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.transferencias_financeiras FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE TRIGGER validar_periodo_operacional_aberto BEFORE INSERT OR UPDATE ON erp.transferencias_financeiras FOR EACH ROW EXECUTE FUNCTION erp.validar_periodo_operacional_aberto()
DELETE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'::text)
```

## erp.vendas

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| cliente_id | int8 | Não | — |
| vendedor_id | int8 | Sim | — |
| numero | text | Não | — |
| data_venda | date | Não | CURRENT_DATE |
| data_competencia | date | Sim | — |
| status | text | Não | 'rascunho'::text |
| situacao | text | Sim | — |
| origem | text | Sim | — |
| categoria_id | int8 | Sim | — |
| centro_custo_id | int8 | Sim | — |
| conta_financeira_id | int8 | Sim | — |
| metodo_pagamento_id | int8 | Sim | — |
| subtotal | numeric(18,2) | Não | 0 |
| tipo_desconto | text | Sim | — |
| desconto | numeric(18,2) | Não | 0 |
| frete | numeric(18,2) | Não | 0 |
| total | numeric(18,2) | Não | 0 |
| condicao_pagamento | jsonb | Não | '{}'::jsonb |
| nsu | text | Sim | — |
| observacoes | text | Sim | — |
| observacoes_pagamento | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| confirmada_em | timestamptz | Sim | — |
| atendida_em | timestamptz | Sim | — |
| cancelada_em | timestamptz | Sim | — |
| cobranca_emails | _text | Não | ARRAY[]::text[] |
| cobranca_whatsapp | text | Sim | — |
| configuracao_lembretes | jsonb | Não | '{}'::jsonb |
| chave_idempotencia | text | Sim | — |
| versao | int4 | Não | 1 |
| tipo_documento | text | Não | 'venda'::text |
| venda_origem_id | int8 | Sim | — |
| validade_em | date | Sim | — |
| previsao_entrega | date | Sim | — |
| enviada_em | timestamptz | Sim | — |
| recusada_em | timestamptz | Sim | — |
| atendimento_status | text | Não | 'pendente'::text |

Restrições e relacionamentos:

```sql
validar_documento_diferido: TRIGGER DEFERRABLE INITIALLY DEFERRED
vendas_atendimento_status_chk: CHECK ((atendimento_status = ANY (ARRAY['pendente'::text, 'parcial'::text, 'atendido'::text, 'nao_aplicavel'::text, 'cancelado'::text])))
vendas_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
vendas_categoria_fk: FOREIGN KEY (tenant_id, categoria_id) REFERENCES erp.categorias(tenant_id, id) ON DELETE RESTRICT
vendas_centro_custo_fk: FOREIGN KEY (tenant_id, centro_custo_id) REFERENCES erp.centros_custo(tenant_id, id) ON DELETE RESTRICT
vendas_chave_idempotencia_chk: CHECK (((chave_idempotencia IS NULL) OR (btrim(chave_idempotencia) <> ''::text)))
vendas_cliente_fk: FOREIGN KEY (tenant_id, cliente_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
vendas_condicao_pagamento_object_chk: CHECK ((jsonb_typeof(condicao_pagamento) = 'object'::text))
vendas_configuracao_lembretes_object_chk: CHECK ((jsonb_typeof(configuracao_lembretes) = 'object'::text))
vendas_conta_financeira_fk: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
vendas_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
vendas_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
vendas_metodo_pagamento_fk: FOREIGN KEY (tenant_id, metodo_pagamento_id) REFERENCES erp.metodos_pagamento(tenant_id, id) ON DELETE RESTRICT
vendas_origem_documento_fk: FOREIGN KEY (tenant_id, venda_origem_id) REFERENCES erp.vendas(tenant_id, id) ON DELETE RESTRICT
vendas_pkey: PRIMARY KEY (id)
vendas_status_chk: CHECK ((status = ANY (ARRAY['rascunho'::text, 'confirmada'::text, 'cancelada'::text])))
vendas_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
vendas_tenant_id_id_key: UNIQUE (tenant_id, id)
vendas_tipo_desconto_chk: CHECK (((tipo_desconto IS NULL) OR (tipo_desconto = ANY (ARRAY['valor'::text, 'percentual'::text]))))
vendas_tipo_documento_chk: CHECK ((tipo_documento = ANY (ARRAY['orcamento'::text, 'pedido'::text, 'venda'::text])))
vendas_valores_chk: CHECK (((subtotal >= (0)::numeric) AND (desconto >= (0)::numeric) AND (frete >= (0)::numeric) AND (total >= (0)::numeric)))
vendas_vendedor_fk: FOREIGN KEY (tenant_id, vendedor_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
vendas_versao_chk: CHECK ((versao > 0))
```

Índices:

```sql
CREATE UNIQUE INDEX vendas_chave_idempotencia_unica_idx ON erp.vendas USING btree (tenant_id, chave_idempotencia) WHERE ((chave_idempotencia IS NOT NULL) AND (excluido_em IS NULL))
CREATE INDEX vendas_cliente_data_idx ON erp.vendas USING btree (tenant_id, cliente_id, data_venda DESC) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX vendas_numero_unico_idx ON erp.vendas USING btree (tenant_id, numero) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX vendas_origem_documento_unica_idx ON erp.vendas USING btree (tenant_id, venda_origem_id) WHERE ((venda_origem_id IS NOT NULL) AND (excluido_em IS NULL))
CREATE UNIQUE INDEX vendas_pkey ON erp.vendas USING btree (id)
CREATE INDEX vendas_status_data_idx ON erp.vendas USING btree (tenant_id, status, data_venda DESC) WHERE (excluido_em IS NULL)
CREATE INDEX vendas_tenant_atendimento_status_idx ON erp.vendas USING btree (tenant_id, atendimento_status, data_venda DESC) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX vendas_tenant_id_id_key ON erp.vendas USING btree (tenant_id, id)
CREATE INDEX vendas_tipo_documento_idx ON erp.vendas USING btree (tenant_id, tipo_documento, status, data_venda DESC) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.vendas FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE CONSTRAINT TRIGGER validar_documento_diferido AFTER INSERT OR DELETE OR UPDATE ON erp.vendas DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_documento_diferido()
CREATE TRIGGER validar_periodo_operacional_aberto BEFORE INSERT OR UPDATE ON erp.vendas FOR EACH ROW EXECUTE FUNCTION erp.validar_periodo_operacional_aberto()
DELETE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
```

## erp.vendas_eventos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| venda_id | int8 | Não | — |
| evento | text | Não | — |
| status_anterior | text | Sim | — |
| status_novo | text | Sim | — |
| versao | int4 | Não | — |
| dados | jsonb | Não | '{}'::jsonb |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
vendas_eventos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
vendas_eventos_dados_object_chk: CHECK ((jsonb_typeof(dados) = 'object'::text))
vendas_eventos_pkey: PRIMARY KEY (id)
vendas_eventos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
vendas_eventos_tenant_id_id_key: UNIQUE (tenant_id, id)
vendas_eventos_venda_fk: FOREIGN KEY (tenant_id, venda_id) REFERENCES erp.vendas(tenant_id, id) ON DELETE CASCADE
vendas_eventos_versao_chk: CHECK ((versao > 0))
```

Índices:

```sql
CREATE UNIQUE INDEX vendas_eventos_pkey ON erp.vendas_eventos USING btree (id)
CREATE UNIQUE INDEX vendas_eventos_tenant_id_id_key ON erp.vendas_eventos USING btree (tenant_id, id)
CREATE INDEX vendas_eventos_venda_idx ON erp.vendas_eventos USING btree (tenant_id, venda_id, criado_em DESC)
```

Gatilhos e políticas:

```text
CREATE TRIGGER bloquear_mutacao_evento BEFORE DELETE OR UPDATE ON erp.vendas_eventos FOR EACH ROW EXECUTE FUNCTION erp.bloquear_mutacao_evento()
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
```

## erp.vendas_itens

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| venda_id | int8 | Não | — |
| produto_id | int8 | Sim | — |
| servico_id | int8 | Sim | — |
| descricao | text | Não | — |
| quantidade | numeric(18,4) | Não | 1 |
| valor_unitario | numeric(18,4) | Não | 0 |
| custo_unitario | numeric(18,4) | Não | 0 |
| desconto | numeric(18,2) | Não | 0 |
| total | numeric(18,2) | Não | 0 |
| centro_custo_id | int8 | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |
| quantidade_atendida | numeric(18,4) | Não | 0 |

Restrições e relacionamentos:

```sql
validar_documento_diferido: TRIGGER DEFERRABLE INITIALLY DEFERRED
vendas_itens_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
vendas_itens_centro_custo_fk: FOREIGN KEY (tenant_id, centro_custo_id) REFERENCES erp.centros_custo(tenant_id, id) ON DELETE RESTRICT
vendas_itens_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
vendas_itens_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
vendas_itens_origem_chk: CHECK ((((produto_id IS NOT NULL) AND (servico_id IS NULL)) OR ((produto_id IS NULL) AND (servico_id IS NOT NULL))))
vendas_itens_pkey: PRIMARY KEY (id)
vendas_itens_produto_fk: FOREIGN KEY (tenant_id, produto_id) REFERENCES erp.produtos(tenant_id, id) ON DELETE RESTRICT
vendas_itens_quantidade_atendida_chk: CHECK (((quantidade_atendida >= (0)::numeric) AND (quantidade_atendida <= quantidade)))
vendas_itens_servico_fk: FOREIGN KEY (tenant_id, servico_id) REFERENCES erp.servicos(tenant_id, id) ON DELETE RESTRICT
vendas_itens_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
vendas_itens_tenant_id_id_key: UNIQUE (tenant_id, id)
vendas_itens_valores_chk: CHECK (((quantidade > (0)::numeric) AND (valor_unitario >= (0)::numeric) AND (custo_unitario >= (0)::numeric) AND (desconto >= (0)::numeric) AND (total >= (0)::numeric)))
vendas_itens_venda_fk: FOREIGN KEY (tenant_id, venda_id) REFERENCES erp.vendas(tenant_id, id) ON DELETE CASCADE
```

Índices:

```sql
CREATE UNIQUE INDEX vendas_itens_pkey ON erp.vendas_itens USING btree (id)
CREATE UNIQUE INDEX vendas_itens_tenant_id_id_key ON erp.vendas_itens USING btree (tenant_id, id)
CREATE INDEX vendas_itens_venda_idx ON erp.vendas_itens USING btree (tenant_id, venda_id) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.vendas_itens FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE CONSTRAINT TRIGGER validar_documento_diferido AFTER INSERT OR DELETE OR UPDATE ON erp.vendas_itens DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_documento_diferido()
DELETE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
```

## erp.vendas_recebimentos_previstos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | — |
| tenant_id | int8 | Não | — |
| venda_id | int8 | Não | — |
| numero_parcela | int4 | Não | — |
| descricao | text | Sim | — |
| data_vencimento | date | Não | — |
| valor | numeric(18,2) | Não | — |
| conta_financeira_id | int8 | Sim | — |
| metodo_pagamento_id | int8 | Sim | — |
| criado_em | timestamptz | Não | now() |
| atualizado_em | timestamptz | Não | now() |
| excluido_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |
| atualizado_por | int8 | Sim | — |
| metadata | jsonb | Não | '{}'::jsonb |

Restrições e relacionamentos:

```sql
validar_documento_diferido: TRIGGER DEFERRABLE INITIALLY DEFERRED
vendas_recebimentos_previstos_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES shared.users(id) ON DELETE SET NULL
vendas_recebimentos_previstos_conta_fk: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
vendas_recebimentos_previstos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE SET NULL
vendas_recebimentos_previstos_metadata_object_chk: CHECK ((jsonb_typeof(metadata) = 'object'::text))
vendas_recebimentos_previstos_metodo_fk: FOREIGN KEY (tenant_id, metodo_pagamento_id) REFERENCES erp.metodos_pagamento(tenant_id, id) ON DELETE RESTRICT
vendas_recebimentos_previstos_pkey: PRIMARY KEY (id)
vendas_recebimentos_previstos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
vendas_recebimentos_previstos_tenant_id_id_key: UNIQUE (tenant_id, id)
vendas_recebimentos_previstos_valores_chk: CHECK (((numero_parcela > 0) AND (valor > (0)::numeric)))
vendas_recebimentos_previstos_venda_fk: FOREIGN KEY (tenant_id, venda_id) REFERENCES erp.vendas(tenant_id, id) ON DELETE CASCADE
```

Índices:

```sql
CREATE UNIQUE INDEX vendas_recebimentos_previstos_numero_unico_idx ON erp.vendas_recebimentos_previstos USING btree (tenant_id, venda_id, numero_parcela) WHERE (excluido_em IS NULL)
CREATE UNIQUE INDEX vendas_recebimentos_previstos_pkey ON erp.vendas_recebimentos_previstos USING btree (id)
CREATE UNIQUE INDEX vendas_recebimentos_previstos_tenant_id_id_key ON erp.vendas_recebimentos_previstos USING btree (tenant_id, id)
CREATE INDEX vendas_recebimentos_previstos_venda_idx ON erp.vendas_recebimentos_previstos USING btree (tenant_id, venda_id, data_vencimento) WHERE (excluido_em IS NULL)
```

Gatilhos e políticas:

```text
CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.vendas_recebimentos_previstos FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()
CREATE CONSTRAINT TRIGGER validar_documento_diferido AFTER INSERT OR DELETE OR UPDATE ON erp.vendas_recebimentos_previstos DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_documento_diferido()
DELETE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK 
INSERT:  WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
SELECT: shared.is_tenant_member(tenant_id) WITH CHECK 
UPDATE: shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text) WITH CHECK shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'::text)
```
