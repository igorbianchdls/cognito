# Padrão visual de compras, estoque e cadastros

## Telas abrangidas

- Compras, parcelas a pagar e notas de compra.
- Estoque: situação, movimentações, inventários, locais, transferências, kits e conversões.
- Clientes, fornecedores, produtos e serviços. Vendedores, categorias e contas financeiras também receberam o padrão por usarem a mesma página de cadastros.

O item “Notas fiscais” do sidebar aponta atualmente para `/erp/compras/notas-compra`. Essa tela recebeu a padronização, mantendo a importação de NF-e por XML.

## Componentes e comportamento

O padrão é o de contas a pagar: fundo branco, cabeçalho com título e ações, botão verde, abas sublinhadas, pesquisa arredondada, filtros expansíveis, resumo sem caixas separadas, tabela com o mesmo espaçamento e indicadores de situação.

`ErpModuleWorkspaceTabs` utiliza as rotas existentes. Nos cadastros, clientes/fornecedores/vendedores formam um grupo; produtos/serviços/categorias formam outro. O contêiner remove as abas anteriores das telas padronizadas para evitar duplicação.

Os indicadores de cadastros continuam vindo dos endpoints de resumo da base. Compras, estoque e notas identificam os indicadores calculados a partir dos registros carregados. A situação do estoque soma o valor do estoque listado, em vez de somar custos médios unitários.

As notas ganharam pesquisa e filtro de situação sobre as notas carregadas. Formulários, permissões, confirmação/recebimento de compras, contagens, exportações e importação de XML mantêm suas ações existentes. Nenhuma alteração de API, schema ou dados de negócio foi necessária.

## Verificação

- Tipagem do ERP aprovada. Lint sem erros; três avisos anteriores nos controles de revisão e na navegação para importações.
- Navegador isolado com componentes e CSS reais, sessão e dados de GET fictícios: 38 verificações aprovadas. Foram conferidas 17 telas em 1360 px e 375 px, abas ativas, tabelas, botões e abertura dos formulários disponíveis, pesquisa, filtros e estados vazios. Não houve transbordamento horizontal da página nem exceções de interface.
- Vercel: compilação aprovada. Antes e depois da promoção, 28 GETs reais retornaram 200: menu, compras, notas, parcelas de compras, sete consultas de estoque, cadastros, resumos e catálogos de categorias. A sessão ativa existente do proprietário no Clerk foi utilizada com tokens somente em memória.

Versão publicada: `dpl_Dsk1Yj6AgFo5YDdFp3LG5koRTc8e`. Digest de origem: `58315fe36dcf7b558ca7918d4a1feadae82b3f88a08859c01000f52b739d5180`.

Evidências locais: `.cache/erp-workspaces-ui/report.json`, capturas por tela e largura, `staged-reads.json`, `promotion.json` e `production-reads.json`.
