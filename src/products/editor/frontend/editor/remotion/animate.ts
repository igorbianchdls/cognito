// Turns keyframes, transitions and filters into CSS. Shared by the Remotion layers and the selection overlay.
import { interpolate } from 'remotion'
import { motionAt } from '../project/keyframes'
import type { Clip, Filter, FontId, Motion, Transition } from '../project/types'

export const fonts: Record<FontId, { label: string; family: string }> = {
  geist: { label: 'Geist', family: 'var(--font-geist-sans), system-ui, sans-serif' },
  bebas: { label: 'Bebas Neue', family: 'var(--font-bebas), Impact, sans-serif' },
  serif: { label: 'DM Serif', family: 'var(--font-dm-serif), Georgia, serif' },
  caveat: { label: 'Caveat', family: 'var(--font-caveat), cursive' },
  mono: { label: 'Geist Mono', family: 'var(--font-geist-mono), ui-monospace, monospace' },
}

/** CSS transform for a motion, with offsets in % of the canvas (width × height in px). */
export const motionTransform = (m: Motion, width: number, height: number) =>
  `translate(${m.dx / 100 * width}px, ${m.dy / 100 * height}px) rotate(${m.rotation}deg) scale(${m.scale})`

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

/** Progress 0→1 of a transition; 1 when the clip is fully shown. */
function phase(t: Transition | undefined, framesIn: number) {
  return t && t.frames > 0 ? interpolate(framesIn, [0, t.frames], [0, 1], clamp) : 1
}

function transitionParts(t: Transition | undefined, p: number, out: boolean) {
  if (!t || p >= 1) return { opacity: 1, transform: '', blur: 0 }
  const dir = out ? 1 : -1
  switch (t.type) {
    case 'fade': return { opacity: p, transform: '', blur: 0 }
    case 'deslizar': return { opacity: p, transform: `translateY(${(1 - p) * 120 * -dir}px)`, blur: 0 }
    case 'zoom': return { opacity: p, transform: `scale(${0.75 + 0.25 * p})`, blur: 0 }
    case 'desfoque': return { opacity: p, transform: '', blur: (1 - p) * 24 }
  }
}

/** Style of a clip's layer at `frame` (relative to the clip start). */
export function layerStyle(clip: Clip, frame: number, width: number, height: number): React.CSSProperties {
  const m = motionAt(clip.props.keyframes, frame)
  const tin = transitionParts(clip.props.transIn, phase(clip.props.transIn, frame), false)
  const tout = transitionParts(clip.props.transOut, phase(clip.props.transOut, clip.duration - frame), true)
  const blur = tin.blur + tout.blur
  return {
    transform: `${motionTransform(m, width, height)} ${tin.transform} ${tout.transform}`.trim(),
    opacity: m.opacity * tin.opacity * tout.opacity * (clip.props.opacity ?? 1),
    filter: blur ? `blur(${blur}px)` : undefined,
  }
}

export const filterCss = (f?: Filter) => f
  ? `brightness(${f.brightness}) contrast(${f.contrast}) saturate(${f.saturation}) grayscale(${f.grayscale}) sepia(${f.sepia})`
  : undefined
