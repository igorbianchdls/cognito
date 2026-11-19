// Sample notifications until they come from the backend (phase 2).

export type NotificationKind = 'publicado' | 'erro' | 'comentario' | 'agendado' | 'armazenamento' | 'conta' | 'plugin' | 'arquivos'
export type AppNotification = { id: string; kind: NotificationKind; title: string; text: string; date: string; read: boolean; href?: string; action?: string }

export const kindInfo: Record<NotificationKind, { label: string; group: 'Publicações' | 'Comentários' | 'Contas' | 'Arquivos' | 'Sistema' }> = {
  publicado: { label: 'Post publicado', group: 'Publicações' },
  erro: { label: 'Falha ao publicar', group: 'Publicações' },
  agendado: { label: 'Lembrete de agendamento', group: 'Publicações' },
  comentario: { label: 'Comentários e menções', group: 'Comentários' },
  conta: { label: 'Contas conectadas', group: 'Contas' },
  plugin: { label: 'Ações do ChatGPT e do Claude', group: 'Sistema' },
  armazenamento: { label: 'Armazenamento', group: 'Arquivos' },
  arquivos: { label: 'Envio de arquivos', group: 'Arquivos' },
}

export const seedNotifications: AppNotification[] = [
  { id: 'n1', kind: 'agendado', title: 'Story sai hoje às 12:00', text: '“Você ainda controla o caixa na planilha?” vai para o @otto.erp.', date: '2026-11-02T08:00', read: false, href: '/social/posts?post=p6', action: 'Ver post' },
  { id: 'n2', kind: 'comentario', title: '19 comentários novos', text: 'O Reel “emite todas as suas notas fiscais” recebeu 19 comentários com a palavra NOTA.', date: '2026-11-01T22:40', read: false, href: '/social/posts?post=p5', action: 'Ver post' },
  { id: 'n3', kind: 'publicado', title: 'Reel publicado', text: '“Emite várias notas (B)” foi publicado no @otto.erp.', date: '2026-11-01T15:11', read: false, href: '/social/posts?post=p5', action: 'Ver post' },
  { id: 'n4', kind: 'plugin', title: 'ChatGPT pediu para agendar', text: 'O ChatGPT quer agendar “Story enquete planilha” para amanhã às 12:00. Confirme no Plugin.', date: '2026-11-01T15:10', read: false, href: '/social/plugin', action: 'Revisar' },
  { id: 'n5', kind: 'erro', title: 'Não foi possível publicar no TikTok', text: 'A sessão do TikTok expirou. Reconecte a conta e tente de novo.', date: '2026-10-31T21:06', read: false, href: '/social/conectores?aba=redes', action: 'Reconectar' },
  { id: 'n6', kind: 'publicado', title: 'Reel publicado', text: '“ChatGPT matou o Conta Azul” foi publicado no @otto.erp.', date: '2026-10-30T21:31', read: true, href: '/social/posts?post=p4', action: 'Ver post' },
  { id: 'n7', kind: 'comentario', title: 'Você foi mencionado', text: '@contadorbr marcou @otto.erp num comentário: “isso aqui vai mudar meu escritório”.', date: '2026-10-30T20:02', read: true },
  { id: 'n8', kind: 'arquivos', title: '4 arquivos enviados', text: 'Gravações do apresentador e B-roll chegaram em Vídeos brutos.', date: '2026-10-29T10:15', read: true, href: '/editor/pastas/brutos', action: 'Abrir pasta' },
  { id: 'n9', kind: 'armazenamento', title: 'Você usou 24% do espaço', text: '1,2 GB de 5 GB. Vídeos brutos ocupam a maior parte.', date: '2026-10-28T09:00', read: true, href: '/editor/spaces', action: 'Ver spaces' },
  { id: 'n10', kind: 'conta', title: 'LinkedIn não está conectado', text: 'Conecte a página da empresa para publicar lá também.', date: '2026-10-26T11:30', read: true, href: '/social/conectores?aba=redes', action: 'Conectar' },
]
