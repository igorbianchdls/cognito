import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

export const MERGE_LOGO_REVEAL_DURATION = 51

const INK = '#242424'
const MUTED = '#696969'

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function MergeMark({ value }: { value: number }) {
  const x = interpolate(value, [0, 1], [-34, 0])
  const opacity = interpolate(value, [0, 0.45, 1], [0, 0.48, 1])
  const scale = interpolate(value, [0, 1], [0.92, 1])

  return (
    <svg
      aria-hidden="true"
      height="104"
      style={{ display: 'block', filter: `blur(${interpolate(value, [0, 1], [1.2, 0])}px)`, opacity, transform: `translateX(${x}px) scale(${scale})` }}
      viewBox="0 0 116 104"
      width="116"
    >
      <path
        d="M23 13 C39 33 61 43 92 44"
        fill="none"
        stroke={INK}
        strokeDasharray="120"
        strokeDashoffset={interpolate(value, [0, 1], [120, 0])}
        strokeLinecap="square"
        strokeWidth="20"
      />
      <path
        d="M23 91 C39 71 61 61 92 60"
        fill="none"
        stroke={INK}
        strokeDasharray="126"
        strokeDashoffset={interpolate(value, [0, 1], [126, 0])}
        strokeLinecap="square"
        strokeWidth="20"
      />
    </svg>
  )
}

function Letter({ children, index, wordProgress }: { children: string; index: number; wordProgress: number }) {
  const item = progress(wordProgress * 48, index * 4, index * 4 + 16)
  const x = interpolate(item, [0, 1], [-22, 0])
  const opacity = interpolate(item, [0, 1], [0, 1])

  return (
    <span style={{ display: 'inline-block', opacity, transform: `translateX(${x}px)` }}>
      {children}
    </span>
  )
}

export function MergeLogoReveal() {
  const frame = useCurrentFrame()
  const mark = progress(frame, 0, 20)
  const word = progress(frame, 11, 35)
  const subtitle = progress(frame, 27, 43)
  const pill = progress(frame, 0, 12)
  const lockupScale = interpolate(frame, [0, MERGE_LOGO_REVEAL_DURATION], [1.04, 0.98], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: INK, fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 31,
          left: '50%',
          position: 'absolute',
          top: 330,
          transform: `translate(-50%, -50%) scale(${lockupScale})`,
        }}
      >
        <MergeMark value={mark} />
        <div style={{ display: 'grid', gap: 8, justifyItems: 'start', minWidth: 372 }}>
          <div style={{ alignItems: 'center', display: 'flex', fontSize: 68, fontWeight: 900, gap: 12, height: 74, letterSpacing: 7, lineHeight: 1, overflow: 'hidden' }}>
            {'MERGE'.split('').map((letter, index) => (
              <Letter key={letter + index} index={index} wordProgress={word}>
                {letter}
              </Letter>
            ))}
          </div>
          <span
            style={{
              color: INK,
              fontSize: 28,
              fontWeight: 650,
              letterSpacing: 0,
              lineHeight: 1,
              opacity: subtitle,
              transform: `translateY(${interpolate(subtitle, [0, 1], [-12, 0])}px)`,
            }}
          >
            Agent Handler
          </span>
        </div>
      </div>

      <div
        style={{
          background: MUTED,
          borderRadius: 7,
          bottom: 39,
          boxShadow: '0 7px 18px rgba(0,0,0,0.13)',
          color: '#ffffff',
          fontSize: 28,
          fontWeight: 750,
          left: '50%',
          letterSpacing: 0,
          lineHeight: 1,
          opacity: pill,
          padding: '12px 18px 13px',
          position: 'absolute',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {frame < 29 ? 'Introducing' : 'Agent Handler'}
      </div>
    </AbsoluteFill>
  )
}
