import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import type { CSSProperties } from 'react'

export const OTTO_LOGO_VARIANT_DURATION = 90

const INK = '#242424'
const GREEN = '#166534'
const VIOLET = '#6A50F0'
const BLUE = '#2563EB'
const LINE = '#e7e5df'

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function Logo({
  filter,
  height = 116,
  style,
  width = 270,
}: {
  filter?: string
  height?: number
  style?: CSSProperties
  width?: number
}) {
  return <Img src={staticFile('logoOtto.svg')} style={{ display: 'block', filter, height, objectFit: 'contain', width, ...style }} />
}

export function OttoLogoSoftPulse() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 0, 24)
  const pulse = interpolate(Math.sin(frame / 9), [-1, 1], [0.985, 1.035])
  const ring = progress(frame % 54, 0, 54)

  return (
    <AbsoluteFill style={{ alignItems: 'center', background: '#f8faf7', display: 'flex', fontFamily: 'Inter, Arial, Helvetica, sans-serif', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ background: `rgba(22,101,52,${0.08 * (1 - ring)})`, border: `2px solid rgba(22,101,52,${0.18 * (1 - ring)})`, borderRadius: 999, height: 240 + ring * 170, position: 'absolute', transform: 'translateY(-8px)', width: 520 + ring * 310 }} />
      <div style={{ opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.9, 1]) * pulse})` }}>
        <Logo />
      </div>
      <div style={{ background: INK, borderRadius: 999, bottom: 48, color: '#fff', fontSize: 22, fontWeight: 760, opacity: progress(frame, 32, 50), padding: '10px 17px', position: 'absolute' }}>Otto</div>
    </AbsoluteFill>
  )
}

export function OttoLogoLightSweep() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 0, 24)
  const sweep = interpolate(frame, [18, 72], [-170, 430], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ alignItems: 'center', background: '#ffffff', display: 'flex', fontFamily: 'Inter, Arial, Helvetica, sans-serif', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ border: `1px solid ${LINE}`, borderRadius: 26, boxShadow: '0 30px 80px rgba(25,25,25,0.09)', height: 280, overflow: 'hidden', position: 'relative', width: 680 }}>
        <div style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.16), transparent)', bottom: 0, left: sweep, position: 'absolute', top: 0, transform: 'skewX(-15deg)', width: 150 }} />
        <div style={{ left: '50%', opacity: enter, position: 'absolute', top: '50%', transform: `translate(-50%, -50%) scale(${interpolate(enter, [0, 1], [0.94, 1])})` }}>
          <Logo />
        </div>
      </div>
    </AbsoluteFill>
  )
}

export function OttoLogoSignalGrid() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 0, 24)
  const scan = interpolate(frame, [0, OTTO_LOGO_VARIANT_DURATION], [-120, 820], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#f7f7f2', fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <svg height="720" style={{ inset: 0, opacity: 0.55, position: 'absolute' }} width="1280">
        {Array.from({ length: 15 }).map((_, index) => <path d={`M0 ${80 + index * 42} H1280`} key={`h-${index}`} stroke="#dedbd2" strokeDasharray="2 10" />)}
        {Array.from({ length: 23 }).map((_, index) => <path d={`M${70 + index * 54} 0 V720`} key={`v-${index}`} stroke="#dedbd2" strokeDasharray="2 10" />)}
        <rect fill="rgba(106,80,240,0.08)" height="720" width="130" x={scan} />
      </svg>
      <div style={{ alignItems: 'center', display: 'flex', inset: 0, justifyContent: 'center', position: 'absolute' }}>
        <div style={{ background: '#ffffff', border: `1px solid ${LINE}`, borderRadius: 24, boxShadow: '0 30px 80px rgba(25,25,25,0.1)', opacity: enter, padding: '72px 96px', transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])})` }}>
          <Logo />
        </div>
      </div>
    </AbsoluteFill>
  )
}

export function OttoLogoDarkStamp() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 0, 26)
  const settle = interpolate(Math.sin(frame / 10), [-1, 1], [-2, 2])

  return (
    <AbsoluteFill style={{ alignItems: 'center', background: INK, display: 'flex', fontFamily: 'Inter, Arial, Helvetica, sans-serif', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle, rgba(255,255,255,0.12), rgba(36,36,36,0) 58%)`, height: 640, position: 'absolute', width: 860 }} />
      <div style={{ border: '1px solid rgba(255,255,255,0.16)', borderRadius: 28, opacity: enter, padding: '82px 104px', transform: `translateY(${(1 - enter) * 22 + settle}px) scale(${interpolate(enter, [0, 1], [0.88, 1])})` }}>
        <Logo filter="brightness(0) invert(1)" />
      </div>
      <div style={{ background: VIOLET, borderRadius: 999, bottom: 50, color: '#fff', fontSize: 22, fontWeight: 760, opacity: progress(frame, 36, 54), padding: '10px 17px', position: 'absolute' }}>Ready</div>
    </AbsoluteFill>
  )
}
