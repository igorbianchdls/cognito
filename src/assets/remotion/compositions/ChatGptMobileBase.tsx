import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, interpolate } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const CHATGPT_MOBILE_FONT_STACK = IOS_REMOTION_FONT_STACK

type ChatGptIconProps = {
  color?: string
  size?: number
  strokeWidth?: number
  style?: CSSProperties
}

function ChatGptIconSvg({ children, color = '#050505', size = 24, strokeWidth = 2.4, style, viewBox = '0 0 24 24' }: ChatGptIconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg
      fill="none"
      height={size}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      style={{ display: 'block', flexShrink: 0, ...style }}
      viewBox={viewBox}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}

function ChatGptMenuIcon(props: ChatGptIconProps) {
  return (
    <ChatGptIconSvg {...props}>
      <path d="M4 7h16" />
      <path d="M4 17h16" />
    </ChatGptIconSvg>
  )
}

function ChatGptComposeIcon(props: ChatGptIconProps) {
  return (
    <ChatGptIconSvg {...props}>
      <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      <path d="M14 5.5 18.5 10" />
      <path d="M20.2 3.8a1.9 1.9 0 0 1 0 2.7L9.5 17.2 5.8 18.2l1-3.7L17.5 3.8a1.9 1.9 0 0 1 2.7 0Z" />
    </ChatGptIconSvg>
  )
}

function ChatGptMoreIcon({ color = '#050505', size = 24, style }: ChatGptIconProps) {
  return (
    <svg fill="none" height={size} style={{ display: 'block', flexShrink: 0, ...style }} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg">
      {[6, 12, 18].map((cx) => (
        <circle key={cx} cx={cx} cy="12" fill={color} r="1.75" />
      ))}
    </svg>
  )
}

function ChatGptPlusIcon(props: ChatGptIconProps) {
  return (
    <ChatGptIconSvg {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </ChatGptIconSvg>
  )
}

function ChatGptMicIcon(props: ChatGptIconProps) {
  return (
    <ChatGptIconSvg {...props}>
      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <path d="M12 19v3" />
    </ChatGptIconSvg>
  )
}

function ChatGptWrenchIcon(props: ChatGptIconProps) {
  return (
    <ChatGptIconSvg {...props}>
      <path d="M14.7 6.3a4.5 4.5 0 0 0-5.4 5.4l-4.7 4.7a2 2 0 1 0 2.8 2.8l4.7-4.7a4.5 4.5 0 0 0 5.6-5.6l-3 3-2.8-2.8 2.8-2.8Z" />
    </ChatGptIconSvg>
  )
}

function ChatGptCopyIcon(props: ChatGptIconProps) {
  return (
    <ChatGptIconSvg {...props}>
      <rect height="12" rx="2" width="12" x="8" y="8" />
      <path d="M4 14V6a2 2 0 0 1 2-2h8" />
    </ChatGptIconSvg>
  )
}

function ChatGptVolumeIcon(props: ChatGptIconProps) {
  return (
    <ChatGptIconSvg {...props}>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M17 9.5a4 4 0 0 1 0 5" />
      <path d="M19.5 7a8 8 0 0 1 0 10" />
    </ChatGptIconSvg>
  )
}

function ChatGptThumbsUpIcon(props: ChatGptIconProps) {
  return (
    <ChatGptIconSvg {...props}>
      <path d="M7 21V10" />
      <path d="M7 10 11 3a2 2 0 0 1 3 1.7V8h4a2 2 0 0 1 2 2.3l-1.4 8A3 3 0 0 1 15.6 21H7Z" />
      <path d="M3 10h4v11H3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
    </ChatGptIconSvg>
  )
}

function ChatGptThumbsDownIcon(props: ChatGptIconProps) {
  return (
    <ChatGptIconSvg {...props}>
      <path d="M7 3v11" />
      <path d="M7 14 11 21a2 2 0 0 0 3-1.7V16h4a2 2 0 0 0 2-2.3l-1.4-8A3 3 0 0 0 15.6 3H7Z" />
      <path d="M3 3h4v11H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    </ChatGptIconSvg>
  )
}

function ChatGptUploadIcon(props: ChatGptIconProps) {
  return (
    <ChatGptIconSvg {...props}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </ChatGptIconSvg>
  )
}

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

export function OttoAssistantHeader({ muted = '#8a8a8a' }: { muted?: string }) {
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 9, marginBottom: 13 }}>
      <span style={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(2, 7px)' }}>
        <span style={{ background: '#225f42', borderRadius: 2, display: 'block', height: 7, width: 7 }} />
        <span style={{ background: '#8aa895', borderRadius: 2, display: 'block', height: 7, width: 7 }} />
        <span style={{ background: '#c9d8ce', borderRadius: 2, display: 'block', height: 7, width: 7 }} />
        <span style={{ background: '#225f42', borderRadius: 2, display: 'block', height: 7, width: 7 }} />
      </span>
      <span style={{ color: muted, fontFamily: CHATGPT_MOBILE_FONT_STACK, fontSize: 20, fontWeight: 680, letterSpacing: 0, lineHeight: 1 }}>Otto</span>
    </div>
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
  const icons = [ChatGptCopyIcon, ChatGptVolumeIcon, ChatGptThumbsUpIcon, ChatGptThumbsDownIcon, ChatGptUploadIcon, ChatGptMoreIcon]

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
    <div style={{ ...style, display: 'flex', justifyContent: 'flex-end', paddingRight: 36 }}>
      <div
        style={{
          alignItems: 'center',
          background: '#f1f1f1',
          borderRadius: 60,
          boxSizing: 'border-box',
          color: '#111111',
          display: 'flex',
          fontFamily: CHATGPT_MOBILE_FONT_STACK,
          fontSize: 42,
          fontWeight: 400,
          justifyContent: 'center',
          letterSpacing: 0,
          lineHeight: 1.18,
          maxWidth: 760,
          minHeight: 91,
          padding: '24px 42px',
          width: 'max-content',
        }}
      >
        {fastCharacterTyping(children, style)}
      </div>
    </div>
  )
}

export function ChatGptFlowAssistantText({ children, showHeader = true, style }: { children: ReactNode; showHeader?: boolean; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontFamily: CHATGPT_MOBILE_FONT_STACK,
        fontSize: 42,
        fontWeight: 400,
        letterSpacing: 0,
        lineHeight: 1.34,
        padding: '0 36px',
      }}
    >
      {showHeader ? <OttoAssistantHeader /> : null}
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
        border: '1px solid #eeeeee',
        borderRadius: 16,
        boxShadow: '0 14px 38px rgba(15, 23, 42, 0.08)',
        margin: '0 36px',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

export function ChatGptToolCallCard({
  style,
  toolName,
}: {
  style?: CSSProperties
  toolName: string
}) {
  return (
    <div
      style={{
        ...style,
        alignItems: 'center',
        background: 'transparent',
        border: '1px solid #eeeeee',
        borderRadius: 12,
        boxSizing: 'border-box',
        color: '#111111',
        display: 'flex',
        fontFamily: CHATGPT_MOBILE_FONT_STACK,
        gap: 16,
        margin: '0 36px',
        minHeight: 84,
        padding: '20px 22px',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          border: '1px solid #e3e3e3',
          borderRadius: 12,
          display: 'flex',
          height: 42,
          justifyContent: 'center',
          width: 42,
        }}
      >
        <ChatGptWrenchIcon color="#606060" size={22} strokeWidth={2.2} />
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 12, minWidth: 0 }}>
        <span style={{ color: '#111111', fontSize: 32, fontWeight: 600, letterSpacing: 0, lineHeight: 1.05 }}>
          {toolName}
        </span>
      </div>
    </div>
  )
}

export function ChatGptVoiceButton() {
  return (
    <div style={{ alignItems: 'center', background: '#007aff', borderRadius: 999, display: 'flex', gap: 6, height: 78, justifyContent: 'center', width: 78 }}>
      {[20, 35, 48, 35, 20].map((height, index) => (
        <span key={`${height}-${index}`} style={{ background: '#ffffff', borderRadius: 999, height, width: 6 }} />
      ))}
    </div>
  )
}

export function ChatGptMobileShell({
  children,
  conversationY = 0,
  promptInputBottom,
}: {
  children: ReactNode
  conversationY?: number
  promptInputBottom?: number
}) {
  const conversationBottom = promptInputBottom === undefined ? 264 : promptInputBottom + 126

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#111111', fontFamily: CHATGPT_MOBILE_FONT_STACK, overflow: 'hidden' }}>
      <ChatGptStatusBar />

      <div style={{ borderBottom: '1px solid #e8e8e8', height: 244, left: 0, position: 'absolute', right: 0, top: 0 }} />

      <ChatGptMenuIcon color="#050505" size={54} strokeWidth={2.5} style={{ left: 46, position: 'absolute', top: 155 }} />
      <div style={{ alignItems: 'center', color: '#111111', display: 'flex', fontSize: 46, fontWeight: 600, gap: 5, left: 161, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 153 }}>
        ChatGPT
      </div>
      <ChatGptComposeIcon color="#050505" size={58} strokeWidth={2.6} style={{ left: 852, position: 'absolute', top: 145 }} />
      <ChatGptMoreIcon color="#050505" size={58} style={{ left: 974, position: 'absolute', top: 154 }} />

      <div style={{ bottom: conversationBottom, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 244 }}>
        <div style={{ display: 'grid', gap: 28, padding: '20px 0 760px', transform: `translateY(${conversationY}px)` }}>
          {children}
        </div>
      </div>

      <div style={{ background: '#ffffff', bottom: 0, height: 264, left: 0, position: 'absolute', right: 0 }}>
        <div style={{ alignItems: 'center', background: '#f1f1f1', borderRadius: 999, bottom: promptInputBottom, display: 'flex', height: 104, left: 68, position: 'absolute', right: 68, top: promptInputBottom === undefined ? 0 : undefined }}>
          <ChatGptPlusIcon color="#111111" size={58} strokeWidth={2.3} style={{ left: 31, position: 'absolute', top: 23 }} />
          <span style={{ color: '#8a8a8a', fontSize: 40, fontWeight: 400, left: 130, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 32 }}>Pergunte ao ChatGPT</span>
          <ChatGptMicIcon color="#111111" size={58} strokeWidth={2.5} style={{ position: 'absolute', right: 116, top: 23 }} />
          <div style={{ position: 'absolute', right: 13, top: 13 }}>
            <ChatGptVoiceButton />
          </div>
        </div>
        <div style={{ background: '#050505', borderRadius: 999, bottom: 14, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
      </div>
    </AbsoluteFill>
  )
}
