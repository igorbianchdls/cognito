# Testes de permissões — 15/10/2026

## Banco e regras de acesso

Executados contra o banco real, dentro de uma transação integralmente desfeita. Identidade, vínculo, perfil e produto fictícios QA-OTTO não foram persistidos. O vínculo original do proprietário foi comparado antes e depois e permaneceu idêntico.

11 grupos aprovados:

- Administrador com as 15 capacidades previstas.
- Isolamento entre empresas nas 105 tabelas ERP com coluna de empresa.
- Perfil sem permissões sem capacidades nem leitura nas 105 tabelas.
- Matriz das 15 capacidades isoladas, sem liberação de capacidades adicionais.
- Atribuição do perfil administrador a viewer rejeitada.
- Viewer limitado a leitura mesmo quando seu perfil contém capacidades de escrita; comparação com a regra compartilhada do servidor.
- Inclusão de produto por viewer rejeitada pelo banco.
- Alteração e exclusão de produto por viewer sem registros alcançados.
- Operador de cadastros consegue criar produto, mas não lê vendas, compras, títulos ou estoque, nem cria produto em outra empresa.
- Suspensão local bloqueia capacidades e leitura.
- Usuário sem vínculo sem registros nas 105 tabelas.

A primeira tentativa também comprovou a proteção que impede retirar o último proprietário ativo da empresa; a execução final usou uma identidade fictícia para preservar esse requisito.

Evidência: `.cache/erp-access/permissions-production.json`.

## API publicada

Sessão real do proprietário: GET `/api/erp/acesso` responde 200 com 15 capacidades. Sem autenticação: 401 `AUTH_REQUIRED`. Nenhuma alteração de negócio nessa verificação.

Evidência: `.cache/erp-access/production-smoke.json`.

## MCP

58 grupos aprovados, 175 chamadas, zero falhas: catálogo nos dois protocolos, operações de escrita sem escopo de escrita rejeitadas, empresa não autorizada rejeitada e argumentos/rascunhos inválidos rejeitados. Foram exercitadas 57 ferramentas de negócio. São testes negativos; não representam execução bem-sucedida de todas as 62 ferramentas do catálogo. Autenticação do transporte fornecida pela fixture; conexão OAuth externa não testada.

Rollback confirmado e comparação dos registros originais idêntica. Evidência: `.cache/erp-access/permissions-mcp.json`.

## Limites de cobertura visual

Não foi realizada navegação visual com uma segunda conta Clerk de consulta/operador. Os perfis foram exercitados no banco real e na regra compartilhada, sem criar contas Clerk ou alterar sessões existentes. Testes negativos não equivalem a executar todas as operações comerciais com cada perfil.
