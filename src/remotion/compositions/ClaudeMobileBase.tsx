import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'
import { Copy, Menu, Mic, MoreHorizontal, Play, Plus, RotateCcw, ThumbsDown, ThumbsUp, Upload } from 'lucide-react'

import { chatGptSequenceStyle } from '@/remotion/compositions/ChatGptMobileBase'
import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/remotion/fonts/sfPro'

loadSfProFonts()

export const CLAUDE_MOBILE_FONT_STACK = IOS_REMOTION_FONT_STACK
export const claudeSequenceStyle = chatGptSequenceStyle

export function ClaudeStatusBar() {
  return (
    <>
      <div style={{ color: '#060606', fontSize: 42, fontWeight: 740, left: 78, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 42 }}>19:04</div>
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
        <div style={{ color: '#050505', fontSize: 26, fontWeight: 760, left: 25, lineHeight: '31px', position: 'absolute', textAlign: 'center', top: 0, width: 30 }}>5</div>
        <div style={{ background: '#bcbcbc', borderRadius: 3, height: 14, position: 'absolute', right: -6, top: 9, width: 4 }} />
      </div>
    </>
  )
}

export function ClaudeActionRow({ second = false }: { second?: boolean }) {
  const icons = second ? [Copy, Upload, Play, ThumbsUp, ThumbsDown, RotateCcw] : [Copy, Play, ThumbsUp, ThumbsDown, RotateCcw]

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 36 }}>
      {icons.map((Icon, index) => (
        <Icon key={`${second ? 'second' : 'first'}-${index}`} color="#777772" size={39} strokeWidth={2.35} />
      ))}
    </div>
  )
}

export function ClaudeFlowUserBubble({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div style={{ ...style, display: 'flex', justifyContent: 'flex-end', paddingRight: 42 }}>
      <div
        style={{
          alignItems: 'center',
          background: '#f1f0ee',
          border: '1px solid #dfddd8',
          borderRadius: 68,
          boxSizing: 'border-box',
          color: '#111111',
          display: 'flex',
          fontFamily: CLAUDE_MOBILE_FONT_STACK,
          fontSize: 38,
          fontWeight: 400,
          justifyContent: 'center',
          letterSpacing: '-0.76px',
          lineHeight: 1.12,
          maxWidth: 760,
          minHeight: 96,
          padding: '25px 40px',
          width: 'max-content',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function ClaudeFlowAssistantText({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 43,
        fontWeight: 500,
        letterSpacing: '-0.55px',
        lineHeight: 1.26,
        padding: '0 42px',
      }}
    >
      {children}
    </div>
  )
}

export function ClaudeToolResultCard({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      className="claude-tool-result-card"
      style={{
        ...style,
        background: 'transparent',
        border: '1px solid #dfddd8',
        borderRadius: 28,
        boxShadow: '0 14px 38px rgba(20, 24, 22, 0.10)',
        margin: '0 42px',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

export function ClaudeVoiceButton() {
  return (
    <div style={{ alignItems: 'center', background: '#050505', borderRadius: 999, display: 'flex', gap: 6, height: 78, justifyContent: 'center', width: 78 }}>
      {[19, 29, 39, 29, 19].map((height, index) => (
        <span key={`${height}-${index}`} style={{ background: '#ffffff', borderRadius: 999, height, width: 5 }} />
      ))}
    </div>
  )
}

export function ClaudeMobileShell({ children, conversationY = 0 }: { children: ReactNode; conversationY?: number }) {
  return (
    <AbsoluteFill style={{ background: '#fbfaf8', color: '#111111', fontFamily: CLAUDE_MOBILE_FONT_STACK, overflow: 'hidden' }}>
      <style>
        {`
          .claude-tool-result-card,
          .claude-tool-result-card .app-shell,
          .claude-tool-result-card .chart-card,
          .claude-tool-result-card .table-card,
          .claude-tool-result-card .table-scroll,
          .claude-tool-result-card .table-pagination,
          .claude-tool-result-card .data-table th,
          .claude-tool-result-card .data-table tbody tr,
          .claude-tool-result-card .data-table td,
          .claude-tool-result-card .dashboard-card,
          .claude-tool-result-card .catalog-panel,
          .claude-tool-result-card .connector-result,
          .claude-tool-result-card .connectors-directory,
          .claude-tool-result-card .analysis-panel {
            background: transparent !important;
          }

          .claude-tool-result-card {
            --cognito-bg: transparent;
            --cognito-surface: transparent;
            --cognito-surface-muted: transparent;
          }
        `}
      </style>
      <ClaudeStatusBar />

      <Menu color="#333330" size={47} strokeWidth={2.4} style={{ left: 61, position: 'absolute', top: 161 }} />
      <div style={{ alignItems: 'center', background: '#333330', borderRadius: 999, display: 'flex', height: 54, justifyContent: 'center', left: 837, position: 'absolute', top: 151, width: 54 }}>
        <Plus color="#ffffff" size={42} strokeWidth={3.2} />
      </div>
      <MoreHorizontal color="#333330" size={50} strokeWidth={3.2} style={{ left: 969, position: 'absolute', top: 158 }} />

      <div style={{ bottom: 340, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 226 }}>
        <div style={{ display: 'grid', gap: 34, padding: '20px 0 820px', transform: `translateY(${conversationY}px)` }}>
          {children}
        </div>
      </div>

      <div style={{ background: '#fbfaf8', bottom: 0, height: 340, left: 0, position: 'absolute', right: 0 }}>
        <div style={{ background: '#fbfaf8', border: '1.5px solid #bebcb7', borderRadius: 68, boxShadow: '0 20px 48px rgba(20,24,22,0.16)', height: 254, left: 42, position: 'absolute', right: 42, top: 0 }}>
          <div style={{ color: '#77746f', fontSize: 42, fontWeight: 450, left: 36, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 53 }}>Responder a Claude</div>
          <div style={{ alignItems: 'center', display: 'flex', gap: 19, left: 22, position: 'absolute', right: 24, top: 145 }}>
            <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, display: 'flex', height: 78, justifyContent: 'center', width: 78 }}>
              <Plus color="#111111" size={43} strokeWidth={2.6} />
            </div>
            <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, color: '#111111', display: 'flex', fontSize: 35, fontWeight: 520, height: 78, justifyContent: 'center', letterSpacing: 0, padding: '0 42px', whiteSpace: 'nowrap' }}>Sonnet 4.6</div>
            <div style={{ flex: 1 }} />
            <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, display: 'flex', height: 78, justifyContent: 'center', width: 78 }}>
              <Mic color="#333330" size={45} strokeWidth={2.8} />
            </div>
            <ClaudeVoiceButton />
          </div>
        </div>
        <div style={{ background: '#050505', borderRadius: 999, bottom: 14, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
      </div>
    </AbsoluteFill>
  )
}
