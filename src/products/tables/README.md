# Tables

Produto de tabelas personalizadas. Entrada `/tables`, API `/api/tables`, dados no schema `tables`. Frontend, handlers, regras e contratos ficam neste product; as rotas Next são adaptadores.

## Implementado

- Bases vazias ou com estrutura de projetos, criação e edição de tabelas/campos.
- Grade com edição de células, detalhes, seleção e exclusão em lote.
- Seleções, responsáveis e vínculos com registros de outras tabelas da mesma base.
- Visualizações persistidas de grade, Kanban e calendário; filtros, ordenação, agrupamento, visibilidade, largura e ordem dos campos.
- Movimento de cartões por arrastar e soltar no Kanban.
- Comentários, atividade e lixeira de bases/tabelas/registros/campos.
- Schema com 14 tabelas, integridade de escopo, histórico e versão transacional do registro, incluindo alterações relacionais.
- Anexos privados: preparação, upload assinado, confirmação, download e remoção lógica.

Não há dados de exemplo inseridos automaticamente. O modelo de projetos cria apenas campos, opções e visualizações. Os registros são do Tables e não apontam para cadastros do ERP.

## Acesso nesta entrega

Reutiliza Clerk e a empresa ativa. Usa os papéis organizacionais existentes: leitor consulta; membros, administradores e proprietários podem escrever. O backend e o banco verificam vínculo ativo. Não introduz regras comerciais ou de plano. `base_membros` fica reservada para uma etapa futura; não há configuração de permissões por base nesta interface.

O papel `tables_runtime` não tem bypass de RLS nem grants nos dados do ERP. O schema não precisa ser exposto na Data API. A infraestrutura de conexão reutiliza a configuração TLS já existente, com contexto próprio durante cada transação.

## Arquivos

A migration cria o bucket privado `tables-anexos`. A credencial é resolvida nesta ordem: `TABLES_SUPABASE_SERVICE_ROLE_KEY`, a credencial de Storage já configurada `ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. A origem padrão deriva da conexão de banco; `TABLES_SUPABASE_URL` pode sobrescrevê-la apenas para o mesmo projeto. Chaves JWT são conferidas contra esse projeto e o papel de serviço. Nunca enviar a chave ao navegador.

Sem uma chave de Storage compatível, o restante do produto continua operacional e a tentativa de envio recebe uma mensagem de indisponibilidade. A manutenção diária já existente chama o worker de Tables. Ele remove objetos pendentes ou excluídos com mais de 24 horas, após bloquear e conferir novamente o registro e o anexo. Preserva arquivos confirmados, envios recentes e o histórico. Uma falha física conserva os metadados para repetição. Confirmações de envios expirados recebem HTTP 409; o usuário deve enviar novamente.

## Contratos e comportamento

- Valores simples em `registros.valores`, indexados pelo ID estável do campo. Valores relacionais apenas nas tabelas correspondentes.
- Moeda trafega como decimal em texto e os totais são calculados com `numeric` no PostgreSQL.
- Gravação recebe `expectedVersion` e `expectedStructureVersion`. HTTP 409 identifica conflito; é preciso atualizar a tela para reaplicar a edição.
- Tipos/destinos de campos com registros existentes não são convertidos nesta etapa. Campos excluídos podem ser restaurados pela lixeira, com os valores anteriores. Voltam como opcionais, pois outros registros podem ter sido criados enquanto estavam excluídos. Filtros e agrupamentos removidos junto com o campo não são reaplicados automaticamente.
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
node scripts/tables/storage-smoke.mjs
node scripts/tables/database.mjs --check
node scripts/tables/database.mjs --apply
```

Os testes isolados usam PostgreSQL em memória e identidades fictícias. A verificação de navegador usa a UI, os handlers e as consultas reais; apenas navegação Next e identidade Clerk são fixtures. O teste de Storage isolado cobre expiração, proteção de arquivos recentes/confirmados e repetição após falhas. Relatórios ficam em `.cache/tables`. O aplicador valida o SQL exato e o projeto, aplica em transação e preserva os schemas existentes.

Para publicação, `scripts/tables/stage-deployment.mjs --production` cria uma versão com configuração de produção sem atribuir o domínio. `deployment.mjs status` acompanha a compilação completa; `deployment-http.mjs` valida Clerk, CRUD, conflitos, restauração e upload/download privados reais. A base temporária do teste é movida para a lixeira; seu anexo excluído segue a manutenção normal. `deployment.mjs promote` exige esses relatórios, os mesmos arquivos da aplicação e a produção anterior intacta. `deployment-http.mjs --production` confere o domínio após a promoção.
