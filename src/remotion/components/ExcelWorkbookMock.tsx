import type { CSSProperties } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

export type ExcelMockSheet = {
  activeCell?: string
  name: string
  tabs: string[]
  title: string
}

type ExcelWorkbookMockProps = {
  activeSheetIndex?: number
  fileName: string
  sheets: ExcelMockSheet[]
  startFrame?: number
  style?: CSSProperties
}

const FONT_STACK = 'Geist, "Segoe UI", Arial, sans-serif'
const FALLBACK_SHEET: ExcelMockSheet = {
  activeCell: 'I1',
  name: 'Assumptions',
  tabs: ['Assumptions', 'Benchmarks', 'Scenarios'],
  title: 'ACME INDUSTRIAL - VALUE-CREATION MODEL',
}
const TABS = ['Home', 'Insert', 'Draw', 'Page Layout', 'Formulas', 'Data', 'Review', 'View', 'Automate']
const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']
const MODEL_ROWS = [
  ['Section / Driver', 'FY25A', 'FY26E', 'FY27E', 'FY28E', 'FY29E'],
  ['REVENUE BUILD ($M)', '', '', '', '', ''],
  ['Organic growth rate - base case', '', '2.5%', '4.5%', '5.5%', '6.0%'],
  ['M&A contribution - bolt-on revenue ($M)', '', '-', '$105', '$135', '$45'],
  ['Divestitures - revenue exited ($M)', '', '-', '($160)', '($150)', '-'],
  ['Revenue, prior period', '$2,369', '', '', '', ''],
  ['Revenue', '$2,430', '$2,491', '$2,548', '$2,673', '$2,878'],
  ['YoY revenue growth', '', '2.5%', '2.3%', '4.9%', '7.7%'],
  ['', '', '', '', '', ''],
  ['MARGIN BUILD', '', '', '', '', ''],
  ['Adj. EBITDA margin - FY25A baseline', '14.1%', '', '', '', ''],
  ['Pricing reset (bps)', '', '+60 bps', '+100 bps', '+110 bps', '+110 bps'],
  ['Plant footprint review (bps)', '', '+20 bps', '+60 bps', '+80 bps', '+90 bps'],
  ['Procurement (bps)', '', '+30 bps', '+50 bps', '+60 bps', '+60 bps'],
  ['Total margin uplift (bps)', '', '+120 bps', '+260 bps', '+340 bps', '+390 bps'],
  ['Adj. EBITDA margin (resulting)', '14.1%', '15.3%', '17.9%', '21.3%', '25.2%'],
  ['', '', '', '', '', ''],
  ['CAPITAL & CAPEX', '', '', '', '', ''],
  ['Capex as % of revenue', '2.6%', '2.8%', '3.0%', '3.0%', '2.8%'],
  ['Working capital as % of revenue', '22.0%', '21.5%', '20.5%', '19.0%', '18.0%'],
  ['Cash tax rate', '24.5%', '24.5%', '24.5%', '24.5%', '24.5%'],
  ['D&A as % of revenue', '3.8%', '3.8%', '3.9%', '4.0%', '4.0%'],
  ['', '', '', '', '', ''],
  ['SCENARIO SENSITIVITIES (multipliers vs. base)', '', '165', '180', '', ''],
  ['Conservative - % of base margin uplift', '', '60.0%', '65.0%', '65.0%', '65.0%'],
  ['Base - % of base margin uplift', '', '100.0%', '100.0%', '100.0%', '100.0%'],
  ['Stretch - % of base margin uplift', '', '120.0%', '130.0%', '135.0%', '140.0%'],
  ['', '', '', '', '', ''],
  ['Notes & sources', '', '', '', '', ''],
  ['Source: FY25A actuals from Acme 10-K. All figures in USD millions.', '', '', '', '', ''],
]

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function MacDot({ color }: { color: string }) {
  return <span style={{ background: color, borderRadius: 999, display: 'block', height: 10, width: 10 }} />
}

function RibbonButton({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <div style={{ alignItems: 'center', color: '#273029', display: 'grid', fontSize: 9, fontWeight: 650, gap: 3, justifyItems: 'center', minWidth: tall ? 40 : 30 }}>
      <span style={{ background: '#ffffff', border: '1px solid #cfd6d1', borderRadius: 2, display: 'block', height: tall ? 30 : 19, width: tall ? 30 : 24 }} />
      <span>{label}</span>
    </div>
  )
}

function ExcelRibbon() {
  return (
    <div style={{ background: '#f7f8f7', borderBottom: '1px solid #d9ddd9', display: 'flex', height: 76, padding: '6px 10px' }}>
      <div style={{ borderRight: '1px solid #e0e2e0', display: 'flex', gap: 8, paddingRight: 12 }}>
        <RibbonButton label="Paste" tall />
        <div style={{ display: 'grid', gap: 2 }}>
          {['Cut', 'Copy', 'Format'].map((label) => <RibbonButton key={label} label={label} />)}
        </div>
      </div>
      <div style={{ borderRight: '1px solid #e0e2e0', display: 'grid', gap: 5, minWidth: 250, padding: '0 12px' }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <span style={{ background: '#ffffff', border: '1px solid #cfd6d1', borderRadius: 3, height: 22, width: 98 }} />
          <span style={{ background: '#ffffff', border: '1px solid #cfd6d1', borderRadius: 3, height: 22, width: 44 }} />
          {['A', 'A'].map((item, index) => <span key={`${item}-${index}`} style={{ color: '#243129', fontSize: 14, fontWeight: 700 }}>{item}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {['B', 'I', 'U', '#', 'Fill', 'A'].map((label) => <span key={label} style={{ color: '#202820', fontSize: 12, fontWeight: 700 }}>{label}</span>)}
        </div>
      </div>
      <div style={{ borderRight: '1px solid #e0e2e0', display: 'grid', gap: 5, minWidth: 210, padding: '0 12px' }}>
        {[0, 1].map((row) => (
          <div key={row} style={{ display: 'flex', gap: 7 }}>
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <span key={item} style={{ background: '#aeb8b1', borderRadius: 999, display: 'block', height: 4, marginTop: 7, width: item % 2 === 0 ? 24 : 17 }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderRight: '1px solid #e0e2e0', display: 'flex', gap: 8, padding: '0 12px' }}>
        {['General', '$', '%', ',', '.00'].map((label) => <span key={label} style={{ background: label === 'General' ? '#ffffff' : 'transparent', border: label === 'General' ? '1px solid #cfd6d1' : 0, borderRadius: 3, color: '#202820', fontSize: 12, fontWeight: 650, height: 22, padding: '3px 9px' }}>{label}</span>)}
      </div>
      <div style={{ display: 'flex', gap: 10, paddingLeft: 12 }}>
        {['Conditional', 'Format', 'Insert', 'Delete', 'Format', 'Claude'].map((label) => <RibbonButton key={label} label={label} tall />)}
      </div>
    </div>
  )
}

function ClaudePanel() {
  return (
    <aside style={{ background: '#ffffff', borderLeft: '1px solid #dedfe3', display: 'grid', gridTemplateRows: '46px 1fr 96px', minWidth: 0 }}>
      <header style={{ alignItems: 'center', borderBottom: '1px solid #eeeeee', display: 'flex', justifyContent: 'space-between', padding: '0 14px' }}>
        <strong style={{ color: '#1f2328', fontSize: 14 }}>Claude</strong>
        <span style={{ alignItems: 'center', background: '#8d9095', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 12, fontWeight: 800, height: 18, justifyContent: 'center', width: 18 }}>x</span>
      </header>
      <div style={{ color: '#4a4f55', display: 'grid', fontSize: 13, gap: 18, padding: '38px 15px 0' }}>
        <div style={{ display: 'flex', gap: 18, justifyContent: 'flex-end', paddingRight: 6 }}>
          <span>clock</span>
          <span>+</span>
          <span>...</span>
        </div>
        <div style={{ background: '#f0eee7', borderRadius: 12, color: '#1f2328', fontSize: 13, lineHeight: 1.35, padding: 14 }}>
          Synergy assumptions look aggressive. Take those down and show me updated results.
        </div>
        <span style={{ color: '#777b82' }}>Read data, edited cells &gt;</span>
        <p style={{ lineHeight: 1.42, margin: 0 }}>
          Trimmed M&A 25% in <span style={{ background: '#eaf4ff', border: '1px solid #c8dff5', borderRadius: 4, color: '#2772a6', padding: '2px 5px' }}>Assumptions D9:G9</span>. All margin levers untouched.
        </p>
        <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
          <span style={{ color: '#d86f4a', fontSize: 22 }}>*</span>
          <span>Responding...</span>
        </div>
      </div>
      <div style={{ background: '#ffffff', border: '1px solid #ececec', borderRadius: 12, color: '#8c8f94', display: 'grid', fontSize: 14, gap: 18, margin: '0 13px 13px', padding: 13 }}>
        <span>Reply</span>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <span>+  &gt;&gt;</span>
          <span>Opus 4.7 v   mic</span>
        </div>
      </div>
    </aside>
  )
}

function FormulaBar({ activeCell }: { activeCell: string }) {
  return (
    <div style={{ alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #d7dadd', display: 'grid', gridTemplateColumns: '78px 32px 1fr 20px', height: 26 }}>
      <div style={{ borderRight: '1px solid #d7dadd', color: '#2f343b', fontSize: 12, fontWeight: 650, paddingLeft: 8 }}>{activeCell}</div>
      <div style={{ color: '#98a0a9', fontSize: 14, textAlign: 'center' }}>fx</div>
      <div style={{ borderLeft: '1px solid #e6e8eb', height: 20 }} />
      <div />
    </div>
  )
}

function Worksheet({ sheet }: { sheet: ExcelMockSheet }) {
  return (
    <div style={{ background: '#ffffff', color: '#111827', fontFamily: 'Arial, Helvetica, sans-serif', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(15, 55px)', height: 18 }}>
        <span style={{ background: '#f6f7f8', borderBottom: '1px solid #d8dadd', borderRight: '1px solid #d8dadd' }} />
        {COLUMNS.map((column) => (
          <span key={column} style={{ background: '#f6f7f8', borderBottom: '1px solid #d8dadd', borderRight: '1px solid #e2e4e7', color: '#59616b', fontSize: 10, lineHeight: '18px', textAlign: 'center' }}>{column}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(42, 18px)' }}>
        {Array.from({ length: 42 }).map((_, row) => (
          <div key={`row-${row}`} style={{ display: 'grid', gridTemplateColumns: '28px repeat(15, 55px)' }}>
            <span style={{ background: '#f6f7f8', borderBottom: '1px solid #e4e6e9', borderRight: '1px solid #d8dadd', color: '#6b7280', fontSize: 10, lineHeight: '18px', textAlign: 'center' }}>{row + 1}</span>
            {Array.from({ length: 15 }).map((__, column) => (
              <span key={`cell-${row}-${column}`} style={{ borderBottom: '1px solid #e4e6e9', borderRight: '1px solid #e4e6e9' }} />
            ))}
          </div>
        ))}
      </div>

      <div style={{ left: 42, position: 'absolute', top: 34, width: 455 }}>
        <h1 style={{ color: '#111827', fontSize: 16, fontWeight: 800, letterSpacing: 0, margin: '0 0 1px' }}>{sheet.title}</h1>
        <p style={{ color: '#7a818b', fontSize: 10, fontStyle: 'italic', margin: '0 0 10px' }}>Assumptions tab - Blue = input - Black = formula - Green = cross-sheet link</p>
        <div style={{ display: 'grid', gridTemplateColumns: '210px repeat(5, 55px)' }}>
          {MODEL_ROWS.map((row, rowIndex) =>
            row.map((cell, columnIndex) => {
              const header = rowIndex === 0
              const section = ['REVENUE BUILD ($M)', 'MARGIN BUILD', 'CAPITAL & CAPEX', 'SCENARIO SENSITIVITIES (multipliers vs. base)', 'Notes & sources'].includes(row[0])
              const total = ['Revenue', 'Total margin uplift (bps)', 'Adj. EBITDA margin (resulting)'].includes(row[0])
              const blue = columnIndex > 0 && cell !== '' && !header && !section && !total
              return (
                <span
                  key={`${rowIndex}-${columnIndex}`}
                  style={{
                    background: header ? '#082744' : section ? '#e7f0f7' : row[0] === 'Adj. EBITDA margin - FY25A baseline' && columnIndex < 2 ? '#fff3c9' : 'transparent',
                    borderBottom: total ? '2px solid #111111' : '1px solid transparent',
                    color: header ? '#ffffff' : blue ? '#1b22b8' : '#111827',
                    fontSize: rowIndex > 28 ? 9 : 10,
                    fontStyle: rowIndex > 28 ? 'italic' : 'normal',
                    fontWeight: header || section || total ? 800 : 500,
                    height: 17,
                    lineHeight: '17px',
                    overflow: 'hidden',
                    padding: '0 3px',
                    textAlign: columnIndex === 0 ? 'left' : 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cell}
                </span>
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}

export function ExcelWorkbookMock({ activeSheetIndex, fileName, sheets, startFrame = 0, style }: ExcelWorkbookMockProps) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const safeSheets = sheets.length > 0 ? sheets : [FALLBACK_SHEET]
  const animatedIndex = Math.min(safeSheets.length - 1, Math.floor(localFrame / 130) % safeSheets.length)
  const selectedIndex = Math.min(safeSheets.length - 1, Math.max(0, activeSheetIndex ?? animatedIndex))
  const selectedSheet = safeSheets[selectedIndex]
  const windowIn = progress(localFrame, 0, 34)
  const sheetIn = progress(localFrame, 18, 48)

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
            <span style={{ background: '#1f9d55', borderRadius: 2, display: 'block', height: 11, width: 11 }} />
            <span>{fileName}</span>
          </div>
          <div style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'end' }}>
            <span style={{ color: '#6b7077', fontSize: 12, fontWeight: 700 }}>Search (Cmd + Ctrl + U)</span>
            <span style={{ background: '#ffffff', border: '1px solid #e0e1e5', borderRadius: 6, color: '#1f2328', fontSize: 12, fontWeight: 700, padding: '4px 8px' }}>Comments</span>
            <span style={{ background: '#108c46', borderRadius: 6, color: '#ffffff', fontSize: 12, fontWeight: 800, padding: '5px 9px' }}>Share v</span>
          </div>
        </div>

        <div style={{ alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #e0e1e5', display: 'flex', gap: 22, height: 26, padding: '0 8px' }}>
          {TABS.map((tab) => (
            <span key={tab} style={{ borderBottom: tab === 'Home' ? '2px solid #1f9d55' : '2px solid transparent', color: '#000000', fontSize: 12, fontWeight: tab === 'Home' ? 800 : 650, height: 24, lineHeight: '24px' }}>
              {tab}
            </span>
          ))}
        </div>

        <ExcelRibbon />
        <FormulaBar activeCell={selectedSheet.activeCell || 'A1'} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', height: 463 }}>
          <main style={{ background: '#ffffff', display: 'grid', gridTemplateRows: '1fr 32px', minWidth: 0, opacity: sheetIn, transform: `translateY(${(1 - sheetIn) * 12}px)` }}>
            <Worksheet sheet={selectedSheet} />
            <footer style={{ alignItems: 'center', background: '#f6f7f6', borderTop: '1px solid #d7dadd', display: 'flex', gap: 8, padding: '0 9px' }}>
              <span style={{ color: '#7a818b', fontSize: 13 }}>Prev Next</span>
              {selectedSheet.tabs.map((tab) => (
                <span key={tab} style={{ background: tab === selectedSheet.name ? '#ffffff' : 'transparent', border: tab === selectedSheet.name ? '1px solid #d7dadd' : 0, borderRadius: '7px 7px 0 0', color: tab === selectedSheet.name ? '#118642' : '#33383f', fontSize: 12, fontWeight: 800, padding: '7px 18px' }}>{tab}</span>
              ))}
              <span style={{ color: '#22272e', fontSize: 18, fontWeight: 700 }}>+</span>
            </footer>
          </main>
          <ClaudePanel />
        </div>

        <div style={{ alignItems: 'center', background: '#f7f7f7', borderTop: '1px solid #d2d3d7', bottom: 0, color: '#676b72', display: 'grid', fontSize: 11, gridTemplateColumns: '250px 1fr 250px', height: 19, left: 0, padding: '0 12px', position: 'absolute', right: 0 }}>
          <span>Ready   Accessibility: Good to go</span>
          <span />
          <span style={{ textAlign: 'right' }}>Page Layout   Normal   - 100% +</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}
