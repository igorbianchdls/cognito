# Interface dos dashboards

`DashboardRouter.tsx` escolhe a área. Cada uma das sete pastas possui seu componente de entrada, para permitir evoluir uma tela sem concentrar tudo em um arquivo. `components/DashboardPage.tsx` mantém filtros e consulta a API; `DashboardViews.tsx` compartilha cards, gráficos, listas, formatação e estados vazios. `DashboardRecordsPage.tsx` permite conferir os registros dos indicadores.

O ERP abre a nova Visão geral em `/erp`. As demais telas ficam em `/erp/dashboards/{id}` e aparecem no menu Dashboards. O backend decide quais áreas o usuário pode consultar; a navegação recebida pela interface respeita essas permissões.

Filtros ficam na URL. Mudança de empresa, usuário, dashboard ou filtro cancela a requisição anterior e descarta os dados anteriores. Atualizar consulta novamente sem cache. Período inválido mostra erro; falha de API tem tentativa de atualização. Gráficos incluem uma tabela acessível com os mesmos dados. A interface usa pt-BR e reais.

Cards e listas se ajustam à largura disponível; tabelas de conferência têm rolagem horizontal própria. Os tipos ficam em `shared/dashboardContracts.ts`; queries e fórmulas são documentadas em `server/dashboards/README.md`.
