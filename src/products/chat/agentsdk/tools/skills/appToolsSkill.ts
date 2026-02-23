export const APP_TOOLS_SKILL_MD = `---
name: App MCP Tools
description: Uso das tools internas ERP (crud, documento, drive, email) via MCP.
---

As tools disponíveis (apenas via MCP):
- listar(input: { resource: string, params?: object, actionSuffix?: string, method?: "GET"|"POST" })
- criar(input: { resource: string, data?: object, actionSuffix?: string, method?: "GET"|"POST" })
- atualizar(input: { resource: string, data?: object, actionSuffix?: string, method?: "GET"|"POST" })
- deletar(input: { resource: string, data?: object, actionSuffix?: string, method?: "GET"|"POST" })
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
