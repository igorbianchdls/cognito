# Nome e categoria nas tabelas do ERP

## Comportamento

- Componente compartilhado `ErpRecordIdentity`: ícone à esquerda, nome/descrição na primeira linha e categoria na segunda.
- Sem ícone, usa a primeira letra com uma das oito combinações de cores. A cor é calculada a partir do identificador do registro e permanece estável após recarregar.
- Categoria ausente: mostra `Sem categoria`, sem inferir uma classificação.
- Nomes longos são abreviados visualmente; o texto completo permanece no atributo de título.

## Dados e módulos

- Clientes e fornecedores: classificação existente em `erp.entidades.metadata.categoria`.
- O cadastro de clientes passou a oferecer o campo de categoria, usando a persistência existente.
- Produtos e serviços: categoria associada no cadastro.
- Vendas, orçamentos e compras: descrição do primeiro item ativo, seguida de `+ N item/itens`. A categoria é a financeira do documento, vinculada a `erp.categorias`.
- Número do documento e cliente/fornecedor continuam em colunas próprias.
- Contas a pagar e receber: descrição e categoria financeira juntas; fornecedor/cliente e parcela em outra coluna.
- Estoque: situação, movimentações, kits e conversões retornam a categoria do produto. Locais mostram seu tipo abaixo do nome.
- Categorias e contas financeiras mostram o tipo abaixo do nome quando não há categoria própria.
- As consultas adicionais respeitam a empresa tanto no documento quanto nos itens/categorias.
- Não houve alteração de schema, criação de dados ou exclusão de registros.

## Validação

- TypeScript do ERP: aprovado.
- Lint dos arquivos alterados: sem erros; quatro avisos anteriores em arquivos existentes.
- 28 verificações visuais nos componentes reais, usando respostas simuladas: computador (1360px), celular (375px), cores após recarregar, categoria ausente, alinhamento entre colunas e linhas, campo de categoria do cliente e resultado vazio de vendas.
- Consultas reais no Supabase com contexto restrito e somente leitura da empresa 2/usuário 3: descrições e categorias de 50 vendas, 50 compras, 50 contas a pagar e 50 contas a receber conferidas contra os dados de origem; pesquisa por descrição e isolamento entre empresas aprovados.
- Estoque: consultas aprovadas nos quatro recursos alterados. Kits e conversões não tinham registros na empresa; a renderização com registros foi coberta pelos testes simulados.
- Os testes visuais usam sessão e API simuladas. A autenticação e as respostas publicadas são verificadas separadamente com sessão real do Clerk.

## Publicação

Publicada em https://cognito-seven.vercel.app/erp.

- Compilação remota: aprovada.
- 14 consultas GET na versão preparada e novamente no domínio principal: todas HTTP 200, com sessão real do Clerk e validação dos campos de categoria/descrição.
- Deployment: `dpl_JAo3Qtx4Em1w3nHWBvAvxLw4L4Po`.
- Digest do código: `6e7e44cec04e136c1b40d37576c0a586e8d7dcc2dfc9a688014e4d031878897b`.
- Promoção realizada somente após conferir os testes, os arquivos enviados e a versão anterior do domínio.
