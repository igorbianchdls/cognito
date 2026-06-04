import type { CSSProperties, ReactNode } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/remotion/fonts/sfPro'

const MOBILE_RESULT_WIDTH = 430
const MOBILE_RESULT_ZOOM = 2.08

loadSfProFonts()

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

export function McpMobileResultFrame({
  children,
  startFrame = 0,
  style,
}: {
  children: ReactNode
  startFrame?: number
  style?: CSSProperties
}) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const opacity = progress(localFrame, 0, 18)
  const y = interpolate(localFrame, [0, 22], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        opacity,
        overflow: 'hidden',
        transform: `translateY(${y}px)`,
        width: '100%',
        ...style,
      }}
    >
      <div
        className="app-shell"
        style={{
          color: 'var(--cognito-text)',
          fontFamily: IOS_REMOTION_FONT_STACK,
          gap: 12,
          letterSpacing: '-0.02em',
          margin: 0,
          maxWidth: MOBILE_RESULT_WIDTH,
          padding: '18px 14px',
          width: MOBILE_RESULT_WIDTH,
          zoom: MOBILE_RESULT_ZOOM,
        } as CSSProperties & { zoom: number }}
      >
        {children}
      </div>
    </div>
  )
}
