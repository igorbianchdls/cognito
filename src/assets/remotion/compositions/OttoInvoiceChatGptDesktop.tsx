import type {ReactNode} from 'react'
import {
  ArrowUp,
  Boxes,
  ChartNoAxesColumn,
  ChevronDown,
  Circle,
  Clock3,
  Code2,
  Database,
  Github,
  Mic,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Share,
  SquarePen,
  Zap,
} from 'lucide-react'
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion'

import {CHATGPT_MOBILE_FONT_STACK} from '@/assets/remotion/compositions/ChatGptMobileBase'
import {OttoInvoiceTwoStepsList} from '@/assets/remotion/compositions/OttoInvoiceTwoStepsList'

export const OTTO_INVOICE_CHATGPT_DESKTOP_DURATION = 360

const SIDEBAR_WIDTH = 64
const CHAT_WIDTH = 370
const RIGHT_LEFT = SIDEBAR_WIDTH + CHAT_WIDTH
const RIGHT_WIDTH = 1536 - RIGHT_LEFT
const RIGHT_HEADER_HEIGHT = 56
const RIGHT_HEIGHT = 864 - RIGHT_HEADER_HEIGHT
const OTTO_SCALE = RIGHT_HEIGHT / 864
const OTTO_LEFT = (RIGHT_WIDTH - 1536 * OTTO_SCALE) / 2

function tween(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
}

function IconButton({children}: {children: ReactNode}) {
  return <div style={{alignItems: 'center', borderRadius: 9, color: '#111111', display: 'flex', height: 40, justifyContent: 'center', width: 40}}>{children}</div>
}

function ChatGptMark({size = 28}: {size?: number}) {
  return (
    <span style={{display: 'block', flexShrink: 0, height: size, overflow: 'hidden', position: 'relative', width: size}}>
      <Img src={staticFile('gptLogo.svg')} style={{filter: 'brightness(0)', height: size, left: 0, maxWidth: 'none', position: 'absolute', top: 0, width: size * (407 / 120)}} />
    </span>
  )
}

function Sidebar() {
  return (
    <aside style={{alignItems: 'center', background: '#ffffff', borderRight: '1px solid #e7e7e7', bottom: 0, display: 'flex', flexDirection: 'column', left: 0, padding: '18px 0 14px', position: 'absolute', top: 0, width: SIDEBAR_WIDTH, zIndex: 30}}>
      <ChatGptMark size={29} />
      <div style={{display: 'grid', gap: 7, marginTop: 34}}>
        <IconButton><SquarePen size={21} strokeWidth={1.8} /></IconButton>
        <IconButton><Search size={22} strokeWidth={1.8} /></IconButton>
        <IconButton><Clock3 size={22} strokeWidth={1.75} /></IconButton>
        <IconButton><Boxes size={22} strokeWidth={1.65} /></IconButton>
        <IconButton><Database size={21} strokeWidth={1.7} /></IconButton>
        <IconButton><ChartNoAxesColumn size={22} strokeWidth={1.75} /></IconButton>
      </div>
      <div style={{display: 'grid', gap: 8, marginTop: 'auto'}}>
        <IconButton><Settings size={22} strokeWidth={1.75} /></IconButton>
        <div style={{backgroundImage: `url(${staticFile('remotion/invoice-three-steps/avatar-sheet.png')})`, backgroundPosition: '75% center', backgroundRepeat: 'no-repeat', backgroundSize: '500% auto', border: '1px solid #d9d9d9', borderRadius: 999, height: 34, width: 34}} />
      </div>
    </aside>
  )
}

const checklist = [
  {activeFrom: 54, completeAt: 122, label: 'Buscando as vendas'},
  {activeFrom: 122, completeAt: 166, label: 'Validando os dados'},
  {activeFrom: 166, completeAt: 316, label: 'Emitindo as notas fiscais'},
  {activeFrom: 316, completeAt: 340, label: 'Finalizando o envio'},
]

function ChecklistItem({activeFrom, completeAt, frame, label}: {activeFrom: number; completeAt: number; frame: number; label: string}) {
  const visible = tween(frame, activeFrom - 12, activeFrom + 3)
  const complete = frame >= completeAt
  const active = frame >= activeFrom && !complete

  return (
    <div style={{alignItems: 'center', display: 'flex', gap: 13, minHeight: 30, opacity: visible, transform: `translateY(${(1 - visible) * 8}px)`}}>
      {complete ? (
        <span style={{color: '#10a37f', fontSize: 20, fontWeight: 760, lineHeight: 1}}>✓</span>
      ) : active ? (
        <span style={{background: '#1677ff', borderRadius: 999, boxShadow: '0 0 0 4px #e8f2ff', height: 10, margin: '0 5px', width: 10}} />
      ) : (
        <Circle color="#7d8590" size={14} strokeWidth={1.6} style={{margin: '0 3px'}} />
      )}
      <span style={{color: '#202123', fontSize: 14, fontWeight: 430}}>{label}</span>
    </div>
  )
}

function Composer() {
  return (
    <div style={{background: '#ffffff', bottom: 20, left: 20, position: 'absolute', right: 20}}>
      <div style={{color: '#5f5f5f', fontSize: 10.5, marginBottom: 15, textAlign: 'center'}}>ChatGPT é uma IA e pode cometer erros.</div>
      <div style={{alignItems: 'center', border: '1px solid #cfcfcf', borderRadius: 999, boxShadow: '0 2px 8px rgba(0,0,0,.07)', boxSizing: 'border-box', display: 'flex', height: 54, padding: '0 8px 0 11px', width: '100%'}}>
        <span style={{alignItems: 'center', color: '#232323', display: 'flex', flexShrink: 0, height: 34, justifyContent: 'center', width: 34}}><Plus size={22} strokeWidth={1.65} /></span>
        <span style={{color: '#8b8b8b', flex: 1, fontSize: 15, marginLeft: 4, whiteSpace: 'nowrap'}}>Pergunte ao ChatGPT</span>
        <span style={{alignItems: 'center', color: '#171717', display: 'flex', flexShrink: 0, height: 34, justifyContent: 'center', width: 34}}><Mic size={19} strokeWidth={1.75} /></span>
        <span style={{alignItems: 'center', background: '#b3b3b3', borderRadius: 999, color: '#fff', display: 'flex', flexShrink: 0, height: 38, justifyContent: 'center', marginLeft: 5, width: 38}}><ArrowUp size={20} strokeWidth={1.9} /></span>
      </div>
    </div>
  )
}

function ChatPanel({frame}: {frame: number}) {
  const userIn = tween(frame, 8, 24)
  const assistantIn = tween(frame, 32, 49)
  const finalIn = tween(frame, 332, 348)

  return (
    <section style={{background: '#fff', borderRight: '1px solid #e7e7e7', bottom: 0, left: SIDEBAR_WIDTH, position: 'absolute', top: 0, width: CHAT_WIDTH, zIndex: 20}}>
      <header style={{alignItems: 'center', display: 'flex', height: 70, justifyContent: 'space-between', padding: '0 24px'}}>
        <div style={{alignItems: 'center', display: 'flex', gap: 6}}><strong style={{fontSize: 18, fontWeight: 650}}>ChatGPT</strong><span style={{color: '#5d6380', fontSize: 18, fontWeight: 520}}>5.6 Sol</span><ChevronDown color="#5d6380" size={15} strokeWidth={1.9} /></div>
        <SquarePen size={20} strokeWidth={1.8} />
      </header>

      <div style={{bottom: 210, left: 0, overflow: 'hidden', padding: '10px 25px', position: 'absolute', right: 0, top: 70}}>
        <div style={{display: 'flex', justifyContent: 'flex-end', opacity: userIn, transform: `translateY(${(1 - userIn) * 10}px)`}}>
          <div style={{background: '#f4f4f4', borderRadius: 22, color: '#202123', fontSize: 14, lineHeight: 1.65, maxWidth: 272, padding: '15px 18px'}}>Busque minhas vendas e emita as notas fiscais correspondentes.</div>
        </div>

        <div style={{display: 'grid', gap: 18, marginTop: 35, opacity: assistantIn, transform: `translateY(${(1 - assistantIn) * 12}px)`}}>
          <p style={{color: '#202123', fontSize: 14, lineHeight: 1.65, margin: 0, width: '100%'}}>Perfeito! Vou localizar as vendas prontas e emitir as notas fiscais para cada cliente.</p>
          <div style={{display: 'grid', gap: 4, width: '100%'}}>{checklist.map((item) => <ChecklistItem {...item} frame={frame} key={item.label} />)}</div>
          <p style={{color: '#202123', fontSize: 14, lineHeight: 1.65, margin: '4px 0 0', opacity: finalIn, transform: `translateY(${(1 - finalIn) * 8}px)`, width: '100%'}}>Notas fiscais emitidas e enviadas com sucesso.</p>
        </div>
      </div>
      <Composer />
    </section>
  )
}

function RightToolbar() {
  return (
    <header style={{alignItems: 'center', background: '#fff', borderBottom: '1px solid #e9ebee', display: 'flex', height: RIGHT_HEADER_HEIGHT, left: RIGHT_LEFT, padding: '0 28px', position: 'absolute', right: 0, top: 0, zIndex: 20}}>
      <span style={{color: '#111', fontSize: 12.5, fontWeight: 560}}>otto-vendas-notas-fiscais</span><ChevronDown size={13} strokeWidth={1.8} style={{marginLeft: 6}} />
      <div style={{alignItems: 'center', display: 'flex', gap: 20, marginLeft: 'auto'}}>
        <Share size={17} strokeWidth={1.7} />
        <Code2 size={18} strokeWidth={1.65} />
        <Zap size={18} strokeWidth={1.7} />
        <Github size={17} strokeWidth={1.7} />
        <MoreVertical size={18} strokeWidth={1.7} />
        <span style={{border: '1px solid #dfe3e8', borderRadius: 8, fontSize: 12, fontWeight: 560, padding: '8px 13px'}}>Publicar</span>
      </div>
    </header>
  )
}

function OttoPanel() {
  return (
    <div style={{background: '#fff', bottom: 0, left: RIGHT_LEFT, overflow: 'hidden', position: 'absolute', right: 0, top: RIGHT_HEADER_HEIGHT}}>
      <div style={{height: 864, left: OTTO_LEFT, position: 'absolute', top: 0, transform: `scale(${OTTO_SCALE})`, transformOrigin: 'top left', width: 1536}}>
        <OttoInvoiceTwoStepsList compact itemsCount={10} />
      </div>
    </div>
  )
}

export function OttoInvoiceChatGptDesktop() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{background: '#fff', color: '#111', fontFamily: CHATGPT_MOBILE_FONT_STACK, overflow: 'hidden'}}>
      <Sidebar />
      <ChatPanel frame={frame} />
      <RightToolbar />
      <OttoPanel />
    </AbsoluteFill>
  )
}
