export type Mail = {
  id: string
  from: { name: string; email: string }
  subject: string
  snippet: string
  date: string
  starred?: boolean
  unread?: boolean
  attachments?: number
  labels?: string[]
  body?: string
}

export const MAILBOX: Mail[] = [
  { id: 'm1', from: { name: 'Ana Paula', email: 'ana@example.com' }, subject: 'Apresentação do projeto', snippet: 'Oi! Segue em anexo a apresentação atualizada…', date: '09:42', unread: true, attachments: 1, labels: ['Work'], body: 'Olá, segue a apresentação do projeto com as últimas alterações. Fico à disposição para dúvidas.\n\n— Ana' },
  { id: 'm2', from: { name: 'Financeiro', email: 'billing@empresa.com' }, subject: 'Fatura 02/2026', snippet: 'Sua fatura está disponível. Vencimento 10/02…', date: 'Ontem', labels: ['Finance'], body: 'Sua fatura de Fevereiro/2026 está disponível no portal do cliente.' },
  { id: 'm3', from: { name: 'Caio', email: 'caio@exemplo.com' }, subject: 'Reunião reprogramada', snippet: 'Podemos mover a call para quinta às 11h?', date: 'Seg', starred: true, body: 'Podemos mover a call para quinta às 11h? Avise se tudo bem.' },
  { id: 'm4', from: { name: 'Notion', email: 'team@make.com' }, subject: 'Changelog 2026.02', snippet: 'Novidades: melhoria no editor, novos blocos…', date: '02 Fev', body: 'Confira as novidades desta release.' },
  { id: 'm5', from: { name: 'RH', email: 'rh@empresa.com' }, subject: 'Política de férias', snippet: 'Atualização da política a partir de Março…', date: '29 Jan', body: 'Olá! Segue a atualização da política de férias.' },
]

export function getMailById(id?: string | null) {
  if (!id) return undefined
  return MAILBOX.find(m => m.id === id)
}

