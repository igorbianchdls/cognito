import {
  OTTO_INVOICE_CHATGPT_TV_CONTENT_HEIGHT,
  OTTO_INVOICE_CHATGPT_TV_CONTENT_NO_INTRO_DURATION,
  OTTO_INVOICE_CHATGPT_TV_CONTENT_WIDTH,
  OttoInvoiceChatGptTvContent,
} from '@/assets/remotion/compositions/OttoInvoiceChatGptTvContent'

export const OTTO_INVOICE_CHATGPT_MONITOR_CONTENT_DURATION = OTTO_INVOICE_CHATGPT_TV_CONTENT_NO_INTRO_DURATION
export const OTTO_INVOICE_CHATGPT_MONITOR_CONTENT_WIDTH = OTTO_INVOICE_CHATGPT_TV_CONTENT_WIDTH
export const OTTO_INVOICE_CHATGPT_MONITOR_CONTENT_HEIGHT = OTTO_INVOICE_CHATGPT_TV_CONTENT_HEIGHT

export function OttoInvoiceChatGptMonitorContent() {
  return <OttoInvoiceChatGptTvContent conversationLiftAmount={52} conversationLiftEnd={7.1} promptBottom={14} titleFontSize={220} titleVerticalPadding={6} withIntro={false} />
}
