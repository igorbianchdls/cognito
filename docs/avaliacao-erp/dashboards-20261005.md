# Entrega dos dashboards — 05/10/2026

## Implementação

Sete dashboards: Visão geral, Financeiro, Vendas, Compras, Estoque, Resultados e Serviços e contratos. A Visão geral também substitui o resumo inicial em `/erp`. Navegação em `/erp/dashboards/{id}`.

- Um arquivo de queries por dashboard em `src/products/erp/server/dashboards/`.
- Contratos e validações em `src/products/erp/shared/dashboardContracts.ts`.
- Uma pasta de frontend por área e componentes compartilhados.
- Filtros de período, comparação anterior, previsões financeiras, atualização, estados vazios/erros e tabelas acessíveis dos gráficos.
- Indicadores/rankings abrem registros filtrados e paginados, com totais de toda a consulta.
- Dois endpoints GET protegidos por sessão, capacidades, contexto de empresa e RLS.
- A exceção das rotas de dashboard no bloqueio antecipado do proxy mantém Clerk middleware e permite que `withErpHttp` devolva a resposta JSON 401/403. A API continua autenticada; não há acesso anônimo aos dados.

Nenhuma migration, tabela nova, alteração ou exclusão de dados de negócio foi necessária.

Documentação de fórmulas e arquitetura: `src/products/erp/server/dashboards/README.md`. Interface: `src/products/erp/frontend/modules/dashboards/README.md`.

## Evidências

| Verificação | Resultado |
| --- | --- |
| Tipagem do ERP | Passou |
| Lint dos módulos novos/alterados e proxy | Passou |
| Catálogo de API | 59 rotas, 83 métodos; passou |
| Supabase real, empresa de Igor | 23 verificações; passou |
| Links de indicadores/rankings | 103 consultas, todos os totais reconciliados |
| HTTP local com SQL real | 36 verificações; passou |
| Interface em navegador isolado | 21 verificações; passou |
| Desktop/celular | Sete dashboards em 1360 e 375 px, sem overflow da página |
| Dados das empresas 1 e 2 | Impressões digitais de 44 tabelas idênticas antes/depois |
| Build completo na Vercel | READY |
| Verificações públicas após publicação | 11; passou |

As consultas independentes de setembro conferiram vendas de R$ 87.123,74, compras de R$ 65.734,00 e resultado pelo caixa de −R$ 15.226,89. Posições atuais usam a referência real da requisição, não a data fixa usada para preparar o cenário demonstrativo de 06/10.

A ferramenta de navegador do aplicativo falhou ao iniciar. A validação visual usou um Chromium isolado, os componentes e CSS reais, os handlers reais e o Supabase. Apenas navegação Next e sessão externa Clerk foram substituídas no teste local. Não se trata de um teste de login real nem de OAuth no ChatGPT.

Evidências privadas ignoradas pelo Git: `.cache/dashboards/read-smoke.json`, `http-smoke.json`, `ui-smoke.json`, `deployment.json` e 16 screenshots em `ui/`.

## Publicação

- Endereço: https://cognito-seven.vercel.app/erp
- Deployment verificado: `dpl_EVkJwRm74ZhYEBqW7DH8yV1BZiQg`.
- Digest da fonte: `87c88ea66e6dc05bd2f1737e1eee2d3511ebcb8161baecf4c2a885e993279082`.
- Alias público confirmado apontando para esse deployment.
- Sete resumos e a consulta de registros retornam JSON 401 sem sessão.
- Páginas do ERP encaminham o navegador sem sessão ao login Clerk.
- Metadata pública existente do MCP continua disponível.

Fiscal e OAuth dentro do ChatGPT permanecem fora desta entrega, conforme o escopo definido anteriormente.
