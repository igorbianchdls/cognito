import {AbsoluteFill, Img, staticFile} from 'remotion'

import {
  OTTO_INVOICE_CHATGPT_NATIVE_DURATION,
  OttoInvoiceChatGptNative,
} from '@/assets/remotion/compositions/OttoInvoiceChatGptNative'

export const OTTO_INVOICE_CHATGPT_LAPTOP_DURATION = OTTO_INVOICE_CHATGPT_NATIVE_DURATION

const VIDEO_WIDTH = 1536
const LAPTOP_VIEWPORT_HEIGHT = 968
const ZOOM = 1.6
const FOCUS_X = 540
const FOCUS_Y = 1920 * 0.44

const SCREEN = {
  height: 521,
  left: 126,
  top: 593,
  width: 827,
}

const zoomX = (value: number) => FOCUS_X + (value - FOCUS_X) * ZOOM
const zoomY = (value: number) => FOCUS_Y + (value - FOCUS_Y) * ZOOM

const ZOOMED_SCREEN = {
  height: SCREEN.height * ZOOM,
  left: zoomX(SCREEN.left),
  top: zoomY(SCREEN.top),
  width: SCREEN.width * ZOOM,
}

const VIDEO_SCALE = ZOOMED_SCREEN.width / VIDEO_WIDTH

export function OttoInvoiceChatGptLaptop() {
  return (
    <AbsoluteFill style={{background: '#17110d', overflow: 'hidden'}}>
      <Img
        src={staticFile('remotion/laptop-chatgpt-otto/laptop-screen-bg.png')}
        style={{height: '100%', objectFit: 'cover', transform: `scale(${ZOOM})`, transformOrigin: '50% 44%', width: '100%'}}
      />

      <div
        style={{
          background: '#ffffff',
          borderRadius: 11,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.25)',
          height: ZOOMED_SCREEN.height,
          left: ZOOMED_SCREEN.left,
          overflow: 'hidden',
          position: 'absolute',
          top: ZOOMED_SCREEN.top,
          width: ZOOMED_SCREEN.width,
        }}
      >
        <div
          style={{
            height: LAPTOP_VIEWPORT_HEIGHT,
            left: 0,
            position: 'absolute',
            top: 0,
            transform: `scale(${VIDEO_SCALE})`,
            transformOrigin: 'top left',
            width: VIDEO_WIDTH,
          }}
        >
          <OttoInvoiceChatGptNative />
        </div>

        <div
          style={{
            background: 'linear-gradient(118deg, rgba(255,220,174,0.08) 0%, rgba(255,255,255,0.02) 36%, rgba(0,0,0,0.06) 100%)',
            inset: 0,
            mixBlendMode: 'soft-light',
            pointerEvents: 'none',
            position: 'absolute',
          }}
        />
        <div style={{boxShadow: 'inset 0 0 15px rgba(0,0,0,0.18)', inset: 0, pointerEvents: 'none', position: 'absolute'}} />
      </div>

      <div
        style={{
          background: '#050505',
          borderRadius: '0 0 12px 12px',
          height: 22 * ZOOM,
          left: zoomX(486),
          position: 'absolute',
          top: zoomY(592),
          width: 109 * ZOOM,
        }}
      />
    </AbsoluteFill>
  )
}
