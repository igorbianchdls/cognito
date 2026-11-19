import { useCurrentFrame } from 'remotion'
import type { Clip } from '../../project/types'

export function ShapeBlock({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame()
  const p = clip.props
  if (p.shape === 'progresso') {
    // Fills from left to right over the clip, so a full-length clip tracks the whole video.
    return <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.25)' }}>
      <div style={{ height: '100%', width: `${Math.min(100, (frame + 1) / clip.duration * 100)}%`, background: p.bg ?? '#facc15' }} />
    </div>
  }
  return <div style={{ position: 'absolute', inset: 0, background: p.bg ?? '#3b82f6', borderRadius: p.shape === 'circulo' ? '50%' : p.radius ?? 0 }} />
}
