import {AbsoluteFill, Img, staticFile} from 'remotion'

import {
  OTTO_INVOICE_CHATGPT_NATIVE_DURATION,
  OttoInvoiceChatGptNative,
} from '@/assets/remotion/compositions/OttoInvoiceChatGptNative'

export const OTTO_INVOICE_CHATGPT_DUAL_SCREEN_DURATION = OTTO_INVOICE_CHATGPT_NATIVE_DURATION

const VIDEO_WIDTH = 1536

type ScreenGeometry = {
  clipPath: string
  height: number
  left: number
  reflection: string
  top: number
  width: number
}

const TV_SCREEN: ScreenGeometry = {
  clipPath: 'polygon(0% 0%, 100% 0%, 97.7% 100%, 2.3% 100%)',
  height: 606.25,
  left: 38.75,
  reflection: 'linear-gradient(112deg, rgba(255,224,190,.10) 0%, rgba(255,255,255,.015) 43%, rgba(0,0,0,.08) 100%)',
  top: 386.25,
  width: 992.5,
}

const LAPTOP_SCREEN: ScreenGeometry = {
  clipPath: 'polygon(2.8% 0%, 97.5% 0%, 100% 100%, 0% 100%)',
  height: 315,
  left: 287.5,
  reflection: 'linear-gradient(118deg, rgba(255,213,169,.09) 0%, rgba(255,255,255,.02) 48%, rgba(0,0,0,.08) 100%)',
  top: 1111.25,
  width: 491.25,
}

function AdaptedScreen({geometry}: {geometry: ScreenGeometry}) {
  const scale = geometry.width / VIDEO_WIDTH
  const viewportHeight = geometry.height / scale

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
          height: viewportHeight,
          left: 0,
          position: 'absolute',
          top: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: VIDEO_WIDTH,
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

export function OttoInvoiceChatGptDualScreen() {
  return (
    <AbsoluteFill style={{background: '#23190f', overflow: 'hidden'}}>
      <Img
        src={staticFile('remotion/laptop-chatgpt-otto/dual-screen-bg.png')}
        style={{height: '100%', objectFit: 'cover', width: '100%'}}
      />
      <AdaptedScreen geometry={TV_SCREEN} />
      <AdaptedScreen geometry={LAPTOP_SCREEN} />
    </AbsoluteFill>
  )
}
