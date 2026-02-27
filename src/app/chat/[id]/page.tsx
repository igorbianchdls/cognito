import { redirect } from 'next/navigation'

import { runQuery } from '@/lib/postgres'
import { ensureChatRuntimeKindColumn, normalizeRuntimeKind } from '@/products/chat/backend/features/chat/runtimeKindStore'

export const runtime = 'nodejs'

export default async function ChatLegacyByIdPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const chatId = (id || '').toString().trim()
  if (!chatId) {
    redirect('/chat/codex')
  }

  await ensureChatRuntimeKindColumn().catch(() => {})
  const rows = await runQuery<{ runtime_kind: string | null }>(
    `SELECT runtime_kind FROM chat.chats WHERE id = $1 LIMIT 1`,
    [chatId]
  ).catch(() => [])
  const runtimeKind = normalizeRuntimeKind(rows?.[0]?.runtime_kind)
  redirect(`/chat/${runtimeKind}/${encodeURIComponent(chatId)}`)
}
