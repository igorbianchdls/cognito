import type { CSSProperties } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import {
  Bot,
  Briefcase,
  Car,
  CheckCircle2,
  CreditCard,
  FileText,
  Landmark,
  Megaphone,
  Monitor,
  Package,
  Plane,
  ReceiptText,
  Sparkles,
  Truck,
  Users,
  Utensils,
  WalletCards,
} from 'lucide-react'

import { IOS_REMOTION_DISPLAY_FONT_STACK, IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

const FONT_STACK = IOS_REMOTION_FONT_STACK
const DISPLAY_FONT_STACK = IOS_REMOTION_DISPLAY_FONT_STACK
const INK = '#07143d'
const BLUE = '#1677f2'
const MUTED = '#6f7ba3'
const SOFT_BORDER = '#edf2fb'

function clamp(value: number) {
  return Math.max(0, Math.min(1, value))
}

function progress(frame: number, start: number, duration: number) {
  return clamp((frame - start) / duration)
}

function ease(frame: number, start: number, duration: number) {
  const p = progress(frame, start, duration)
  return 1 - Math.pow(1 - p, 3)
}

function fadeUp(frame: number, start: number, y = 26): CSSProperties {
  const p = ease(frame, start, 26)
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * y}px)`,
  }
}

function formatCurrency(value: string) {
  return value
}

type IconType = typeof Plane

type ExpenseRow = {
  amount: string
  category: string
  confidence: string
  date: string
  description: string
  icon: IconType
  logoBg: string
  logoColor: string
  tone: string
}

const rows: ExpenseRow[] = [
  { amount: 'R$ 89,00', category: 'Assinaturas', confidence: '98%', date: '12/05/2024', description: 'Notion Labs', icon: FileText, logoBg: '#ffffff', logoColor: '#111111', tone: '#8a22e6' },
  { amount: 'R$ 27,45', category: 'Transporte', confidence: '96%', date: '12/05/2024', description: 'Uber do Brasil', icon: Car, logoBg: '#050505', logoColor: '#ffffff', tone: '#1677f2' },
  { amount: 'R$ 45,90', category: 'Refeições', confidence: '97%', date: '11/05/2024', description: 'iFood', icon: Utensils, logoBg: '#f20b35', logoColor: '#ffffff', tone: '#ff5a1f' },
  { amount: 'R$ 320,00', category: 'Impostos', confidence: '99%', date: '10/05/2024', description: 'Receita Federal', icon: Landmark, logoBg: '#ffffff', logoColor: '#143a7b', tone: '#00a985' },
  { amount: 'R$ 16,80', category: 'Frete', confidence: '95%', date: '09/05/2024', description: 'Correios', icon: Package, logoBg: '#ffffff', logoColor: '#f59b00', tone: '#f59b00' },
]

const flowRows = [
  { category: 'Viagem', date: '12 mai', icon: Plane, source: 'Azul Linhas\nAéreas', tone: '#1677f2' },
  { category: 'Assinaturas', date: '11 mai', icon: CreditCard, source: 'Spotify', tone: '#7a1ce2' },
  { category: 'Impostos', date: '10 mai', icon: Landmark, source: 'Receita\nFederal', tone: '#14b857' },
  { category: 'Refeições', date: '09 mai', icon: Utensils, source: 'Restaurante\nD.O.M', tone: '#ff5a1f' },
  { category: 'Frete', date: '08 mai', icon: Truck, source: 'Jadlog', tone: '#1677f2' },
]

const folderRows = [
  { count: '12', icon: Briefcase, label: 'Operacional', tone: '#21b83e', y: 455 },
  { count: '8', icon: Megaphone, label: 'Marketing', tone: '#e8b400', y: 660 },
  { count: '15', icon: Users, label: 'Equipe', tone: '#ff7a00', y: 865 },
  { count: '6', icon: Monitor, label: 'Software', tone: '#ff4a16', y: 1070 },
  { count: '7', icon: Plane, label: 'Viagens', tone: '#f03b2f', y: 1275 },
]

function AiWordmark({ size = 76 }: { size?: number }) {
  return (
    <div style={{ alignItems: 'center', background: 'radial-gradient(circle at 35% 30%, #77b8ff, #1677f2 58%, #0b55df)', borderRadius: 999, boxShadow: '0 22px 70px rgba(22,119,242,0.35)', color: '#ffffff', display: 'grid', fontSize: size * 0.45, fontWeight: 900, height: size, justifyItems: 'center', letterSpacing: 0, lineHeight: 1, position: 'relative', width: size }}>
      AI
      <Sparkles color="#ffffff" size={size * 0.22} strokeWidth={2.6} style={{ position: 'absolute', right: size * 0.16, top: size * 0.14 }} />
    </div>
  )
}

function LogoTile({ item, size = 66 }: { item: Pick<ExpenseRow, 'icon' | 'logoBg' | 'logoColor'>; size?: number }) {
  const Icon = item.icon
  return (
    <div style={{ alignItems: 'center', background: item.logoBg, border: item.logoBg === '#ffffff' ? '1px solid #edf2fb' : 0, borderRadius: 13, boxShadow: '0 12px 34px rgba(7,20,61,0.08)', display: 'flex', height: size, justifyContent: 'center', width: size }}>
      <Icon color={item.logoColor} size={size * 0.55} strokeWidth={2.4} />
    </div>
  )
}

function CategoryPill({ item, iconSize = 33 }: { item: Pick<ExpenseRow, 'category' | 'icon' | 'tone'>; iconSize?: number }) {
  const Icon = item.icon
  return (
    <div style={{ alignItems: 'center', background: `${item.tone}13`, borderRadius: 13, color: item.tone, display: 'flex', gap: 15, justifyContent: 'center', minHeight: 62, padding: '0 18px' }}>
      <Icon color={item.tone} size={iconSize} strokeWidth={2.35} />
      <span style={{ color: item.tone, fontSize: 26, fontWeight: 760, letterSpacing: 0 }}>{item.category}</span>
    </div>
  )
}

function DottedArrow({ color, progressValue }: { color: string; progressValue: number }) {
  const dotCount = 8
  const nodeX = 6 + progressValue * 170
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 15, position: 'relative', width: 205 }}>
      {Array.from({ length: dotCount }).map((_, index) => {
        const active = progressValue > index / dotCount
        return <span key={index} style={{ background: color, borderRadius: 999, height: active ? 7 : 5, opacity: active ? 1 : 0.28, width: active ? 7 : 5 }} />
      })}
      <span
        style={{
          background: '#ffffff',
          border: `5px solid ${color}`,
          borderRadius: 999,
          boxShadow: `0 0 0 8px ${color}1f, 0 0 28px ${color}66`,
          height: 14,
          left: nodeX,
          opacity: progressValue,
          position: 'absolute',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 14,
        }}
      />
      <span style={{ color, fontSize: 40, fontWeight: 820, lineHeight: 1, opacity: progressValue }}>→</span>
    </div>
  )
}

function cubicPoint(t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) {
  const mt = 1 - t
  return {
    x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
    y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y,
  }
}

export function ExpenseClassificationTableAction() {
  const frame = useCurrentFrame()
  const scan = interpolate(frame, [70, 360], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: INK, fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ ...fadeUp(frame, 8, 18), left: 110, position: 'absolute', right: 110, textAlign: 'center', top: 130 }}>
        <h1 style={{ color: INK, fontFamily: DISPLAY_FONT_STACK, fontSize: 76, fontWeight: 850, letterSpacing: 0, lineHeight: 1.12, margin: 0 }}>
          Classificação<br />automática com <span style={{ color: BLUE }}>IA</span>
        </h1>
        <p style={{ color: MUTED, fontSize: 35, fontWeight: 520, letterSpacing: 0, lineHeight: 1.22, margin: '28px 0 0' }}>Suas transações organizadas<br />em segundos.</p>
      </div>

      <div style={{ ...fadeUp(frame, 34, 22), background: '#ffffff', border: `1px solid ${SOFT_BORDER}`, borderRadius: 34, boxShadow: '0 26px 90px rgba(7,20,61,0.08)', left: 36, overflow: 'hidden', position: 'absolute', right: 36, top: 535 }}>
        <div style={{ alignItems: 'center', color: MUTED, display: 'grid', fontSize: 22, fontWeight: 560, gridTemplateColumns: '220px 130px 120px 250px 1fr', height: 116, padding: '0 38px' }}>
          <span>Descrição</span>
          <span>Data</span>
          <span>Valor</span>
          <span />
          <span>Categoria</span>
        </div>
        {rows.map((item, index) => {
          const itemProgress = ease(frame, 95 + index * 36, 38)
          return (
            <div key={item.description} style={{ alignItems: 'center', borderTop: `1px solid ${SOFT_BORDER}`, display: 'grid', gridTemplateColumns: '220px 130px 120px 250px 1fr', height: 166, opacity: itemProgress, padding: '0 38px', transform: `translateY(${(1 - itemProgress) * 18}px)` }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: 24 }}>
                <LogoTile item={item} />
                <span style={{ color: INK, fontSize: 21, fontWeight: 520 }}>{item.description}</span>
              </div>
              <span style={{ color: INK, fontSize: 20, fontWeight: 500 }}>{item.date}</span>
              <span style={{ color: INK, fontSize: 20, fontWeight: 500 }}>{formatCurrency(item.amount)}</span>
              <DottedArrow color={BLUE} progressValue={scan} />
              <div style={{ display: 'grid', gap: 17, justifyItems: 'center' }}>
                <CategoryPill item={item} />
                <div style={{ alignItems: 'center', color: MUTED, display: 'flex', fontSize: 23, fontWeight: 520, gap: 11 }}>
                  <CheckCircle2 color="#72bd68" size={28} strokeWidth={2.1} />
                  {item.confidence}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ ...fadeUp(frame, 70, 18), background: 'linear-gradient(180deg, rgba(232,243,255,0.82), rgba(244,249,255,0.9))', border: '2px solid rgba(255,255,255,0.82)', borderRadius: 42, boxShadow: '0 26px 90px rgba(22,119,242,0.18)', height: 1010, left: 500, overflow: 'hidden', position: 'absolute', top: 510, width: 252 }}>
        <div style={{ alignItems: 'center', color: BLUE, display: 'flex', fontSize: 23, fontWeight: 760, gap: 12, left: 38, position: 'absolute', top: 86 }}>
          <Sparkles color={BLUE} size={30} />
          Classificando...
        </div>
        {Array.from({ length: 16 }).map((_, index) => (
          <span key={index} style={{ background: '#ffffff', borderRadius: 999, height: index % 3 === 0 ? 8 : 5, left: `${18 + ((index * 37) % 70)}%`, opacity: 0.75 * interpolate(Math.sin(frame / 13 + index), [-1, 1], [0.25, 1]), position: 'absolute', top: 170 + index * 51, width: index % 3 === 0 ? 8 : 5 }} />
        ))}
        <div style={{ background: `linear-gradient(180deg, transparent, rgba(22,119,242,0.18), transparent)`, height: 240, left: 0, opacity: 0.75, position: 'absolute', right: 0, top: 110 + scan * 650 }} />
      </div>

      <div style={{ ...fadeUp(frame, 190, 26), alignItems: 'center', background: '#ffffff', border: `1px solid ${SOFT_BORDER}`, borderRadius: 31, boxShadow: '0 24px 70px rgba(7,20,61,0.09)', display: 'flex', gap: 32, left: 145, padding: '28px 36px', position: 'absolute', right: 145, top: 1620 }}>
        <AiWordmark size={116} />
        <div style={{ display: 'grid', gap: 8 }}>
          <strong style={{ color: INK, fontSize: 27, fontWeight: 830, letterSpacing: 0 }}>IA trabalhando por você</strong>
          <span style={{ color: MUTED, fontSize: 24, fontWeight: 480, lineHeight: 1.22 }}>Identificamos padrões, entendemos o contexto<br />e classificamos suas transações automaticamente.</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}

export function ExpenseClassificationMatchingAction() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: INK, fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ ...fadeUp(frame, 6, 20), left: 110, position: 'absolute', right: 110, textAlign: 'center', top: 112 }}>
        <h1 style={{ color: INK, fontFamily: DISPLAY_FONT_STACK, fontSize: 70, fontWeight: 850, letterSpacing: 0, lineHeight: 1.12, margin: 0 }}>
          IA que entende<br /><span style={{ color: BLUE }}>e classifica por você</span>
        </h1>
        <p style={{ color: MUTED, fontSize: 32, fontWeight: 500, letterSpacing: 0, margin: '30px 0 0' }}>Menos esforço, mais controle.</p>
      </div>

      <div style={{ left: 64, position: 'absolute', right: 64, top: 445 }}>
        {flowRows.map((item, index) => {
          const Icon = item.icon
          const y = index * 270
          const p = ease(frame, 60 + index * 44, 42)
          const nodeX = interpolate(frame, [82 + index * 44, 150 + index * 44], [0, 238], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const trailX = Math.max(0, nodeX - 42)
          const targetPulse = interpolate(Math.sin(frame / 8 + index), [-1, 1], [0.45, 1])
          return (
            <div key={item.source} style={{ opacity: p, position: 'absolute', top: y, transform: `translateY(${(1 - p) * 18}px)` }}>
              <div style={{ alignItems: 'center', background: '#ffffff', border: `1px solid ${SOFT_BORDER}`, borderRadius: 32, boxShadow: '0 24px 70px rgba(7,20,61,0.07)', display: 'flex', gap: 42, height: 152, left: 0, padding: '0 30px', position: 'absolute', width: 455 }}>
                <div style={{ alignItems: 'center', background: '#ffffff', borderRadius: 26, boxShadow: '0 18px 44px rgba(7,20,61,0.08)', display: 'flex', height: 108, justifyContent: 'center', width: 108 }}>
                  <Icon color={item.tone} size={63} strokeWidth={2.6} />
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <strong style={{ color: INK, fontSize: 34, fontWeight: 820, letterSpacing: 0, lineHeight: 1.1, whiteSpace: 'pre-line' }}>{item.source}</strong>
                  <span style={{ color: MUTED, fontSize: 31, fontWeight: 470 }}>{item.date}</span>
                </div>
              </div>

              <svg height="152" style={{ left: 410, overflow: 'visible', position: 'absolute', top: 0 }} width="330">
                <line stroke={item.tone} strokeDasharray="24 18" strokeLinecap="round" strokeWidth="7" x1="0" x2="238" y1="76" y2="76" />
                <circle cx="0" cy="76" fill={item.tone} opacity="0.4" r="8" />
                <circle cx={trailX} cy="76" fill={item.tone} opacity="0.24" r="7" />
                <circle cx={Math.max(0, nodeX - 20)} cy="76" fill={item.tone} opacity="0.42" r="8" />
                <circle cx={nodeX} cy="76" fill="#ffffff" r="15" stroke={item.tone} strokeWidth="6" />
                <circle cx={nodeX} cy="76" fill={item.tone} opacity="0.18" r="28" />
                <circle cx="238" cy="76" fill="#ffffff" r={8 + targetPulse * 5} stroke={item.tone} strokeWidth="4" />
              </svg>

              <div style={{ alignItems: 'center', background: '#ffffff', border: `1px solid ${SOFT_BORDER}`, borderRadius: 29, boxShadow: '0 22px 64px rgba(7,20,61,0.07)', color: item.tone, display: 'flex', gap: 23, height: 122, justifyContent: 'center', left: 655, position: 'absolute', top: 15, width: 290 }}>
                <Icon color={item.tone} size={45} strokeWidth={2.45} />
                <strong style={{ color: item.tone, fontSize: 34, fontWeight: 760, letterSpacing: 0 }}>{item.category}</strong>
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

function ReceiptCard({
  amount,
  date,
  index,
  title,
  vendor,
}: {
  amount: string
  date: string
  index: number
  title: string
  vendor: string
}) {
  const Icon = index % 2 === 0 ? ReceiptText : WalletCards
  const rotations = [-7, 5, -4, 8]
  return (
    <div style={{ background: '#ffffff', border: `1px solid ${SOFT_BORDER}`, borderRadius: index === 0 || index === 3 ? '8px 8px 22px 22px' : 22, boxShadow: '0 24px 64px rgba(7,20,61,0.10)', height: 248, padding: 31, position: 'absolute', transform: `rotate(${rotations[index]}deg)`, width: 270 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <strong style={{ color: BLUE, fontSize: 25, fontWeight: 760 }}>{title}</strong>
        <Icon color="#7da9ff" size={36} strokeWidth={2.2} />
      </div>
      <div style={{ color: '#111111', fontSize: 26, fontWeight: 760, marginTop: 27 }}>{amount}</div>
      <div style={{ color: '#496096', fontSize: 21, fontWeight: 480, lineHeight: 1.35, marginTop: 24 }}>{vendor}<br />{date}</div>
      <div style={{ display: 'grid', gap: 10, marginTop: 25 }}>
        <span style={{ background: '#eef2f8', borderRadius: 999, height: 7, width: 178 }} />
        <span style={{ background: '#eef2f8', borderRadius: 999, height: 7, width: 116 }} />
      </div>
    </div>
  )
}

export function ExpenseClassificationFoldersAction() {
  const frame = useCurrentFrame()
  const lineProgress = interpolate(frame, [70, 310], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: INK, fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ left: 46, position: 'absolute', top: 250 }}>
        {[
          { amount: 'R$ 189,50', date: '12/05/2024', title: 'Recibo', vendor: 'Café & Co.', x: 40, y: 0 },
          { amount: 'R$ 1.250,00', date: '10/05/2024', title: 'Fatura', vendor: 'Agência XYZ', x: 0, y: 330 },
          { amount: 'R$ 79,90', date: '10/05/2024', title: 'Transação', vendor: 'Uber', x: -10, y: 585 },
          { amount: 'R$ 60,00', date: '09/05/2024', title: 'Recibo', vendor: 'Estacionamento', x: 96, y: 810 },
        ].map((receipt, index) => (
          <div key={receipt.vendor} style={{ ...fadeUp(frame, 35 + index * 32, 24), left: receipt.x, position: 'absolute', top: receipt.y }}>
            <ReceiptCard {...receipt} index={index} />
          </div>
        ))}
      </div>

      <svg height="1140" style={{ left: 270, overflow: 'visible', position: 'absolute', top: 320, width: 485 }} width="485">
        {folderRows.map((folder, index) => {
          const y1 = [120, 260, 410, 540, 690][index]
          const y2 = folder.y - 320 + 63
          const path = `M 0 ${y1} C 160 ${y1 + 10}, 135 ${y2 - 75}, 360 ${y2}`
          const nodeT = interpolate(frame, [95 + index * 28, 210 + index * 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const node = cubicPoint(
            nodeT,
            { x: 0, y: y1 },
            { x: 160, y: y1 + 10 },
            { x: 135, y: y2 - 75 },
            { x: 360, y: y2 },
          )
          const trailingNode = cubicPoint(
            Math.max(0, nodeT - 0.16),
            { x: 0, y: y1 },
            { x: 160, y: y1 + 10 },
            { x: 135, y: y2 - 75 },
            { x: 360, y: y2 },
          )
          const endpointPulse = interpolate(Math.sin(frame / 9 + index), [-1, 1], [0.35, 1])
          return (
            <g key={folder.label} opacity={lineProgress}>
              <path d={path} fill="none" stroke={folder.tone} strokeDasharray="8 12" strokeLinecap="round" strokeWidth="6" />
              <path d={path} fill="none" pathLength={1} stroke={folder.tone} strokeDasharray={`${lineProgress} 1`} strokeLinecap="round" strokeWidth="5" />
              <circle cx="0" cy={y1} fill="#ffffff" r="9" stroke={folder.tone} strokeWidth="5" />
              <circle cx={trailingNode.x} cy={trailingNode.y} fill={folder.tone} opacity="0.28" r="7" />
              <circle cx={node.x} cy={node.y} fill={folder.tone} opacity="0.18" r="26" />
              <circle cx={node.x} cy={node.y} fill="#ffffff" r="13" stroke={folder.tone} strokeWidth="5" />
              <circle cx="360" cy={y2} fill={folder.tone} opacity="0.18" r={16 + endpointPulse * 9} />
              <circle cx="360" cy={y2} fill="#ffffff" r="9" stroke={folder.tone} strokeWidth="5" />
            </g>
          )
        })}
      </svg>

      <div style={{ position: 'absolute', right: 38, top: 330 }}>
        {folderRows.map((folder, index) => {
          const Icon = folder.icon
          return (
            <div key={folder.label} style={{ ...fadeUp(frame, 90 + index * 30, 20), alignItems: 'center', background: '#ffffff', border: `1px solid ${SOFT_BORDER}`, borderRadius: 26, boxShadow: '0 24px 70px rgba(7,20,61,0.09)', display: 'flex', gap: 25, height: 128, justifyContent: 'space-between', padding: '0 28px', position: 'absolute', right: 0, top: index * 205, width: 340 }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: 25 }}>
                <Icon color={folder.tone} size={44} strokeWidth={2.5} />
                <strong style={{ color: '#111111', fontSize: 28, fontWeight: 700, letterSpacing: 0 }}>{folder.label}</strong>
              </div>
              <span style={{ alignItems: 'center', background: '#f2f5fb', borderRadius: 999, color: '#56618d', display: 'flex', fontSize: 21, fontWeight: 680, height: 45, justifyContent: 'center', width: 45 }}>{folder.count}</span>
            </div>
          )
        })}
      </div>

      <div style={{ ...fadeUp(frame, 160, 20), left: 100, position: 'absolute', right: 100, textAlign: 'center', top: 1510 }}>
        <h1 style={{ color: INK, fontFamily: DISPLAY_FONT_STACK, fontSize: 67, fontWeight: 860, letterSpacing: 0, lineHeight: 1.12, margin: 0 }}>
          Inteligência que<br /><span style={{ color: BLUE }}>organiza</span> suas despesas
        </h1>
        <p style={{ color: '#40527f', fontSize: 30, fontWeight: 480, lineHeight: 1.28, margin: '28px 0 0' }}>Classificação automática. Mais controle.<br />Menos trabalho.</p>
        <Sparkles color={BLUE} size={54} strokeWidth={2.3} style={{ marginTop: 48 }} />
      </div>

      <Bot color={BLUE} size={44} strokeWidth={2.4} style={{ filter: 'drop-shadow(0 12px 22px rgba(22,119,242,0.24))', left: 488, opacity: interpolate(Math.sin(frame / 20), [-1, 1], [0.45, 1]), position: 'absolute', top: 760 }} />
    </AbsoluteFill>
  )
}
