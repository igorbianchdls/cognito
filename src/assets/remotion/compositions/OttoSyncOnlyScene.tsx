import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'
import { SyncToolResult } from './ChatbotSyncToolAnimation'

loadSfProFonts()

export const OTTO_SYNC_ONLY_SCENE_DURATION = 360

const FONT = IOS_REMOTION_FONT_STACK

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function typed(text: string, progress: number) {
  return text.slice(0, Math.floor(text.length * progress))
}

export function PromptOnly({ frame, prompt }: { frame: number; prompt: string }) {
  const inputIn = p(frame, 0, 18)
  const inputOut = p(frame, 78, 104, [1, 0])
  const typedText = typed(prompt, p(frame, 12, 74))
  const sendReady = p(frame, 58, 74)
  const estimatedLineCount = Math.max(1, Math.ceil(typedText.length / 42))
  const inputHeight = Math.min(330, 254 + Math.max(0, estimatedLineCount - 2) * 44)
  const inputTop = 929 - inputHeight / 2
  const labelTop = inputTop - 74

  return (
    <div
      style={{
        inset: 0,
        opacity: inputIn * inputOut,
        position: 'absolute',
        transform: `translateY(${(1 - inputIn) * 20 - (1 - inputOut) * 18}px)`,
      }}
    >
      <div style={{ alignItems: 'center', color: '#111111', display: 'flex', fontFamily: 'Libre Baskerville, Baskerville, Georgia, Times New Roman, serif', fontSize: 48, fontWeight: 400, gap: 18, justifyContent: 'center', left: 0, letterSpacing: '-0.02em', lineHeight: 1, opacity: p(frame, 8, 24), position: 'absolute', right: 0, top: labelTop, transform: `translateY(${(1 - p(frame, 8, 24)) * 12}px)` }}>
        <span style={{ background: '#D97757', borderRadius: 999, display: 'block', height: 42, width: 42 }} />
        <span>De volta à ação, Igor</span>
      </div>
      <div style={{ height: inputHeight, left: 42, position: 'absolute', right: 42, top: inputTop }}>
        <div style={{ background: '#fbfaf8', border: '1.5px solid #bebcb7', borderRadius: 68, boxShadow: '0 20px 48px rgba(20,24,22,0.16)', height: inputHeight, left: 0, position: 'absolute', right: 0, top: 0 }}>
          <div style={{ color: typedText ? '#111111' : '#77746f', fontSize: 42, fontWeight: 450, left: 36, letterSpacing: '-0.01em', lineHeight: 1.18, maxHeight: inputHeight - 162, overflow: 'hidden', position: 'absolute', right: 36, top: 42, whiteSpace: 'pre-wrap' }}>
            {typedText || 'Chat with Claude'}
          </div>
          <div style={{ alignItems: 'center', bottom: 19, display: 'flex', gap: 19, left: 22, position: 'absolute', right: 24 }}>
            <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, color: '#111111', display: 'flex', fontSize: 42, fontWeight: 360, height: 90, justifyContent: 'center', width: 90 }}>+</div>
            <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, color: '#111111', display: 'flex', fontSize: 35, fontWeight: 520, height: 78, justifyContent: 'center', letterSpacing: 0, padding: '0 42px', whiteSpace: 'nowrap' }}>Sonnet 4.6</div>
            <div style={{ flex: 1 }} />
            <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, display: 'flex', height: 90, justifyContent: 'center', width: 90 }}>
              <svg fill="none" height="42" viewBox="0 0 62 62" width="42" xmlns="http://www.w3.org/2000/svg">
                <rect height="32" rx="14" stroke="#333330" strokeWidth="5.8" width="24" x="19" y="7" />
                <path d="M12 29v5c0 10.5 8.2 19 19 19s19-8.5 19-19v-5" stroke="#333330" strokeLinecap="round" strokeWidth="5.8" />
                <path d="M31 53v6" stroke="#333330" strokeLinecap="round" strokeWidth="5.8" />
              </svg>
            </div>
            <div style={{ alignItems: 'center', background: sendReady ? '#050505' : '#efeeeb', borderRadius: 999, display: 'flex', gap: 7, height: 90, justifyContent: 'center', width: 90 }}>
              {[23, 36, 50, 36, 23].map((height, index) => <span key={`${height}-${index}`} style={{ background: sendReady ? '#ffffff' : '#77746f', borderRadius: 999, height, width: 6 }} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OttoSyncOnlyScene() {
  const frame = useCurrentFrame()
  const prompt = 'Concilie bancos, cartoes e movimentacoes financeiras.'
  const cardIn = p(frame, 104, 126)

  return (
    <AbsoluteFill style={{ background: 'transparent', color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>
      <PromptOnly frame={frame} prompt={prompt} />
      <div style={{ left: 82, opacity: cardIn, position: 'absolute', right: 82, top: 650, transform: `translateY(${(1 - cardIn) * 18}px)` }}>
        <SyncToolResult frame={frame} showHeader={false} start={104} />
      </div>
    </AbsoluteFill>
  )
}
