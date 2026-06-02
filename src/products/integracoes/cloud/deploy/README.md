# Integrations Cloud Run Deploy

Arquivos preparados para deploy das integracoes no Google Cloud.

Recursos alvo:

```txt
PROJECT_ID=creatto-463117
REGION=southamerica-east1
ARTIFACT_REGISTRY_REPO=integrations
CONTROL_API_SERVICE=integrations-control-api
WORKER_JOB=integrations-worker
WORKER_SERVICE=integrations-worker-service
```

Build local com `gcloud` instalado:

```bash
gcloud builds submit \
  --project creatto-463117 \
  --region southamerica-east1 \
  --config src/products/integracoes/cloud/deploy/cloudbuild-control-api.yaml \
  .
```

```bash
gcloud builds submit \
  --project creatto-463117 \
  --region southamerica-east1 \
  --config src/products/integracoes/cloud/deploy/cloudbuild-worker.yaml \
  .
```

Deploy futuro:

```bash
gcloud run services replace src/products/integracoes/cloud/deploy/cloud-run-control-api.yaml \
  --project creatto-463117 \
  --region southamerica-east1
```

```bash
gcloud run jobs replace src/products/integracoes/cloud/deploy/cloud-run-worker.yaml \
  --project creatto-463117 \
  --region southamerica-east1
```

```bash
gcloud run services replace src/products/integracoes/cloud/deploy/cloud-run-worker-service.yaml \
  --project creatto-463117 \
  --region southamerica-east1
```

Observacoes:

- A infraestrutura de worker, Secret Manager, BigQuery writer e status/cursor esta pronta.
- Os conectores por provider ainda podem usar stub ate serem implementados.
- O build deve ser executado com o contexto na raiz do repositorio.
- Nenhuma chave JSON de service account e necessaria para Cloud Run.
