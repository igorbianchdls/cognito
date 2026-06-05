import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import {
  ArrowUp,
  BarChart3,
  CalendarDays,
  FileText,
  Folder,
  Menu,
  MessageSquare,
  Mic,
  MoreHorizontal,
  MousePointer2,
  PanelTop,
  Plus,
  SquarePen,
} from 'lucide-react'

import { CHATGPT_MOBILE_FONT_STACK, ChatGptStatusBar } from './ChatGptMobileBase'

function ease(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

const actions = [
  { icon: FileText, label: 'Criar arquivo' },
  { icon: BarChart3, label: 'Analisar dados' },
  { icon: PanelTop, label: 'Criar prototipo' },
  { icon: CalendarDays, label: 'Preparar o dia' },
  { icon: Folder, label: 'Organizar arquivos' },
  { icon: MessageSquare, label: 'Enviar mensagem' },
]

const promptText = 'Resuma minhas reunioes da semana e encontre os proximos passos.'

export function ChatGptTaskLauncherAnimation() {
  const frame = useCurrentFrame()
  const intro = ease(frame, 0, 34)
  const cursorIn = ease(frame, 32, 54)
  const promptIn = ease(frame, 142, 180)
  const sendIn = ease(frame, 182, 210)
  const typedChars = Math.floor(interpolate(frame, [170, 220], [0, promptText.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }))

  const cursorX = interpolate(frame, [28, 58, 84, 108, 136, 232], [798, 327, 521, 719, 927, 927], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const cursorY = interpolate(frame, [28, 58, 84, 108, 136, 232], [830, 754, 880, 1006, 1376, 1376], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const clickOne = ease(frame, 58, 70) * (1 - ease(frame, 104, 116))
  const clickTwo = ease(frame, 84, 96) * (1 - ease(frame, 104, 116))
  const clickThree = ease(frame, 108, 128)
  const sendClick = ease(frame, 218, 230)
  const clickByIndex = [clickOne, 0, 0, 0, clickTwo, clickThree]

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#0f0f0f', fontFamily: CHATGPT_MOBILE_FONT_STACK, overflow: 'hidden' }}>
      <ChatGptStatusBar />

      <Menu color="#050505" size={48} strokeWidth={2.7} style={{ left: 48, position: 'absolute', top: 158 }} />
      <div style={{ color: '#111111', fontSize: 43, fontWeight: 600, left: 161, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 156 }}>
        ChatGPT
      </div>
      <SquarePen color="#050505" size={47} strokeWidth={2.8} style={{ left: 861, position: 'absolute', top: 149 }} />
      <MoreHorizontal color="#050505" size={51} strokeWidth={3.2} style={{ left: 974, position: 'absolute', top: 157 }} />

      <main
        style={{
          bottom: 276,
          left: 0,
          opacity: intro,
          position: 'absolute',
          right: 0,
          top: 244,
          transform: `translateY(${(1 - intro) * 24}px)`,
        }}
      >
        <section style={{ left: 54, position: 'absolute', right: 54, top: 176 }}>
          <div style={{ alignItems: 'center', display: 'grid', gap: 19, justifyItems: 'center', marginBottom: 44 }}>
            <div style={{ alignItems: 'center', background: '#111111', borderRadius: 18, color: '#ffffff', display: 'flex', fontSize: 35, fontWeight: 650, height: 74, justifyContent: 'center', width: 74 }}>
              G
            </div>
            <h1 style={{ color: '#111111', fontSize: 43, fontWeight: 620, letterSpacing: 0, lineHeight: 1.12, margin: 0, textAlign: 'center' }}>
              O que voce quer fazer?
            </h1>
          </div>

          <div style={{ display: 'grid', gap: 17, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {actions.map(({ icon: Icon, label }, index) => {
              const selected = clickByIndex[index] || 0
              const active = selected > 0.02
              const itemIn = ease(frame, 8 + index * 4, 38 + index * 4)
              return (
                <div
                  key={label}
                  style={{
                    alignItems: 'center',
                    background: active ? `rgba(236,236,236,${0.86 + selected * 0.14})` : '#ffffff',
                    border: `1.5px solid ${active ? `rgba(17,17,17,${0.12 + selected * 0.18})` : '#dedede'}`,
                    borderRadius: 24,
                    boxShadow: active ? `0 ${12 + selected * 12}px ${26 + selected * 24}px rgba(0,0,0,${0.06 + selected * 0.04})` : '0 8px 22px rgba(0,0,0,0.035)',
                    boxSizing: 'border-box',
                    display: 'grid',
                    gap: 17,
                    gridTemplateColumns: '54px 1fr',
                    height: 112,
                    opacity: itemIn,
                    padding: '0 22px',
                    transform: `translateY(${(1 - itemIn) * 16}px) scale(${active ? 1 + selected * 0.014 : 1})`,
                  }}
                >
                  <span style={{ alignItems: 'center', background: '#f3f3f3', border: '1px solid #dfdfdf', borderRadius: 15, color: '#5f5f5f', display: 'flex', height: 50, justifyContent: 'center', width: 50 }}>
                    <Icon size={28} strokeWidth={2.1} />
                  </span>
                  <strong style={{ color: '#202020', fontSize: 24, fontWeight: 610, letterSpacing: 0, lineHeight: 1.1 }}>{label}</strong>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.10)',
          borderRadius: 36,
          bottom: 182,
          boxShadow: '0 20px 55px rgba(0,0,0,0.12)',
          height: interpolate(promptIn, [0, 1], [84, 214]),
          left: 31,
          opacity: intro,
          overflow: 'hidden',
          position: 'absolute',
          right: 31,
          transform: `translateY(${interpolate(promptIn, [0, 1], [0, -64])}px)`,
        }}
      >
        <div style={{ color: promptIn > 0.08 ? '#111111' : '#858585', fontSize: promptIn > 0.08 ? 35 : 40, fontWeight: 430, left: 41, letterSpacing: 0, lineHeight: 1.25, position: 'absolute', right: 126, top: promptIn > 0.08 ? 30 : 21 }}>
          {promptIn > 0.08 ? (
            <>
              {promptText.slice(0, typedChars)}
              <span style={{ opacity: Math.sin(frame / 5) > 0 ? 1 : 0 }}>|</span>
            </>
          ) : (
            'Pergunte ao ChatGPT'
          )}
        </div>
        <Plus color="#555555" size={42} strokeWidth={2.4} style={{ bottom: 25, left: 31, opacity: sendIn, position: 'absolute' }} />
        <Mic color="#777777" size={42} strokeWidth={2.8} style={{ bottom: 25, opacity: sendIn, position: 'absolute', right: 116 }} />
        <button
          style={{
            alignItems: 'center',
            background: '#111111',
            border: 0,
            borderRadius: 999,
            bottom: 17,
            display: 'flex',
            height: 66,
            justifyContent: 'center',
            opacity: sendIn,
            position: 'absolute',
            right: 18,
            transform: `scale(${1 - sendClick * 0.07})`,
            width: 66,
          }}
          type="button"
        >
          <ArrowUp color="#ffffff" size={34} strokeWidth={3} />
        </button>
      </div>

      <div style={{ background: '#050505', borderRadius: 999, bottom: 14, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />

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
          transform: `rotate(-12deg) scale(${1 + Math.max(clickOne, clickTwo, clickThree, sendClick) * 0.10})`,
          zIndex: 20,
        }}
      />
    </AbsoluteFill>
  )
}
