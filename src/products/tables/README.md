# Tables

Produto de tabelas personalizadas. Entrada `/tables`, API `/api/tables`, dados no schema `tables`. Frontend, handlers, regras e contratos ficam neste product; as rotas Next são adaptadores.

## Implementado

- Bases vazias ou com estrutura de projetos, criação e edição de tabelas/campos.
- Grade com edição de células, detalhes, seleção e exclusão em lote.
- Seleções, responsáveis e vínculos com registros de outras tabelas da mesma base.
- Visualizações persistidas de grade, Kanban e calendário; filtros, ordenação, agrupamento, visibilidade, largura e ordem dos campos.
- Movimento de cartões por arrastar e soltar no Kanban.
- Comentários, atividade e lixeira de bases/tabelas/registros.
- Schema com 14 tabelas, integridade de escopo, histórico e versão transacional do registro, incluindo alterações relacionais.
- Anexos privados: preparação, upload assinado, confirmação, download e remoção lógica.

Não há dados de exemplo inseridos automaticamente. O modelo de projetos cria apenas campos, opções e visualizações. Os registros são do Tables e não apontam para cadastros do ERP.

## Acesso nesta entrega

Reutiliza Clerk e a empresa ativa. Usa os papéis organizacionais existentes: leitor consulta; membros, administradores e proprietários podem escrever. O backend e o banco verificam vínculo ativo. Não introduz regras comerciais ou de plano. `base_membros` fica reservada para uma etapa futura; não há configuração de permissões por base nesta interface.

O papel `tables_runtime` não tem bypass de RLS nem grants nos dados do ERP. O schema não precisa ser exposto na Data API. A infraestrutura de conexão reutiliza a configuração TLS já existente, com contexto próprio durante cada transação.

## Arquivos

A migration cria o bucket privado `tables-anexos`. Configurar `TABLES_SUPABASE_SERVICE_ROLE_KEY` (ou a variável genérica existente `SUPABASE_SERVICE_ROLE_KEY`). `TABLES_SUPABASE_URL` é opcional quando o projeto pode ser derivado da conexão; a origem precisa corresponder ao mesmo projeto do banco. Nunca enviar a chave ao navegador.

Sem uma chave de Storage no ambiente, o restante do produto continua operacional e a tentativa de envio recebe uma mensagem de indisponibilidade. Não há cron de limpeza de uploads abandonados nesta primeira entrega; a implementação preserva metadados pendentes para futura reconciliação.

## Contratos e comportamento

- Valores simples em `registros.valores`, indexados pelo ID estável do campo. Valores relacionais apenas nas tabelas correspondentes.
- Moeda trafega como decimal em texto e os totais são calculados com `numeric` no PostgreSQL.
- Gravação recebe `expectedVersion` e `expectedStructureVersion`. HTTP 409 identifica conflito; é preciso atualizar a tela para reaplicar a edição.
- Tipos/destinos de campos com registros existentes não são convertidos nesta etapa. A exclusão de campo preserva seus dados no banco; a interface de restauração de campos é uma evolução pendente.
- Campos obrigatórios são configurados antes da criação de registros; anexos obrigatórios não fazem parte desta etapa.
- Visualizações são compartilhadas na empresa nesta entrega. Filtros e colunas ocultas não restringem acesso aos dados.
- Paginação no servidor: 50 registros por página na grade e 100 nas demais visualizações. Não são cotas do plano; todas as páginas ficam acessíveis.
- Calendário usa o mês selecionado e o fuso do navegador para instantes; datas sem hora mantêm o dia de calendário.
- Sem presença/realtime, fórmulas, automações, convites, links públicos ou integração ERP nesta etapa.

## Verificação

```text
node node_modules/typescript/bin/tsc -p tsconfig.tables.json --pretty false
node node_modules/eslint/bin/eslint.js src/products/tables src/app/tables src/app/api/tables
node scripts/tables/smoke.mjs
node scripts/tables/ui-smoke.mjs
node scripts/tables/database.mjs --check
node scripts/tables/database.mjs --apply
```

Os testes usam PostgreSQL em memória e identidades fictícias. A verificação de navegador usa a UI, os handlers e as consultas reais; apenas navegação Next e identidade Clerk são fixtures. Os relatórios ficam em `.cache/tables`. O aplicador exige teste do SQL exato, valida o projeto configurado, aplica em transação, registra a migration e confere que a quantidade de tabelas dos schemas existentes foi preservada. Não publica o aplicativo.
