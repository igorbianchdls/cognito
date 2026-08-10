import type { ReactNode } from 'react'
import {
  ArrowUp,
  AudioLines,
  BookOpen,
  Clock3,
  Copy,
  ExternalLink,
  Folder,
  LibraryBig,
  Mic,
  MoreHorizontal,
  PanelLeft,
  Plus,
  RefreshCw,
  Search,
  Share,
  ShoppingBag,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Upload,
} from 'lucide-react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

export const CHATGPT_PLUS_STATIC_UI_DURATION = 360

const FONT = 'Arial, Helvetica, sans-serif'
const INK = '#0d0d0d'
const MUTED = '#8b8b8b'
const SIDEBAR = '#f9f9f9'

function p(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

const recentChats = [
  'ICMS para restaurantes PE',
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

function ActionButton({ children }: { children: ReactNode }) {
  return <span style={{ alignItems: 'center', color: '#5d5d5d', display: 'inline-flex', height: 24, justifyContent: 'center', width: 24 }}>{children}</span>
}

function ResponseActions({ progress = 1 }: { progress?: number }) {
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 4, marginTop: 13, opacity: progress, transform: `translateY(${(1 - progress) * 5}px)` }}>
      <ActionButton><Copy size={18} strokeWidth={1.6} /></ActionButton>
      <ActionButton><ThumbsUp size={17} strokeWidth={1.6} /></ActionButton>
      <ActionButton><ThumbsDown size={17} strokeWidth={1.6} /></ActionButton>
      <ActionButton><Upload size={18} strokeWidth={1.6} /></ActionButton>
      <ActionButton><RefreshCw size={17} strokeWidth={1.6} /></ActionButton>
      <ActionButton><MoreHorizontal size={18} strokeWidth={1.8} /></ActionButton>
    </div>
  )
}

function SourcePill({ children }: { children: ReactNode }) {
  return (
    <span style={{ alignItems: 'center', background: '#f5f5f5', borderRadius: 10, color: '#686868', display: 'inline-flex', fontSize: 9, gap: 4, marginLeft: 6, padding: '3px 7px', verticalAlign: 'middle' }}>
      <span style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #dddddd', borderRadius: 999, display: 'inline-flex', height: 10, justifyContent: 'center', width: 10 }}>⌁</span>
      {children}
      <span style={{ color: '#9a9a9a' }}>+1</span>
    </span>
  )
}

type TextSegment = { bold?: boolean; text: string }

function StreamingParagraph({
  end,
  marginBottom = 15,
  segments,
  source,
  start,
}: {
  end: number
  marginBottom?: number
  segments: TextSegment[]
  source?: string
  start: number
}) {
  const frame = useCurrentFrame()
  if (frame < start) return null

  const totalCharacters = segments.reduce((total, segment) => total + segment.text.length, 0)
  const visibleCharacters = Math.floor(p(frame, start, end, [0, totalCharacters]))
  const complete = visibleCharacters >= totalCharacters
  let consumed = 0

  return (
    <p style={{ margin: `0 0 ${marginBottom}px` }}>
      {segments.map((segment, index) => {
        const localCount = Math.max(0, Math.min(segment.text.length, visibleCharacters - consumed))
        consumed += segment.text.length
        const content = segment.text.slice(0, localCount)
        return segment.bold ? <strong key={`${segment.text}-${index}`}>{content}</strong> : <span key={`${segment.text}-${index}`}>{content}</span>
      })}
      {complete && source ? <SourcePill>{source}</SourcePill> : null}
      {!complete ? <span style={{ background: INK, display: 'inline-block', height: 16, marginLeft: 2, opacity: Math.floor(frame / 5) % 2 ? 0.25 : 0.9, verticalAlign: '-2px', width: 2 }} /> : null}
    </p>
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

function PreviousAnswer() {
  return (
    <div style={{ fontSize: 16, lineHeight: 1.58 }}>
      <p style={{ margin: '0 0 17px' }}>Promoções, desde que a conta/anúncios atendam aos critérios de elegibilidade.</p>
      <p style={{ margin: '0 0 17px' }}>Você consegue configurar, dependendo da modalidade disponível para sua conta, coisas como <strong>percentual ou valor de desconto, orçamento máximo da campanha, período de validade e produtos participantes.</strong> O Mercado Livre também possui cupons criados pela própria plataforma, que são diferentes dos financiados pelo vendedor.</p>
      <p style={{ margin: '0 0 17px' }}><span style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>Mercado Livre — Central de vendedores: cupons</span> <ExternalLink size={12} style={{ verticalAlign: '-1px' }} /></p>
      <p style={{ margin: 0 }}>Se sua ideia é algo como <strong>“CUPOM10” divulgado no Instagram/TikTok para saber quantas vendas vieram do influenciador</strong>, vale verificar a modalidade específica: <strong>nem todo cupom do Mercado Livre funciona como um código público personalizado escolhido livremente pelo vendedor.</strong></p>
      <ResponseActions />
    </div>
  )
}

function CurrentAnswer() {
  const frame = useCurrentFrame()
  const actionsIn = p(frame, 312, 332)

  return (
    <div style={{ fontSize: 16, lineHeight: 1.58 }}>
      <StreamingParagraph end={89} segments={[{ text: 'Sim. ' }, { bold: true, text: 'Nos dois.' }]} start={76} />
      <StreamingParagraph
        end={145}
        segments={[
          { text: 'No ' },
          { bold: true, text: 'Mercado Livre' },
          { text: ', o vendedor pode criar cupons pela Central de Promoções, inclusive cupons voltados a todos os compradores elegíveis.' },
        ]}
        source="Mercado Livre"
        start={92}
      />
      <StreamingParagraph
        end={210}
        segments={[
          { text: 'Na ' },
          { bold: true, text: 'Shopee' },
          { text: ', também é possível trabalhar com cupons da loja e divulgar códigos de cupom junto com o link do produto ou da loja. A própria central de ajuda da Shopee orienta vendedores a compartilhar esses códigos com seguidores.' },
        ]}
        source="Central de Ajuda"
        start={148}
      />
      <StreamingParagraph
        end={308}
        marginBottom={0}
        segments={[
          { text: 'Então, se sua ideia for usar algo como ' },
          { bold: true, text: 'INFLUENCER10' },
          { text: ' para rastrear vendas vindas de Instagram/TikTok, a ' },
          { bold: true, text: 'Shopee é mais naturalmente compatível com esse tipo de código promocional.' },
          { text: ' No Mercado Livre também dá para usar cupons, mas a flexibilidade do código e as regras dependem da promoção disponível para sua conta.' },
        ]}
        source="Mercado Livre"
        start={213}
      />
      {frame >= 308 ? <ResponseActions progress={actionsIn} /> : null}
    </div>
  )
}

function MessageComposer() {
  const frame = useCurrentFrame()
  const prompt = 'Posso criar cupom de desconto no mercado livre e shopee?'
  const isWriting = frame < 53
  const typedCharacters = Math.floor(p(frame, 3, 47, [0, prompt.length]))

  return (
    <>
      <div style={{ bottom: 95, color: '#999999', fontSize: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)' }}>O ChatGPT pode cometer erros. Por isso, lembre-se de conferir informações relevantes.</div>
      <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e1e1e1', borderRadius: 28, bottom: 28, boxShadow: '0 3px 16px rgba(0,0,0,0.08)', display: 'flex', height: 54, left: '50%', padding: '0 8px 0 18px', position: 'absolute', transform: 'translateX(-50%)', width: 768 }}>
        <Plus size={21} strokeWidth={1.7} />
        <span style={{ color: isWriting ? INK : '#8b8b8b', fontSize: 16, marginLeft: 18 }}>{isWriting ? prompt.slice(0, typedCharacters) : 'Pergunte ao ChatGPT'}</span>
        <span style={{ color: '#8b8b8b', fontSize: 14, marginLeft: 'auto' }}>Instantâneo⌄</span>
        <Mic size={19} style={{ marginLeft: 24 }} strokeWidth={1.8} />
        <span style={{ alignItems: 'center', background: '#050505', borderRadius: 999, color: '#ffffff', display: 'flex', height: 38, justifyContent: 'center', marginLeft: 17, width: 38 }}>{isWriting ? <ArrowUp size={21} strokeWidth={2.2} /> : <AudioLines size={21} strokeWidth={2} />}</span>
      </div>
    </>
  )
}

export function ChatGptPlusStaticUi() {
  const frame = useCurrentFrame()
  const userMessageIn = p(frame, 54, 70)

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: INK, fontFamily: FONT, overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ bottom: 0, left: 262, overflow: 'hidden', position: 'absolute', right: 0, top: 0 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 18, position: 'absolute', right: 27, top: 18 }}><Share size={18} strokeWidth={1.6} /><MoreHorizontal size={20} strokeWidth={1.8} /></div>
        <div style={{ left: '50%', position: 'absolute', top: -17, transform: 'translateX(-50%)', width: 770 }}><PreviousAnswer /></div>
        <div style={{ alignItems: 'center', background: '#f4f4f4', borderRadius: 22, display: 'flex', fontSize: 15, minHeight: 44, opacity: userMessageIn, padding: '0 17px', position: 'absolute', right: 'calc(50% - 385px)', top: 365, transform: `translateY(${(1 - userMessageIn) * 8}px) scale(${0.98 + userMessageIn * 0.02})`, transformOrigin: 'right center' }}>Posso criar cupom de desconto no mercado livre e shopee?</div>
        <div style={{ left: '50%', position: 'absolute', top: 454, transform: 'translateX(-50%)', width: 770 }}><CurrentAnswer /></div>
        <MessageComposer />
        <div style={{ background: '#858585', borderRadius: 999, bottom: 24, height: 33, position: 'absolute', right: 4, width: 8 }} />
      </main>
    </AbsoluteFill>
  )
}
