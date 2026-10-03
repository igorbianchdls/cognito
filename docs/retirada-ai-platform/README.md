# Retirada da base antiga de integração com IA

Data: 03/10/2026. Escopo: etapas 1, 2 e 3 do plano de recomeçar a integração do ERP.

## Código e dependências

- Retirados `src/products/ai-platform`, as rotas `/api/ai/*`, os metadados OAuth exclusivos e a página `/configuracoes/integracoes-ia`.
- Retirados o adaptador `erpAiApplication`, o CLI antigo, seus comandos, configurações e testes exclusivos.
- Removidos o item de navegação, as exceções públicas do middleware e as variáveis de ambiente exclusivas do CLI.
- Removidas as dependências diretas `@clerk/mcp-tools`, `@modelcontextprotocol/server`, `mcp-handler` e `zod4`.
- Os testes compartilhados mantêm as verificações de permissões e isolamento do ERP.
- Os documentos de retirada de integrações de setembro registram decisões históricas. Suas indicações de preservar a antiga plataforma de IA foram substituídas por esta retirada.

## Banco

As migrações históricas foram preservadas. As três tabelas exclusivas identificadas no código são `shared.ai_connections`, `shared.ai_tool_executions` e `shared.ai_action_approvals`.

A migração `20261003120000_retire_ai_platform.sql` está preparada, sem aplicação ao banco conectado. Ela executa a retirada numa transação, bloqueia as tabelas durante a contagem e recusa tabelas com registros ou dependências externas. Não usa `CASCADE`. A verificação também recusa contagens filtradas por RLS.

O inventário remoto não pôde ser concluído: a conexão configurada foi recusada com código `XX000`. O registro da tentativa está em [inventario-banco.md](inventario-banco.md). Não é possível afirmar que as tabelas estejam vazias ou sem dependências no ambiente remoto.

Para repetir o inventário após corrigir a conexão: `pnpm erp:retired-ai-audit`. O comando é somente de leitura e não aplica a migração. Antes de uma aplicação futura, revisar as dependências e arquivar eventuais registros históricos em um destino separado; tabelas com registros continuarão bloqueadas.

## Verificações

- Segurança: permissões, contexto de empresa e isolamento de consultas aprovados.
- Estrutura do ERP: 10 verificações aprovadas.
- Operações da interface do ERP em banco PostgreSQL local: 44 verificações aprovadas.
- Integridade financeira em banco PostgreSQL local: 78 verificações aprovadas.
- Migração em PostgreSQL local: banco vazio, registros existentes, chave estrangeira externa, instalação parcial e view dependente aprovados; reaplicação sem tabelas também aprovada. Os dados de uma tabela do ERP permaneceram intactos em todos os cenários.
- Checagem de tipos do ERP aprovada.
- Checagem isolada de tipos do script de inventário aprovada.
- Build completo de produção aprovado, incluindo a checagem geral de tipos e geração de páginas. O manifesto não contém as antigas rotas de IA, OAuth ou a configuração de integrações de IA.
- Página pública de login respondeu com HTTP 200 no servidor de produção local.
- Acesso protegido a `/erp` e `/api/erp/acesso` não pôde ser validado: HTTP 500 por ausência de `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, confirmado pelo erro `Missing publishableKey` do Clerk. O middleware de autenticação do ERP foi preservado; a exceção sem chave continua restrita às páginas públicas. Login autenticado e navegação em sessão real permanecem pendentes da configuração local de autenticação e do banco.

Os bancos usados nos testes foram locais e temporários, sem acesso ao banco conectado. Os arquivos temporários e o diretório de build `.next` foram removidos após as verificações.

O novo MCP não faz parte desta implementação.
