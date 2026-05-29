import type { CSSProperties } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

export type PowerPointMockSlideLayout = 'title' | 'metrics' | 'chart' | 'bullets'

export type PowerPointMockSlide = {
  title: string
  subtitle?: string
  eyebrow?: string
  accent?: string
  layout: PowerPointMockSlideLayout
  bullets?: string[]
  metrics?: { label: string; value: string }[]
}

type PowerPointEditorMockProps = {
  activeSlideIndex?: number
  showRibbon?: boolean
  slides: PowerPointMockSlide[]
  startFrame?: number
  style?: CSSProperties
  title: string
}

const FONT_STACK = 'Geist, "Segoe UI", Arial, sans-serif'
const DEFAULT_ACCENT = '#2f7de1'
const TABS = ['File', 'Home', 'Insert', 'Draw', 'Design', 'Transitions', 'Animations', 'Slide Show', 'Review', 'View', 'Help']
const FALLBACK_SLIDE: PowerPointMockSlide = {
  accent: DEFAULT_ACCENT,
  layout: 'title',
  subtitle: 'Presentation workspace',
  title: 'Untitled Presentation',
}
const RIBBON_GROUPS = [
  ['Paste', 'Cut', 'Copy'],
  ['New Slide', 'Layout', 'Reset'],
  ['Aptos', '18', 'B', 'I', 'U'],
  ['Align', 'Bullets', 'Spacing'],
  ['Shape', 'Arrange', 'Quick Styles'],
]

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function MiniIcon({ active = false }: { active?: boolean }) {
  return (
    <span
      style={{
        background: active ? '#c83b25' : '#f3f4f6',
        border: `1px solid ${active ? '#c83b25' : '#d8dbe1'}`,
        borderRadius: 5,
        display: 'block',
        height: 28,
        width: 28,
      }}
    />
  )
}

function Ribbon({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div style={{ background: '#fbfbfc', borderBottom: '1px solid #d8dbe1', display: 'flex', height: 118, padding: '10px 18px 12px' }}>
      {RIBBON_GROUPS.map((group, groupIndex) => (
        <div
          key={group.join('-')}
          style={{
            borderRight: groupIndex === RIBBON_GROUPS.length - 1 ? 0 : '1px solid #e0e3e8',
            display: 'grid',
            gap: 9,
            gridTemplateRows: '1fr 18px',
            minWidth: groupIndex === 2 ? 240 : 180,
            padding: '0 16px',
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
            {group.map((label, index) => (
              <div
                key={label}
                style={{
                  alignItems: 'center',
                  background: label.length <= 2 ? '#ffffff' : 'transparent',
                  border: label.length <= 2 ? '1px solid #d8dbe1' : 0,
                  borderRadius: 5,
                  color: '#34383e',
                  display: 'grid',
                  fontSize: label.length <= 2 ? 18 : 13,
                  fontWeight: label.length <= 2 ? 700 : 600,
                  gap: 4,
                  justifyItems: 'center',
                  minHeight: 52,
                  minWidth: label.length <= 2 ? 38 : 48,
                  padding: label.length <= 2 ? '0 7px' : 0,
                }}
              >
                {label.length > 2 ? <MiniIcon active={groupIndex === 0 && index === 0} /> : null}
                <span>{label}</span>
              </div>
            ))}
          </div>
          <span style={{ color: '#7a8089', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
            {['Clipboard', 'Slides', 'Font', 'Paragraph', 'Drawing'][groupIndex]}
          </span>
        </div>
      ))}
    </div>
  )
}

function SlideSurface({ slide, scale = 1 }: { slide: PowerPointMockSlide; scale?: number }) {
  const accent = slide.accent || DEFAULT_ACCENT
  const dark = slide.layout === 'title'

  return (
    <div
      style={{
        background: dark ? 'linear-gradient(135deg, #101927 0%, #162235 100%)' : '#ffffff',
        border: '1px solid #cfd5dd',
        boxShadow: '0 18px 42px rgba(19, 25, 35, 0.16)',
        color: dark ? '#ffffff' : '#121820',
        display: 'grid',
        height: 405 * scale,
        overflow: 'hidden',
        padding: 44 * scale,
        position: 'relative',
        width: 720 * scale,
      }}
    >
      <span style={{ background: accent, display: 'block', height: 6 * scale, left: 0, position: 'absolute', right: 0, top: 0 }} />
      {slide.layout === 'title' ? (
        <div style={{ alignSelf: 'center', display: 'grid', gap: 22 * scale, justifyItems: 'center', textAlign: 'center' }}>
          <h2 style={{ fontSize: 40 * scale, fontWeight: 760, letterSpacing: 0, lineHeight: 1.05, margin: 0 }}>{slide.title}</h2>
          <span style={{ background: accent, borderRadius: 999, display: 'block', height: 5 * scale, width: 180 * scale }} />
          <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 19 * scale, fontWeight: 600, margin: 0 }}>{slide.subtitle}</p>
        </div>
      ) : null}
      {slide.layout === 'metrics' ? (
        <div style={{ display: 'grid', gap: 22 * scale }}>
          <span style={{ color: '#6b7280', fontSize: 17 * scale, fontWeight: 750, textTransform: 'uppercase' }}>{slide.eyebrow}</span>
          <h2 style={{ fontSize: 34 * scale, lineHeight: 1.08, margin: 0 }}>{slide.title}</h2>
          <div style={{ display: 'grid', gap: 14 * scale, gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 10 * scale }}>
            {(slide.metrics || []).slice(0, 3).map((metric) => (
              <div key={metric.label} style={{ background: '#f5f7fb', border: '1px solid #d9dee7', borderRadius: 10 * scale, display: 'grid', gap: 8 * scale, padding: 17 * scale }}>
                <span style={{ color: '#6b7280', fontSize: 14 * scale, fontWeight: 700 }}>{metric.label}</span>
                <strong style={{ color: accent, fontSize: 30 * scale, letterSpacing: 0 }}>{metric.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {slide.layout === 'chart' ? (
        <div style={{ display: 'grid', gap: 22 * scale }}>
          <span style={{ color: '#6b7280', fontSize: 17 * scale, fontWeight: 750, textTransform: 'uppercase' }}>{slide.eyebrow}</span>
          <h2 style={{ fontSize: 32 * scale, lineHeight: 1.08, margin: 0 }}>{slide.title}</h2>
          <div style={{ alignItems: 'end', display: 'flex', gap: 15 * scale, height: 180 * scale, marginTop: 6 * scale }}>
            {[76, 118, 94, 154, 132, 188, 144].map((height, index) => (
              <span key={`${height}-${index}`} style={{ background: index === 5 ? accent : '#75a7ee', borderRadius: 6 * scale, flex: 1, height: height * scale }} />
            ))}
          </div>
        </div>
      ) : null}
      {slide.layout === 'bullets' ? (
        <div style={{ display: 'grid', gap: 24 * scale }}>
          <span style={{ color: '#6b7280', fontSize: 17 * scale, fontWeight: 750, textTransform: 'uppercase' }}>{slide.eyebrow}</span>
          <h2 style={{ fontSize: 34 * scale, lineHeight: 1.08, margin: 0 }}>{slide.title}</h2>
          <div style={{ display: 'grid', gap: 14 * scale }}>
            {(slide.bullets || []).slice(0, 4).map((bullet) => (
              <div key={bullet} style={{ alignItems: 'center', display: 'grid', gap: 14 * scale, gridTemplateColumns: `${12 * scale}px 1fr` }}>
                <span style={{ background: accent, borderRadius: 999, height: 12 * scale, width: 12 * scale }} />
                <span style={{ color: '#303844', fontSize: 22 * scale, fontWeight: 600 }}>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Thumbnail({ active, index, slide }: { active: boolean; index: number; slide: PowerPointMockSlide }) {
  const frame = useCurrentFrame()
  const p = progress(frame, 22 + index * 5, 42 + index * 5)

  return (
    <div style={{ alignItems: 'start', display: 'grid', gap: 8, gridTemplateColumns: '22px 1fr', opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}>
      <span style={{ color: '#565d67', fontSize: 14, fontWeight: 650, paddingTop: 6, textAlign: 'right' }}>{index + 1}</span>
      <div
        style={{
          border: `3px solid ${active ? '#c83b25' : '#d7dbe2'}`,
          borderRadius: 7,
          boxShadow: active ? '0 8px 18px rgba(200, 59, 37, 0.18)' : 'none',
          overflow: 'hidden',
        }}
      >
        <SlideSurface scale={0.215} slide={slide} />
      </div>
    </div>
  )
}

export function PowerPointEditorMock({
  activeSlideIndex,
  showRibbon = true,
  slides,
  startFrame = 0,
  style,
  title,
}: PowerPointEditorMockProps) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const safeSlides = slides.length > 0 ? slides : [FALLBACK_SLIDE]
  const animatedSlideIndex = Math.min(safeSlides.length - 1, Math.floor(localFrame / 86) % safeSlides.length)
  const selectedIndex = Math.min(safeSlides.length - 1, Math.max(0, activeSlideIndex ?? animatedSlideIndex))
  const selectedSlide = safeSlides[selectedIndex]
  const windowIn = progress(localFrame, 0, 34)
  const canvasIn = progress(localFrame, 22, 56)
  const ribbonIn = progress(localFrame, 10, 42)

  return (
    <AbsoluteFill style={{ background: '#f4f6f8', fontFamily: FONT_STACK, overflow: 'hidden', ...style }}>
      <div style={{ background: 'radial-gradient(circle at 50% 32%, rgba(200, 59, 37, 0.18), rgba(244,246,248,0) 58%)', bottom: -180, left: -180, position: 'absolute', right: -180, top: -180 }} />
      <div
        style={{
          background: '#f7f8fa',
          border: '1px solid #d1d5dc',
          borderRadius: 10,
          boxShadow: '0 44px 110px rgba(15, 23, 42, 0.22)',
          height: 710,
          left: '50%',
          overflow: 'hidden',
          position: 'absolute',
          top: 132,
          transform: `translateX(-50%) translateY(${(1 - windowIn) * 34}px) scale(${0.96 + windowIn * 0.04})`,
          width: 1012,
        }}
      >
        <div style={{ alignItems: 'center', background: '#f8f9fb', borderBottom: '1px solid #d8dbe1', display: 'grid', gridTemplateColumns: '240px 1fr 260px', height: 48, padding: '0 14px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
            <span style={{ background: '#c83b25', borderRadius: 5, display: 'block', height: 21, width: 21 }} />
            <span style={{ color: '#2f343b', fontSize: 13, fontWeight: 650 }}>{title}</span>
          </div>
          <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #d9dde4', borderRadius: 999, color: '#8a9099', display: 'flex', fontSize: 13, height: 28, justifyContent: 'center', justifySelf: 'center', width: 360 }}>
            Search
          </div>
          <div style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'end' }}>
            {['Comments', 'Share', 'Present'].map((item) => (
              <span key={item} style={{ background: item === 'Present' ? '#ffffff' : '#f1f3f6', border: '1px solid #d8dbe1', borderRadius: 6, color: '#3f454d', fontSize: 12, fontWeight: 650, padding: '6px 9px' }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div style={{ alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #d8dbe1', display: 'flex', gap: 18, height: 38, padding: '0 18px' }}>
          {TABS.map((tab) => (
            <span key={tab} style={{ color: tab === 'Home' ? '#c83b25' : '#3f454d', fontSize: 13, fontWeight: tab === 'Home' ? 760 : 620 }}>
              {tab}
            </span>
          ))}
        </div>

        <div style={{ opacity: ribbonIn, transform: `translateY(${(1 - ribbonIn) * -8}px)` }}>
          <Ribbon show={showRibbon} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '178px 1fr', height: showRibbon ? 463 : 581 }}>
          <aside style={{ background: '#f7f8fa', borderRight: '1px solid #d8dbe1', overflow: 'hidden', padding: '18px 12px' }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {safeSlides.map((slide, index) => (
                <Thumbnail active={index === selectedIndex} index={index} key={`${slide.title}-${index}`} slide={slide} />
              ))}
            </div>
          </aside>

          <main style={{ background: '#eef1f5', display: 'grid', gridTemplateRows: '1fr 34px', minWidth: 0 }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', opacity: canvasIn, transform: `translateY(${(1 - canvasIn) * 16}px)` }}>
              <SlideSurface slide={selectedSlide} />
            </div>
            <div style={{ alignItems: 'center', background: '#fbfbfc', borderTop: '1px solid #d8dbe1', color: '#5d6570', display: 'flex', fontSize: 12, justifyContent: 'space-between', padding: '0 16px' }}>
              <span>Slide {selectedIndex + 1} of {safeSlides.length}</span>
              <span>Notes</span>
              <span>84%</span>
            </div>
          </main>
        </div>
      </div>
    </AbsoluteFill>
  )
}
