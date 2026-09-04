import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion'

import {
  OTTO_INVOICE_CHATGPT_MONITOR_CONTENT_DURATION,
  OTTO_INVOICE_CHATGPT_MONITOR_CONTENT_HEIGHT,
  OTTO_INVOICE_CHATGPT_MONITOR_CONTENT_WIDTH,
  OttoInvoiceChatGptMonitorContent,
} from '@/assets/remotion/compositions/OttoInvoiceChatGptMonitorContent'

export const OTTO_INVOICE_CHATGPT_OFFICE_MONITOR_DURATION = OTTO_INVOICE_CHATGPT_MONITOR_CONTENT_DURATION

const SCREEN = {
  height: 545,
  left: 43.5,
  top: 623.5,
  width: 993,
}

const ZOOM_TARGET = {x: 622, y: 936}
const FINAL_ZOOM = 1.8

export function OttoInvoiceChatGptOfficeMonitor() {
  const frame = useCurrentFrame()
  const scaleX = SCREEN.width / OTTO_INVOICE_CHATGPT_MONITOR_CONTENT_WIDTH
  const scaleY = SCREEN.height / OTTO_INVOICE_CHATGPT_MONITOR_CONTENT_HEIGHT
  const cameraZoom = interpolate(frame, [0, OTTO_INVOICE_CHATGPT_OFFICE_MONITOR_DURATION / 2], [1, FINAL_ZOOM], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const zoomProgress = (cameraZoom - 1) / (FINAL_ZOOM - 1)
  const translateX = zoomProgress * (540 - ZOOM_TARGET.x * FINAL_ZOOM)
  const translateY = zoomProgress * (960 - ZOOM_TARGET.y * FINAL_ZOOM)
  const handheldIn = interpolate(frame, [0, 24], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const handheldX = handheldIn * (Math.sin(frame * 0.071) * 1.7 + Math.sin(frame * 0.019 + 1.3) * 1.1 + Math.sin(frame * 0.151 + 0.4) * 0.45)
  const handheldY = handheldIn * (Math.sin(frame * 0.059 + 0.8) * 1.45 + Math.sin(frame * 0.021 + 2.1) * 1 + Math.sin(frame * 0.137) * 0.4)
  const handheldRotation = handheldIn * (Math.sin(frame * 0.043 + 1.2) * 0.055 + Math.sin(frame * 0.013) * 0.035 + Math.sin(frame * 0.097 + 0.5) * 0.015)

  return (
    <AbsoluteFill style={{background: '#171717', overflow: 'hidden'}}>
      <div
        style={{
          height: 1920,
          left: 0,
          position: 'absolute',
          top: 0,
          transform: `matrix(${cameraZoom}, 0, 0, ${cameraZoom}, ${translateX}, ${translateY})`,
          transformOrigin: 'top left',
          width: 1080,
        }}
      >
        <div
          style={{
            height: '100%',
            left: 0,
            position: 'absolute',
            top: 0,
            transform: `translate(${handheldX}px, ${handheldY}px) rotate(${handheldRotation}deg) scale(1.006)`,
            transformOrigin: '50% 50%',
            width: '100%',
          }}
        >
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
              height: OTTO_INVOICE_CHATGPT_MONITOR_CONTENT_HEIGHT,
              left: 0,
              position: 'absolute',
              top: 0,
              transform: `scale(${scaleX}, ${scaleY})`,
              transformOrigin: 'top left',
              width: OTTO_INVOICE_CHATGPT_MONITOR_CONTENT_WIDTH,
            }}
          >
            <OttoInvoiceChatGptMonitorContent />
          </div>
          <div style={{background: 'linear-gradient(120deg, rgba(255,255,255,.035), transparent 44%, rgba(0,0,0,.035))', inset: 0, pointerEvents: 'none', position: 'absolute'}} />
          <div style={{boxShadow: 'inset 0 0 9px rgba(0,0,0,.18)', inset: 0, pointerEvents: 'none', position: 'absolute'}} />
        </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
