import type { CSSProperties } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/remotion/fonts/sfPro'

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

loadSfProFonts()

const FONT_STACK = IOS_REMOTION_FONT_STACK
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

function QuickAccessIcon({ kind }: { kind: 'home' | 'save' | 'undo' | 'redo' | 'more' }) {
  const isArrow = kind === 'undo' || kind === 'redo'
  return (
    <span style={{ alignItems: 'center', display: 'flex', height: 17, justifyContent: 'center', position: 'relative', width: kind === 'more' ? 20 : 17 }}>
      {kind === 'home' ? (
        <>
          <span style={{ borderBottom: '6px solid #777c83', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', height: 0, position: 'absolute', top: 2, width: 0 }} />
          <span style={{ border: '1.7px solid #777c83', borderTop: 0, height: 8, position: 'absolute', top: 8, width: 10 }} />
        </>
      ) : null}
      {kind === 'save' ? (
        <span style={{ border: '1.6px solid #777c83', borderRadius: 2, display: 'block', height: 13, position: 'relative', width: 13 }}>
          <span style={{ background: '#777c83', display: 'block', height: 3, left: 2, position: 'absolute', right: 2, top: 2 }} />
          <span style={{ border: '1px solid #777c83', bottom: 1, height: 4, left: 3, position: 'absolute', right: 3 }} />
        </span>
      ) : null}
      {isArrow ? (
        <>
          <span style={{ border: '1.7px solid #777c83', borderRight: 0, borderTop: 0, height: 8, transform: kind === 'undo' ? 'rotate(45deg)' : 'rotate(-135deg)', width: 8 }} />
          <span style={{ background: '#777c83', height: 1.7, marginLeft: kind === 'undo' ? -1 : 0, width: 8 }} />
        </>
      ) : null}
      {kind === 'more' ? <span style={{ color: '#777c83', fontSize: 14, fontWeight: 800, lineHeight: 1 }}>...</span> : null}
    </span>
  )
}

function ExcelIcon({ accent = '#1f9d55', tall = false, type = 'table' }: { accent?: string; tall?: boolean; type?: 'table' | 'lines' | 'grid' | 'sigma' | 'format' }) {
  const size = tall ? 28 : 20
  return (
    <span
      style={{
        background: '#ffffff',
        border: '1px solid #cfd6d1',
        borderRadius: 3,
        display: 'block',
        height: size,
        overflow: 'hidden',
        position: 'relative',
        width: tall ? 30 : 22,
      }}
    >
      {type === 'table' ? (
        <>
          <span style={{ background: accent, display: 'block', height: tall ? 7 : 5, left: 3, position: 'absolute', right: 3, top: 3 }} />
          {[0, 1].map((column) => <span key={column} style={{ background: '#d7ded9', bottom: 4, display: 'block', left: 5 + column * 9, position: 'absolute', top: tall ? 13 : 10, width: 5 }} />)}
        </>
      ) : null}
      {type === 'lines' ? (
        [5, 10, 15].map((top, index) => <span key={top} style={{ background: index === 1 ? accent : '#aeb8b1', display: 'block', height: 2, left: 4, position: 'absolute', right: index === 2 ? 8 : 4, top }} />)
      ) : null}
      {type === 'grid' ? (
        <>
          {[0, 1, 2].map((row) => <span key={`row-${row}`} style={{ background: row === 0 ? accent : '#d7ded9', display: 'block', height: 4, left: 4, position: 'absolute', right: 4, top: 4 + row * 6 }} />)}
          <span style={{ background: '#ffffff', bottom: 3, display: 'block', left: 11, position: 'absolute', top: 3, width: 1 }} />
        </>
      ) : null}
      {type === 'sigma' ? <span style={{ color: accent, display: 'block', fontSize: tall ? 22 : 16, fontWeight: 900, lineHeight: `${size}px`, textAlign: 'center' }}>S</span> : null}
      {type === 'format' ? (
        <>
          <span style={{ background: '#f7c948', display: 'block', height: 9, left: 4, position: 'absolute', top: 4, width: 9 }} />
          <span style={{ background: accent, display: 'block', height: 9, position: 'absolute', right: 4, top: tall ? 13 : 8, width: 9 }} />
        </>
      ) : null}
    </span>
  )
}

function RibbonButton({ accent, label, tall = false, type = 'table' }: { accent?: string; label: string; tall?: boolean; type?: 'table' | 'lines' | 'grid' | 'sigma' | 'format' }) {
  return (
    <div style={{ alignItems: 'center', color: '#273029', display: 'grid', fontSize: 8.5, fontWeight: 650, gap: 2, justifyItems: 'center', lineHeight: 1, minWidth: tall ? 36 : 28, whiteSpace: 'nowrap' }}>
      <ExcelIcon accent={accent} tall={tall} type={type} />
      <span>{label}</span>
    </div>
  )
}

function ExcelField({ label, width }: { label: string; width: number }) {
  return (
    <span style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #cfd6d1', borderRadius: 3, color: '#202820', display: 'flex', fontSize: 10.5, fontWeight: 650, height: 21, justifyContent: 'space-between', padding: '0 7px', width }}>
      <span>{label}</span>
      <span style={{ color: '#717972', fontSize: 9 }}>v</span>
    </span>
  )
}

function ExcelTextButton({ children, color = '#202820' }: { children: string; color?: string }) {
  return <span style={{ color, fontSize: 11, fontWeight: 800, minWidth: 12, textAlign: 'center' }}>{children}</span>
}

function AlignButton({ active = false, width = 23 }: { active?: boolean; width?: number }) {
  return (
    <span style={{ background: active ? '#dde8e2' : 'transparent', border: active ? '1px solid #b9d1c3' : '1px solid transparent', borderRadius: 3, display: 'grid', gap: 2, height: 18, padding: '4px 3px', width }}>
      {[0, 1, 2].map((line) => <span key={line} style={{ background: '#7f8982', borderRadius: 999, display: 'block', height: 2, width: line === 1 ? 15 : 11 }} />)}
    </span>
  )
}

function StyleSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ alignItems: 'center', background: color, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 2, color: label === 'Bad' ? '#9d1f2b' : '#203126', display: 'flex', fontSize: 8.5, fontWeight: 750, height: 18, justifyContent: 'center', width: 52 }}>
      {label}
    </span>
  )
}

function ExcelRibbon() {
  return (
    <div style={{ background: '#f7f8f7', borderBottom: '1px solid #d9ddd9', display: 'flex', height: 76, overflow: 'hidden', padding: '6px 9px' }}>
      <div style={{ borderRight: '1px solid #e0e2e0', display: 'flex', gap: 7, paddingRight: 10 }}>
        <RibbonButton accent="#f0b23e" label="Paste" tall type="table" />
        <div style={{ display: 'grid', gap: 2 }}>
          {['Cut', 'Copy', 'Format'].map((label) => <RibbonButton accent="#9ba3ad" key={label} label={label} type="lines" />)}
        </div>
      </div>
      <div style={{ borderRight: '1px solid #e0e2e0', display: 'grid', gap: 4, minWidth: 220, padding: '0 9px' }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <ExcelField label="Arial" width={82} />
          <ExcelField label="12" width={38} />
          <ExcelTextButton>A</ExcelTextButton>
          <ExcelTextButton>A</ExcelTextButton>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
          {['B', 'I', 'U'].map((label) => <ExcelTextButton key={label}>{label}</ExcelTextButton>)}
          <ExcelIcon type="grid" />
          <span style={{ background: '#ffdf5d', borderBottom: '3px solid #d2a600', display: 'block', height: 12, width: 18 }} />
          <span style={{ background: '#ffffff', borderBottom: '3px solid #c8222f', color: '#202820', fontSize: 11, fontWeight: 900, textAlign: 'center', width: 18 }}>A</span>
        </div>
      </div>
      <div style={{ borderRight: '1px solid #e0e2e0', display: 'grid', gap: 4, minWidth: 168, padding: '0 9px' }}>
        {[0, 1].map((row) => (
          <div key={row} style={{ alignItems: 'center', display: 'flex', gap: 3 }}>
            {(row === 0 ? [0, 1, 2, 3, 4] : [0, 1, 2]).map((item) => <AlignButton active={row === 0 && item === 2} key={item} width={19} />)}
            {row === 1 ? <ExcelField label="Merge" width={62} /> : null}
          </div>
        ))}
      </div>
      <div style={{ borderRight: '1px solid #e0e2e0', display: 'grid', gap: 4, minWidth: 122, padding: '0 9px' }}>
        <ExcelField label="General" width={92} />
        <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
          {['$', '%', ',', '.00', '.0'].map((label) => <ExcelTextButton key={label}>{label}</ExcelTextButton>)}
        </div>
      </div>
      <div style={{ borderRight: '1px solid #e0e2e0', display: 'grid', gap: 3, minWidth: 116, padding: '0 9px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <StyleSwatch color="#ffffff" label="Normal" />
          <StyleSwatch color="#ffc7ce" label="Bad" />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <StyleSwatch color="#c6efce" label="Good" />
          <StyleSwatch color="#ffeb9c" label="Neutral" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, paddingLeft: 9 }}>
        <RibbonButton accent="#2c8b57" label="Insert" tall type="grid" />
        <RibbonButton accent="#c94747" label="Delete" tall type="grid" />
        <RibbonButton accent="#227a47" label="Format" tall type="format" />
        <RibbonButton accent="#1f9d55" label="Sum" tall type="sigma" />
        <RibbonButton accent="#d86f4a" label="Claude" tall type="format" />
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
            <div style={{ alignItems: 'center', display: 'flex', gap: 7 }}>
              {(['home', 'save', 'undo', 'redo', 'more'] as const).map((kind) => <QuickAccessIcon key={kind} kind={kind} />)}
            </div>
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
