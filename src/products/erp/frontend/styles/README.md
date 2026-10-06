# Aparência das páginas do ERP

`workspace.css`, importado pelo layout principal depois dos estilos globais, define a área principal à direita do sidebar, inspirada na referência visual do Ramp fornecida pelo usuário. O sidebar e os outros produtos têm estilos próprios.

## Organização

- `ErpShell` aplica `erp-workspace-surface` e as variáveis de margem e divisórias.
- `ErpWorkspaceChrome` reúne cabeçalho, abas, resumo, busca, período, filtros e seleção em lote.
- `ErpRecordIdentity` exibe ícone ou inicial circular, nome e categoria.
- A classe `erp-workspace-table` aplica a mesma aparência às tabelas dos cadastros, financeiro, vendas, compras, estoque e notas de serviço.
- `dashboards.css`, importado diretamente pelo layout depois de `workspace.css`, define a aparência da **Visão geral**: quatro indicadores em cards retangulares, seletores de dashboard e período junto aos botões Atualizar e Filtros no cabeçalho, pendências discretas e seções abertas para gráficos e tabelas. Os demais dashboards mantêm sua organização.

`DashboardMetrics`, `DashboardChartView` e `DashboardListView` recebem `appearance="ramp"` na visão geral. Esse parâmetro muda a apresentação; valores, séries, filtros, permissões e links continuam vindo da API. As tabelas usam `ErpRecordIdentity`; a linha secundária aparece apenas quando a consulta fornece um detalhe.

Nos cards de indicadores, valores e variações positivos são verdes, negativos são vermelhos e zero permanece neutro. A seta acompanha a cor da variação; comparações sem base permanecem neutras.

As margens laterais são de 20 px no celular, 40 px em telas intermediárias e 52 px em telas maiores. Os indicadores ficam agrupados à esquerda; no celular, usam duas colunas. As tabelas podem rolar horizontalmente dentro da sua própria região.

## Colunas

`ErpTableColumns` oferece um seletor acessível com caixas de seleção e a opção **Restaurar padrão**. A escolha vale enquanto a página está aberta; não é salva no banco nem compartilhada entre empresas.

Nos cadastros, a primeira coluna permanece visível. No financeiro, descrição, vencimento, cliente/fornecedor, saldo e situação permanecem visíveis. Dinheiro, crédito e natureza (nas contas a pagar) ficam inicialmente ocultos e podem ser exibidos pelo seletor. Os dados recebidos da API e os cálculos financeiros permanecem completos.

## Verificação

`node scripts/erp/workspace-ui-smoke.mjs` verifica a renderização inicial dos componentes reais, o alinhamento das colunas e a compilação dos estilos. Navegação, acesso e abertura do sidebar usam substitutos locais nesse teste. Ele não confirma aparência ou interação em navegador.
