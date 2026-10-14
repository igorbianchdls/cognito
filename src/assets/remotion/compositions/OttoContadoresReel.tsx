import { SiGoogle, SiMercadopago, SiMeta, SiNotion, SiNubank, SiShell, SiVivo } from '@icons-pack/react-simple-icons'
import { ArrowLeftRight, BatteryFull, Camera, CheckCheck, ChevronLeft, Copy, FileText, Landmark, MessageCircle, Mic, Phone, Plus, ReceiptText, Signal, Sticker, Tags, Video, Wifi } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import {
  AbsoluteFill,
  Audio,
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

export const BG = '#f5f4ef'
export const INK = '#141413'
export const WHITE = '#ffffff'
export const TERRA = '#d97757'
export const GRAY = '#b8bab2'
export const TERRA_SOFT = '#f6e4da'
export const INK_MUTED = '#6b6c66'

export const DISPLAY = '"Instrument Serif", Georgia, "Times New Roman", serif'
export const SERIF = '"Newsreader", Georgia, "Times New Roman", serif'
export const SANS = IOS_REMOTION_FONT_STACK

let serifFontPromise: Promise<void> | null = null

function loadSerifFont() {
  if (serifFontPromise || typeof document === 'undefined' || typeof FontFace === 'undefined') {
    return serifFontPromise
  }

  const fonts = [
    new FontFace('Newsreader', `url("${staticFile('remotion/fonts/newsreader/Newsreader-Variable.ttf')}") format("truetype")`, { style: 'normal', weight: '200 800' }),
    new FontFace('Instrument Serif', `url("${staticFile('remotion/fonts/instrument-serif/InstrumentSerif-Regular.ttf')}") format("truetype")`, { style: 'normal', weight: '400' }),
    new FontFace('Instrument Serif', `url("${staticFile('remotion/fonts/instrument-serif/InstrumentSerif-Italic.ttf')}") format("truetype")`, { style: 'italic', weight: '400' }),
  ]
  fonts.forEach((font) => document.fonts.add(font))
  serifFontPromise = Promise.race([Promise.all(fonts.map((font) => font.load())), new Promise((resolve) => window.setTimeout(resolve, 4000))])
    .then(() => undefined)
    .catch(() => undefined)

  return serifFontPromise
}

/**
 * Scenes are authored on a nominal timeline (`duration` frames). When a scene is synced to narration
 * it plays for `actual` frames instead, and this context stretches its clock so the authored animation
 * fits the spoken segment exactly.
 */
const SceneSpeedContext = createContext(1)

export function useFrame() {
  return useCurrentFrame() * useContext(SceneSpeedContext)
}

export function p(frame: number, from: number, to: number, output: [number, number] = [0, 1], easing = Easing.out(Easing.cubic)) {
  return interpolate(frame, [from, to], output, { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

export function typed(text: string, progress: number) {
  return text.slice(0, Math.floor(text.length * progress))
}

export function brl(value: number) {
  return value.toLocaleString('pt-BR', { currency: 'BRL', style: 'currency' })
}

export function useSpring(delay: number, config = { damping: 14, stiffness: 150 }) {
  const frame = useFrame()
  const { fps } = useVideoConfig()
  return spring({ config, fps, frame: frame - delay })
}

const normalize = (word: string) => word.toLowerCase().replace(/[.,!?]/g, '')

// ─── Primitives ──────────────────────────────────────────────────────────────

export function Scene({ children, duration }: { children: ReactNode; duration: number }) {
  const frame = useFrame()
  const opacity = p(frame, 0, 10) * p(frame, duration - 10, duration, [1, 0])
  const y = p(frame, 0, 14, [18, 0])

  return (
    <AbsoluteFill style={{ color: INK, fontFamily: SANS, opacity, overflow: 'hidden', transform: `translateY(${y}px)` }}>
      {children}
    </AbsoluteFill>
  )
}

const GRID_SIZE = 60
const GRID_LINE = `${GRAY}3d`
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

export function Headline({ highlight = [], marks = [], size = 88, start = 0, stagger = 3, style, text }: HeadlineProps) {
  const frame = useFrame()
  const words = text.split(' ')

  return (
    <div
      style={{
        color: INK,
        fontFamily: DISPLAY,
        fontSize: size * 1.18,
        fontWeight: 400,
        left: 70,
        letterSpacing: '-0.015em',
        lineHeight: 1.02,
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
              fontStyle: highlight.includes(key) ? 'italic' : 'normal',
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

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
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

export function OttoIcon({ size }: { size: number }) {
  return <Img src={staticFile('logoOttoIcon.svg')} style={{ display: 'block', height: size, width: size }} />
}

const TASKS = ['Contas bancárias', 'Despesas', 'Notas fiscais', 'Conciliação bancária', 'Cobrança no WhatsApp']

function ProgressTracker({ duration, index, tasks = TASKS }: { duration: number; index: number; tasks?: string[] }) {
  const frame = useFrame()
  const fill = p(frame, 12, duration - 22, [0, 1], Easing.inOut(Easing.quad))
  if (tasks.length === 0) return null

  return (
    <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 18, left: 0, position: 'absolute', right: 0, top: 150 }}>
      <span style={{ color: INK_MUTED, fontSize: 28, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {String(index + 1).padStart(2, '0')} / {String(tasks.length).padStart(2, '0')} · {tasks[index]}
      </span>
      <div style={{ display: 'flex', gap: 12 }}>
        {tasks.map((task, i) => (
          <div key={task} style={{ background: `${GRAY}88`, borderRadius: 99, height: 8, overflow: 'hidden', width: (TASKS.length * 140 - 12) / tasks.length - 12 }}>
            <div style={{ background: TERRA, height: '100%', width: `${(i < index ? 1 : i === index ? fill : 0) * 100}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export type FeatureSceneProps = { duration: number; index?: number; tasks?: string[]; title?: string }

function FeatureScene({ children, duration, index, tasks, title }: { children: ReactNode; duration: number; index: number; tasks?: string[]; title: string }) {
  return (
    <Scene duration={duration}>
      <ProgressTracker duration={duration} index={index} tasks={tasks} />
      <Headline size={84} start={4} text={title} style={{ top: 270 }} />
      {children}
    </Scene>
  )
}

// ─── 1. Hook ─────────────────────────────────────────────────────────────────

function Receipt({ seed, duration }: { duration: number; seed: number }) {
  const frame = useFrame()
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
  const frame = useFrame()
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
      <span style={{ color: INK_MUTED, fontSize: 40, fontWeight: 600, left: 0, letterSpacing: '0.01em', opacity: p(frame, 46, 60), position: 'absolute', right: 0, textAlign: 'center', top: 1240, transform: `translateY(${p(frame, 46, 62, [16, 0])}px)` }}>
        Sistema de gestão com IA
      </span>
    </Scene>
  )
}

// ─── 3. Promessa: hub do Otto ────────────────────────────────────────────────

const HUB_TASKS: { bg: string; color: string; icon: ReactNode; label: string; suffix: string; value: number }[] = [
  { bg: '#e3ecfb', color: '#2f6bd8', icon: <Landmark size={34} strokeWidth={2} />, label: 'Contas bancárias', suffix: 'sincronizadas', value: 6 },
  { bg: '#fcf0d6', color: '#c98a0c', icon: <Tags size={34} strokeWidth={2} />, label: 'Despesas', suffix: 'categorizadas', value: 248 },
  { bg: '#eee7fb', color: '#7b4fd6', icon: <ReceiptText size={34} strokeWidth={2} />, label: 'Notas fiscais', suffix: 'emitidas', value: 142 },
  { bg: '#ddf2ec', color: '#14946b', icon: <ArrowLeftRight size={34} strokeWidth={2} />, label: 'Conciliação', suffix: 'lançamentos', value: 1204 },
  { bg: TERRA_SOFT, color: TERRA, icon: <MessageCircle size={34} strokeWidth={2} />, label: 'Cobranças', suffix: 'no WhatsApp', value: 38 },
]

function PromiseScene({ duration }: { duration: number }) {
  const frame = useFrame()
  const cx = 540
  const cy = 1090
  const radius = 340
  const hubPop = useSpring(12, { damping: 12, stiffness: 140 })
  const nodes = HUB_TASKS.map((task, i) => {
    const angle = (-90 + i * 72) * (Math.PI / 180)
    return { ...task, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
  })

  return (
    <Scene duration={duration}>
      <Headline highlight={['financeiro']} size={92} start={2} text="Ela automatiza todo o financeiro de uma empresa." style={{ top: 270 }} />

      <svg height={1920} style={{ left: 0, position: 'absolute', top: 0 }} width={1080}>
        {[0, 1, 2].map((k) => {
          if (frame < 22) return null
          const phase = ((frame - 22 + k * 14) % 42) / 42
          return <circle cx={cx} cy={cy} fill="none" key={k} opacity={(1 - phase) * 0.45} r={105 + phase * 150} stroke={TERRA} strokeWidth={2.5} />
        })}
        {nodes.map((node, i) => {
          const draw = p(frame, 24 + i * 5, 40 + i * 5, [0, 1], Easing.inOut(Easing.cubic))
          const t = frame > 42 + i * 5 ? ((frame - 42 - i * 5) % 24) / 24 : -1
          return (
            <g key={node.label}>
              <line pathLength={1} stroke={draw >= 1 ? TERRA : GRAY} strokeDasharray={1} strokeDashoffset={1 - draw} strokeLinecap="round" strokeWidth={4} x1={cx} x2={cx + (node.x - cx) * 0.999} y1={cy} y2={node.y} />
              {t >= 0 ? <circle cx={cx + (node.x - cx) * t} cy={cy + (node.y - cy) * t} fill={TERRA} opacity={1 - t * 0.5} r={9} /> : null}
            </g>
          )
        })}
      </svg>

      {nodes.map((node, i) => {
        const pop = spring({ config: { damping: 13, stiffness: 160 }, fps: 30, frame: frame - 30 - i * 5 })
        const count = Math.round(node.value * p(frame, 38 + i * 5, 74 + i * 5, [0, 1], Easing.out(Easing.quad)))
        const check = spring({ config: { damping: 11, stiffness: 200 }, fps: 30, frame: frame - 76 - i * 3 })
        return (
          <div key={node.label} style={{ background: WHITE, border: `2px solid ${frame >= 76 + i * 3 ? TERRA : `${GRAY}88`}`, borderRadius: 30, boxShadow: '0 22px 50px rgba(20,20,19,0.08)', left: node.x - 135, padding: '22px 22px 20px', position: 'absolute', top: node.y - 82, transform: `scale(${pop})`, width: 270 }}>
            <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
              <span style={{ alignItems: 'center', background: node.bg, borderRadius: 16, color: node.color, display: 'flex', flex: 'none', height: 56, justifyContent: 'center', width: 56 }}>{node.icon}</span>
              <span style={{ fontSize: 25, fontWeight: 650, lineHeight: 1.15 }}>{node.label}</span>
            </div>
            <div style={{ alignItems: 'baseline', display: 'flex', gap: 10, marginTop: 14 }}>
              <span style={{ fontFamily: SANS, fontSize: 44, fontVariantNumeric: 'tabular-nums', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1 }}>{count.toLocaleString('pt-BR')}</span>
              <span style={{ color: INK_MUTED, fontSize: 21, fontWeight: 600 }}>{node.suffix}</span>
            </div>
            {frame >= 76 + i * 3 ? (
              <span style={{ alignItems: 'center', background: TERRA, borderRadius: 99, display: 'flex', height: 44, justifyContent: 'center', position: 'absolute', right: -14, top: -14, transform: `scale(${check})`, width: 44 }}>
                <svg height={24} viewBox="0 0 24 24" width={24}>
                  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={WHITE} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
                </svg>
              </span>
            ) : null}
          </div>
        )
      })}

      <div style={{ alignItems: 'center', background: WHITE, border: `3px solid ${INK}`, borderRadius: 99, boxShadow: '0 26px 60px rgba(20,20,19,0.12)', display: 'flex', height: 210, justifyContent: 'center', left: cx - 105, position: 'absolute', top: cy - 105, transform: `scale(${hubPop * (frame > 44 ? 1 + Math.sin(frame / 5) * 0.012 : 1)})`, width: 210 }}>
        <OttoIcon size={120} />
      </div>
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
  const frame = useFrame()
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
          <span style={{ display: 'block', fontFamily: SANS, fontSize: 54, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', marginTop: 4 }}>{brl(counted)}</span>
        </div>
        <span style={{ background: TERRA_SOFT, borderRadius: 99, color: TERRA, fontSize: 26, fontWeight: 700, padding: '12px 22px' }}>{connected} contas</span>
      </Card>
    </FeatureScene>
  )
}

// ─── 5. Despesas ─────────────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<string, string> = { Combustível: GRAY, Marketing: '#ecbfa9', Software: TERRA, Telefonia: INK }

export const EXPENSES: { category: string; date: string; logo: ReactNode; name: string; value: number }[] = [
  { category: 'Software', date: '03 out', logo: <SiGoogle color="#4285f4" size={40} />, name: 'Google Workspace', value: 389 },
  { category: 'Telefonia', date: '04 out', logo: <SiVivo color="#660099" size={40} />, name: 'Vivo Empresas', value: 459 },
  { category: 'Combustível', date: '05 out', logo: <SiShell color="#dd1d21" size={40} />, name: 'Posto Shell', value: 640 },
  { category: 'Marketing', date: '06 out', logo: <SiMeta color="#0467df" size={40} />, name: 'Meta Ads', value: 1200 },
  { category: 'Software', date: '07 out', logo: <SiNotion color="#000000" size={38} />, name: 'Notion', value: 920 },
]

export function ExpensesScene({ duration, index = 1, tasks, title = 'Categoriza suas despesas.' }: FeatureSceneProps) {
  const frame = useFrame()
  const totals = Object.keys(CATEGORY_COLORS).map((category) => ({
    category,
    value: EXPENSES.filter((e, i) => e.category === category && frame >= 24 + i * 10).reduce((sum, e) => sum + e.value, 0),
  }))
  const sum = Math.max(1, totals.reduce((acc, item) => acc + item.value, 0))

  return (
    <FeatureScene duration={duration} index={index} tasks={tasks} title={title}>
      <Card style={{ left: 80, opacity: p(frame, 6, 18), padding: '14px 40px', right: 80, top: 520 }}>
        {EXPENSES.map((expense, i) => {
          const o = p(frame, 8 + i * 4, 20 + i * 4)
          const stamp = spring({ config: { damping: 11, stiffness: 190 }, fps: 30, frame: frame - 24 - i * 10 })
          const stamped = frame >= 24 + i * 10
          return (
            <div key={expense.name} style={{ alignItems: 'center', borderTop: i === 0 ? 'none' : `2px solid ${GRAY}44`, display: 'flex', gap: 24, opacity: o, padding: '26px 0' }}>
              <span style={{ alignItems: 'center', background: WHITE, border: `2px solid ${GRAY}66`, borderRadius: 18, display: 'flex', flex: 'none', height: 72, justifyContent: 'center', width: 72 }}>
                {expense.logo}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 34, fontWeight: 600 }}>{expense.name}</span>
                <span style={{ color: INK_MUTED, display: 'block', fontSize: 25, marginTop: 4 }}>{expense.date} · {brl(expense.value)}</span>
              </div>
              <div style={{ position: 'relative', width: 230 }}>
                <span style={{ border: `2px dashed ${GRAY}`, borderRadius: 99, color: GRAY, display: 'block', fontSize: 24, fontWeight: 600, opacity: stamped ? 0 : 1, padding: '10px 0', textAlign: 'center' }}>Classificando…</span>
                {stamped ? (
                  <span style={{ background: CATEGORY_COLORS[expense.category], borderRadius: 99, color: expense.category === 'Combustível' || expense.category === 'Marketing' ? INK : WHITE, fontSize: 25, fontWeight: 700, inset: 0, padding: '11px 0', position: 'absolute', textAlign: 'center', transform: `scale(${2 - stamp}) rotate(${(1 - stamp) * -10}deg)` }}>
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

export function InvoiceScene({ duration, index = 2, tasks, title = 'Emite notas fiscais.' }: FeatureSceneProps) {
  const frame = useFrame()
  const stamp = spring({ config: { damping: 10, stiffness: 170 }, fps: 30, frame: frame - 70 })

  return (
    <FeatureScene duration={duration} index={index} tasks={tasks} title={title}>
      <Card style={{ left: 120, opacity: p(frame, 6, 18), padding: '46px 50px', right: 120, top: 520, transform: `translateY(${p(frame, 6, 22, [50, 0])}px) rotate(-1deg)` }}>
        <div style={{ alignItems: 'baseline', borderBottom: `2px solid ${GRAY}55`, display: 'flex', justifyContent: 'space-between', paddingBottom: 26 }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 62, fontWeight: 400 }}>NFS-e</span>
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

export function ReconciliationScene({ duration, index = 3, tasks, title = 'Faz a conciliação bancária.' }: FeatureSceneProps) {
  const frame = useFrame()
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
            <span style={{ display: 'block', fontFamily: SANS, fontSize: 42, fontVariantNumeric: 'tabular-nums', fontWeight: 700, letterSpacing: '-0.01em', marginTop: 8 }}>{row.value}</span>
          </Card>
        )
      })}
    </>
  )

  return (
    <FeatureScene duration={duration} index={index} tasks={tasks} title={title}>
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
      <div style={{ fontFamily: DISPLAY, fontSize: 64, fontWeight: 400, left: 0, opacity: p(frame, 36, 46), position: 'absolute', right: 0, textAlign: 'center', top: 1370 }}>
        <span style={{ color: TERRA, fontStyle: 'italic' }}>{done}</span> de 4 conciliados
      </div>
    </FeatureScene>
  )
}

// ─── 8. Cobrança no WhatsApp ─────────────────────────────────────────────────

export const WA = {
  bar: '#f6f5f3',
  bg: '#efeae2',
  button: '#027eb5',
  divider: '#d1d7db',
  incoming: '#ffffff',
  meta: '#667781',
  outgoing: '#d9fdd3',
  text: '#111b21',
  tick: '#8696a0',
  tickRead: '#53bdeb',
}

export const WA_DOODLE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' fill='none' stroke='#5b5346' stroke-opacity='0.09' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><circle cx='30' cy='32' r='12'/><rect x='82' y='20' width='22' height='16' rx='4'/><path d='M140 30 q10 -14 20 0 t20 0'/><path d='M24 104 l12 -18 l12 18 z'/><path d='M92 92 l4 9 l10 1 l-7 7 l2 10 l-9 -5 l-9 5 l2 -10 l-7 -7 l10 -1 z'/><circle cx='156' cy='104' r='6'/><circle cx='172' cy='90' r='3'/><path d='M20 170 q14 -12 28 0'/><path d='M100 156 v22 M89 167 h22'/><path d='M146 156 l18 18 M164 156 l-18 18'/></svg>`,
)}")`

export function WaBubble({ at, buttons, children, out, read, tail, time }: { at: number; buttons?: { icon: ReactNode; label: string }[]; children: ReactNode; out?: boolean; read?: boolean; tail?: boolean; time: string }) {
  const frame = useFrame()
  const s = spring({ config: { damping: 16, stiffness: 180 }, fps: 30, frame: frame - at })
  if (frame < at) return null
  const background = out ? WA.outgoing : WA.incoming

  return (
    <div style={{ alignSelf: out ? 'flex-end' : 'flex-start', maxWidth: '80%', opacity: s, position: 'relative', transform: `translateY(${(1 - s) * 20}px) scale(${0.94 + s * 0.06})`, transformOrigin: out ? 'right bottom' : 'left bottom' }}>
      {tail ? (
        <svg height={22} style={{ position: 'absolute', top: 0, [out ? 'right' : 'left']: -13 }} viewBox="0 0 8 13" width={14}>
          <path d={out ? 'M0 0 H8 L0 12 Z' : 'M8 0 H0 L8 12 Z'} fill={background} />
        </svg>
      ) : null}
      <div style={{ background, borderRadius: 20, borderTopLeftRadius: !out && tail ? 0 : 20, borderTopRightRadius: out && tail ? 0 : 20, boxShadow: '0 1px 1.5px rgba(11,20,26,0.14)', color: WA.text, fontSize: 28, lineHeight: 1.3, padding: '12px 18px 10px' }}>
        {children}
        <span style={{ alignItems: 'center', color: WA.meta, display: 'inline-flex', float: 'right', fontSize: 19, gap: 5, margin: '12px 0 -4px 16px' }}>
          {time}
          {out ? <CheckCheck color={read ? WA.tickRead : WA.tick} size={22} strokeWidth={2.4} /> : null}
        </span>
      </div>
      {buttons?.map((button) => (
        <div key={button.label} style={{ alignItems: 'center', background, borderRadius: 18, boxShadow: '0 1px 1.5px rgba(11,20,26,0.14)', color: WA.button, display: 'flex', fontSize: 27, fontWeight: 500, gap: 12, justifyContent: 'center', marginTop: 4, padding: '16px 0' }}>
          {button.icon}
          {button.label}
        </div>
      ))}
    </div>
  )
}

const WA_ICON = { color: WA.text, strokeWidth: 1.9 }

export function PhoneFrame({ background = WA.bg, children, style }: { background?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: '#1c1c1e', border: '2px solid #3a3a3c', borderRadius: 86, boxShadow: '0 40px 90px rgba(20,20,19,0.22)', height: 1070, left: 210, padding: 14, position: 'absolute', top: 510, width: 660, ...style }}>
      <div style={{ background, backgroundImage: background === WA.bg ? WA_DOODLE : undefined, borderRadius: 72, display: 'flex', flexDirection: 'column', fontFamily: SANS, height: '100%', overflow: 'hidden', position: 'relative' }}>
        <div style={{ alignItems: 'center', background: WA.bar, color: WA.text, display: 'flex', flex: 'none', fontSize: 27, fontWeight: 600, height: 94, justifyContent: 'space-between', padding: '20px 46px 0 66px' }}>
          <span>9:41</span>
          <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
            <Signal size={26} strokeWidth={2.6} />
            <Wifi size={26} strokeWidth={2.6} />
            <BatteryFull size={34} strokeWidth={2} />
          </span>
        </div>
        <div style={{ background: '#000', borderRadius: 99, height: 56, left: '50%', position: 'absolute', top: 20, transform: 'translateX(-50%)', width: 196 }} />
        {children}
        <div style={{ background: '#000', borderRadius: 99, bottom: 14, height: 8, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 220 }} />
      </div>
    </div>
  )
}

export function WaChatHeader({ initials, name, status }: { initials: string; name: string; status: string }) {
  return (
    <div style={{ alignItems: 'center', background: WA.bar, borderBottom: `1px solid ${WA.divider}`, display: 'flex', flex: 'none', gap: 12, padding: '4px 30px 16px 10px' }}>
      <ChevronLeft size={46} {...WA_ICON} />
      <span style={{ alignItems: 'center', background: '#dfe5e7', borderRadius: 99, color: '#54656f', display: 'flex', fontSize: 23, fontWeight: 700, height: 62, justifyContent: 'center', width: 62 }}>{initials}</span>
      <div style={{ flex: 1, marginLeft: 6 }}>
        <span style={{ color: WA.text, display: 'block', fontSize: 28, fontWeight: 600 }}>{name}</span>
        <span style={{ color: WA.meta, display: 'block', fontSize: 21 }}>{status}</span>
      </div>
      <Video size={36} {...WA_ICON} style={{ marginRight: 20 }} />
      <Phone size={30} {...WA_ICON} />
    </div>
  )
}

export function WaInputBar() {
  return (
    <div style={{ alignItems: 'center', background: WA.bar, display: 'flex', flex: 'none', gap: 18, padding: '14px 24px 48px' }}>
      <Plus size={40} {...WA_ICON} />
      <div style={{ alignItems: 'center', background: WA.incoming, border: `1px solid ${WA.divider}`, borderRadius: 99, display: 'flex', flex: 1, height: 62, justifyContent: 'flex-end', padding: '0 18px' }}>
        <Sticker size={28} color={WA.meta} strokeWidth={1.9} />
      </div>
      <Camera size={36} {...WA_ICON} />
      <Mic size={34} {...WA_ICON} />
    </div>
  )
}

export function WaTyping() {
  const frame = useFrame()
  return (
    <div style={{ alignSelf: 'flex-start', background: WA.incoming, borderRadius: 20, borderTopLeftRadius: 0, boxShadow: '0 1px 1.5px rgba(11,20,26,0.14)', display: 'flex', gap: 9, marginTop: 8, padding: '22px 24px' }}>
      {[0, 1, 2].map((d) => (
        <span key={d} style={{ background: WA.tick, borderRadius: 99, height: 13, opacity: 0.35 + 0.65 * Math.abs(Math.sin((frame + d * 4) / 4)), width: 13 }} />
      ))}
    </div>
  )
}

export function OttoNotification({ at, text }: { at: number; text: string }) {
  const frame = useFrame()
  const notify = spring({ config: { damping: 16, stiffness: 140 }, fps: 30, frame: frame - at })
  if (frame < at) return null
  return (
    <div style={{ alignItems: 'center', background: 'rgba(250,250,250,0.96)', borderRadius: 40, boxShadow: '0 18px 50px rgba(0,0,0,0.2)', display: 'flex', gap: 18, left: 16, padding: '22px 26px', position: 'absolute', right: 16, top: 16 + (1 - notify) * -200 }}>
      <span style={{ alignItems: 'center', background: WHITE, border: `1px solid ${GRAY}88`, borderRadius: 18, display: 'flex', flex: 'none', height: 68, justifyContent: 'center', width: 68 }}>
        <OttoIcon size={44} />
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ alignItems: 'baseline', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#000', fontSize: 25, fontWeight: 650 }}>Otto</span>
          <span style={{ color: '#8a8a8e', fontSize: 20 }}>agora</span>
        </div>
        <span style={{ color: '#000', display: 'block', fontSize: 23, lineHeight: 1.25, marginTop: 2 }}>{text}</span>
      </div>
    </div>
  )
}

export function WhatsAppScene({ duration, index = 4, tasks, title = 'Cobra seus clientes no WhatsApp.' }: FeatureSceneProps) {
  const frame = useFrame()
  const read = frame >= 44
  const typing = frame >= 48 && frame < 62

  return (
    <FeatureScene duration={duration} index={index} tasks={tasks} title={title}>
      <PhoneFrame style={{ opacity: p(frame, 4, 16), transform: `translateY(${p(frame, 4, 20, [60, 0])}px)` }}>
        <WaChatHeader initials="LC" name="Lume Comércio" status={typing ? 'digitando…' : 'online'} />
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 8, justifyContent: 'flex-end', padding: '18px 30px 18px' }}>
          <span style={{ alignSelf: 'center', background: WA.incoming, borderRadius: 12, boxShadow: '0 1px 1px rgba(11,20,26,0.1)', color: WA.meta, fontSize: 19, fontWeight: 500, marginBottom: 'auto', padding: '7px 16px' }}>Hoje</span>
          <WaBubble at={10} out read={read} tail time="10:42">
            Olá, Lume! Tudo bem? Sua fatura de <strong>R$ 2.480,00</strong> vence hoje.
          </WaBubble>
          <WaBubble
            at={22}
            buttons={[
              { icon: <Copy size={26} strokeWidth={2.2} />, label: 'Copiar código Pix' },
              { icon: <FileText size={26} strokeWidth={2.2} />, label: 'Ver boleto' },
            ]}
            out
            read={read}
            time="10:42"
          >
            Escolha como prefere pagar:
          </WaBubble>
          {typing ? <WaTyping /> : null}
          {frame >= 62 ? <div style={{ height: 8 }} /> : null}
          <WaBubble at={62} tail time="10:44">
            Pago! Obrigado pelo lembrete.
          </WaBubble>
        </div>
        <WaInputBar />
        <OttoNotification at={72} text="Pagamento recebido: R$ 2.480,00 de Lume Comércio. Já conciliado." />
      </PhoneFrame>
    </FeatureScene>
  )
}

// ─── 9. Sem planilhas: planilha → Otto ───────────────────────────────────────

const SHEET_COLS = 6
const SHEET_ROWS = 8
const CELL_W = 140
const CELL_H = 58
const SHEET_LEFT = (1080 - SHEET_COLS * CELL_W) / 2
const SHEET_TOP = 540
const SHEET_CX = 540
const SHEET_CY = SHEET_TOP + (SHEET_ROWS * CELL_H) / 2

const SHEET_SPECIAL: Record<string, string> = {
  '1-3': '=SOMA(B2:B9)',
  '2-5': '#REF!',
  '3-2': '=PROCV(A3;…)',
  '4-4': '#N/D',
  '5-1': '=B4*1,02',
  '6-5': '#VALOR!',
  '7-3': '=SE(C7>0;…)',
}

function cellText(r: number, c: number, index: number) {
  if (r === 0) return c === 0 ? '' : String.fromCharCode(64 + c)
  if (c === 0) return `${r}`
  return SHEET_SPECIAL[`${r}-${c}`] ?? (random(`v${index}`) * 9000).toFixed(0)
}

function NoSpreadsheetScene({ duration }: { duration: number }) {
  const frame = useFrame()
  const ottoPop = useSpring(20, { damping: 12, stiffness: 150 })
  const absorbed = p(frame, 30, 64, [0, 1], Easing.linear)
  const card = useSpring(64, { damping: 14, stiffness: 140 })
  const maxDist = Math.hypot(SHEET_COLS * CELL_W, SHEET_ROWS * CELL_H) / 2

  return (
    <Scene duration={duration}>
      <Headline highlight={['automático']} size={100} start={0} text="Tudo no automático." style={{ top: 300 }} />

      {Array.from({ length: SHEET_ROWS * SHEET_COLS }, (_, index) => {
        const r = Math.floor(index / SHEET_COLS)
        const c = index % SHEET_COLS
        const text = cellText(r, c, index)
        const isError = text.startsWith('#')
        const isFormula = text.startsWith('=')
        const x0 = SHEET_LEFT + c * CELL_W + CELL_W / 2
        const y0 = SHEET_TOP + r * CELL_H + CELL_H / 2
        const dx = x0 - SHEET_CX
        const dy = y0 - SHEET_CY
        const delay = 28 + (Math.hypot(dx, dy) / maxDist) * 22 + random(`d${index}`) * 6
        const t = p(frame, delay, delay + 16, [0, 1], Easing.in(Easing.cubic))
        const angle = t * (Math.PI / 2)
        const x = SHEET_CX + (dx * Math.cos(angle) - dy * Math.sin(angle)) * (1 - t)
        const y = SHEET_CY + (dx * Math.sin(angle) + dy * Math.cos(angle)) * (1 - t)
        const appear = p(frame, 2 + r * 1.5, 12 + r * 1.5)
        const shake = isError && frame > 12 && frame < delay ? Math.sin(frame * 2.2 + index) * 3 : 0
        if (t >= 1) return null

        return (
          <div
            key={index}
            style={{
              alignItems: 'center',
              background: r === 0 || c === 0 ? '#ebeae4' : isError ? '#fbe9e4' : WHITE,
              border: `1.5px solid ${GRAY}88`,
              color: isError ? '#c4452b' : isFormula ? INK : r === 0 || c === 0 ? INK : INK_MUTED,
              display: 'flex',
              fontFamily: isFormula ? 'Consolas, "SF Mono", monospace' : SANS,
              fontSize: isFormula ? 16 : 20,
              fontWeight: r === 0 || c === 0 || isError ? 700 : 500,
              height: CELL_H,
              justifyContent: 'center',
              left: x - CELL_W / 2 + shake,
              opacity: appear * (1 - p(t, 0.7, 1)),
              overflow: 'hidden',
              position: 'absolute',
              top: y - CELL_H / 2,
              transform: `rotate(${t * 120}deg) scale(${1 - t * 0.85})`,
              whiteSpace: 'nowrap',
              width: CELL_W,
            }}
          >
            {text}
          </div>
        )
      })}

      <svg height={1920} style={{ left: 0, pointerEvents: 'none', position: 'absolute', top: 0 }} width={1080}>
        {frame >= 30 && frame < 70
          ? [0, 1].map((k) => {
              const phase = ((frame - 30 + k * 10) % 20) / 20
              return <circle cx={SHEET_CX} cy={SHEET_CY} fill="none" key={k} opacity={phase * 0.5} r={260 - phase * 160} stroke={TERRA} strokeWidth={3} />
            })
          : null}
        {frame >= 64 ? <circle cx={SHEET_CX} cy={SHEET_CY} fill="none" opacity={1 - p(frame, 64, 84)} r={100 + p(frame, 64, 84) * 220} stroke={TERRA} strokeWidth={4} /> : null}
      </svg>

      <div style={{ alignItems: 'center', background: WHITE, border: `3px solid ${INK}`, borderRadius: 99, boxShadow: '0 26px 60px rgba(20,20,19,0.14)', display: 'flex', height: 190, justifyContent: 'center', left: SHEET_CX - 95, position: 'absolute', top: SHEET_CY - 95, transform: `scale(${ottoPop * (1 + absorbed * 0.12 - p(frame, 64, 74) * 0.12)})`, width: 190, zIndex: 2 }}>
        <OttoIcon size={108} />
      </div>

      {frame >= 64 ? (
        <Card style={{ alignItems: 'center', display: 'flex', gap: 26, left: 150, opacity: Math.min(1, card * 1.3), padding: '30px 36px', right: 150, top: SHEET_CY + 140 - (1 - card) * 140, transform: `scale(${0.85 + card * 0.15})`, zIndex: 1 }}>
          <span style={{ alignItems: 'center', background: TERRA, borderRadius: 99, display: 'flex', flex: 'none', height: 76, justifyContent: 'center', width: 76 }}>
            <svg height={40} viewBox="0 0 24 24" width={40}>
              <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" pathLength={1} stroke={WHITE} strokeDasharray={1} strokeDashoffset={1 - p(frame, 70, 82)} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
            </svg>
          </span>
          <div>
            <span style={{ display: 'block', fontFamily: DISPLAY, fontSize: 60, fontWeight: 400, lineHeight: 1 }}>Financeiro em dia</span>
            <span style={{ color: INK_MUTED, display: 'block', fontSize: 25, fontWeight: 600, marginTop: 6 }}>Atualizado agora · 0 planilhas</span>
          </div>
        </Card>
      ) : null}

      <Headline
        marks={[
          { at: 84, kind: 'strike', word: 'planilhas' },
          { at: 92, kind: 'strike', word: 'estresse' },
        ]}
        size={92}
        start={70}
        text="Sem planilhas, sem estresse."
        style={{ top: 1330 }}
      />
    </Scene>
  )
}

// ─── 10. ChatGPT ou Claude ───────────────────────────────────────────────────

function IntegrationScene({ duration }: { duration: number }) {
  const frame = useFrame()
  const percent = Math.round(100 * p(frame, 4, 30, [0, 1], Easing.out(Easing.quad)))
  const ottoPop = useSpring(30)
  const nodes = [
    { cx: 300, logo: <Img src={staticFile('gptLogo.svg')} style={{ filter: 'brightness(0)', height: 62 }} /> },
    { cx: 780, logo: <Img src={staticFile('claudeLogo.svg')} style={{ height: 56 }} /> },
  ]

  return (
    <Scene duration={duration}>
      <div style={{ color: TERRA, fontFamily: DISPLAY, fontSize: 280, fontStyle: 'italic', fontVariantNumeric: 'tabular-nums', fontWeight: 400, left: 0, letterSpacing: '-0.03em', lineHeight: 1, opacity: p(frame, 0, 8), position: 'absolute', right: 0, textAlign: 'center', top: 300 }}>
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

type CtaProps = { comment?: string; duration: number; highlight?: string[]; keyword?: string; title?: string; titleSize?: number }

export function CtaScene({ comment: commentText = 'Financeiro', duration, highlight = ['funciona'], keyword = 'FINANCEIRO', title = 'Quer ver como funciona?', titleSize = 100 }: CtaProps) {
  const frame = useFrame()
  const pill = useSpring(18, { damping: 11, stiffness: 140 })
  const pulse = frame > 40 ? 1 + Math.sin((frame - 40) / 5) * 0.025 : 1
  const comment = typed(commentText, p(frame, 44, 62, [0, 1], Easing.linear))
  const sent = frame >= 68

  return (
    <Scene duration={duration}>
      <Headline highlight={highlight} size={titleSize} start={0} text={title} style={{ top: 400 }} />
      <span style={{ color: INK_MUTED, fontSize: 44, fontWeight: 600, left: 0, opacity: p(frame, 14, 24), position: 'absolute', right: 0, textAlign: 'center', top: 720 }}>Comenta</span>
      <div style={{ display: 'flex', justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 800 }}>
        <span style={{ background: TERRA, borderRadius: 28, boxShadow: '0 24px 60px rgba(217,119,87,0.35)', color: WHITE, fontFamily: SANS, fontSize: 96, fontWeight: 800, letterSpacing: '0.02em', padding: '22px 56px', transform: `scale(${pill * pulse})` }}>
          {keyword}
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
      <span style={{ fontFamily: DISPLAY, fontSize: 72, fontStyle: 'italic', fontWeight: 400, left: 0, opacity: p(frame, 70, 82), position: 'absolute', right: 0, textAlign: 'center', top: 1310, transform: `translateY(${p(frame, 70, 84, [20, 0])}px)` }}>
        que te mando o link.
      </span>
      <div style={{ display: 'flex', justifyContent: 'center', left: 0, opacity: p(frame, 80, 92), position: 'absolute', right: 0, top: 1490 }}>
        <Img src={staticFile('logoOtto.svg')} style={{ height: 90, width: 210 }} />
      </div>
    </Scene>
  )
}

// ─── Timeline ────────────────────────────────────────────────────────────────

/** `duration`: nominal (authored) length. `actual`: real length on screen, e.g. derived from narration timestamps. */
export type ReelScene = { actual?: number; Component: (props: { duration: number }) => ReactNode; duration: number }

const CONTADORES_AUDIO = 'remotion/otto-reels/contadores-narracao.mp3'

// Cue = second the scene's sentence starts in the narration (minus a short lead-in).
const SCENES: ReelScene[] = narratedScenes(
  [
    { at: 0, scene: { Component: HookScene, duration: 105 } }, // "Essa I.A. tá deixando os contadores…"
    { at: 3.85, scene: { Component: NameScene, duration: 88 } }, // "O nome dela é Otto, um sistema de gestão"
    { at: 6.5, scene: { Component: PromiseScene, duration: 100 } }, // "que automatiza todo o financeiro…"
    { at: 9.2, scene: { Component: BankSyncScene, duration: 100 } }, // "Ela sincroniza todas as suas contas bancárias"
    { at: 11.75, scene: { Component: ExpensesScene, duration: 95 } }, // "categoriza despesas"
    { at: 13.15, scene: { Component: InvoiceScene, duration: 100 } }, // "emite notas fiscais"
    { at: 14.6, scene: { Component: ReconciliationScene, duration: 100 } }, // "faz a conciliação bancária"
    { at: 16.1, scene: { Component: WhatsAppScene, duration: 105 } }, // "e cobra os seus clientes no WhatsApp"
    { at: 18.4, scene: { Component: NoSpreadsheetScene, duration: 120 } }, // "Tudo no automático. Sem planilhas, sem estresse."
    { at: 21.78, scene: { Component: IntegrationScene, duration: 90 } }, // "E o melhor de tudo: cem por cento integrado…"
    { at: 26.25, scene: { Component: CtaScene, duration: 120 } }, // "Quer ver como funciona? Comenta Financeiro…"
  ],
  30.6,
)

export const OTTO_CONTADORES_REEL_DURATION = sceneDuration(SCENES)

// The app's globals.css forces `body * { font-family: ... !important }`, which beats inline styles
// when the reel is previewed inside Next. Re-assert the reel's own fonts with higher specificity.
const REEL_FONT_CSS = `
.otto-reel, .otto-reel * { font-family: ${SANS} !important; }
.otto-reel [style*="Newsreader"], .otto-reel [style*="Newsreader"] * { font-family: ${SERIF} !important; }
.otto-reel [style*="Instrument Serif"], .otto-reel [style*="Instrument Serif"] * { font-family: ${DISPLAY} !important; }
.otto-reel [style*="Consolas"] { font-family: Consolas, "SF Mono", monospace !important; }
`

export function sceneDuration(scenes: ReelScene[]) {
  return scenes.reduce((sum, scene) => sum + (scene.actual ?? scene.duration), 0)
}

/** Same as narratedScenes, for an already-ordered scene list: `cues[i]` is when `scenes[i]` starts in the voiceover. */
export function syncToNarration(scenes: ReelScene[], cues: number[], end: number, fps = 30): ReelScene[] {
  if (cues.length !== scenes.length) throw new Error(`syncToNarration: ${cues.length} cues for ${scenes.length} scenes`)
  return narratedScenes(cues.map((at, i) => ({ at, scene: scenes[i] })), end, fps)
}

/** Builds a narrated timeline: each scene starts at its cue (seconds into the voiceover) and lasts until the next cue. */
export function narratedScenes(cues: { at: number; scene: ReelScene }[], end: number, fps = 30): ReelScene[] {
  return cues.map(({ at, scene }, i) => ({ ...scene, actual: Math.round(((cues[i + 1]?.at ?? end) - at) * fps) }))
}

/** Shared shell for the Otto editorial reels: fonts, font-override CSS, grid background and scene sequencing. */
export function ReelRoot({ audio, scenes }: { audio?: string; scenes: ReelScene[] }) {
  const [handle] = useState(() => delayRender('Loading reel fonts'))

  useEffect(() => {
    const promise = loadSerifFont() ?? Promise.resolve()
    promise.then(() => continueRender(handle))
  }, [handle])

  return (
    <AbsoluteFill className="otto-reel" style={{ background: BG }}>
      <style>{REEL_FONT_CSS}</style>
      <GridBackground />
      {audio ? <Audio src={staticFile(audio)} /> : null}
      <Series>
        {scenes.map(({ actual, Component, duration }, index) => (
          <Series.Sequence durationInFrames={actual ?? duration} key={index}>
            <SceneSpeedContext.Provider value={duration / (actual ?? duration)}>
              <Component duration={duration} />
            </SceneSpeedContext.Provider>
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  )
}

export function OttoContadoresReel() {
  return <ReelRoot audio={CONTADORES_AUDIO} scenes={SCENES} />
}
