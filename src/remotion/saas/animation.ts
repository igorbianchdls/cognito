import { interpolate, spring } from 'remotion'

export function clampProgress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

export function fadeSlide(frame: number, start: number, options?: { distance?: number; end?: number; x?: boolean }) {
  const end = options?.end ?? start + 24
  const distance = options?.distance ?? 28
  const progress = clampProgress(frame, start, end)
  const offset = (1 - progress) * distance
  return {
    opacity: progress,
    transform: options?.x ? `translateX(${offset}px)` : `translateY(${offset}px)`,
  }
}

export function popIn(frame: number, start: number, fps: number, options?: { stiffness?: number; damping?: number }) {
  const value = spring({
    fps,
    frame: Math.max(0, frame - start),
    config: {
      damping: options?.damping ?? 18,
      stiffness: options?.stiffness ?? 120,
      mass: 0.9,
    },
  })
  return {
    opacity: clampProgress(frame, start, start + 12),
    transform: `scale(${0.92 + value * 0.08})`,
  }
}

export function stagger(frame: number, index: number, start = 0, gap = 8) {
  return start + index * gap
}

export function countUp(frame: number, start: number, end: number, from: number, to: number) {
  return Math.round(interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }))
}
