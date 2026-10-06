# Novo visual dos dashboards — 05/10/2026

## Implementação

O conceito visual aprovado foi implementado na Visão geral do ERP, com navegação lateral existente do aplicativo:

- Quatro indicadores principais: saldo disponível, vendas confirmadas, compras confirmadas e resultado pelo caixa.
- Faixa de atenção com pagamentos vencidos, próximos pagamentos, produtos para repor e ordens atrasadas.
- Gráficos reais de fluxo de caixa e vendas, com proporção de largura 3:2 em desktop.
- Tabelas compactas de próximos vencimentos e principais clientes; links para os registros correspondentes.
- Outras pendências em seção expansível.
- Cabeçalho compacto com seletores de dashboard/período, atualização e filtros avançados recolhidos inicialmente.
- Cards e cabeçalho compartilhados aplicados aos sete dashboards; datas, comparação, previsões e erros continuam disponíveis.

Nenhum valor ou cadastro ilustrativo da imagem foi inserido no banco ou usado como dado fixo. Gráficos e tabelas vêm das consultas reais. A tabela financeira mostra saldo restante e a data de cada parcela nos próximos sete dias; clientes e valores comerciais respeitam o período escolhido.

## Permissões e leitura

O resultado pelo caixa na Visão geral exige tanto acesso financeiro quanto acesso a relatórios. Usuários de outras áreas veem somente os respectivos indicadores, gráficos e listas autorizados. A consulta de vencimentos usa o mesmo snapshot, contexto de empresa e RLS do dashboard.

Ao mudar usuário, empresa ou filtro, o conteúdo anterior é descartado e a requisição anterior é cancelada. O estado de expansão dos filtros é mantido ao mudar datas, comparação e previsões, para permitir várias alterações sem reabrir o painel.

## Verificação

| Verificação | Resultado |
| --- | --- |
| Tipagem do ERP | Passou |
| Lint dos arquivos alterados | Passou |
| Consultas reais, permissões e filtros | 26 verificações; passou |
| Conferência dos indicadores/rankings | 108 consultas; totais reconciliados |
| Cálculos independentes dos registros brutos | 44 comparações; passou |
| Interface em navegador isolado | 27 verificações; passou |
| Responsividade | Sete dashboards em 1360 e 375 px, sem overflow horizontal da página |
| Dados de negócio anteriores | Impressões digitais preservadas nas duas empresas |

A validação visual usou componentes, CSS, handlers e consultas reais, substituindo apenas a sessão externa do Clerk e a navegação Next no ambiente isolado. O navegador integrado do aplicativo falhou ao iniciar. O teste de filtros detectou e levou à correção do fechamento do painel ao alterar opções. A captura dos estilos de tamanho variável também foi ajustada no script de teste. A inspeção dos gráficos identificou e corrigiu a ausência dos eixos, grade e legenda; os elementos compartilhados passaram a ser filhos diretos reconhecidos pela biblioteca de gráficos. O teste visual passou a exigir eixos e grade em cada dashboard com movimentos.

O relatório e as capturas locais ficam em `.cache/dashboards/`, ignorada pelo Git. A evidência visual apresenta os componentes de conteúdo dentro de `ErpShell`; a navegação global do aplicativo é reutilizada no ERP e não foi recriada na captura isolada.

## Arquivos principais

- `src/products/erp/frontend/modules/dashboards/visao-geral/OverviewDashboardView.tsx`: organização da Visão geral e tabelas compactas.
- `src/products/erp/frontend/modules/dashboards/components/DashboardPage.tsx`: cabeçalho, filtros, navegação e carregamento.
- `src/products/erp/frontend/modules/dashboards/components/DashboardViews.tsx`: cards, gráficos e formatação compartilhados.
- `src/products/erp/server/dashboards/visaoGeralQueries.ts`: composição autorizada, resultado, clientes e vencimentos.
- `src/products/erp/server/dashboards/drilldownLinks.ts`: links das parcelas e indicadores.

Implementação no workspace e validação local concluídas. Publicação em produção não integra esta execução; este relatório não confirma alteração do site publicado.
