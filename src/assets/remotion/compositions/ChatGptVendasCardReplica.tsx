import { ArrowDown, ArrowDownLeft, ArrowLeft, ArrowUp, ArrowUpRight, AudioLines, CalendarDays, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, ChartNoAxesCombined, CircleAlert, CircleCheck, ClockAlert, CalendarClock, HandCoins, TrendingUp, Wallet, ClipboardCheck, Ellipsis, FileCheck2, FileText, Info, Landmark, Link as LinkIcon, Mic, Package, Plus, ReceiptText, SquarePen, Tags, Trash2, TriangleAlert, User, UserPlus, Users } from 'lucide-react'
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

export const CHATGPT_VENDAS_CARD_DURATION = 2520
export const CHATGPT_VENDAS_CARD_WIDTH = 828
export const CHATGPT_VENDAS_CARD_HEIGHT = 1792

export const FONT = IOS_REMOTION_FONT_STACK
export const TEXT = '#0d0d0d'
export const MUTED = '#6b6b6b'
const LINE = '#e6e6e6'
const BUBBLE = '#f4f4f4'

// The app's globals.css forces its own font on every element; keep the iOS stack inside the replica.
// It also forces every lucide icon to 18px (globals.css); give icons back the size/stroke they were rendered with.
export const FONT_CSS = `.chatgpt-replica, .chatgpt-replica * { font-family: ${FONT} !important; }
.chatgpt-replica .lucide { width: var(--icon-size, 24px) !important; height: var(--icon-size, 24px) !important; stroke-width: var(--icon-stroke, 2) !important; }`

const USER_MESSAGE = ['Me mostra minhas vendas', 'recentes e já classifica as', 'despesas da semana']
const ANSWER_INTRO = 'Aqui estão as suas vendas recentes, direto do OTTO:'
const ANSWER_OUTRO_BOLD = ''
const ANSWER_OUTRO = 'Encontrei 2 vendas recentes, as duas canceladas. Toque em uma delas para ver os detalhes.'
const EXPENSES_INTRO = 'E aqui estão as despesas da semana, já com as categorias sugeridas:'

const SALES = [
  { client: 'QA-OTTO Cliente Cenário', date: '14/10/2026', id: '#1094', value: 'R$ 100,00' },
  { client: 'QA-OTTO Cliente Cenário', date: '14/10/2026', id: '#1093', value: 'R$ 100,00' },
]

// Timeline (frames @30fps)
export const T = {
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
  // expense classification
  confirmButtons: 588,
  confirmRows: 554,
  done: 634,
  expCard: 416,
  expFooter: 486,
  expIntro: [378, 410],
  expRows: [428, 442, 456, 470],
  review: 544,
  /** after the sale detail builds, scroll inside it to show the financial summary */
  scrollDetail: [322, 348],
  scrollToExpenses: [374, 404],
  scrollToFooter: [492, 522],
  tapConfirm: 622,
  tapReview: 532,
  // clients CRUD
  a2: [760, 780],
  a2b: [846, 876],
  a3: [1090, 1104],
  a4: [1316, 1340],
  clientRows: 796,
  clientsCard: 786,
  createCard: 1108,
  createCity: [1166, 1172] as [number, number],
  createDone: 1198,
  createEmail: [1142, 1162] as [number, number],
  createName: [1122, 1138] as [number, number],
  createTap: 1186,
  delCard: 1344,
  delCheck: 1380,
  delType: [1394, 1408] as [number, number],
  u2: { send: 732, typing: [690, 728] },
  u3: { send: 1060, typing: [1030, 1056] },
  u4: { send: 1286, typing: [1256, 1282] },
  updCard: 880,
  updDone: 972,
  updEmail: [922, 944] as [number, number],
  updName: [894, 918] as [number, number],
  updTap: 960,
  // financial overview
  a5: [1500, 1522],
  finAlerts: 1662,
  finBars: 1716,
  finChart: 1690,
  finCard: 1526,
  finSwitch: 1618,
  finTapOption: 1612,
  finTapSelect: 1590,
  finTiles: 1536,
  u5: { send: 1470, typing: [1440, 1466] },
  // batch invoices (NFS-e)
  a6: [1840, 1864],
  nfCard: 1868,
  nfConfirm: 1976,
  nfDone: 2058,
  nfRows: 1878,
  nfTapReview: 1964,
  nfTapSimulate: 2046,
  u6: { send: 1812, typing: [1780, 1808] },
  // bank reconciliation
  a7: [2172, 2194],
  bcCard: 2198,
  bcConfirm: 2330,
  bcDone: 2408,
  bcFooter: 2276,
  bcRows: 2226,
  bcTapConfirm: 2396,
  bcTapReview: 2318,
  u7: { send: 2142, typing: [2110, 2138] },
}

export function p(frame: number, from: number, to: number, output: [number, number] = [0, 1], easing = Easing.out(Easing.cubic)) {
  return interpolate(frame, [from, to], output, { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

/** Reveals text word by word, like a streamed answer. */
export function stream(text: string, progress: number) {
  const words = text.split(' ')
  return words.slice(0, Math.ceil(words.length * progress)).join(' ')
}

export function pop(frame: number, at: number) {
  return spring({ config: { damping: 18, stiffness: 190 }, fps: 30, frame: frame - at })
}

export function StatusBar() {
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

export function TopBar() {
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

/** Every user message of the conversation: typed in the composer, then sent. */
export const MESSAGES = [
  { lines: USER_MESSAGE, send: T.send, typing: T.typing },
  { lines: ['Agora me mostra meus clientes', 'e atualiza o nome e o e-mail', 'do Cliente Exemplo'], send: T.u2.send, typing: T.u2.typing },
  { lines: ['Cadastra também a Nova', 'Empresa Ltda., de Recife'], send: T.u3.send, typing: T.u3.typing },
  { lines: ['Agora exclui o Cliente', 'Exemplo Ltda.'], send: T.u4.send, typing: T.u4.typing },
  { lines: ['E como está o financeiro', 'nos últimos 30 dias?'], send: T.u5.send, typing: T.u5.typing },
  { lines: ['Agora emite as notas fiscais', 'das vendas de hoje'], send: T.u6.send, typing: T.u6.typing },
  { lines: ['Concilia o extrato do banco', 'com os lançamentos'], send: T.u7.send, typing: T.u7.typing },
]

export function Composer({ frame, messages = MESSAGES }: { frame: number; messages?: typeof MESSAGES }) {
  const active = messages.find((m) => frame >= m.typing[0] && frame < m.send)
  const typedLines = active ? active.lines.join(' ') : ''
  const text = active ? typedLines.slice(0, Math.floor(typedLines.length * p(frame, active.typing[0], active.typing[1], [0, 1], Easing.linear))) : ''
  const hasText = text.length > 0
  const pressed = messages.some((m) => frame >= m.send - 2 && frame < m.send + 2)

  return (
    <div style={{ alignItems: 'center', background: '#f2f2f2', borderRadius: 48, display: 'flex', gap: 22, left: 68, minHeight: 94, padding: '0 16px 0 30px', position: 'absolute', right: 68, top: 1628 }}>
      <Plus color={TEXT} size={42} strokeWidth={2} style={{ '--icon-size': '42px', '--icon-stroke': 2 } as CSSProperties} />
      <span style={{ color: hasText ? TEXT : '#8e8e8e', flex: 1, fontSize: 31, overflow: 'hidden', whiteSpace: 'nowrap', direction: hasText ? 'rtl' : 'ltr', textAlign: 'left' }}>
        <bdi>{hasText ? text : 'Perguntar ao ChatGPT'}</bdi>
      </span>
      {hasText ? null : <Mic color={TEXT} size={38} strokeWidth={2} style={{ marginRight: 12, '--icon-size': '38px', '--icon-stroke': 2 } as CSSProperties} />}
      <span style={{ alignItems: 'center', background: TEXT, borderRadius: 99, display: 'flex', flex: 'none', height: 64, justifyContent: 'center', transform: `scale(${pressed ? 0.88 : 1})`, width: 64 }}>
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
export const iv = (size: number, stroke: number, extra: CSSProperties = {}) => ({ ...extra, '--icon-size': `${size}px`, '--icon-stroke': stroke }) as CSSProperties

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
const DETAIL_H = 1872
/** Extra scroll that brings the financial summary into view. */
const DETAIL_SCROLL = 470
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
        <div style={{ marginTop: 16 }}>
          {[
            ['Subtotal', 'R$ 100,00'],
            ['Descontos', 'R$ 0,00'],
            ['Forma de pagamento', 'Pix'],
            ['Status do pagamento', 'Não cobrado'],
          ].map(([label, value]) => (
            <div key={label} style={{ alignItems: 'center', display: 'flex', height: 64, justifyContent: 'space-between' }}>
              <span style={{ color: MUTED, fontSize: 29 }}>{label}</span>
              <span style={{ color: TEXT, fontSize: 29, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ alignItems: 'center', borderTop: `2px solid ${LINE}`, display: 'flex', height: 82, justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ color: TEXT, fontSize: 31, fontWeight: 650 }}>Total</span>
          <span style={{ color: TEXT, fontSize: 34, fontWeight: 700, letterSpacing: '-0.01em' }}>R$ 100,00</span>
        </div>
        <div style={{ alignItems: 'center', border: '2px solid #d9d9d9', borderRadius: 36, color: '#3d3d3d', display: 'flex', fontSize: 26, fontWeight: 500, gap: 12, height: 70, justifyContent: 'center', marginTop: 22 }}>
          <ArrowLeft color="#3d3d3d" size={26} strokeWidth={2} style={iv(26, 2)} /> Voltar às vendas
        </div>
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

// ─── Expense classification (prints: list "Em lote" → total → confirm → done) ─────────────────

const EXPENSES = [
  { category: 'Software e assinaturas', date: '18/10/2026', name: 'Google Workspace', value: 'R$ 129,90' },
  { category: 'Marketing e publicidade', date: '17/10/2026', name: 'Meta Ads', value: 'R$ 850,00' },
  { category: 'Infraestrutura de TI', date: '16/10/2026', name: 'AWS Cloud', value: 'R$ 420,00' },
  { category: 'Aluguel e ocupação', date: '15/10/2026', name: 'Aluguel escritório', value: 'R$ 1.800,00' },
]

/** Document position (before scrolling) of the classification card and the text above it. */
export const EXP_TEXT_TOP = 2580
export const EXP_CARD_TOP = 2710
export const EXP_H = { done: 747, list: 1622, review: 915 }
/** Scroll position that shows the total + "Revisar classificação" above the composer. */
const EXP_FOOTER_SCROLL = EXP_CARD_TOP + 1526 - 1480
const EXP_BLOCK = 284

function TapRipple({ at, frame, x, y }: { at: number; frame: number; x: number; y: number }) {
  if (frame < at || frame > at + 16) return null
  const r = p(frame, at, at + 14)
  const size = 40 + r * 120
  return <div style={{ background: 'rgba(0,0,0,0.16)', borderRadius: 99, height: size, left: x - size / 2, opacity: 1 - r * 0.75, pointerEvents: 'none', position: 'absolute', top: y - size / 2, width: size, zIndex: 5 }} />
}

function CheckDot() {
  return (
    <span style={{ alignItems: 'center', background: TEXT, borderRadius: 99, display: 'flex', flex: 'none', height: 42, justifyContent: 'center', width: 42 }}>
      <Check color="#fff" size={26} strokeWidth={3} style={iv(26, 3)} />
    </span>
  )
}

function CardHeader({ icon, subtitle, title }: { icon: ReactNode; subtitle: string; title: string }) {
  return (
    <div style={{ alignItems: 'center', display: 'flex', height: 158, justifyContent: 'space-between', paddingBottom: 16 }}>
      <div>
        <span style={{ color: TEXT, display: 'block', fontSize: 38, fontWeight: 650, letterSpacing: '-0.01em', lineHeight: '46px' }}>{title}</span>
        <span style={{ color: MUTED, display: 'block', fontSize: 26, lineHeight: '32px', marginTop: 8 }}>{subtitle}</span>
      </div>
      {icon}
    </div>
  )
}

const TagsTile = (
  <IconTile size={84}>
    <Tags color="#4a4a4a" size={36} strokeWidth={2} style={iv(36, 2)} />
  </IconTile>
)

export function ExpensesCard({ frame }: { frame: number }) {
  const card = pop(frame, T.expCard)
  if (frame < T.expCard) return null
  const at = (delay: number): CSSProperties => {
    const s = pop(frame, delay)
    return { opacity: frame < delay ? 0 : s, transform: `translateY(${(1 - s) * 16}px)` }
  }
  const toReview = p(frame, T.review, T.review + 22, [0, 1], Easing.inOut(Easing.cubic))
  const toDone = p(frame, T.done, T.done + 22, [0, 1], Easing.inOut(Easing.cubic))
  const height = EXP_H.list + (EXP_H.review - EXP_H.list) * toReview + (EXP_H.done - EXP_H.review) * toDone
  const phase = frame < T.review ? 'list' : frame < T.done ? 'review' : 'done'
  const listOut = 1 - p(frame, T.review, T.review + 8)
  const reviewOut = 1 - p(frame, T.done, T.done + 8)

  return (
    <div style={{ background: '#fff', border: `2px solid ${LINE}`, borderRadius: 40, height, left: 33, opacity: card, overflow: 'hidden', position: 'absolute', right: 33, top: EXP_CARD_TOP, transform: `translateY(${(1 - card) * 30}px)` }}>
      {/* 1 · suggested classifications */}
      {phase === 'list' || listOut > 0 ? (
        <div style={{ inset: 0, opacity: phase === 'list' ? 1 : listOut, padding: '0 22px', position: 'absolute' }}>
          <CardHeader icon={TagsTile} subtitle="Revise as classificações sugeridas" title="Classificar despesas" />
          <div style={{ background: LINE, height: 2 }} />
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 46 }}>
            <span style={{ color: TEXT, fontSize: 33, fontWeight: 650, letterSpacing: '-0.01em', lineHeight: '40px' }}>Movimentações encontradas</span>
            <span style={{ background: '#efefef', borderRadius: 99, color: '#3d3d3d', fontSize: 23, fontWeight: 500, padding: '6px 15px' }}>4 despesas</span>
          </div>
          <div style={{ marginTop: -14 }}>
            {EXPENSES.map((exp, i) => {
              const rowAt = T.expRows[i]
              const checked = pop(frame, rowAt + 8)
              const filled = p(frame, rowAt + 10, rowAt + 22, [0, 1], Easing.linear)
              return (
                <div key={exp.name} style={{ borderBottom: `2px solid ${LINE}`, height: EXP_BLOCK, paddingTop: 40, ...at(rowAt) }}>
                  <div style={{ alignItems: 'center', display: 'flex', gap: 22, height: 52 }}>
                    <span style={{ opacity: frame < rowAt + 8 ? 0.15 : 1, transform: `scale(${frame < rowAt + 8 ? 1 : checked})` }}>
                      <CheckDot />
                    </span>
                    <span style={{ color: TEXT, flex: 1, fontSize: 30, fontWeight: 500 }}>{exp.name}</span>
                    <span style={{ color: TEXT, fontSize: 30, fontWeight: 500 }}>{exp.value}</span>
                  </div>
                  <span style={{ color: MUTED, display: 'block', fontSize: 25, lineHeight: '30px', marginLeft: 64, marginTop: 4 }}>{exp.date}</span>
                  <span style={{ color: MUTED, display: 'block', fontSize: 28, lineHeight: '34px', marginLeft: 56, marginTop: 20 }}>Categoria sugerida</span>
                  <div style={{ alignItems: 'center', border: '2px solid #d9d9d9', borderRadius: 14, display: 'flex', height: 62, justifyContent: 'space-between', marginLeft: 56, marginTop: 10, padding: '0 22px' }}>
                    <span style={{ color: TEXT, fontSize: 27, fontWeight: 500 }}>{exp.category.slice(0, Math.ceil(exp.category.length * filled))}</span>
                    <ChevronDown color="#6b6b6b" size={30} strokeWidth={2} style={iv(30, 2)} />
                  </div>
                </div>
              )
            })}
          </div>
          <div style={at(T.expFooter)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 50 }}>
              <span style={{ color: MUTED, fontSize: 24 }}>Despesas selecionadas</span>
              <span style={{ color: MUTED, fontSize: 24 }}>Valor total</span>
            </div>
            <div style={{ alignItems: 'baseline', display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ color: TEXT, fontSize: 28, fontWeight: 500 }}>4 despesas</span>
              <span style={{ color: TEXT, fontSize: 38, fontWeight: 700, letterSpacing: '-0.01em' }}>R$ 3.199,90</span>
            </div>
            <div style={{ alignItems: 'center', background: '#1a1a1a', borderRadius: 36, color: '#fff', display: 'flex', fontSize: 27, fontWeight: 500, gap: 14, height: 72, justifyContent: 'center', marginTop: 24, transform: `scale(${frame >= T.tapReview && frame < T.tapReview + 6 ? 0.97 : 1})` }}>
              <CheckCheck color="#fff" size={32} strokeWidth={2.2} style={iv(32, 2.2)} /> Revisar classificação
            </div>
          </div>
          <TapRipple at={T.tapReview} frame={frame} x={380} y={1562} />
        </div>
      ) : null}

      {/* 2 · confirm */}
      {phase !== 'list' && (phase === 'review' || reviewOut > 0) ? (
        <div style={{ inset: 0, opacity: phase === 'review' ? p(frame, T.review + 4, T.review + 14) : reviewOut, padding: '0 22px', position: 'absolute' }}>
          <CardHeader icon={<ClipboardCheck color="#4a4a4a" size={36} strokeWidth={2} style={iv(36, 2, { marginRight: 18 })} />} subtitle="Confira antes de salvar" title="Confirmar classificação" />
          <div style={{ background: LINE, height: 2 }} />
          {EXPENSES.map((exp, i) => (
            <div key={exp.name} style={{ borderBottom: i < EXPENSES.length - 1 ? `2px solid ${LINE}` : 'none', height: 148, paddingTop: 42, ...at(T.confirmRows + i * 6) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: TEXT, fontSize: 30, fontWeight: 500 }}>{exp.name}</span>
                <span style={{ color: TEXT, fontSize: 30, fontWeight: 500 }}>{exp.value}</span>
              </div>
              <span style={{ color: MUTED, display: 'block', fontSize: 25, marginTop: 10 }}>{exp.category}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 18, marginTop: -6, ...at(T.confirmButtons) }}>
            <span style={{ alignItems: 'center', border: '2px solid #d9d9d9', borderRadius: 36, color: '#3d3d3d', display: 'flex', flex: 1, fontSize: 27, fontWeight: 500, height: 70, justifyContent: 'center' }}>Voltar</span>
            <span style={{ alignItems: 'center', background: '#1a1a1a', borderRadius: 36, color: '#fff', display: 'flex', flex: 1, fontSize: 27, fontWeight: 500, gap: 14, height: 70, justifyContent: 'center', transform: `scale(${frame >= T.tapConfirm && frame < T.tapConfirm + 6 ? 0.96 : 1})` }}>
              <Check color="#fff" size={30} strokeWidth={2.4} style={iv(30, 2.4)} /> Confirmar
            </span>
          </div>
          <span style={{ color: MUTED, display: 'block', fontSize: 24, marginTop: 30, textAlign: 'center', ...at(T.confirmButtons + 6) }}>Protótipo visual · Nenhum lançamento real será alterado</span>
          <TapRipple at={T.tapConfirm} frame={frame} x={555} y={784} />
        </div>
      ) : null}

      {/* 3 · done */}
      {phase === 'done' ? (
        <div style={{ inset: 0, opacity: p(frame, T.done + 4, T.done + 14), padding: '0 22px', position: 'absolute' }}>
          <CardHeader icon={TagsTile} subtitle="Revise as classificações sugeridas" title="Classificar despesas" />
          <div style={{ background: LINE, height: 2 }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 66 }}>
            <svg height={60} viewBox="0 0 60 60" width={60}>
              <circle cx={30} cy={30} fill="none" pathLength={1} r={26} stroke="#1a7f37" strokeDasharray={1} strokeDashoffset={1 - p(frame, T.done + 8, T.done + 22)} strokeWidth={4.5} transform="rotate(-90 30 30)" />
              <path d="M19 31 l7 7 l15 -16" fill="none" pathLength={1} stroke="#1a7f37" strokeDasharray={1} strokeDashoffset={1 - p(frame, T.done + 18, T.done + 28)} strokeLinecap="round" strokeLinejoin="round" strokeWidth={4.5} />
            </svg>
          </div>
          <div style={{ textAlign: 'center', ...at(T.done + 18) }}>
            <span style={{ color: TEXT, display: 'block', fontSize: 36, fontWeight: 650, letterSpacing: '-0.01em', marginTop: 28 }}>Classificação concluída</span>
            <span style={{ color: MUTED, display: 'block', fontSize: 26, marginTop: 18 }}>4 despesas classificadas nesta simulação.</span>
          </div>
          <div style={{ background: '#f2f2f2', borderRadius: 24, marginTop: 48, padding: '8px 24px', ...at(T.done + 26) }}>
            {[
              ['Despesas processadas', '4'],
              ['Valor classificado', 'R$ 3.199,90'],
            ].map(([label, value]) => (
              <div key={label} style={{ alignItems: 'center', display: 'flex', height: 64, justifyContent: 'space-between' }}>
                <span style={{ color: MUTED, fontSize: 27 }}>{label}</span>
                <span style={{ color: TEXT, fontSize: 30, fontWeight: 650 }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ alignItems: 'center', border: '2px solid #d9d9d9', borderRadius: 36, color: '#3d3d3d', display: 'flex', fontSize: 26, fontWeight: 500, gap: 14, height: 70, justifyContent: 'center', marginTop: 26, ...at(T.done + 32) }}>
            <ArrowLeft color="#3d3d3d" size={26} strokeWidth={2} style={iv(26, 2)} /> Voltar às movimentações
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ─── Clients CRUD (list → update → done, create → done, delete) ────────────────────────────────

const GREEN = '#1a7f37'

/** Document positions (before scrolling) of everything that follows the expense card. */
const CRUD = {
  a2: 3790,
  a2b: 4850,
  a3: 6090,
  a4: 7270,
  clients: 3870,
  create: 6170,
  del: 7410,
  u2: 3530,
  u3: 5880,
  u4: 7060,
  update: 4990,
}

const CLIENTS = [
  { city: 'Recife', id: 'CLI-001', name: 'Cliente Exemplo Ltda.', type: 'Pessoa jurídica' },
  { city: 'São Paulo', id: 'CLI-002', name: 'QA-OTTO Cliente Cenário', type: 'Pessoa jurídica' },
  { city: 'Olinda', id: 'CLI-003', name: 'Maria Souza', type: 'Pessoa física' },
]

export function UserMessage({ at, frame, lines, top }: { at: number; frame: number; lines: string[]; top: number }) {
  const s = pop(frame, at)
  if (frame < at) return null
  return (
    <div style={{ background: BUBBLE, borderRadius: 38, color: TEXT, fontSize: 31, lineHeight: '50px', maxWidth: 620, opacity: s, padding: '24px 34px 22px 32px', position: 'absolute', right: 33, top, transform: `translateY(${(1 - s) * 40}px) scale(${0.96 + s * 0.04})`, transformOrigin: 'right bottom' }}>
      {lines.map((line, i) => (
        <div key={i} style={{ whiteSpace: 'nowrap' }}>{line}</div>
      ))}
    </div>
  )
}

export function AssistantText({ frame, text, top, window: [from, to] }: { frame: number; text: string; top: number; window: number[] }) {
  if (frame < from) return null
  return <p style={{ color: TEXT, fontSize: 32, left: 33, lineHeight: '48px', margin: 0, position: 'absolute', right: 40, top }}>{stream(text, p(frame, from, to, [0, 1], Easing.linear))}</p>
}

function Field({ frame, label, mt, placeholder, typeAt, value }: { frame: number; label?: string; mt: number; placeholder?: string; typeAt?: [number, number]; value: string }) {
  const shown = typeAt ? value.slice(0, Math.floor(value.length * p(frame, typeAt[0], typeAt[1], [0, 1], Easing.linear))) : value
  const typing = typeAt && frame >= typeAt[0] && frame < typeAt[1] + 6
  return (
    <div style={{ marginTop: mt }}>
      {label ? <span style={{ color: '#5c5c5c', display: 'block', fontSize: 28, fontWeight: 500, lineHeight: '34px', marginBottom: 18 }}>{label}</span> : null}
      <div style={{ alignItems: 'center', border: `2px solid ${typing ? '#9a9a9a' : '#d6d6d6'}`, borderRadius: 39, display: 'flex', height: 78, padding: '0 36px' }}>
        <span style={{ color: shown ? TEXT : '#9a9a9a', fontSize: 30 }}>{shown || placeholder}</span>
        {typing && frame % 16 < 9 ? <span style={{ background: TEXT, height: 34, marginLeft: 2, width: 3 }} /> : null}
      </div>
    </div>
  )
}

function PrimaryButton({ children, icon, mt, pressedAt, frame, disabled }: { children: ReactNode; disabled?: boolean; frame: number; icon: ReactNode; mt: number; pressedAt?: number }) {
  const pressed = pressedAt !== undefined && frame >= pressedAt && frame < pressedAt + 6
  return (
    <div style={{ alignItems: 'center', background: disabled ? '#efefef' : '#1a1a1a', borderRadius: 36, color: disabled ? '#9a9a9a' : '#fff', display: 'flex', fontSize: 28, fontWeight: 500, gap: 14, height: 72, justifyContent: 'center', marginTop: mt, transform: `scale(${pressed ? 0.97 : 1})` }}>
      {icon}
      {children}
    </div>
  )
}

function DoneView({ back, frame, heading, icon, rows, start, subtitle, sub, title }: { back: string; frame: number; heading: string; icon: ReactNode; rows: [string, ReactNode][]; start: number; sub: string; subtitle: string; title: string }) {
  const at = (delay: number): CSSProperties => {
    const s = pop(frame, start + delay)
    return { opacity: frame < start + delay ? 0 : s, transform: `translateY(${(1 - s) * 16}px)` }
  }
  return (
    <div style={{ inset: 0, opacity: p(frame, start + 4, start + 14), padding: '0 31px', position: 'absolute' }}>
      <CardHeader icon={icon} subtitle={subtitle} title={title} />
      <div style={{ background: LINE, height: 2 }} />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 74 }}>
        <svg height={60} viewBox="0 0 60 60" width={60}>
          <circle cx={30} cy={30} fill="none" pathLength={1} r={26} stroke={GREEN} strokeDasharray={1} strokeDashoffset={1 - p(frame, start + 8, start + 22)} strokeWidth={4.5} transform="rotate(-90 30 30)" />
          <path d="M19 31 l7 7 l15 -16" fill="none" pathLength={1} stroke={GREEN} strokeDasharray={1} strokeDashoffset={1 - p(frame, start + 18, start + 28)} strokeLinecap="round" strokeLinejoin="round" strokeWidth={4.5} />
        </svg>
      </div>
      <div style={{ textAlign: 'center', ...at(18) }}>
        <span style={{ color: TEXT, display: 'block', fontSize: 37, fontWeight: 650, letterSpacing: '-0.01em', marginTop: 32 }}>{heading}</span>
        <span style={{ color: MUTED, display: 'block', fontSize: 26, marginTop: 26 }}>{sub}</span>
      </div>
      <div style={{ background: '#f2f2f2', borderRadius: 24, marginTop: 38, padding: '16px 24px', ...at(26) }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ alignItems: 'center', display: 'flex', height: 56, justifyContent: 'space-between' }}>
            <span style={{ color: MUTED, fontSize: 27 }}>{label}</span>
            <span style={{ alignItems: 'center', color: TEXT, display: 'flex', fontSize: 28, fontWeight: 500, gap: 10 }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ alignItems: 'center', border: '2px solid #d9d9d9', borderRadius: 36, color: '#3d3d3d', display: 'flex', fontSize: 27, fontWeight: 500, gap: 14, height: 70, justifyContent: 'center', marginTop: 26, ...at(32) }}>
        <ArrowLeft color="#3d3d3d" size={26} strokeWidth={2} style={iv(26, 2)} /> {back}
      </div>
    </div>
  )
}

const DONE_OK = (
  <>
    <CircleCheck color={GREEN} size={24} strokeWidth={2.2} style={iv(24, 2.2)} /> Concluído
  </>
)

function CardShell({ children, frame, height, start, top }: { children: ReactNode; frame: number; height: number; start: number; top: number }) {
  const card = pop(frame, start)
  if (frame < start) return null
  return (
    <div style={{ background: '#fff', border: `2px solid ${LINE}`, borderRadius: 40, height, left: 33, opacity: card, overflow: 'hidden', position: 'absolute', right: 33, top, transform: `translateY(${(1 - card) * 30}px)` }}>
      {children}
    </div>
  )
}

function ClientsCard({ frame }: { frame: number }) {
  const fade = (at: number): CSSProperties => {
    const s = pop(frame, at)
    return { opacity: frame < at ? 0 : s, transform: `translateY(${(1 - s) * 18}px)` }
  }
  return (
    <CardShell frame={frame} height={924} start={T.clientsCard} top={CRUD.clients}>
      <div style={{ padding: '0 31px 30px' }}>
        <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', paddingTop: 32 }}>
          <div>
            <span style={{ color: TEXT, display: 'block', fontSize: 41, fontWeight: 650, letterSpacing: '-0.01em', lineHeight: '48px' }}>Clientes</span>
            <span style={{ color: MUTED, display: 'block', fontSize: 28, lineHeight: '34px', marginTop: 8 }}>3 clientes encontrados</span>
          </div>
          <Users color="#5b5b5b" size={32} strokeWidth={2} style={iv(32, 2, { marginTop: 32 })} />
        </div>
        <div style={{ marginTop: 24 }}>
          {CLIENTS.map((c, i) => (
            <div key={c.id} style={{ alignItems: 'center', borderBottom: `2px solid ${LINE}`, display: 'flex', gap: 26, height: 216, ...fade(T.clientRows + i * 12) }}>
              <IconTile>
                <User color="#5b5b5b" size={32} strokeWidth={2} style={iv(32, 2)} />
              </IconTile>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: TEXT, display: 'block', fontSize: 33, fontWeight: 650, letterSpacing: '-0.01em' }}>{c.name}</span>
                <span style={{ color: MUTED, display: 'block', fontSize: 28, marginTop: 6 }}>{c.id} · {c.type}</span>
                <span style={{ color: MUTED, display: 'block', fontSize: 27, marginTop: 6 }}>{c.city}</span>
              </div>
              <span style={{ background: '#e6f4ea', borderRadius: 99, color: GREEN, fontSize: 26, fontWeight: 500, marginBottom: 70, padding: '8px 17px' }}>Ativo</span>
            </div>
          ))}
        </div>
        <div style={{ alignItems: 'center', display: 'flex', height: 60, justifyContent: 'space-between', marginTop: 40, ...fade(T.clientRows + 36) }}>
          <span style={{ color: MUTED, fontSize: 28 }}>1–3 de 3 clientes</span>
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
    </CardShell>
  )
}

function ClientBox({ id, name }: { id: string; name: string }) {
  return (
    <div style={{ alignItems: 'center', background: '#f2f2f2', borderRadius: 28, display: 'flex', gap: 18, height: 129, marginTop: 41, padding: '0 26px' }}>
      <User color="#5b5b5b" size={30} strokeWidth={2} style={iv(30, 2)} />
      <div>
        <span style={{ color: TEXT, display: 'block', fontSize: 29, fontWeight: 500, lineHeight: '36px' }}>{name}</span>
        <span style={{ color: MUTED, display: 'block', fontSize: 25, lineHeight: '30px', marginTop: 8 }}>{id}</span>
      </div>
    </div>
  )
}

const editTile = (
  <IconTile size={88}>
    <SquarePen color="#4a4a4a" size={34} strokeWidth={2} style={iv(34, 2)} />
  </IconTile>
)

function UpdateClientCard({ frame }: { frame: number }) {
  const toDone = p(frame, T.updDone, T.updDone + 22, [0, 1], Easing.inOut(Easing.cubic))
  const formOut = 1 - p(frame, T.updDone, T.updDone + 8)
  return (
    <CardShell frame={frame} height={955 + (820 - 955) * toDone} start={T.updCard} top={CRUD.update}>
      {formOut > 0 ? (
        <div style={{ inset: 0, opacity: formOut, padding: '0 31px', position: 'absolute' }}>
          <CardHeader icon={editTile} subtitle="Altere os dados do cliente" title="Atualizar cliente" />
          <div style={{ background: LINE, height: 2 }} />
          <ClientBox id="ID de demonstração: CLI-001" name="Cliente Exemplo Ltda." />
          <Field frame={frame} label="Nome / Razão social" mt={30} typeAt={T.updName} value="Cliente Exemplo Brasil Ltda." />
          <Field frame={frame} label="E-mail" mt={28} typeAt={T.updEmail} value="financeiro@cliente.example" />
          <Field frame={frame} label="Cidade" mt={28} value="Recife" />
          <PrimaryButton frame={frame} icon={<ClipboardCheck color="#fff" size={32} strokeWidth={2} style={iv(32, 2)} />} mt={25} pressedAt={T.updTap}>Revisar alterações</PrimaryButton>
          <TapRipple at={T.updTap} frame={frame} x={380} y={867} />
        </div>
      ) : null}
      {frame >= T.updDone ? (
        <DoneView
          back="Voltar ao formulário"
          frame={frame}
          heading="Cliente atualizado com sucesso"
          icon={editTile}
          rows={[
            ['Cliente', 'Cliente Exemplo Brasil Ltda.'],
            ['Operação', 'Atualização'],
            ['Resultado', DONE_OK],
          ]}
          start={T.updDone}
          sub="As alterações foram aplicadas nesta simulação."
          subtitle="Operação demonstrativa concluída"
          title="Cliente atualizado"
        />
      ) : null}
    </CardShell>
  )
}

const addTile = (
  <IconTile size={88}>
    <UserPlus color="#4a4a4a" size={34} strokeWidth={2} style={iv(34, 2)} />
  </IconTile>
)

function Radio({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
      <span style={{ alignItems: 'center', background: checked ? '#1a1a1a' : '#fff', border: checked ? 'none' : '2px solid #cfcfcf', borderRadius: 99, display: 'flex', height: 40, justifyContent: 'center', width: 40 }}>
        {checked ? <span style={{ background: '#fff', borderRadius: 99, height: 12, width: 12 }} /> : null}
      </span>
      <span style={{ color: TEXT, fontSize: 31 }}>{label}</span>
    </span>
  )
}

function CreateClientCard({ frame }: { frame: number }) {
  const toDone = p(frame, T.createDone, T.createDone + 22, [0, 1], Easing.inOut(Easing.cubic))
  const formOut = 1 - p(frame, T.createDone, T.createDone + 8)
  return (
    <CardShell frame={frame} height={928 + (820 - 928) * toDone} start={T.createCard} top={CRUD.create}>
      {formOut > 0 ? (
        <div style={{ inset: 0, opacity: formOut, padding: '0 31px', position: 'absolute' }}>
          <CardHeader icon={addTile} subtitle="Preencha os dados do novo cliente" title="Criar cliente" />
          <div style={{ background: LINE, height: 2 }} />
          <span style={{ color: '#5c5c5c', display: 'block', fontSize: 28, fontWeight: 500, lineHeight: '34px', marginTop: 46 }}>Tipo de pessoa</span>
          <div style={{ display: 'flex', gap: 46, marginTop: 26 }}>
            <Radio checked={frame >= T.createCard + 10} label="Jurídica" />
            <Radio checked={false} label="Física" />
          </div>
          <Field frame={frame} label="Razão social / Nome" mt={30} typeAt={T.createName} value="Nova Empresa Ltda." />
          <Field frame={frame} label="E-mail" mt={28} typeAt={T.createEmail} value="contato@novaempresa.example" />
          <Field frame={frame} label="Cidade" mt={28} typeAt={T.createCity} value="Recife" />
          <PrimaryButton frame={frame} icon={<ClipboardCheck color="#fff" size={32} strokeWidth={2} style={iv(32, 2)} />} mt={25} pressedAt={T.createTap}>Revisar cadastro</PrimaryButton>
          <TapRipple at={T.createTap} frame={frame} x={380} y={843} />
        </div>
      ) : null}
      {frame >= T.createDone ? (
        <DoneView
          back="Voltar ao formulário"
          frame={frame}
          heading="Cliente criado com sucesso"
          icon={addTile}
          rows={[
            ['Cliente', 'Nova Empresa Ltda.'],
            ['Operação', 'Cadastro'],
            ['Resultado', DONE_OK],
          ]}
          start={T.createDone}
          sub="O cadastro foi registrado nesta simulação."
          subtitle="Operação demonstrativa concluída"
          title="Cliente criado"
        />
      ) : null}
    </CardShell>
  )
}

function DeleteClientCard({ frame }: { frame: number }) {
  const checked = frame >= T.delCheck
  const typedDone = frame >= T.delType[1]
  const enabled = checked && typedDone
  const deleteTile = (
    <IconTile size={88}>
      <Trash2 color="#4a4a4a" size={34} strokeWidth={2} style={iv(34, 2)} />
    </IconTile>
  )
  return (
    <CardShell frame={frame} height={1100} start={T.delCard} top={CRUD.del}>
      <div style={{ padding: '0 31px' }}>
        <CardHeader icon={deleteTile} subtitle="Revise o registro antes de excluir" title="Excluir cliente" />
        <div style={{ background: LINE, height: 2 }} />
        <div style={{ display: 'flex', gap: 18, marginTop: 42 }}>
          <TriangleAlert color="#8b1e1e" size={34} strokeWidth={2.2} style={iv(34, 2.2, { flex: 'none', marginTop: 4 })} />
          <div>
            <span style={{ color: TEXT, display: 'block', fontSize: 31, fontWeight: 650, lineHeight: '40px' }}>Atenção: ação destrutiva</span>
            <span style={{ color: MUTED, display: 'block', fontSize: 27, lineHeight: '40px', marginTop: 10 }}>A exclusão pode ser irreversível. No sistema real, é necessário verificar se existem registros financeiros ou fiscais vinculados.</span>
          </div>
        </div>
        <div style={{ background: '#f2f2f2', borderRadius: 24, marginTop: 30, padding: '24px 24px 12px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
            <User color="#5b5b5b" size={30} strokeWidth={2} style={iv(30, 2)} />
            <div>
              <span style={{ color: TEXT, display: 'block', fontSize: 29, fontWeight: 600, lineHeight: '36px' }}>Cliente Exemplo Ltda.</span>
              <span style={{ color: MUTED, display: 'block', fontSize: 24, lineHeight: '30px', marginTop: 10 }}>Cliente CLI-001 · Pessoa jurídica</span>
            </div>
          </div>
          <div style={{ background: '#e2e2e2', height: 2, marginTop: 24 }} />
          {[
            ['E-mail', 'contato@cliente.example'],
            ['Cidade', 'Recife'],
          ].map(([label, value]) => (
            <div key={label} style={{ alignItems: 'center', display: 'flex', height: 56, justifyContent: 'space-between' }}>
              <span style={{ color: MUTED, fontSize: 27 }}>{label}</span>
              <span style={{ color: TEXT, fontSize: 28 }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ alignItems: 'flex-start', display: 'flex', gap: 22, marginTop: 30, position: 'relative' }}>
          <span style={{ alignItems: 'center', background: checked ? '#1a1a1a' : '#fff', border: checked ? 'none' : '2px solid #cfcfcf', borderRadius: 99, display: 'flex', flex: 'none', height: 40, justifyContent: 'center', marginTop: 4, transform: `scale(${checked ? pop(frame, T.delCheck) : 1})`, width: 40 }}>
            {checked ? <Check color="#fff" size={24} strokeWidth={3} style={iv(24, 3)} /> : null}
          </span>
          <span style={{ color: TEXT, fontSize: 29, lineHeight: '40px' }}>Entendo que estou solicitando a exclusão deste cliente.</span>
          <TapRipple at={T.delCheck - 2} frame={frame} x={24} y={24} />
        </div>
        <span style={{ color: '#5c5c5c', display: 'block', fontSize: 28, fontWeight: 500, lineHeight: '34px', marginTop: 30 }}>Digite EXCLUIR para continuar</span>
        <Field frame={frame} mt={18} placeholder="EXCLUIR" typeAt={T.delType} value="EXCLUIR" />
        <div style={{ alignItems: 'center', background: enabled ? '#b42318' : '#efefef', borderRadius: 36, color: enabled ? '#fff' : '#9a9a9a', display: 'flex', fontSize: 28, fontWeight: 500, gap: 14, height: 72, justifyContent: 'center', marginTop: 25, transition: 'none' }}>
          <Trash2 color={enabled ? '#fff' : '#9a9a9a'} size={30} strokeWidth={2} style={iv(30, 2)} /> Revisar exclusão
        </div>
      </div>
    </CardShell>
  )
}

// ─── Financial overview ("Visão financeira"): KPIs count up, period switches 30 → 7 days, alerts ───

export const FIN = { a5: 8790, card: 8930, u5: 8580 }
export const FIN_H = 2477

const CHART_IN = '#7aa8f2'
const CHART_OUT = '#e09868'
/** [30 days → weeks, 7 days → days]; sums match the KPI tiles. */
const CHART = [
  [
    { in: 8900, label: 'Sem 1', out: 4200 },
    { in: 10400, label: 'Sem 2', out: 5100 },
    { in: 8300, label: 'Sem 3', out: 5150 },
    { in: 10820, label: 'Sem 4', out: 5180 },
  ],
  [
    { in: 1200, label: 'Seg', out: 620 },
    { in: 1650, label: 'Ter', out: 880 },
    { in: 980, label: 'Qua', out: 540 },
    { in: 2100, label: 'Qui', out: 1150 },
    { in: 1450, label: 'Sex', out: 760 },
    { in: 1760, label: 'Sáb', out: 890 },
    { in: 700, label: 'Dom', out: 370 },
  ],
]
const CHART_MAX = [10820, 2100]
const RED = '#a3262c'

type Kpi = {
  icon: ReactNode
  label: string
  sub: (period: 0 | 1) => ReactNode
  tone?: 'green'
  values: [number, number] // [30 days, 7 days]
}

const brlInt = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`

function Trend({ color, value }: { color: string; value: string }) {
  return (
    <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
      <TrendingUp color={color} size={24} strokeWidth={2.2} style={iv(24, 2.2)} />
      <span style={{ color, fontSize: 27, fontWeight: 500 }}>{value}</span>
      <span style={{ color: MUTED, fontSize: 22 }}>vs. anterior</span>
    </span>
  )
}

const KPIS: Kpi[] = [
  { icon: <Wallet color="#5b5b5b" size={28} strokeWidth={2} style={iv(28, 2)} />, label: 'Saldo disponível', sub: () => 'Saldo atual', values: [64280, 64280] },
  { icon: <ArrowDownLeft color={GREEN} size={26} strokeWidth={2.4} style={iv(26, 2.4)} />, label: 'Entradas', sub: (pd) => <Trend color={GREEN} value={pd === 0 ? '+12,4%' : '+4,1%'} />, tone: 'green', values: [38420, 9840] },
  { icon: <ArrowUpRight color="#5b5b5b" size={26} strokeWidth={2.4} style={iv(26, 2.4)} />, label: 'Saídas', sub: (pd) => <Trend color={RED} value={pd === 0 ? '+8,2%' : '+2,3%'} />, values: [19630, 5210] },
  { icon: <TrendingUp color={GREEN} size={28} strokeWidth={2.2} style={iv(28, 2.2)} />, label: 'Variação do caixa', sub: () => 'Entradas – saídas', tone: 'green', values: [18790, 4630] },
  { icon: <HandCoins color="#5b5b5b" size={28} strokeWidth={2} style={iv(28, 2)} />, label: 'A receber', sub: () => 'Saldo em aberto', values: [12480, 12480] },
  { icon: <CalendarClock color="#5b5b5b" size={28} strokeWidth={2} style={iv(28, 2)} />, label: 'A pagar', sub: () => 'Obrigações abertas', values: [8920, 8920] },
]

const PERIODS = ['Últimos 7 dias', 'Últimos 30 dias', 'Este trimestre']

const ALERTS = [
  { icon: <ClockAlert color={RED} size={32} strokeWidth={2} style={iv(32, 2)} />, sub: 'R$ 3.200 aguardando pagamento', title: 'Recebimentos em atraso' },
  { icon: <CalendarClock color="#5b5b5b" size={32} strokeWidth={2} style={iv(32, 2)} />, sub: 'R$ 8.920 em obrigações abertas', title: 'Contas a pagar pendentes' },
]

export function FinanceCard({ frame, still }: { frame: number; still?: boolean }) {
  // still: no period switch (used by the reel montage)
  const sw = still ? 1e9 : T.finSwitch
  const tapSel = still ? 1e9 : T.finTapSelect
  const tapOpt = still ? 1e9 : T.finTapOption
  const period: 0 | 1 = frame >= sw ? 1 : 0
  const switching = p(frame, sw, sw + 18, [0, 1], Easing.out(Easing.cubic))
  const menuOpen = frame >= tapSel + 4 && frame < sw
  const menu = pop(frame, tapSel + 4)
  const at = (delay: number): CSSProperties => {
    const s = pop(frame, delay)
    return { opacity: frame < delay ? 0 : s, transform: `translateY(${(1 - s) * 16}px)` }
  }

  return (
    <CardShell frame={frame} height={FIN_H} start={T.finCard} top={FIN.card}>
      <div style={{ padding: '0 22px', position: 'relative' }}>
        <div style={{ alignItems: 'center', display: 'flex', height: 150, justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: TEXT, display: 'block', fontSize: 44, fontWeight: 650, letterSpacing: '-0.015em', lineHeight: '52px' }}>Visão financeira</span>
            <span style={{ color: MUTED, display: 'block', fontSize: 30, lineHeight: '36px', marginTop: 8 }}>Otto · Resumo financeiro</span>
          </div>
          <IconTile size={88}>
            <ChartNoAxesCombined color="#3d3d3d" size={38} strokeWidth={2} style={iv(38, 2)} />
          </IconTile>
        </div>

        {/* period selector */}
        <div style={{ alignItems: 'center', border: '2px solid #d6d6d6', borderRadius: 36, display: 'flex', height: 70, justifyContent: 'space-between', marginTop: 1, padding: '0 32px', position: 'relative', transform: `scale(${frame >= tapSel && frame < tapSel + 6 ? 0.98 : 1})` }}>
          <span style={{ color: TEXT, fontSize: 29, fontWeight: 500 }}>{PERIODS[period === 0 ? 1 : 0]}</span>
          <ChevronDown color="#6b6b6b" size={30} strokeWidth={2} style={iv(30, 2, { transform: menuOpen ? 'rotate(180deg)' : 'none' })} />
          <TapRipple at={tapSel} frame={frame} x={380} y={35} />
        </div>

        {/* KPI grid */}
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr', marginTop: 26 }}>
          {KPIS.map((kpi, i) => {
            const appear = T.finTiles + i * 6
            const counted = p(frame, appear + 2, appear + 16, [0, 1], Easing.out(Easing.quad))
            const value = kpi.values[0] * counted + (kpi.values[1] - kpi.values[0]) * switching
            const changes = kpi.values[0] !== kpi.values[1]
            return (
              <div key={kpi.label} style={{ background: '#f2f2f2', borderRadius: 30, height: 229, padding: '30px 24px 0', ...at(appear) }}>
                <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: MUTED, fontSize: 27 }}>{kpi.label}</span>
                  {kpi.icon}
                </div>
                <span style={{ color: kpi.tone === 'green' ? GREEN : TEXT, display: 'block', fontSize: 42, fontVariantNumeric: 'tabular-nums', fontWeight: 650, letterSpacing: '-0.01em', marginTop: 22, opacity: changes && frame >= sw && frame < sw + 6 ? 0.55 : 1 }}>{brlInt(value)}</span>
                <span style={{ color: MUTED, display: 'block', fontSize: 27, marginTop: 20 }}>{kpi.sub(period)}</span>
              </div>
            )
          })}
        </div>

        <div style={{ background: LINE, height: 2, marginTop: 50 }} />

        {/* alerts */}
        <div style={at(T.finAlerts)}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 56 }}>
            <span style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
              <CircleAlert color="#3d3d3d" size={34} strokeWidth={2} style={iv(34, 2)} />
              <span style={{ color: TEXT, fontSize: 38, fontWeight: 650, letterSpacing: '-0.01em' }}>Atenção necessária</span>
            </span>
            <span style={{ color: MUTED, fontSize: 27 }}>2 alertas</span>
          </div>
          <div style={{ border: `2px solid ${LINE}`, borderRadius: 30, marginTop: 28, padding: '0 22px' }}>
            {ALERTS.map((alert, i) => (
              <div key={alert.title} style={{ alignItems: 'center', borderTop: i === 0 ? 'none' : `2px solid ${LINE}`, display: 'flex', gap: 24, height: 160, ...at(T.finAlerts + 8 + i * 8) }}>
                <IconTile size={84}>{alert.icon}</IconTile>
                <div style={{ flex: 1 }}>
                  <span style={{ color: TEXT, display: 'block', fontSize: 30, fontWeight: 500 }}>{alert.title}</span>
                  <span style={{ color: MUTED, display: 'block', fontSize: 27, marginTop: 8 }}>{alert.sub}</span>
                </div>
                <ChevronRight color="#5b5b5b" size={32} strokeWidth={2} style={iv(32, 2)} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: LINE, height: 2, marginTop: 50 }} />

        {/* movement chart: follows the selected period */}
        <div style={at(T.finChart)}>
          <div style={{ display: 'flex', marginTop: 52 }}>
            {['Resumo', 'Fluxo de c...', 'Despesas'].map((tab, i) => (
              <span key={tab} style={{ alignItems: 'center', background: i === 0 ? '#efefef' : 'transparent', borderRadius: 32, color: i === 0 ? TEXT : '#9a9a9a', display: 'flex', flex: 1, fontSize: 29, fontWeight: 500, height: 64, justifyContent: 'center' }}>{tab}</span>
            ))}
          </div>
          <span style={{ color: TEXT, display: 'block', fontSize: 38, fontWeight: 650, letterSpacing: '-0.01em', lineHeight: '46px', marginTop: 32 }}>Movimentação financeira</span>
          <span style={{ color: MUTED, display: 'block', fontSize: 29, lineHeight: '36px', marginTop: 12 }}>Entradas e saídas por período</span>
          <div style={{ alignItems: 'center', display: 'flex', gap: 34, marginTop: 26 }}>
            {[
              ['Entradas', CHART_IN],
              ['Saídas', CHART_OUT],
            ].map(([label, color]) => (
              <span key={label} style={{ alignItems: 'center', color: MUTED, display: 'flex', fontSize: 27, gap: 16 }}>
                <span style={{ background: color, borderRadius: 99, height: 20, width: 20 }} />
                {label}
              </span>
            ))}
          </div>
          <div style={{ height: 420, marginLeft: 49, marginRight: 26, position: 'relative' }}>
            {[96, 224].map((y) => (
              <div key={y} style={{ borderTop: '2px dashed #e2e2e2', left: 0, position: 'absolute', right: 0, top: y }} />
            ))}
            <div style={{ background: '#d9d9d9', bottom: 66, height: 2, left: 0, position: 'absolute', right: 0 }} />
            <div style={{ bottom: 68, display: 'flex', left: 0, position: 'absolute', right: 0, top: 0 }}>
              {CHART[period].map((g, i) => {
                const grow = p(frame, T.finBars + i * 4, T.finBars + i * 4 + 18, [0, 1], Easing.out(Easing.cubic))
                const barW = period === 0 ? 40 : 26
                return (
                  <div key={g.label} style={{ alignItems: 'flex-end', display: 'flex', flex: 1, gap: period === 0 ? 9 : 4, justifyContent: 'center', position: 'relative' }}>
                    <span style={{ background: CHART_IN, borderRadius: '7px 7px 0 0', height: (g.in / CHART_MAX[period]) * 256 * grow, width: barW }} />
                    <span style={{ background: CHART_OUT, borderRadius: '7px 7px 0 0', height: (g.out / CHART_MAX[period]) * 256 * grow, width: barW }} />
                    <span style={{ bottom: -56, color: TEXT, fontSize: 23, left: 0, position: 'absolute', right: 0, textAlign: 'center' }}>{g.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ background: '#f2f2f2', borderRadius: 26, height: 150, marginTop: 16, padding: '24px 24px 0', ...at(T.finBars + 30) }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: TEXT, fontSize: 30, fontWeight: 500 }}>Resultado da movimentação</span>
              <span style={{ color: GREEN, fontSize: 40, fontVariantNumeric: 'tabular-nums', fontWeight: 650, letterSpacing: '-0.01em' }}>{brlInt(KPIS[3].values[period] * p(frame, T.finBars + 30, T.finBars + 46, [0, 1], Easing.out(Easing.quad)))}</span>
            </div>
            <span style={{ color: MUTED, display: 'block', fontSize: 26, marginTop: 18 }}>Entradas menos saídas efetivas no período.</span>
          </div>
        </div>

        {/* period menu */}
        {menuOpen ? (
          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 26, boxShadow: '0 16px 40px rgba(0,0,0,0.14)', left: 22, opacity: menu, padding: '8px 0', position: 'absolute', right: 22, top: 230, transform: `translateY(${(1 - menu) * -12}px)`, zIndex: 4 }}>
            {PERIODS.map((label) => (
              <div key={label} style={{ alignItems: 'center', background: frame >= tapOpt && label === PERIODS[0] ? '#f2f2f2' : 'transparent', display: 'flex', height: 74, justifyContent: 'space-between', padding: '0 30px', position: 'relative' }}>
                <span style={{ color: TEXT, fontSize: 29 }}>{label}</span>
                {label === PERIODS[1] ? <Check color={TEXT} size={28} strokeWidth={2.4} style={iv(28, 2.4)} /> : null}
                {label === PERIODS[0] ? <TapRipple at={tapOpt} frame={frame} x={300} y={37} /> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </CardShell>
  )
}

// ─── Batch NFS-e: list → "Confirmar emissão" → "Emissão concluída" ──────────────────────────────

export const NF = { a6: 11687, card: 11767, u6: 11477 }
export const NF_H = { confirm: 1206, done: 960, list: 1180 }

const NF_SALES = [
  { client: 'Clínica Horizonte Ltda.', id: '#2031', service: 'Consultoria de marketing', value: 'R$ 1.500,00' },
  { client: 'Agência Atlas Ltda.', id: '#2032', service: 'Desenvolvimento de software', value: 'R$ 850,00' },
  { client: 'Marina Oliveira', id: '#2033', service: 'Suporte técnico', value: 'R$ 430,00' },
]

function SummaryBox({ big, mt, rowH, rows }: { big?: boolean; mt: number; rowH?: number; rows: [string, ReactNode][] }) {
  return (
    <div style={{ background: '#f2f2f2', borderRadius: 24, marginTop: mt, padding: '14px 24px' }}>
      {rows.map(([label, value], i) => (
        <div key={label} style={{ alignItems: 'center', display: 'flex', height: rowH ?? (big ? 66 : 64), justifyContent: 'space-between' }}>
          <span style={{ color: MUTED, fontSize: 28 }}>{label}</span>
          <span style={{ alignItems: 'center', color: TEXT, display: 'flex', fontSize: i === 1 && big ? 38 : 31, fontWeight: 650, gap: 10, letterSpacing: '-0.01em' }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

const nfTile = (
  <IconTile size={88}>
    <FileText color="#4a4a4a" size={34} strokeWidth={2} style={iv(34, 2)} />
  </IconTile>
)

/** Demo wording from the prints, or "ad" wording for the reel (real issuance, no demo disclaimers). */
const NF_COPY = {
  ad: { button: 'Emitir notas', confirmNote: 'As notas serão enviadas por e-mail para cada cliente assim que forem autorizadas.', doneNote: 'Número da nota, protocolo, PDF e XML já disponíveis para cada cliente.', doneSub: '3 notas emitidas agora.', doneTitle: 'Notas emitidas com sucesso', doneSubtitle: 'Resultado da emissão', result: 'Emitidas', resultLabel: 'Notas emitidas' },
  demo: { button: 'Simular emissão', confirmNote: 'Prévia demonstrativa. A emissão real exigirá validação fiscal pelo backend e retorno do município ou provedor.', doneNote: 'Em produção, o resultado exibirá o número da nota, protocolo, situação fiscal, PDF e XML quando disponibilizados pelo provedor.', doneSub: '3 notas processadas nesta demonstração.', doneTitle: 'Emissão simulada com sucesso', doneSubtitle: 'Resultado da operação demonstrativa', result: 'Simulado', resultLabel: 'Notas processadas' },
}

export function InvoiceBatchCard({ ad, frame }: { ad?: boolean; frame: number }) {
  const copy = NF_COPY[ad ? 'ad' : 'demo']
  const at = (delay: number): CSSProperties => {
    const s = pop(frame, delay)
    return { opacity: frame < delay ? 0 : s, transform: `translateY(${(1 - s) * 16}px)` }
  }
  const toConfirm = p(frame, T.nfConfirm, T.nfConfirm + 22, [0, 1], Easing.inOut(Easing.cubic))
  const toDone = p(frame, T.nfDone, T.nfDone + 22, [0, 1], Easing.inOut(Easing.cubic))
  const height = NF_H.list + (NF_H.confirm - NF_H.list) * toConfirm + (NF_H.done - NF_H.confirm) * toDone
  const listOut = 1 - p(frame, T.nfConfirm, T.nfConfirm + 8)
  const confirmOut = 1 - p(frame, T.nfDone, T.nfDone + 8)

  return (
    <CardShell frame={frame} height={height} start={T.nfCard} top={NF.card}>
      {/* 1 · sales ready to invoice */}
      {listOut > 0 ? (
        <div style={{ inset: 0, opacity: listOut, padding: '0 31px', position: 'absolute' }}>
          <CardHeader icon={nfTile} subtitle="Prepare as notas fiscais de serviço" title="Emitir nota fiscal" />
          <div style={{ background: LINE, height: 2 }} />
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 46 }}>
            <span style={{ color: TEXT, fontSize: 33, fontWeight: 650, letterSpacing: '-0.01em', lineHeight: '40px' }}>Vendas disponíveis</span>
            <span style={{ background: '#efefef', borderRadius: 99, color: '#3d3d3d', fontSize: 23, fontWeight: 500, padding: '6px 15px' }}>3 vendas</span>
          </div>
          <div style={{ marginTop: 6 }}>
            {NF_SALES.map((sale, i) => {
              const rowAt = T.nfRows + i * 12
              const checked = pop(frame, rowAt + 8)
              return (
                <div key={sale.id} style={{ borderBottom: i < NF_SALES.length - 1 ? `2px solid ${LINE}` : 'none', height: 220, paddingTop: 40, ...at(rowAt) }}>
                  <div style={{ alignItems: 'center', display: 'flex', gap: 22, height: 50 }}>
                    <span style={{ opacity: frame < rowAt + 8 ? 0.15 : 1, transform: `scale(${frame < rowAt + 8 ? 1 : checked})` }}>
                      <CheckDot />
                    </span>
                    <span style={{ color: TEXT, flex: 1, fontSize: 33, fontWeight: 500 }}>Venda {sale.id}</span>
                    <span style={{ color: TEXT, fontSize: 33, fontWeight: 650, letterSpacing: '-0.01em' }}>{sale.value}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: 56, marginTop: 8 }}>
                    <span style={{ color: MUTED, fontSize: 28 }}>{sale.client}</span>
                    <span style={{ color: MUTED, fontSize: 25 }}>NFS-e</span>
                  </div>
                  <span style={{ color: MUTED, display: 'block', fontSize: 25, marginLeft: 56, marginTop: 10 }}>{sale.service}</span>
                </div>
              )
            })}
          </div>
          <div style={at(T.nfRows + 36)}>
            <SummaryBox big mt={-22} rows={[['Notas selecionadas', '3'], ['Valor total', 'R$ 2.780,00']]} />
            <PrimaryButton frame={frame} icon={<ClipboardCheck color="#fff" size={32} strokeWidth={2} style={iv(32, 2)} />} mt={25} pressedAt={T.nfTapReview}>Revisar emissão em lote</PrimaryButton>
          </div>
          <TapRipple at={T.nfTapReview} frame={frame} x={380} y={1110} />
        </div>
      ) : null}

      {/* 2 · confirm */}
      {frame >= T.nfConfirm && confirmOut > 0 ? (
        <div style={{ inset: 0, opacity: frame < T.nfDone ? p(frame, T.nfConfirm + 4, T.nfConfirm + 14) : confirmOut, padding: '0 31px', position: 'absolute' }}>
          <CardHeader icon={nfTile} subtitle="Revise os dados antes de emitir" title="Confirmar emissão" />
          <div style={{ background: LINE, height: 2 }} />
          <div style={{ alignItems: 'center', display: 'flex', gap: 18, marginTop: 46 }}>
            <ClipboardCheck color="#3d3d3d" size={32} strokeWidth={2} style={iv(32, 2)} />
            <span style={{ color: TEXT, fontSize: 31, fontWeight: 650, lineHeight: '40px' }}>Dados para conferência</span>
          </div>
          {NF_SALES.map((sale, i) => (
            <div key={sale.id} style={{ borderBottom: i < NF_SALES.length - 1 ? `2px solid ${LINE}` : 'none', height: i === 0 ? 172 : 186, paddingTop: i === 0 ? 22 : 36, ...at(T.nfConfirm + 10 + i * 6) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: TEXT, fontSize: 28, fontWeight: 500 }}>Venda {sale.id}</span>
                <span style={{ color: TEXT, fontSize: 28, fontWeight: 600 }}>{sale.value}</span>
              </div>
              <span style={{ color: MUTED, display: 'block', fontSize: 27, marginTop: 12 }}>{sale.client}</span>
            </div>
          ))}
          <div style={at(T.nfConfirm + 30)}>
            <SummaryBox mt={-2} rows={[['Notas a emitir', '3'], ['Valor total', 'R$ 2.780,00']]} />
            <div style={{ color: MUTED, display: 'flex', fontSize: 24, gap: 14, lineHeight: '36px', marginTop: 40 }}>
              <Info color={MUTED} size={26} strokeWidth={2} style={iv(26, 2, { flex: 'none', marginTop: 5 })} />
              <span>{copy.confirmNote}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 40, ...at(T.nfConfirm + 38) }}>
            <span style={{ alignItems: 'center', border: '2px solid #d9d9d9', borderRadius: 36, color: '#3d3d3d', display: 'flex', flex: 1, fontSize: 28, fontWeight: 500, height: 72, justifyContent: 'center' }}>Voltar</span>
            <span style={{ alignItems: 'center', background: '#1a1a1a', borderRadius: 36, color: '#fff', display: 'flex', flex: 1, fontSize: 28, fontWeight: 500, gap: 14, height: 72, justifyContent: 'center', transform: `scale(${frame >= T.nfTapSimulate && frame < T.nfTapSimulate + 6 ? 0.96 : 1})` }}>
              <Check color="#fff" size={30} strokeWidth={2.4} style={iv(30, 2.4)} /> {copy.button}
            </span>
          </div>
          <TapRipple at={T.nfTapSimulate} frame={frame} x={556} y={1136} />
        </div>
      ) : null}

      {/* 3 · done */}
      {frame >= T.nfDone ? (
        <div style={{ inset: 0, opacity: p(frame, T.nfDone + 4, T.nfDone + 14), padding: '0 31px', position: 'absolute' }}>
          <CardHeader
            icon={
              <IconTile size={88}>
                <FileCheck2 color="#4a4a4a" size={34} strokeWidth={2} style={iv(34, 2)} />
              </IconTile>
            }
            subtitle={copy.doneSubtitle}
            title="Emissão concluída"
          />
          <div style={{ background: LINE, height: 2 }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 66 }}>
            <svg height={60} viewBox="0 0 60 60" width={60}>
              <circle cx={30} cy={30} fill="none" pathLength={1} r={26} stroke={GREEN} strokeDasharray={1} strokeDashoffset={1 - p(frame, T.nfDone + 8, T.nfDone + 22)} strokeWidth={4.5} transform="rotate(-90 30 30)" />
              <path d="M19 31 l7 7 l15 -16" fill="none" pathLength={1} stroke={GREEN} strokeDasharray={1} strokeDashoffset={1 - p(frame, T.nfDone + 18, T.nfDone + 28)} strokeLinecap="round" strokeLinejoin="round" strokeWidth={4.5} />
            </svg>
          </div>
          <div style={{ textAlign: 'center', ...at(T.nfDone + 18) }}>
            <span style={{ color: TEXT, display: 'block', fontSize: 37, fontWeight: 650, letterSpacing: '-0.01em', marginTop: 26 }}>{copy.doneTitle}</span>
            <span style={{ color: MUTED, display: 'block', fontSize: 26, marginTop: 26 }}>{copy.doneSub}</span>
          </div>
          <div style={at(T.nfDone + 26)}>
            <SummaryBox
              mt={36}
              rows={[
                [copy.resultLabel, '3'],
                ['Valor total', 'R$ 2.780,00'],
                [
                  'Resultado',
                  <>
                    <CircleCheck color={GREEN} size={24} strokeWidth={2.2} style={iv(24, 2.2)} /> {copy.result}
                  </>,
                ],
              ]}
            />
            <span style={{ color: MUTED, display: 'block', fontSize: 24, lineHeight: '36px', marginTop: 20 }}>{copy.doneNote}</span>
          </div>
          <div style={{ alignItems: 'center', border: '2px solid #d9d9d9', borderRadius: 36, color: '#3d3d3d', display: 'flex', fontSize: 27, fontWeight: 500, gap: 14, height: 70, justifyContent: 'center', marginTop: 40, ...at(T.nfDone + 32) }}>
            <ArrowLeft color="#3d3d3d" size={26} strokeWidth={2} style={iv(26, 2)} /> Nova emissão
          </div>
        </div>
      ) : null}
    </CardShell>
  )
}

// ─── Bank reconciliation: suggested matches → "Confirmar conciliação" → "Conciliação concluída" ───

export const BANK = { a7: 13017, card: 13147, u7: 12807 }
export const BANK_H = { confirm: 1092, done: 1342, list: 1858 }

const BANK_MOVES = [
  { amount: '+ R$ 1.500,00', date: '18/10/2026', in: true, match: 'Venda #2031 · Clínica Horizonte', title: 'PIX recebido · Clínica Horizonte', value: 'R$ 1.500,00' },
  { amount: '– R$ 129,90', date: '18/10/2026', in: false, match: 'Despesa #883 · Software', title: 'Google Workspace', value: 'R$ 129,90' },
  { amount: '+ R$ 850,00', date: '17/10/2026', in: true, match: 'Venda #2032 · Agência Atlas', title: 'Transferência · Agência Atlas', value: 'R$ 850,00' },
]

const plainIcon = (icon: ReactNode) => <span style={{ display: 'flex', justifyContent: 'flex-end', width: 88 }}>{icon}</span>

export function BankReconciliationCard({ frame }: { frame: number }) {
  const at = (delay: number): CSSProperties => {
    const s = pop(frame, delay)
    return { opacity: frame < delay ? 0 : s, transform: `translateY(${(1 - s) * 16}px)` }
  }
  const toConfirm = p(frame, T.bcConfirm, T.bcConfirm + 22, [0, 1], Easing.inOut(Easing.cubic))
  const toDone = p(frame, T.bcDone, T.bcDone + 22, [0, 1], Easing.inOut(Easing.cubic))
  const height = BANK_H.list + (BANK_H.confirm - BANK_H.list) * toConfirm + (BANK_H.done - BANK_H.confirm) * toDone
  const listOut = 1 - p(frame, T.bcConfirm, T.bcConfirm + 8)
  const confirmOut = 1 - p(frame, T.bcDone, T.bcDone + 8)
  const selected = BANK_MOVES.filter((_, i) => frame >= T.bcRows + i * 16 + 8).length

  return (
    <CardShell frame={frame} height={height} start={T.bcCard} top={BANK.card}>
      {/* 1 · bank movements with suggested matches */}
      {listOut > 0 ? (
        <div style={{ inset: 0, opacity: listOut, padding: '0 22px', position: 'absolute' }}>
          <CardHeader
            icon={
              <IconTile size={88}>
                <Landmark color="#4a4a4a" size={34} strokeWidth={2} style={iv(34, 2)} />
              </IconTile>
            }
            subtitle="Revise as correspondências sugeridas"
            title="Conciliação bancária"
          />
          <div style={{ background: LINE, height: 2 }} />
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 40, ...at(T.bcCard + 8) }}>
            <div>
              <span style={{ color: TEXT, display: 'block', fontSize: 30, lineHeight: '40px' }}>Banco Exemplo</span>
              <span style={{ color: MUTED, display: 'block', fontSize: 27, lineHeight: '36px', marginTop: 8 }}>Conta •• 4582</span>
            </div>
            <span style={{ background: '#efefef', borderRadius: 99, color: '#3d3d3d', fontSize: 23, fontWeight: 500, padding: '6px 15px' }}>3 pendentes</span>
          </div>
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr', marginTop: 26, ...at(T.bcCard + 12) }}>
            {[
              ['Selecionadas', String(selected), TEXT],
              ['Conciliadas', '0', GREEN],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: '#f2f2f2', borderRadius: 26, height: 147, padding: '26px 24px 0' }}>
                <span style={{ color: MUTED, display: 'block', fontSize: 25 }}>{label}</span>
                <span style={{ color, display: 'block', fontSize: 42, fontVariantNumeric: 'tabular-nums', fontWeight: 650, marginTop: 10 }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ alignItems: 'center', display: 'flex', height: 52, justifyContent: 'space-between', marginTop: 24, ...at(T.bcCard + 16) }}>
            <span style={{ color: TEXT, fontSize: 33, fontWeight: 650, letterSpacing: '-0.01em' }}>Movimentações</span>
            <span style={{ color: MUTED, fontSize: 25 }}>3 encontradas</span>
          </div>
          {BANK_MOVES.map((move, i) => {
            const rowAt = T.bcRows + i * 16
            const checked = pop(frame, rowAt + 8)
            const matched = pop(frame, rowAt + 16)
            return (
              <div key={move.title} style={{ height: 362, position: 'relative', ...at(rowAt) }}>
                <div style={{ alignItems: 'center', display: 'flex', gap: 16, height: 50, left: 0, position: 'absolute', right: 0, top: 10 }}>
                  <span style={{ opacity: frame < rowAt + 8 ? 0.15 : 1, transform: `scale(${frame < rowAt + 8 ? 1 : checked})` }}>
                    <CheckDot />
                  </span>
                  <span style={{ color: TEXT, flex: 1, fontSize: 31 }}>{move.title}</span>
                  <ChevronRight color="#5b5b5b" size={28} strokeWidth={2} style={iv(28, 2)} />
                </div>
                <div style={{ alignItems: 'center', display: 'flex', height: 50, justifyContent: 'space-between', left: 58, position: 'absolute', right: 0, top: 62 }}>
                  <span style={{ color: MUTED, fontSize: 26 }}>{move.date}</span>
                  <span style={{ color: move.in ? GREEN : TEXT, fontSize: 31, fontWeight: 650, letterSpacing: '-0.01em' }}>{move.amount}</span>
                </div>
                <div style={{ background: '#f2f2f2', borderRadius: 26, height: 174, left: 0, position: 'absolute', right: 0, top: 123 }}>
                  <div style={{ alignItems: 'center', display: 'flex', height: 40, justifyContent: 'space-between', left: 24, position: 'absolute', right: 24, top: 24 }}>
                    <span style={{ color: MUTED, fontSize: 26 }}>Lançamento correspondente</span>
                    <span style={{ background: '#d4eedc', borderRadius: 99, color: GREEN, fontSize: 24, fontWeight: 500, opacity: frame < rowAt + 16 ? 0 : matched, padding: '4px 15px', transform: `scale(${0.8 + 0.2 * matched})` }}>Encontrado</span>
                  </div>
                  <div style={{ alignItems: 'center', border: '2px solid #d6d6d6', borderRadius: 36, display: 'flex', height: 70, justifyContent: 'space-between', left: 24, padding: '0 32px', position: 'absolute', right: 24, top: 80 }}>
                    <span style={{ color: frame < rowAt + 16 ? MUTED : TEXT, fontSize: 28, fontWeight: 500 }}>{frame < rowAt + 16 ? 'Buscando…' : move.match}</span>
                    <ChevronDown color="#6b6b6b" size={28} strokeWidth={2} style={iv(28, 2)} />
                  </div>
                </div>
                <div style={{ background: LINE, height: 2, left: 0, position: 'absolute', right: 0, top: 339 }} />
              </div>
            )
          })}
          <div style={{ marginTop: 18, ...at(T.bcFooter) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: MUTED, fontSize: 25 }}>Selecionadas para conciliar</span>
              <span style={{ color: MUTED, fontSize: 25 }}>Entradas / Saídas</span>
            </div>
            <div style={{ alignItems: 'center', display: 'flex', height: 52, justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ color: TEXT, fontSize: 33, fontWeight: 650, letterSpacing: '-0.01em' }}>3 movimentações</span>
              <span style={{ color: TEXT, fontSize: 28, fontWeight: 500 }}>R$ 2.350,00 / R$ 129,90</span>
            </div>
            <PrimaryButton frame={frame} icon={<ClipboardCheck color="#fff" size={32} strokeWidth={2} style={iv(32, 2)} />} mt={22} pressedAt={T.bcTapReview}>Revisar conciliação</PrimaryButton>
          </div>
          <TapRipple at={T.bcTapReview} frame={frame} x={380} y={1797} />
        </div>
      ) : null}

      {/* 2 · confirm */}
      {frame >= T.bcConfirm && confirmOut > 0 ? (
        <div style={{ inset: 0, opacity: frame < T.bcDone ? p(frame, T.bcConfirm + 4, T.bcConfirm + 14) : confirmOut, padding: '0 22px', position: 'absolute' }}>
          <CardHeader icon={plainIcon(<ClipboardCheck color="#3d3d3d" size={40} strokeWidth={2} style={iv(40, 2)} />)} subtitle="Confira antes de salvar" title="Confirmar conciliação" />
          <div style={{ background: LINE, height: 2 }} />
          {BANK_MOVES.map((move, i) => (
            <div key={move.title} style={{ borderBottom: i < BANK_MOVES.length - 1 ? `2px solid ${LINE}` : 'none', height: 194, paddingTop: 46, ...at(T.bcConfirm + 10 + i * 6) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: TEXT, fontSize: 29, fontWeight: 500 }}>{move.title}</span>
                <span style={{ color: TEXT, fontSize: 29, fontWeight: 650 }}>{move.value}</span>
              </div>
              <span style={{ alignItems: 'center', color: MUTED, display: 'flex', fontSize: 28, gap: 14, marginTop: 18 }}>
                <LinkIcon color={GREEN} size={24} strokeWidth={2.2} style={iv(24, 2.2)} /> {move.match}
              </span>
            </div>
          ))}
          <div style={at(T.bcConfirm + 30)}>
            <SummaryBox
              mt={-19}
              rowH={72}
              rows={[
                ['Movimentações', '3'],
                ['Entradas vinculadas', <span key="in" style={{ color: GREEN, fontSize: 33 }}>R$ 2.350,00</span>],
                ['Saídas vinculadas', <span key="out" style={{ fontSize: 33 }}>R$ 129,90</span>],
              ]}
            />
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 22, ...at(T.bcConfirm + 38) }}>
            <span style={{ alignItems: 'center', border: '2px solid #d9d9d9', borderRadius: 36, color: '#3d3d3d', display: 'flex', flex: 1, fontSize: 28, fontWeight: 500, height: 72, justifyContent: 'center' }}>Voltar</span>
            <span style={{ alignItems: 'center', background: '#1a1a1a', borderRadius: 36, color: '#fff', display: 'flex', flex: 1, fontSize: 28, fontWeight: 500, gap: 14, height: 72, justifyContent: 'center', transform: `scale(${frame >= T.bcTapConfirm && frame < T.bcTapConfirm + 6 ? 0.96 : 1})` }}>
              <Check color="#fff" size={30} strokeWidth={2.4} style={iv(30, 2.4)} /> Confirmar
            </span>
          </div>
          <TapRipple at={T.bcTapConfirm} frame={frame} x={596} y={1033} />
        </div>
      ) : null}

      {/* 3 · done */}
      {frame >= T.bcDone ? (
        <div style={{ inset: 0, opacity: p(frame, T.bcDone + 4, T.bcDone + 14), padding: '0 22px', position: 'absolute' }}>
          <CardHeader icon={plainIcon(<Landmark color="#3d3d3d" size={40} strokeWidth={2} style={iv(40, 2)} />)} subtitle="Resultado da operação demonstrativa" title="Conciliação concluída" />
          <div style={{ background: LINE, height: 2 }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 77 }}>
            <svg height={60} viewBox="0 0 60 60" width={60}>
              <circle cx={30} cy={30} fill="none" pathLength={1} r={26} stroke={GREEN} strokeDasharray={1} strokeDashoffset={1 - p(frame, T.bcDone + 8, T.bcDone + 22)} strokeWidth={4.5} transform="rotate(-90 30 30)" />
              <path d="M19 31 l7 7 l15 -16" fill="none" pathLength={1} stroke={GREEN} strokeDasharray={1} strokeDashoffset={1 - p(frame, T.bcDone + 18, T.bcDone + 28)} strokeLinecap="round" strokeLinejoin="round" strokeWidth={4.5} />
            </svg>
          </div>
          <div style={{ textAlign: 'center', ...at(T.bcDone + 18) }}>
            <span style={{ color: TEXT, display: 'block', fontSize: 35, fontWeight: 650, letterSpacing: '-0.01em', marginTop: 22 }}>Conciliação simulada com sucesso</span>
            <span style={{ color: MUTED, display: 'block', fontSize: 25, marginTop: 22 }}>3 movimentações conciliadas nesta demonstração.</span>
          </div>
          <div style={at(T.bcDone + 26)}>
            <SummaryBox mt={34} rowH={72} rows={[['Processadas agora', '3'], ['Total conciliado', '3 de 3'], ['Ainda pendentes', '0']]} />
            <span style={{ color: TEXT, display: 'block', fontSize: 30, fontWeight: 600, marginTop: 30 }}>Movimentações processadas</span>
          </div>
          {BANK_MOVES.map((move, i) => (
            <div key={move.title} style={{ alignItems: 'center', borderBottom: i < BANK_MOVES.length - 1 ? `2px solid ${LINE}` : 'none', display: 'flex', gap: 18, height: 164, ...at(T.bcDone + 32 + i * 6) }}>
              <CircleCheck color={GREEN} size={26} strokeWidth={2.2} style={iv(26, 2.2, { flex: 'none' })} />
              <div style={{ flex: 1 }}>
                <span style={{ color: TEXT, display: 'block', fontSize: 28 }}>{move.title}</span>
                <span style={{ color: MUTED, display: 'block', fontSize: 23, marginTop: 10 }}>{move.match}</span>
              </div>
              <span style={{ color: TEXT, fontSize: 28, fontWeight: 600 }}>{move.value}</span>
            </div>
          ))}
          <div style={{ alignItems: 'center', border: '2px solid #d9d9d9', borderRadius: 36, color: '#3d3d3d', display: 'flex', fontSize: 27, fontWeight: 500, gap: 14, height: 70, justifyContent: 'center', marginTop: 4, ...at(T.bcDone + 52) }}>
            <ArrowLeft color="#3d3d3d" size={26} strokeWidth={2} style={iv(26, 2)} /> Ver movimentações
          </div>
        </div>
      ) : null}
    </CardShell>
  )
}

/** Scroll stops after the expenses part: [from, to, target scroll]. */
const CRUD_SCROLL: [number, number, number][] = [
  [736, 760, CRUD.u2 - 230],
  [764, 790, CRUD.a2 - 230],
  [842, 868, CRUD.a2b - 230],
  [1064, 1088, CRUD.u3 - 230],
  [1290, 1314, CRUD.u4 - 230],
  [1360, 1380, CRUD.u4 - 110],
  [1474, 1498, FIN.u5 - 230],
  [1648, 1674, FIN.card + 1466 - 1560],
  [1690, 1720, FIN.card + FIN_H - 1560],
  [1816, 1840, NF.u6 - 230],
  [1928, 1952, NF.card + NF_H.list - 1560],
  [1976, 2000, NF.card - 198],
  [2146, 2170, BANK.u7 - 230],
  [2212, 2238, BANK.card - 198],
  [2280, 2306, BANK.card + BANK_H.list - 1560],
  [2330, 2354, BANK.card - 198],
]

function crudScroll(frame: number, base: number) {
  let previous = base
  let extra = 0
  for (const [from, to, target] of CRUD_SCROLL) {
    extra += p(frame, from, to, [0, 1], Easing.inOut(Easing.cubic)) * (target - previous)
    previous = target
  }
  return extra
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
  const toExpenses = p(frame, T.scrollToExpenses[0], T.scrollToExpenses[1], [0, 1], Easing.inOut(Easing.cubic))
  const toFooter = p(frame, T.scrollToFooter[0], T.scrollToFooter[1], [0, 1], Easing.inOut(Easing.cubic))
  const toReview = p(frame, T.review, T.review + 26, [0, 1], Easing.inOut(Easing.cubic))
  const toSummary = p(frame, T.scrollDetail[0], T.scrollDetail[1], [0, 1], Easing.inOut(Easing.cubic))
  const scroll =
    opening * OPEN_SCROLL +
    toSummary * DETAIL_SCROLL +
    toExpenses * (EXP_TEXT_TOP - 230 - OPEN_SCROLL - DETAIL_SCROLL) +
    toFooter * (EXP_FOOTER_SCROLL - (EXP_TEXT_TOP - 230)) +
    toReview * (EXP_CARD_TOP - 198 - EXP_FOOTER_SCROLL) +
    crudScroll(frame, EXP_CARD_TOP - 198)
  const expIntro = stream(EXPENSES_INTRO, p(frame, T.expIntro[0], T.expIntro[1], [0, 1], Easing.linear))

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
        {frame >= T.expIntro[0] ? (
          <p style={{ color: TEXT, fontSize: 32, left: 33, lineHeight: '48px', margin: 0, position: 'absolute', right: 40, top: EXP_TEXT_TOP }}>{expIntro}</p>
        ) : null}
        <ExpensesCard frame={frame} />

        <UserMessage at={T.u2.send + 2} frame={frame} lines={MESSAGES[1].lines} top={CRUD.u2} />
        <AssistantText frame={frame} text="Aqui estão os seus clientes:" top={CRUD.a2} window={T.a2} />
        <ClientsCard frame={frame} />
        <AssistantText frame={frame} text="E aqui está a atualização do Cliente Exemplo, pronta para revisar:" top={CRUD.a2b} window={T.a2b} />
        <UpdateClientCard frame={frame} />

        <UserMessage at={T.u3.send + 2} frame={frame} lines={MESSAGES[2].lines} top={CRUD.u3} />
        <AssistantText frame={frame} text="Pronto, cadastro preenchido:" top={CRUD.a3} window={T.a3} />
        <CreateClientCard frame={frame} />

        <UserMessage at={T.u4.send + 2} frame={frame} lines={MESSAGES[3].lines} top={CRUD.u4} />
        <AssistantText frame={frame} text="Antes de excluir, preciso da sua confirmação:" top={CRUD.a4} window={T.a4} />
        <DeleteClientCard frame={frame} />

        <UserMessage at={T.u5.send + 2} frame={frame} lines={MESSAGES[4].lines} top={FIN.u5} />
        <AssistantText frame={frame} text="Aqui está a visão financeira dos últimos 30 dias:" top={FIN.a5} window={T.a5} />
        <FinanceCard frame={frame} />

        <UserMessage at={T.u6.send + 2} frame={frame} lines={MESSAGES[5].lines} top={NF.u6} />
        <AssistantText frame={frame} text="Separei as vendas prontas para emissão:" top={NF.a6} window={T.a6} />
        <InvoiceBatchCard frame={frame} />

        <UserMessage at={T.u7.send + 2} frame={frame} lines={MESSAGES[6].lines} top={BANK.u7} />
        <AssistantText frame={frame} text="Encontrei 3 movimentações com correspondência no OTTO:" top={BANK.a7} window={T.a7} />
        <BankReconciliationCard frame={frame} />
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
      <span style={{ background: '#d4d4d4', borderRadius: 99, height: 92 + opening * 226 - toExpenses * 170, left: 816, position: 'absolute', top: 490 + opening * 578 + toExpenses * 160 + toFooter * 120 - toReview * 60, width: 5 }} />
      <div style={{ background: TEXT, borderRadius: 99, height: 9, left: 267, position: 'absolute', top: 1764, width: 294 }} />
    </AbsoluteFill>
  )
}
