# Tables — implementação e validação

## Escopo

Produto em `src/products/tables`, com frontend, API, serviços e contratos. As rotas de interface e HTTP são adaptadores Next. O sidebar existente ganhou uma seção Tables. A autenticação usa a sessão Clerk e a empresa selecionada; regras novas de produto/plano e permissões por base foram adiadas conforme orientação do usuário.

O schema `tables` contém 14 tabelas. A migration `20261016120000` foi aplicada no Supabase configurado em 16/10/2026. Também foi criado o bucket privado `tables-anexos`. A contagem de tabelas dos schemas existentes permaneceu igual: ERP 105, shared 8 e plugin 4. O produto não insere dados de exemplo automaticamente. A validação HTTP usa uma base temporária identificada e a move para a lixeira ao terminar.

## Entregas

- Criação de bases vazias ou com campos e visualizações para projetos.
- Criação/edição de tabelas, campos e opções; exclusão recuperável de bases, tabelas, registros e campos.
- Grade com edição de células, detalhes, seleção e exclusão em lote transacional.
- Campos simples e relacionais, incluindo responsáveis e vínculos entre tabelas da mesma base.
- Filtros, ordenação, agrupamento e configuração persistida de campos por visualização.
- Kanban com movimento de cartões e calendário com filtro por mês.
- Comentários, atividade e preservação de dados excluídos.
- Histórico gerado no banco e controle de versão, incluindo alterações relacionais.
- Anexos privados com envio assinado, confirmação, download com nome original e exclusão.
- Limpeza diária dos envios abandonados e anexos excluídos há mais de 24 horas, integrada à manutenção existente, com bloqueio contra concorrência e repetição após falhas.

## Verificação realizada

- Verificação de tipos do produto.
- ESLint dos arquivos de produto e integração alterados.
- 12 cenários de PostgreSQL isolado: migration, CRUD, relações, filtros/totais, rollback, conflitos, RLS, histórico, comentários, preferências de visualização e restauração de registros/campos.
- 12 cenários de navegador: criação de base e registros, totais, edição inline, comentários, filtros, grade/Kanban/calendário, campos e checkbox, exclusão/restauração e ausência de overflow da página no celular.
- 4 cenários isolados de Storage: protocolo de upload/confirmação/download, expiração, falhas físicas e repetição da limpeza, preservando arquivos novos e confirmados.
- Preflight do Supabase e confirmação da migration registrada com 14 tabelas.
- Leitura real com o papel `tables_runtime`, validando vínculo ativo e consulta aos membros.
- Compilação completa na Vercel, incluindo TypeScript global e geração de páginas. O cache persistente de build foi desabilitado para evitar a falha anterior de espaço no disco local.
- Testes HTTP na versão candidata, com sessão Clerk real e empresa ativa: proteção anônima, página autenticada, CRUD, conflito de versão, restauração de campos e upload/download privados reais. Os relatórios identificam a versão exata verificada.
- O Next instalado ajustou automaticamente `compilerOptions.jsx` para `react-jsx`, configuração obrigatória dessa versão.

Os testes de navegador usam a interface, handlers e consultas reais, com PostgreSQL em memória e fixtures de identidade/navegação. A validação HTTP separada usa a sessão Clerk e o Supabase reais. Relatórios e capturas ficam em `.cache/tables`; os relatórios de compilação, validação, promoção e produção ficam em `.cache/tables/deployment`.

## Decisões e próximas etapas

Publicado em 16/10/2026 em `https://cognito-seven.vercel.app/tables`. A versão `dpl_BPM7UC114VY6Vm3dzcfknmJXc62y` passou na compilação completa e nos testes reais antes da promoção. O domínio de produção foi conferido depois da promoção, com página autenticada e API protegida. As agendas existentes foram preservadas. A base temporária dos testes está na lixeira; os anexos de teste foram marcados como excluídos e seguem a limpeza automática normal.

- O Storage de produção reutiliza a credencial já configurada para o mesmo projeto do banco. A chave genérica antiga aponta para outro Supabase e não é usada quando existe a configuração correta. O código confere origem e projeto antes de acessar arquivos. O ambiente local continua precisando de uma credencial compatível para enviar arquivos reais.
- Campos restaurados retornam opcionais e conservam os valores anteriores. Filtros/agrupamentos removidos na exclusão do campo não são restaurados automaticamente.
- Conversão de tipos com dados existentes, exportação, realtime e permissões por base permanecem para etapas posteriores.
- Limites comerciais, cobrança, fórmulas e automações permanecem para etapas posteriores.

Consulte `src/products/tables/README.md` para comandos e contratos de operação.
