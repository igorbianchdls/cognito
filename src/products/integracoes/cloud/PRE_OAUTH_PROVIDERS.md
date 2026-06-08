# Plano pre-OAuth de providers

Este documento prepara a entrada dos primeiros providers antes de cadastrar os apps OAuth
nos portais externos. Ele nao contem `client_id`, `client_secret` nem tokens reais.

## URL canonica

Use sempre as URLs stable do Cloud Run:

```txt
Control API: https://integrations-control-api-305346154546.southamerica-east1.run.app
OAuth callback: https://integrations-control-api-305346154546.southamerica-east1.run.app/callbacks/provider
App callback: https://cognito-305346154546.southamerica-east1.run.app/integracoes/callback
```

Variaveis relacionadas:

```txt
INTEGRATIONS_CONTROL_API_URL=https://integrations-control-api-305346154546.southamerica-east1.run.app
INTEGRATIONS_OAUTH_REDIRECT_URI=https://integrations-control-api-305346154546.southamerica-east1.run.app/callbacks/provider
INTEGRATIONS_APP_CALLBACK_URL=https://cognito-305346154546.southamerica-east1.run.app/integracoes/callback
```

## Providers iniciais recomendados

Comece com um CRM e um ERP. Nao abra muitos providers ao mesmo tempo; cada OAuth pode
ter detalhes proprios de token exchange, scopes e refresh.

```txt
CRM candidato: hubspot ou pipedrive
ERP candidato: bling ou conta_azul
```

## Checklist por provider

Antes de implementar o OAuth real de um provider:

1. Confirmar o slug do provider no catalogo (`provider.slug`).
2. Confirmar `authType=oauth2` no catalogo.
3. Confirmar recursos iniciais em `provider.resources`.
4. Separar recursos historicos, que serao lidos no BigQuery.
5. Separar recursos live, que serao lidos via API.
6. Separar actions live, que executam operacoes diretamente na API.
7. Confirmar scopes oficiais no portal/documentacao do provider.
8. Confirmar se o token exchange usa form-urlencoded simples, Basic Auth, PKCE ou outro formato.
9. Confirmar se o refresh token e retornado no primeiro consentimento.
10. Confirmar se ha URL por tenant/portal/instancia.
11. Cadastrar no provider a URL exata de callback da Control API.
12. Criar secrets no Secret Manager usando o padrao abaixo.
13. Testar `pending_auth -> connected`.
14. Testar sync manual de um recurso pequeno.
15. Testar uma action `dryRun`.

## Template de secrets

Para cada provider OAuth, criar:

```txt
integrations-oauth-{provider}-client-id
integrations-oauth-{provider}-client-secret
integrations-oauth-{provider}-authorize-url
integrations-oauth-{provider}-token-url
integrations-oauth-{provider}-scopes
```

Exemplo HubSpot:

```txt
integrations-oauth-hubspot-client-id
integrations-oauth-hubspot-client-secret
integrations-oauth-hubspot-authorize-url
integrations-oauth-hubspot-token-url
integrations-oauth-hubspot-scopes
```

Exemplo Conta Azul:

```txt
integrations-oauth-conta-azul-client-id
integrations-oauth-conta-azul-client-secret
integrations-oauth-conta-azul-authorize-url
integrations-oauth-conta-azul-token-url
integrations-oauth-conta-azul-scopes
```

## Comandos modelo

Nunca coloque valores reais em arquivos versionados. Use `gcloud secrets versions add`
com entrada via stdin:

```bash
printf '%s' "$CLIENT_ID" | gcloud secrets create integrations-oauth-hubspot-client-id \
  --project=creatto-463117 \
  --replication-policy=automatic \
  --data-file=-

printf '%s' "$CLIENT_SECRET" | gcloud secrets create integrations-oauth-hubspot-client-secret \
  --project=creatto-463117 \
  --replication-policy=automatic \
  --data-file=-
```

Se o secret ja existir:

```bash
printf '%s' "$CLIENT_ID" | gcloud secrets versions add integrations-oauth-hubspot-client-id \
  --project=creatto-463117 \
  --data-file=-
```

## Escopo inicial por dominio

CRM:

```txt
Historico/BigQuery: contacts, companies/accounts, deals/opportunities, activities
Live/API: contact by id, deal by id, recent changes, owner/user lookup
Actions/API: create note/activity, update deal stage, create task, create contact
```

ERP:

```txt
Historico/BigQuery: customers, suppliers, products, invoices/orders, payments/receivables
Live/API: customer by id, order/invoice by id, product by id, stock snapshot when available
Actions/API: create customer, create order/invoice draft, update order status, create note/tag when available
```

## Resultado esperado do primeiro OAuth

O primeiro provider so esta pronto quando este fluxo funcionar:

```txt
/integracoes cria connection
Control API /connections/setup retorna authorizationUrl
Provider redireciona para /callbacks/provider
Control API troca code por token
Secret Manager salva credentials da connection
Postgres muda status para connected
Control API redireciona para /integracoes/callback?status=connected
UI mostra retorno e a connection aparece conectada
sync manual escreve raw/normalized quando houver recurso habilitado
```
