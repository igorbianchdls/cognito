// Migração incremental: dispatcher de tool calls do Codex ainda vive em
// `backend/features/agents/codex/runtime/runners/codexTools.ts`.
// Este diretório é o destino da extração de `crud/documento/drive/email`.
export { CODEX_APP_TOOL_DISPATCH_SCRIPT } from '@/products/chat/codex/tools/dispatch/appToolDispatchScript'
