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
  { id: 'm6', from: { name: 'Suporte', email: 'support@acme.com' }, subject: 'Reset de senha', snippet: 'Clique no link para redefinir sua senha…', date: 'Hoje', unread: true, body: 'Recebemos uma solicitação para redefinir sua senha. Caso não reconheça, ignore este email.' },
  { id: 'm7', from: { name: 'GitHub', email: 'noreply@github.com' }, subject: 'Novo PR #123', snippet: 'Foi aberta uma pull request no repositório…', date: 'Hoje', labels: ['Dev'], body: 'Uma nova pull request foi aberta. Por favor, revise quando possível.' },
  { id: 'm8', from: { name: 'Marketing', email: 'mkt@empresa.com' }, subject: 'Relatório de campanha', snippet: 'Resultados e próximos passos…', date: 'Ontem', attachments: 1, labels: ['Marketing'], body: 'Segue relatório com métricas de CTR, CPL e ROI.' },
  { id: 'm9', from: { name: 'Equipe Produto', email: 'produto@empresa.com' }, subject: 'Sprint planning', snippet: 'Agenda e pauta da reunião…', date: 'Ter', body: 'Pauta: backlog grooming, definição de metas e riscos.' },
  { id: 'm10', from: { name: 'Banco XP', email: 'notificacoes@banco.com' }, subject: 'Comprovante TED', snippet: 'Transferência realizada com sucesso…', date: 'Ter', attachments: 2, labels: ['Finance'], body: 'Em anexo, comprovantes PDF.' },
  { id: 'm11', from: { name: 'LinkedIn', email: 'updates@linkedin.com' }, subject: 'Novas vagas para você', snippet: 'Baseado no seu perfil…', date: 'Sex', body: 'Veja as vagas recomendadas nesta semana.' },
  { id: 'm12', from: { name: 'Cliente ACME', email: 'contact@acme.io' }, subject: 'Atualização do contrato', snippet: 'Precisamos ajustar a cláusula 4…', date: 'Sex', unread: true, labels: ['Legal'], body: 'Segue redação sugerida para a cláusula 4.1.' },
  { id: 'm13', from: { name: 'Leads Bot', email: 'leads@crm.com' }, subject: '30 novos leads', snippet: 'Planilha atualizada com novos contatos…', date: 'Qui', attachments: 1, labels: ['Sales'], body: 'A planilha foi atualizada com 30 novos leads qualificados.' },
  { id: 'm14', from: { name: 'Dropbox', email: 'no-reply@dropbox.com' }, subject: 'Pasta compartilhada com você', snippet: 'Você recebeu acesso à pasta…', date: 'Qua', attachments: 1, body: 'Clique para abrir a pasta compartilhada.' },
  { id: 'm15', from: { name: 'Calendário', email: 'calendar@empresa.com' }, subject: 'Convite: Reunião de status', snippet: 'Quinta, 11:00–11:30', date: 'Qua', body: 'Convite adicionado à sua agenda.' },
  { id: 'm16', from: { name: 'Suprimentos', email: 'supply@empresa.com' }, subject: 'Pedido entregue', snippet: 'O pedido #5812 foi entregue…', date: '10 Jan', body: 'Confirme o recebimento no portal.' },
  { id: 'm17', from: { name: 'Pagamentos', email: 'pagamentos@empresa.com' }, subject: 'Boleto disponível', snippet: 'Vencimento 15/02…', date: '05 Jan', unread: true, labels: ['Finance'], body: 'Emita o boleto no link abaixo.' },
  { id: 'm18', from: { name: 'Time Mobile', email: 'mobile@empresa.com' }, subject: 'Build de teste', snippet: 'Nova versão disponível no TestFlight…', date: 'Dom', attachments: 1, labels: ['Dev'], body: 'Notas: correção de bugs e melhorias de performance.' },
  { id: 'm19', from: { name: 'Conferência', email: 'tickets@conf.com' }, subject: 'Ingressos confirmados', snippet: 'Seu QR code está anexo…', date: '30 Dez', attachments: 1, body: 'Apresente o QR code na entrada do evento.' },
  { id: 'm20', from: { name: 'Newsletter', email: 'news@weekly.io' }, subject: 'Atualizações da semana', snippet: 'Artigos selecionados e dicas…', date: 'Seg', body: 'Edição #142 — destaques, artigos e eventos.' },
]

export function getMailById(id?: string | null) {
  if (!id) return undefined
  return MAILBOX.find(m => m.id === id)
}
