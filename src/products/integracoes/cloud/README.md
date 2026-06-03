# Integracoes Cloud

Este pacote reserva o codigo que sera executado fora do app Next.js quando a orquestracao do ETL for movida para Google Cloud.

Status atual:

- Estrutura criada para a Etapa 5.
- Recursos base GCP ativos no projeto `creatto-463117`.
- Deploy ativo em Cloud Run para `integrations-control-api` e `integrations-worker-service`.
- Pub/Sub, BigQuery, Secret Manager, Artifact Registry e Cloud Build trigger configurados.
- Worker GCP preparado para orquestrar sync real, gravar status/cursor no Postgres,
  ler credenciais no Secret Manager e escrever raw rows no BigQuery.
- Runtime base para conectores reais com validacao de credenciais, OAuth callback,
  retry/timeout/rate-limit por provedor e escrita em lotes no BigQuery.
- Sem credenciais ou secrets neste repositorio.

Runbook operacional:

```txt
GCP_RUNBOOK.md
```

Use o runbook para recuperar contexto rapido, conectar com `gcloud`, validar recursos e
executar smoke tests do pipeline.

Recursos GCP criados/esperados:

```txt
PROJECT_ID=creatto-463117
REGION=southamerica-east1

BIGQUERY_CUSTOM_RAW_DATASET=integrations_custom_raw
BIGQUERY_FIVETRAN_RAW_DATASET=integrations_fivetran_raw
BIGQUERY_NORMALIZED_DATASET=integrations_normalized

PUBSUB_SYNC_TOPIC=integrations-sync-requests
PUBSUB_DEAD_LETTER_TOPIC=integrations-sync-dead-letter
PUBSUB_WORKER_SUBSCRIPTION=integrations-sync-worker-sub
PUBSUB_WORKER_PUSH_SUBSCRIPTION=integrations-sync-worker-push-sub

SECRET_INTERNAL_API_KEY=integrations-internal-api-key
ARTIFACT_REGISTRY_REPO=integrations
CONTROL_API_SERVICE_ACCOUNT=integrations-control-api
WORKER_SERVICE_ACCOUNT=integrations-worker
DEPLOYER_SERVICE_ACCOUNT=integrations-deployer
PUBSUB_INVOKER_SERVICE_ACCOUNT=integrations-pubsub-invoker
```

Arquitetura prevista:

- `control-api`: servico HTTP para setup, callbacks, reconexao e despacho de sync.
- `worker`: servico HTTP invocado por Pub/Sub push e job legado para execucoes pontuais.
- `connectors`: implementacoes por provedor, iniciando com ERPs e depois CRMs. Ainda
  permanecem em stub ate a entrega de cada conector.
- `lib`: wrappers de infraestrutura GCP para Pub/Sub, Secret Manager, BigQuery e status/cursor.

Contrato base de conectores:

- cada conector declara `provider`, `version`, `resources` e pode validar credenciais;
- credenciais ficam no Secret Manager como `integrations-{tenantId}-{connectionId}-credentials`;
- syncs recebem cursor por recurso e podem devolver linhas em `rows` ou lotes em `batches`;
- chamadas HTTP de provedores devem usar `connectorJsonRequest` para herdar timeout, retry,
  rate-limit e classificacao de erro;
- OAuth generico usa `/callbacks/oauth` com state assinado e troca o codigo por token antes
  de marcar a conexao como `connected`.

Entrypoints planejados:

```txt
src/control-api/index.ts
src/worker/index.ts
```

Artefatos de deploy preparados:

```txt
Dockerfile.control-api
Dockerfile.worker
deploy/cloud-run-control-api.yaml
deploy/cloud-run-worker.yaml
deploy/cloudbuild-control-api.yaml
deploy/cloudbuild-worker.yaml
deploy/cloudbuild-integrations.yaml
deploy/README.md
```

Proximas etapas de produto/ETL:

1. Implementar conectores reais, comecando por Omie ou Conta Azul.
2. Criar transforms normalizados quando os primeiros ERPs enviarem dados.
3. Habilitar Cloud Scheduler apenas quando houver sync recorrente.
4. Configurar client id/secret/URLs reais dos provedores OAuth conforme cada conector.
