# Integracoes Cloud

Este pacote reserva o codigo que sera executado fora do app Next.js quando a orquestracao do ETL for movida para Google Cloud.

Status atual:

- Estrutura criada para a Etapa 5.
- Recursos base GCP definidos manualmente no projeto `creatto-463117`.
- Sem deploy ativo.
- Sem chamadas reais a Cloud Run, BigQuery, Secret Manager ou Pub/Sub.
- Sem credenciais ou secrets neste repositorio.

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

SECRET_INTERNAL_API_KEY=integrations-internal-api-key
ARTIFACT_REGISTRY_REPO=integrations
CONTROL_API_SERVICE_ACCOUNT=integrations-control-api
WORKER_SERVICE_ACCOUNT=integrations-worker
```

Arquitetura prevista:

- `control-api`: servico HTTP interno para setup, callbacks, reconexao e despacho de sync.
- `worker`: entrypoint de jobs para executar conectores e atualizar status operacional.
- `connectors`: implementacoes por provedor, iniciando com ERPs e depois CRMs.
- `lib`: wrappers de infraestrutura futura, hoje como stubs explicitos.

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
deploy/README.md
```

Quando Google Cloud entrar:

1. Implementar autenticação interna no `control-api`.
2. Trocar stubs em `lib/` por SDKs reais.
3. Adicionar Dockerfiles ou build target do deploy.
4. Ligar `src/products/integracoes/server/integrationControlClient.ts` ao endpoint Cloud Run.
5. Gravar credenciais no Secret Manager e dados no BigQuery.
