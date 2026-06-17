import type { CSSProperties } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

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

loadSfProFonts()

const FONT_STACK = IOS_REMOTION_FONT_STACK
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
        <div style={{ alignItems: 'center', background: '#fafafa', display: 'grid', gridTemplateColumns: '340px 1fr 310px', height: 31, padding: '0 8px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', gap: 7, paddingLeft: 2 }}>
              <span style={{ background: '#ff5f57', borderRadius: 999, display: 'block', height: 10, width: 10 }} />
              <span style={{ background: '#febc2e', borderRadius: 999, display: 'block', height: 10, width: 10 }} />
              <span style={{ background: '#28c840', borderRadius: 999, display: 'block', height: 10, width: 10 }} />
            </div>
            <span style={{ color: '#8b8f95', fontSize: 13 }}>Back  Forward  Reload</span>
          </div>
          <div style={{ alignItems: 'center', color: '#60646b', display: 'flex', fontSize: 13, fontWeight: 650, gap: 7, justifyContent: 'center' }}>
            <span style={{ background: '#d83417', borderRadius: 3, display: 'block', height: 11, width: 11 }} />
            <span>{fileName}</span>
          </div>
          <div style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'end' }}>
            <span style={{ color: '#6b7077', fontSize: 12, fontWeight: 700 }}>Search</span>
            <span style={{ background: '#ffffff', border: '1px solid #e0e1e5', borderRadius: 6, color: '#1f2328', fontSize: 12, fontWeight: 700, padding: '4px 8px' }}>Comments</span>
            <span style={{ background: '#d83417', borderRadius: 6, color: '#ffffff', fontSize: 12, fontWeight: 800, padding: '5px 9px' }}>Share v</span>
          </div>
        </div>

        <div style={{ alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #d7dadd', display: 'grid', gridTemplateColumns: '1fr 90px', height: 32, padding: '0 10px' }}>
          <div style={{ alignItems: 'center', background: '#f6f7f8', border: '1px solid #d7dadd', borderRadius: 6, color: '#4b5563', display: 'flex', fontSize: 13, height: 22, padding: '0 10px' }}>
            {url}
          </div>
          <div style={{ color: '#515966', fontSize: 12, fontWeight: 800, textAlign: 'right' }}>PDF Tools</div>
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

        <div style={{ display: 'grid', gridTemplateColumns: '162px 1fr 15px', height: 508 }}>
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
