import { runQuery } from '@/lib/postgres'

let ensurePromise: Promise<void> | null = null

export type ChatRuntimeKind = 'codex' | 'agentsdk'

export function normalizeRuntimeKind(value?: string | null): ChatRuntimeKind {
  const raw = (value || '').toString().trim().toLowerCase()
  return raw === 'agentsdk' ? 'agentsdk' : 'codex'
}

export async function ensureChatRuntimeKindColumn(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await runQuery(`CREATE SCHEMA IF NOT EXISTS chat`)
      await runQuery(`ALTER TABLE chat.chats ADD COLUMN IF NOT EXISTS runtime_kind text`)
      await runQuery(`UPDATE chat.chats SET runtime_kind = 'codex' WHERE runtime_kind IS NULL`)
      await runQuery(`ALTER TABLE chat.chats ALTER COLUMN runtime_kind SET DEFAULT 'codex'`)
    })().catch((err) => {
      ensurePromise = null
      throw err
    })
  }
  await ensurePromise
}

