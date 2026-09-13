# Etapa 6 — Validação dos fluxos e preparação da entrega

Esta entrega adiciona uma validação reproduzível e segura para as etapas 4 e 5. Todas as suítes automáticas locais usam dados fictícios. A execução padrão não lê `SUPABASE_DB_URL` e não altera o Supabase operacional.

## Comandos

- `pnpm erp:stage6`: executa regressões, regras de banco em PostgreSQL embutido, interface estática e checagem de tipos; grava `etapa-6-testes.json`.
- `pnpm erp:stage6:concurrency`: exige `ERP_STAGE6_DATABASE_URL`, abre duas sessões PostgreSQL independentes e executa uma prova isolada de concorrência e separação de contexto.
- `pnpm erp:stage6:strict`: exige também as dependências externas, executa a compilação completa e retorna falha enquanto alguma validação estiver bloqueada.

A prova de duas conexões recusa banco remoto por padrão, exige nome de banco que indique teste/homologação e cria um schema temporário identificado pela execução. O schema é removido ao final. Para uma instância remota dedicada de homologação é necessário definir explicitamente `ERP_STAGE6_ALLOW_REMOTE_TEST_DATABASE=true`.

## Cobertura automatizada

- criação, edição, confirmação, repetição e atomicidade de cadastros e documentos;
- pagamento parcial e integral, crédito, adiantamento, devolução, renegociação, estorno, transferência, conciliação e rateio;
- previsões comerciais e efetivação de obrigação;
- períodos fechados e reabertura autorizada;
- recorrências financeiras, de compras e contratos;
- importações CSV e OFX, retomada e repetição;
- históricos, anexos, cobranças, notificações e relatórios mantidos;
- permissões do papel restrito, isolamento entre empresas e rejeição dos relatórios retirados;
- clique simultâneo, perda de resposta e preservação da chave da operação;
- inclusão das páginas do ERP na checagem de tipos.

## Critério de resultado

O arquivo de evidências usa três estados:

- `passed`: a verificação foi executada e aprovada;
- `failed`: a verificação foi executada e encontrou defeito;
- `blocked`: faltou uma dependência declarada, como servidor PostgreSQL de teste, sessão autenticada, armazenamento ou memória para compilação.

O comando comum pode terminar com resultado `partial` para preservar as evidências locais. O comando `erp:stage6:strict` falha enquanto existir qualquer bloqueio e deve ser o critério de liberação. Validações externas concluídas são informadas com `ERP_STAGE6_STORAGE_PASSED=true` e `ERP_STAGE6_BROWSER_PASSED=true`; indicar apenas que o ambiente está disponível não basta.

## Dependências externas atuais

- não há PostgreSQL local disponível para a bateria real com duas conexões;
- `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` não estão configuradas para validar o conteúdo dos anexos;
- o controlador do navegador não conseguiu inicializar neste ambiente; além disso, os fluxos precisam de sessão autenticada ligada a empresas fictícias no banco de homologação;
- a compilação completa do Next.js com webpack passou com 3 GB reservados; o cache não foi gravado porque o disco ficou sem espaço, sem invalidar os artefatos produzidos.

Esses itens não são marcados como aprovados pelos testes isolados. A etapa só atende integralmente ao aceite quando `pnpm erp:stage6:strict` conclui com `passed` e os fluxos essenciais são repetidos sobre a versão compilada.

## Resultado desta execução

A consolidação local aprovou 340 cenários funcionais e estruturais, a checagem de tipos ampliada, a construção do plugin e a compilação de produção. O resultado agregado é `partial`: PostgreSQL com duas sessões, armazenamento e navegador autenticado permanecem bloqueados pelas dependências descritas acima. A evidência detalhada está em `etapa-6-testes.json`.
