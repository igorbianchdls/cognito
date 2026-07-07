import { Icon } from '@iconify/react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

export const OTTO_ASSISTANT_COMPATIBILITY_DURATION = 150

const INK = '#111827'
const MUTED = '#667085'
const GREEN = '#225f42'
const OPENAI = '#111111'
const CLAUDE = '#d86f4a'

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function OttoMark({ frame }: { frame: number }) {
  const pulse = interpolate(Math.sin(frame / 13), [-1, 1], [0.98, 1.04])

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 19, transform: `scale(${pulse})` }}>
      <svg aria-hidden="true" height="78" viewBox="0 0 116 104" width="87">
        <path d="M23 13 C39 33 61 43 92 44" fill="none" stroke={GREEN} strokeLinecap="square" strokeWidth="20" />
        <path d="M23 91 C39 71 61 61 92 60" fill="none" stroke={GREEN} strokeLinecap="square" strokeWidth="20" />
      </svg>
      <strong style={{ color: INK, fontSize: 62, fontWeight: 790, letterSpacing: 2, lineHeight: 1 }}>OTTO</strong>
    </div>
  )
}

function ProviderCard({
  accent,
  icon,
  label,
  side,
  start,
}: {
  accent: string
  icon: string
  label: string
  side: 'left' | 'right'
  start: number
}) {
  const frame = useCurrentFrame()
  const enter = progress(frame, start, start + 24)
  const lift = interpolate(Math.sin((frame - start) / 18), [-1, 1], [-8, 8])
  const x = interpolate(enter, [0, 1], [side === 'left' ? -96 : 96, 0])
  const scale = interpolate(enter, [0, 1], [0.86, 1])

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#ffffff',
        border: `2px solid ${accent}26`,
        borderRadius: 34,
        boxShadow: `0 34px 90px ${accent}1f`,
        display: 'grid',
        gap: 19,
        height: 248,
        justifyItems: 'center',
        opacity: enter,
        padding: 28,
        transform: `translate(${x}px, ${lift}px) scale(${scale})`,
        width: 306,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          background: `${accent}12`,
          border: `1px solid ${accent}22`,
          borderRadius: 999,
          color: accent,
          display: 'flex',
          height: 116,
          justifyContent: 'center',
          width: 116,
        }}
      >
        <Icon height={58} icon={icon} width={58} />
      </div>
      <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
        <strong style={{ color: INK, fontSize: 32, fontWeight: 840, letterSpacing: 0, lineHeight: 1 }}>{label}</strong>
        <span style={{ color: MUTED, fontSize: 19, fontWeight: 720, letterSpacing: 0 }}>ready</span>
      </div>
    </div>
  )
}

function Connector({ delay, endX, frame }: { delay: number; endX: number; frame: number }) {
  const draw = progress(frame, delay, delay + 30)
  const pulse = progress(frame, delay + 34, delay + 52)
  const dash = 600 - draw * 600

  return (
    <svg height="240" style={{ left: 0, overflow: 'visible', position: 'absolute', top: 724 }} viewBox="0 0 1080 240" width="1080">
      <path
        d={`M540 118 C540 118 ${endX < 540 ? 424 : 656} 118 ${endX} 118`}
        fill="none"
        stroke={GREEN}
        strokeDasharray="600"
        strokeDashoffset={dash}
        strokeLinecap="round"
        strokeWidth="5"
      />
      <circle cx={interpolate(pulse, [0, 1], [540, endX])} cy="118" fill={GREEN} opacity={pulse} r={9} />
    </svg>
  )
}

export function OttoAssistantCompatibility() {
  const frame = useCurrentFrame()
  const otto = progress(frame, 0, 26)
  const badge = progress(frame, 96, 124)
  const title = progress(frame, 16, 42)

  return (
    <AbsoluteFill style={{ background: '#f6f8f5', color: INK, fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 37%, rgba(34,95,66,0.16), rgba(246,248,245,0) 52%)', inset: -180, position: 'absolute' }} />
      <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0))', height: 560, left: 0, position: 'absolute', right: 0, top: 0 }} />

      <header style={{ display: 'grid', gap: 18, justifyItems: 'center', left: 100, opacity: title, position: 'absolute', right: 100, top: 168, transform: `translateY(${(1 - title) * 24}px)` }}>
        <span style={{ color: GREEN, fontSize: 20, fontWeight: 900, letterSpacing: 2.4, textTransform: 'uppercase' }}>Compatibilidade</span>
        <h1 style={{ color: INK, fontSize: 74, fontWeight: 900, letterSpacing: 0, lineHeight: 0.94, margin: 0, textAlign: 'center' }}>
          Funciona onde voce conversa
        </h1>
      </header>

      <div
        style={{
          alignItems: 'center',
          background: '#ffffff',
          border: '1px solid rgba(34,95,66,0.12)',
          borderRadius: 42,
          boxShadow: '0 42px 120px rgba(28,45,35,0.14)',
          display: 'flex',
          height: 190,
          justifyContent: 'center',
          left: 238,
          opacity: otto,
          position: 'absolute',
          right: 238,
          top: 632,
          transform: `translateY(${(1 - otto) * 30}px) scale(${interpolate(otto, [0, 1], [0.92, 1])})`,
          zIndex: 3,
        }}
      >
        <OttoMark frame={frame} />
      </div>

      <Connector delay={52} endX={272} frame={frame} />
      <Connector delay={58} endX={808} frame={frame} />

      <div style={{ display: 'flex', justifyContent: 'space-between', left: 107, position: 'absolute', right: 107, top: 986 }}>
        <ProviderCard accent={OPENAI} icon="simple-icons:openai" label="ChatGPT" side="left" start={42} />
        <ProviderCard accent={CLAUDE} icon="simple-icons:anthropic" label="Claude" side="right" start={52} />
      </div>

      <div
        style={{
          alignItems: 'center',
          background: GREEN,
          borderRadius: 999,
          bottom: 230,
          boxShadow: '0 28px 80px rgba(34,95,66,0.25)',
          color: '#ffffff',
          display: 'flex',
          fontSize: 34,
          fontWeight: 860,
          justifyContent: 'center',
          left: 120,
          letterSpacing: 0,
          opacity: badge,
          padding: '27px 34px',
          position: 'absolute',
          right: 120,
          transform: `translateY(${(1 - badge) * 28}px) scale(${interpolate(badge, [0, 1], [0.96, 1])})`,
        }}
      >
        Funciona com Claude e ChatGPT
      </div>
    </AbsoluteFill>
  )
}
