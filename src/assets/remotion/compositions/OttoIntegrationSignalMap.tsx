import { Icon } from '@iconify/react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

export const OTTO_INTEGRATION_SIGNAL_MAP_DURATION = 120

const INK = '#242421'
const MUTED = '#6d706b'
const GREEN = '#0e8f72'
const ORANGE = '#e88b37'
const RED = '#ef4d5d'

const apps = [
  { icon: 'simple-icons:slack', label: 'Slack' },
  { icon: 'simple-icons:notion', label: 'Notion' },
  { icon: 'simple-icons:discord', label: 'Discord' },
  { icon: 'simple-icons:hubspot', label: 'HubSpot' },
  { icon: 'simple-icons:dropbox', label: 'Dropbox' },
  { icon: 'simple-icons:bamboo', label: 'BambooHR' },
  { icon: 'simple-icons:salesforce', label: 'Salesforce' },
  { icon: 'simple-icons:googledrive', label: 'Google Drive' },
]

const grantedApps = apps.slice(0, 6)
const blockedRows = [
  { label: 'No permission', y: 74 },
  { label: 'No permission', y: 112 },
  { label: 'No permission', y: 584 },
  { label: 'No permission', y: 622 },
]

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function OttoGlyph({ color = '#ffffff', size = 44 }: { color?: string; size?: number }) {
  return (
    <Img
      src={staticFile('logoOtto.svg')}
      style={{ display: 'block', filter: color === '#ffffff' ? 'brightness(0) invert(1)' : undefined, height: size, objectFit: 'contain', width: size * 2.33 }}
    />
  )
}

function AppRow({ icon, index, label }: { icon: string; index: number; label: string }) {
  const frame = useCurrentFrame()
  const enter = progress(frame, 2 + index * 4, 20 + index * 4)
  const y = 146 + index * 54

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 18,
        left: 86,
        opacity: enter,
        position: 'absolute',
        top: y,
        transform: `translateX(${(1 - enter) * -22}px)`,
      }}
    >
      <span style={{ alignItems: 'center', background: '#ffffff', borderRadius: 8, boxShadow: '0 8px 24px rgba(20,24,22,0.05)', color: INK, display: 'flex', height: 25, justifyContent: 'center', width: 25 }}>
        <Icon height={14} icon={icon} width={14} />
      </span>
      <span style={{ color: INK, fontSize: 14, fontWeight: 720, letterSpacing: 0 }}>{label}</span>
    </div>
  )
}

function BlockedRow({ index, label, y }: { index: number; label: string; y: number }) {
  const frame = useCurrentFrame()
  const enter = progress(frame, 60 + index * 5, 78 + index * 5)

  return (
    <div
      style={{
        alignItems: 'center',
        color: RED,
        display: 'flex',
        filter: 'drop-shadow(0 0 20px rgba(239,77,93,0.32))',
        gap: 10,
        left: 86,
        opacity: enter,
        position: 'absolute',
        top: y,
        transform: `translateX(${(1 - enter) * -18}px)`,
      }}
    >
      <span style={{ alignItems: 'center', background: RED, borderRadius: 7, color: '#ffffff', display: 'flex', height: 32, justifyContent: 'center', position: 'relative', width: 32 }}>
        <span style={{ border: '2px solid #ffffff', borderBottom: 0, borderRadius: '8px 8px 0 0', height: 10, left: 10, position: 'absolute', top: 7, width: 12 }} />
        <span style={{ background: '#ffffff', borderRadius: 2, height: 11, left: 9, position: 'absolute', top: 16, width: 14 }} />
      </span>
      <span style={{ fontSize: 12, fontWeight: 850 }}>{label}</span>
    </div>
  )
}

function AccessCard() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 28, 48)

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #dddeda',
        borderRadius: 14,
        boxShadow: '0 22px 54px rgba(20,24,22,0.12)',
        height: 346,
        opacity: enter,
        overflow: 'hidden',
        position: 'absolute',
        right: 118,
        top: 210,
        transform: `translateX(${(1 - enter) * 44}px)`,
        width: 320,
      }}
    >
      <header style={{ alignItems: 'center', background: '#f8f8f7', display: 'flex', gap: 14, height: 82, padding: '0 18px' }}>
        <div style={{ background: 'linear-gradient(135deg, #2c2c2c, #6d6a61)', borderRadius: 999, height: 46, overflow: 'hidden', position: 'relative', width: 46 }}>
          <span style={{ background: '#d9b99a', borderRadius: 999, height: 16, left: 15, position: 'absolute', top: 9, width: 16 }} />
          <span style={{ background: '#475240', borderRadius: '50% 50% 0 0', bottom: 4, height: 20, left: 8, position: 'absolute', width: 30 }} />
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <strong style={{ color: INK, fontSize: 18, fontWeight: 880 }}>Jeanelle</strong>
          <span style={{ color: MUTED, fontSize: 13, fontWeight: 680 }}>Marketing specialist</span>
        </div>
      </header>
      <div style={{ display: 'grid' }}>
        {grantedApps.map((app, index) => {
          const row = progress(frame, 34 + index * 5, 52 + index * 5)
          return (
            <div key={app.label} style={{ alignItems: 'center', borderTop: '1px solid #ededeb', display: 'grid', gridTemplateColumns: '30px 1fr 94px', height: 44, opacity: row, padding: '0 12px', transform: `translateY(${(1 - row) * 8}px)` }}>
              <Icon height={17} icon={app.icon} width={17} />
              <span style={{ color: INK, fontSize: 12, fontWeight: 760 }}>{app.label}</span>
              <span style={{ background: GREEN, borderRadius: 5, color: '#ffffff', fontSize: 10, fontWeight: 850, padding: '7px 8px', textAlign: 'center' }}>Access granted</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SignalLines() {
  const frame = useCurrentFrame()
  const draw = progress(frame, 0, 48)
  const blocked = progress(frame, 60, 92)
  const centerX = 640
  const centerY = 360

  return (
    <svg height="720" style={{ inset: 0, position: 'absolute' }} viewBox="0 0 1280 720" width="1280">
      {apps.map((app, index) => {
        const y = 158 + index * 54
        const dash = 580 - draw * 580
        const particle = (frame * 4 + index * 64) % 360
        const dotX = interpolate(particle, [0, 360], [265, centerX - 56])
        const dotY = interpolate(particle, [0, 360], [y, centerY + (y - centerY) * 0.12])
        return (
          <g key={app.label}>
            <path d={`M266 ${y} C404 ${y} 440 ${centerY} ${centerX - 64} ${centerY}`} fill="none" opacity="0.72" stroke="#5b5c58" strokeDasharray="3 7" strokeDashoffset={dash} strokeLinecap="round" strokeWidth="1.5" />
            <circle cx={dotX} cy={dotY} fill={ORANGE} opacity={draw} r={3.1} />
          </g>
        )
      })}
      {blockedRows.map((row, index) => {
        const y = row.y + 16
        const dash = 620 - blocked * 620
        return (
          <g key={`${row.label}-${index}`} opacity={blocked}>
            <path d={`M266 ${y} C430 ${y} 436 ${centerY} ${centerX - 68} ${centerY}`} fill="none" stroke={RED} strokeDasharray="3 7" strokeDashoffset={dash} strokeLinecap="round" strokeWidth="1.6" />
            <path d={`M428 ${y - 10} L444 ${y + 6} M444 ${y - 10} L428 ${y + 6}`} fill="none" opacity={progress(frame, 74 + index * 4, 84 + index * 4)} stroke={RED} strokeLinecap="round" strokeWidth="2" />
          </g>
        )
      })}
      {[0, 1].map((line) => {
        const y = centerY - 10 + line * 20
        const pulse = (frame * 5 + line * 92) % 360
        return (
          <g key={line}>
            <path d={`M${centerX + 58} ${y} C760 ${y} 816 ${y} 852 ${y}`} fill="none" stroke="#40403c" strokeLinecap="round" strokeWidth="1.5" />
            <circle cx={interpolate(pulse, [0, 360], [centerX + 58, 852])} cy={y} fill={line ? '#cf6d35' : ORANGE} r={3.2} />
          </g>
        )
      })}
    </svg>
  )
}

function Caption() {
  const frame = useCurrentFrame()
  const text = frame < 34
    ? "da acesso ao agente da Jeanelle"
    : frame < 68
      ? 'a tudo que ele precisa'
      : frame < 96
        ? 'sem abrir permissoes extras'
        : 'nem acessos perigosos'

  return (
    <div style={{ background: 'rgba(54,54,54,0.88)', borderRadius: 7, bottom: 34, color: '#ffffff', fontSize: 25, fontWeight: 760, left: '50%', lineHeight: 1, padding: '13px 18px 14px', position: 'absolute', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
      {text}
    </div>
  )
}

export function OttoIntegrationSignalMap() {
  const frame = useCurrentFrame()
  const center = progress(frame, 0, 24)

  return (
    <AbsoluteFill style={{ background: '#f7f7f2', color: INK, fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 52%, rgba(34,34,31,0.06), rgba(247,247,242,0) 42%)', inset: -120, position: 'absolute' }} />
      <SignalLines />
      {blockedRows.map((row, index) => <BlockedRow index={index} key={`${row.label}-${index}`} label={row.label} y={row.y} />)}
      {apps.map((app, index) => <AppRow icon={app.icon} index={index} key={app.label} label={app.label} />)}
      <div
        style={{
          alignItems: 'center',
          background: '#242421',
          borderRadius: 58,
          boxShadow: '0 24px 54px rgba(20,24,22,0.24)',
          display: 'flex',
          height: 145,
          justifyContent: 'center',
          left: 584,
          opacity: center,
          position: 'absolute',
          top: 286,
          transform: `scale(${interpolate(center, [0, 1], [0.82, 1])})`,
          width: 112,
        }}
      >
        <OttoGlyph />
      </div>
      <AccessCard />
      <Caption />
    </AbsoluteFill>
  )
}
