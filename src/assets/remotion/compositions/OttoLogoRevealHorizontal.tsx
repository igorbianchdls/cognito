import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

export const OTTO_LOGO_REVEAL_HORIZONTAL_DURATION = 51

const INK = '#242424'

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

export function OttoLogoRevealHorizontal() {
  const frame = useCurrentFrame()
  const logo = progress(frame, 0, 36)
  const clip = interpolate(logo, [0, 1], [100, 0])
  const logoX = interpolate(logo, [0, 1], [-36, 0])
  const lockupScale = interpolate(frame, [0, OTTO_LOGO_REVEAL_HORIZONTAL_DURATION], [1.04, 0.98], {
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
          top: 330,
          transform: `translate(-50%, -50%) scale(${lockupScale})`,
        }}
      >
        <Img
          src={staticFile('logoOtto.svg')}
          style={{
            clipPath: `inset(0 ${clip}% 0 0)`,
            display: 'block',
            filter: `blur(${interpolate(logo, [0, 1], [1.2, 0])}px)`,
            height: 354,
            transform: `translateX(${logoX}px)`,
            width: 822,
          }}
        />
      </div>

    </AbsoluteFill>
  )
}
