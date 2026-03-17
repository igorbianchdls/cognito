export type PromptHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function formatConversation(history: PromptHistoryMessage[]): string {
  const lines: string[] = ['Conversation:']
  for (const m of history) {
    const txt = (typeof m?.content === 'string' ? m.content : '').trim()
    if (!txt) continue
    lines.push(`${m.role === 'user' ? 'User' : 'Assistant'}: ${txt}`)
  }
  lines.push('Assistant:')
  return lines.join('\n')
}
