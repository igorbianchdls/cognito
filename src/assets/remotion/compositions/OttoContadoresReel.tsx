import { SiMercadopago, SiNubank } from '@icons-pack/react-simple-icons'
import { Barcode, CheckCheck, QrCode } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  random,
  Series,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

const BG = '#f5f4ef'
const INK = '#141413'
const WHITE = '#ffffff'
const TERRA = '#d97757'
const GRAY = '#b8bab2'
const TERRA_SOFT = '#f6e4da'
const INK_MUTED = '#6b6c66'

const SERIF = '"Source Serif 4", Georgia, "Times New Roman", serif'
const SANS = IOS_REMOTION_FONT_STACK

const SERIF_FONT_ID = 'otto-contadores-serif-font'
const SERIF_FONT_URL = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400..700&display=swap'

let serifFontPromise: Promise<void> | null = null

function loadSerifFont() {
  if (serifFontPromise || typeof document === 'undefined') {
    return serifFontPromise
  }

  serifFontPromise = new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 4000)
    const done = () => {
      document.fonts
        .load(`600 80px "Source Serif 4"`)
        .catch(() => undefined)
        .finally(() => {
          window.clearTimeout(timeout)
          resolve()
        })
    }
    const existing = document.getElementById(SERIF_FONT_ID)
    if (existing) {
      done()
      return
    }
    const link = document.createElement('link')
    link.id = SERIF_FONT_ID
    link.rel = 'stylesheet'
    link.href = SERIF_FONT_URL
    link.onload = done
    link.onerror = done
    document.head.appendChild(link)
  })

  return serifFontPromise
}

function p(frame: number, from: number, to: number, output: [number, number] = [0, 1], easing = Easing.out(Easing.cubic)) {
  return interpolate(frame, [from, to], output, { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function typed(text: string, progress: number) {
  return text.slice(0, Math.floor(text.length * progress))
}

function brl(value: number) {
  return value.toLocaleString('pt-BR', { currency: 'BRL', style: 'currency' })
}

function useSpring(delay: number, config = { damping: 14, stiffness: 150 }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({ config, fps, frame: frame - delay })
}

const normalize = (word: string) => word.toLowerCase().replace(/[.,!?]/g, '')

// ─── Primitives ──────────────────────────────────────────────────────────────

function Scene({ children, duration }: { children: ReactNode; duration: number }) {
  const frame = useCurrentFrame()
  const opacity = p(frame, 0, 10) * p(frame, duration - 10, duration, [1, 0])
  const y = p(frame, 0, 14, [18, 0])

  return (
    <AbsoluteFill style={{ color: INK, fontFamily: SANS, opacity, overflow: 'hidden', transform: `translateY(${y}px)` }}>
      {children}
    </AbsoluteFill>
  )
}

const GRID_SIZE = 60
const GRID_LINE = `${GRAY}66`
const GRID_FADE = 'radial-gradient(ellipse 75% 60% at 50% 50%, #000 35%, transparent 100%)'

function GridBackground() {
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(to right, ${GRID_LINE} 1.5px, transparent 1.5px), linear-gradient(to bottom, ${GRID_LINE} 1.5px, transparent 1.5px)`,
        backgroundPosition: `${(1080 % GRID_SIZE) / 2}px ${(1920 % GRID_SIZE) / 2}px`,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        maskImage: GRID_FADE,
        WebkitMaskImage: GRID_FADE,
      }}
    />
  )
}

type HeadlineProps = {
  highlight?: string[]
  marks?: { at: number; kind: 'underline' | 'strike'; word: string }[]
  size?: number
  start?: number
  stagger?: number
  style?: CSSProperties
  text: string
}

function Headline({ highlight = [], marks = [], size = 88, start = 0, stagger = 3, style, text }: HeadlineProps) {
  const frame = useCurrentFrame()
  const words = text.split(' ')

  return (
    <div
      style={{
        color: INK,
        fontFamily: SERIF,
        fontSize: size,
        fontWeight: 560,
        left: 70,
        letterSpacing: '-0.02em',
        lineHeight: 1.08,
        position: 'absolute',
        right: 70,
        textAlign: 'center',
        ...style,
      }}
    >
      {words.map((word, index) => {
        const local = frame - start - index * stagger
        const o = p(local, 0, 14)
        const key = normalize(word)
        const mark = marks.find((item) => item.word === key)
        const markProgress = mark ? p(frame, mark.at, mark.at + 16, [0, 1], Easing.inOut(Easing.cubic)) : 0

        return (
          <span
            key={`${word}-${index}`}
            style={{
              color: highlight.includes(key) ? TERRA : INK,
              display: 'inline-block',
              filter: `blur(${(1 - o) * 8}px)`,
              marginRight: index === words.length - 1 ? 0 : '0.24em',
              opacity: o,
              position: 'relative',
              transform: `translateY(${(1 - o) * 28}px)`,
            }}
          >
            {word}
            {mark ? (
              <svg
                preserveAspectRatio="none"
                style={{ height: mark.kind === 'underline' ? '0.3em' : '0.22em', left: '-3%', overflow: 'visible', position: 'absolute', top: mark.kind === 'underline' ? '92%' : '46%', width: '106%' }}
                viewBox="0 0 100 10"
              >
                <path
                  d={mark.kind === 'underline' ? 'M2 6 C 25 2, 50 9, 75 4 S 96 5, 98 3' : 'M1 6 C 30 3, 70 7, 99 4'}
                  fill="none"
                  pathLength={1}
                  stroke={TERRA}
                  strokeDasharray={1}
                  strokeDashoffset={1 - markProgress}
                  strokeLinecap="round"
                  strokeWidth={mark.kind === 'underline' ? 9 : 7}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : null}
          </span>
        )
      })}
    </div>
  )
}

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: WHITE,
        border: `2px solid ${GRAY}66`,
        borderRadius: 36,
        boxShadow: '0 30px 70px rgba(20, 20, 19, 0.07)',
        position: 'absolute',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function OttoIcon({ size }: { size: number }) {
  return <Img src={staticFile('logoOttoIcon.svg')} style={{ display: 'block', height: size, width: size }} />
}

const TASKS = ['Contas bancárias', 'Despesas', 'Notas fiscais', 'Conciliação bancária', 'Cobrança no WhatsApp']

function ProgressTracker({ duration, index }: { duration: number; index: number }) {
  const frame = useCurrentFrame()
  const fill = p(frame, 12, duration - 22, [0, 1], Easing.inOut(Easing.quad))

  return (
    <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 18, left: 0, position: 'absolute', right: 0, top: 150 }}>
      <span style={{ color: INK_MUTED, fontSize: 28, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {String(index + 1).padStart(2, '0')} / 05 · {TASKS[index]}
      </span>
      <div style={{ display: 'flex', gap: 12 }}>
        {TASKS.map((task, i) => (
          <div key={task} style={{ background: `${GRAY}88`, borderRadius: 99, height: 8, overflow: 'hidden', width: 128 }}>
            <div style={{ background: TERRA, height: '100%', width: `${(i < index ? 1 : i === index ? fill : 0) * 100}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureScene({ children, duration, index, title }: { children: ReactNode; duration: number; index: number; title: string }) {
  return (
    <Scene duration={duration}>
      <ProgressTracker duration={duration} index={index} />
      <Headline size={84} start={4} text={title} style={{ top: 270 }} />
      {children}
    </Scene>
  )
}

// ─── 1. Hook ─────────────────────────────────────────────────────────────────

function Receipt({ seed, duration }: { duration: number; seed: number }) {
  const frame = useCurrentFrame()
  const x = random(`x${seed}`) * 1000 - 60
  const speed = 4 + random(`s${seed}`) * 5
  const y = -260 + random(`y${seed}`) * 900 + frame * speed - 300
  const rotate = (random(`r${seed}`) - 0.5) * 50 + frame * (random(`w${seed}`) - 0.5) * 0.6
  const scale = 0.7 + random(`k${seed}`) * 0.5
  const opacity = 0.5 * p(frame, 0, 12) * p(frame, duration - 20, duration, [1, 0])

  return (
    <div style={{ background: WHITE, border: `2px solid ${GRAY}`, borderRadius: 12, height: 210, left: x, opacity, padding: 22, position: 'absolute', top: y, transform: `rotate(${rotate}deg) scale(${scale})`, width: 160 }}>
      {[0.9, 0.6, 0.75, 0.5, 0.8].map((w, i) => (
        <div key={i} style={{ background: i === 0 ? INK_MUTED : GRAY, borderRadius: 4, height: 9, marginBottom: 18, opacity: i === 0 ? 0.5 : 0.8, width: `${w * 100}%` }} />
      ))}
    </div>
  )
}

function HookScene({ duration }: { duration: number }) {
  return (
    <Scene duration={duration}>
      {Array.from({ length: 12 }, (_, i) => <Receipt duration={duration} key={i} seed={i} />)}
      <Headline
        highlight={['contadores']}
        marks={[{ at: 52, kind: 'underline', word: 'preocupados' }]}
        size={108}
        start={6}
        text="Essa IA tá deixando os contadores brasileiros preocupados."
        style={{ top: 640 }}
      />
    </Scene>
  )
}

// ─── 2. Nome ─────────────────────────────────────────────────────────────────

function NameScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const reveal = p(frame, 16, 40, [0, 1], Easing.inOut(Easing.cubic))
  const scale = p(frame, 16, duration, [0.94, 1.02], Easing.linear)

  return (
    <Scene duration={duration}>
      <Headline size={76} start={0} text="O nome dela é" style={{ color: INK_MUTED, top: 700 }} />
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 840 }}>
        <Img
          src={staticFile('logoOtto.svg')}
          style={{ clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`, height: 300, transform: `scale(${scale})`, width: 700 }}
        />
      </div>
      <div style={{ background: TERRA, borderRadius: 99, height: 8, left: 540 - 90, position: 'absolute', top: 1190, transform: `scaleX(${p(frame, 34, 50)})`, width: 180 }} />
    </Scene>
  )
}

// ─── 3. Promessa ─────────────────────────────────────────────────────────────

function PromiseScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()

  return (
    <Scene duration={duration}>
      <Headline highlight={['financeiro']} size={92} start={2} text="Ela automatiza todo o financeiro de uma empresa." style={{ top: 300 }} />
      <Card style={{ left: 110, opacity: p(frame, 18, 30), padding: '40px 48px', right: 110, top: 760, transform: `translateY(${p(frame, 18, 34, [40, 0])}px)` }}>
        <span style={{ color: INK_MUTED, display: 'block', fontSize: 28, fontWeight: 600, letterSpacing: '0.08em', marginBottom: 18, textTransform: 'uppercase' }}>No automático</span>
        {TASKS.map((task, i) => {
          const o = p(frame, 28 + i * 7, 42 + i * 7)
          const check = p(frame, 62 + i * 5, 72 + i * 5)
          return (
            <div key={task} style={{ alignItems: 'center', borderTop: i === 0 ? 'none' : `2px solid ${GRAY}44`, display: 'flex', gap: 28, opacity: o, padding: '24px 0', transform: `translateX(${(1 - o) * 30}px)` }}>
              <span style={{ alignItems: 'center', background: check > 0 ? TERRA : 'transparent', border: `3px solid ${check > 0 ? TERRA : GRAY}`, borderRadius: 99, display: 'flex', height: 46, justifyContent: 'center', width: 46 }}>
                <svg height={26} style={{ opacity: check }} viewBox="0 0 24 24" width={26}>
                  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" pathLength={1} stroke={WHITE} strokeDasharray={1} strokeDashoffset={1 - check} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
                </svg>
              </span>
              <span style={{ fontSize: 40, fontWeight: 600 }}>{task}</span>
            </div>
          )
        })}
      </Card>
    </Scene>
  )
}

// ─── 4. Contas bancárias ─────────────────────────────────────────────────────

function BankLogo({ crop = false, src }: { crop?: boolean; src: string }) {
  return (
    <span style={{ alignItems: 'center', display: 'flex', height: 64, justifyContent: crop ? 'flex-start' : 'center', overflow: 'hidden', width: 64 }}>
      <Img src={staticFile(src)} style={{ flex: 'none', height: crop ? 52 : 64, maxWidth: 'none', objectFit: 'contain', width: crop ? 'auto' : 64 }} />
    </span>
  )
}

const BANKS: { balance: number; logo: ReactNode; name: string }[] = [
  { balance: 84320.4, logo: <BankLogo src="brand-logos/banks/itau.svg" />, name: 'Itaú' },
  { balance: 21980.15, logo: <SiNubank color="#820ad1" size={64} />, name: 'Nubank' },
  { balance: 63410.0, logo: <BankLogo crop src="brand-logos/banks/santander.svg" />, name: 'Santander' },
  { balance: 47205.32, logo: <BankLogo crop src="brand-logos/banks/banco-do-brasil.svg" />, name: 'Banco do Brasil' },
  { balance: 39870.25, logo: <BankLogo crop src="brand-logos/banks/bradesco.svg" />, name: 'Bradesco' },
  { balance: 27604.0, logo: <SiMercadopago color="#00b1ea" size={64} />, name: 'Mercado Pago' },
]

function BankSyncScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const cx = 540
  const cy = 1000
  const radius = 300
  const total = BANKS.reduce((sum, bank) => sum + bank.balance, 0)
  const counted = total * p(frame, 48, 84, [0, 1], Easing.out(Easing.quad))
  const centerPop = useSpring(10)
  const connected = BANKS.filter((_, i) => frame >= 40 + i * 6).length

  return (
    <FeatureScene duration={duration} index={0} title="Sincroniza todas as suas contas bancárias.">
      <svg height={1920} style={{ left: 0, position: 'absolute', top: 0 }} width={1080}>
        {BANKS.map((bank, i) => {
          const angle = (-90 + i * 60) * (Math.PI / 180)
          const x = cx + Math.cos(angle) * radius
          const y = cy + Math.sin(angle) * radius
          const draw = p(frame, 22 + i * 6, 40 + i * 6, [0, 1], Easing.inOut(Easing.cubic))
          const t = frame > 44 + i * 6 ? ((frame - 44 - i * 6) % 26) / 26 : -1
          return (
            <g key={bank.name}>
              <line stroke={draw >= 1 ? TERRA : GRAY} strokeDasharray="1" strokeDashoffset={1 - draw} pathLength={1} strokeLinecap="round" strokeWidth={4} x1={x} x2={cx} y1={y} y2={cy} />
              {t >= 0 ? <circle cx={x + (cx - x) * t} cy={y + (cy - y) * t} fill={TERRA} opacity={1 - t * 0.6} r={9} /> : null}
            </g>
          )
        })}
      </svg>
      {BANKS.map((bank, i) => {
        const angle = (-90 + i * 60) * (Math.PI / 180)
        const x = cx + Math.cos(angle) * radius
        const y = cy + Math.sin(angle) * radius
        const s = spring({ config: { damping: 13, stiffness: 160 }, fps: 30, frame: frame - 14 - i * 5 })
        return (
          <div key={bank.name} style={{ alignItems: 'center', background: WHITE, border: `2px solid ${frame >= 40 + i * 6 ? TERRA : `${GRAY}88`}`, borderRadius: 99, boxShadow: '0 18px 40px rgba(20,20,19,0.08)', display: 'flex', height: 132, justifyContent: 'center', left: x - 66, position: 'absolute', top: y - 66, transform: `scale(${s})`, width: 132 }}>
            {bank.logo}
          </div>
        )
      })}
      <div style={{ alignItems: 'center', background: WHITE, border: `3px solid ${INK}`, borderRadius: 99, display: 'flex', height: 190, justifyContent: 'center', left: cx - 95, position: 'absolute', top: cy - 95, transform: `scale(${centerPop * (1 + Math.sin(frame / 5) * 0.015 * Math.min(connected, 1))})`, width: 190 }}>
        <OttoIcon size={110} />
      </div>
      <Card style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', left: 110, opacity: p(frame, 44, 56), padding: '30px 44px', right: 110, top: 1420 }}>
        <div>
          <span style={{ color: INK_MUTED, display: 'block', fontSize: 26, fontWeight: 600 }}>Saldo consolidado</span>
          <span style={{ display: 'block', fontFamily: SERIF, fontSize: 58, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{brl(counted)}</span>
        </div>
        <span style={{ background: TERRA_SOFT, borderRadius: 99, color: TERRA, fontSize: 26, fontWeight: 700, padding: '12px 22px' }}>{connected} contas</span>
      </Card>
    </FeatureScene>
  )
}

// ─── 5. Despesas ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = { Energia: INK, Fornecedores: GRAY, Marketing: '#ecbfa9', Software: TERRA }

const EXPENSES = [
  { category: 'Software', date: '03 out', name: 'Google Workspace', value: 389 },
  { category: 'Energia', date: '04 out', name: 'Enel Energia', value: 1460 },
  { category: 'Fornecedores', date: '05 out', name: 'Distribuidora Delta', value: 2640 },
  { category: 'Marketing', date: '06 out', name: 'Meta Ads', value: 1200 },
  { category: 'Software', date: '07 out', name: 'Amazon Web Services', value: 920 },
]

function ExpensesScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const totals = Object.keys(CATEGORY_COLORS).map((category) => ({
    category,
    value: EXPENSES.filter((e, i) => e.category === category && frame >= 24 + i * 10).reduce((sum, e) => sum + e.value, 0),
  }))
  const sum = Math.max(1, totals.reduce((acc, item) => acc + item.value, 0))

  return (
    <FeatureScene duration={duration} index={1} title="Categoriza suas despesas.">
      <Card style={{ left: 80, opacity: p(frame, 6, 18), padding: '14px 40px', right: 80, top: 520 }}>
        {EXPENSES.map((expense, i) => {
          const o = p(frame, 8 + i * 4, 20 + i * 4)
          const stamp = spring({ config: { damping: 11, stiffness: 190 }, fps: 30, frame: frame - 24 - i * 10 })
          const stamped = frame >= 24 + i * 10
          return (
            <div key={expense.name} style={{ alignItems: 'center', borderTop: i === 0 ? 'none' : `2px solid ${GRAY}44`, display: 'flex', gap: 24, opacity: o, padding: '26px 0' }}>
              <span style={{ alignItems: 'center', background: BG, borderRadius: 18, color: INK_MUTED, display: 'flex', fontSize: 24, fontWeight: 700, height: 72, justifyContent: 'center', width: 72 }}>
                {expense.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 34, fontWeight: 600 }}>{expense.name}</span>
                <span style={{ color: INK_MUTED, display: 'block', fontSize: 25, marginTop: 4 }}>{expense.date} · {brl(expense.value)}</span>
              </div>
              <div style={{ position: 'relative', width: 230 }}>
                <span style={{ border: `2px dashed ${GRAY}`, borderRadius: 99, color: GRAY, display: 'block', fontSize: 24, fontWeight: 600, opacity: stamped ? 0 : 1, padding: '10px 0', textAlign: 'center' }}>Classificando…</span>
                {stamped ? (
                  <span style={{ background: CATEGORY_COLORS[expense.category], borderRadius: 99, color: expense.category === 'Fornecedores' || expense.category === 'Marketing' ? INK : WHITE, fontSize: 25, fontWeight: 700, inset: 0, padding: '11px 0', position: 'absolute', textAlign: 'center', transform: `scale(${2 - stamp}) rotate(${(1 - stamp) * -10}deg)` }}>
                    {expense.category}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </Card>
      <div style={{ left: 80, opacity: p(frame, 26, 38), position: 'absolute', right: 80, top: 1370 }}>
        <div style={{ background: `${GRAY}55`, borderRadius: 99, display: 'flex', height: 34, overflow: 'hidden' }}>
          {totals.map((item) => (
            <div key={item.category} style={{ background: CATEGORY_COLORS[item.category], height: '100%', width: `${(item.value / sum) * 100}%` }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 30px', justifyContent: 'center', marginTop: 26 }}>
          {totals.map((item) => (
            <span key={item.category} style={{ alignItems: 'center', color: INK_MUTED, display: 'flex', fontSize: 26, fontWeight: 600, gap: 10 }}>
              <span style={{ background: CATEGORY_COLORS[item.category], borderRadius: 99, height: 18, width: 18 }} />
              {item.category}
            </span>
          ))}
        </div>
      </div>
    </FeatureScene>
  )
}

// ─── 6. Notas fiscais ────────────────────────────────────────────────────────

const INVOICE_FIELDS = [
  ['Tomador', 'Aurora Tecnologia Ltda'],
  ['Serviço', 'Consultoria financeira'],
  ['Competência', 'Outubro/2026'],
  ['Valor do serviço', 'R$ 4.000,00'],
  ['ISS (2%)', 'R$ 80,00'],
]

const INVOICE_STEPS = ['Validando', 'Enviando', 'Autorizada']

function InvoiceScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const stamp = spring({ config: { damping: 10, stiffness: 170 }, fps: 30, frame: frame - 70 })

  return (
    <FeatureScene duration={duration} index={2} title="Emite notas fiscais.">
      <Card style={{ left: 120, opacity: p(frame, 6, 18), padding: '46px 50px', right: 120, top: 520, transform: `translateY(${p(frame, 6, 22, [50, 0])}px) rotate(-1deg)` }}>
        <div style={{ alignItems: 'baseline', borderBottom: `2px solid ${GRAY}55`, display: 'flex', justifyContent: 'space-between', paddingBottom: 26 }}>
          <span style={{ fontFamily: SERIF, fontSize: 50, fontWeight: 600 }}>NFS-e</span>
          <span style={{ color: INK_MUTED, fontSize: 26, fontWeight: 600 }}>Nº 000.482</span>
        </div>
        {INVOICE_FIELDS.map(([label, value], i) => {
          const progress = p(frame, 14 + i * 7, 26 + i * 7, [0, 1], Easing.linear)
          return (
            <div key={label} style={{ borderBottom: `2px dashed ${GRAY}55`, padding: '22px 0' }}>
              <span style={{ color: INK_MUTED, display: 'block', fontSize: 23, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ display: 'block', fontSize: 36, fontWeight: i === 3 ? 700 : 560, marginTop: 6, minHeight: 44 }}>{typed(value, progress)}</span>
            </div>
          )
        })}
        <div style={{ alignItems: 'center', display: 'flex', gap: 14, marginTop: 34 }}>
          {INVOICE_STEPS.map((step, i) => {
            const active = frame >= 50 + i * 9
            return (
              <div key={step} style={{ alignItems: 'center', display: 'flex', flex: 1, gap: 12 }}>
                <span style={{ background: active ? TERRA : WHITE, border: `3px solid ${active ? TERRA : GRAY}`, borderRadius: 99, height: 26, width: 26 }} />
                <span style={{ color: active ? INK : GRAY, fontSize: 26, fontWeight: 650 }}>{step}</span>
              </div>
            )
          })}
        </div>
      </Card>
      {frame >= 70 ? (
        <div style={{ border: `6px solid ${TERRA}`, borderRadius: 18, color: TERRA, fontFamily: SERIF, fontSize: 66, fontWeight: 700, left: 520, letterSpacing: '0.06em', opacity: Math.min(1, stamp * 1.4), padding: '10px 30px', position: 'absolute', top: 1010, transform: `rotate(-9deg) scale(${2.2 - stamp * 1.2})` }}>
          EMITIDA
        </div>
      ) : null}
    </FeatureScene>
  )
}

// ─── 7. Conciliação ──────────────────────────────────────────────────────────

const STATEMENT = [
  { detail: 'PIX recebido', name: 'Itaú', value: 'R$ 4.800' },
  { detail: 'Cartão', name: 'Nubank PJ', value: 'R$ 920' },
  { detail: 'TED recebida', name: 'Santander', value: 'R$ 7.250' },
  { detail: 'Boleto pago', name: 'Bradesco', value: 'R$ 2.640' },
]
const LEDGER = [
  { detail: 'Cliente Aurora', name: 'Recebimento', value: 'R$ 7.250' },
  { detail: 'Venda #1842', name: 'Recebimento', value: 'R$ 4.800' },
  { detail: 'Distribuidora Delta', name: 'Pagamento', value: 'R$ 2.640' },
  { detail: 'Software', name: 'Despesa', value: 'R$ 920' },
]
const MATCHES = [1, 3, 0, 2]

function ReconciliationScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const rowTop = (i: number) => 640 + i * 170
  const rowH = 140
  const leftRight = 455
  const rightLeft = 625
  const done = MATCHES.filter((_, i) => frame >= 40 + i * 11).length

  const column = (title: string, rows: typeof STATEMENT, left: number, matchedAt: (i: number) => number) => (
    <>
      <span style={{ color: INK_MUTED, fontSize: 25, fontWeight: 700, left, letterSpacing: '0.08em', opacity: p(frame, 4, 14), position: 'absolute', textTransform: 'uppercase', top: 580, width: 400 }}>{title}</span>
      {rows.map((row, i) => {
        const o = p(frame, 6 + i * 4, 18 + i * 4)
        const matched = frame >= matchedAt(i)
        return (
          <Card key={row.detail} style={{ border: `2px solid ${matched ? TERRA : `${GRAY}66`}`, borderRadius: 26, height: rowH, left, opacity: o, padding: '24px 28px', top: rowTop(i) + (1 - o) * 30, width: 400 }}>
            <span style={{ color: INK_MUTED, display: 'block', fontSize: 24, fontWeight: 600 }}>{row.name} · {row.detail}</span>
            <span style={{ display: 'block', fontFamily: SERIF, fontSize: 44, fontWeight: 600, marginTop: 8 }}>{row.value}</span>
          </Card>
        )
      })}
    </>
  )

  return (
    <FeatureScene duration={duration} index={3} title="Faz a conciliação bancária.">
      {column('Extrato bancário', STATEMENT, 55, (i) => 40 + i * 11 + 12)}
      {column('Lançamentos Otto', LEDGER, rightLeft, (j) => {
        const i = MATCHES.indexOf(j)
        return 40 + i * 11 + 12
      })}
      <svg height={1920} style={{ left: 0, pointerEvents: 'none', position: 'absolute', top: 0 }} width={1080}>
        {MATCHES.map((j, i) => {
          const draw = p(frame, 40 + i * 11, 52 + i * 11, [0, 1], Easing.inOut(Easing.cubic))
          const y1 = rowTop(i) + rowH / 2
          const y2 = rowTop(j) + rowH / 2
          const mx = (leftRight + rightLeft) / 2
          const check = spring({ config: { damping: 12, stiffness: 180 }, fps: 30, frame: frame - 52 - i * 11 })
          return (
            <g key={i}>
              <path d={`M${leftRight} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${rightLeft} ${y2}`} fill="none" pathLength={1} stroke={draw >= 1 ? TERRA : GRAY} strokeDasharray={1} strokeDashoffset={1 - draw} strokeLinecap="round" strokeWidth={5} />
              {draw >= 1 ? (
                <g transform={`translate(${mx} ${(y1 + y2) / 2}) scale(${check})`}>
                  <circle fill={TERRA} r={22} />
                  <path d="M-9 1l6 6 12-13" fill="none" stroke={WHITE} strokeLinecap="round" strokeLinejoin="round" strokeWidth={4.5} />
                </g>
              ) : null}
            </g>
          )
        })}
      </svg>
      <div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 600, left: 0, opacity: p(frame, 36, 46), position: 'absolute', right: 0, textAlign: 'center', top: 1370 }}>
        <span style={{ color: TERRA }}>{done}</span> de 4 conciliados
      </div>
    </FeatureScene>
  )
}

// ─── 8. Cobrança no WhatsApp ─────────────────────────────────────────────────

function Bubble({ at, children, out }: { at: number; children: ReactNode; out?: boolean }) {
  const frame = useCurrentFrame()
  const s = spring({ config: { damping: 15, stiffness: 170 }, fps: 30, frame: frame - at })
  if (frame < at) return null
  return (
    <div style={{ alignSelf: out ? 'flex-end' : 'flex-start', background: out ? TERRA_SOFT : WHITE, borderRadius: out ? '28px 28px 8px 28px' : '28px 28px 28px 8px', boxShadow: '0 4px 12px rgba(20,20,19,0.05)', fontSize: 30, lineHeight: 1.3, maxWidth: '84%', opacity: s, padding: '20px 24px', transform: `translateY(${(1 - s) * 24}px) scale(${0.92 + s * 0.08})`, transformOrigin: out ? 'right bottom' : 'left bottom' }}>
      {children}
    </div>
  )
}

function WhatsAppScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const read = frame >= 46
  const typing = frame >= 50 && frame < 62
  const notify = spring({ config: { damping: 16, stiffness: 150 }, fps: 30, frame: frame - 70 })
  const ticks = <CheckCheck color={read ? TERRA : GRAY} size={26} strokeWidth={2.4} style={{ marginLeft: 8, verticalAlign: 'middle' }} />

  return (
    <FeatureScene duration={duration} index={4} title="Cobra seus clientes no WhatsApp.">
      <div style={{ background: INK, borderRadius: 72, height: 990, left: 220, opacity: p(frame, 4, 16), padding: 14, position: 'absolute', top: 540, transform: `translateY(${p(frame, 4, 20, [60, 0])}px)`, width: 640 }}>
        <div style={{ background: '#ece9e1', borderRadius: 60, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
          <div style={{ alignItems: 'center', background: WHITE, display: 'flex', gap: 18, padding: '64px 30px 24px' }}>
            <span style={{ alignItems: 'center', background: BG, border: `2px solid ${GRAY}88`, borderRadius: 99, color: INK_MUTED, display: 'flex', fontSize: 24, fontWeight: 700, height: 68, justifyContent: 'center', width: 68 }}>LC</span>
            <div>
              <span style={{ display: 'block', fontSize: 30, fontWeight: 650 }}>Lume Comércio</span>
              <span style={{ color: INK_MUTED, display: 'block', fontSize: 22 }}>{typing ? 'digitando…' : 'online'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 18, justifyContent: 'flex-end', padding: '24px 24px 40px' }}>
            <Bubble at={12} out>
              Olá, Lume! A fatura de <strong>R$ 2.480,00</strong> vence hoje.
              {ticks}
            </Bubble>
            <Bubble at={26} out>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { icon: <QrCode size={34} />, label: 'Pix copia e cola' },
                  { icon: <Barcode size={34} />, label: 'Boleto bancário' },
                ].map((item) => (
                  <div key={item.label} style={{ alignItems: 'center', background: WHITE, borderRadius: 18, display: 'flex', fontSize: 28, fontWeight: 600, gap: 16, padding: '16px 20px' }}>
                    <span style={{ color: TERRA, display: 'flex' }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'right' }}>{ticks}</div>
            </Bubble>
            {typing ? (
              <div style={{ alignSelf: 'flex-start', background: WHITE, borderRadius: 28, display: 'flex', gap: 10, padding: '24px 26px' }}>
                {[0, 1, 2].map((d) => (
                  <span key={d} style={{ background: GRAY, borderRadius: 99, height: 14, opacity: 0.4 + 0.6 * Math.abs(Math.sin((frame + d * 4) / 4)), width: 14 }} />
                ))}
              </div>
            ) : null}
            <Bubble at={62}>Pago! Obrigado pelo lembrete.</Bubble>
          </div>
          {frame >= 70 ? (
            <div style={{ alignItems: 'center', background: WHITE, borderRadius: 30, boxShadow: '0 20px 50px rgba(20,20,19,0.18)', display: 'flex', gap: 20, left: 18, padding: '22px 24px', position: 'absolute', right: 18, top: 18 + (1 - notify) * -180 }}>
              <span style={{ alignItems: 'center', background: BG, borderRadius: 18, display: 'flex', height: 70, justifyContent: 'center', width: 70 }}>
                <OttoIcon size={44} />
              </span>
              <div>
                <span style={{ display: 'block', fontSize: 26, fontWeight: 700 }}>Pagamento recebido</span>
                <span style={{ color: INK_MUTED, display: 'block', fontSize: 23 }}>Lume Comércio · R$ 2.480,00 · conciliado</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </FeatureScene>
  )
}

// ─── 9. Sem planilhas ────────────────────────────────────────────────────────

function NoSpreadsheetScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const cols = 6
  const rows = 8
  const cellW = 140
  const cellH = 58
  const gridLeft = (1080 - cols * cellW) / 2
  const gridTop = 560

  return (
    <Scene duration={duration}>
      <Headline size={100} start={0} text="Tudo no automático." style={{ top: 330 }} />
      {Array.from({ length: rows * cols }, (_, index) => {
        const r = Math.floor(index / cols)
        const c = index % cols
        const delay = 26 + random(`cell${index}`) * 30
        const fall = p(frame, delay, delay + 22, [0, 1], Easing.in(Easing.quad))
        const appear = p(frame, 4 + r * 1.5, 14 + r * 1.5)
        return (
          <div
            key={index}
            style={{
              alignItems: 'center',
              background: r === 0 ? `${GRAY}55` : WHITE,
              border: `1.5px solid ${GRAY}88`,
              color: r === 0 ? INK : INK_MUTED,
              display: 'flex',
              fontSize: 20,
              fontWeight: r === 0 ? 700 : 500,
              height: cellH,
              justifyContent: 'center',
              left: gridLeft + c * cellW,
              opacity: appear * (1 - fall),
              position: 'absolute',
              top: gridTop + r * cellH + fall * (380 + random(`fy${index}`) * 300),
              transform: `rotate(${fall * (random(`fr${index}`) - 0.5) * 70}deg)`,
              width: cellW,
            }}
          >
            {r === 0 ? String.fromCharCode(65 + c) : c === 0 ? `${r}` : (random(`v${index}`) * 9000).toFixed(0)}
          </div>
        )
      })}
      <Headline
        marks={[
          { at: 66, kind: 'strike', word: 'planilhas' },
          { at: 74, kind: 'strike', word: 'estresse' },
        ]}
        size={92}
        start={48}
        text="Sem planilhas, sem estresse."
        style={{ top: 1180 }}
      />
    </Scene>
  )
}

// ─── 10. ChatGPT ou Claude ───────────────────────────────────────────────────

function IntegrationScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const percent = Math.round(100 * p(frame, 4, 30, [0, 1], Easing.out(Easing.quad)))
  const ottoPop = useSpring(30)
  const nodes = [
    { cx: 300, logo: <Img src={staticFile('gptLogo.svg')} style={{ filter: 'brightness(0)', height: 62 }} /> },
    { cx: 780, logo: <Img src={staticFile('claudeLogo.svg')} style={{ height: 56 }} /> },
  ]

  return (
    <Scene duration={duration}>
      <div style={{ color: TERRA, fontFamily: SERIF, fontSize: 230, fontVariantNumeric: 'tabular-nums', fontWeight: 600, left: 0, letterSpacing: '-0.04em', lineHeight: 1, opacity: p(frame, 0, 8), position: 'absolute', right: 0, textAlign: 'center', top: 300 }}>
        {percent}%
      </div>
      <Headline size={82} start={10} text="integrado ao seu ChatGPT ou Claude." style={{ top: 570 }} />
      <svg height={1920} style={{ left: 0, position: 'absolute', top: 0 }} width={1080}>
        {nodes.map((node, i) => {
          const draw = p(frame, 34 + i * 4, 50 + i * 4, [0, 1], Easing.inOut(Easing.cubic))
          const t = frame > 52 ? ((frame - 52 + i * 10) % 24) / 24 : -1
          const x1 = node.cx
          const y1 = 1100
          const x2 = 540
          const y2 = 1290
          return (
            <g key={i}>
              <path d={`M${x1} ${y1} C ${x1} ${y1 + 110}, ${x2} ${y2 - 110}, ${x2} ${y2}`} fill="none" pathLength={1} stroke={draw >= 1 ? TERRA : GRAY} strokeDasharray={1} strokeDashoffset={1 - draw} strokeLinecap="round" strokeWidth={4} />
              {t >= 0 ? <circle cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} fill={TERRA} r={8} /> : null}
            </g>
          )
        })}
      </svg>
      {nodes.map((node, i) => {
        const s = spring({ config: { damping: 13, stiffness: 160 }, fps: 30, frame: frame - 20 - i * 5 })
        return (
          <Card key={node.cx} style={{ alignItems: 'center', display: 'flex', height: 170, justifyContent: 'center', left: node.cx - 200, top: 930, transform: `scale(${s})`, width: 400 }}>
            {node.logo}
          </Card>
        )
      })}
      <div style={{ alignItems: 'center', background: WHITE, border: `3px solid ${INK}`, borderRadius: 99, display: 'flex', height: 180, justifyContent: 'center', left: 450, position: 'absolute', top: 1290, transform: `scale(${ottoPop})`, width: 180 }}>
        <OttoIcon size={104} />
      </div>
    </Scene>
  )
}

// ─── 11. CTA ─────────────────────────────────────────────────────────────────

function CtaScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const pill = useSpring(18, { damping: 11, stiffness: 140 })
  const pulse = frame > 40 ? 1 + Math.sin((frame - 40) / 5) * 0.025 : 1
  const comment = typed('Financeiro', p(frame, 44, 62, [0, 1], Easing.linear))
  const sent = frame >= 68

  return (
    <Scene duration={duration}>
      <Headline size={100} start={0} text="Quer ver como funciona?" style={{ top: 400 }} />
      <span style={{ color: INK_MUTED, fontSize: 44, fontWeight: 600, left: 0, opacity: p(frame, 14, 24), position: 'absolute', right: 0, textAlign: 'center', top: 720 }}>Comenta</span>
      <div style={{ display: 'flex', justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 800 }}>
        <span style={{ background: TERRA, borderRadius: 28, boxShadow: '0 24px 60px rgba(217,119,87,0.35)', color: WHITE, fontFamily: SANS, fontSize: 96, fontWeight: 800, letterSpacing: '0.02em', padding: '22px 56px', transform: `scale(${pill * pulse})` }}>
          FINANCEIRO
        </span>
      </div>
      <Card style={{ alignItems: 'center', borderRadius: 99, display: 'flex', gap: 22, left: 120, opacity: p(frame, 36, 46), padding: '20px 24px 20px 20px', right: 120, top: 1110 }}>
        <span style={{ background: `${GRAY}88`, borderRadius: 99, flex: 'none', height: 72, width: 72 }} />
        <span style={{ color: comment ? INK : GRAY, flex: 1, fontSize: 36, fontWeight: 500 }}>
          {sent ? '' : comment || 'Adicione um comentário…'}
          {!sent && frame % 16 < 9 && frame >= 44 ? <span style={{ background: INK, display: 'inline-block', height: 38, marginLeft: 3, verticalAlign: 'middle', width: 3 }} /> : null}
          {sent ? <span style={{ color: INK_MUTED }}>Comentário publicado ✓</span> : null}
        </span>
        <span style={{ color: frame >= 62 ? TERRA : GRAY, fontSize: 32, fontWeight: 700 }}>Publicar</span>
      </Card>
      <span style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 500, left: 0, opacity: p(frame, 70, 82), position: 'absolute', right: 0, textAlign: 'center', top: 1310, transform: `translateY(${p(frame, 70, 84, [20, 0])}px)` }}>
        que te mando o link.
      </span>
      <div style={{ display: 'flex', justifyContent: 'center', left: 0, opacity: p(frame, 80, 92), position: 'absolute', right: 0, top: 1490 }}>
        <Img src={staticFile('logoOtto.svg')} style={{ height: 90, width: 210 }} />
      </div>
    </Scene>
  )
}

// ─── Timeline ────────────────────────────────────────────────────────────────

const SCENES: { Component: (props: { duration: number }) => ReactNode; duration: number }[] = [
  { Component: HookScene, duration: 105 },
  { Component: NameScene, duration: 66 },
  { Component: PromiseScene, duration: 100 },
  { Component: BankSyncScene, duration: 100 },
  { Component: ExpensesScene, duration: 95 },
  { Component: InvoiceScene, duration: 100 },
  { Component: ReconciliationScene, duration: 100 },
  { Component: WhatsAppScene, duration: 105 },
  { Component: NoSpreadsheetScene, duration: 100 },
  { Component: IntegrationScene, duration: 90 },
  { Component: CtaScene, duration: 120 },
]

export const OTTO_CONTADORES_REEL_DURATION = SCENES.reduce((sum, scene) => sum + scene.duration, 0)

export function OttoContadoresReel() {
  const [handle] = useState(() => delayRender('Loading Source Serif 4'))

  useEffect(() => {
    const promise = loadSerifFont() ?? Promise.resolve()
    promise.then(() => continueRender(handle))
  }, [handle])

  return (
    <AbsoluteFill style={{ background: BG }}>
      <GridBackground />
      <Series>
        {SCENES.map(({ Component, duration }, index) => (
          <Series.Sequence durationInFrames={duration} key={index}>
            <Component duration={duration} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  )
}
