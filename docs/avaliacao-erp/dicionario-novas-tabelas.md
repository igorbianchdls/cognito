# Dicionário das 14 novas tabelas

Fonte: catálogo verificado após a migração 20260909030000. Regras transacionais e limites: [implementação](implementacao-novas-tabelas.md).

## erp.adiantamentos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| entidade_id | int8 | Não | — |
| lado | text | Não | — |
| tipo | text | Não | — |
| adiantamento_id | int8 | Sim | — |
| reversao_de_id | int8 | Sim | — |
| conta_financeira_id | int8 | Não | — |
| metodo_pagamento_id | int8 | Sim | — |
| data_movimento | date | Não | — |
| data_credito | date | Sim | — |
| valor | numeric(18,2) | Não | — |
| motivo | text | Não | — |
| chave_idempotencia | text | Não | — |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |
| requisicao_original | jsonb | Sim | — |

Restrições e relacionamentos:

```sql
adiantamentos_chave_idempotencia_check: CHECK ((btrim(chave_idempotencia) <> ''::text))
adiantamentos_check: CHECK ((((tipo = 'constituicao'::text) AND (adiantamento_id IS NULL) AND (reversao_de_id IS NULL)) OR ((tipo = 'devolucao'::text) AND (adiantamento_id IS NOT NULL) AND (reversao_de_id IS NULL)) OR ((tipo = 'reversao'::text) AND (adiantamento_id IS NOT NULL) AND (reversao_de_id IS NOT NULL))))
adiantamentos_check1: CHECK (((id IS DISTINCT FROM adiantamento_id) AND (id IS DISTINCT FROM reversao_de_id)))
adiantamentos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE RESTRICT
adiantamentos_lado_check: CHECK ((lado = ANY (ARRAY['receber'::text, 'pagar'::text])))
adiantamentos_motivo_check: CHECK ((btrim(motivo) <> ''::text))
adiantamentos_pkey: PRIMARY KEY (id)
adiantamentos_tenant_id_adiantamento_id_fkey: FOREIGN KEY (tenant_id, adiantamento_id) REFERENCES erp.adiantamentos(tenant_id, id) ON DELETE RESTRICT
adiantamentos_tenant_id_chave_idempotencia_key: UNIQUE (tenant_id, chave_idempotencia)
adiantamentos_tenant_id_conta_financeira_id_fkey: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
adiantamentos_tenant_id_entidade_id_fkey: FOREIGN KEY (tenant_id, entidade_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
adiantamentos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
adiantamentos_tenant_id_id_key: UNIQUE (tenant_id, id)
adiantamentos_tenant_id_metodo_pagamento_id_fkey: FOREIGN KEY (tenant_id, metodo_pagamento_id) REFERENCES erp.metodos_pagamento(tenant_id, id) ON DELETE RESTRICT
adiantamentos_tenant_id_reversao_de_id_fkey: FOREIGN KEY (tenant_id, reversao_de_id) REFERENCES erp.adiantamentos(tenant_id, id) ON DELETE RESTRICT
adiantamentos_tenant_id_reversao_de_id_key: UNIQUE (tenant_id, reversao_de_id)
adiantamentos_tipo_check: CHECK ((tipo = ANY (ARRAY['constituicao'::text, 'devolucao'::text, 'reversao'::text])))
adiantamentos_valor_check: CHECK ((valor > (0)::numeric))
validar_conciliacao: TRIGGER DEFERRABLE INITIALLY DEFERRED
validar_saldos: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Índices:

```sql
CREATE INDEX adiantamento_entidade_idx ON erp.adiantamentos USING btree (tenant_id, entidade_id, data_movimento);
CREATE INDEX adiantamento_origem_idx ON erp.adiantamentos USING btree (tenant_id, adiantamento_id);
CREATE UNIQUE INDEX adiantamentos_pkey ON erp.adiantamentos USING btree (id);
CREATE UNIQUE INDEX adiantamentos_tenant_id_chave_idempotencia_key ON erp.adiantamentos USING btree (tenant_id, chave_idempotencia);
CREATE UNIQUE INDEX adiantamentos_tenant_id_id_key ON erp.adiantamentos USING btree (tenant_id, id);
CREATE UNIQUE INDEX adiantamentos_tenant_id_reversao_de_id_key ON erp.adiantamentos USING btree (tenant_id, reversao_de_id);
```

## erp.adiantamentos_aplicacoes

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| adiantamento_id | int8 | Não | — |
| conta_receber_parcela_id | int8 | Sim | — |
| conta_pagar_parcela_id | int8 | Sim | — |
| valor | numeric(18,2) | Não | — |
| data_aplicacao | date | Não | — |
| reversao_de_id | int8 | Sim | — |
| motivo | text | Não | — |
| chave_idempotencia | text | Não | — |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |
| requisicao_original | jsonb | Sim | — |

Restrições e relacionamentos:

```sql
adiantamentos_aplicacoes_chave_idempotencia_check: CHECK ((btrim(chave_idempotencia) <> ''::text))
adiantamentos_aplicacoes_check: CHECK ((num_nonnulls(conta_receber_parcela_id, conta_pagar_parcela_id) = 1))
adiantamentos_aplicacoes_check1: CHECK ((id IS DISTINCT FROM reversao_de_id))
adiantamentos_aplicacoes_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE RESTRICT
adiantamentos_aplicacoes_motivo_check: CHECK ((btrim(motivo) <> ''::text))
adiantamentos_aplicacoes_pkey: PRIMARY KEY (id)
adiantamentos_aplicacoes_tenant_id_adiantamento_id_fkey: FOREIGN KEY (tenant_id, adiantamento_id) REFERENCES erp.adiantamentos(tenant_id, id) ON DELETE RESTRICT
adiantamentos_aplicacoes_tenant_id_chave_idempotencia_key: UNIQUE (tenant_id, chave_idempotencia)
adiantamentos_aplicacoes_tenant_id_conta_pagar_parcela_id_fkey: FOREIGN KEY (tenant_id, conta_pagar_parcela_id) REFERENCES erp.contas_pagar_parcelas(tenant_id, id) ON DELETE RESTRICT
adiantamentos_aplicacoes_tenant_id_conta_receber_parcela_i_fkey: FOREIGN KEY (tenant_id, conta_receber_parcela_id) REFERENCES erp.contas_receber_parcelas(tenant_id, id) ON DELETE RESTRICT
adiantamentos_aplicacoes_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
adiantamentos_aplicacoes_tenant_id_id_key: UNIQUE (tenant_id, id)
adiantamentos_aplicacoes_tenant_id_reversao_de_id_fkey: FOREIGN KEY (tenant_id, reversao_de_id) REFERENCES erp.adiantamentos_aplicacoes(tenant_id, id) ON DELETE RESTRICT
adiantamentos_aplicacoes_tenant_id_reversao_de_id_key: UNIQUE (tenant_id, reversao_de_id)
adiantamentos_aplicacoes_valor_check: CHECK ((valor > (0)::numeric))
validar_saldos: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Índices:

```sql
CREATE UNIQUE INDEX adiantamentos_aplicacoes_pkey ON erp.adiantamentos_aplicacoes USING btree (id);
CREATE UNIQUE INDEX adiantamentos_aplicacoes_tenant_id_chave_idempotencia_key ON erp.adiantamentos_aplicacoes USING btree (tenant_id, chave_idempotencia);
CREATE UNIQUE INDEX adiantamentos_aplicacoes_tenant_id_id_key ON erp.adiantamentos_aplicacoes USING btree (tenant_id, id);
CREATE UNIQUE INDEX adiantamentos_aplicacoes_tenant_id_reversao_de_id_key ON erp.adiantamentos_aplicacoes USING btree (tenant_id, reversao_de_id);
CREATE INDEX aplicacao_adiantamento_idx ON erp.adiantamentos_aplicacoes USING btree (tenant_id, adiantamento_id);
CREATE INDEX aplicacao_pagar_idx ON erp.adiantamentos_aplicacoes USING btree (tenant_id, conta_pagar_parcela_id);
CREATE INDEX aplicacao_receber_idx ON erp.adiantamentos_aplicacoes USING btree (tenant_id, conta_receber_parcela_id);
```

## erp.contas_receber_arquivos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| conta_receber_id | int8 | Não | — |
| arquivo_id | int8 | Não | — |
| finalidade | text | Não | — |
| descricao | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
contas_receber_arquivos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE RESTRICT
contas_receber_arquivos_finalidade_check: CHECK ((btrim(finalidade) <> ''::text))
contas_receber_arquivos_pkey: PRIMARY KEY (id)
contas_receber_arquivos_tenant_id_arquivo_id_fkey: FOREIGN KEY (tenant_id, arquivo_id) REFERENCES erp.arquivos(tenant_id, id) ON DELETE RESTRICT
contas_receber_arquivos_tenant_id_conta_receber_id_arquivo__key: UNIQUE (tenant_id, conta_receber_id, arquivo_id)
contas_receber_arquivos_tenant_id_conta_receber_id_fkey: FOREIGN KEY (tenant_id, conta_receber_id) REFERENCES erp.contas_receber(tenant_id, id) ON DELETE RESTRICT
contas_receber_arquivos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contas_receber_arquivos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX contas_receber_arquivos_pkey ON erp.contas_receber_arquivos USING btree (id);
CREATE UNIQUE INDEX contas_receber_arquivos_tenant_id_conta_receber_id_arquivo__key ON erp.contas_receber_arquivos USING btree (tenant_id, conta_receber_id, arquivo_id);
CREATE UNIQUE INDEX contas_receber_arquivos_tenant_id_id_key ON erp.contas_receber_arquivos USING btree (tenant_id, id);
```

## erp.contas_receber_eventos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| conta_receber_id | int8 | Não | — |
| conta_receber_parcela_id | int8 | Sim | — |
| pagamento_id | int8 | Sim | — |
| evento | text | Não | — |
| dados | jsonb | Não | '{}'::jsonb |
| criado_em | timestamptz | Não | now() |
| data_evento | date | Não | CURRENT_DATE |
| criado_por | int8 | Sim | — |
| motivo | text | Sim | — |
| chave_operacao | text | Sim | — |

Restrições e relacionamentos:

```sql
contas_receber_eventos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE RESTRICT
contas_receber_eventos_dados_check: CHECK ((jsonb_typeof(dados) = 'object'::text))
contas_receber_eventos_evento_check: CHECK ((btrim(evento) <> ''::text))
contas_receber_eventos_pkey: PRIMARY KEY (id)
contas_receber_eventos_tenant_id_conta_receber_id_fkey: FOREIGN KEY (tenant_id, conta_receber_id) REFERENCES erp.contas_receber(tenant_id, id) ON DELETE RESTRICT
contas_receber_eventos_tenant_id_conta_receber_parcela_id_fkey: FOREIGN KEY (tenant_id, conta_receber_parcela_id) REFERENCES erp.contas_receber_parcelas(tenant_id, id) ON DELETE RESTRICT
contas_receber_eventos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contas_receber_eventos_tenant_id_id_key: UNIQUE (tenant_id, id)
contas_receber_eventos_tenant_id_pagamento_id_fkey: FOREIGN KEY (tenant_id, pagamento_id) REFERENCES erp.pagamentos(tenant_id, id) ON DELETE RESTRICT
```

Índices:

```sql
CREATE UNIQUE INDEX contas_receber_eventos_operacao_idx ON erp.contas_receber_eventos USING btree (tenant_id, conta_receber_id, chave_operacao, evento) WHERE (chave_operacao IS NOT NULL);
CREATE UNIQUE INDEX contas_receber_eventos_pkey ON erp.contas_receber_eventos USING btree (id);
CREATE UNIQUE INDEX contas_receber_eventos_tenant_id_id_key ON erp.contas_receber_eventos USING btree (tenant_id, id);
CREATE INDEX contas_receber_eventos_titulo_idx ON erp.contas_receber_eventos USING btree (tenant_id, conta_receber_id, criado_em);
```

## erp.contratos_vendas_arquivos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| contrato_id | int8 | Não | — |
| arquivo_id | int8 | Não | — |
| finalidade | text | Não | — |
| descricao | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
contratos_vendas_arquivos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE RESTRICT
contratos_vendas_arquivos_finalidade_check: CHECK ((btrim(finalidade) <> ''::text))
contratos_vendas_arquivos_pkey: PRIMARY KEY (id)
contratos_vendas_arquivos_tenant_id_arquivo_id_fkey: FOREIGN KEY (tenant_id, arquivo_id) REFERENCES erp.arquivos(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_arquivos_tenant_id_contrato_id_arquivo_id_key: UNIQUE (tenant_id, contrato_id, arquivo_id)
contratos_vendas_arquivos_tenant_id_contrato_id_fkey: FOREIGN KEY (tenant_id, contrato_id) REFERENCES erp.contratos_vendas(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_arquivos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contratos_vendas_arquivos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX contratos_vendas_arquivos_pkey ON erp.contratos_vendas_arquivos USING btree (id);
CREATE UNIQUE INDEX contratos_vendas_arquivos_tenant_id_contrato_id_arquivo_id_key ON erp.contratos_vendas_arquivos USING btree (tenant_id, contrato_id, arquivo_id);
CREATE UNIQUE INDEX contratos_vendas_arquivos_tenant_id_id_key ON erp.contratos_vendas_arquivos USING btree (tenant_id, id);
```

## erp.contratos_vendas_eventos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| contrato_id | int8 | Não | — |
| contrato_versao_id | int8 | Sim | — |
| evento | text | Não | — |
| motivo | text | Sim | — |
| dados | jsonb | Não | '{}'::jsonb |
| criado_em | timestamptz | Não | now() |
| data_efeito | date | Não | CURRENT_DATE |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
contratos_vendas_eventos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE RESTRICT
contratos_vendas_eventos_dados_check: CHECK ((jsonb_typeof(dados) = 'object'::text))
contratos_vendas_eventos_evento_check: CHECK ((btrim(evento) <> ''::text))
contratos_vendas_eventos_pkey: PRIMARY KEY (id)
contratos_vendas_eventos_tenant_id_contrato_id_contrato_ve_fkey: FOREIGN KEY (tenant_id, contrato_id, contrato_versao_id) REFERENCES erp.contratos_vendas_versoes(tenant_id, contrato_id, id) ON DELETE RESTRICT
contratos_vendas_eventos_tenant_id_contrato_id_fkey: FOREIGN KEY (tenant_id, contrato_id) REFERENCES erp.contratos_vendas(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_eventos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contratos_vendas_eventos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE INDEX contratos_eventos_data_idx ON erp.contratos_vendas_eventos USING btree (tenant_id, contrato_id, criado_em);
CREATE UNIQUE INDEX contratos_vendas_eventos_pkey ON erp.contratos_vendas_eventos USING btree (id);
CREATE UNIQUE INDEX contratos_vendas_eventos_tenant_id_id_key ON erp.contratos_vendas_eventos USING btree (tenant_id, id);
```

## erp.contratos_vendas_geracoes_tentativas

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| geracao_id | int8 | Não | — |
| numero | int4 | Não | — |
| inicio | timestamptz | Não | now() |
| fim | timestamptz | Sim | — |
| status | text | Não | 'executando'::text |
| erro | text | Sim | — |
| execucao_id | text | Não | — |

Restrições e relacionamentos:

```sql
contratos_vendas_geracoes_tenta_tenant_id_geracao_id_numero_key: UNIQUE (tenant_id, geracao_id, numero)
contratos_vendas_geracoes_tentativas_check: CHECK (((status = 'executando'::text) = (fim IS NULL)))
contratos_vendas_geracoes_tentativas_check1: CHECK (((fim IS NULL) OR (fim >= inicio)))
contratos_vendas_geracoes_tentativas_erro_check: CHECK (((erro IS NULL) OR (length(erro) <= 2000)))
contratos_vendas_geracoes_tentativas_execucao_id_check: CHECK ((btrim(execucao_id) <> ''::text))
contratos_vendas_geracoes_tentativas_numero_check: CHECK ((numero > 0))
contratos_vendas_geracoes_tentativas_pkey: PRIMARY KEY (id)
contratos_vendas_geracoes_tentativas_status_check: CHECK ((status = ANY (ARRAY['executando'::text, 'sucesso'::text, 'falha'::text, 'abandonada'::text])))
contratos_vendas_geracoes_tentativas_tenant_id_execucao_id_key: UNIQUE (tenant_id, execucao_id)
contratos_vendas_geracoes_tentativas_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contratos_vendas_geracoes_tentativas_tenant_id_geracao_id_fkey: FOREIGN KEY (tenant_id, geracao_id) REFERENCES erp.contratos_vendas_geracoes(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_geracoes_tentativas_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE UNIQUE INDEX contrato_tentativa_ativa_idx ON erp.contratos_vendas_geracoes_tentativas USING btree (tenant_id, geracao_id) WHERE (status = 'executando'::text);
CREATE UNIQUE INDEX contratos_vendas_geracoes_tenta_tenant_id_geracao_id_numero_key ON erp.contratos_vendas_geracoes_tentativas USING btree (tenant_id, geracao_id, numero);
CREATE UNIQUE INDEX contratos_vendas_geracoes_tentativas_pkey ON erp.contratos_vendas_geracoes_tentativas USING btree (id);
CREATE UNIQUE INDEX contratos_vendas_geracoes_tentativas_tenant_id_execucao_id_key ON erp.contratos_vendas_geracoes_tentativas USING btree (tenant_id, execucao_id);
CREATE UNIQUE INDEX contratos_vendas_geracoes_tentativas_tenant_id_id_key ON erp.contratos_vendas_geracoes_tentativas USING btree (tenant_id, id);
```

## erp.contratos_vendas_versoes

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| contrato_id | int8 | Não | — |
| numero | int4 | Não | — |
| vigencia_inicio | date | Não | — |
| vigencia_fim | date | Sim | — |
| status | text | Não | 'rascunho'::text |
| periodicidade | text | Não | — |
| dia_vencimento | int4 | Não | — |
| regra_vencimento | text | Não | 'dia_fixo'::text |
| dias_apos_periodo | int4 | Sim | — |
| fim_mes | text | Não | 'ultimo_dia'::text |
| reajuste_indice | text | Sim | — |
| reajuste_percentual | numeric(9,4) | Sim | — |
| categoria_id | int8 | Sim | — |
| centro_custo_id | int8 | Sim | — |
| conta_financeira_id | int8 | Sim | — |
| metodo_pagamento_id | int8 | Sim | — |
| motivo | text | Não | — |
| cliente_snapshot | jsonb | Não | — |
| criado_em | timestamptz | Não | now() |
| efetivada_em | timestamptz | Sim | — |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
contratos_vendas_versoes_check: CHECK (((vigencia_fim IS NULL) OR (vigencia_fim >= vigencia_inicio)))
contratos_vendas_versoes_check1: CHECK (((status = 'efetivada'::text) = (efetivada_em IS NOT NULL)))
contratos_vendas_versoes_check2: CHECK (((regra_vencimento = 'dias_apos_periodo'::text) = (dias_apos_periodo IS NOT NULL)))
contratos_vendas_versoes_cliente_snapshot_check: CHECK ((jsonb_typeof(cliente_snapshot) = 'object'::text))
contratos_vendas_versoes_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE RESTRICT
contratos_vendas_versoes_dia_vencimento_check: CHECK (((dia_vencimento >= 1) AND (dia_vencimento <= 31)))
contratos_vendas_versoes_dias_apos_periodo_check: CHECK ((dias_apos_periodo >= 0))
contratos_vendas_versoes_fim_mes_check: CHECK ((fim_mes = ANY (ARRAY['ultimo_dia'::text, 'proximo_mes'::text])))
contratos_vendas_versoes_motivo_check: CHECK ((btrim(motivo) <> ''::text))
contratos_vendas_versoes_numero_check: CHECK ((numero > 0))
contratos_vendas_versoes_periodicidade_check: CHECK ((periodicidade = ANY (ARRAY['semanal'::text, 'quinzenal'::text, 'mensal'::text, 'bimestral'::text, 'trimestral'::text, 'semestral'::text, 'anual'::text])))
contratos_vendas_versoes_pkey: PRIMARY KEY (id)
contratos_vendas_versoes_regra_vencimento_check: CHECK ((regra_vencimento = ANY (ARRAY['dia_fixo'::text, 'dias_apos_periodo'::text])))
contratos_vendas_versoes_status_check: CHECK ((status = ANY (ARRAY['rascunho'::text, 'efetivada'::text])))
contratos_vendas_versoes_tenant_id_categoria_id_fkey: FOREIGN KEY (tenant_id, categoria_id) REFERENCES erp.categorias(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_versoes_tenant_id_centro_custo_id_fkey: FOREIGN KEY (tenant_id, centro_custo_id) REFERENCES erp.centros_custo(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_versoes_tenant_id_conta_financeira_id_fkey: FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_versoes_tenant_id_contrato_id_fkey: FOREIGN KEY (tenant_id, contrato_id) REFERENCES erp.contratos_vendas(tenant_id, id) ON DELETE RESTRICT
contratos_vendas_versoes_tenant_id_contrato_id_id_key: UNIQUE (tenant_id, contrato_id, id)
contratos_vendas_versoes_tenant_id_contrato_id_numero_key: UNIQUE (tenant_id, contrato_id, numero)
contratos_vendas_versoes_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
contratos_vendas_versoes_tenant_id_id_key: UNIQUE (tenant_id, id)
contratos_vendas_versoes_tenant_id_metodo_pagamento_id_fkey: FOREIGN KEY (tenant_id, metodo_pagamento_id) REFERENCES erp.metodos_pagamento(tenant_id, id) ON DELETE RESTRICT
```

Índices:

```sql
CREATE UNIQUE INDEX contratos_vendas_versoes_pkey ON erp.contratos_vendas_versoes USING btree (id);
CREATE UNIQUE INDEX contratos_vendas_versoes_tenant_id_contrato_id_id_key ON erp.contratos_vendas_versoes USING btree (tenant_id, contrato_id, id);
CREATE UNIQUE INDEX contratos_vendas_versoes_tenant_id_contrato_id_numero_key ON erp.contratos_vendas_versoes USING btree (tenant_id, contrato_id, numero);
CREATE UNIQUE INDEX contratos_vendas_versoes_tenant_id_id_key ON erp.contratos_vendas_versoes USING btree (tenant_id, id);
```

## erp.entidades_contatos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| entidade_id | int8 | Não | — |
| nome | text | Não | — |
| cargo | text | Sim | — |
| email | text | Sim | — |
| telefone | text | Sim | — |
| whatsapp | bool | Não | false |
| finalidades | _text | Não | ARRAY['comercial'::text] |
| principais | _text | Não | '{}'::text[] |
| ativo | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |
| atualizado_em | timestamptz | Não | now() |

Restrições e relacionamentos:

```sql
entidades_contatos_check: CHECK (((principais <@ finalidades) AND (ativo OR (cardinality(principais) = 0))))
entidades_contatos_check1: CHECK (((NULLIF(btrim(email), ''::text) IS NOT NULL) OR (NULLIF(btrim(telefone), ''::text) IS NOT NULL)))
entidades_contatos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE RESTRICT
entidades_contatos_finalidades_check: CHECK (((cardinality(finalidades) > 0) AND (finalidades <@ ARRAY['comercial'::text, 'financeiro'::text, 'operacional'::text])))
entidades_contatos_nome_check: CHECK ((btrim(nome) <> ''::text))
entidades_contatos_pkey: PRIMARY KEY (id)
entidades_contatos_tenant_id_entidade_id_fkey: FOREIGN KEY (tenant_id, entidade_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
entidades_contatos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
entidades_contatos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE INDEX entidades_contatos_entidade_idx ON erp.entidades_contatos USING btree (tenant_id, entidade_id);
CREATE UNIQUE INDEX entidades_contatos_pkey ON erp.entidades_contatos USING btree (id);
CREATE UNIQUE INDEX entidades_contatos_tenant_id_id_key ON erp.entidades_contatos USING btree (tenant_id, id);
```

## erp.entidades_enderecos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| entidade_id | int8 | Não | — |
| identificacao | text | Não | — |
| logradouro | text | Não | — |
| numero | text | Sim | — |
| complemento | text | Sim | — |
| bairro | text | Sim | — |
| cidade | text | Não | — |
| uf | text | Sim | — |
| cep | text | Sim | — |
| pais | text | Não | 'Brasil'::text |
| finalidades | _text | Não | ARRAY['comercial'::text] |
| principais | _text | Não | '{}'::text[] |
| ativo | bool | Não | true |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |
| atualizado_em | timestamptz | Não | now() |

Restrições e relacionamentos:

```sql
entidades_enderecos_check: CHECK (((principais <@ finalidades) AND (ativo OR (cardinality(principais) = 0))))
entidades_enderecos_cidade_check: CHECK ((btrim(cidade) <> ''::text))
entidades_enderecos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE RESTRICT
entidades_enderecos_finalidades_check: CHECK (((cardinality(finalidades) > 0) AND (finalidades <@ ARRAY['comercial'::text, 'cobranca'::text, 'prestacao'::text])))
entidades_enderecos_identificacao_check: CHECK ((btrim(identificacao) <> ''::text))
entidades_enderecos_logradouro_check: CHECK ((btrim(logradouro) <> ''::text))
entidades_enderecos_pkey: PRIMARY KEY (id)
entidades_enderecos_tenant_id_entidade_id_fkey: FOREIGN KEY (tenant_id, entidade_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
entidades_enderecos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
entidades_enderecos_tenant_id_id_key: UNIQUE (tenant_id, id)
```

Índices:

```sql
CREATE INDEX entidades_enderecos_entidade_idx ON erp.entidades_enderecos USING btree (tenant_id, entidade_id);
CREATE UNIQUE INDEX entidades_enderecos_pkey ON erp.entidades_enderecos USING btree (id);
CREATE UNIQUE INDEX entidades_enderecos_tenant_id_id_key ON erp.entidades_enderecos USING btree (tenant_id, id);
```

## erp.ordens_servico_arquivos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| ordem_servico_id | int8 | Não | — |
| arquivo_id | int8 | Não | — |
| finalidade | text | Não | — |
| descricao | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
ordens_servico_arquivos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE RESTRICT
ordens_servico_arquivos_finalidade_check: CHECK ((btrim(finalidade) <> ''::text))
ordens_servico_arquivos_pkey: PRIMARY KEY (id)
ordens_servico_arquivos_tenant_id_arquivo_id_fkey: FOREIGN KEY (tenant_id, arquivo_id) REFERENCES erp.arquivos(tenant_id, id) ON DELETE RESTRICT
ordens_servico_arquivos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
ordens_servico_arquivos_tenant_id_id_key: UNIQUE (tenant_id, id)
ordens_servico_arquivos_tenant_id_ordem_servico_id_arquivo__key: UNIQUE (tenant_id, ordem_servico_id, arquivo_id)
ordens_servico_arquivos_tenant_id_ordem_servico_id_fkey: FOREIGN KEY (tenant_id, ordem_servico_id) REFERENCES erp.ordens_servico(tenant_id, id) ON DELETE RESTRICT
```

Índices:

```sql
CREATE UNIQUE INDEX ordens_servico_arquivos_pkey ON erp.ordens_servico_arquivos USING btree (id);
CREATE UNIQUE INDEX ordens_servico_arquivos_tenant_id_id_key ON erp.ordens_servico_arquivos USING btree (tenant_id, id);
CREATE UNIQUE INDEX ordens_servico_arquivos_tenant_id_ordem_servico_id_arquivo__key ON erp.ordens_servico_arquivos USING btree (tenant_id, ordem_servico_id, arquivo_id);
```

## erp.renegociacoes

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| entidade_id | int8 | Não | — |
| lado | text | Não | — |
| numero | text | Não | — |
| data_acordo | date | Não | — |
| status | text | Não | 'rascunho'::text |
| desconto | numeric(18,2) | Não | 0 |
| encargos | numeric(18,2) | Não | 0 |
| categoria_ajuste_id | int8 | Sim | — |
| motivo | text | Não | — |
| condicoes | text | Não | — |
| efetivada_em | timestamptz | Sim | — |
| revertida_em | timestamptz | Sim | — |
| motivo_reversao | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |
| efetivada_por | int8 | Sim | — |
| revertida_por | int8 | Sim | — |
| chave_idempotencia | text | Não | — |
| requisicao_original | jsonb | Sim | — |

Restrições e relacionamentos:

```sql
renegociacoes_chave_idempotencia_check: CHECK ((btrim(chave_idempotencia) <> ''::text))
renegociacoes_check: CHECK ((((status = 'rascunho'::text) AND (efetivada_em IS NULL) AND (revertida_em IS NULL)) OR ((status = 'efetivada'::text) AND (efetivada_em IS NOT NULL) AND (revertida_em IS NULL)) OR ((status = 'revertida'::text) AND (efetivada_em IS NOT NULL) AND (revertida_em >= efetivada_em) AND (NULLIF(btrim(motivo_reversao), ''::text) IS NOT NULL))))
renegociacoes_check1: CHECK ((((desconto = (0)::numeric) AND (encargos = (0)::numeric)) OR (categoria_ajuste_id IS NOT NULL)))
renegociacoes_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE RESTRICT
renegociacoes_desconto_check: CHECK ((desconto >= (0)::numeric))
renegociacoes_efetivada_por_fkey: FOREIGN KEY (efetivada_por) REFERENCES shared.users(id) ON DELETE RESTRICT
renegociacoes_encargos_check: CHECK ((encargos >= (0)::numeric))
renegociacoes_lado_check: CHECK ((lado = ANY (ARRAY['receber'::text, 'pagar'::text])))
renegociacoes_motivo_check: CHECK ((btrim(motivo) <> ''::text))
renegociacoes_numero_check: CHECK ((btrim(numero) <> ''::text))
renegociacoes_pkey: PRIMARY KEY (id)
renegociacoes_revertida_por_fkey: FOREIGN KEY (revertida_por) REFERENCES shared.users(id) ON DELETE RESTRICT
renegociacoes_status_check: CHECK ((status = ANY (ARRAY['rascunho'::text, 'efetivada'::text, 'revertida'::text])))
renegociacoes_tenant_id_categoria_ajuste_id_fkey: FOREIGN KEY (tenant_id, categoria_ajuste_id) REFERENCES erp.categorias(tenant_id, id) ON DELETE RESTRICT
renegociacoes_tenant_id_chave_idempotencia_key: UNIQUE (tenant_id, chave_idempotencia)
renegociacoes_tenant_id_entidade_id_fkey: FOREIGN KEY (tenant_id, entidade_id) REFERENCES erp.entidades(tenant_id, id) ON DELETE RESTRICT
renegociacoes_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
renegociacoes_tenant_id_id_key: UNIQUE (tenant_id, id)
renegociacoes_tenant_id_numero_key: UNIQUE (tenant_id, numero)
validar_saldos: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Índices:

```sql
CREATE UNIQUE INDEX renegociacoes_pkey ON erp.renegociacoes USING btree (id);
CREATE UNIQUE INDEX renegociacoes_tenant_id_chave_idempotencia_key ON erp.renegociacoes USING btree (tenant_id, chave_idempotencia);
CREATE UNIQUE INDEX renegociacoes_tenant_id_id_key ON erp.renegociacoes USING btree (tenant_id, id);
CREATE UNIQUE INDEX renegociacoes_tenant_id_numero_key ON erp.renegociacoes USING btree (tenant_id, numero);
```

## erp.renegociacoes_parcelas

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| renegociacao_id | int8 | Não | — |
| papel | text | Não | — |
| conta_receber_parcela_id | int8 | Sim | — |
| conta_pagar_parcela_id | int8 | Sim | — |
| valor | numeric(18,2) | Não | — |
| ordem | int4 | Não | — |
| criado_em | timestamptz | Não | now() |

Restrições e relacionamentos:

```sql
renegociacoes_parcelas_check: CHECK ((num_nonnulls(conta_receber_parcela_id, conta_pagar_parcela_id) = 1))
renegociacoes_parcelas_ordem_check: CHECK ((ordem > 0))
renegociacoes_parcelas_papel_check: CHECK ((papel = ANY (ARRAY['origem'::text, 'destino'::text])))
renegociacoes_parcelas_pkey: PRIMARY KEY (id)
renegociacoes_parcelas_tenant_id_conta_pagar_parcela_id_fkey: FOREIGN KEY (tenant_id, conta_pagar_parcela_id) REFERENCES erp.contas_pagar_parcelas(tenant_id, id) ON DELETE RESTRICT
renegociacoes_parcelas_tenant_id_conta_receber_parcela_id_fkey: FOREIGN KEY (tenant_id, conta_receber_parcela_id) REFERENCES erp.contas_receber_parcelas(tenant_id, id) ON DELETE RESTRICT
renegociacoes_parcelas_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
renegociacoes_parcelas_tenant_id_id_key: UNIQUE (tenant_id, id)
renegociacoes_parcelas_tenant_id_renegociacao_id_fkey: FOREIGN KEY (tenant_id, renegociacao_id) REFERENCES erp.renegociacoes(tenant_id, id) ON DELETE RESTRICT
renegociacoes_parcelas_tenant_id_renegociacao_id_papel_orde_key: UNIQUE (tenant_id, renegociacao_id, papel, ordem)
renegociacoes_parcelas_valor_check: CHECK ((valor > (0)::numeric))
validar_saldos: TRIGGER DEFERRABLE INITIALLY DEFERRED
```

Índices:

```sql
CREATE INDEX renegociacao_pagar_busca_idx ON erp.renegociacoes_parcelas USING btree (tenant_id, conta_pagar_parcela_id);
CREATE UNIQUE INDEX renegociacao_pagar_parcela_idx ON erp.renegociacoes_parcelas USING btree (tenant_id, renegociacao_id, conta_pagar_parcela_id);
CREATE INDEX renegociacao_receber_busca_idx ON erp.renegociacoes_parcelas USING btree (tenant_id, conta_receber_parcela_id);
CREATE UNIQUE INDEX renegociacao_receber_parcela_idx ON erp.renegociacoes_parcelas USING btree (tenant_id, renegociacao_id, conta_receber_parcela_id);
CREATE UNIQUE INDEX renegociacoes_parcelas_pkey ON erp.renegociacoes_parcelas USING btree (id);
CREATE UNIQUE INDEX renegociacoes_parcelas_tenant_id_id_key ON erp.renegociacoes_parcelas USING btree (tenant_id, id);
CREATE UNIQUE INDEX renegociacoes_parcelas_tenant_id_renegociacao_id_papel_orde_key ON erp.renegociacoes_parcelas USING btree (tenant_id, renegociacao_id, papel, ordem);
```

## erp.vendas_arquivos

| Coluna | Tipo | Aceita nulo | Padrão |
| --- | --- | --- | --- |
| id | int8 | Não | Identidade |
| tenant_id | int8 | Não | — |
| venda_id | int8 | Não | — |
| arquivo_id | int8 | Não | — |
| finalidade | text | Não | — |
| descricao | text | Sim | — |
| criado_em | timestamptz | Não | now() |
| criado_por | int8 | Sim | — |

Restrições e relacionamentos:

```sql
vendas_arquivos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES shared.users(id) ON DELETE RESTRICT
vendas_arquivos_finalidade_check: CHECK ((btrim(finalidade) <> ''::text))
vendas_arquivos_pkey: PRIMARY KEY (id)
vendas_arquivos_tenant_id_arquivo_id_fkey: FOREIGN KEY (tenant_id, arquivo_id) REFERENCES erp.arquivos(tenant_id, id) ON DELETE RESTRICT
vendas_arquivos_tenant_id_fkey: FOREIGN KEY (tenant_id) REFERENCES shared.tenants(id) ON DELETE RESTRICT
vendas_arquivos_tenant_id_id_key: UNIQUE (tenant_id, id)
vendas_arquivos_tenant_id_venda_id_arquivo_id_key: UNIQUE (tenant_id, venda_id, arquivo_id)
vendas_arquivos_tenant_id_venda_id_fkey: FOREIGN KEY (tenant_id, venda_id) REFERENCES erp.vendas(tenant_id, id) ON DELETE RESTRICT
```

Índices:

```sql
CREATE UNIQUE INDEX vendas_arquivos_pkey ON erp.vendas_arquivos USING btree (id);
CREATE UNIQUE INDEX vendas_arquivos_tenant_id_id_key ON erp.vendas_arquivos USING btree (tenant_id, id);
CREATE UNIQUE INDEX vendas_arquivos_tenant_id_venda_id_arquivo_id_key ON erp.vendas_arquivos USING btree (tenant_id, venda_id, arquivo_id);
```

