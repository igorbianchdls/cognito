import type { ReactNode } from 'react'
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from 'remotion'
import { EX, easeInOut, progress } from './theme'

export type PaperTearProps = {
  /** Scene that gets torn away. */
  from: ReactNode
  /** Scene revealed underneath (wrap it in <Sequence from={at}> so it starts with the tear). */
  to: ReactNode
  /** Frame where the tear starts, and how long it takes. */
  at?: number
  duration?: number
  /** Color of the torn paper fibers along the edge. */
  edge?: string
  seed?: string
}

export const PAPER_TEAR_DEMO_DURATION = 200

/**
 * Transition: the first scene is torn off like a sheet of paper, with a ragged edge,
 * white fibers and a shadow, uncovering the next scene underneath.
 */
export function PaperTear({ from, to, at = 60, duration = 26, edge = EX.card, seed = 'tear' }: PaperTearProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const s = Math.min(width, height) / 1080
  const t = progress(frame, at, duration, easeInOut)
  const slant = width * 0.18
  const base = interpolate01(t, width + slant + 80 * s, -slant - 80 * s)

  // The torn edge: a ragged line from top to bottom, slanted, fixed per seed (only its position moves).
  const steps = 34
  const edgeAt = (k: number, extra = 0) => {
    const y = (k / steps) * height
    const jag = (random(`${seed}-${k}`) - 0.5) * 34 * s + (random(`${seed}-f${k}`) - 0.5) * 10 * s
    return [base + slant * (1 - k / steps) + jag + extra, y] as const
  }
  const line = (extra: number) => Array.from({ length: steps + 1 }, (_, k) => edgeAt(k, extra))
  const pts = (list: (readonly [number, number])[]) => list.map(([x, y]) => `${x}px ${y}px`).join(', ')
  const sheet = `polygon(0 0, ${pts(line(0))}, 0 ${height}px)`
  const fibers = `polygon(${pts(line(0))}, ${pts(line(16 * s).reverse())})`

  if (t <= 0) return <AbsoluteFill>{from}</AbsoluteFill>
  if (t >= 1) return <AbsoluteFill>{to}</AbsoluteFill>
  return (
    <AbsoluteFill>
      <AbsoluteFill>{to}</AbsoluteFill>
      <AbsoluteFill style={{ filter: `drop-shadow(${14 * s}px 0 ${18 * s}px rgba(30,20,5,.35))` }}>
        <AbsoluteFill style={{ background: edge, clipPath: fibers }} />
        <AbsoluteFill style={{ clipPath: sheet }}>{from}</AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

const interpolate01 = (t: number, a: number, b: number) => a + (b - a) * t
