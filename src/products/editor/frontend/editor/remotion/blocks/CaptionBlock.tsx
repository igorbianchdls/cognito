import { useCurrentFrame } from 'remotion'
import type { Clip } from '../../project/types'
import { fonts } from '../animate'

/** Karaoke-style caption: words light up as the clip plays. */
export function CaptionBlock({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame()
  const words = (clip.props.text ?? '').split(/\s+/).filter(Boolean)
  const current = Math.min(words.length - 1, Math.floor(frame / Math.max(1, clip.duration / Math.max(1, words.length))))
  const style = clip.props.captionStyle ?? 'amarela'
  const box = style === 'caixa'
  return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontFamily: fonts[clip.props.font ?? 'geist'].family, fontSize: 58, fontWeight: 800, lineHeight: 1.2, textAlign: 'center', padding: box ? '14px 26px' : 0, borderRadius: 20, background: box ? 'rgba(0,0,0,.78)' : 'none' }}>
      {words.map((w, i) => {
        const on = i === current
        const color = style === 'amarela' ? (on ? '#facc15' : '#ffffff') : style === 'branca' ? (i <= current ? '#ffffff' : 'rgba(255,255,255,.55)') : (on ? '#93c5fd' : '#ffffff')
        return <span key={i} style={{ color, display: 'inline-block', marginRight: '0.28em', transform: on ? 'scale(1.08)' : 'none', WebkitTextStroke: box ? 0 : '3px #000', paintOrder: 'stroke fill', textShadow: box ? 'none' : '0 4px 14px rgba(0,0,0,.5)' }}>{w}</span>
      })}
    </div>
  </div>
}
