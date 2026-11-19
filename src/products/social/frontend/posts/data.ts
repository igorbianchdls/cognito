// Sample data until posting is backed by the server (phase 3).

export type Network = 'instagram' | 'tiktok' | 'linkedin' | 'youtube'
export type Account = { id: string; network: Network; handle: string; name: string; connected: boolean }
export type PostFormat = 'reel' | 'story' | 'feed'
export type PostStatus = 'agendado' | 'publicado' | 'erro' | 'rascunho'
export type Post = { id: string; fileIds: string[]; caption: string; accountIds: string[]; format: PostFormat; date: string; status: PostStatus; url?: string; metrics?: { views: number; likes: number; comments: number; shares: number } }

export const accounts: Account[] = [
  { id: 'ig-otto', network: 'instagram', handle: '@otto.erp', name: 'Otto ERP', connected: true },
  { id: 'tt-otto', network: 'tiktok', handle: '@otto.erp', name: 'Otto ERP', connected: true },
  { id: 'li-otto', network: 'linkedin', handle: 'Otto ERP', name: 'Página da empresa', connected: false },
  { id: 'yt-otto', network: 'youtube', handle: '@ottoerp', name: 'Otto ERP Shorts', connected: false },
]

const m = (views: number, likes: number, comments: number, shares: number) => ({ views, likes, comments, shares })
export const initialPosts: Post[] = [
  { id: 'p1', fileIds: ['f1'], caption: 'O ChatGPT agora emite nota fiscal. 🧾 Comenta NOTA que eu te mando o acesso.', accountIds: ['ig-otto'], format: 'reel', date: '2026-10-30T18:09', status: 'publicado', url: 'https://www.instagram.com/reel/DfIO7EKEw71/', metrics: m(4820, 312, 87, 41) },
  { id: 'p2', fileIds: ['f2'], caption: 'O ChatGPT agora cobra os clientes que te devem. 💸 Comenta COBRANÇA.', accountIds: ['ig-otto'], format: 'reel', date: '2026-10-30T18:40', status: 'publicado', url: 'https://www.instagram.com/reel/DfIYGhlIej2/', metrics: m(3110, 198, 54, 22) },
  { id: 'p3', fileIds: ['f3'], caption: 'Contratei uma IA pra cuidar do meu financeiro. 🤖 Comenta IA.', accountIds: ['ig-otto'], format: 'reel', date: '2026-10-30T19:20', status: 'publicado', url: 'https://www.instagram.com/reel/DfIdAmFgIXZ/', metrics: m(6390, 451, 132, 67) },
  { id: 'p4', fileIds: ['f4'], caption: 'O ChatGPT acabou de matar o Conta Azul. 👀 Comenta SISTEMA.', accountIds: ['ig-otto'], format: 'reel', date: '2026-10-30T21:30', status: 'publicado', url: 'https://www.instagram.com/reel/DfIoVPkD0Eh/', metrics: m(9870, 702, 214, 118) },
  { id: 'p5', fileIds: ['f12'], caption: 'O ChatGPT agora emite todas as suas notas fiscais de uma vez. 🧾⚡ Comenta NOTA.', accountIds: ['ig-otto'], format: 'reel', date: '2026-11-01T15:10', status: 'publicado', url: 'https://www.instagram.com/reel/DfKjxvkFU3O/', metrics: m(1240, 88, 19, 9) },
  { id: 'p6', fileIds: ['f21'], caption: 'Você ainda controla o caixa na planilha? Responde a enquete 👇', accountIds: ['ig-otto'], format: 'story', date: '2026-11-02T12:00', status: 'agendado' },
  { id: 'p7', fileIds: ['f23'], caption: 'Emite a nota sem sair do ChatGPT. Comenta NOTA.', accountIds: ['ig-otto', 'tt-otto'], format: 'reel', date: '2026-11-03T19:00', status: 'agendado' },
  { id: 'p8', fileIds: ['f17'], caption: '5 sinais de que o seu caixa tá apertado (e como resolver).', accountIds: ['ig-otto'], format: 'feed', date: '2026-11-05T12:30', status: 'agendado' },
  { id: 'p9', fileIds: ['f29'], caption: 'Seu hotel inteiro no celular.', accountIds: ['tt-otto'], format: 'reel', date: '2026-11-06T18:00', status: 'rascunho' },
]


export const networkLabel: Record<Network, string> = { instagram: 'Instagram', tiktok: 'TikTok', linkedin: 'LinkedIn', youtube: 'YouTube' }
export const formatLabel: Record<PostFormat, string> = { reel: 'Reel', story: 'Story', feed: 'Feed' }
