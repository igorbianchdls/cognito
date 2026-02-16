import type { WhatsappChat } from './types'

export const SAMPLE_CHATS: WhatsappChat[] = [
  {
    id: 'c1',
    name: 'Bruna Silva',
    last: 'Beleza, nos falamos amanha',
    time: '09:21',
    unread: 2,
    avatarHue: 210,
    messages: [
      { id: 'm1', from: 'them', text: 'Oi! Tudo certo para hoje?', time: '08:55' },
      { id: 'm2', from: 'me', text: 'Sim! Fechamos as 14h.', time: '09:02', status: 'read' },
      { id: 'm3', from: 'them', text: 'Beleza, nos falamos amanha', time: '09:21' },
    ],
  },
  {
    id: 'c2',
    name: 'Equipe Design',
    last: 'Subi a capa nova',
    time: 'Ontem',
    avatarHue: 140,
    messages: [
      { id: 'm1', from: 'me', text: 'Conseguem enviar o banner ate 17h?', time: '15:17', status: 'delivered' },
      { id: 'm2', from: 'them', imageUrl: 'https://images.unsplash.com/photo-1611162618071-b39a2ec2f1a9?w=1200&q=80', time: '16:01' },
      { id: 'm3', from: 'them', text: 'Subi a capa nova', time: '16:01' },
    ],
  },
  {
    id: 'c3',
    name: 'Marcos Dev',
    last: 'Enviei o PR agora',
    time: 'Seg',
    avatarHue: 18,
    messages: [
      { id: 'm1', from: 'them', text: 'Enviei o PR agora', time: '10:39' },
    ],
  },
]
