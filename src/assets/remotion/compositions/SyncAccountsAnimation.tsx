import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const SYNC_ACCOUNTS_ANIMATION_DURATION = 132

const FONT = IOS_REMOTION_FONT_STACK

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

const institutions = [
  { accounts: '1 account', color: '#1174c8', initials: 'AE', name: 'American Express', syncedAt: 78 },
  { accounts: '2 accounts', color: '#ffffff', accent: '#d51f2a', initials: 'BO', name: 'Bank of America', syncedAt: 88 },
  { accounts: '1 account', color: '#2bb6d7', initials: 'CS', name: 'Charles Schwab', syncedAt: 96 },
  { accounts: '1 account', color: '#ecf6ff', accent: '#6c40c8', initials: 'ET', name: 'Etrade', syncedAt: 104 },
  { accounts: '1 account', color: '#111111', initials: 'FI', name: 'Fidelity', syncedAt: 112 },
  { accounts: '1 account', color: '#c9ff1a', initials: 'RH', name: 'Robinhood', syncedAt: 120 },
]

function PlaidMark() {
  return (
    <div style={{ alignItems: 'center', background: '#111111', borderRadius: 5, display: 'grid', gap: 2, gridTemplateColumns: 'repeat(3, 3px)', height: 21, justifyContent: 'center', width: 21 }}>
      {Array.from({ length: 9 }).map((_, index) => (
        <span key={index} style={{ background: index === 4 ? '#ffffff' : 'rgba(255,255,255,0.72)', borderRadius: 999, height: 3, width: 3 }} />
      ))}
    </div>
  )
}

function Spinner({ active }: { active: boolean }) {
  const frame = useCurrentFrame()
  if (!active) {
    return <span style={{ background: '#12b76a', borderRadius: 999, display: 'block', height: 8, width: 8 }} />
  }

  return (
    <span
      style={{
        border: '2px solid #d7d7d7',
        borderRightColor: '#111111',
        borderRadius: 999,
        display: 'block',
        height: 17,
        transform: `rotate(${frame * 22}deg)`,
        width: 17,
      }}
    />
  )
}

function InstitutionLogo({ accent, color, initials, index }: { accent?: string; color: string; initials: string; index: number }) {
  if (index === 1) {
    return (
      <div style={{ height: 24, position: 'relative', width: 24 }}>
        {[0, 1, 2].map((item) => (
          <span key={item} style={{ background: '#1e40af', borderRadius: 2, height: 4, left: 2 + item * 3, position: 'absolute', top: 8 + item * 3, transform: 'rotate(-28deg)', width: 18 }} />
        ))}
        {[0, 1, 2].map((item) => (
          <span key={item} style={{ background: accent, borderRadius: 2, height: 4, left: 7 + item * 3, position: 'absolute', top: 5 + item * 3, transform: 'rotate(-28deg)', width: 18 }} />
        ))}
      </div>
    )
  }

  if (index === 3) {
    return (
      <div style={{ height: 24, position: 'relative', width: 24 }}>
        {[0, 45, 90, 135].map((rotation) => (
          <span key={rotation} style={{ background: rotation < 90 ? '#7c3aed' : '#a3e635', borderRadius: 999, height: 8, left: 8, position: 'absolute', top: 0, transform: `rotate(${rotation}deg) translateY(8px)`, transformOrigin: '4px 12px', width: 8 }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ alignItems: 'center', background: color, border: color === '#ffffff' ? '1px solid #e5e7eb' : 'none', borderRadius: index === 4 ? 999 : 5, color: index === 4 ? '#ffffff' : '#ffffff', display: 'flex', fontSize: 7, fontWeight: 850, height: 24, justifyContent: 'center', letterSpacing: -0.1, width: 24 }}>
      {initials}
    </div>
  )
}

function SyncRow({ index }: { index: number }) {
  const frame = useCurrentFrame()
  const item = institutions[index]
  const rowIn = p(frame, 28 + index * 8, 44 + index * 8)
  const synced = frame >= item.syncedAt

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'grid',
        gap: 12,
        gridTemplateColumns: '30px 1fr auto 18px',
        height: 48,
        opacity: rowIn,
        padding: '0 20px',
        transform: `translateY(${(1 - rowIn) * 16}px)`,
      }}
    >
      <InstitutionLogo accent={item.accent} color={item.color} index={index} initials={item.initials} />
      <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
        <strong style={{ color: '#111111', fontSize: 15, fontWeight: 560, letterSpacing: 0, lineHeight: 1 }}>{item.name}</strong>
        <span style={{ color: '#8a8a8a', fontSize: 11, fontWeight: 420, letterSpacing: 0, lineHeight: 1 }}>{item.accounts}</span>
      </div>
      <span style={{ color: '#111111', fontSize: 15, fontWeight: 470, letterSpacing: 0, lineHeight: 1 }}>{synced ? 'Synced' : 'Syncing'}</span>
      <Spinner active={!synced} />
    </div>
  )
}

export function SyncAccountsAnimation() {
  const frame = useCurrentFrame()
  const titleIn = p(frame, 0, 10)
  const titleOut = p(frame, 20, 38, [1, 0])
  const headerIn = p(frame, 34, 54)
  const cardIn = p(frame, 42, 62)
  const fullList = p(frame, 64, 88)
  const cardHeight = interpolate(fullList, [0, 1], [70, 304], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#111111', fontFamily: FONT, overflow: 'hidden' }}>

      <h1
        style={{
          color: '#050505',
          fontSize: 58,
          fontWeight: 760,
          left: 0,
          letterSpacing: -0.2,
          lineHeight: 1,
          margin: 0,
          opacity: titleIn * titleOut,
          position: 'absolute',
          right: 0,
          textAlign: 'center',
          top: 824,
          transform: `translateY(${(1 - titleIn) * 16 - (1 - titleOut) * 18}px)`,
        }}
      >
        Securely connect your accounts
      </h1>

      <div style={{ left: '50%', opacity: headerIn, position: 'absolute', top: 760, transform: `translateX(-50%) translateY(${(1 - headerIn) * 14}px)`, width: 520 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 9, marginBottom: 13, paddingLeft: 30 }}>
          <PlaidMark />
          <span style={{ color: '#8a8a8a', fontSize: 15, fontWeight: 430, letterSpacing: 0 }}>Connecting with Plaid</span>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 28,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.07)',
            height: cardHeight,
            opacity: cardIn,
            overflow: 'hidden',
            padding: '10px 0',
            transform: `scale(${0.97 + cardIn * 0.03})`,
          }}
        >
          {institutions.map((_, index) => <SyncRow key={index} index={index} />)}
        </div>
      </div>
    </AbsoluteFill>
  )
}
