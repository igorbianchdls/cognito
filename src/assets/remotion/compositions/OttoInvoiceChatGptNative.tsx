import type {ReactNode} from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  CircleHelp,
  CircleUserRound,
  Clock3,
  ExternalLink,
  FileText,
  Library,
  LockKeyhole,
  Mic,
  MoreHorizontal,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Share,
  Sparkles,
  SquarePen,
  Star,
} from 'lucide-react'
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion'

import {CHATGPT_MOBILE_FONT_STACK} from '@/assets/remotion/compositions/ChatGptMobileBase'

export const OTTO_INVOICE_CHATGPT_NATIVE_DURATION = 360

const BROWSER_HEIGHT = 40
const SIDEBAR_WIDTH = 262
const CHAT_GREEN = '#10a37f'

const invoices = [
  {company: 'Ana Clara LTDA', value: 'R$ 1.250,00'},
  {company: 'Bruno Serviços ME', value: 'R$ 980,00'},
  {company: 'Clínica Viva Bem', value: 'R$ 2.300,00'},
  {company: 'Lucas Consultoria', value: 'R$ 1.750,00'},
  {company: 'Studio Design LTDA', value: 'R$ 1.100,00'},
  {company: 'Marketing Digital SA', value: 'R$ 870,00'},
  {company: 'Juliana Costa MEI', value: 'R$ 540,00'},
  {company: 'Tech Solutions LTDA', value: 'R$ 1.990,00'},
]

function tween(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
}

function ChatGptMark({size = 25}: {size?: number}) {
  return (
    <span style={{display: 'block', flexShrink: 0, height: size, overflow: 'hidden', position: 'relative', width: size}}>
      <Img src={staticFile('gptLogo.svg')} style={{filter: 'brightness(0)', height: size, left: 0, maxWidth: 'none', position: 'absolute', top: 0, width: size * (407 / 120)}} />
    </span>
  )
}

function BrowserButton({children}: {children: ReactNode}) {
  return <span style={{alignItems: 'center', color: '#596068', display: 'flex', height: 32, justifyContent: 'center', width: 32}}>{children}</span>
}

function BrowserChrome() {
  return (
    <div style={{background: '#fff', borderBottom: '1px solid #d9dcdf', height: BROWSER_HEIGHT, left: 0, position: 'absolute', right: 0, top: 0}}>
      <div style={{alignItems: 'center', display: 'flex', height: 40, padding: '0 15px'}}>
        <BrowserButton><ArrowLeft size={18} /></BrowserButton>
        <BrowserButton><ArrowRight size={18} /></BrowserButton>
        <BrowserButton><RefreshCw size={17} /></BrowserButton>
        <div style={{alignItems: 'center', background: '#f1f3f4', borderRadius: 20, display: 'flex', flex: 1, height: 30, marginLeft: 7, padding: '0 13px'}}>
          <LockKeyhole color="#5f6368" size={13} />
          <span style={{fontSize: 15, marginLeft: 9}}>chatgpt.com</span>
          <Star color="#62676c" size={17} style={{marginLeft: 'auto'}} />
        </div>
        <CircleUserRound color="#707780" size={22} style={{marginLeft: 13}} />
        <MoreVertical color="#5f6368" size={20} style={{marginLeft: 9}} />
      </div>
    </div>
  )
}

const sidebarEntries = [
  {icon: <SquarePen size={19} />, label: 'Novo chat'},
  {icon: <Search size={20} />, label: 'Buscar chats'},
  {icon: <Library size={20} />, label: 'Biblioteca'},
  {icon: <span style={{fontSize: 22, lineHeight: 1}}>⌘</span>, label: 'Explorar GPTs'},
]

function Sidebar() {
  return (
    <aside style={{background: '#f9f9f9', bottom: 0, left: 0, padding: '18px 11px', position: 'absolute', top: BROWSER_HEIGHT, width: SIDEBAR_WIDTH}}>
      <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '0 9px 22px'}}>
        <ChatGptMark size={24} />
        <SquarePen size={20} strokeWidth={1.8} />
      </div>
      <div style={{display: 'grid', gap: 2}}>
        {sidebarEntries.map((item) => (
          <div key={item.label} style={{alignItems: 'center', display: 'flex', gap: 13, height: 39, padding: '0 9px'}}>
            {item.icon}<span style={{fontSize: 14}}>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{color: '#666', fontSize: 12, margin: '29px 8px 8px'}}>Chats</div>
      {['Emitir notas fiscais', 'Resumo de vendas', 'Fluxo de caixa semanal', 'Clientes inadimplentes'].map((label, index) => (
        <div key={label} style={{alignItems: 'center', background: index === 0 ? '#e9e9e9' : 'transparent', borderRadius: 8, display: 'flex', fontSize: 13.5, height: 38, padding: '0 9px'}}>
          <span>{label}</span>{index === 0 ? <MoreHorizontal size={18} style={{marginLeft: 'auto'}} /> : null}
        </div>
      ))}
      <div style={{color: '#666', fontSize: 12, margin: '29px 8px 8px'}}>7 dias anteriores</div>
      {['Relatório financeiro', 'Análise de estoque'].map((label) => <div key={label} style={{fontSize: 13.5, height: 38, padding: '9px'}}>{label}</div>)}

      <div style={{bottom: 74, left: 18, position: 'absolute', right: 18}}>
        <div style={{alignItems: 'center', display: 'flex', gap: 12}}>
          <span style={{alignItems: 'center', border: '1px solid #d8d8d8', borderRadius: 999, display: 'flex', height: 29, justifyContent: 'center', width: 29}}><Sparkles size={16} /></span>
          <div><div style={{fontSize: 13}}>Fazer upgrade do plano</div><div style={{color: '#777', fontSize: 11, marginTop: 3}}>Mais acesso aos melhores modelos</div></div>
        </div>
      </div>
      <div style={{alignItems: 'center', bottom: 15, display: 'flex', gap: 10, left: 17, position: 'absolute', right: 16}}>
        <span style={{alignItems: 'center', background: '#687785', borderRadius: 999, color: '#fff', display: 'flex', fontSize: 11, height: 31, justifyContent: 'center', width: 31}}>VO</span>
        <span style={{fontSize: 13}}>Você</span><MoreHorizontal size={18} style={{marginLeft: 'auto'}} />
      </div>
    </aside>
  )
}

type InvoiceStatus = 'done' | 'active' | 'waiting'

function StatusIcon({frame, status}: {frame: number; status: InvoiceStatus}) {
  if (status === 'done') {
    return <span style={{alignItems: 'center', border: `2px solid ${CHAT_GREEN}`, borderRadius: 999, color: CHAT_GREEN, display: 'flex', fontSize: 12, fontWeight: 800, height: 18, justifyContent: 'center', width: 18}}>✓</span>
  }
  if (status === 'active') {
    return <span style={{border: `2px dotted ${CHAT_GREEN}`, borderRadius: 999, height: 18, transform: `rotate(${frame * 7}deg)`, width: 18}} />
  }
  return <Clock3 color="#aeb4ba" size={19} strokeWidth={1.7} />
}

function InvoiceRow({frame, index, completed, rawProgress}: {frame: number; index: number; completed: number; rawProgress: number}) {
  const status: InvoiceStatus = index < completed ? 'done' : index === completed && completed < invoices.length ? 'active' : 'waiting'
  const activeProgress = status === 'active' ? Math.max(0, Math.min(1, rawProgress - index)) : 0
  const secondary = status === 'done' ? 'Enviada por WhatsApp' : status === 'active' ? (activeProgress < 0.48 ? 'Preparando nota fiscal' : 'Gerando XML') : 'Na fila para emissão'
  const stateLabel = status === 'done' ? 'Emitida' : status === 'active' ? 'Emitindo...' : 'Aguardando...'

  return (
    <div style={{alignItems: 'center', borderBottom: index === invoices.length - 1 ? 'none' : '1px solid #e6e6e6', display: 'grid', gridTemplateColumns: '112px 1fr 255px 105px', height: 46, padding: '0 14px'}}>
      <div style={{alignItems: 'center', display: 'flex', gap: 12}}><FileText color="#454b50" size={18} strokeWidth={1.6} /><span style={{fontSize: 13.5}}>NFS-e</span></div>
      <div><div style={{fontSize: 13, fontWeight: 650}}>{invoices[index].company}</div><div style={{fontSize: 11.5, marginTop: 2}}>{invoices[index].value}</div></div>
      <div style={{alignItems: 'center', display: 'flex', gap: 12}}>
        <StatusIcon frame={frame} status={status} />
        <div><div style={{color: status === 'done' ? CHAT_GREEN : '#26313a', fontSize: 12.5, fontWeight: 650}}>{stateLabel}</div><div style={{color: '#596169', fontSize: 11.5, marginTop: 2}}>{secondary}</div></div>
      </div>
      <button style={{alignItems: 'center', background: '#fff', border: '1px solid #dedede', borderRadius: 18, color: status === 'done' ? '#171717' : '#a7a7a7', display: 'flex', fontFamily: 'inherit', fontSize: 11.5, gap: 6, justifyContent: 'center', padding: '7px 10px'}}>Ver nota <ExternalLink size={12} /></button>
    </div>
  )
}

function ToolCard({frame}: {frame: number}) {
  const cardIn = tween(frame, 38, 54)
  const rawProgress = tween(frame, 60, 316, [0, invoices.length])
  const completed = Math.min(invoices.length, Math.floor(rawProgress))
  const progress = Math.min(1, rawProgress / invoices.length)
  const allDone = completed === invoices.length

  return (
    <div style={{background: '#fff', border: '1px solid #e4e4e4', borderRadius: 20, boxShadow: '0 2px 11px rgba(0,0,0,.07)', height: 600, opacity: cardIn, overflow: 'hidden', transform: `translateY(${(1 - cardIn) * 10}px)`, width: '100%'}}>
      <div style={{alignItems: 'center', display: 'flex', height: 50, padding: '0 20px'}}>
        <span style={{alignItems: 'center', border: '1px solid #ddd', borderRadius: 7, display: 'flex', height: 27, justifyContent: 'center', width: 27}}><FileText size={15} /></span>
        <strong style={{fontSize: 13.5, marginLeft: 11}}>Otto · Emitir notas fiscais</strong>
        <span style={{color: allDone ? CHAT_GREEN : '#646a70', fontSize: 12, marginLeft: 18}}>{allDone ? 'Concluído' : 'Executando...'}</span>
        <ChevronDown size={17} style={{marginLeft: 'auto', transform: 'rotate(180deg)'}} />
      </div>
      <div style={{padding: '4px 20px 0'}}>
        <div style={{alignItems: 'center', display: 'flex'}}><h1 style={{fontSize: 120, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1, margin: 0, whiteSpace: 'nowrap'}}>Emitindo nota fiscal</h1></div>
        <div style={{fontSize: 12.5, fontWeight: 620, marginTop: 8}}>{completed} de {invoices.length} notas emitidas</div>
        <div style={{background: '#eceeed', borderRadius: 999, height: 5, marginTop: 8, overflow: 'hidden'}}><div style={{background: CHAT_GREEN, borderRadius: 999, height: '100%', width: `${progress * 100}%`}} /></div>
        <div style={{border: '1px solid #dedede', borderRadius: 12, marginTop: 12, overflow: 'hidden'}}>
          {invoices.map((_, index) => <InvoiceRow completed={completed} frame={frame} index={index} key={invoices[index].company} rawProgress={rawProgress} />)}
        </div>
        <div style={{display: 'flex', fontSize: 12, marginTop: 9}}><strong>Total: {invoices.length} notas fiscais</strong><span style={{color: '#5e646a', marginLeft: 'auto'}}>{completed} de {invoices.length} concluídas</span></div>
      </div>
    </div>
  )
}

function Composer() {
  return (
    <div style={{bottom: 20, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 812}}>
      <div style={{color: '#545454', fontSize: 11.5, marginBottom: 15, textAlign: 'center'}}>ChatGPT é uma IA e pode cometer erros.</div>
      <div style={{alignItems: 'center', background: '#fff', border: '1px solid #cfcfcf', borderRadius: 999, boxShadow: '0 2px 9px rgba(0,0,0,.08)', boxSizing: 'border-box', display: 'flex', height: 54, padding: '0 8px 0 13px', width: '100%'}}>
        <span style={{alignItems: 'center', color: '#252525', display: 'flex', flexShrink: 0, height: 36, justifyContent: 'center', width: 36}}><Plus size={22} strokeWidth={1.7} /></span>
        <span style={{color: '#8a8a8a', flex: 1, fontSize: 15.5, marginLeft: 5}}>Pergunte ao ChatGPT</span>
        <span style={{alignItems: 'center', color: '#191919', display: 'flex', flexShrink: 0, height: 36, justifyContent: 'center', width: 36}}><Mic size={19} strokeWidth={1.8} /></span>
        <span style={{alignItems: 'center', background: '#b2b2b2', borderRadius: 999, color: '#fff', display: 'flex', flexShrink: 0, height: 38, justifyContent: 'center', marginLeft: 5, width: 38}}><ArrowUp size={20} strokeWidth={1.9} /></span>
      </div>
    </div>
  )
}

function ChatArea({frame}: {frame: number}) {
  const userIn = tween(frame, 4, 19)
  const replyIn = tween(frame, 22, 38)
  const finalIn = tween(frame, 320, 340)

  return (
    <main style={{background: '#fff', bottom: 0, left: SIDEBAR_WIDTH, position: 'absolute', right: 0, top: BROWSER_HEIGHT}}>
      <header style={{alignItems: 'center', display: 'flex', height: 64, padding: '0 27px'}}>
        <div style={{alignItems: 'center', display: 'flex', fontSize: 18, fontWeight: 600, gap: 6}}>ChatGPT 5.6 Sol <ChevronDown color="#656b70" size={15} /></div>
        <button style={{alignItems: 'center', background: '#fff', border: '1px solid #dedede', borderRadius: 19, display: 'flex', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, gap: 8, marginLeft: 'auto', padding: '9px 17px'}}><Share size={16} /> Compartilhar</button>
        <span style={{alignItems: 'center', background: '#687785', borderRadius: 999, color: '#fff', display: 'flex', fontSize: 11, height: 36, justifyContent: 'center', marginLeft: 20, width: 36}}>VO</span>
      </header>

      <div style={{bottom: 0, left: '50%', position: 'absolute', top: 64, transform: 'translateX(-50%)', width: '70%'}}>
        <div style={{display: 'flex', justifyContent: 'flex-end', opacity: userIn, transform: `translateY(${(1 - userIn) * 8}px)`}}>
          <div style={{background: '#f4f4f4', borderRadius: 20, fontSize: 14, lineHeight: 1.55, maxWidth: 355, padding: '13px 18px'}}>Chat, emita as notas fiscais das vendas de hoje e envie para cada cliente por WhatsApp.</div>
        </div>
        <p style={{fontSize: 14, lineHeight: 1.55, margin: '21px 0 10px', opacity: replyIn, transform: `translateY(${(1 - replyIn) * 7}px)`}}>Perfeito! Vou buscar as vendas de hoje e emitir as notas fiscais para cada cliente.</p>
        <ToolCard frame={frame} />
        <p style={{fontSize: 13.5, margin: '13px 0 0', opacity: finalIn}}>Pronto! As notas fiscais foram emitidas e enviadas para os clientes pelo WhatsApp.</p>
      </div>
      <Composer />
      <CircleHelp color="#777" size={27} style={{bottom: 18, position: 'absolute', right: 18}} />
    </main>
  )
}

export function OttoInvoiceChatGptNative() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{background: '#fff', color: '#171717', fontFamily: CHATGPT_MOBILE_FONT_STACK, letterSpacing: '-0.01em', overflow: 'hidden'}}>
      <BrowserChrome />
      <Sidebar />
      <ChatArea frame={frame} />
    </AbsoluteFill>
  )
}
