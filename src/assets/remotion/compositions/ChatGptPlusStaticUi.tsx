import type { ReactNode } from 'react'
import {
  ArrowUp,
  AudioLines,
  BookOpen,
  Clock3,
  Folder,
  LibraryBig,
  Mic,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Share,
  ShoppingBag,
  SquarePen,
} from 'lucide-react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { CHATGPT_PLUS_PROMPT_SCHEDULE, ChatGptPlusSyncConversation } from './ChatGptPlusSyncConversation'

export const CHATGPT_PLUS_STATIC_UI_DURATION = 1650

const FONT = 'Arial, Helvetica, sans-serif'
const INK = '#0d0d0d'
const SIDEBAR = '#f9f9f9'

function p(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

const recentChats = [
  'Conciliação e despesas',
  'Uso de ferramentas',
  'Ajuste de Texto para Post',
  'Animação para Reels SaaS',
  'Mulher empreendedora no salão',
  'Efeito Nostálgico de Câmera',
  'Transformação de imagem 3D',
  'Prompt para imagem realista',
  'Imposto de 10% sobre Dividendos',
  'Margem bruta SaaS',
  'Impressão Bambu Lab',
  'Detalhamento de Marcenaria 3D',
  'Diferença CLI e MCP',
  'Reformulação de Antecapa',
  'Diretrizes para projeto interiores',
  'Mudar nome e aparência',
]

function SidebarItem({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div style={{ alignItems: 'center', display: 'flex', fontSize: 14, gap: 11, height: 36, padding: '0 18px' }}>
      <span style={{ alignItems: 'center', display: 'flex', height: 20, justifyContent: 'center', width: 20 }}>{icon}</span>
      <span>{children}</span>
    </div>
  )
}

function Sidebar() {
  return (
    <aside style={{ background: SIDEBAR, borderRight: '1px solid #e7e7e7', bottom: 0, left: 0, position: 'absolute', top: 0, width: 262 }}>
      <div style={{ alignItems: 'center', display: 'flex', height: 52, justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>ChatGPT <span style={{ color: '#8a8a8a', fontWeight: 400 }}>Plus</span></div>
        <div style={{ alignItems: 'center', color: '#767676', display: 'flex', gap: 18 }}><Search size={19} strokeWidth={1.7} /><PanelLeft size={19} strokeWidth={1.6} /></div>
      </div>

      <nav style={{ marginTop: 8 }}>
        <SidebarItem icon={<SquarePen size={19} strokeWidth={1.7} />}>Novo chat</SidebarItem>
        <SidebarItem icon={<LibraryBig size={19} strokeWidth={1.7} />}>Biblioteca</SidebarItem>
        <SidebarItem icon={<Folder size={19} strokeWidth={1.7} />}>Projetos</SidebarItem>
        <SidebarItem icon={<Clock3 size={19} strokeWidth={1.7} />}>Agendados</SidebarItem>
        <SidebarItem icon={<BookOpen size={19} strokeWidth={1.7} />}>Plugins</SidebarItem>
        <SidebarItem icon={<MoreHorizontal size={20} strokeWidth={1.9} />}>Mais</SidebarItem>
      </nav>

      <div style={{ color: '#8b8b8b', fontSize: 13, fontWeight: 600, margin: '24px 18px 8px' }}>Recentes</div>
      <div style={{ bottom: 68, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 316 }}>
        {recentChats.map((chat, index) => (
          <div
            key={chat}
            style={{
              alignItems: 'center',
              background: index === 0 ? '#ececec' : 'transparent',
              borderRadius: index === 0 ? 9 : 0,
              display: 'flex',
              fontSize: 13.5,
              height: 36,
              margin: index === 0 ? '0 10px' : '0',
              padding: index === 0 ? '0 10px' : '0 20px',
              position: 'relative',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat}</span>
            {index === 2 ? <span style={{ background: INK, borderRadius: 999, height: 8, position: 'absolute', right: 32, width: 8 }} /> : null}
          </div>
        ))}
      </div>

      <div style={{ background: '#d2d2d2', borderRadius: 999, height: 535, position: 'absolute', right: 3, top: 43, width: 7 }} />
      <div style={{ alignItems: 'center', borderTop: '1px solid #e6e6e6', bottom: 0, display: 'flex', height: 68, left: 0, padding: '0 18px', position: 'absolute', right: 0 }}>
        <div style={{ alignItems: 'center', background: '#36a7df', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 10, height: 25, justifyContent: 'center', width: 25 }}>IB</div>
        <div style={{ marginLeft: 10 }}><div style={{ fontSize: 13.5 }}>Igor Bianchi</div><div style={{ color: '#8b8b8b', fontSize: 11, marginTop: 2 }}>Plus</div></div>
        <ShoppingBag color="#737373" size={18} style={{ marginLeft: 'auto' }} strokeWidth={1.6} />
      </div>
    </aside>
  )
}

function MessageComposer() {
  const frame = useCurrentFrame()
  const activePrompt = CHATGPT_PLUS_PROMPT_SCHEDULE.find((prompt) => frame >= prompt.start && frame < prompt.send)
  const typedCharacters = activePrompt ? Math.floor(p(frame, activePrompt.start + 3, activePrompt.typingEnd, [0, activePrompt.text.length])) : 0
  const isWriting = Boolean(activePrompt)

  return (
    <>
      <div style={{ bottom: 95, color: '#999999', fontSize: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)' }}>O ChatGPT pode cometer erros. Por isso, lembre-se de conferir informações relevantes.</div>
      <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e1e1e1', borderRadius: 28, bottom: 28, boxShadow: '0 3px 16px rgba(0,0,0,0.08)', display: 'flex', height: 54, left: '50%', padding: '0 8px 0 18px', position: 'absolute', transform: 'translateX(-50%)', width: 768 }}>
        <Plus size={21} strokeWidth={1.7} />
        <span style={{ color: isWriting ? INK : '#8b8b8b', flex: 1, fontSize: 16, marginLeft: 18, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>{activePrompt ? activePrompt.text.slice(0, typedCharacters) : 'Pergunte ao ChatGPT'}</span>
        <span style={{ color: '#8b8b8b', flex: 'none', fontSize: 14, marginLeft: 18 }}>Instantâneo⌄</span>
        <Mic size={19} style={{ marginLeft: 24 }} strokeWidth={1.8} />
        <span style={{ alignItems: 'center', background: '#050505', borderRadius: 999, color: '#ffffff', display: 'flex', height: 38, justifyContent: 'center', marginLeft: 17, width: 38 }}>{isWriting ? <ArrowUp size={21} strokeWidth={2.2} /> : <AudioLines size={21} strokeWidth={2} />}</span>
      </div>
    </>
  )
}

export function ChatGptPlusStaticUi() {
  return (
    <AbsoluteFill style={{ background: '#ffffff', color: INK, fontFamily: FONT, overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ bottom: 0, left: 262, overflow: 'hidden', position: 'absolute', right: 0, top: 0 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 18, position: 'absolute', right: 27, top: 18 }}><Share size={18} strokeWidth={1.6} /><MoreHorizontal size={20} strokeWidth={1.8} /></div>
        <ChatGptPlusSyncConversation />
        <MessageComposer />
        <div style={{ background: '#858585', borderRadius: 999, bottom: 24, height: 33, position: 'absolute', right: 4, width: 8 }} />
      </main>
    </AbsoluteFill>
  )
}
