# Integracoes Cloud

Este pacote reserva o codigo que sera executado fora do app Next.js quando a orquestracao do ETL for movida para Google Cloud.

Status atual:

- Estrutura criada para a Etapa 5.
- Sem deploy ativo.
- Sem chamadas reais a Cloud Run, BigQuery, Secret Manager ou Pub/Sub.
- Sem credenciais ou secrets neste repositorio.

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

Quando Google Cloud entrar:

1. Implementar autenticação interna no `control-api`.
2. Trocar stubs em `lib/` por SDKs reais.
3. Adicionar Dockerfiles ou build target do deploy.
4. Ligar `src/products/integracoes/server/integrationControlClient.ts` ao endpoint Cloud Run.
5. Gravar credenciais no Secret Manager e dados no BigQuery.

