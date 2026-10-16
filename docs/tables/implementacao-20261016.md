# Tables — primeira implementação

## Escopo

Produto em `src/products/tables`, com frontend, API, serviços e contratos. As rotas de interface e HTTP são adaptadores Next. O sidebar existente ganhou uma seção Tables. A autenticação usa a sessão Clerk e a empresa selecionada; regras novas de produto/plano e permissões por base foram adiadas conforme orientação do usuário.

O schema `tables` contém 14 tabelas. A migration `20261016120000` foi aplicada no Supabase configurado em 16/10/2026. Também foi criado o bucket privado `tables-anexos`. A contagem de tabelas dos schemas existentes permaneceu igual: ERP 105, shared 8 e plugin 4. Não foram criadas bases ou registros de exemplo em produção.

## Entregas

- Criação de bases vazias ou com campos e visualizações para projetos.
- Criação/edição de tabelas, campos e opções; exclusão recuperável de bases, tabelas e registros.
- Grade com edição de células, detalhes, seleção e exclusão em lote transacional.
- Campos simples e relacionais, incluindo responsáveis e vínculos entre tabelas da mesma base.
- Filtros, ordenação, agrupamento e configuração persistida de campos por visualização.
- Kanban com movimento de cartões e calendário com filtro por mês.
- Comentários, atividade e preservação de dados excluídos.
- Histórico gerado no banco e controle de versão, incluindo alterações relacionais.
- Endpoints e interface de anexos privados.

## Verificação realizada

- Verificação de tipos do produto.
- ESLint dos arquivos de produto e integração alterados.
- 11 cenários de PostgreSQL isolado: migration, CRUD, relações, filtros/totais, rollback, conflitos, RLS, histórico, comentários, preferências de visualização e restauração.
- 11 cenários de navegador: criação de base e registros, totais, edição inline, comentários, filtros, grade/Kanban/calendário, campos e checkbox, exclusão/restauração e ausência de overflow da página no celular.
- Preflight do Supabase e confirmação da migration registrada com 14 tabelas.
- Leitura real com o papel `tables_runtime`, validando vínculo ativo e consulta aos membros.
- O empacotamento Next compilou com sucesso. A compilação geral foi interrompida durante a verificação global de tipos após erro de espaço em disco ao gravar o cache Turbopack; não é um build completo aprovado. O processo desta compilação foi encerrado e seu cache descartável removido. A verificação de tipos específica do produto passou.
- O Next instalado ajustou automaticamente `compilerOptions.jsx` para `react-jsx`, configuração obrigatória dessa versão.

Os testes de navegador usam a interface, handlers e consultas reais, com PostgreSQL em memória e fixtures de identidade/navegação. Não equivalem a um teste de login Clerk no domínio publicado. Relatórios e capturas ficam em `.cache/tables` no projeto.

## Pendências conhecidas

- Publicação do aplicativo não faz parte desta primeira alteração local.
- Upload/download de anexos exige `TABLES_SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`. A chave não estava configurada no `.env.local` observado; as operações de arquivo devolvem indisponibilidade nesse ambiente. O restante do Tables funciona sem ela.
- Ainda não há limpeza automática dos arquivos pendentes, restauração de campos pela interface, conversão de tipos com dados existentes, exportação, realtime ou permissões por base.
- Limites comerciais, cobrança, fórmulas e automações permanecem para etapas posteriores.

Consulte `src/products/tables/README.md` para comandos e contratos de operação.
