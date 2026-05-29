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
const DEFAULT_ACCENT = '#c8a856'
const FALLBACK_SLIDE: PowerPointMockSlide = {
  accent: DEFAULT_ACCENT,
  layout: 'title',
  subtitle: 'A value-creation point of view for the Board',
  title: 'Project Lighthouse',
}
const TABS = ['Home', 'Insert', 'Draw', 'Design', 'Transitions', 'Animations', 'Slide Show', 'Record', 'Review', 'View']

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function MacDot({ color }: { color: string }) {
  return <span style={{ background: color, borderRadius: 999, display: 'block', height: 10, width: 10 }} />
}

function RibbonTool({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <div style={{ alignItems: 'center', color: '#32363d', display: 'grid', fontSize: 9, fontWeight: 600, gap: 3, justifyItems: 'center', minWidth: tall ? 42 : 32 }}>
      <span
        style={{
          background: '#ffffff',
          border: '1px solid #cfd4dc',
          borderRadius: 2,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
          display: 'block',
          height: tall ? 31 : 20,
          width: tall ? 31 : 24,
        }}
      />
      <span>{label}</span>
    </div>
  )
}

function Ribbon({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div style={{ background: '#f6f6f7', borderBottom: '1px solid #d7d8dc', display: 'flex', height: 76, padding: '6px 10px' }}>
      <div style={{ borderRight: '1px solid #dedfe3', display: 'flex', gap: 8, paddingRight: 12 }}>
        <RibbonTool label="Paste" tall />
        <div style={{ display: 'grid', gap: 2 }}>
          {['Cut', 'Copy', 'Format'].map((label) => <RibbonTool key={label} label={label} />)}
        </div>
      </div>
      <div style={{ borderRight: '1px solid #dedfe3', display: 'flex', gap: 10, padding: '0 12px' }}>
        {['New Slide', 'Layout', 'Reset', 'Section'].map((label) => <RibbonTool key={label} label={label} />)}
      </div>
      <div style={{ borderRight: '1px solid #dedfe3', display: 'grid', gap: 5, minWidth: 270, padding: '0 12px' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ background: '#ffffff', border: '1px solid #d5d8de', borderRadius: 3, height: 22, width: 150 }} />
          <span style={{ background: '#ffffff', border: '1px solid #d5d8de', borderRadius: 3, height: 22, width: 55 }} />
          {['A', 'A'].map((label, index) => <span key={`${label}-${index}`} style={{ color: '#c4c6cc', fontSize: 14, fontWeight: 700 }}>{label}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {['B', 'I', 'U', 'x', 'AV', 'Aa'].map((label) => (
            <span key={label} style={{ color: '#c1c4ca', fontSize: 12, fontWeight: 700 }}>{label}</span>
          ))}
        </div>
      </div>
      <div style={{ borderRight: '1px solid #dedfe3', display: 'grid', gap: 5, minWidth: 210, padding: '0 12px' }}>
        {[0, 1].map((row) => (
          <div key={row} style={{ display: 'flex', gap: 7 }}>
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <span key={item} style={{ background: '#cfd3da', borderRadius: 999, display: 'block', height: 4, marginTop: 7, width: item % 2 === 0 ? 26 : 18 }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, paddingLeft: 12 }}>
        {['Picture', 'Shapes', 'Text Box', 'Arrange', 'Add-ins', 'Claude'].map((label) => <RibbonTool key={label} label={label} tall />)}
      </div>
    </div>
  )
}

function SlideSurface({ slide, scale = 1 }: { slide: PowerPointMockSlide; scale?: number }) {
  const accent = slide.accent || DEFAULT_ACCENT

  if (slide.layout === 'title') {
    return (
      <div
        style={{
          background: '#092744',
          border: '1px solid #041522',
          boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
          color: '#ffffff',
          height: 360 * scale,
          overflow: 'hidden',
          position: 'relative',
          width: 640 * scale,
        }}
      >
        <span style={{ background: accent, bottom: 58 * scale, display: 'block', height: 5 * scale, left: 0, position: 'absolute', right: 0 }} />
        <span style={{ background: accent, bottom: 82 * scale, display: 'block', left: 32 * scale, position: 'absolute', top: 78 * scale, width: 5 * scale }} />
        <div style={{ display: 'grid', gap: 10 * scale, left: 52 * scale, position: 'absolute', top: 94 * scale }}>
          <span style={{ color: accent, fontSize: 11 * scale, fontWeight: 760, letterSpacing: 5 * scale }}>ACME INDUSTRIAL SOLUTIONS, INC.</span>
          <h2 style={{ color: '#ffffff', fontFamily: 'Georgia, serif', fontSize: 39 * scale, letterSpacing: 0, lineHeight: 1, margin: 0 }}>{slide.title}</h2>
          <p style={{ color: '#f6f0e1', fontFamily: 'Georgia, serif', fontSize: 20 * scale, fontStyle: 'italic', margin: 0 }}>{slide.subtitle}</p>
          <span style={{ color: '#ffffff', fontSize: 11 * scale, fontWeight: 700, marginTop: 6 * scale }}>Pre-read for the SteerCo of Thursday, April 30, 2026</span>
        </div>
        <div style={{ bottom: 104 * scale, display: 'grid', gap: 32 * scale, gridTemplateColumns: '1fr 1fr 1fr', left: 52 * scale, position: 'absolute', right: 36 * scale }}>
          {(slide.metrics || [
            { label: 'EBITDA uplift by FY29', value: '+$159M' },
            { label: 'p.a. TSR uplift over plan', value: '+9-14%' },
            { label: 'Board review', value: 'May 7' },
          ]).slice(0, 3).map((metric) => (
            <div key={metric.label} style={{ display: 'grid', gap: 8 * scale }}>
              <span style={{ background: '#9b8a55', display: 'block', height: 2 * scale }} />
              <strong style={{ color: accent, fontFamily: 'Georgia, serif', fontSize: 24 * scale, lineHeight: 1 }}>{metric.value}</strong>
              <span style={{ color: '#ffffff', fontSize: 8 * scale, fontStyle: 'italic', fontWeight: 700 }}>{metric.label}</span>
            </div>
          ))}
        </div>
        <span style={{ bottom: 24 * scale, color: '#d8c891', fontSize: 10 * scale, fontWeight: 760, left: 52 * scale, letterSpacing: 4 * scale, position: 'absolute' }}>STRICTLY CONFIDENTIAL - DRAFT</span>
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #d7d8dc',
        boxShadow: '0 2px 8px rgba(0,0,0,0.16)',
        color: '#121820',
        display: 'grid',
        gap: 16 * scale,
        height: 360 * scale,
        padding: 34 * scale,
        position: 'relative',
        width: 640 * scale,
      }}
    >
      <span style={{ color: '#1d2733', fontSize: 18 * scale, fontWeight: 760 }}>{slide.title}</span>
      {slide.layout === 'metrics' ? (
        <div style={{ display: 'grid', gap: 14 * scale, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {(slide.metrics || []).slice(0, 3).map((metric) => (
            <div key={metric.label} style={{ background: '#082744', color: '#ffffff', display: 'grid', gap: 6 * scale, padding: 13 * scale }}>
              <strong style={{ color: accent, fontSize: 22 * scale }}>{metric.value}</strong>
              <span style={{ fontSize: 8 * scale }}>{metric.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      {slide.layout === 'chart' ? (
        <div style={{ alignItems: 'end', display: 'flex', gap: 12 * scale, height: 170 * scale }}>
          {[58, 88, 76, 118, 94, 140].map((height, index) => (
            <span key={`${height}-${index}`} style={{ background: index === 4 ? accent : '#0c4d73', flex: 1, height: height * scale }} />
          ))}
        </div>
      ) : null}
      {slide.layout === 'bullets' ? (
        <div style={{ display: 'grid', gap: 10 * scale }}>
          {(slide.bullets || []).slice(0, 4).map((bullet) => (
            <div key={bullet} style={{ alignItems: 'center', display: 'grid', gap: 11 * scale, gridTemplateColumns: `${9 * scale}px 1fr` }}>
              <span style={{ background: accent, borderRadius: 999, height: 9 * scale, width: 9 * scale }} />
              <span style={{ color: '#303844', fontSize: 14 * scale, fontWeight: 650 }}>{bullet}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Thumbnail({ active, index, slide }: { active: boolean; index: number; slide: PowerPointMockSlide }) {
  const frame = useCurrentFrame()
  const p = progress(frame, 18 + index * 4, 38 + index * 4)

  return (
    <div style={{ alignItems: 'start', display: 'grid', gap: 8, gridTemplateColumns: '18px 1fr', opacity: p, transform: `translateY(${(1 - p) * 10}px)` }}>
      <span style={{ color: '#363a40', fontSize: 10, fontWeight: 650, paddingTop: 6, textAlign: 'right' }}>{index + 1}</span>
      <div
        style={{
          background: '#ffffff',
          border: `2px solid ${active ? '#d93417' : '#d6d6d6'}`,
          borderRadius: 5,
          boxShadow: active ? '0 5px 13px rgba(217, 52, 23, 0.22)' : '0 2px 5px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
      >
        <SlideSurface scale={0.235} slide={slide} />
      </div>
    </div>
  )
}

function ClaudePanel() {
  return (
    <aside style={{ background: '#ffffff', borderLeft: '1px solid #dedfe3', display: 'grid', gridTemplateRows: '46px 1fr 132px', minWidth: 0 }}>
      <header style={{ alignItems: 'center', borderBottom: '1px solid #eeeeee', display: 'flex', justifyContent: 'space-between', padding: '0 14px' }}>
        <strong style={{ color: '#1f2328', fontSize: 14 }}>Claude</strong>
        <span style={{ alignItems: 'center', background: '#8d9095', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 12, fontWeight: 800, height: 18, justifyContent: 'center', width: 18 }}>x</span>
      </header>
      <div style={{ color: '#777b82', display: 'grid', fontSize: 13, gap: 18, padding: '48px 15px 0' }}>
        <div style={{ display: 'flex', gap: 18, justifyContent: 'flex-end', paddingRight: 6 }}>
          <span>clock</span>
          <span>+</span>
          <span>...</span>
        </div>
        <span>Received message &gt;</span>
        <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
          <span style={{ color: '#d86f4a', fontSize: 22 }}>*</span>
          <span style={{ color: '#4a4f55' }}>Responding...</span>
        </div>
      </div>
      <div style={{ background: '#f7f6f2', border: '1px solid #e6e2db', borderRadius: 12, margin: '0 13px 13px', padding: 12 }}>
        <div style={{ alignItems: 'center', color: '#5d5f64', display: 'flex', fontSize: 12, justifyContent: 'space-between' }}>
          <span>Slide 1 selected</span>
          <span>x</span>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #ececec', borderRadius: 12, color: '#8c8f94', display: 'grid', fontSize: 14, gap: 18, marginTop: 12, padding: 13 }}>
          <span>Reply</span>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
            <span>+  &gt;&gt;</span>
            <span>Opus 4.7 v   mic</span>
          </div>
        </div>
      </div>
    </aside>
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
  const animatedSlideIndex = Math.min(safeSlides.length - 1, Math.floor(localFrame / 92) % safeSlides.length)
  const selectedIndex = Math.min(safeSlides.length - 1, Math.max(0, activeSlideIndex ?? animatedSlideIndex))
  const selectedSlide = safeSlides[selectedIndex]
  const windowIn = progress(localFrame, 0, 34)
  const canvasIn = progress(localFrame, 18, 50)
  const ribbonIn = progress(localFrame, 8, 38)

  return (
    <AbsoluteFill style={{ background: '#efeee8', fontFamily: FONT_STACK, overflow: 'hidden', ...style }}>
      <div
        style={{
          background: '#f7f7f8',
          border: '1px solid #e5e5e5',
          borderRadius: 16,
          boxShadow: '0 28px 90px rgba(20, 24, 22, 0.16)',
          height: 615,
          left: '50%',
          overflow: 'hidden',
          position: 'absolute',
          top: 110,
          transform: `translateX(-50%) translateY(${(1 - windowIn) * 28}px) scale(${0.96 + windowIn * 0.04})`,
          width: 1030,
        }}
      >
        <div style={{ alignItems: 'center', background: '#fafafa', display: 'grid', gridTemplateColumns: '420px 1fr 335px', height: 31, padding: '0 8px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', gap: 7, paddingLeft: 2 }}>
              <MacDot color="#ff5f57" />
              <MacDot color="#febc2e" />
              <MacDot color="#28c840" />
            </div>
            <span style={{ color: '#666b72', fontSize: 12, fontWeight: 650 }}>AutoSave</span>
            <span style={{ background: '#8a8d92', borderRadius: 999, display: 'block', height: 14, position: 'relative', width: 28 }}>
              <span style={{ background: '#ffffff', borderRadius: 999, display: 'block', height: 12, left: 1, position: 'absolute', top: 1, width: 12 }} />
            </span>
            <span style={{ color: '#8b8f95', fontSize: 13 }}>Home  Save  Undo  Redo  ...</span>
          </div>
          <div style={{ alignItems: 'center', color: '#60646b', display: 'flex', fontSize: 13, fontWeight: 650, gap: 7, justifyContent: 'center' }}>
            <span style={{ background: '#c9301c', borderRadius: 3, display: 'block', height: 11, width: 11 }} />
            <span>{title}</span>
          </div>
          <div style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'end' }}>
            <span style={{ color: '#6b7077', fontSize: 12, fontWeight: 700 }}>Search (Cmd + Ctrl + U)</span>
            <span style={{ background: '#ffffff', border: '1px solid #e0e1e5', borderRadius: 6, color: '#1f2328', fontSize: 12, fontWeight: 700, padding: '4px 8px' }}>Comments</span>
            <span style={{ background: '#ffffff', border: '1px solid #e0e1e5', borderRadius: 6, color: '#1f2328', fontSize: 12, fontWeight: 700, padding: '4px 8px' }}>Record</span>
            <span style={{ background: '#d83417', borderRadius: 6, color: '#ffffff', fontSize: 12, fontWeight: 800, padding: '5px 9px' }}>Share v</span>
          </div>
        </div>

        <div style={{ alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #e0e1e5', display: 'flex', gap: 22, height: 26, padding: '0 8px' }}>
          {TABS.map((tab) => (
            <span key={tab} style={{ borderBottom: tab === 'Home' ? '2px solid #d93417' : '2px solid transparent', color: '#000000', fontSize: 12, fontWeight: tab === 'Home' ? 800 : 650, height: 24, lineHeight: '24px' }}>
              {tab}
            </span>
          ))}
        </div>

        <div style={{ opacity: ribbonIn }}>
          <Ribbon show={showRibbon} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '155px 1fr 250px', height: showRibbon ? 449 : 525 }}>
          <aside style={{ background: '#f0f0f3', borderRight: '1px solid #d9d9de', overflow: 'hidden', padding: '8px 8px 0' }}>
            <div style={{ display: 'grid', gap: 10 }}>
              {safeSlides.slice(0, 7).map((slide, index) => (
                <Thumbnail active={index === selectedIndex} index={index} key={`${slide.title}-${index}`} slide={slide} />
              ))}
            </div>
          </aside>

          <main style={{ background: '#eeeeef', display: 'grid', gridTemplateRows: '1fr 19px', minWidth: 0 }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', opacity: canvasIn, paddingTop: 14, transform: `translateY(${(1 - canvasIn) * 12}px)` }}>
              <SlideSurface slide={selectedSlide} />
            </div>
            <div style={{ background: '#f5f5f5', borderTop: '1px solid #d0d1d5' }} />
          </main>

          <ClaudePanel />
        </div>

        <div style={{ alignItems: 'center', background: '#f7f7f7', borderTop: '1px solid #d2d3d7', bottom: 0, color: '#676b72', display: 'grid', fontSize: 11, gridTemplateColumns: '250px 1fr 250px', height: 19, left: 0, padding: '0 12px', position: 'absolute', right: 0 }}>
          <span>Slide {selectedIndex + 1} of {safeSlides.length}   English (United States)</span>
          <span>Accessibility: Good to go</span>
          <span style={{ textAlign: 'right' }}>Notes   Comments   View Grid Reading   - 149% + [ ]</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}
