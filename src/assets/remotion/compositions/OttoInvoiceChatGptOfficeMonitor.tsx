import {AbsoluteFill, Img, staticFile} from 'remotion'

import {
  OTTO_INVOICE_CHATGPT_TV_CONTENT_DURATION,
  OTTO_INVOICE_CHATGPT_TV_CONTENT_HEIGHT,
  OTTO_INVOICE_CHATGPT_TV_CONTENT_WIDTH,
  OttoInvoiceChatGptTvContent,
} from '@/assets/remotion/compositions/OttoInvoiceChatGptTvContent'

export const OTTO_INVOICE_CHATGPT_OFFICE_MONITOR_DURATION = OTTO_INVOICE_CHATGPT_TV_CONTENT_DURATION

const SCREEN = {
  height: 545,
  left: 43.5,
  top: 623.5,
  width: 993,
}

export function OttoInvoiceChatGptOfficeMonitor() {
  const scaleX = SCREEN.width / OTTO_INVOICE_CHATGPT_TV_CONTENT_WIDTH
  const scaleY = SCREEN.height / OTTO_INVOICE_CHATGPT_TV_CONTENT_HEIGHT

  return (
    <AbsoluteFill style={{background: '#171717', overflow: 'hidden'}}>
      <Img
        src={staticFile('remotion/laptop-chatgpt-otto/office-monitor-bg.png')}
        style={{height: '100%', objectFit: 'cover', width: '100%'}}
      />
      <div
        style={{
          background: '#fff',
          clipPath: 'polygon(0.1% 0%, 99.9% 0%, 100% 99.8%, 0% 100%)',
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
            height: OTTO_INVOICE_CHATGPT_TV_CONTENT_HEIGHT,
            left: 0,
            position: 'absolute',
            top: 0,
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: 'top left',
            width: OTTO_INVOICE_CHATGPT_TV_CONTENT_WIDTH,
          }}
        >
          <OttoInvoiceChatGptTvContent />
        </div>
        <div style={{background: 'linear-gradient(120deg, rgba(255,255,255,.035), transparent 44%, rgba(0,0,0,.035))', inset: 0, pointerEvents: 'none', position: 'absolute'}} />
        <div style={{boxShadow: 'inset 0 0 9px rgba(0,0,0,.18)', inset: 0, pointerEvents: 'none', position: 'absolute'}} />
      </div>
    </AbsoluteFill>
  )
}
