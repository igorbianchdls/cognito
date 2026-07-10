import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { ChevronDown, FileText, Folder, MousePointer2, Presentation, Search, Share, Square } from 'lucide-react'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'
import { OttoAssistantHeader } from '@/assets/remotion/compositions/ChatGptMobileBase'

loadSfProFonts()

export const COWORK_POWERPOINT_EXPORT_DURATION = 225
export const COWORK_POWERPOINT_EXPORT_MOBILE_DURATION = 650
export const CHATBOT_DASHBOARD_MOBILE_DURATION = 470
export const CLAUDE_POWERPOINT_OUTLINE_MOBILE_DURATION = 285
export const CHATGPT_POWERPOINT_OUTLINE_MOBILE_DURATION = 285

const FONT = IOS_REMOTION_FONT_STACK
const CLAUDE_RESPONSE_SERIF = '"Libre Baskerville", Baskerville, Georgia, "Times New Roman", serif'
const BLUE = '#27316b'
const RED = '#ef4e5f'
const INK = '#151515'

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function typed(text: string, amount: number) {
  return text.slice(0, Math.ceil(text.length * amount))
}

function OttoMark() {
  return (
    <span style={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(2, 7px)' }}>
      <span style={{ background: '#225f42', borderRadius: 2, display: 'block', height: 7, width: 7 }} />
      <span style={{ background: '#8aa895', borderRadius: 2, display: 'block', height: 7, width: 7 }} />
      <span style={{ background: '#c9d8ce', borderRadius: 2, display: 'block', height: 7, width: 7 }} />
      <span style={{ background: '#225f42', borderRadius: 2, display: 'block', height: 7, width: 7 }} />
    </span>
  )
}

function ChatScene() {
  const frame = useCurrentFrame()
  const answerText = 'Preparei um deck executivo com os principais motivos de perda, contas em risco, impacto financeiro e proximos passos para o time comercial.'
  const answerProgress = p(frame, 28, 86)
  const cardIn = p(frame, 78, 102)
  const cursorIn = p(frame, 108, 126)
  const click = p(frame, 128, 138, [0, 1])
  const sceneOut = p(frame, 145, 168, [1, 0])
  const cursorX = interpolate(frame, [108, 132], [900, 1002], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorY = interpolate(frame, [108, 132], [482, 454], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ bottom: 0, left: 0, opacity: sceneOut, position: 'absolute', right: 0, top: 0 }}>
      <div style={{ background: '#fbfaf7', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <div style={{ left: 176, position: 'absolute', right: 176, top: 54 }}>
        <div style={{ alignItems: 'center', borderBottom: '1px solid #eee9df', display: 'flex', height: 48, justifyContent: 'space-between' }}>
          <strong style={{ color: '#111111', fontSize: 15, fontWeight: 700, letterSpacing: 0 }}>Otto</strong>
          <span style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e8e1d7', borderRadius: 999, color: '#777064', display: 'flex', fontSize: 12, fontWeight: 680, gap: 7, padding: '8px 12px' }}>
            <Search size={13} strokeWidth={2.2} />
            Presentation workspace
          </span>
        </div>

        <div style={{ display: 'grid', gap: 22, paddingTop: 54 }}>
          <div style={{ alignItems: 'start', display: 'grid', gridTemplateColumns: '1fr auto' }}>
            <div />
            <div style={{ background: '#f0eeea', border: '1px solid #e0dcd4', borderRadius: 22, color: '#161616', fontSize: 17, fontWeight: 500, letterSpacing: 0, lineHeight: 1.34, maxWidth: 520, padding: '18px 22px' }}>
              Crie uma apresentação executiva sobre perdas de deals no Q4.
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12, maxWidth: 860 }}>
            <div style={{ alignItems: 'center', display: 'flex', gap: 9 }}>
              <OttoMark />
              <span style={{ color: '#7a756d', fontSize: 13, fontWeight: 760 }}>Otto</span>
            </div>
            <div style={{ color: INK, fontSize: 25, fontWeight: 420, letterSpacing: 0, lineHeight: 1.42, maxWidth: 820 }}>
              {typed(answerText, answerProgress)}
            </div>

            <div
              style={{
                alignItems: 'center',
                background: '#fffefb',
                border: '1px solid #d8d0c4',
                borderRadius: 12,
                boxShadow: '0 16px 42px rgba(50, 45, 35, 0.08)',
                display: 'grid',
                gap: 18,
                gridTemplateColumns: '92px 1fr 50px auto',
                height: 96,
                marginTop: 10,
                opacity: cardIn,
                overflow: 'hidden',
                padding: '0 18px 0 24px',
                transform: `translateY(${(1 - cardIn) * 14}px)`,
                width: 980,
              }}
            >
              <div style={{ alignItems: 'center', alignSelf: 'stretch', borderRight: '1px solid #eee7dc', display: 'flex', justifyContent: 'center' }}>
                <div style={{ alignItems: 'center', background: '#fbfaf7', border: '1px solid #d9d1c6', borderRadius: 10, display: 'flex', height: 64, justifyContent: 'center', transform: 'rotate(-3deg)', width: 64 }}>
                  <Presentation color="#6b665f" size={30} strokeWidth={1.8} />
                </div>
              </div>
              <div style={{ display: 'grid', gap: 5 }}>
                <strong style={{ color: '#1f1f1f', fontSize: 20, fontWeight: 620, letterSpacing: 0 }}>Lost deal analysis q4 q1</strong>
                <span style={{ color: '#7b766f', fontSize: 15, fontWeight: 520, letterSpacing: 0 }}>Presentation · PPTX</span>
              </div>
              <button style={{ alignItems: 'center', background: '#fffefb', border: '1px solid #d8d0c4', borderRadius: 10, display: 'flex', height: 42, justifyContent: 'center', width: 48 }} type="button">
                <Folder color="#6f6a63" size={22} strokeWidth={1.7} />
              </button>
              <button
                style={{
                  alignItems: 'center',
                  background: click > 0.45 ? '#d9d4cd' : '#e8e4de',
                  border: '1px solid #d5cec4',
                  borderRadius: 10,
                  color: '#111111',
                  display: 'flex',
                  fontSize: 16,
                  fontWeight: 500,
                  gap: 7,
                  height: 52,
                  justifyContent: 'center',
                  letterSpacing: 0,
                  padding: '0 13px',
                  transform: `scale(${1 - Math.sin(click * Math.PI) * 0.025})`,
                  whiteSpace: 'nowrap',
                  width: 292,
                }}
                type="button"
              >
                <span style={{ alignItems: 'center', background: '#c24f41', borderRadius: 6, color: '#ffffff', display: 'flex', flex: '0 0 auto', fontSize: 12, fontWeight: 800, height: 24, justifyContent: 'center', width: 24 }}>P</span>
                Open in Microsoft PowerPoint
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ left: cursorX, opacity: cursorIn, position: 'absolute', top: cursorY, transform: `scale(${1 - Math.sin(click * Math.PI) * 0.12})`, zIndex: 20 }}>
        <MousePointer2 color="#111111" fill="#111111" size={28} strokeWidth={2} />
      </div>
    </div>
  )
}

function PptToolbar() {
  return (
    <div style={{ background: '#f7f7f7', borderBottom: '1px solid #dddddd', height: 84 }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 8, height: 34, paddingLeft: 16 }}>
        <span style={{ background: '#ff5f57', borderRadius: 999, height: 10, width: 10 }} />
        <span style={{ background: '#ffbd2e', borderRadius: 999, height: 10, width: 10 }} />
        <span style={{ background: '#28c840', borderRadius: 999, height: 10, width: 10 }} />
        <span style={{ color: '#444444', fontSize: 13, fontWeight: 650, marginLeft: 18 }}>Lost deal analysis q4 q1</span>
        <ChevronDown color="#767676" size={14} strokeWidth={2.2} />
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 14, height: 50, padding: '0 16px' }}>
        {['Home', 'Insert', 'Design', 'Transitions', 'Animations', 'Slide Show', 'Review', 'View'].map((item, index) => (
          <span key={item} style={{ color: index === 0 ? '#c24f41' : '#555555', fontSize: 12, fontWeight: 650 }}>{item}</span>
        ))}
        <div style={{ flex: 1 }} />
        <Share color="#666666" size={18} strokeWidth={2} />
      </div>
    </div>
  )
}

function SlideThumb({ active, index, variant }: { active?: boolean; index: number; variant: 'cover' | 'snapshot' | 'chart' }) {
  return (
    <div style={{ background: '#ffffff', border: active ? '2px solid #ef4e5f' : '1px solid #d6d6d6', borderRadius: 3, height: 72, padding: 5, width: 104 }}>
      {variant === 'cover' ? (
        <div style={{ background: BLUE, height: '100%', position: 'relative' }}>
          <span style={{ background: RED, bottom: 0, position: 'absolute', right: 0, top: 0, width: 30 }} />
        </div>
      ) : variant === 'snapshot' ? (
        <div style={{ display: 'grid', gap: 5 }}>
          <span style={{ background: '#e8edf4', display: 'block', height: 12 }} />
          {[42, 62, 34].map((width) => <span key={width} style={{ background: RED, display: 'block', height: 6, width }} />)}
        </div>
      ) : (
        <div style={{ alignItems: 'end', display: 'flex', gap: 5, height: '100%', padding: 8 }}>
          {[45, 32, 25, 16].map((height) => <span key={height} style={{ background: RED, display: 'block', flex: 1, height }} />)}
        </div>
      )}
      <span style={{ color: '#777777', fontSize: 8, fontWeight: 700 }}>{index}</span>
    </div>
  )
}

function CoverSlide() {
  return (
    <div style={{ background: BLUE, boxShadow: '0 16px 38px rgba(20, 25, 54, 0.18)', height: 468, overflow: 'hidden', position: 'relative', width: 832 }}>
      <div style={{ color: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 43, fontWeight: 800, left: 58, letterSpacing: 0, lineHeight: 1.06, position: 'absolute', top: 122, width: 430 }}>
        DEAL LOSS &<br />ACCOUNT RISK<br />REVIEW
      </div>
      <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: 520, left: 58, position: 'absolute', top: 300 }}>
        Account-Level Breakdown for the Account Team
      </div>
      <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 10, fontWeight: 520, left: 58, position: 'absolute', top: 388 }}>
        February 2026&nbsp;&nbsp;|&nbsp;&nbsp;Siren Capital
      </div>
      <div style={{ background: RED, bottom: 0, position: 'absolute', right: 44, top: 0, width: 170 }}>
        <div style={{ color: '#ffffff', fontSize: 56, fontWeight: 780, left: 0, letterSpacing: 0, position: 'absolute', textAlign: 'center', top: 104, width: '100%' }}>40</div>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 800, left: 0, letterSpacing: 1.8, position: 'absolute', textAlign: 'center', textTransform: 'uppercase', top: 178, width: '100%' }}>deals lost</div>
        <div style={{ color: '#ffffff', fontSize: 27, fontWeight: 780, left: 0, letterSpacing: 0, position: 'absolute', textAlign: 'center', top: 286, width: '100%' }}>$20.4M</div>
        <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: 10, fontWeight: 800, left: 0, letterSpacing: 1.8, position: 'absolute', textAlign: 'center', textTransform: 'uppercase', top: 330, width: '100%' }}>total value</div>
      </div>
    </div>
  )
}

function SnapshotSlide() {
  return (
    <div style={{ background: '#ffffff', height: 468, padding: 48, width: 832 }}>
      <h2 style={{ color: BLUE, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 28, letterSpacing: 0, margin: 0 }}>EXECUTIVE SNAPSHOT</h2>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 24 }}>
        {['+6.5%', '40', '$20.4M', '$423.3M'].map((metric, index) => (
          <div key={metric} style={{ background: '#f6f7fa', borderTop: `4px solid ${index === 0 ? '#48a868' : RED}`, padding: 13 }}>
            <strong style={{ color: index === 0 ? '#2d8f50' : RED, fontSize: 19, letterSpacing: 0 }}>{metric}</strong>
            <div style={{ color: '#6b7280', fontSize: 9, fontWeight: 700, marginTop: 5 }}>Q4 indicator</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 11, marginTop: 32, width: 530 }}>
        {[
          ['Deal stage mismatch', 86],
          ['Price objection', 68],
          ['Competitor displacement', 58],
          ['Procurement delay', 36],
          ['Product gap', 24],
        ].map(([label, width]) => (
          <div key={label} style={{ alignItems: 'center', display: 'grid', gap: 16, gridTemplateColumns: '170px 1fr auto' }}>
            <span style={{ color: '#344054', fontSize: 12, fontWeight: 650 }}>{label}</span>
            <span style={{ background: '#edf0f5', height: 10 }}>
              <span style={{ background: RED, display: 'block', height: '100%', width: `${width}%` }} />
            </span>
            <span style={{ color: '#667085', fontSize: 10, fontWeight: 700 }}>{width}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartSlide() {
  return (
    <div style={{ background: '#ffffff', height: 468, padding: 48, width: 832 }}>
      <h2 style={{ color: BLUE, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 26, letterSpacing: 0, margin: 0 }}>LOSSES BY PRODUCT TYPE</h2>
      <div style={{ alignItems: 'end', display: 'flex', gap: 28, height: 270, marginTop: 34, paddingLeft: 34, width: 450 }}>
        {[210, 145, 104, 74, 34].map((height, index) => (
          <div key={height} style={{ alignItems: 'center', display: 'grid', gap: 8, justifyItems: 'center' }}>
            <span style={{ background: RED, display: 'block', height, width: 42 }} />
            <span style={{ color: '#667085', fontSize: 9, fontWeight: 700 }}>P{index + 1}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 12, position: 'absolute', right: 84, top: 128, width: 220 }}>
        {['Pipeline hygiene', 'Expansion blockers', 'Analytics'].map((item, index) => (
          <div key={item} style={{ background: '#f7f8fb', borderLeft: `4px solid ${index === 0 ? RED : BLUE}`, padding: 13 }}>
            <strong style={{ color: '#202939', fontSize: 13, letterSpacing: 0 }}>{item}</strong>
            <div style={{ color: '#667085', fontSize: 10, fontWeight: 620, marginTop: 5 }}>Recommended action</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PowerPointScene() {
  const frame = useCurrentFrame()
  const sceneIn = p(frame, 154, 184)
  const active = frame < 196 ? 0 : frame < 212 ? 1 : 2
  const slideScale = p(frame, 154, 184, [0.94, 1])

  return (
    <div style={{ background: '#e6dccd', bottom: 0, left: 0, opacity: sceneIn, position: 'absolute', right: 0, top: 0 }}>
      <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, boxShadow: '0 28px 80px rgba(58, 48, 32, 0.24)', height: 610, left: 48, overflow: 'hidden', position: 'absolute', right: 48, top: 54, transform: `scale(${slideScale})`, transformOrigin: 'center center' }}>
        <PptToolbar />
        <div style={{ background: '#f0f0f0', bottom: 0, display: 'grid', gridTemplateColumns: '132px 1fr', left: 0, position: 'absolute', right: 0, top: 84 }}>
          <div style={{ background: '#f7f7f7', borderRight: '1px solid #d8d8d8', display: 'grid', gap: 12, justifyItems: 'center', paddingTop: 16 }}>
            <SlideThumb active={active === 0} index={1} variant="cover" />
            <SlideThumb active={active === 1} index={2} variant="snapshot" />
            <SlideThumb active={active === 2} index={3} variant="chart" />
          </div>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            <div style={{ opacity: active === 0 ? 1 : 0, position: 'absolute', transform: `translateX(${active === 0 ? 0 : -28}px)`, transition: 'none' }}>
              <CoverSlide />
            </div>
            <div style={{ opacity: active === 1 ? 1 : 0, position: 'absolute', transform: `translateX(${active === 1 ? 0 : 28}px)`, transition: 'none' }}>
              <SnapshotSlide />
            </div>
            <div style={{ opacity: active === 2 ? 1 : 0, position: 'absolute', transform: `translateX(${active === 2 ? 0 : 28}px)`, transition: 'none' }}>
              <ChartSlide />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CoworkPowerPointExportAnimation() {
  return (
    <AbsoluteFill style={{ background: '#fbfaf7', color: INK, fontFamily: FONT, overflow: 'hidden' }}>
      <ChatScene />
      <PowerPointScene />
      <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(216,208,196,0.85)', borderRadius: 999, bottom: 18, color: '#766f65', display: 'flex', fontSize: 11, fontWeight: 700, gap: 7, left: 24, padding: '8px 12px', position: 'absolute' }}>
        <FileText size={13} strokeWidth={2} />
        PPTX generated from chat
      </div>
    </AbsoluteFill>
  )
}

function MobileStatusBar() {
  return (
    <>
      <div style={{ color: '#111111', fontSize: 38, fontWeight: 760, left: 74, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 42 }}>19:04</div>
      <div style={{ alignItems: 'flex-end', display: 'flex', gap: 5, height: 30, position: 'absolute', right: 120, top: 54, width: 42 }}>
        {[12, 18, 25, 31].map((height, index) => <span key={height} style={{ background: index > 1 ? '#c8c8c8' : '#050505', borderRadius: 3, display: 'block', height, width: 7 }} />)}
      </div>
      <div style={{ border: '2px solid #bcbcbc', borderRadius: 10, height: 35, position: 'absolute', right: 44, top: 45, width: 67 }}>
        <div style={{ background: '#e8c348', borderRadius: 7, bottom: 2, left: 2, position: 'absolute', top: 2, width: 45 }} />
        <div style={{ color: '#050505', fontSize: 24, fontWeight: 760, left: 25, lineHeight: '31px', position: 'absolute', textAlign: 'center', top: 0, width: 30 }}>5</div>
      </div>
    </>
  )
}

function MobilePptCard({ click, progress }: { click: number; progress: number }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: click > 0.45 ? '#f7f7f7' : '#ffffff',
        border: '1.5px solid #d6cec3',
        borderRadius: 28,
        boxShadow: '0 18px 42px rgba(50, 45, 35, 0.10)',
        display: 'grid',
        gridTemplateColumns: '174px 1fr',
        height: 142,
        opacity: progress,
        overflow: 'hidden',
        padding: '0 34px',
        transform: `translateY(${(1 - progress) * 22}px) scale(${1 - Math.sin(click * Math.PI) * 0.018})`,
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'center', alignSelf: 'stretch', display: 'flex', justifyContent: 'flex-start', overflow: 'hidden', position: 'relative' }}>
        <div style={{ alignItems: 'center', background: '#fbfaf7', border: '1.5px solid #d8d0c4', borderRadius: 18, display: 'flex', height: 126, justifyContent: 'center', transform: 'rotate(-6deg)', width: 126 }}>
          <div style={{ alignItems: 'center', border: '3px solid #252525', borderRadius: 5, display: 'flex', height: 42, justifyContent: 'center', position: 'relative', width: 34 }}>
            <span style={{ borderBottom: '10px solid transparent', borderLeft: '10px solid #252525', height: 0, position: 'absolute', right: -3, top: -3, width: 0 }} />
            <span style={{ background: '#252525', borderRadius: 999, height: 4, position: 'absolute', top: 14, width: 16 }} />
            <span style={{ background: '#252525', borderRadius: 999, height: 4, position: 'absolute', top: 23, width: 16 }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
        <strong style={{ color: '#242424', fontSize: 34, fontWeight: 520, letterSpacing: 0, lineHeight: 1.08, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Lost deal analysis q4 q1</strong>
        <span style={{ color: '#77736d', fontSize: 27, fontWeight: 440, letterSpacing: 0 }}>Presentation · PPTX</span>
      </div>
    </div>
  )
}

function MobileChatScene() {
  const frame = useCurrentFrame()
  const promptText = 'Crie uma apresentacao executiva sobre perdas de deals no Q4.'
  const answerText = 'Preparei um deck executivo com os principais motivos de perda, contas em risco, impacto financeiro e proximos passos.'
  const promptProgress = p(frame, 12, 72)
  const introOut = p(frame, 78, 98, [1, 0])
  const chatIn = p(frame, 88, 110)
  const userBubbleIn = p(frame, 96, 116)
  const answerProgress = p(frame, 118, 172)
  const cardIn = p(frame, 164, 194)
  const cursorIn = p(frame, 198, 216)
  const click = p(frame, 218, 228, [0, 1])
  const sceneOut = p(frame, 226, 250, [1, 0])
  const cursorX = interpolate(frame, [198, 222], [790, 190], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorY = interpolate(frame, [198, 222], [1010, 955], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ bottom: 0, left: 0, opacity: sceneOut, position: 'absolute', right: 0, top: 0 }}>
      <div style={{ background: '#fbfaf7', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <MobileStatusBar />

      <div style={{ alignItems: 'center', border: '1.5px solid #e1dbd2', borderRadius: 48, boxShadow: '0 28px 82px rgba(58,48,32,0.12)', display: 'grid', gridTemplateColumns: '1fr 72px', left: 64, minHeight: 168, opacity: introOut, padding: '24px 26px 24px 38px', position: 'absolute', right: 64, top: 790, transform: `translateY(${(1 - introOut) * -34}px) scale(${0.96 + p(frame, 0, 22) * 0.04})` }}>
        <div style={{ color: '#171717', fontSize: 30, fontWeight: 440, letterSpacing: 0, lineHeight: 1.16, minWidth: 0, overflow: 'hidden', wordBreak: 'normal' }}>
          {typed(promptText, promptProgress)}
          <span style={{ background: '#171717', display: frame % 18 < 9 ? 'inline-block' : 'none', height: 35, marginLeft: 4, transform: 'translateY(5px)', width: 3 }} />
        </div>
        <div style={{ alignItems: 'center', background: '#111111', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 26, fontWeight: 620, height: 64, justifyContent: 'center', justifySelf: 'end', width: 64 }}>Go</div>
      </div>

      <div style={{ alignItems: 'center', borderBottom: '1px solid #eee9df', display: 'flex', height: 118, justifyContent: 'space-between', left: 48, opacity: chatIn, position: 'absolute', right: 48, top: 106, transform: `translateY(${(1 - chatIn) * 24}px)` }}>
        <strong style={{ color: '#111111', fontSize: 32, fontWeight: 720, letterSpacing: 0 }}>Otto</strong>
        <span style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e8e1d7', borderRadius: 999, color: '#777064', display: 'flex', fontSize: 21, fontWeight: 670, gap: 10, padding: '13px 18px' }}>
          <Search size={22} strokeWidth={2.2} />
          Presentation
        </span>
      </div>

      <div style={{ display: 'grid', gap: 38, left: 56, opacity: chatIn, position: 'absolute', right: 56, top: 292, transform: `translateY(${(1 - chatIn) * 34}px)` }}>
        <div style={{ alignItems: 'start', display: 'grid', gridTemplateColumns: '1fr auto' }}>
          <div />
          <div style={{ background: '#f0eeea', border: '1px solid #e0dcd4', borderRadius: 34, color: '#161616', fontSize: 30, fontWeight: 500, letterSpacing: 0, lineHeight: 1.24, maxWidth: 735, opacity: userBubbleIn, padding: '28px 34px', transform: `translateY(${(1 - userBubbleIn) * 18}px)` }}>
            Crie uma apresentação executiva sobre perdas de deals no Q4.
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
            <OttoMark />
            <span style={{ color: '#7a756d', fontSize: 22, fontWeight: 760 }}>Otto</span>
          </div>
          <div style={{ color: INK, fontSize: 39, fontWeight: 420, letterSpacing: 0, lineHeight: 1.28 }}>
            {typed(answerText, answerProgress)}
          </div>
          <MobilePptCard click={click} progress={cardIn} />
        </div>
      </div>

      <div style={{ left: cursorX, opacity: cursorIn, position: 'absolute', top: cursorY, transform: `scale(${1.75 - Math.sin(click * Math.PI) * 0.16})`, zIndex: 20 }}>
        <MousePointer2 color="#111111" fill="#111111" size={28} strokeWidth={2} />
      </div>
    </div>
  )
}

function MobilePowerPointScene({ end, start = 154 }: { end?: number; start?: number }) {
  const frame = useCurrentFrame()
  const sceneIn = p(frame, start, start + 30)
  const sceneOut = end === undefined ? 1 : p(frame, end, end + 20, [1, 0])
  const active = frame < start + 42 ? 0 : frame < start + 58 ? 1 : 2
  const slideScale = p(frame, start, start + 30, [0.94, 1])

  return (
    <div style={{ background: '#e6dccd', bottom: 0, left: 0, opacity: sceneIn * sceneOut, position: 'absolute', right: 0, top: 0 }}>
      <MobileStatusBar />
      <div style={{ color: '#6f665b', fontSize: 22, fontWeight: 700, left: 66, letterSpacing: 0, position: 'absolute', top: 150 }}>
        Microsoft PowerPoint
      </div>
      <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 18, boxShadow: '0 34px 92px rgba(58, 48, 32, 0.24)', height: 760, left: 40, overflow: 'hidden', position: 'absolute', right: 40, top: 530, transform: `scale(${slideScale})`, transformOrigin: 'center center' }}>
        <PptToolbar />
        <div style={{ background: '#f0f0f0', bottom: 0, display: 'grid', gridTemplateColumns: '132px 1fr', left: 0, position: 'absolute', right: 0, top: 84 }}>
          <div style={{ background: '#f7f7f7', borderRight: '1px solid #d8d8d8', display: 'grid', gap: 12, justifyItems: 'center', paddingTop: 16 }}>
            <SlideThumb active={active === 0} index={1} variant="cover" />
            <SlideThumb active={active === 1} index={2} variant="snapshot" />
            <SlideThumb active={active === 2} index={3} variant="chart" />
          </div>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            <div style={{ opacity: active === 0 ? 1 : 0, position: 'absolute', transform: 'scale(0.92)' }}>
              <CoverSlide />
            </div>
            <div style={{ opacity: active === 1 ? 1 : 0, position: 'absolute', transform: 'scale(0.92)' }}>
              <SnapshotSlide />
            </div>
            <div style={{ opacity: active === 2 ? 1 : 0, position: 'absolute', transform: 'scale(0.92)' }}>
              <ChartSlide />
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: '#050505', borderRadius: 999, bottom: 18, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
    </div>
  )
}

function MobileExcelCard({ click, progress }: { click: number; progress: number }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: click > 0.45 ? '#f7f7f7' : '#ffffff',
        border: '1.5px solid #d6cec3',
        borderRadius: 28,
        boxShadow: '0 18px 42px rgba(50, 45, 35, 0.10)',
        display: 'grid',
        gridTemplateColumns: '174px 1fr',
        height: 142,
        opacity: progress,
        overflow: 'hidden',
        padding: '0 34px',
        transform: `translateY(${(1 - progress) * 22}px) scale(${1 - Math.sin(click * Math.PI) * 0.018})`,
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'center', alignSelf: 'stretch', display: 'flex', justifyContent: 'flex-start', overflow: 'hidden', position: 'relative' }}>
        <div style={{ alignItems: 'center', background: '#f6fbf7', border: '1.5px solid #cfded2', borderRadius: 18, display: 'flex', height: 126, justifyContent: 'center', transform: 'rotate(-5deg)', width: 126 }}>
          <div style={{ border: '3px solid #1f7a45', borderRadius: 7, display: 'grid', gap: 3, gridTemplateColumns: 'repeat(3, 16px)', padding: 7 }}>
            {Array.from({ length: 9 }).map((_, index) => <span key={index} style={{ background: index === 0 || index === 3 ? '#1f7a45' : '#d8efe0', borderRadius: 2, height: 12, width: 16 }} />)}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
        <strong style={{ color: '#242424', fontSize: 34, fontWeight: 520, letterSpacing: 0, lineHeight: 1.08, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>lost_deals_analysis</strong>
        <span style={{ color: '#77736d', fontSize: 27, fontWeight: 440, letterSpacing: 0 }}>Spreadsheet · XLSX</span>
      </div>
    </div>
  )
}

function MobileExcelChatScene({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const local = frame - start
  const promptText = 'Agora transforme isso em uma planilha Excel com deals perdidos, valor, motivo e prioridade.'
  const answerText = 'Organizei os deals em uma planilha com valor, motivo da perda, risco da conta e prioridade de acao para o time comercial.'
  const promptProgress = p(local, 12, 82)
  const introIn = p(local, 0, 18)
  const introOut = p(local, 92, 112, [1, 0])
  const chatIn = p(local, 102, 124)
  const userBubbleIn = p(local, 110, 130)
  const answerProgress = p(local, 132, 186)
  const cardIn = p(local, 178, 208)
  const cursorIn = p(local, 212, 230)
  const click = p(local, 232, 242, [0, 1])
  const sceneOut = p(local, 240, 264, [1, 0])
  const cursorX = interpolate(local, [212, 236], [790, 190], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorY = interpolate(local, [212, 236], [1010, 955], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ bottom: 0, left: 0, opacity: introIn * sceneOut, position: 'absolute', right: 0, top: 0 }}>
      <div style={{ background: '#fbfaf7', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <MobileStatusBar />

      <div style={{ alignItems: 'center', border: '1.5px solid #d8ded6', borderRadius: 48, boxShadow: '0 28px 82px rgba(35,58,42,0.12)', display: 'grid', gridTemplateColumns: '1fr 72px', left: 64, minHeight: 188, opacity: introOut, padding: '24px 26px 24px 38px', position: 'absolute', right: 64, top: 780, transform: `translateY(${(1 - introOut) * -34}px) scale(${0.96 + p(local, 0, 22) * 0.04})` }}>
        <div style={{ color: '#171717', fontSize: 29, fontWeight: 440, letterSpacing: 0, lineHeight: 1.16, minWidth: 0, overflow: 'hidden', wordBreak: 'normal' }}>
          {typed(promptText, promptProgress)}
          <span style={{ background: '#171717', display: local % 18 < 9 ? 'inline-block' : 'none', height: 34, marginLeft: 4, transform: 'translateY(5px)', width: 3 }} />
        </div>
        <div style={{ alignItems: 'center', background: '#111111', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 26, fontWeight: 620, height: 64, justifyContent: 'center', justifySelf: 'end', width: 64 }}>Go</div>
      </div>

      <div style={{ alignItems: 'center', borderBottom: '1px solid #e8eee8', display: 'flex', height: 118, justifyContent: 'space-between', left: 48, opacity: chatIn, position: 'absolute', right: 48, top: 106, transform: `translateY(${(1 - chatIn) * 24}px)` }}>
        <strong style={{ color: '#111111', fontSize: 32, fontWeight: 720, letterSpacing: 0 }}>Otto</strong>
        <span style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #dfe8df', borderRadius: 999, color: '#617062', display: 'flex', fontSize: 21, fontWeight: 670, gap: 10, padding: '13px 18px' }}>
          <Search size={22} strokeWidth={2.2} />
          Spreadsheet
        </span>
      </div>

      <div style={{ display: 'grid', gap: 38, left: 56, opacity: chatIn, position: 'absolute', right: 56, top: 292, transform: `translateY(${(1 - chatIn) * 34}px)` }}>
        <div style={{ alignItems: 'start', display: 'grid', gridTemplateColumns: '1fr auto' }}>
          <div />
          <div style={{ background: '#eef3ee', border: '1px solid #d8e1d8', borderRadius: 34, color: '#161616', fontSize: 29, fontWeight: 500, letterSpacing: 0, lineHeight: 1.18, maxWidth: 760, opacity: userBubbleIn, padding: '28px 34px', transform: `translateY(${(1 - userBubbleIn) * 18}px)` }}>
            Agora transforme isso em uma planilha Excel com deals perdidos, valor, motivo e prioridade.
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
            <OttoMark />
            <span style={{ color: '#7a756d', fontSize: 22, fontWeight: 760 }}>Otto</span>
          </div>
          <div style={{ color: INK, fontSize: 38, fontWeight: 420, letterSpacing: 0, lineHeight: 1.28 }}>
            {typed(answerText, answerProgress)}
          </div>
          <MobileExcelCard click={click} progress={cardIn} />
        </div>
      </div>

      <div style={{ left: cursorX, opacity: cursorIn, position: 'absolute', top: cursorY, transform: `scale(${1.75 - Math.sin(click * Math.PI) * 0.16})`, zIndex: 20 }}>
        <MousePointer2 color="#111111" fill="#111111" size={28} strokeWidth={2} />
      </div>
    </div>
  )
}

function MobileExcelScene({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const sceneIn = p(frame, start, start + 30)
  const sheetScale = p(frame, start, start + 30, [0.94, 1])
  const rows = [
    ['Northwind', 'R$ 420k', 'Preco', 'Alta'],
    ['Atlas Corp', 'R$ 310k', 'Concorrente', 'Alta'],
    ['Prime Retail', 'R$ 190k', 'Timing', 'Media'],
    ['Blue Ocean', 'R$ 155k', 'Produto', 'Media'],
    ['Solaris', 'R$ 92k', 'Budget', 'Baixa'],
  ]

  return (
    <div style={{ background: '#e4ede5', bottom: 0, left: 0, opacity: sceneIn, position: 'absolute', right: 0, top: 0 }}>
      <MobileStatusBar />
      <div style={{ color: '#45604c', fontSize: 22, fontWeight: 700, left: 66, letterSpacing: 0, position: 'absolute', top: 150 }}>
        Microsoft Excel
      </div>
      <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 18, boxShadow: '0 34px 92px rgba(34, 73, 48, 0.22)', height: 790, left: 40, overflow: 'hidden', position: 'absolute', right: 40, top: 510, transform: `scale(${sheetScale})`, transformOrigin: 'center center' }}>
        <div style={{ background: '#0f6b3d', color: '#ffffff', display: 'flex', flexDirection: 'column', height: 94 }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 8, height: 38, paddingLeft: 16 }}>
            <span style={{ background: '#ff5f57', borderRadius: 999, height: 10, width: 10 }} />
            <span style={{ background: '#ffbd2e', borderRadius: 999, height: 10, width: 10 }} />
            <span style={{ background: '#28c840', borderRadius: 999, height: 10, width: 10 }} />
            <span style={{ fontSize: 13, fontWeight: 650, marginLeft: 18 }}>lost_deals_analysis.xlsx</span>
          </div>
          <div style={{ alignItems: 'center', display: 'flex', gap: 18, height: 56, padding: '0 18px' }}>
            {['Home', 'Insert', 'Data', 'Formulas', 'Review', 'View'].map((item, index) => (
              <span key={item} style={{ color: index === 0 ? '#ffffff' : 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: 700 }}>{item}</span>
            ))}
          </div>
        </div>
        <div style={{ background: '#f8faf8', bottom: 0, display: 'grid', gridTemplateRows: '92px 1fr 170px', left: 0, padding: 22, position: 'absolute', right: 0, top: 94 }}>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {['R$ 1.16M perdido', '5 contas criticas', '3 acoes prioritarias'].map((item, index) => (
              <div key={item} style={{ background: '#ffffff', border: '1px solid #dfe9e1', borderRadius: 12, color: index === 0 ? '#b42318' : '#14532d', display: 'grid', fontSize: 17, fontWeight: 800, placeItems: 'center' }}>{item}</div>
            ))}
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #dfe9e1', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: '#eef7f0', color: '#24503a', display: 'grid', fontSize: 13, fontWeight: 900, gridTemplateColumns: '1.2fr 0.8fr 1fr 0.8fr', padding: '12px 14px', textTransform: 'uppercase' }}>
              {['Conta', 'Valor', 'Motivo', 'Prioridade'].map((item) => <span key={item}>{item}</span>)}
            </div>
            {rows.map((row, index) => (
              <div key={row[0]} style={{ borderTop: '1px solid #eef2ef', color: '#142018', display: 'grid', fontSize: 18, fontWeight: 520, gridTemplateColumns: '1.2fr 0.8fr 1fr 0.8fr', padding: '14px' }}>
                {row.map((cell, cellIndex) => <span key={cell} style={{ fontWeight: cellIndex === 0 ? 780 : 520, color: cellIndex === 3 && index < 2 ? '#b42318' : '#142018' }}>{cell}</span>)}
              </div>
            ))}
          </div>
          <div style={{ alignItems: 'end', background: '#ffffff', border: '1px solid #dfe9e1', borderRadius: 12, display: 'flex', gap: 16, marginTop: 18, padding: '22px 26px' }}>
            {[98, 72, 54, 42, 28].map((height, index) => <span key={height} style={{ background: index < 2 ? '#0f6b3d' : '#bdd9c5', borderRadius: 8, flex: 1, height }} />)}
          </div>
        </div>
      </div>
      <div style={{ background: '#050505', borderRadius: 999, bottom: 18, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
    </div>
  )
}

function MobileDashboardCard({ click, progress }: { click: number; progress: number }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: click > 0.45 ? '#f7f7f7' : '#ffffff',
        border: '1.5px solid #d6cec3',
        borderRadius: 28,
        boxShadow: '0 18px 42px rgba(50, 45, 35, 0.10)',
        display: 'grid',
        gridTemplateColumns: '174px 1fr',
        height: 142,
        opacity: progress,
        overflow: 'hidden',
        padding: '0 34px',
        transform: `translateY(${(1 - progress) * 22}px) scale(${1 - Math.sin(click * Math.PI) * 0.018})`,
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'center', alignSelf: 'stretch', display: 'flex', justifyContent: 'flex-start', overflow: 'hidden', position: 'relative' }}>
        <div style={{ alignItems: 'center', background: '#fbfaf7', border: '1.5px solid #d8d0c4', borderRadius: 18, display: 'flex', height: 126, justifyContent: 'center', transform: 'rotate(-6deg)', width: 126 }}>
          <div style={{ border: '3px solid #252525', borderRadius: 7, display: 'grid', gap: 5, gridTemplateColumns: 'repeat(3, 10px)', padding: 8 }}>
            {[16, 25, 12, 20, 14, 28].map((height, index) => (
              <span key={`${height}-${index}`} style={{ alignSelf: 'end', background: index % 2 === 0 ? '#252525' : '#7b7b7b', borderRadius: 2, display: 'block', height, width: 10 }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
        <strong style={{ color: '#242424', fontSize: 34, fontWeight: 520, letterSpacing: 0, lineHeight: 1.08, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>crm_dashboard</strong>
        <span style={{ color: '#77736d', fontSize: 27, fontWeight: 440, letterSpacing: 0 }}>Dashboard · Live</span>
      </div>
    </div>
  )
}

function MobileDashboardChatScene() {
  const frame = useCurrentFrame()
  const promptText = 'Crie um dashboard executivo com tickets, mensagens e tempo de resposta.'
  const answerText = 'Montei um dashboard visual com volume de tickets, mensagens, tempo medio de resposta e distribuicao por canal.'
  const promptProgress = p(frame, 12, 72)
  const introOut = p(frame, 78, 98, [1, 0])
  const chatIn = p(frame, 88, 110)
  const userBubbleIn = p(frame, 96, 116)
  const answerProgress = p(frame, 118, 172)
  const cardIn = p(frame, 164, 194)
  const cursorIn = p(frame, 198, 216)
  const click = p(frame, 218, 228, [0, 1])
  const sceneOut = p(frame, 226, 250, [1, 0])
  const cursorX = interpolate(frame, [198, 222], [790, 190], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorY = interpolate(frame, [198, 222], [1010, 955], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ bottom: 0, left: 0, opacity: sceneOut, position: 'absolute', right: 0, top: 0 }}>
      <div style={{ background: '#fbfaf7', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <MobileStatusBar />

      <div style={{ alignItems: 'center', border: '1.5px solid #e1dbd2', borderRadius: 48, boxShadow: '0 28px 82px rgba(58,48,32,0.12)', display: 'grid', gridTemplateColumns: '1fr 72px', left: 64, minHeight: 168, opacity: introOut, padding: '24px 26px 24px 38px', position: 'absolute', right: 64, top: 790, transform: `translateY(${(1 - introOut) * -34}px) scale(${0.96 + p(frame, 0, 22) * 0.04})` }}>
        <div style={{ color: '#171717', fontSize: 30, fontWeight: 440, letterSpacing: 0, lineHeight: 1.16, minWidth: 0, overflow: 'hidden', wordBreak: 'normal' }}>
          {typed(promptText, promptProgress)}
          <span style={{ background: '#171717', display: frame % 18 < 9 ? 'inline-block' : 'none', height: 35, marginLeft: 4, transform: 'translateY(5px)', width: 3 }} />
        </div>
        <div style={{ alignItems: 'center', background: '#111111', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 26, fontWeight: 620, height: 64, justifyContent: 'center', justifySelf: 'end', width: 64 }}>Go</div>
      </div>

      <div style={{ alignItems: 'center', borderBottom: '1px solid #eee9df', display: 'flex', height: 118, justifyContent: 'space-between', left: 48, opacity: chatIn, position: 'absolute', right: 48, top: 106, transform: `translateY(${(1 - chatIn) * 24}px)` }}>
        <strong style={{ color: '#111111', fontSize: 32, fontWeight: 720, letterSpacing: 0 }}>Otto</strong>
        <span style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e8e1d7', borderRadius: 999, color: '#777064', display: 'flex', fontSize: 21, fontWeight: 670, gap: 10, padding: '13px 18px' }}>
          <Search size={22} strokeWidth={2.2} />
          Dashboard
        </span>
      </div>

      <div style={{ display: 'grid', gap: 38, left: 56, opacity: chatIn, position: 'absolute', right: 56, top: 292, transform: `translateY(${(1 - chatIn) * 34}px)` }}>
        <div style={{ alignItems: 'start', display: 'grid', gridTemplateColumns: '1fr auto' }}>
          <div />
          <div style={{ background: '#f0eeea', border: '1px solid #e0dcd4', borderRadius: 34, color: '#161616', fontSize: 30, fontWeight: 500, letterSpacing: 0, lineHeight: 1.24, maxWidth: 760, opacity: userBubbleIn, padding: '28px 34px', transform: `translateY(${(1 - userBubbleIn) * 18}px)` }}>
            Crie um dashboard executivo com tickets, mensagens e tempo de resposta.
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
            <OttoMark />
            <span style={{ color: '#7a756d', fontSize: 22, fontWeight: 760 }}>Otto</span>
          </div>
          <div style={{ color: INK, fontSize: 39, fontWeight: 420, letterSpacing: 0, lineHeight: 1.28 }}>
            {typed(answerText, answerProgress)}
          </div>
          <MobileDashboardCard click={click} progress={cardIn} />
        </div>
      </div>

      <div style={{ left: cursorX, opacity: cursorIn, position: 'absolute', top: cursorY, transform: `scale(${1.75 - Math.sin(click * Math.PI) * 0.16})`, zIndex: 20 }}>
        <MousePointer2 color="#111111" fill="#111111" size={28} strokeWidth={2} />
      </div>
    </div>
  )
}

function DashboardSlideshowScene() {
  const frame = useCurrentFrame()
  const sceneIn = p(frame, 234, 264)
  const scale = p(frame, 234, 264, [0.92, 1])

  return (
    <div style={{ background: '#020817', bottom: 0, left: 0, opacity: sceneIn, position: 'absolute', right: 0, top: 0 }}>
      <Img
        src={staticFile('mob1.png')}
        style={{
          display: 'block',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          width: '100%',
        }}
      />
    </div>
  )
}

function KpiTile({ accent, delay, label, sublabel, value }: { accent: string; delay: number; label: string; sublabel: string; value: string }) {
  const frame = useCurrentFrame()
  const progress = p(frame, 330 + delay, 348 + delay)

  return (
    <div style={{ background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.08))`, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, boxShadow: '0 16px 44px rgba(0,0,0,0.18)', minHeight: 112, opacity: progress, padding: 18, transform: `translateY(${(1 - progress) * 20}px) scale(${0.96 + progress * 0.04})` }}>
      <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 14, fontWeight: 700, letterSpacing: 0 }}>{label}</div>
      <div style={{ color: '#ffffff', fontSize: 32, fontWeight: 820, letterSpacing: -0.2, marginTop: 9 }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,0.56)', fontSize: 12, fontWeight: 650, marginTop: 7 }}>{sublabel}</div>
    </div>
  )
}

function NativeDashboardScene() {
  const frame = useCurrentFrame()
  const sceneIn = p(frame, 330, 360)
  const panelIn = p(frame, 342, 370)
  const lineProgress = p(frame, 372, 430)
  const bars = [116, 48, 152, 82, 206, 132, 168]
  const channels = [
    ['Email', '4.8k', 84, '#22d3ee'],
    ['Chat', '3.6k', 68, '#d946ef'],
    ['WhatsApp', '2.9k', 54, '#8b5cf6'],
    ['Phone', '1.1k', 28, '#38bdf8'],
  ]
  const queue = [
    ['Enterprise', '18 open', '#f97316'],
    ['Billing', '12 open', '#22d3ee'],
    ['Onboarding', '9 open', '#d946ef'],
  ]

  return (
    <div style={{ background: '#15182a', bottom: 0, left: 0, opacity: sceneIn, position: 'absolute', right: 0, top: 0 }}>
      <MobileStatusBar />
      <div style={{ color: '#d6d7e3', fontSize: 22, fontWeight: 700, left: 66, letterSpacing: 0, position: 'absolute', top: 150 }}>
        CRM Dashboard
      </div>
      <div style={{ background: '#101426', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 34, boxShadow: '0 34px 92px rgba(0,0,0,0.36)', left: 38, minHeight: 1240, opacity: panelIn, overflow: 'hidden', padding: 26, position: 'absolute', right: 38, top: 336, transform: `translateY(${(1 - panelIn) * 34}px) scale(${0.96 + panelIn * 0.04})` }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ color: '#ffffff', fontSize: 28, fontWeight: 850, letterSpacing: 0 }}>CRM Command Center</div>
            <div style={{ color: 'rgba(255,255,255,0.52)', fontSize: 16, fontWeight: 520, marginTop: 6 }}>Tickets, response time, channels and SLA health</div>
          </div>
          <span style={{ background: 'rgba(39, 245, 255, 0.14)', border: '1px solid rgba(39,245,255,0.28)', borderRadius: 999, color: '#28f0ff', fontSize: 15, fontWeight: 760, padding: '9px 13px' }}>Live</span>
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <KpiTile accent="#9b5cff" delay={0} label="First reply" sublabel="-18% vs last week" value="30m" />
          <KpiTile accent="#0fbfd7" delay={5} label="Resolution" sublabel="SLA target met" value="22h" />
          <KpiTile accent="#3157ff" delay={10} label="Tickets" sublabel="+12% volume" value="12.4k" />
          <KpiTile accent="#d946ef" delay={15} label="CSAT" sublabel="+4.2 points" value="94%" />
          <KpiTile accent="#14b8a6" delay={20} label="Backlog" sublabel="312 urgent" value="1.2k" />
          <KpiTile accent="#f97316" delay={25} label="Escalations" sublabel="48 high risk" value="7.8%" />
        </div>

        <div style={{ background: '#171b34', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, marginTop: 16, padding: 22 }}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ color: '#ffffff', fontSize: 20, fontWeight: 790 }}>Tickets created vs solved</div>
              <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: 13, fontWeight: 560, marginTop: 4 }}>Daily trend across all channels</div>
            </div>
            <div style={{ alignItems: 'center', color: 'rgba(255,255,255,0.62)', display: 'flex', fontSize: 12, fontWeight: 700, gap: 14 }}>
              <span><i style={{ background: '#22d3ee', borderRadius: 999, display: 'inline-block', height: 8, marginRight: 6, width: 8 }} />Created</span>
              <span><i style={{ background: '#d946ef', borderRadius: 999, display: 'inline-block', height: 8, marginRight: 6, width: 8 }} />Solved</span>
            </div>
          </div>
          <svg height="250" viewBox="0 0 850 250" width="100%">
            {[0, 1, 2, 3, 4].map((line) => <line key={line} stroke="rgba(255,255,255,0.07)" strokeWidth="1" x1="0" x2="850" y1={line * 52 + 18} y2={line * 52 + 18} />)}
            <path d="M0 194 C58 138 98 142 146 158 C202 176 230 86 292 104 C360 128 388 164 456 96 C520 30 574 74 620 92 C700 122 746 70 850 62" fill="none" pathLength="1" stroke="#22d3ee" strokeDasharray="1" strokeDashoffset={1 - lineProgress} strokeLinecap="round" strokeWidth="5" />
            <path d="M0 210 C62 164 112 142 160 174 C216 206 252 118 308 130 C372 144 410 190 474 124 C542 62 594 122 650 136 C722 154 764 112 850 104" fill="none" pathLength="1" stroke="#d946ef" strokeDasharray="1" strokeDashoffset={1 - lineProgress} strokeLinecap="round" strokeWidth="5" />
            <circle cx="620" cy="92" fill="#22d3ee" opacity={lineProgress} r="8" />
            <circle cx="650" cy="136" fill="#d946ef" opacity={lineProgress} r="8" />
          </svg>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.05fr 0.95fr', marginTop: 16 }}>
          <div style={{ background: '#171b34', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, minHeight: 292, padding: 20 }}>
            <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 790, marginBottom: 14 }}>Channel mix</div>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '180px 1fr' }}>
              <div style={{ alignItems: 'center', display: 'grid', height: 190, justifyItems: 'center' }}>
                <div style={{ background: `conic-gradient(#18d7ff 0 ${lineProgress * 34}%, #2266ff ${lineProgress * 34}% ${lineProgress * 58}%, #d946ef ${lineProgress * 58}% ${lineProgress * 82}%, #8b5cf6 ${lineProgress * 82}% ${lineProgress * 100}%, rgba(255,255,255,0.08) 0)`, borderRadius: 999, height: 172, position: 'relative', width: 172 }}>
                  <span style={{ background: '#171b34', borderRadius: 999, inset: 42, position: 'absolute' }} />
                  <span style={{ color: '#ffffff', fontSize: 24, fontWeight: 850, left: 0, lineHeight: '172px', position: 'absolute', textAlign: 'center', top: 0, width: 172 }}>12.4k</span>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 12, paddingTop: 6 }}>
                {channels.map(([name, value, width, color], index) => (
                  <div key={name} style={{ display: 'grid', gap: 6 }}>
                    <div style={{ alignItems: 'center', color: '#ffffff', display: 'flex', fontSize: 13, fontWeight: 720, justifyContent: 'space-between' }}>
                      <span>{name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.58)' }}>{value}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                      <span style={{ background: color, borderRadius: 999, display: 'block', height: 8, width: `${Number(width) * p(frame, 378 + index * 4, 404 + index * 4)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: '#171b34', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, minHeight: 292, padding: 20 }}>
            <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 790, marginBottom: 14 }}>Tickets / weekday</div>
            <div style={{ alignItems: 'end', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 12, height: 196, padding: '8px 6px 0' }}>
              {bars.map((height, index) => <span key={height} style={{ background: index === 4 ? '#14f1ff' : '#2b68ff', borderRadius: 8, flex: 1, height: height * p(frame, 382 + index * 4, 410 + index * 4) }} />)}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.46)', display: 'grid', fontSize: 10, fontWeight: 760, gridTemplateColumns: 'repeat(7, 1fr)', marginTop: 10, textAlign: 'center' }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
          <div style={{ background: '#171b34', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, minHeight: 190, padding: 20 }}>
            <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 790, marginBottom: 16 }}>Queue health</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {queue.map(([name, value, color], index) => {
                const rowIn = p(frame, 392 + index * 8, 412 + index * 8)
                return (
                  <div key={name} style={{ alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, display: 'grid', gridTemplateColumns: '14px 1fr auto', opacity: rowIn, padding: '12px 14px', transform: `translateY(${(1 - rowIn) * 12}px)` }}>
                    <span style={{ background: color, borderRadius: 999, height: 10, width: 10 }} />
                    <span style={{ color: '#ffffff', fontSize: 14, fontWeight: 720 }}>{name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.58)', fontSize: 13, fontWeight: 700 }}>{value}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ background: '#171b34', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, minHeight: 190, padding: 20 }}>
            <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 790, marginBottom: 18 }}>SLA coverage</div>
            <div style={{ alignItems: 'center', display: 'grid', gap: 18, gridTemplateColumns: '138px 1fr' }}>
              <div style={{ background: `conic-gradient(#12b76a 0 ${lineProgress * 86}%, rgba(255,255,255,0.08) 0)`, borderRadius: 999, height: 132, position: 'relative', width: 132 }}>
                <span style={{ background: '#171b34', borderRadius: 999, inset: 28, position: 'absolute' }} />
                <span style={{ color: '#ffffff', fontSize: 28, fontWeight: 850, left: 0, lineHeight: '132px', position: 'absolute', textAlign: 'center', top: 0, width: 132 }}>86%</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.64)', fontSize: 14, fontWeight: 620, lineHeight: 1.45 }}>
                Resolution on track across priority queues. Enterprise escalations need attention before end of day.
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: '#050505', borderRadius: 999, bottom: 18, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
    </div>
  )
}

export function ChatbotToDashboardMobileAnimation() {
  return (
    <AbsoluteFill style={{ background: '#fbfaf7', color: INK, fontFamily: FONT, overflow: 'hidden' }}>
      <MobileDashboardChatScene />
      <DashboardSlideshowScene />
    </AbsoluteFill>
  )
}

export function CoworkPowerPointExportMobileAnimation() {
  return (
    <AbsoluteFill style={{ background: '#fbfaf7', color: INK, fontFamily: FONT, overflow: 'hidden' }}>
      <MobileChatScene />
      <MobilePowerPointScene end={330} start={234} />
      <MobileExcelChatScene start={350} />
      <MobileExcelScene start={584} />
    </AbsoluteFill>
  )
}

function ClaudeComposer({ opacity = 1 }: { opacity?: number }) {
  return (
    <div style={{ background: '#fbfaf8', bottom: 0, height: 340, left: 0, opacity, position: 'absolute', right: 0 }}>
      <div style={{ background: '#fbfaf8', border: '1.5px solid #bebcb7', borderRadius: 68, boxShadow: '0 20px 48px rgba(20,24,22,0.16)', height: 254, left: 42, position: 'absolute', right: 42, top: 0 }}>
        <div style={{ color: '#77746f', fontSize: 42, fontWeight: 450, left: 36, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 53 }}>Chat with Claude</div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 19, left: 22, position: 'absolute', right: 24, top: 145 }}>
          <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, display: 'flex', height: 78, justifyContent: 'center', width: 78 }}>+</div>
          <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, color: '#111111', display: 'flex', fontSize: 35, fontWeight: 520, height: 78, justifyContent: 'center', letterSpacing: 0, padding: '0 42px', whiteSpace: 'nowrap' }}>Sonnet 4.6</div>
          <div style={{ flex: 1 }} />
          <div style={{ alignItems: 'center', background: '#050505', borderRadius: 999, display: 'flex', gap: 5, height: 78, justifyContent: 'center', width: 78 }}>
            {[18, 28, 38, 28, 18].map((height, index) => <span key={`${height}-${index}`} style={{ background: '#ffffff', borderRadius: 999, height, width: 5 }} />)}
          </div>
        </div>
      </div>
      <div style={{ background: '#050505', borderRadius: 999, bottom: 14, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
    </div>
  )
}

function ClaudePowerPointOutlineChatScene() {
  const frame = useCurrentFrame()
  const promptText = 'Crie uma apresentacao executiva sobre perdas de deals no Q4.'
  const answerText = 'Montei o outline, organizei a narrativa executiva e gerei uma apresentacao pronta para abrir no PowerPoint.'
  const promptProgress = p(frame, 12, 72)
  const introOut = p(frame, 78, 98, [1, 0])
  const chatIn = p(frame, 88, 110)
  const userBubbleIn = p(frame, 96, 116)
  const answerProgress = p(frame, 118, 172)
  const cardIn = p(frame, 164, 194)
  const cursorIn = p(frame, 198, 216)
  const click = p(frame, 218, 228, [0, 1])
  const sceneOut = p(frame, 226, 250, [1, 0])
  const cursorX = interpolate(frame, [198, 222], [790, 190], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorY = interpolate(frame, [198, 222], [1010, 955], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ bottom: 0, left: 0, opacity: sceneOut, position: 'absolute', right: 0, top: 0 }}>
      <div style={{ background: '#fbfaf8', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <MobileStatusBar />

      <div style={{ background: '#fbfaf8', border: '1.5px solid #bebcb7', borderRadius: 58, boxShadow: '0 24px 68px rgba(20,24,22,0.14)', display: 'grid', gap: 22, left: 42, minHeight: 258, opacity: introOut, padding: '34px 36px 28px', position: 'absolute', right: 42, top: 725, transform: `translateY(${(1 - introOut) * -34}px) scale(${0.96 + p(frame, 0, 22) * 0.04})` }}>
        <div style={{ color: '#77746f', fontSize: 38, fontWeight: 450, letterSpacing: 0, opacity: promptProgress > 0.02 ? 0 : 1 }}>Chat with Claude</div>
        <div style={{ color: '#111111', fontFamily: FONT, fontSize: 34, fontWeight: 400, letterSpacing: 0, lineHeight: 1.15, minHeight: 78, overflow: 'hidden', transform: `translateY(${promptProgress > 0.02 ? -60 : 0}px)` }}>
          {typed(promptText, promptProgress)}
          <span style={{ background: '#111111', display: frame % 18 < 9 ? 'inline-block' : 'none', height: 35, marginLeft: 4, transform: 'translateY(5px)', width: 3 }} />
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
          <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, display: 'flex', fontSize: 28, height: 66, justifyContent: 'center', width: 66 }}>+</div>
          <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, color: '#111111', display: 'flex', fontSize: 29, fontWeight: 520, height: 66, justifyContent: 'center', padding: '0 34px', whiteSpace: 'nowrap' }}>Sonnet 4.6</div>
          <div style={{ flex: 1 }} />
          <div style={{ alignItems: 'center', background: '#050505', borderRadius: 999, display: 'flex', gap: 4, height: 66, justifyContent: 'center', width: 66 }}>
            {[16, 26, 36, 26, 16].map((height, index) => <span key={`${height}-${index}`} style={{ background: '#ffffff', borderRadius: 999, height, width: 4 }} />)}
          </div>
        </div>
      </div>

      <div style={{ alignItems: 'center', display: 'flex', height: 118, justifyContent: 'space-between', left: 48, opacity: chatIn, position: 'absolute', right: 48, top: 106, transform: `translateY(${(1 - chatIn) * 24}px)` }}>
        <strong style={{ color: '#333330', fontSize: 32, fontWeight: 620, letterSpacing: 0 }}>Claude</strong>
        <span style={{ color: '#333330', fontSize: 34, fontWeight: 500, letterSpacing: 0 }}>...</span>
      </div>

      <div style={{ bottom: 368, left: 0, opacity: chatIn, overflow: 'hidden', position: 'absolute', right: 0, top: 232, transform: `translateY(${(1 - chatIn) * 34}px)` }}>
        <div style={{ display: 'grid', gap: 38, padding: '34px 56px 180px' }}>
          <div style={{ alignItems: 'start', display: 'grid', gridTemplateColumns: '1fr auto' }}>
            <div />
            <div style={{ background: '#f1f0ee', border: '1px solid #dfddd8', borderRadius: 38, color: '#111111', fontSize: 31, fontWeight: 400, letterSpacing: 0, lineHeight: 1.18, maxWidth: 760, opacity: userBubbleIn, padding: '28px 34px', transform: `translateY(${(1 - userBubbleIn) * 18}px)` }}>
              Crie uma apresentacao executiva sobre perdas de deals no Q4.
            </div>
          </div>

          <div className="claude-powerpoint-response" style={{ color: '#111111', display: 'grid', fontFamily: CLAUDE_RESPONSE_SERIF, fontSize: 38, fontWeight: 400, gap: 18, letterSpacing: '-0.02em', lineHeight: 1.26, padding: '0 42px' }}>
            <OttoAssistantHeader muted="#8b857c" />
            <div style={{ fontFamily: CLAUDE_RESPONSE_SERIF }}>
              <span style={{ fontFamily: CLAUDE_RESPONSE_SERIF }}>
                {typed(answerText, answerProgress)}
              </span>
            </div>
            <div style={{ marginLeft: -42, marginRight: -42 }}>
              <MobilePptCard click={click} progress={cardIn} />
            </div>
          </div>
        </div>
      </div>

      <ClaudeComposer opacity={chatIn} />

      <div style={{ left: cursorX, opacity: cursorIn, position: 'absolute', top: cursorY, transform: `scale(${1.75 - Math.sin(click * Math.PI) * 0.16})`, zIndex: 20 }}>
        <MousePointer2 color="#111111" fill="#111111" size={28} strokeWidth={2} />
      </div>
    </div>
  )
}

export function ClaudePowerPointOutlineMobileAnimation() {
  return (
    <AbsoluteFill style={{ background: '#fbfaf8', color: INK, fontFamily: FONT, overflow: 'hidden' }}>
      <ClaudePowerPointOutlineChatScene />
      <MobilePowerPointScene start={234} />
    </AbsoluteFill>
  )
}

function ChatGptComposer({ opacity = 1 }: { opacity?: number }) {
  return (
    <div style={{ background: '#ffffff', bottom: 0, height: 284, left: 0, opacity, position: 'absolute', right: 0 }}>
      <div style={{ alignItems: 'center', background: '#f4f4f4', border: '1px solid #e4e4e4', borderRadius: 999, display: 'grid', gridTemplateColumns: '72px 1fr 72px 72px', height: 104, left: 44, padding: '0 18px', position: 'absolute', right: 44, top: 20 }}>
        <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #dddddd', borderRadius: 999, color: '#2d2d2d', display: 'flex', fontSize: 38, fontWeight: 300, height: 58, justifyContent: 'center', width: 58 }}>+</div>
        <div style={{ color: '#777777', fontSize: 36, fontWeight: 430, letterSpacing: 0 }}>Pergunte ao ChatGPT</div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 4, justifyContent: 'center' }}>
          {[28, 42, 30].map((height, index) => <span key={`${height}-${index}`} style={{ background: '#202020', borderRadius: 999, display: 'block', height, width: 5 }} />)}
        </div>
        <div style={{ alignItems: 'center', background: '#111111', borderRadius: 999, display: 'flex', gap: 4, height: 58, justifyContent: 'center', width: 58 }}>
          {[18, 30, 42, 30, 18].map((height, index) => <span key={`${height}-${index}`} style={{ background: '#ffffff', borderRadius: 999, display: 'block', height, width: 4 }} />)}
        </div>
      </div>
      <div style={{ background: '#050505', borderRadius: 999, bottom: 14, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
    </div>
  )
}

function ChatGptPowerPointOutlineChatScene() {
  const frame = useCurrentFrame()
  const promptText = 'Crie uma apresentacao executiva sobre perdas de deals no Q4.'
  const answerText = 'Pronto. Montei o outline, gerei a apresentacao executiva e deixei o arquivo PPTX pronto para abrir no PowerPoint.'
  const promptProgress = p(frame, 12, 72)
  const introOut = p(frame, 78, 98, [1, 0])
  const chatIn = p(frame, 88, 110)
  const userBubbleIn = p(frame, 96, 116)
  const answerProgress = p(frame, 118, 172)
  const cardIn = p(frame, 164, 194)
  const cursorIn = p(frame, 198, 216)
  const click = p(frame, 218, 228, [0, 1])
  const sceneOut = p(frame, 226, 250, [1, 0])
  const cursorX = interpolate(frame, [198, 222], [790, 190], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorY = interpolate(frame, [198, 222], [1010, 955], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ bottom: 0, left: 0, opacity: sceneOut, position: 'absolute', right: 0, top: 0 }}>
      <div style={{ background: '#ffffff', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <MobileStatusBar />

      <div style={{ background: '#f4f4f4', border: '1px solid #e4e4e4', borderRadius: 54, boxShadow: '0 24px 68px rgba(20,24,22,0.12)', display: 'grid', gap: 22, gridTemplateColumns: '72px 1fr 72px 72px', left: 44, minHeight: 180, opacity: introOut, padding: '26px 18px', position: 'absolute', right: 44, top: 780, transform: `translateY(${(1 - introOut) * -34}px) scale(${0.96 + p(frame, 0, 22) * 0.04})` }}>
        <div style={{ alignItems: 'center', alignSelf: 'end', background: '#ffffff', border: '1px solid #dddddd', borderRadius: 999, color: '#2d2d2d', display: 'flex', fontSize: 38, fontWeight: 300, height: 58, justifyContent: 'center', width: 58 }}>+</div>
        <div style={{ alignSelf: 'center', color: '#171717', fontSize: 30, fontWeight: 430, letterSpacing: 0, lineHeight: 1.16, minWidth: 0, overflow: 'hidden' }}>
          {typed(promptText, promptProgress)}
          <span style={{ background: '#171717', display: frame % 18 < 9 ? 'inline-block' : 'none', height: 35, marginLeft: 4, transform: 'translateY(5px)', width: 3 }} />
        </div>
        <div style={{ alignItems: 'center', alignSelf: 'end', display: 'flex', gap: 4, justifyContent: 'center' }}>
          {[28, 42, 30].map((height, index) => <span key={`${height}-${index}`} style={{ background: '#202020', borderRadius: 999, display: 'block', height, width: 5 }} />)}
        </div>
        <div style={{ alignItems: 'center', alignSelf: 'end', background: '#111111', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 26, fontWeight: 620, height: 58, justifyContent: 'center', width: 58 }}>Go</div>
      </div>

      <div style={{ alignItems: 'center', display: 'grid', gridTemplateColumns: '82px 1fr 82px 82px', height: 118, left: 36, opacity: chatIn, position: 'absolute', right: 36, top: 106, transform: `translateY(${(1 - chatIn) * 24}px)` }}>
        <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
          {[0, 1, 2].map((item) => <span key={item} style={{ background: '#111111', borderRadius: 999, display: 'block', height: 3, width: 30 }} />)}
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 12, justifyContent: 'center' }}>
          <strong style={{ color: '#171717', fontSize: 33, fontWeight: 680, letterSpacing: 0 }}>ChatGPT</strong>
          <ChevronDown color="#6b6b6b" size={28} strokeWidth={2.2} />
        </div>
        <div style={{ alignItems: 'center', border: '2px solid #111111', borderRadius: 9, display: 'flex', height: 33, justifyContent: 'center', justifySelf: 'center', width: 33 }}>
          <span style={{ background: '#111111', borderRadius: 999, display: 'block', height: 3, transform: 'rotate(-38deg)', width: 20 }} />
        </div>
        <div style={{ color: '#111111', fontSize: 38, fontWeight: 560, justifySelf: 'center', letterSpacing: 0, lineHeight: 1 }}>...</div>
      </div>

      <div style={{ bottom: 294, left: 0, opacity: chatIn, overflow: 'hidden', position: 'absolute', right: 0, top: 232, transform: `translateY(${(1 - chatIn) * 34}px)` }}>
        <div style={{ display: 'grid', gap: 38, padding: '42px 56px 180px' }}>
          <div style={{ alignItems: 'start', display: 'grid', gridTemplateColumns: '1fr auto' }}>
            <div />
            <div style={{ background: '#f4f4f4', borderRadius: 38, color: '#171717', fontSize: 31, fontWeight: 430, letterSpacing: 0, lineHeight: 1.2, maxWidth: 760, opacity: userBubbleIn, padding: '28px 34px', transform: `translateY(${(1 - userBubbleIn) * 18}px)` }}>
              Crie uma apresentacao executiva sobre perdas de deals no Q4.
            </div>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ alignItems: 'center', display: 'flex', gap: 13 }}>
              <div style={{ alignItems: 'center', background: '#111111', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 20, fontWeight: 760, height: 34, justifyContent: 'center', width: 34 }}>O</div>
              <span style={{ color: '#2b2b2b', fontSize: 23, fontWeight: 700 }}>Otto</span>
            </div>
            <div style={{ color: '#111111', fontSize: 38, fontWeight: 420, letterSpacing: 0, lineHeight: 1.28 }}>
              {typed(answerText, answerProgress)}
            </div>
            <MobilePptCard click={click} progress={cardIn} />
          </div>
        </div>
      </div>

      <ChatGptComposer opacity={chatIn} />

      <div style={{ left: cursorX, opacity: cursorIn, position: 'absolute', top: cursorY, transform: `scale(${1.75 - Math.sin(click * Math.PI) * 0.16})`, zIndex: 20 }}>
        <MousePointer2 color="#111111" fill="#111111" size={28} strokeWidth={2} />
      </div>
    </div>
  )
}

export function ChatGptPowerPointOutlineMobileAnimation() {
  return (
    <AbsoluteFill style={{ background: '#ffffff', color: INK, fontFamily: FONT, overflow: 'hidden' }}>
      <ChatGptPowerPointOutlineChatScene />
      <MobilePowerPointScene start={234} />
    </AbsoluteFill>
  )
}
