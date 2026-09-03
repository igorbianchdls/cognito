import {AbsoluteFill, Img, staticFile} from 'remotion'

import {
  OTTO_INVOICE_CHATGPT_NATIVE_DURATION,
  OttoInvoiceChatGptNative,
} from '@/assets/remotion/compositions/OttoInvoiceChatGptNative'

export const OTTO_INVOICE_CHATGPT_DUAL_SCREEN_DURATION = OTTO_INVOICE_CHATGPT_NATIVE_DURATION

const SOURCE_HEIGHT = 968
const CHATGPT_SIDEBAR_WIDTH = 262
const FINAL_CAMERA_ZOOM = 1.8
const FRAME_CENTER = {x: 540, y: 960}

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

const TV_CONTENT_SCALE = TV_SCREEN.height / SOURCE_HEIGHT
const TV_CONTAINER_CENTER = {
  x: TV_SCREEN.left + (TV_SCREEN.width + CHATGPT_SIDEBAR_WIDTH * TV_CONTENT_SCALE) / 2,
  y: TV_SCREEN.top + TV_SCREEN.height * 0.605,
}

function getCameraTransform(cameraZoom: number) {
  const progress = Math.max(0, Math.min(1, (cameraZoom - 1) / (FINAL_CAMERA_ZOOM - 1)))
  return {
    translateX: progress * (FRAME_CENTER.x - TV_CONTAINER_CENTER.x * FINAL_CAMERA_ZOOM),
    translateY: progress * (FRAME_CENTER.y - TV_CONTAINER_CENTER.y * FINAL_CAMERA_ZOOM),
  }
}

function applyCameraZoom(geometry: ScreenGeometry, cameraZoom: number, translateX: number, translateY: number): ScreenGeometry {
  return {
    ...geometry,
    height: geometry.height * cameraZoom,
    left: geometry.left * cameraZoom + translateX,
    top: geometry.top * cameraZoom + translateY,
    width: geometry.width * cameraZoom,
  }
}

function AdaptedScreen({geometry, primary = false, titleScaleX = 1}: {geometry: ScreenGeometry; primary?: boolean; titleScaleX?: number}) {
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
        <OttoInvoiceChatGptNative titleFontSize={primary ? 120 / scale : 73} titleScaleX={titleScaleX} />
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
  const {translateX, translateY} = getCameraTransform(cameraZoom)
  const cameraProgress = Math.max(0, Math.min(1, (cameraZoom - 1) / (FINAL_CAMERA_ZOOM - 1)))
  const titleScaleX = 0.64 + cameraProgress * 0.36
  const tvGeometry = applyCameraZoom(TV_SCREEN, cameraZoom, translateX, translateY)
  const laptopGeometry = applyCameraZoom(LAPTOP_SCREEN, cameraZoom, translateX, translateY)

  return (
    <AbsoluteFill style={{background: '#23190f', overflow: 'hidden'}}>
      <Img
        src={staticFile('remotion/laptop-chatgpt-otto/dual-screen-bg-v2.png')}
        style={{
          height: '100%',
          objectFit: 'cover',
          transform: `matrix(${cameraZoom}, 0, 0, ${cameraZoom}, ${translateX}, ${translateY})`,
          transformOrigin: 'top left',
          width: '100%',
        }}
      />
      <AdaptedScreen geometry={tvGeometry} primary titleScaleX={titleScaleX} />
      <AdaptedScreen geometry={laptopGeometry} />
    </AbsoluteFill>
  )
}
