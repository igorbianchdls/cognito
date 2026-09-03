import {AbsoluteFill, Img, staticFile} from 'remotion'

import {
  OTTO_INVOICE_CHATGPT_NATIVE_DURATION,
  OttoInvoiceChatGptNative,
} from '@/assets/remotion/compositions/OttoInvoiceChatGptNative'

export const OTTO_INVOICE_CHATGPT_DUAL_SCREEN_DURATION = OTTO_INVOICE_CHATGPT_NATIVE_DURATION

const SOURCE_HEIGHT = 968

type ScreenGeometry = {
  clipPath: string
  height: number
  left: number
  reflection: string
  top: number
  width: number
}

const TV_SCREEN: ScreenGeometry = {
  clipPath: 'polygon(0.1% 0%, 99.9% 0%, 99.8% 100%, 0.2% 100%)',
  height: 546.6,
  left: 46.8,
  reflection: 'linear-gradient(112deg, rgba(255,224,190,.10) 0%, rgba(255,255,255,.015) 43%, rgba(0,0,0,.08) 100%)',
  top: 365.13,
  width: 986.32,
}

const LAPTOP_SCREEN: ScreenGeometry = {
  clipPath: 'polygon(2.5% 0%, 97.8% 0%, 100% 100%, 0% 100%)',
  height: 302.01,
  left: 332.44,
  reflection: 'linear-gradient(118deg, rgba(255,213,169,.09) 0%, rgba(255,255,255,.02) 48%, rgba(0,0,0,.08) 100%)',
  top: 1084.02,
  width: 458.18,
}

const TV_FOCUS = {
  x: TV_SCREEN.left + TV_SCREEN.width / 2,
  y: TV_SCREEN.top + TV_SCREEN.height / 2,
}

function applyCameraZoom(geometry: ScreenGeometry, cameraZoom: number): ScreenGeometry {
  return {
    ...geometry,
    height: geometry.height * cameraZoom,
    left: TV_FOCUS.x + (geometry.left - TV_FOCUS.x) * cameraZoom,
    top: TV_FOCUS.y + (geometry.top - TV_FOCUS.y) * cameraZoom,
    width: geometry.width * cameraZoom,
  }
}

function AdaptedScreen({geometry}: {geometry: ScreenGeometry}) {
  const scale = geometry.height / SOURCE_HEIGHT
  const sourceWidth = geometry.width / scale

  return (
    <div
      style={{
        background: '#fff',
        clipPath: geometry.clipPath,
        height: geometry.height,
        left: geometry.left,
        overflow: 'hidden',
        position: 'absolute',
        top: geometry.top,
        width: geometry.width,
      }}
    >
      <div
        style={{
          height: SOURCE_HEIGHT,
          left: 0,
          position: 'absolute',
          top: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: sourceWidth,
        }}
      >
        <OttoInvoiceChatGptNative />
      </div>

      <div
        style={{
          background: geometry.reflection,
          inset: 0,
          mixBlendMode: 'soft-light',
          pointerEvents: 'none',
          position: 'absolute',
        }}
      />
      <div
        style={{
          boxShadow: 'inset 0 0 18px rgba(0,0,0,.24)',
          inset: 0,
          pointerEvents: 'none',
          position: 'absolute',
        }}
      />
    </div>
  )
}

export function OttoInvoiceChatGptDualScreen({cameraZoom = 1}: {cameraZoom?: number} = {}) {
  const tvGeometry = applyCameraZoom(TV_SCREEN, cameraZoom)
  const laptopGeometry = applyCameraZoom(LAPTOP_SCREEN, cameraZoom)

  return (
    <AbsoluteFill style={{background: '#23190f', overflow: 'hidden'}}>
      <Img
        src={staticFile('remotion/laptop-chatgpt-otto/dual-screen-bg-v2.png')}
        style={{
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${cameraZoom})`,
          transformOrigin: `${TV_FOCUS.x}px ${TV_FOCUS.y}px`,
          width: '100%',
        }}
      />
      <AdaptedScreen geometry={tvGeometry} />
      <AdaptedScreen geometry={laptopGeometry} />
    </AbsoluteFill>
  )
}
