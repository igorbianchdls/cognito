import {Easing, interpolate, useCurrentFrame} from 'remotion'

import {
  OTTO_INVOICE_CHATGPT_DUAL_SCREEN_DURATION,
  OttoInvoiceChatGptDualScreen,
} from '@/assets/remotion/compositions/OttoInvoiceChatGptDualScreen'

export const OTTO_INVOICE_CHATGPT_TV_ZOOM_DURATION = OTTO_INVOICE_CHATGPT_DUAL_SCREEN_DURATION

export function OttoInvoiceChatGptTvZoom() {
  const frame = useCurrentFrame()
  const cameraZoom = interpolate(
    frame,
    [0, OTTO_INVOICE_CHATGPT_TV_ZOOM_DURATION - 1],
    [1, 1.8],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  )

  return <OttoInvoiceChatGptDualScreen cameraZoom={cameraZoom} />
}
