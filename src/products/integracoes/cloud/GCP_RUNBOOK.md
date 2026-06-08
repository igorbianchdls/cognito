# GCP Runbook - Integracoes

Este runbook guarda o contexto operacional do Google Cloud para as integracoes do SaaS.
Use este arquivo para recuperar rapidamente o estado do projeto, conectar a CLI e validar
o pipeline antes de mexer em Conta Azul, Fivetran ou outros ERPs.

## Contexto base

```txt
PROJECT_ID=creatto-463117
PROJECT_NUMBER=305346154546
REGION=southamerica-east1
```

Regiao padrao: Sao Paulo (`southamerica-east1`).

## Como conectar pela CLI do gcloud

Fluxo normal, em um terminal com browser disponivel:

```bash
gcloud auth login
gcloud config set project creatto-463117
gcloud config set run/region southamerica-east1
gcloud auth list
gcloud projects describe creatto-463117
```

Se precisar de Application Default Credentials para SDKs locais:

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project creatto-463117
```

No ambiente Codex/WSL, quando nao puder escrever no config original do Windows, copie a
configuracao existente para `/tmp` e rode os comandos com `CLOUDSDK_CONFIG`:

```bash
mkdir -p /tmp/codex-gcloud-config
cp -a /mnt/c/Users/Administrador/AppData/Roaming/gcloud/. /tmp/codex-gcloud-config/
CLOUDSDK_CONFIG=/tmp/codex-gcloud-config gcloud projects describe creatto-463117
```

Exemplo de comando usando esse config temporario:

```bash
CLOUDSDK_CONFIG=/tmp/codex-gcloud-config gcloud run services list \
  --project creatto-463117 \
  --region southamerica-east1
```

Limpeza opcional ao terminar:

```bash
rm -rf /tmp/codex-gcloud-config
```

## Recursos atuais

Cloud Run:

```txt
cognito
integrations-control-api
integrations-worker-service
integrations-worker (job legado)
```

URLs atuais:

```txt
https://cognito-305346154546.southamerica-east1.run.app
https://integrations-control-api-305346154546.southamerica-east1.run.app
https://integrations-worker-service-305346154546.southamerica-east1.run.app
```

Cloud Build:

```txt
TRIGGER_NAME=integrations-deploy-master
TRIGGER_ID=656b09fc-117e-4e77-bd53-0bc054dbdb1c
REPO=igorbianchdls/cognito
BRANCH=master
BUILD_CONFIG=src/products/integracoes/cloud/deploy/cloudbuild-integrations.yaml
SERVICE_ACCOUNT=integrations-deployer@creatto-463117.iam.gserviceaccount.com
```

Artifact Registry:

```txt
REPOSITORY=integrations
LOCATION=southamerica-east1
CONTROL_API_IMAGE=southamerica-east1-docker.pkg.dev/creatto-463117/integrations/control-api:latest
WORKER_IMAGE=southamerica-east1-docker.pkg.dev/creatto-463117/integrations/worker:latest
```

Pub/Sub:

```txt
TOPIC=integrations-sync-requests
DEAD_LETTER_TOPIC=integrations-sync-dead-letter
PUSH_SUBSCRIPTION=integrations-sync-worker-push-sub
LEGACY_PULL_SUBSCRIPTION=integrations-sync-worker-sub
PUSH_ENDPOINT=https://integrations-worker-service-305346154546.southamerica-east1.run.app/pubsub
MAX_DELIVERY_ATTEMPTS=5
```

BigQuery:

```txt
integrations_custom_raw      southamerica-east1
integrations_fivetran_raw    southamerica-east1
integrations_normalized      southamerica-east1
```

Secrets:

```txt
integrations-internal-api-key
supabase-db-url
integrations-{tenantId}-{connectionId}-credentials
```

Nunca imprima o valor desse secret em logs ou respostas. Use-o apenas em variavel de
ambiente temporaria quando precisar testar chamadas internas.

## Contrato operacional de conectores

Variaveis de runtime comuns:

```txt
GCP_HTTP_TIMEOUT_MS=30000
GCP_HTTP_RETRY_ATTEMPTS=3
INTEGRATIONS_HTTP_TIMEOUT_MS=30000
INTEGRATIONS_HTTP_RETRY_ATTEMPTS=3
INTEGRATIONS_RATE_LIMIT_DEFAULT_MS=0
BIGQUERY_INSERT_MAX_ROWS=500
BIGQUERY_INSERT_MAX_BYTES=4194304
```

Variaveis OAuth por provedor:

```txt
INTEGRATIONS_OAUTH_STATE_SECRET
INTEGRATIONS_OAUTH_REDIRECT_URI
INTEGRATIONS_APP_CALLBACK_URL
INTEGRATIONS_OAUTH_{PROVIDER}_CLIENT_ID
INTEGRATIONS_OAUTH_{PROVIDER}_CLIENT_SECRET
INTEGRATIONS_OAUTH_{PROVIDER}_AUTHORIZE_URL
INTEGRATIONS_OAUTH_{PROVIDER}_TOKEN_URL
INTEGRATIONS_OAUTH_{PROVIDER}_SCOPES
```

Exemplo: para Conta Azul, o slug vira `CONTA_AZUL`. Omie normalmente usa app key/app
secret e nao precisa de OAuth, mas deve ter rate-limit por provedor quando o conector real
for implementado:

```txt
INTEGRATIONS_RATE_LIMIT_OMIE_MS=250
INTEGRATIONS_RATE_LIMIT_CONTA_AZUL_MS=250
```

Checklist antes de iniciar um provedor real:

1. confirmar tipo de autenticacao do provedor no catalogo;
2. configurar secrets/variaveis de OAuth quando for OAuth;
3. validar credenciais via endpoint de conexao;
4. rodar sync manual de recurso pequeno;
5. conferir eventos no Postgres, raw rows no BigQuery e logs estruturados do worker.

Service accounts principais:

```txt
integrations-control-api@creatto-463117.iam.gserviceaccount.com
integrations-worker@creatto-463117.iam.gserviceaccount.com
integrations-deployer@creatto-463117.iam.gserviceaccount.com
integrations-pubsub-invoker@creatto-463117.iam.gserviceaccount.com
creatto-bigquery@creatto-463117.iam.gserviceaccount.com
```

## Checagem rapida

APIs essenciais:

```bash
gcloud services list --enabled \
  --project creatto-463117 \
  --filter='config.name:(run.googleapis.com OR cloudbuild.googleapis.com OR artifactregistry.googleapis.com OR pubsub.googleapis.com OR bigquery.googleapis.com OR secretmanager.googleapis.com OR iamcredentials.googleapis.com)' \
  --format='table(config.name)'
```

Cloud Run:

```bash
gcloud run services list \
  --project creatto-463117 \
  --region southamerica-east1 \
  --format='table(metadata.name,status.url,status.conditions[0].status,status.conditions[0].type)'
```

Cloud Run job:

```bash
gcloud run jobs list \
  --project creatto-463117 \
  --region southamerica-east1 \
  --format='table(metadata.name,status.conditions[0].status,status.conditions[0].type)'
```

Cloud Build:

```bash
gcloud builds triggers list \
  --project creatto-463117 \
  --format='table(id,name,github.owner,github.name,github.push.branch,filename,disabled)'
```

```bash
gcloud builds list \
  --project creatto-463117 \
  --limit=5 \
  --format='table(id,status,createTime,substitutions.TRIGGER_NAME,logUrl)'
```

Pub/Sub:

```bash
gcloud pubsub topics list \
  --project creatto-463117 \
  --format='table(name)'
```

```bash
gcloud pubsub subscriptions list \
  --project creatto-463117 \
  --format='table(name,topic,pushConfig.pushEndpoint,deadLetterPolicy.deadLetterTopic,deadLetterPolicy.maxDeliveryAttempts)'
```

BigQuery:

```bash
bq --project_id=creatto-463117 ls
```

```bash
bq --project_id=creatto-463117 show integrations_custom_raw
bq --project_id=creatto-463117 show integrations_fivetran_raw
bq --project_id=creatto-463117 show integrations_normalized
```

Secrets e service accounts:

```bash
gcloud secrets list \
  --project creatto-463117 \
  --filter='name:integrations' \
  --format='table(name,replication)'
```

```bash
gcloud iam service-accounts list \
  --project creatto-463117 \
  --filter='email:(integrations-control-api OR integrations-worker OR integrations-deployer OR integrations-pubsub-invoker OR creatto-bigquery)' \
  --format='table(email,displayName,disabled)'
```

Health publico do Control API:

```bash
curl -sS https://integrations-control-api-305346154546.southamerica-east1.run.app/health
```

O Worker nao deve responder publicamente sem autenticacao. `403` em `/health` publico
e esperado, porque o Pub/Sub invoca o servico com a service account
`integrations-pubsub-invoker`.

## Smoke test do pipeline

Este teste valida o caminho:

```txt
Control API /sync -> Pub/Sub -> push subscription -> Worker service
```

Nao imprima o secret. Carregue em variavel temporaria e use no header:

```bash
KEY="$(gcloud secrets versions access latest \
  --secret=integrations-internal-api-key \
  --project=creatto-463117)"

curl -sS -X POST https://integrations-control-api-305346154546.southamerica-east1.run.app/sync \
  -H "Authorization: Bearer ${KEY}" \
  -H 'Content-Type: application/json' \
  -d '{"tenantId":1,"connectionId":"smoke-gcloud","trigger":"manual","resources":["health"],"requestedBy":"runbook"}'

unset KEY
```

Resposta esperada:

```json
{
  "ok": true,
  "mode": "pubsub",
  "message": "Sync publicado no Pub/Sub.",
  "topic": "integrations-sync-requests"
}
```

Confirmar processamento no Worker:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="integrations-worker-service" AND jsonPayload.result.connectionId="smoke-gcloud"' \
  --project creatto-463117 \
  --limit=5 \
  --freshness=10m \
  --format='table(timestamp,jsonPayload.message,jsonPayload.result.connectionId,jsonPayload.result.mode)'
```

Resultado esperado:

```txt
MESSAGE: Integration worker finished.
CONNECTION_ID: smoke-gcloud
MODE: gcp_worker
```

## Deploy e CI/CD

O trigger `integrations-deploy-master` roda em push para `master` e usa:

```txt
src/products/integracoes/cloud/deploy/cloudbuild-integrations.yaml
```

Esse build:

1. Builda `control-api:latest`.
2. Builda `worker:latest`.
3. Aplica `cloud-run-control-api.yaml`.
4. Aplica `cloud-run-worker-service.yaml`.

Execucao manual equivalente, quando necessario, usando o proprio trigger:

```bash
gcloud builds triggers run integrations-deploy-master \
  --project creatto-463117 \
  --branch=master
```

Build manual direto, se o trigger nao puder ser usado. Manter a service account explicita:

```bash
gcloud builds submit \
  --project creatto-463117 \
  --config src/products/integracoes/cloud/deploy/cloudbuild-integrations.yaml \
  --service-account=projects/creatto-463117/serviceAccounts/integrations-deployer@creatto-463117.iam.gserviceaccount.com \
  .
```

Deploy manual dos manifests, quando necessario:

```bash
gcloud run services replace src/products/integracoes/cloud/deploy/cloud-run-control-api.yaml \
  --project creatto-463117 \
  --region southamerica-east1

gcloud run services replace src/products/integracoes/cloud/deploy/cloud-run-worker-service.yaml \
  --project creatto-463117 \
  --region southamerica-east1
```

## Estado da infraestrutura GCP

- Secret Manager e BigQuery writer estao implementados para uso generico.
- O Worker cria sync run, busca conexao no Postgres, resolve provider/resource,
  chama o connector, grava rows raw no BigQuery quando existirem, atualiza cursor e finaliza status.
- Os conectores de provider continuam em stub; eles retornam zero linhas ate a entrega de Omie, Conta Azul etc.
- As tabelas raw do BigQuery sao criadas automaticamente por provider/resource no padrao
  `{provider}_{resource}`, dentro de `integrations_custom_raw`.
- Cloud Scheduler nao esta habilitado; so precisa para sync recorrente/agendado.
- Eventarc nao esta habilitado; nao e necessario no fluxo atual.
- A assinatura pull `integrations-sync-worker-sub` e legado. A assinatura ativa para o Worker HTTP e `integrations-sync-worker-push-sub`.
- O secret `integrations-internal-api-key` usa replicacao automatica. Se houver exigencia estrita de residencia regional, recriar secrets com replicacao user-managed em `southamerica-east1`.

## Formato das credenciais

O Control API grava credenciais recebidas em `/connections/setup` no Secret Manager:

```txt
projects/creatto-463117/secrets/integrations-{tenantId}-{connectionId}-credentials
```

O valor pode ser string ou JSON. O worker le `latest` e passa para o connector como
`credentials`, sem logar o conteudo.

## Formato raw no BigQuery

Cada resource grava em tabela raw propria:

```txt
integrations_custom_raw.{provider}_{resource}
```

Schema base:

```txt
tenant_id INTEGER
connection_id STRING
provider STRING
resource STRING
run_id STRING
external_id STRING
synced_at TIMESTAMP
raw_payload JSON
```
