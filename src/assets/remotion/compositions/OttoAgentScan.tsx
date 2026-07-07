import { Icon } from '@iconify/react'
import type { CSSProperties } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

export const OTTO_AGENT_SCAN_DURATION = 333

const INK = '#252525'
const MUTED = '#6f726c'
const BLUE = '#3f8ee8'
const PINK = '#f48aa8'
const PINK_DARK = '#e9547e'

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function fade(frame: number, start: number, end: number) {
  return interpolate(frame, [start, start + 18, end - 18, end], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function Caption({ children }: { children: string }) {
  return (
    <div
      style={{
        background: 'rgba(54,54,54,0.9)',
        borderRadius: 7,
        bottom: 34,
        color: '#ffffff',
        fontSize: 26,
        fontWeight: 760,
        left: '50%',
        letterSpacing: 0,
        lineHeight: 1,
        padding: '13px 18px 14px',
        position: 'absolute',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
        zIndex: 20,
      }}
    >
      {children}
    </div>
  )
}

function OttoGlyph({ color = '#ffffff', size = 32 }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 116 104" width={size * 1.12}>
      <path d="M23 13 C39 33 61 43 92 44" fill="none" stroke={color} strokeLinecap="square" strokeWidth="20" />
      <path d="M23 91 C39 71 61 61 92 60" fill="none" stroke={color} strokeLinecap="square" strokeWidth="20" />
    </svg>
  )
}

function AgentPointer({ frame, x, y }: { frame: number; x: number; y: number }) {
  const bob = interpolate(Math.sin(frame / 9), [-1, 1], [-3, 3])

  return (
    <div style={{ left: x, position: 'absolute', top: y + bob, zIndex: 15 }}>
      <div
        style={{
          borderBottom: '18px solid transparent',
          borderLeft: '30px solid #111111',
          borderTop: '12px solid transparent',
          filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.18))',
          transform: 'rotate(-22deg)',
        }}
      />
      <span
        style={{
          background: '#242424',
          borderRadius: 7,
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 760,
          left: 29,
          padding: '8px 10px',
          position: 'absolute',
          top: 20,
          whiteSpace: 'nowrap',
        }}
      >
        Jeanelle's Agent
      </span>
    </div>
  )
}

function PinkHighlight({ children, frame, start, style }: { children: string; frame: number; start: number; style: CSSProperties }) {
  const enter = progress(frame, start, start + 18)
  const scan = progress(frame, start + 8, start + 34)

  return (
    <div
      style={{
        background: 'rgba(244, 138, 168, 0.64)',
        border: `2px solid rgba(233, 84, 126, ${0.45 + scan * 0.35})`,
        borderRadius: 15,
        boxShadow: `0 0 ${18 + scan * 20}px rgba(244, 138, 168, 0.28)`,
        color: '#5a2330',
        fontSize: 15,
        fontWeight: 760,
        lineHeight: 1.25,
        opacity: enter,
        overflow: 'hidden',
        padding: 16,
        position: 'absolute',
        transform: `scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
        ...style,
      }}
    >
      <span style={{ background: PINK_DARK, color: '#ffffff', fontSize: 10, fontWeight: 850, padding: '5px 9px', position: 'absolute', right: 0, top: 0 }}>
        sensitive
      </span>
      {children}
    </div>
  )
}

function DriveCard({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ background: '#f4f7fb', border: '1px solid #e3e8ef', borderRadius: 7, display: 'grid', gap: 10, height: 158, padding: 14 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <Icon color={icon === 'simple-icons:googleslides' ? '#f6b500' : '#4285f4'} height={18} icon={icon} width={18} />
          <strong style={{ color: INK, fontSize: 13, fontWeight: 820 }}>{title}</strong>
        </div>
        <span style={{ color: MUTED, fontSize: 18, fontWeight: 900 }}>⋮</span>
      </div>
      <div style={{ background: '#ffffff', borderRadius: 4, display: 'grid', gap: 5, padding: 12 }}>
        {[0, 1, 2, 3].map((line) => <span key={line} style={{ background: line === 1 ? '#d9dde6' : '#eceff4', borderRadius: 999, height: line === 3 ? 7 : 5, width: `${78 - line * 12}%` }} />)}
      </div>
      <span style={{ color: MUTED, fontSize: 11, fontWeight: 650 }}>{subtitle}</span>
    </div>
  )
}

function DriveSearchScene({ frame }: { frame: number }) {
  const enter = fade(frame, 0, 100)
  const zoom = progress(frame, 40, 86)
  const selected = progress(frame, 18, 42)
  const cards = [
    ['simple-icons:googledocs', 'Compensation Review 2026', 'You edited · 20 May'],
    ['simple-icons:googledocs', 'Strategic Plan', 'You edited · 17 May'],
    ['simple-icons:googleslides', 'Merge Board Deck', 'Gil edited · 8:48 AM'],
    ['simple-icons:googledocs', 'Q4 Growth Targets', 'Gil edited · 15 May'],
    ['simple-icons:googledocs', 'Q2 Growth Targets', 'Gil edited · 03 May'],
    ['simple-icons:googledocs', 'Compensation Review 2026', 'Shensi edited · 05 May'],
  ]

  return (
    <div style={{ inset: 0, opacity: enter, position: 'absolute', transform: `scale(${1 + zoom * 0.58}) translate(${zoom * -115}px, ${zoom * -22}px)` }}>
      <div style={{ background: '#ffffff', border: '1px solid #d9dee8', borderRadius: 14, boxShadow: '0 22px 54px rgba(18,24,38,0.12)', height: 650, left: 134, overflow: 'hidden', position: 'absolute', top: 34, width: 1012 }}>
        <header style={{ alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e7ebf1', display: 'grid', gridTemplateColumns: '150px 1fr 210px', height: 70, padding: '0 20px' }}>
          <strong style={{ alignItems: 'center', color: INK, display: 'flex', fontSize: 21, gap: 8 }}>
            <Icon height={24} icon="simple-icons:googledrive" width={24} /> Drive
          </strong>
          <div style={{ background: '#eef2f7', borderRadius: 999, color: MUTED, fontSize: 14, fontWeight: 700, padding: '12px 18px' }}>board deck</div>
          <div style={{ color: MUTED, display: 'flex', gap: 18, justifyContent: 'end' }}>
            {['lucide:settings', 'lucide:sparkles', 'lucide:grid-3x3'].map((icon) => <Icon height={19} icon={icon} key={icon} width={19} />)}
          </div>
        </header>
        <aside style={{ background: '#f3f7fb', borderRight: '1px solid #e7ebf1', bottom: 0, left: 0, padding: 18, position: 'absolute', top: 70, width: 178 }}>
          {['Home', 'Activity', 'Projects', 'Workspaces', 'My Drive', 'Shared drives', 'Recent', 'Starred'].map((item, index) => (
            <div key={item} style={{ background: index === 0 ? '#cdeafe' : 'transparent', borderRadius: 999, color: INK, fontSize: 13, fontWeight: 720, marginBottom: 12, padding: '8px 12px' }}>{item}</div>
          ))}
        </aside>
        <main style={{ left: 202, position: 'absolute', right: 34, top: 102 }}>
          <h2 style={{ color: INK, fontSize: 21, fontWeight: 780, margin: '0 0 16px' }}>Search results</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {['Type', 'People', 'Modified', 'Source', 'Location', 'Title only', 'To do'].map((pill) => <span key={pill} style={{ border: '1px solid #d4d9e3', borderRadius: 999, color: INK, fontSize: 12, fontWeight: 720, padding: '7px 12px' }}>{pill}</span>)}
          </div>
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {cards.map(([icon, title, subtitle], index) => (
              <div key={`${title}-${index}`} style={{ outline: index === 2 ? `${selected * 5}px solid rgba(244,138,168,0.45)` : 'none', outlineOffset: 0 }}>
                <DriveCard icon={icon} subtitle={subtitle} title={title} />
              </div>
            ))}
          </div>
        </main>
      </div>
      <AgentPointer frame={frame} x={812} y={352} />
    </div>
  )
}

function StrategyScene({ frame }: { frame: number }) {
  const enter = fade(frame, 80, 176)
  const blurOut = progress(frame, 122, 160)

  return (
    <div style={{ background: '#ffffff', inset: 0, opacity: enter, position: 'absolute', transform: `scale(${1 + progress(frame, 118, 170) * 0.18})`, filter: `blur(${blurOut * 1.1}px)` }}>
      <h2 style={{ color: INK, fontSize: 58, fontWeight: 860, left: 110, letterSpacing: -1, margin: 0, position: 'absolute', top: 76 }}>Company strategy</h2>
      <span style={{ color: '#eef0f2', fontSize: 112, fontWeight: 900, left: 116, position: 'absolute', top: 218 }}>01</span>
      <span style={{ color: '#eef0f2', fontSize: 112, fontWeight: 900, left: 522, position: 'absolute', top: 336 }}>02</span>
      <span style={{ color: '#eef0f2', fontSize: 112, fontWeight: 900, left: 882, position: 'absolute', top: 438 }}>03</span>
      <PinkHighlight frame={frame} start={92} style={{ height: 96, left: 104, top: 256, width: 314 }}>
        FY26 strategic priorities, acquisition closing in Q3. NDA in place.
      </PinkHighlight>
      <PinkHighlight frame={frame} start={102} style={{ height: 98, left: 482, top: 366, width: 328 }}>
        H1 ARR landed at $94.6M, ahead of plan. Renewal risk flagged.
      </PinkHighlight>
      <PinkHighlight frame={frame} start={112} style={{ height: 75, left: 862, top: 488, width: 290 }}>
        Executive comp review and Q2 RIF affecting maintenance engineers.
      </PinkHighlight>
    </div>
  )
}

function RoadmapScene({ frame }: { frame: number }) {
  const enter = fade(frame, 150, 226)
  const scan = progress(frame, 164, 206)
  const quarters = [
    ['Q1 FY26', 'Agent Handler GA', 210],
    ['Q2 FY26', 'Gateway public beta', 500],
    ['Q3 FY26', 'Acquisition close', 790],
    ['Q4 FY26', 'EU expansion', 1080],
  ]

  return (
    <div style={{ background: '#ffffff', inset: 0, opacity: enter, position: 'absolute' }}>
      <h2 style={{ color: INK, fontSize: 55, fontWeight: 860, left: 166, margin: 0, position: 'absolute', top: 78 }}>Road map</h2>
      <div style={{ background: '#cfd3d7', height: 2, left: 166, position: 'absolute', top: 376, width: 956 }} />
      {quarters.map(([title, subtitle, x], index) => {
        const hot = index === 1 || index === 2
        return (
          <div key={title} style={{ left: Number(x) - 76, position: 'absolute', top: 326, width: 160 }}>
            <strong style={{ background: hot ? 'rgba(244,138,168,0.65)' : 'transparent', border: hot ? '2px solid rgba(233,84,126,0.48)' : 'none', borderRadius: 12, color: INK, fontSize: 25, fontWeight: 850, padding: hot ? '11px 14px' : 0 }}>{title}</strong>
            <span style={{ background: '#f97316', borderRadius: 999, display: 'block', height: 13, margin: '28px auto 20px', width: 13 }} />
            <span style={{ color: MUTED, display: 'block', fontSize: 17, fontWeight: 690, textAlign: 'center' }}>{subtitle}</span>
          </div>
        )
      })}
      <span style={{ background: `linear-gradient(90deg, transparent, ${PINK_DARK}, transparent)`, height: 5, left: interpolate(scan, [0, 1], [120, 1100]), opacity: 0.62, position: 'absolute', top: 322, width: 180 }} />
    </div>
  )
}

function FinancialsScene({ frame }: { frame: number }) {
  const enter = fade(frame, 206, 282)
  const zoom = progress(frame, 238, 274)
  const rows = ['$342,000', '$238,000', '$295,000', '$288,000', '$192,000', '$291,000', '$218,000', '$235,000', '$212,000', '$148,000', '$168,000', '$162,000']

  return (
    <div style={{ background: '#ffffff', inset: 0, opacity: enter, position: 'absolute', transform: `scale(${1 + zoom * 0.28}) translate(${zoom * -40}px, ${zoom * -16}px)`, filter: `blur(${progress(frame, 256, 282) * 1.1}px)` }}>
      <h2 style={{ color: INK, fontSize: 48, fontWeight: 860, left: 328, margin: 0, position: 'absolute', top: 84 }}>Financials</h2>
      <div style={{ display: 'grid', gap: 15, left: 468, position: 'absolute', top: 164, width: 380 }}>
        {rows.map((row, index) => <span key={`${row}-${index}`} style={{ borderBottom: '1px solid #eceff2', color: index === 5 ? INK : '#7f8588', fontSize: 20, fontWeight: 760, paddingBottom: 8 }}>{row}</span>)}
      </div>
      <PinkHighlight frame={frame} start={214} style={{ height: 58, left: 310, top: 148, width: 170 }}>
        95,367,023.23
      </PinkHighlight>
      <PinkHighlight frame={frame} start={224} style={{ height: 62, left: 442, top: 390, width: 390 }}>
        $291,000
      </PinkHighlight>
      <PinkHighlight frame={frame} start={236} style={{ height: 72, left: 230, top: 474, width: 360 }}>
        Director, Marketing
      </PinkHighlight>
      <span style={{ bottom: 108, color: '#71736f', fontSize: 19, fontWeight: 900, left: 90, position: 'absolute' }}>MERGE</span>
    </div>
  )
}

function CrmScene({ frame }: { frame: number }) {
  const enter = fade(frame, 272, OTTO_AGENT_SCAN_DURATION)
  const tilt = interpolate(progress(frame, 272, 306), [0, 1], [-6, 0])
  const rows = ['Northstar Health Group', 'Atlas Commerce Inc.', 'Redwood Financial Partners', 'Brightline Energy Ltd.', 'Willow Systems', 'Silverline Logistics', 'Summit Retail Co.', 'Blue Peak Media', 'Horizon Foods Group', 'Keystone Property Co.', 'Evergreen Tech Solutions', 'Oakridge Consulting']

  return (
    <div style={{ background: '#ffffff', inset: 0, opacity: enter, position: 'absolute' }}>
      <div style={{ border: '8px solid rgba(63,142,232,0.42)', height: 570, left: 68, overflow: 'hidden', position: 'absolute', top: 76, transform: `perspective(900px) rotateZ(${tilt}deg) rotateX(4deg)`, width: 1140 }}>
        <header style={{ alignItems: 'center', background: '#f8fbff', borderBottom: '1px solid #d9e3f3', display: 'flex', height: 66, justifyContent: 'space-between', padding: '0 24px' }}>
          <strong style={{ alignItems: 'center', color: '#1f4f87', display: 'flex', fontSize: 20, gap: 10 }}>
            <Icon color="#2f7ac8" height={24} icon="simple-icons:salesforce" width={24} /> Sales
          </strong>
          <span style={{ color: MUTED, fontSize: 14, fontWeight: 760 }}>All Accounts · Updated 4 minutes ago</span>
        </header>
        <div style={{ display: 'grid', gridTemplateColumns: '50px 285px 190px 260px 210px 1fr', padding: '18px 22px 0' }}>
          {['', 'Account Name', 'Primary Contact', 'Billing Address', 'Email', 'Payment Details'].map((head) => <strong key={head} style={{ borderBottom: '1px solid #dfe6f0', color: INK, fontSize: 15, paddingBottom: 12 }}>{head}</strong>)}
          {rows.map((name, index) => (
            <div key={name} style={{ display: 'contents' }}>
              <span style={{ borderBottom: '1px solid #edf1f5', color: MUTED, fontSize: 15, padding: '10px 0' }}>{index + 1}</span>
              <span style={{ borderBottom: '1px solid #edf1f5', color: '#2e5f8a', fontSize: 16, fontWeight: 720, padding: '10px 0' }}>{name}</span>
              <span style={{ borderBottom: '1px solid #edf1f5', color: INK, fontSize: 14, padding: '10px 0' }}>{['Sarah Johnson', 'Michael Chen', 'Emily Carter', 'David Wilson'][index % 4]}</span>
              <span style={{ borderBottom: '1px solid #edf1f5', color: INK, fontSize: 14, padding: '10px 0' }}>{['125 Market St', '88 Madison Ave', '410 Pine St', '22 Main Rd'][index % 4]}</span>
              <span style={{ borderBottom: '1px solid #edf1f5', color: INK, fontSize: 14, padding: '10px 0' }}>contact@company.com</span>
              <span style={{ borderBottom: '1px solid #edf1f5', color: INK, fontSize: 14, padding: '10px 0' }}>Visa **** {4422 + index}</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(239,77,93,0.22)', border: '4px solid #e32f3f', height: 92, left: 0, position: 'absolute', top: 302, width: '100%' }} />
        <span style={{ background: '#e32f3f', color: '#ffffff', fontSize: 12, fontWeight: 900, left: 0, padding: '10px 11px', position: 'absolute', top: 302 }}>RISK</span>
      </div>
    </div>
  )
}

export function OttoAgentScan() {
  const frame = useCurrentFrame()
  const caption = frame < 54
    ? 'encontra um board deck no Google Drive'
    : frame < 126
      ? 'escaneia estrategia da empresa'
      : frame < 206
        ? 'marca metas e roadmap sensiveis'
        : frame < 284
          ? 'identifica financeiros e salarios'
          : 'encontra dados ainda mais sensiveis'

  return (
    <AbsoluteFill style={{ background: '#eef2eb', color: INK, fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <DriveSearchScene frame={frame} />
      <StrategyScene frame={frame} />
      <RoadmapScene frame={frame} />
      <FinancialsScene frame={frame} />
      <CrmScene frame={frame} />
      <Caption>{caption}</Caption>
    </AbsoluteFill>
  )
}
