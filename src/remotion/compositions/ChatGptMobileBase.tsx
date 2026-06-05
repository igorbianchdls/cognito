import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, interpolate } from 'remotion'
import {
  Copy,
  Menu,
  Mic,
  MoreHorizontal,
  Plus,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Upload,
  Volume2,
} from 'lucide-react'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/remotion/fonts/sfPro'

loadSfProFonts()

export const CHATGPT_MOBILE_FONT_STACK = IOS_REMOTION_FONT_STACK

export function chatGptMobileProgress(frame: number, start: number, end: number) {
  if (frame <= start) return 0
  if (frame >= end) return 1
  return (frame - start) / (end - start)
}

export function chatGptSequenceStyle(frame: number, start: number, fromY = 20): CSSProperties {
  const opacity = chatGptMobileProgress(frame, start, start + 18)
  const y = interpolate(frame, [start, start + 24], [fromY, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    opacity,
    transform: `translateY(${y}px)`,
  }
}

export function fastCharacterTyping(children: ReactNode, style: CSSProperties) {
  const text = typeof children === 'string' || typeof children === 'number' ? String(children) : null
  if (text === null) return children

  const opacity = typeof style.opacity === 'number' ? style.opacity : 1
  const progress = Math.max(0, Math.min(1, opacity / 0.78))
  const visibleChars = Math.ceil(text.length * progress)
  const visible = text.slice(0, visibleChars)
  const hidden = text.slice(visibleChars)

  return (
    <>
      <span>{visible}</span>
      <span aria-hidden="true" style={{ visibility: 'hidden' }}>{hidden}</span>
    </>
  )
}

export function ChatGptStatusBar() {
  return (
    <>
      <div style={{ color: '#060606', fontSize: 42, fontWeight: 740, left: 78, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 42 }}>18:07</div>
      <div style={{ alignItems: 'flex-end', display: 'flex', gap: 5, height: 30, left: 842, position: 'absolute', top: 54, width: 42 }}>
        {[12, 18, 25, 31].map((height, index) => (
          <span key={height} style={{ background: index > 1 ? '#c8c8c8' : '#050505', borderRadius: 3, display: 'block', height, width: 7 }} />
        ))}
      </div>
      <div style={{ height: 35, left: 903, position: 'absolute', top: 48, width: 50 }}>
        <div style={{ border: '6px solid #050505', borderBottom: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderRadius: '50% 50% 0 0', height: 27, left: 1, position: 'absolute', top: 3, transform: 'rotate(180deg)', width: 48 }} />
        <div style={{ border: '5px solid #050505', borderBottom: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderRadius: '50% 50% 0 0', height: 19, left: 11, position: 'absolute', top: 11, transform: 'rotate(180deg)', width: 29 }} />
        <div style={{ background: '#050505', borderRadius: 999, height: 7, left: 23, position: 'absolute', top: 27, width: 7 }} />
      </div>
      <div style={{ border: '2px solid #bcbcbc', borderRadius: 10, height: 35, left: 965, position: 'absolute', top: 45, width: 67 }}>
        <div style={{ background: '#e8c348', borderRadius: 7, bottom: 2, left: 2, position: 'absolute', top: 2, width: 45 }} />
        <div style={{ color: '#050505', fontSize: 26, fontWeight: 760, left: 18, lineHeight: '31px', position: 'absolute', textAlign: 'center', top: 0, width: 40 }}>24</div>
        <div style={{ background: '#bcbcbc', borderRadius: 3, height: 14, position: 'absolute', right: -6, top: 9, width: 4 }} />
      </div>
    </>
  )
}

export function ChatGptActionRow() {
  const icons = [Copy, Volume2, ThumbsUp, ThumbsDown, Upload, MoreHorizontal]

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 32 }}>
      {icons.map((Icon, index) => (
        <Icon key={index} color="#666666" size={39} strokeWidth={2.5} />
      ))}
    </div>
  )
}

export function ChatGptFlowUserBubble({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div style={{ ...style, display: 'flex', justifyContent: 'flex-end', paddingRight: 42 }}>
      <div
        style={{
          alignItems: 'center',
          background: '#f1f1f1',
          borderRadius: 60,
          boxSizing: 'border-box',
          color: '#111111',
          display: 'flex',
          fontFamily: CHATGPT_MOBILE_FONT_STACK,
          fontSize: 38,
          fontWeight: 400,
          justifyContent: 'center',
          letterSpacing: '-0.76px',
          lineHeight: 1.12,
          maxWidth: 760,
          minHeight: 91,
          padding: '23px 42px',
          width: 'max-content',
        }}
      >
        {fastCharacterTyping(children, style)}
      </div>
    </div>
  )
}

export function ChatGptFlowAssistantText({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontFamily: CHATGPT_MOBILE_FONT_STACK,
        fontSize: 38,
        fontWeight: 400,
        letterSpacing: '-0.76px',
        lineHeight: 1.34,
        padding: '0 42px',
      }}
    >
      {fastCharacterTyping(children, style)}
    </div>
  )
}

export function ChatGptToolResultCard({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        background: '#ffffff',
        border: '1px solid #e6e6e6',
        borderRadius: 28,
        boxShadow: '0 14px 38px rgba(15, 23, 42, 0.08)',
        margin: '0 42px',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

export function ChatGptVoiceButton() {
  return (
    <div style={{ alignItems: 'center', background: '#050505', borderRadius: 999, display: 'flex', gap: 7, height: 78, justifyContent: 'center', width: 78 }}>
      {[20, 35, 48, 35, 20].map((height, index) => (
        <span key={`${height}-${index}`} style={{ background: '#ffffff', borderRadius: 999, height, width: 6 }} />
      ))}
    </div>
  )
}

export function ChatGptMobileShell({ children, conversationY = 0 }: { children: ReactNode; conversationY?: number }) {
  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#111111', fontFamily: CHATGPT_MOBILE_FONT_STACK, overflow: 'hidden' }}>
      <ChatGptStatusBar />

      <Menu color="#050505" size={48} strokeWidth={2.7} style={{ left: 48, position: 'absolute', top: 158 }} />
      <div style={{ alignItems: 'center', color: '#111111', display: 'flex', fontSize: 43, fontWeight: 600, gap: 5, left: 161, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 156 }}>
        ChatGPT
      </div>
      <SquarePen color="#050505" size={47} strokeWidth={2.8} style={{ left: 861, position: 'absolute', top: 149 }} />
      <MoreHorizontal color="#050505" size={51} strokeWidth={3.2} style={{ left: 974, position: 'absolute', top: 157 }} />

      <div style={{ bottom: 264, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 244 }}>
        <div style={{ display: 'grid', gap: 34, padding: '20px 0 760px', transform: `translateY(${conversationY}px)` }}>
          {children}
        </div>
      </div>

      <div style={{ background: '#ffffff', bottom: 0, height: 264, left: 0, position: 'absolute', right: 0 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 21, left: 31, position: 'absolute', right: 31, top: 0 }}>
          <div style={{ alignItems: 'center', background: '#f0f0f0', borderRadius: 999, display: 'flex', height: 84, justifyContent: 'center', width: 84 }}>
            <Plus color="#555555" size={47} strokeWidth={2.4} />
          </div>
          <div style={{ alignItems: 'center', background: '#f0f0f0', borderRadius: 999, display: 'flex', flex: 1, height: 84, minWidth: 0, position: 'relative' }}>
            <span style={{ color: '#858585', fontSize: 40, fontWeight: 430, left: 41, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 23 }}>Pergunte ao ChatGPT</span>
            <Mic color="#777777" size={44} strokeWidth={2.8} style={{ position: 'absolute', right: 103, top: 18 }} />
            <div style={{ position: 'absolute', right: 8, top: 6 }}>
              <ChatGptVoiceButton />
            </div>
          </div>
        </div>
        <div style={{ background: '#050505', borderRadius: 999, bottom: 14, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
      </div>
    </AbsoluteFill>
  )
}
