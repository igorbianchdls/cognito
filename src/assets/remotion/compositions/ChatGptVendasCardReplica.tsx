import { ArrowDown, ArrowLeft, ArrowUp, AudioLines, CalendarDays, ChevronLeft, ChevronRight, Ellipsis, Mic, Package, Plus, ReceiptText, SquarePen, User } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

/**
 * 1:1 animated replica of a ChatGPT iOS screen (828×1792, same as the reference screenshot):
 * the user sends a message, the answer streams in, the OTTO "Vendas" card builds row by row,
 * then the closing paragraph streams and the scroll-to-bottom button appears. Finally a tap on "Venda #1094" opens the
 * sale detail inside the same card and the conversation scrolls so the card sits under the top bar.
 */

export const CHATGPT_VENDAS_CARD_DURATION = 400
export const CHATGPT_VENDAS_CARD_WIDTH = 828
export const CHATGPT_VENDAS_CARD_HEIGHT = 1792

const FONT = IOS_REMOTION_FONT_STACK
const TEXT = '#0d0d0d'
const MUTED = '#6b6b6b'
const LINE = '#e6e6e6'
const BUBBLE = '#f4f4f4'

// The app's globals.css forces its own font on every element; keep the iOS stack inside the replica.
// It also forces every lucide icon to 18px (globals.css); give icons back the size/stroke they were rendered with.
const FONT_CSS = `.chatgpt-replica, .chatgpt-replica * { font-family: ${FONT} !important; }
.chatgpt-replica .lucide { width: var(--icon-size, 24px) !important; height: var(--icon-size, 24px) !important; stroke-width: var(--icon-stroke, 2) !important; }`

const USER_MESSAGE = ['Eu não quero imagem...', '', 'Quero você criar ele aqui no', 'chat, simulado']
const ANSWER_INTRO = 'Aqui está a versão melhorada do card do OTTO, simulada diretamente no ChatGPT.'
const ANSWER_OUTRO_BOLD = 'Essa seria a minha versão final:'
const ANSWER_OUTRO = ' mantém a identidade visual e a paginação do seu card original, mas adiciona o cliente e melhora a hierarquia das informações e do status.'

const SALES = [
  { client: 'QA-OTTO Cliente Cenário', date: '14/10/2026', id: '#1094', value: 'R$ 100,00' },
  { client: 'QA-OTTO Cliente Cenário', date: '14/10/2026', id: '#1093', value: 'R$ 100,00' },
]

// Timeline (frames @30fps)
const T = {
  answerIntro: [62, 92],
  bubble: 48,
  card: 98,
  footer: 132,
  /** the card turns into the sale detail (second reference screenshot) */
  open: 250,
  outro: [146, 214],
  rows: [108, 120],
  scrollButton: 220,
  send: 44,
  /** finger taps "Venda #1094" */
  tap: 236,
  typing: [10, 40],
}

function p(frame: number, from: number, to: number, output: [number, number] = [0, 1], easing = Easing.out(Easing.cubic)) {
  return interpolate(frame, [from, to], output, { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

/** Reveals text word by word, like a streamed answer. */
function stream(text: string, progress: number) {
  const words = text.split(' ')
  return words.slice(0, Math.ceil(words.length * progress)).join(' ')
}

function pop(frame: number, at: number) {
  return spring({ config: { damping: 18, stiffness: 190 }, fps: 30, frame: frame - at })
}

function StatusBar() {
  return (
    <div style={{ alignItems: 'center', display: 'flex', height: 100, justifyContent: 'space-between', left: 0, padding: '0 38px 0 62px', position: 'absolute', right: 0, top: 0 }}>
      <span style={{ color: TEXT, fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em' }}>23:31</span>
      <span style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
        <svg height={22} viewBox="0 0 34 22" width={34}>
          {[0, 1, 2, 3].map((i) => (
            <rect fill={i < 3 ? TEXT : '#bdbdbd'} height={6 + i * 5} key={i} rx={2} width={6} x={i * 9} y={22 - (6 + i * 5)} />
          ))}
        </svg>
        <svg height={24} viewBox="0 0 32 24" width={32}>
          <path d="M16 22 l-4 -4 a6 6 0 0 1 8 0 Z" fill={TEXT} />
          <path d="M6.5 12.5 a13 13 0 0 1 19 0" fill="none" stroke={TEXT} strokeLinecap="round" strokeWidth={3.6} />
          <path d="M1.5 7.5 a20 20 0 0 1 29 0" fill="none" stroke={TEXT} strokeLinecap="round" strokeWidth={3.6} />
        </svg>
        <span style={{ alignItems: 'center', display: 'flex', gap: 2 }}>
          <span style={{ alignItems: 'center', background: '#c7c7c7', borderRadius: 9, color: '#fff', display: 'flex', fontSize: 20, fontWeight: 700, height: 28, justifyContent: 'center', overflow: 'hidden', position: 'relative', width: 48 }}>
            <span style={{ background: TEXT, bottom: 0, left: 0, position: 'absolute', top: 0, width: 12 }} />
            <span style={{ position: 'relative' }}>25</span>
          </span>
          <span style={{ background: '#c7c7c7', borderRadius: '0 3px 3px 0', height: 9, width: 3 }} />
        </span>
      </span>
    </div>
  )
}

function TopBar() {
  return (
    <div style={{ alignItems: 'center', display: 'flex', height: 80, left: 0, padding: '0 50px 0 56px', position: 'absolute', right: 0, top: 100 }}>
      <svg height={26} viewBox="0 0 38 26" width={38}>
        <line stroke={TEXT} strokeLinecap="round" strokeWidth={4} x1={2} x2={36} y1={6} y2={6} />
        <line stroke={TEXT} strokeLinecap="round" strokeWidth={4} x1={2} x2={24} y1={20} y2={20} />
      </svg>
      <span style={{ flex: 1 }} />
      <SquarePen color={TEXT} size={40} strokeWidth={2.1} style={{ marginRight: 46, '--icon-size': '40px', '--icon-stroke': 2.1 } as CSSProperties} />
      <Ellipsis color={TEXT} size={42} strokeWidth={2.6} style={{ '--icon-size': '42px', '--icon-stroke': 2.6 } as CSSProperties} />
    </div>
  )
}

function Composer({ frame }: { frame: number }) {
  const typedLines = USER_MESSAGE.join(' ').replace('  ', ' ')
  const typing = frame >= T.typing[0] && frame < T.send
  const text = typing ? typedLines.slice(0, Math.floor(typedLines.length * p(frame, T.typing[0], T.typing[1], [0, 1], Easing.linear))) : ''
  const hasText = text.length > 0 || (frame >= T.typing[1] && frame < T.send)

  return (
    <div style={{ alignItems: 'center', background: '#f2f2f2', borderRadius: 48, display: 'flex', gap: 22, left: 68, minHeight: 94, padding: '0 16px 0 30px', position: 'absolute', right: 68, top: 1628 }}>
      <Plus color={TEXT} size={42} strokeWidth={2} style={{ '--icon-size': '42px', '--icon-stroke': 2 } as CSSProperties} />
      <span style={{ color: hasText ? TEXT : '#8e8e8e', flex: 1, fontSize: 31, overflow: 'hidden', whiteSpace: 'nowrap', direction: hasText ? 'rtl' : 'ltr', textAlign: 'left' }}>
        <bdi>{hasText ? text : 'Perguntar ao ChatGPT'}</bdi>
      </span>
      {hasText ? null : <Mic color={TEXT} size={38} strokeWidth={2} style={{ marginRight: 12, '--icon-size': '38px', '--icon-stroke': 2 } as CSSProperties} />}
      <span style={{ alignItems: 'center', background: TEXT, borderRadius: 99, display: 'flex', flex: 'none', height: 64, justifyContent: 'center', transform: `scale(${frame >= T.send - 2 && frame < T.send + 2 ? 0.88 : 1})`, width: 64 }}>
        {hasText ? <ArrowUp color="#fff" size={34} strokeWidth={2.6} style={{ '--icon-size': '34px', '--icon-stroke': 2.6 } as CSSProperties} /> : <AudioLines color="#fff" size={32} strokeWidth={2.4} style={{ '--icon-size': '32px', '--icon-stroke': 2.4 } as CSSProperties} />}
      </span>
    </div>
  )
}

function UserBubble({ frame }: { frame: number }) {
  const s = pop(frame, T.bubble)
  if (frame < T.bubble) return null
  return (
    <div style={{ background: BUBBLE, borderRadius: 38, color: TEXT, fontSize: 31, left: 300, lineHeight: '50px', opacity: s, padding: '24px 34px 22px 32px', position: 'absolute', right: 33, top: 227, transform: `translateY(${(1 - s) * 40}px) scale(${0.96 + s * 0.04})`, transformOrigin: 'right bottom' }}>
      {USER_MESSAGE.map((line, i) => (
        <div key={i} style={{ minHeight: 50 }}>{line}</div>
      ))}
    </div>
  )
}

/** Inline CSS vars that pin a lucide icon's size/stroke past the app's global 18px rule. */
const iv = (size: number, stroke: number, extra: CSSProperties = {}) => ({ ...extra, '--icon-size': `${size}px`, '--icon-stroke': stroke }) as CSSProperties

function Badge({ children }: { children: ReactNode }) {
  return <span style={{ background: '#fbe5e5', borderRadius: 99, color: '#a3262c', display: 'inline-block', fontSize: 26, fontWeight: 500, padding: '8px 17px' }}>{children}</span>
}

function IconTile({ children, size = 88 }: { children: ReactNode; size?: number }) {
  return (
    <span style={{ alignItems: 'center', background: '#f3f3f3', borderRadius: 22, display: 'flex', flex: 'none', height: size, justifyContent: 'center', width: size }}>
      {children}
    </span>
  )
}

const LIST_H = 712
const DETAIL_H = 1560
/** How far the conversation scrolls so the opened card sits right under the top bar (660 → 198). */
const OPEN_SCROLL = 462
const OPEN_FRAMES = 26

function Divider({ mt }: { mt: number }) {
  return <div style={{ background: LINE, height: 2, marginTop: mt }} />
}

function SectionTitle({ children, icon, mt }: { children: ReactNode; icon?: ReactNode; mt: number }) {
  return (
    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: mt }}>
      <span style={{ color: TEXT, fontSize: 33, fontWeight: 650, letterSpacing: '-0.01em', lineHeight: '40px' }}>{children}</span>
      {icon}
    </div>
  )
}

const INFO_ROWS = [
  ['Número da venda', '#1094'],
  ['Empresa', 'Empresa 2'],
  ['Data da venda', '14/10/2026'],
]

/** Detail view of sale #1094 (second reference screenshot), shown inside the same card after the tap. */
function SaleDetail({ frame }: { frame: number }) {
  const at = (delay: number): CSSProperties => {
    const s = pop(frame, T.open + delay)
    return { opacity: frame < T.open + delay ? 0 : s, transform: `translateY(${(1 - s) * 16}px)` }
  }

  return (
    <div style={{ inset: 0, padding: '0 31px', position: 'absolute' }}>
      <div style={{ alignItems: 'center', display: 'flex', height: 126, ...at(4) }}>
        <ArrowLeft color="#3d3d3d" size={30} strokeWidth={2} style={iv(30, 2, { marginLeft: 30 })} />
        <span style={{ color: '#4a4a4a', flex: 1, fontSize: 29, fontWeight: 500, marginLeft: 22 }}>Voltar às vendas</span>
        <ReceiptText color="#5b5b5b" size={32} strokeWidth={2} style={iv(32, 2)} />
      </div>
      <div style={{ background: LINE, height: 2 }} />

      <div style={at(10)}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 44 }}>
          <span style={{ color: TEXT, fontSize: 42, fontWeight: 650, letterSpacing: '-0.015em', lineHeight: '50px' }}>Venda #1094</span>
          <Badge>Cancelada</Badge>
        </div>
        <span style={{ color: MUTED, display: 'block', fontSize: 26, lineHeight: '32px', marginTop: 12 }}>Detalhes da venda</span>
      </div>

      <div style={{ background: '#f2f2f2', borderRadius: 32, marginTop: 26, padding: '36px 32px 34px', ...at(18) }}>
        <span style={{ color: MUTED, display: 'block', fontSize: 26, lineHeight: '32px' }}>Valor total da venda</span>
        <span style={{ color: TEXT, display: 'block', fontSize: 54, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: '64px', marginTop: 8 }}>R$ 100,00</span>
        <span style={{ alignItems: 'center', color: MUTED, display: 'flex', fontSize: 26, gap: 10, lineHeight: '32px', marginTop: 14 }}>
          <CalendarDays color={MUTED} size={24} strokeWidth={2} style={iv(24, 2)} /> 14/10/2026
        </span>
      </div>

      <div style={at(28)}>
        <SectionTitle mt={30}>Informações gerais</SectionTitle>
        <div style={{ marginTop: 16 }}>
          {INFO_ROWS.map(([label, value]) => (
            <div key={label} style={{ alignItems: 'center', display: 'flex', height: 64, justifyContent: 'space-between' }}>
              <span style={{ color: MUTED, fontSize: 29 }}>{label}</span>
              <span style={{ color: TEXT, fontSize: 29, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
        <Divider mt={28} />
      </div>

      <div style={at(40)}>
        <SectionTitle icon={<User color="#5b5b5b" size={32} strokeWidth={2} style={iv(32, 2)} />} mt={44}>Cliente</SectionTitle>
        <div style={{ alignItems: 'center', display: 'flex', gap: 26, marginTop: 27 }}>
          <IconTile size={78}>
            <User color="#5b5b5b" size={30} strokeWidth={2} style={iv(30, 2)} />
          </IconTile>
          <div>
            <span style={{ color: TEXT, display: 'block', fontSize: 29, fontWeight: 500, lineHeight: '36px' }}>QA-OTTO Cliente Cenário</span>
            <span style={{ color: MUTED, display: 'block', fontSize: 25, lineHeight: '32px', marginTop: 6 }}>Cliente vinculado à venda</span>
          </div>
        </div>
        <Divider mt={43} />
      </div>

      <div style={at(52)}>
        <SectionTitle mt={44}>Itens da venda</SectionTitle>
        <div style={{ alignItems: 'center', background: '#f2f2f2', borderRadius: 26, display: 'flex', gap: 18, height: 87, marginTop: 27, padding: '0 26px' }}>
          <Package color="#6b6b6b" size={30} strokeWidth={2} style={iv(30, 2)} />
          <span style={{ color: MUTED, fontSize: 30 }}>Itens não carregados na simulação</span>
        </div>
        <Divider mt={42} />
      </div>

      <div style={at(62)}>
        <SectionTitle mt={44}>Resumo financeiro</SectionTitle>
      </div>
    </div>
  )
}

function SalesCard({ frame }: { frame: number }) {
  const card = pop(frame, T.card)
  if (frame < T.card) return null
  const fade = (at: number): CSSProperties => {
    const s = pop(frame, at)
    return { opacity: frame < at ? 0 : s, transform: `translateY(${(1 - s) * 18}px)` }
  }
  const height = p(frame, T.open, T.open + OPEN_FRAMES, [LIST_H, DETAIL_H], Easing.inOut(Easing.cubic))
  const listOut = 1 - p(frame, T.open, T.open + 8)
  const press = frame >= T.tap && frame < T.open + 4
  const ripple = p(frame, T.tap, T.tap + 14)

  return (
    <div style={{ background: '#fff', border: `2px solid ${LINE}`, borderRadius: 40, height, left: 33, opacity: card, overflow: 'hidden', position: 'absolute', right: 33, top: 660, transform: `translateY(${(1 - card) * 30}px) scale(${0.98 + card * 0.02})` }}>
      {listOut > 0 ? (
        <div style={{ opacity: listOut, padding: '0 31px 30px' }}>
          <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', paddingTop: 32 }}>
            <div>
              <span style={{ color: TEXT, display: 'block', fontSize: 41, fontWeight: 650, letterSpacing: '-0.01em', lineHeight: '48px' }}>Vendas</span>
              <span style={{ color: MUTED, display: 'block', fontSize: 28, lineHeight: '34px', marginTop: 8 }}>2 vendas encontradas</span>
            </div>
            <ReceiptText color="#5b5b5b" size={32} strokeWidth={2} style={iv(32, 2, { marginTop: 32 })} />
          </div>

          <div style={{ marginTop: 24 }}>
            {SALES.map((sale, i) => (
              <div key={sale.id} style={{ alignItems: 'center', borderBottom: `2px solid ${LINE}`, display: 'flex', gap: 26, height: 216, position: 'relative', ...fade(T.rows[i]) }}>
                {i === 0 && press ? (
                  <>
                    <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 20, inset: '8px -14px', position: 'absolute' }} />
                    <div style={{ background: 'rgba(0,0,0,0.14)', borderRadius: 99, height: 40 + ripple * 120, left: 330 - (40 + ripple * 120) / 2, opacity: 1 - ripple * 0.7, position: 'absolute', top: 108 - (40 + ripple * 120) / 2, width: 40 + ripple * 120 }} />
                  </>
                ) : null}
                <IconTile>
                  <ReceiptText color="#5b5b5b" size={32} strokeWidth={2} style={iv(32, 2)} />
                </IconTile>
                <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                  <span style={{ color: TEXT, display: 'block', fontSize: 34, fontWeight: 650, letterSpacing: '-0.01em' }}>Venda {sale.id}</span>
                  <span style={{ color: MUTED, display: 'block', fontSize: 29, marginTop: 6 }}>{sale.client}</span>
                  <span style={{ color: MUTED, display: 'block', fontSize: 27, marginTop: 6 }}>{sale.date}</span>
                </div>
                <div style={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 26, position: 'relative' }}>
                  <span style={{ color: TEXT, fontSize: 34, fontWeight: 650, letterSpacing: '-0.01em' }}>{sale.value}</span>
                  <Badge>Cancelada</Badge>
                </div>
              </div>
            ))}
          </div>

          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', height: 60, marginTop: 40, ...fade(T.footer) }}>
            <span style={{ color: MUTED, fontSize: 28 }}>1–2 de 2 vendas</span>
            <span style={{ alignItems: 'center', display: 'flex', gap: 16 }}>
              <span style={{ alignItems: 'center', border: `2px solid ${LINE}`, borderRadius: 99, display: 'flex', height: 60, justifyContent: 'center', width: 98 }}>
                <ChevronLeft color="#9a9a9a" size={32} strokeWidth={2} style={iv(32, 2)} />
              </span>
              <span style={{ color: TEXT, fontSize: 30, fontWeight: 600 }}>1 / 1</span>
              <span style={{ alignItems: 'center', border: `2px solid ${LINE}`, borderRadius: 99, display: 'flex', height: 60, justifyContent: 'center', width: 98 }}>
                <ChevronRight color="#9a9a9a" size={32} strokeWidth={2} style={iv(32, 2)} />
              </span>
            </span>
          </div>
        </div>
      ) : null}

      {frame >= T.open ? <SaleDetail frame={frame} /> : null}
    </div>
  )
}

export function ChatGptVendasCardReplica() {
  const frame = useCurrentFrame()
  const intro = stream(ANSWER_INTRO, p(frame, T.answerIntro[0], T.answerIntro[1], [0, 1], Easing.linear))
  const outroAll = `${ANSWER_OUTRO_BOLD}${ANSWER_OUTRO}`
  const outroText = stream(outroAll, p(frame, T.outro[0], T.outro[1], [0, 1], Easing.linear))
  const bold = outroText.slice(0, ANSWER_OUTRO_BOLD.length)
  const rest = outroText.slice(ANSWER_OUTRO_BOLD.length)
  const scrollBtn = pop(frame, T.scrollButton)
  const opening = p(frame, T.open, T.open + OPEN_FRAMES, [0, 1], Easing.inOut(Easing.cubic))
  const scroll = opening * OPEN_SCROLL

  return (
    <AbsoluteFill className="chatgpt-replica" style={{ background: '#fff', color: TEXT, fontFamily: FONT }}>
      <style>{FONT_CSS}</style>

      {/* conversation (scrolls up when the sale opens) */}
      <div style={{ inset: 0, position: 'absolute', transform: `translateY(${-scroll}px)` }}>
        <UserBubble frame={frame} />
        {frame >= T.answerIntro[0] ? (
          <p style={{ color: TEXT, fontSize: 32, left: 33, lineHeight: '48px', margin: 0, position: 'absolute', right: 40, top: 532 }}>{intro}</p>
        ) : null}
        <SalesCard frame={frame} />
        {frame >= T.outro[0] ? (
          <p style={{ color: TEXT, fontSize: 32, left: 33, lineHeight: '48px', margin: 0, opacity: 1 - opening, position: 'absolute', right: 40, top: 1405 }}>
            <strong style={{ fontWeight: 700 }}>{bold}</strong>
            {rest}
          </p>
        ) : null}
      </div>

      {/* top bars stay fixed above the scrolling conversation */}
      <div style={{ background: 'linear-gradient(#fff 88%, rgba(255,255,255,0))', height: 196, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <StatusBar />
      <TopBar />

      {/* fade under the composer, like the app */}
      <div style={{ background: 'linear-gradient(rgba(255,255,255,0), #fff 45%)', height: 230, left: 0, position: 'absolute', right: 0, top: 1580 }} />
      {frame >= T.scrollButton ? (
        <span style={{ alignItems: 'center', background: '#fff', border: '1px solid #ececec', borderRadius: 99, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', display: 'flex', height: 68, justifyContent: 'center', left: 380, opacity: scrollBtn, position: 'absolute', top: 1534, transform: `scale(${0.8 + scrollBtn * 0.2})`, width: 68 }}>
          <ArrowDown color={TEXT} size={34} strokeWidth={2.4} style={iv(34, 2.4)} />
        </span>
      ) : null}

      <Composer frame={frame} />
      <span style={{ background: '#d4d4d4', borderRadius: 99, height: 92 + opening * 226, left: 816, position: 'absolute', top: 490 + opening * 578, width: 5 }} />
      <div style={{ background: TEXT, borderRadius: 99, height: 9, left: 267, position: 'absolute', top: 1764, width: 294 }} />
    </AbsoluteFill>
  )
}
