import {AbsoluteFill, Img, staticFile} from 'remotion'

import {
  OTTO_INVOICE_CHATGPT_NATIVE_DURATION,
  OttoInvoiceChatGptNative,
} from '@/assets/remotion/compositions/OttoInvoiceChatGptNative'

export const OTTO_INVOICE_CHATGPT_LAPTOP_DURATION = OTTO_INVOICE_CHATGPT_NATIVE_DURATION

const VIDEO_WIDTH = 1536
const LAPTOP_VIEWPORT_HEIGHT = 968

const SCREEN = {
  height: 521,
  left: 126,
  top: 593,
  width: 827,
}

const SCREEN_SCALE = SCREEN.width / VIDEO_WIDTH

export function OttoInvoiceChatGptLaptop() {
  return (
    <AbsoluteFill style={{background: '#17110d', overflow: 'hidden'}}>
      <Img
        src={staticFile('remotion/laptop-chatgpt-otto/laptop-screen-bg.png')}
        style={{height: '100%', objectFit: 'cover', width: '100%'}}
      />

      <div
        style={{
          background: '#ffffff',
          borderRadius: 7,
          boxShadow: 'inset 0 0 18px rgba(0,0,0,0.28)',
          height: SCREEN.height,
          left: SCREEN.left,
          overflow: 'hidden',
          position: 'absolute',
          top: SCREEN.top,
          width: SCREEN.width,
        }}
      >
        <div
          style={{
            height: LAPTOP_VIEWPORT_HEIGHT,
            left: 0,
            position: 'absolute',
            top: 0,
            transform: `scale(${SCREEN_SCALE})`,
            transformOrigin: 'top left',
            width: VIDEO_WIDTH,
          }}
        >
          <OttoInvoiceChatGptNative />
        </div>

        <div
          style={{
            background: 'linear-gradient(118deg, rgba(255,220,174,0.10) 0%, rgba(255,255,255,0.025) 36%, rgba(0,0,0,0.08) 100%)',
            inset: 0,
            mixBlendMode: 'soft-light',
            pointerEvents: 'none',
            position: 'absolute',
          }}
        />
        <div style={{boxShadow: 'inset 0 0 12px rgba(0,0,0,0.2)', inset: 0, pointerEvents: 'none', position: 'absolute'}} />
      </div>

      <div
        style={{
          background: '#050505',
          borderRadius: '0 0 8px 8px',
          height: 22,
          left: 486,
          position: 'absolute',
          top: 592,
          width: 109,
        }}
      />
    </AbsoluteFill>
  )
}
