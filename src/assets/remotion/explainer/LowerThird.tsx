import { AbsoluteFill, Html5Video, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, ff, palette, progress, type ExplainerColors } from './theme'

export type LowerThirdProps = {
  name: string
  role?: string
  /** Photo or video behind the tag (path in /public or URL; .mp4/.webm/.mov play muted). */
  src: string
  /** Small place/date tag at the top-left corner, like a news package. */
  place?: string
  colors?: Partial<ExplainerColors>
}

export const LOWER_THIRD_DURATION = 150

/**
 * Name tag over footage: the picture drifts slowly (Ken Burns), a black strip with the name
 * and a paper strip with the role slide in from the left, then leave before the end.
 */
export function LowerThird({ name, role, src, place, colors }: LowerThirdProps) {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const url = src.startsWith('http') ? src : staticFile(src.replace(/^\//, ''))
  const isVideo = /\.(mp4|webm|mov)$/i.test(src)
  const zoom = interpolate(frame, [0, durationInFrames], [1.04, 1.12])
  const out = progress(frame, durationInFrames - 26, 16)
  const nameIn = progress(frame, 16, 16) - out
  const roleIn = progress(frame, 26, 16) - out
  const placeIn = progress(frame, 8, 12) - out
  const fill = { width: '100%', height: '100%', objectFit: 'cover' as const, transform: `scale(${zoom}) translateX(${interpolate(frame, [0, durationInFrames], [0, -1.5])}%)`, filter: 'saturate(0.9) contrast(1.04)' }

  return (
    <AbsoluteFill style={{ background: c.ink, overflow: 'hidden' }}>
      {isVideo ? <Html5Video src={url} muted style={fill} /> : <Img src={url} style={fill} />}
      <AbsoluteFill style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.45) 0%, transparent 38%)' }} />
      {place && <div style={{ position: 'absolute', left: 90 * s, top: 80 * s, background: c.paper, padding: `${8 * s}px ${18 * s}px`, ...ff(FONT.head), fontWeight: 700, fontSize: 32 * s, letterSpacing: 2 * s, textTransform: 'uppercase', color: c.ink,
        opacity: placeIn, clipPath: `inset(0 ${(1 - placeIn) * 100}% 0 0)` }}>{place}</div>}
      <div style={{ position: 'absolute', left: 90 * s, bottom: 120 * s, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', clipPath: `inset(0 ${(1 - nameIn) * 100}% 0 0)` }}>
          <span style={{ width: 18 * s, background: c.red }} />
          <span style={{ background: c.ink, color: c.paper, padding: `${14 * s}px ${30 * s}px`, ...ff(FONT.head), fontWeight: 800, fontSize: 64 * s, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 1 * s }}>{name}</span>
        </div>
        {role && <div style={{ marginLeft: 18 * s, background: c.paper, color: c.text, padding: `${10 * s}px ${28 * s}px`, ...ff(FONT.serif), fontSize: 36 * s, clipPath: `inset(0 ${(1 - roleIn) * 100}% 0 0)`, transform: 'rotate(-0.6deg)' }}>{role}</div>}
      </div>
    </AbsoluteFill>
  )
}
