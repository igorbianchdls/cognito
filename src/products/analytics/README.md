# Analytics

Medir sites e apps: páginas vistas, eventos próprios, origens e aparelhos. Depois: funis, feature flags e testes A/B.

## Onde fica

- **Telas** (`src/app/analytics`, seção Analytics do menu): Painéis (`/analytics`), Eventos ao vivo (`/analytics/eventos`) e Sites e apps (`/analytics/sites`).
- **Configurações no Supabase:** schema `analytics` (`supabase/migrations/20261122150000_analytics_schema.sql`): `properties` (sites e apps, domínios, chave pública, consentimento), `funnels`, `flags` e `experiments`. Acesso pelos papéis do ERP, como Drive e Social.
- **Eventos no BigQuery:** dataset `analytics`, tabela `events`, uma partição por dia e organizada por propriedade e evento. O Otto cria os dois na primeira vez (`server/bigquery.ts`, sem SDK: a conta de serviço assina um JWT).
- **Script** `public/otto.js`: `<script async src="https://ottogestao.com.br/otto.js" data-key="otto_…"></script>`. Registra páginas vistas (também nas trocas de página sem recarregar), `otto.track`, `otto.identify`, `otto.consent` e `otto.reset`. Envia em lotes, sem IP, respeita "não rastrear". Com `data-consent="required"`, só guarda o id do visitante depois de `otto.consent(true)`.
- **Rotas:** `POST /api/analytics/eventos` (pública: confere chave e domínio, ignora robôs, limita envios, grava depois de responder) e `GET /api/analytics/relatorios` (só membros da empresa da propriedade; consulta com teto de leitura).

## Configuração (Vercel)

- `GCP_SERVICE_ACCOUNT_JSON`: chave JSON da conta de serviço, com os papéis BigQuery Data Editor e BigQuery Job User.
- Opcionais: `ANALYTICS_BQ_PROJECT` (padrão: o projeto da conta), `ANALYTICS_BQ_DATASET` (`analytics`), `ANALYTICS_BQ_LOCATION` (`southamerica-east1`).

Sem a chave, as telas avisam que o BigQuery não está conectado e a rota de eventos responde sem gravar.

## Testes

`pnpm analytics:smoke` (no CI): domínios aceitos, lotes inválidos, linhas sem IP e o cliente do BigQuery contra uma API simulada.
