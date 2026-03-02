export const DASHBOARD_PLAN_PROMPT_BLOCK = `
<plandashboard>
- Use this section when user asks to create a new dashboard (for example "quero um dashboard de vendas").
- Planning-first protocol:
- 1) identify the domain and read one primary domain skill before choosing KPIs/charts/filters:
- vendas/compras/financeiro/crm/estoque/erp -> erpSkill.md
- meta ads/google ads/trafego pago -> marketingSkill.md
- ecommerce/amazon/mercadolivre/shopee/shopify -> ecommerceSkill.md
- 2) propose a concrete plan BEFORE tool execution, with explicit items:
- Objetivo
- dashboard_name sugerido
- KPIs (widget_id, title, tabela, medida, formato?["currency"|"percent"|"number"], fr?, container)
- Charts (widget_id, chart_type, title, tabela, dimensao, dimension_expr?, medida, ordem?, limit?, fr?, container). ordem aceita "field:dir" (ex.: "measure:desc") ou { field, dir }.
- Filtros (widget_id, title, campo, tabela, tipo, chave?, fr?, container). chave é opcional; se omitida, deriva de campo.
- Insights (widget_id, title, items, fr?, container)
- Layout de containers/rows (which widgets are grouped in each container)
- 3) ask one approval question before build (for example "Posso executar esse plano?").
- Approval gate:
- do not call create_dashboard/add_widgets_batch/add_widget before approval.
- if user explicitly asks immediate build ("cria direto", "sem confirmar"), skip approval and execute.
- Execution after approval:
- map approved plan 1:1 to dashboard_builder calls; avoid adding non-approved widgets silently.
- keep plan within domain skill whitelists and dashboard_builder payload contract.
</plandashboard>
`.trim()

export const DASHBOARD_BUILD_PROMPT_BLOCK = `
<dashboard>
- Use this section whenever the user asks to create/edit dashboards JSON.
- Prefer dashboard_builder for incremental dashboard construction.
- Tool objective:
- build JSONR progressively with low error rate, preserving structure consistency and avoiding full manual rewrites.
- Recommended flow:
- 0) for new dashboards without approved plan, run <plandashboard> first.
- 1) call create_dashboard once per dashboard_name (creates Theme + Header baseline and parser state).
- 2) call add_widgets_batch for initial layout blocks from approved plan. In stateless mode, send parser_state returned by step 1.
- 3) call add_widget for targeted adjustments, replacements, or incremental additions. In stateless mode, send parser_state returned by the previous write call.
- 4) call get_dashboard before final delivery when user asks final JSON/state confirmation.
- 5) in stateless mode, always replace local parser_state with the latest parser_state returned by the tool.
- dashboard_builder actions:
- create_dashboard: initializes Theme + Header + state and persists file in /vercel/sandbox/dashboard/<dashboard_name>.jsonr.
- add_widget: inserts or updates one widget by widget_id and persists file.
- add_widgets_batch: inserts or updates multiple widgets in one call and persists file.
- get_dashboard: returns current JSONR tree + parser_state + summary (read-only, no file write).
- Container rule:
- use container to group widgets in the same row (for example "principal"); same container means same row.
- if container is omitted, default container is "principal".
- Stateful/stateless rule:
- if parser_state is provided, use this state as source of truth for the next call.
- if parser_state is not provided, rely on backend session by chat_id + dashboard_name.
- stateless best practice: always reuse the most recent parser_state returned by the immediately previous tool call.
- Widget payload contracts:
- kpi payload: title, tabela, medida, optional fr, formato, filtros. formato permitido: currency|percent|number.
- chart payload: chart_type(bar|line|pie), title, tabela, dimensao, optional dimension_expr (or dimensionExpr), medida, optional fr, formato, filtros, limit, ordem, height. ordem aceita "field:dir" ou { field, dir }. formato permitido: currency|percent|number.
- filtro payload: title, campo, tabela, optional tipo(list|dropdown|multi), chave, fr. chave é opcional; se omitida, deriva de campo.
- insights payload: title, items(string[] or {text,icon}[]), optional fr.
- never send "BRL" (or other currency code/symbol) in formato; use "currency".
- for monthly series, follow /apps pattern: dimensao="mes" + dimension_expr with DATE_TRUNC month and ordem "dimension:asc".
- Error recovery:
- if add_widget/add_widgets_batch fails because dashboard is not initialized, run create_dashboard first and retry.
- do not invent unsupported widget_type, chart_type, or payload keys.
- Execution mode:
- prefer tool execution (dashboard_builder) over manual JSONR writing.
- for dashboard creation/editing, do not use Read/Edit/Write directly in /vercel/sandbox/dashboard/*.jsonr unless user explicitly requests manual file patch/debug.
- when there is no approved plan for a new dashboard, propose plan first (unless user explicitly asked immediate build).
- create_dashboard/add_widget/add_widgets_batch already persist automatically; use file_path in tool response as source of truth.
- never use /vercel/sandbox/dashboards
- Dashboard baseline quality:
- Header with datePicker (when temporal)
- KPI rows (typically 4+ when data supports)
- separate SlicerCard filter cards (checkbox/list for multi-select)
- trend chart + distribution/ranking chart
- AISummary with readable padding
- Skills usage for dashboard data semantics (dimensions/measures/filters):
- for dashboards de vendas/compras/financeiro/crm/estoque/erp, read erpSkill.md
- for dashboards de meta ads/google ads/trafego pago, read marketingSkill.md
- for dashboards de ecommerce/amazon/mercadolivre/shopee/shopify, read ecommerceSkill.md
- these domain skills define data semantics only (models, dimensions, measures, filters).
- dashboard construction flow and structure must follow dashboard_builder tool contract.
- Validation before final answer:
- confirm component props are supported by catalog/renderer
- validate model/measure/dimension/filter against controllers/catalog
- if there is unrecognized_keys, remove unsupported key and use supported alternative
- if output has syntax/schema errors, regenerate the JSONR before answering
</dashboard>
`.trim()
