import {AbsoluteFill} from 'remotion'

import {
  OTTO_INVOICE_CHATGPT_NATIVE_DURATION,
  OttoInvoiceChatGptNative,
} from '@/assets/remotion/compositions/OttoInvoiceChatGptNative'

export const OTTO_INVOICE_CHATGPT_TV_CONTENT_DURATION = OTTO_INVOICE_CHATGPT_NATIVE_DURATION
export const OTTO_INVOICE_CHATGPT_TV_CONTENT_WIDTH = 986.32
export const OTTO_INVOICE_CHATGPT_TV_CONTENT_HEIGHT = 546.6

const NATIVE_HEIGHT = 968
const TV_CONTENT_SCALE = OTTO_INVOICE_CHATGPT_TV_CONTENT_HEIGHT / NATIVE_HEIGHT
const NATIVE_WIDTH = OTTO_INVOICE_CHATGPT_TV_CONTENT_WIDTH / TV_CONTENT_SCALE
const TV_TITLE_FONT_SIZE = 80 / TV_CONTENT_SCALE

export function OttoInvoiceChatGptTvContent() {
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      <div
        style={{
          height: NATIVE_HEIGHT,
          left: 0,
          position: 'absolute',
          top: 0,
          transform: `scale(${TV_CONTENT_SCALE})`,
          transformOrigin: 'top left',
          width: NATIVE_WIDTH,
        }}
      >
        <OttoInvoiceChatGptNative titleFontSize={TV_TITLE_FONT_SIZE} />
      </div>
    </AbsoluteFill>
  )
}
