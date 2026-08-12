import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

const OTTO_LOGO_REVEAL_HORIZONTAL_INTRO_DURATION = 51

export const OTTO_LOGO_REVEAL_HORIZONTAL_DURATION = 141
export const OTTO_LOGO_REVEAL_REELS_DURATION = 141

const INK = '#242424'

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

export function OttoLogoRevealHorizontal({ centerX = 0, centerY = 330 }: { centerX?: number; centerY?: number | string }) {
  const frame = useCurrentFrame()
  const logo = progress(frame, 0, 36)
  const clip = interpolate(logo, [0, 1], [100, 0])
  const logoX = interpolate(logo, [0, 1], [-36, 0])
  const lockupScale = interpolate(frame, [0, OTTO_LOGO_REVEAL_HORIZONTAL_INTRO_DURATION], [1.04, 0.98], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: INK, fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          left: '50%',
          opacity: interpolate(logo, [0, 0.28, 1], [0, 1, 1]),
          overflow: 'hidden',
          position: 'absolute',
          top: centerY,
          transform: `translate(-50%, -50%) translateX(${centerX}px) scale(${lockupScale})`,
        }}
      >
        <Img
          src={staticFile('logoOtto.svg')}
          style={{
            clipPath: `inset(0 ${clip}% 0 0)`,
            display: 'block',
            filter: `blur(${interpolate(logo, [0, 1], [1.2, 0])}px)`,
            height: 647,
            transform: `translateX(${logoX}px)`,
            width: 1500,
          }}
        />
      </div>

    </AbsoluteFill>
  )
}

export function OttoLogoRevealReels() {
  const frame = useCurrentFrame()
  const logo = progress(frame, 0, 42)
  const clip = interpolate(logo, [0, 1], [100, 0])
  const iconY = interpolate(logo, [0, 1], [24, 0])
  const iconScale = interpolate(frame, [0, OTTO_LOGO_REVEAL_HORIZONTAL_INTRO_DURATION], [0.92, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ alignItems: 'center', background: '#ffffff', color: INK, display: 'flex', fontFamily: 'Inter, Arial, Helvetica, sans-serif', justifyContent: 'center', overflow: 'hidden' }}>
      <div
        style={{
          alignItems: 'center',
          borderRadius: 40,
          display: 'flex',
          height: 260,
          justifyContent: 'center',
          opacity: interpolate(logo, [0, 0.24, 1], [0, 1, 1]),
          overflow: 'hidden',
          transform: `translateY(${iconY}px) scale(${iconScale})`,
          width: 260,
        }}
      >
        <Img
          src={staticFile('logoOttoIcon.svg')}
          style={{
            clipPath: `inset(0 ${clip}% 0 0)`,
            display: 'block',
            filter: `blur(${interpolate(logo, [0, 1], [1.4, 0])}px)`,
            height: 168,
            width: 168,
          }}
        />
      </div>
    </AbsoluteFill>
  )
}
