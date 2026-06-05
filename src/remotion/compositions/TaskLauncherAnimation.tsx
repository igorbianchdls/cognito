import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  FileText,
  Folder,
  FolderOpen,
  MessageSquare,
  MousePointer2,
  PanelTop,
  Plus,
  Zap,
} from 'lucide-react'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/remotion/fonts/sfPro'

loadSfProFonts()

const FONT_STACK = IOS_REMOTION_FONT_STACK

function ease(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

const actions = [
  { icon: FileText, label: 'Create a file' },
  { icon: BarChart3, label: 'Crunch data' },
  { icon: PanelTop, label: 'Make a prototype' },
  { icon: CalendarDays, label: 'Prep for the day' },
  { icon: Folder, label: 'Organize files' },
  { icon: MessageSquare, label: 'Send a message' },
]

const promptText = 'Summarize my meetings from this week and find the action items. Where should I start?'

export function TaskLauncherAnimation() {
  const frame = useCurrentFrame()
  const intro = ease(frame, 0, 34)
  const cursorIn = ease(frame, 32, 56)
  const select = ease(frame, 62, 92)
  const promptIn = ease(frame, 90, 128)
  const ctaIn = ease(frame, 142, 172)
  const typedChars = Math.floor(interpolate(frame, [118, 176], [0, promptText.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }))

  const shellY = interpolate(promptIn, [0, 1], [0, -88])
  const promptHeight = interpolate(promptIn, [0, 1], [0, 238])
  const cursorX = interpolate(frame, [32, 72, 110], [735, 465, 914], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const cursorY = interpolate(frame, [32, 72, 110], [850, 820, 1102], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ background: '#f8f7f2', color: '#171411', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div
        style={{
          backgroundImage: 'linear-gradient(rgba(23,20,17,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(23,20,17,0.045) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          inset: 0,
          opacity: 0.85,
          position: 'absolute',
        }}
      />
      <div style={{ background: 'radial-gradient(circle at 50% 44%, rgba(255,255,255,0.86), rgba(248,247,242,0.12) 62%)', inset: -120, position: 'absolute' }} />

      <main
        style={{
          left: 104,
          opacity: intro,
          position: 'absolute',
          right: 104,
          top: 462,
          transform: `translateY(${(1 - intro) * 26 + shellY}px)`,
        }}
      >
        <div style={{ alignItems: 'center', display: 'grid', gap: 18, justifyItems: 'center', marginBottom: 58 }}>
          <div style={{ alignItems: 'center', color: '#b85c46', display: 'grid', height: 48, justifyItems: 'center', transform: `rotate(${interpolate(frame, [0, 34], [-16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}deg) scale(${0.86 + intro * 0.14})`, width: 48 }}>
            <Zap size={42} strokeWidth={2.8} />
          </div>
          <h1 style={{ color: '#191512', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 48, fontWeight: 760, letterSpacing: 0, lineHeight: 1, margin: 0 }}>
            Let&apos;s knock something off your list
          </h1>
        </div>

        <section
          style={{
            background: 'rgba(255,255,255,0.62)',
            border: '1px solid rgba(40,35,30,0.08)',
            borderRadius: 32,
            boxShadow: '0 26px 80px rgba(40,35,30,0.10)',
            overflow: 'hidden',
            padding: 22,
          }}
        >
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {actions.map(({ icon: Icon, label }, index) => {
              const active = index === 4
              const itemIn = ease(frame, 10 + index * 4, 40 + index * 4)
              return (
                <div
                  key={label}
                  style={{
                    alignItems: 'center',
                    background: active ? `rgba(225,222,210,${0.28 + select * 0.58})` : 'rgba(255,255,255,0.72)',
                    border: `2px solid ${active ? `rgba(40,35,30,${0.12 + select * 0.18})` : 'rgba(40,35,30,0.10)'}`,
                    borderRadius: 15,
                    boxShadow: active ? `0 ${10 + select * 12}px ${24 + select * 28}px rgba(40,35,30,${0.06 + select * 0.08})` : '0 8px 18px rgba(40,35,30,0.04)',
                    display: 'grid',
                    gap: 20,
                    gridTemplateColumns: '54px 1fr',
                    height: 86,
                    opacity: itemIn,
                    padding: '0 24px',
                    transform: `translateY(${(1 - itemIn) * 16}px) scale(${active ? 1 + select * 0.012 : 1})`,
                  }}
                >
                  <span style={{ alignItems: 'center', background: '#f5f4ef', border: '2px solid rgba(40,35,30,0.10)', borderRadius: 8, color: '#b7b4ad', display: 'flex', height: 42, justifyContent: 'center', width: 42 }}>
                    <Icon size={28} strokeWidth={1.9} />
                  </span>
                  <strong style={{ color: '#3b352f', fontSize: 20, fontWeight: 760, letterSpacing: 0, lineHeight: 1 }}>{label}</strong>
                </div>
              )
            })}
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(40,35,30,0.12)',
              borderRadius: 20,
              boxShadow: '0 18px 46px rgba(40,35,30,0.10)',
              height: promptHeight,
              marginTop: interpolate(promptIn, [0, 1], [0, 20]),
              opacity: promptIn,
              overflow: 'hidden',
              padding: promptIn > 0 ? '26px 22px 18px' : 0,
              transform: `translateY(${(1 - promptIn) * -18}px)`,
            }}
          >
            <p style={{ color: '#2b2723', fontSize: 24, fontWeight: 600, letterSpacing: 0, lineHeight: 1.36, margin: 0, minHeight: 70 }}>
              {promptText.slice(0, typedChars)}
              <span style={{ color: `rgba(184,92,70,${Math.sin(frame / 5) > 0 ? 1 : 0})` }}>|</span>
            </p>
            <div style={{ alignItems: 'center', bottom: 18, display: 'flex', left: 22, position: 'absolute', right: 22 }}>
              <div style={{ alignItems: 'center', background: '#f7f6f1', border: '1px solid rgba(40,35,30,0.12)', borderRadius: 8, color: '#4d463e', display: 'flex', fontSize: 13, fontWeight: 800, gap: 7, height: 30, opacity: ctaIn, padding: '0 10px' }}>
                <FolderOpen size={15} strokeWidth={2.1} />
                Work in a folder
              </div>
              <Plus color="#6f675f" size={22} strokeWidth={2.1} style={{ marginLeft: 26, opacity: ctaIn }} />
              <button
                style={{
                  alignItems: 'center',
                  background: '#bd5f4c',
                  border: 0,
                  borderRadius: 13,
                  boxShadow: '0 16px 34px rgba(189,95,76,0.22)',
                  color: '#fffaf5',
                  display: 'flex',
                  fontFamily: FONT_STACK,
                  fontSize: 16,
                  fontWeight: 820,
                  gap: 10,
                  height: 52,
                  marginLeft: 'auto',
                  opacity: ctaIn,
                  padding: '0 22px',
                  transform: `translateX(${(1 - ctaIn) * 18}px)`,
                }}
                type="button"
              >
                Let&apos;s go
                <ArrowRight size={19} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <MousePointer2
        color="#111111"
        fill="#111111"
        size={54}
        strokeWidth={1.6}
        style={{
          filter: 'drop-shadow(0 8px 10px rgba(20,20,20,0.24))',
          left: cursorX,
          opacity: cursorIn,
          position: 'absolute',
          top: cursorY,
          transform: `rotate(-12deg) scale(${1 + select * 0.08})`,
          zIndex: 20,
        }}
      />
    </AbsoluteFill>
  )
}
