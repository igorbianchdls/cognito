export const APP_TOOLS_SKILL_MD = `---
name: App MCP Tools
description: Uso das tools internas ERP (crud, dashboard_builder, documento, drive, email) via MCP.
---

As tools disponíveis (apenas via MCP):
- listar(input: { resource: string, params?: object, actionSuffix?: string, method?: "GET"|"POST" })
- criar(input: { resource: string, data?: object, actionSuffix?: string, method?: "GET"|"POST" })
- atualizar(input: { resource: string, data?: object, actionSuffix?: string, method?: "GET"|"POST" })
- deletar(input: { resource: string, data?: object, actionSuffix?: string, method?: "GET"|"POST" })
- dashboard_builder(input: { action: "create_dashboard"|"add_widget"|"add_widgets_batch"|"get_dashboard", dashboard_name: string, title?: string, subtitle?: string, theme?: string, widget_id?: string, widget_type?: "kpi"|"chart"|"filtro"|"insights", container?: string, payload?: object, widgets?: object[], parser_state?: object })
- documento(input: { action: "gerar"|"status", tipo?: "proposta"|"os"|"fatura"|"contrato"|"nfse", origem_tipo?: string, origem_id?: number, dados?: object, documento_id?: number, template_id?: number, template_version_id?: number, idempotency_key?: string, save_to_drive?: boolean, drive?: { workspace_id?: string, folder_id?: string, file_name?: string } })
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
- Por padrão, listar usa actionSuffix="listar" e criar/atualizar/deletar usam seus sufixos homônimos.
- Para proposta/OS/NFSe/fatura/contrato, use a tool documento (action gerar/status), não CRUD de documentos.
- Documento pode gerar PDF e salvar no Drive na mesma chamada com save_to_drive=true e drive.workspace_id.
- Para upload de arquivo gerado em base64, prefira drive resource="drive/files/upload-base64" (action=request).
- Para enviar anexo já salvo no Drive, prefira email action="send" com drive_file_id (sem precisar obter signed_url manualmente).
- Dashboard Builder (planejamento para dashboard novo): antes de chamar a tool, ler a skill de domínio correta (erpSkill.md, marketingSkill.md ou ecommerceSkill.md) e propor um plano explícito com KPIs/charts/filtros/layout de containers.
- Dashboard Builder (aprovação): para dashboard novo, pedir confirmação do plano antes de executar create_dashboard/add_widgets_batch/add_widget.
- Dashboard Builder (exceção): se o usuário pedir execução imediata ("cria direto", "sem confirmar"), pode pular confirmação e executar.
- Dashboard Builder (fluxo recomendado): create_dashboard -> add_widgets_batch -> add_widget -> get_dashboard.
- Dashboard Builder (estado): pode operar stateful (chat_id + dashboard_name) ou stateless (parser_state). Em stateless, sempre reenviar o parser_state mais recente retornado pela chamada anterior.
- Dashboard Builder (container): widgets com mesmo container ficam na mesma row; sem container, usa "principal".
- Dashboard Builder (payload chart): ordem aceita string "field:dir" (ex.: "measure:desc") ou objeto { field, dir }.
- Dashboard Builder (payload chart): para série mensal, usar padrão dos apps: dimensao="mes" + dimension_expr (ou dimensionExpr) com DATE_TRUNC month e ordem "dimension:asc".
- Dashboard Builder (campos obrigatórios): kpi={title,tabela,medida}; chart={chart_type,title,tabela,dimensao,medida}; filtro={title,campo,tabela}; insights={title,items}.
- Dashboard Builder (payload KPI/chart): campo formato (quando usado) deve ser apenas "currency" | "percent" | "number".
- Dashboard Builder (payload KPI/chart): não usar "BRL" em formato; para moeda use formato="currency".
- Dashboard Builder (payload filtro): chave é opcional; se omitida, deriva de campo.
- Dashboard Builder (persistência): create_dashboard/add_widgets_batch/add_widget salvam automaticamente em /vercel/sandbox/dashboard/<dashboard_name>.jsonr e retornam file_path; get_dashboard é somente leitura.
- Dashboard Builder (execução): para criar/editar dashboard, prefira dashboard_builder em vez de editar JSONR manualmente.
- Skills de domínio para dashboard: erpSkill.md, marketingSkill.md e ecommerceSkill.md servem para dimensões/medidas/filtros; a estrutura final deve seguir o contrato da tool dashboard_builder.

Exemplos:
- Listar contas financeiras:
  { "tool": "listar", "args": { "resource": "financeiro/contas-financeiras", "params": { "limit": 50 } } }
- Listar categorias de despesa (não use "categoria" sozinho):
  { "tool": "listar", "args": { "resource": "financeiro/categorias-despesa", "params": { "q": "marketing" } } }
- Criar centro de custo:
  { "tool": "criar", "args": { "resource": "financeiro/centros-custo", "data": { "nome": "Marketing", "codigo": "CC-001" } } }
- Atualizar centro de custo:
  { "tool": "atualizar", "args": { "resource": "financeiro/centros-custo", "data": { "id": 123, "nome": "Marketing & Growth" } } }
- Deletar centro de custo:
  { "tool": "deletar", "args": { "resource": "financeiro/centros-custo", "data": { "id": 123 } } }

As chamadas são roteadas para /api/agent-tools/<resource>/<acao> usando as variáveis:
- $AGENT_BASE_URL
- $AGENT_TOOL_TOKEN
- $AGENT_CHAT_ID
`
