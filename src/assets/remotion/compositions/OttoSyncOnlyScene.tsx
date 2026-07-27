import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'
import { SyncToolResult } from './ChatbotSyncToolAnimation'

loadSfProFonts()

export const OTTO_SYNC_ONLY_SCENE_DURATION = 360

const FONT = IOS_REMOTION_FONT_STACK
const APP_BACKGROUND = '#fdfdfc'

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function typed(text: string, progress: number) {
  return text.slice(0, Math.floor(text.length * progress))
}

function PromptOnly({ frame, prompt }: { frame: number; prompt: string }) {
  const inputIn = p(frame, 0, 18)
  const inputOut = p(frame, 78, 104, [1, 0])
  const typedText = typed(prompt, p(frame, 12, 74))
  const sendReady = p(frame, 58, 74)

  return (
    <div
      style={{
        alignItems: 'center',
        background: APP_BACKGROUND,
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        opacity: inputIn * inputOut,
        position: 'absolute',
        transform: `translateY(${(1 - inputIn) * 20 - (1 - inputOut) * 18}px)`,
      }}
    >
      <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e4e4e2', borderRadius: 54, boxShadow: '0 18px 58px rgba(15,23,42,0.08)', color: '#111111', display: 'flex', fontSize: 34, fontWeight: 430, minHeight: 108, padding: '0 30px 0 40px', width: 900 }}>
        <span style={{ flex: 1, lineHeight: 1.18, maxWidth: 740, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {typedText}
        </span>
        <span style={{ alignItems: 'center', background: sendReady ? '#111111' : '#f1f1f1', borderRadius: 999, color: sendReady ? '#ffffff' : '#9a9a9a', display: 'flex', fontSize: 30, height: 62, justifyContent: 'center', marginLeft: 24, width: 62 }}>{'\u2191'}</span>
      </div>
    </div>
  )
}

export function OttoSyncOnlyScene() {
  const frame = useCurrentFrame()
  const prompt = 'Concilie bancos, cartoes e movimentacoes financeiras.'
  const cardIn = p(frame, 104, 126)

  return (
    <AbsoluteFill style={{ background: APP_BACKGROUND, color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>
      <PromptOnly frame={frame} prompt={prompt} />
      <div style={{ left: 82, opacity: cardIn, position: 'absolute', right: 82, top: 650, transform: `translateY(${(1 - cardIn) * 18}px)` }}>
        <SyncToolResult frame={frame} showHeader={false} start={104} />
      </div>
    </AbsoluteFill>
  )
}
