# Padrão visual das telas de vendas

Orçamentos, pedidos de venda, ordens de serviço e contratos seguem o padrão visual de contas a pagar.

## Implementação

- Cabeçalho branco, título, botão verde de adicionar e menu de atualização usam `ErpWorkspaceHeader`.
- As abas de vendas e financeiro compartilham o mesmo componente de navegação. O contêiner do ERP remove as abas anteriores e a margem externa das quatro telas de vendas.
- Pesquisa, filtros, espaçamentos, tabela e indicadores de situação seguem os componentes e estilos do financeiro.
- Os resumos comerciais usam os registros carregados e informam esse alcance. Não representam um total global nem um período mensal que a consulta não filtrou.
- Contratos mantém a exportação e a geração de vendas, inclusive no celular. Os formulários, permissões e ações existentes foram preservados.
- Nos pedidos, as células de situação, atendimento e fiscal agora seguem a ordem dos respectivos cabeçalhos. Atendimento parcial aparece como “Parcial”.

## Verificação

- Tipagem do ERP aprovada. Lint sem erros nos arquivos alterados; existe um aviso anterior no controle de revisão de carregamento de `ErpOperationsWorkspacePage`.
- Navegador isolado: componentes reais do ERP e CSS, com dados de consulta e sessão locais. Dez verificações aprovadas: quatro telas em 1360 px e 375 px, pesquisa/estado vazio e alinhamento das colunas. Também foram verificadas a abertura dos formulários, as abas, os filtros existentes, o botão de adicionar e a ausência de transbordamento horizontal da página.
- Vercel: compilação aprovada. Antes e depois da promoção, cinco GETs reais autenticados retornaram 200: acesso ao menu, orçamentos, vendas, ordens de serviço e contratos. Foi usada uma sessão ativa existente do proprietário no Clerk; tokens ficaram apenas em memória.

Versão publicada: `dpl_DvAxF7WDZgy8jrVgWSa5jDJ1jzUi`, digest `726f3d81a78149295fd722082c90c7897dc377b400c9b910f518da7eece6931c`.

Evidências locais: `.cache/erp-sales-ui/report.json`, capturas de desktop e celular, `staged-reads.json`, `promotion.json` e `production-reads.json`. Nenhuma migração ou alteração em dados de negócio foi realizada.
