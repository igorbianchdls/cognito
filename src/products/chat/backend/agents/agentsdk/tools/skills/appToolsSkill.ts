export const APP_TOOLS_SKILL_MD = `---
name: App MCP Tools
description: Uso das tools internas ERP (crud, dashboard_builder, sql_execution, ecommerce, marketing, drive, email) via MCP.
---

As tools disponíveis (apenas via MCP):
- crud(input: { action: "listar"|"criar"|"atualizar"|"deletar"|"aprovar"|"concluir"|"baixar"|"estornar"|"cancelar"|"reabrir"|"marcar_como_recebido"|"marcar_recebimento_parcial", resource: string, params?: object, data?: object, actionSuffix?: string, method?: "GET"|"POST" })
- dashboard_builder(input: { action: "create_dashboard"|"add_widget"|"add_widgets_batch"|"get_dashboard", dashboard_name: string, title?: string, subtitle?: string, theme?: string, widget_id?: string, widget_type?: "kpi"|"chart"|"filtro"|"insights", container?: string, payload?: object, widgets?: object[], parser_state?: object })
- sql_execution(input: { sql: string, title?: string, chart?: { xField: string, valueField: string, xLabel?: string, yLabel?: string } })
- ecommerce(input: { action: "kpis_resumo"|"vendas_por_canal"|"pedidos_por_status"|"faturamento_por_mes"|"top_produtos_receita"|"frete_por_transportadora", params?: object })
- marketing(input: { action: "kpis_resumo"|"desempenho_diario"|"gasto_por_campanha"|"roas_por_campanha"|"gasto_por_conta"|"top_anuncios", params?: object })
- drive(input: { action: "request"|"read_file"|"get_file_url", resource?: string, method?: "GET"|"POST"|"DELETE", params?: object, data?: object, file_id?: string, workspace_id?: string, folder_id?: string, file_name?: string, mime?: string, content_base64?: string })
- email(input: { action: "request"|"send", resource?: string, method?: "GET"|"POST"|"DELETE", params?: object, data?: object, inbox_id?: string, inboxId?: string, to?: string|string[], subject?: string, text?: string, html?: string, attachments?: object[], drive_file_id?: string, drive_file_ids?: string[] })

RECURSOS (resource) SUPORTADOS (use exatamente estes caminhos; não invente nomes):
- financeiro/contas-financeiras
- financeiro/categorias-despesa
- financeiro/categorias-receita
- financeiro/clientes
- financeiro/centros-custo
- financeiro/centros-lucro
- vendas/pedidos
- compras/pedidos
- contas-a-pagar
- contas-a-receber
- crm/contas
- crm/contatos
- crm/leads
- crm/oportunidades
- crm/atividades
- estoque/almoxarifados
- estoque/movimentacoes
- estoque/estoque-atual (somente listar)
- estoque/tipos-movimentacao (somente listar)

Regras:
- NUNCA use termos genéricos como "categoria" ou "despesa". Use os caminhos exatos, por exemplo "financeiro/categorias-despesa".
- Prefixe corretamente com o módulo (ex.: "financeiro/...").
- O "resource" não pode conter ".." e deve iniciar com um dos prefixos: financeiro, vendas, compras, contas-a-pagar, contas-a-receber, crm, estoque, cadastros.
- Contexto operacional padrão: B2B serviços como núcleo. Estoque é domínio separado e não deve ser acoplado automaticamente em todo fluxo comercial.
- No crud, por padrão action="listar" usa actionSuffix="listar" e criar/atualizar/deletar usam seus sufixos homônimos.
- Documento pode gerar PDF e salvar no Drive na mesma chamada com save_to_drive=true e drive.workspace_id.
- Para upload de arquivo gerado em base64, prefira drive resource="drive/files/upload-base64" (action=request).
- Para enviar anexo já salvo no Drive, prefira email action="send" com drive_file_id (sem precisar obter signed_url manualmente).
- Dashboard Builder (planejamento para dashboard novo): antes de chamar a tool, ler a skill de domínio correta (vendasSkill.md, comprasSkill.md, financeiroSkill.md, marketingSkill.md ou ecommerceSkill.md) e propor um plano explícito com KPIs/charts/filtros/layout de containers.
- Dashboard Builder (aprovação): para dashboard novo, pedir confirmação do plano antes de executar create_dashboard/add_widgets_batch/add_widget.
- Dashboard Builder (exceção): se o usuário pedir execução imediata ("cria direto", "sem confirmar"), pode pular confirmação e executar.
- Dashboard Builder (fluxo recomendado): create_dashboard -> add_widgets_batch -> add_widget -> get_dashboard.
- Dashboard Builder (estado): pode operar stateful (chat_id + dashboard_name) ou stateless (parser_state). Em stateless, sempre reenviar o parser_state mais recente retornado pela chamada anterior.
- Dashboard Builder (container): widgets com mesmo container ficam na mesma row; sem container, usa "principal".
- Dashboard Builder (payload chart): ordem aceita string "field:dir" (ex.: "measure:desc") ou objeto { field, dir }.
- Dashboard Builder (payload chart): layout opcional (auto|vertical|horizontal). Foco em BarChart.
- Dashboard Builder (payload chart): quando layout for omitido/auto no BarChart, usar padrão automático: temporal -> vertical; categórico -> horizontal.
- Dashboard Builder (payload chart): enviar layout apenas quando quiser forçar override manual; no padrão, omitir layout.
- Dashboard Builder (payload query-first): query SQL em KPI/Chart é obrigatório.
- Dashboard Builder (payload query-first): payload.query é somente metadado de planejamento; não é executado pelo dashboard_builder. Para testar SQL ad-hoc, use sql_execution.
- Dashboard Builder (campos obrigatórios query-first): kpi={title,query} (query deve retornar coluna numérica AS value e não deve enviar xField/yField/keyField); chart={chart_type,title,query,xField,yField}; filtro={title,campo,tabela}; insights={title,items}.
- Dashboard Builder (payload KPI/chart): campo formato (quando usado) deve ser apenas "currency" | "percent" | "number".
- Dashboard Builder (payload KPI/chart): não usar "BRL" em formato; para moeda use formato="currency".
- Dashboard Builder (payload filtro): chave é opcional; se omitida, deriva de campo resolvido. prefira campo *_id (ex.: vendedor_id); aliases como vendedor/cliente/canal_venda podem ser normalizados para *_id apenas no payload de filtro (nunca inventar coluna/tabela fisica em SQL).
- Dashboard Builder (persistência): fluxo legado; a tool não salva mais arquivos nem atualiza preview automaticamente.
- Dashboard Builder (execução): prefira criar/editar dashboards .tsx diretamente, em vez de usar dashboard_builder.
- Skills de domínio para dashboard: vendasSkill.md, comprasSkill.md, financeiroSkill.md, marketingSkill.md e ecommerceSkill.md servem para dimensões/medidas/filtros; a estrutura final deve seguir o contrato da tool dashboard_builder.
- SQL Execution: use para executar SELECT/CTE tabular ad-hoc com renderização automática em Artifact Data Table.
- SQL Execution: input mínimo é sql; title é opcional para exibir título no Artifact.
- SQL Execution: chart é opcional e configura 1 gráfico de barras no artifact (chart.xField e chart.valueField devem existir no resultado da query).
- SQL Execution: aceita apenas SELECT/CTE (WITH), uma única instrução, sem placeholders posicionais ($1, $2, ...).
- SQL Execution: placeholder suportado nessa tool é somente {{tenant_id}} (bind automático por header); placeholders como {{de}}/{{ate}} não são suportados nela.
- SQL Execution: retorno limitado internamente a 1000 linhas.
- Ecommerce tool: não aceita SQL livre; use actions canônicas com params (de/ate/plataforma/status etc.).
- Marketing tool: não aceita SQL livre; use actions canônicas com params (de/ate/plataforma/nivel/conta_id/campanha_id etc.).

Exemplos:
- Listar contas financeiras:
  { "tool": "crud", "args": { "action": "listar", "resource": "financeiro/contas-financeiras", "params": { "limit": 50 } } }
- Listar categorias de despesa (não use "categoria" sozinho):
  { "tool": "crud", "args": { "action": "listar", "resource": "financeiro/categorias-despesa", "params": { "q": "marketing" } } }
- Criar centro de custo:
  { "tool": "crud", "args": { "action": "criar", "resource": "financeiro/centros-custo", "data": { "nome": "Marketing", "codigo": "CC-001" } } }
- Atualizar centro de custo:
  { "tool": "crud", "args": { "action": "atualizar", "resource": "financeiro/centros-custo", "data": { "id": 123, "nome": "Marketing & Growth" } } }
- Deletar centro de custo:
  { "tool": "crud", "args": { "action": "deletar", "resource": "financeiro/centros-custo", "data": { "id": 123 } } }
- SQL ad-hoc com título no Artifact:
  { "tool": "sql_execution", "args": { "title": "Top clientes por receita", "sql": "SELECT c.id AS key, c.nome_fantasia AS label, SUM(p.valor_total)::float AS value FROM vendas.pedidos p LEFT JOIN entidades.clientes c ON c.id = p.cliente_id WHERE p.tenant_id = {{tenant_id}}::int GROUP BY 1,2 ORDER BY 3 DESC LIMIT 10" } }
- SQL ad-hoc com gráfico de barras (tabela + chart no mesmo artifact):
  { "tool": "sql_execution", "args": { "title": "Receita por canal", "sql": "SELECT cv.nome AS label, SUM(p.valor_total)::float AS value FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE p.tenant_id = {{tenant_id}}::int GROUP BY 1 ORDER BY 2 DESC LIMIT 10", "chart": { "xField": "label", "valueField": "value", "xLabel": "Canal", "yLabel": "Receita" } } }
- Ecommerce por ação (sem SQL livre):
  { "tool": "ecommerce", "args": { "action": "faturamento_por_mes", "params": { "de": "2026-01-01", "ate": "2026-03-31", "plataforma": "shopify", "limit": 12 } } }
- Marketing por ação (sem SQL livre):
  { "tool": "marketing", "args": { "action": "roas_por_campanha", "params": { "de": "2026-02-01", "ate": "2026-02-29", "plataforma": "meta_ads", "limit": 10 } } }

Roteamento:
- crud -> /api/agent-tools/<resource>/<acao>
- dashboard_builder -> /api/agent-tools/dashboard-builder
- sql_execution -> /api/agent-tools/sql-execution
- ecommerce -> /api/agent-tools/ecommerce
- marketing -> /api/agent-tools/marketing
- drive -> /api/agent-tools/drive
- email -> /api/agent-tools/email

As chamadas usam as variáveis:
- $AGENT_BASE_URL
- $AGENT_TOOL_TOKEN
- $AGENT_CHAT_ID
`
