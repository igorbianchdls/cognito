import type { CSSProperties, ReactNode } from 'react'
import { random, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, Mark, Paper, ff, palette, progress, type ExplainerColors } from './theme'

/**
 * Looks of made-up publications, so every clipping in the pile reads as a different paper:
 * "classico" (broadsheet with a blackletter masthead), "tabloide" (red masthead block, shouting headline),
 * "financeiro" (salmon paper, display serif), "revista" (white magazine page, modern grotesque),
 * "antigo" (yellowed paper, italic serif between double rules).
 */
export type ClippingLook = 'classico' | 'tabloide' | 'financeiro' | 'revista' | 'antigo'
const LOOK_ORDER: ClippingLook[] = ['classico', 'tabloide', 'financeiro', 'revista', 'antigo']

export type Clipping = {
  /** Made-up publication name (not a real paper's brand). */
  source: string
  /** Headline; wrap words in [[double brackets]] to highlight them on the top clipping. */
  headline: string
  date?: string
  /** The paper's look; by default each clipping takes the next one, so neighbors never match. */
  look?: ClippingLook
}
export type HeadlineStackProps = {
  clippings: Clipping[]
  /** Banner at the end ("Todo mundo está falando disso"). */
  title?: string
  colors?: Partial<ExplainerColors>
}

const DROP = 20
/** Length for a given number of clippings (the demo has 5). */
export const headlineStackDuration = (n: number) => 20 + n * DROP + 70
export const HEADLINE_STACK_DURATION = headlineStackDuration(5)

type Look = {
  paper: string
  ink: string
  /** Gray of the fake body-text lines. */
  lines: string
  width: number
  masthead: (source: string, date: string | undefined, s: number) => ReactNode
  headline: CSSProperties
  /** Body text in columns under the headline. */
  columns: number
}

const LOOKS: Record<ClippingLook, Look> = {
  classico: {
    paper: '#F3EEE2', ink: '#151412', lines: '#CFC8B8', width: 900, columns: 3,
    masthead: (source, date, s) => <div style={{ textAlign: 'center', borderBottom: `${2 * s}px solid #151412`, paddingBottom: 6 * s, marginBottom: 4 * s }}>
      <div style={{ ...ff(FONT.gothic), fontSize: 58 * s, lineHeight: 1.05, color: '#151412' }}>{source}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `${1 * s}px solid #151412`, marginTop: 6 * s, paddingTop: 4 * s, ...ff(FONT.serif), fontSize: 17 * s, color: '#4A463F', textTransform: 'uppercase', letterSpacing: 1.5 * s }}>
        <span>Edição nacional</span><span>{date}</span><span>R$ 6,00</span>
      </div>
    </div>,
    headline: { ...ff(FONT.serif), fontWeight: 700, fontSize: 60, lineHeight: 1.04, marginTop: 14 },
  },
  tabloide: {
    paper: '#FBFBF8', ink: '#111111', lines: '#D7D7D2', width: 860, columns: 2,
    masthead: (source, date, s) => <div style={{ display: 'flex', alignItems: 'stretch', marginBottom: 16 * s }}>
      <div style={{ background: '#D7261E', color: '#FFFFFF', padding: `${6 * s}px ${18 * s}px`, ...ff(FONT.tabloid), fontSize: 48 * s, lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: 1 * s }}>{source}</div>
      {date && <div style={{ marginLeft: 'auto', alignSelf: 'center', background: '#FFD400', padding: `${4 * s}px ${12 * s}px`, ...ff(FONT.tabloid), fontSize: 24 * s, color: '#111', textTransform: 'uppercase', transform: 'rotate(3deg)' }}>Exclusivo · {date}</div>}
    </div>,
    headline: { ...ff(FONT.tabloid), fontWeight: 400, fontSize: 74, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
  },
  financeiro: {
    paper: '#F5D9C3', ink: '#2A1F1A', lines: '#DDB79D', width: 920, columns: 3,
    masthead: (source, date, s) => <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: `${4 * s}px double #2A1F1A`, paddingBottom: 8 * s, marginBottom: 14 * s }}>
      <span style={{ ...ff(FONT.display), fontWeight: 900, fontSize: 40 * s, letterSpacing: -0.5 * s, color: '#2A1F1A' }}>{source}</span>
      <span style={{ ...ff(FONT.grotesk), fontWeight: 500, fontSize: 18 * s, color: '#6E5546', textTransform: 'uppercase', letterSpacing: 2 * s }}>Mercados · {date}</span>
    </div>,
    headline: { ...ff(FONT.display), fontWeight: 700, fontSize: 62, lineHeight: 1.06 },
  },
  revista: {
    paper: '#FFFFFF', ink: '#14171C', lines: '#E1E4E8', width: 840, columns: 2,
    masthead: (source, date, s) => <div style={{ display: 'flex', alignItems: 'center', gap: 14 * s, marginBottom: 18 * s }}>
      <span style={{ width: 16 * s, height: 16 * s, borderRadius: '50%', background: '#2457E6' }} />
      <span style={{ ...ff(FONT.grotesk), fontWeight: 800, fontSize: 30 * s, letterSpacing: 4 * s, textTransform: 'uppercase', color: '#14171C' }}>{source}</span>
      {date && <span style={{ marginLeft: 'auto', ...ff(FONT.grotesk), fontWeight: 500, fontSize: 19 * s, color: '#2457E6', textTransform: 'uppercase', letterSpacing: 1.5 * s }}>{date}</span>}
    </div>,
    headline: { ...ff(FONT.grotesk), fontWeight: 800, fontSize: 58, lineHeight: 1.05, letterSpacing: -1 },
  },
  antigo: {
    paper: '#E9DDBB', ink: '#3B2E1C', lines: '#CDBC92', width: 880, columns: 3,
    masthead: (source, date, s) => <div style={{ textAlign: 'center', borderTop: `${5 * s}px double #3B2E1C`, borderBottom: `${5 * s}px double #3B2E1C`, padding: `${6 * s}px 0`, marginBottom: 14 * s }}>
      <div style={{ ...ff(FONT.display), fontWeight: 900, fontSize: 38 * s, letterSpacing: 6 * s, textTransform: 'uppercase', color: '#3B2E1C' }}>{source}</div>
      {date && <div style={{ ...ff(FONT.serif), fontStyle: 'italic', fontSize: 18 * s, color: '#6B5A3E' }}>{date}</div>}
    </div>,
    headline: { ...ff(FONT.display), fontStyle: 'italic', fontWeight: 700, fontSize: 60, lineHeight: 1.06, textAlign: 'center' },
  },
}

/** Headline sizes in the looks are at 1080p; scale them with the video. */
const scaled = (st: CSSProperties, s: number): CSSProperties => ({
  ...st,
  fontSize: (st.fontSize as number) * s,
  letterSpacing: typeof st.letterSpacing === 'number' ? st.letterSpacing * s : st.letterSpacing,
  marginTop: typeof st.marginTop === 'number' ? st.marginTop * s : st.marginTop,
})

/**
 * "Everybody is talking about it": clippings from different (made-up) papers drop one on top of another
 * at slightly different angles, each with its own paper, masthead and type; the last one's headline
 * gets the highlighter, then a banner.
 */
export function HeadlineStack({ clippings, title, colors }: HeadlineStackProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const n = clippings.length
  const done = 20 + n * DROP
  const push = progress(frame, 10, done + 40, (t) => t)
  const bannerIn = progress(frame, done + 30, 14)

  return (
    <Paper color={c.paper}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + push * 0.06})` }}>
        {clippings.map((clip, i) => {
          const r = (k: string) => random(`clip-${i}-${k}`) - 0.5
          const drop = progress(frame, 20 + i * DROP, 10)
          const top = i === n - 1
          const look = LOOKS[clip.look ?? LOOK_ORDER[i % LOOK_ORDER.length]]
          const x = width / 2 + r('x') * width * 0.4, y = height * 0.5 + r('y') * height * 0.32
          const parts = clip.headline.split(/(\[\[.*?\]\])/).filter(Boolean)
          return drop > 0 && <div key={i} style={{ position: 'absolute', left: x, top: y, width: look.width * s, transform: `translate(-50%, -50%) rotate(${r('r') * 16}deg) scale(${1.25 - 0.25 * drop})`, opacity: Math.min(1, drop * 1.5),
            background: look.paper, padding: `${26 * s}px ${34 * s}px ${32 * s}px`, boxShadow: `0 ${14 * s}px ${34 * s}px rgba(40,30,10,${0.18 + 0.12 * drop})`,
            clipPath: `polygon(${Array.from({ length: 9 }, (_, k) => `${k * 12.5}% ${(r(`t${k}`) + 0.5) * 2.5}%`).join(', ')}, 100% 100%, 0 100%)` }}>
            {look.masthead(clip.source, clip.date, s)}
            <div style={{ color: look.ink, ...scaled(look.headline, s) }}>
              {parts.map((p, pi) => p.startsWith('[[')
                ? (top ? <Mark key={pi} amount={progress(frame, done + 8, 16)} seed={`clip-mark-${pi}`}>{p.slice(2, -2)}</Mark> : <span key={pi}>{p.slice(2, -2)}</span>)
                : <span key={pi}>{p}</span>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${look.columns}, 1fr)`, gap: `${8 * s}px ${22 * s}px`, marginTop: 20 * s }}>
              {Array.from({ length: look.columns * 3 }, (_, k) => <span key={k} style={{ height: 9 * s, width: `${k % 3 === 2 ? 70 + (random(`clip-${i}-l${k}`) * 25) : 100}%`, background: look.lines }} />)}
            </div>
          </div>
        })}
      </div>
      {title && <div style={{ position: 'absolute', left: '50%', bottom: 80 * s, transform: `translateX(-50%) translateY(${(1 - bannerIn) * 30 * s}px) rotate(-1deg)`, opacity: bannerIn,
        background: c.ink, color: c.paper, padding: `${16 * s}px ${40 * s}px`, ...ff(FONT.head), fontWeight: 800, fontSize: 70 * s, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{title}</div>}
    </Paper>
  )
}
