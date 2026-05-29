import type { CSSProperties } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

export type PdfMockSection = {
  kind: 'text' | 'table' | 'chart' | 'icons'
  title: string
}

export type PdfMockPage = {
  accent?: string
  sections: PdfMockSection[]
  subtitle?: string
  title: string
}

type PdfViewerMockProps = {
  activePageIndex?: number
  fileName: string
  pages: PdfMockPage[]
  startFrame?: number
  style?: CSSProperties
  url?: string
}

const FONT_STACK = 'Geist, "Segoe UI", Arial, sans-serif'
const DEFAULT_ACCENT = '#1c8ee9'
const FALLBACK_PAGE: PdfMockPage = {
  sections: [
    { kind: 'table', title: 'Attributes' },
    { kind: 'text', title: 'Methods' },
    { kind: 'icons', title: 'Examples' },
  ],
  subtitle: 'Document preview',
  title: 'PDF Document',
}

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function BrowserButton({ children }: { children: string }) {
  return (
    <span
      style={{
        alignItems: 'center',
        background: '#f3f5f8',
        border: '1px solid #cbd2dc',
        borderRadius: 4,
        color: '#4b5563',
        display: 'flex',
        fontSize: 16,
        fontWeight: 800,
        height: 26,
        justifyContent: 'center',
        width: 30,
      }}
    >
      {children}
    </span>
  )
}

function ToolbarIcon({ wide = false }: { wide?: boolean }) {
  return (
    <span
      style={{
        background: '#343638',
        border: '1px solid #55585c',
        borderRadius: 3,
        display: 'block',
        height: 24,
        width: wide ? 64 : 26,
      }}
    />
  )
}

function PdfSection({ accent, section, small = false }: { accent: string; section: PdfMockSection; small?: boolean }) {
  const scale = small ? 0.38 : 1

  return (
    <div style={{ display: 'grid', gap: 9 * scale }}>
      <div style={{ background: '#3d3d3d', color: '#ffffff', fontSize: 18 * scale, fontWeight: 800, padding: `${6 * scale}px ${8 * scale}px` }}>
        {section.title}
      </div>
      {section.kind === 'table' ? (
        <div style={{ display: 'grid', gap: 4 * scale }}>
          <div style={{ background: '#d9d9d9', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: `${5 * scale}px ${7 * scale}px` }}>
            {['Name', 'Type', 'Default'].map((label) => (
              <span key={label} style={{ color: '#5d5d5d', fontSize: 12 * scale, fontWeight: 700 }}>{label}</span>
            ))}
          </div>
          {[0, 1, 2].map((row) => (
            <div key={row} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: `${3 * scale}px ${8 * scale}px` }}>
              {[70, 88, 54].map((width, column) => (
                <span key={`${row}-${column}`} style={{ background: column === 1 ? accent : '#111111', borderRadius: 999, height: 6 * scale, opacity: column === 1 ? 0.85 : 0.72, width: `${width}%` }} />
              ))}
            </div>
          ))}
        </div>
      ) : null}
      {section.kind === 'text' ? (
        <div style={{ display: 'grid', gap: 6 * scale, padding: `${2 * scale}px ${8 * scale}px` }}>
          {[86, 70, 92, 64].map((width, index) => (
            <span key={`${width}-${index}`} style={{ background: index === 1 ? accent : '#111111', borderRadius: 999, height: 7 * scale, opacity: index === 1 ? 0.8 : 0.64, width: `${width}%` }} />
          ))}
        </div>
      ) : null}
      {section.kind === 'chart' ? (
        <div style={{ alignItems: 'end', display: 'flex', gap: 8 * scale, height: 104 * scale, padding: `${4 * scale}px ${8 * scale}px` }}>
          {[42, 70, 58, 96, 76, 110].map((height, index) => (
            <span key={`${height}-${index}`} style={{ background: index === 3 ? accent : '#9fcaf0', borderRadius: 4 * scale, flex: 1, height: height * scale }} />
          ))}
        </div>
      ) : null}
      {section.kind === 'icons' ? (
        <div style={{ display: 'grid', gap: 14 * scale, gridTemplateColumns: 'repeat(4, 1fr)', padding: `${8 * scale}px ${10 * scale}px` }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
            <span key={item} style={{ background: item % 2 === 0 ? accent : '#ff4a1f', borderRadius: item % 3 === 0 ? 999 : 4 * scale, height: 42 * scale }} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PdfPageSurface({ page, small = false }: { page: PdfMockPage; small?: boolean }) {
  const accent = page.accent || DEFAULT_ACCENT
  const scale = small ? 0.28 : 1

  return (
    <div
      style={{
        background: '#ffffff',
        boxShadow: small ? '0 8px 18px rgba(0,0,0,0.42)' : '0 20px 58px rgba(0,0,0,0.34)',
        display: 'grid',
        gap: 18 * scale,
        height: 860 * scale,
        overflow: 'hidden',
        padding: 54 * scale,
        width: 640 * scale,
      }}
    >
      <header style={{ alignItems: 'end', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gap: 8 * scale }}>
          <h1 style={{ color: '#111111', fontSize: 30 * scale, lineHeight: 1.08, margin: 0 }}>{page.title}</h1>
          <span style={{ background: accent, borderRadius: 999, display: 'block', height: 5 * scale, width: 160 * scale }} />
        </div>
        <span style={{ color: '#111111', fontSize: 16 * scale, fontWeight: 700 }}>{page.subtitle}</span>
      </header>
      <div style={{ display: 'grid', gap: 18 * scale, gridTemplateColumns: '1fr 1fr' }}>
        {page.sections.map((section) => (
          <PdfSection accent={accent} key={`${section.title}-${section.kind}`} section={section} small={small} />
        ))}
      </div>
    </div>
  )
}

function PageThumb({ active, index, page }: { active: boolean; index: number; page: PdfMockPage }) {
  const frame = useCurrentFrame()
  const p = progress(frame, 22 + index * 7, 44 + index * 7)

  return (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'center', opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}>
      <div style={{ border: `4px solid ${active ? '#d9d9d9' : 'transparent'}`, boxShadow: active ? '0 0 0 2px rgba(0,0,0,0.28)' : 'none' }}>
        <PdfPageSurface page={page} small />
      </div>
      <span style={{ color: '#d8d8d8', fontSize: 14, fontWeight: 700 }}>{index + 1}</span>
    </div>
  )
}

export function PdfViewerMock({
  activePageIndex,
  fileName,
  pages,
  startFrame = 0,
  style,
  url = 'https://raw.githubusercontent.com/company/docs/main/report.pdf',
}: PdfViewerMockProps) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const safePages = pages.length > 0 ? pages : [FALLBACK_PAGE]
  const animatedPageIndex = Math.min(safePages.length - 1, Math.floor(localFrame / 110) % safePages.length)
  const selectedIndex = Math.min(safePages.length - 1, Math.max(0, activePageIndex ?? animatedPageIndex))
  const selectedPage = safePages[selectedIndex]
  const windowIn = progress(localFrame, 0, 32)
  const pageIn = progress(localFrame, 20, 54)

  return (
    <AbsoluteFill style={{ background: '#2b2d30', fontFamily: FONT_STACK, overflow: 'hidden', ...style }}>
      <div
        style={{
          background: '#e7eaef',
          border: '1px solid #255aa5',
          boxShadow: '0 44px 110px rgba(0, 0, 0, 0.38)',
          height: 760,
          left: '50%',
          overflow: 'hidden',
          position: 'absolute',
          top: 96,
          transform: `translateX(-50%) translateY(${(1 - windowIn) * 34}px) scale(${0.96 + windowIn * 0.04})`,
          width: 1018,
        }}
      >
        <div style={{ alignItems: 'center', background: 'linear-gradient(#5c91dd, #2f67bd)', color: '#ffffff', display: 'grid', gridTemplateColumns: '1fr auto', height: 34, padding: '0 10px 0 16px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
            <span style={{ background: '#ffffff', borderRadius: 999, height: 18, width: 18 }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{fileName}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['-', '□', '×'].map((item) => (
              <span key={item} style={{ alignItems: 'center', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 2, display: 'flex', fontSize: 13, height: 18, justifyContent: 'center', width: 25 }}>{item}</span>
            ))}
          </div>
        </div>

        <div style={{ alignItems: 'center', background: '#f7f8fb', borderBottom: '1px solid #cdd2db', display: 'grid', gridTemplateColumns: '118px 1fr 70px', height: 42, padding: '0 10px' }}>
          <div style={{ display: 'flex', gap: 7 }}>
            <BrowserButton>←</BrowserButton>
            <BrowserButton>→</BrowserButton>
            <BrowserButton>↻</BrowserButton>
          </div>
          <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #cdd2db', borderRadius: 4, color: '#4b5563', display: 'flex', fontSize: 14, height: 28, padding: '0 10px' }}>
            {url}
          </div>
          <div style={{ color: '#515966', fontSize: 20, fontWeight: 800, textAlign: 'right' }}>☰</div>
        </div>

        <div style={{ alignItems: 'center', background: 'linear-gradient(#3a3a3a, #232323)', borderBottom: '1px solid #111111', display: 'grid', gridTemplateColumns: '160px 1fr 160px', height: 44, padding: '0 10px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <ToolbarIcon />
            <ToolbarIcon />
            <ToolbarIcon />
          </div>
          <div style={{ alignItems: 'center', color: '#e6e6e6', display: 'flex', fontSize: 14, fontWeight: 700, gap: 12, justifyContent: 'center' }}>
            <span>Page:</span>
            <span style={{ background: '#4a4a4a', border: '1px solid #1c1c1c', borderRadius: 3, padding: '5px 18px' }}>{selectedIndex + 1}</span>
            <span>of {safePages.length}</span>
            <span style={{ color: '#bcbcbc', fontSize: 22 }}>−</span>
            <span style={{ color: '#bcbcbc', fontSize: 22 }}>＋</span>
            <ToolbarIcon wide />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'end' }}>
            <ToolbarIcon />
            <ToolbarIcon />
            <ToolbarIcon />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '162px 1fr 15px', height: 640 }}>
          <aside style={{ background: '#2f3032', borderRight: '1px solid #171717', overflow: 'hidden', padding: '18px 14px' }}>
            <div style={{ display: 'grid', gap: 18 }}>
              {safePages.map((page, index) => (
                <PageThumb active={index === selectedIndex} index={index} key={`${page.title}-${index}`} page={page} />
              ))}
            </div>
          </aside>

          <main style={{ background: '#303133', display: 'flex', justifyContent: 'center', overflow: 'hidden', paddingTop: 22 }}>
            <div style={{ opacity: pageIn, transform: `translateY(${(1 - pageIn) * 18}px)` }}>
              <PdfPageSurface page={selectedPage} />
            </div>
          </main>

          <div style={{ background: '#e6e8ec', borderLeft: '1px solid #aab0ba', position: 'relative' }}>
            <span style={{ background: '#b7bec8', borderRadius: 999, display: 'block', height: 120, left: 4, position: 'absolute', top: 90 + selectedIndex * 92, width: 7 }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
