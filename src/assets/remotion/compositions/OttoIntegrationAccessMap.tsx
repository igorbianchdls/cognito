import { Icon } from '@iconify/react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

export const OTTO_INTEGRATION_ACCESS_MAP_DURATION = 95

const INK = '#262522'
const MUTED = '#6d706b'
const GREEN = '#0e8f72'
const ORANGE = '#e88b37'
const RED = '#ef4d5d'

const allowedApps = [
  { icon: 'simple-icons:slack', label: 'Slack' },
  { icon: 'simple-icons:notion', label: 'Notion' },
  { icon: 'simple-icons:discord', label: 'Discord' },
  { icon: 'simple-icons:hubspot', label: 'HubSpot' },
  { icon: 'simple-icons:dropbox', label: 'Dropbox' },
  { icon: 'simple-icons:bamboo', label: 'BambooHR' },
  { icon: 'simple-icons:salesforce', label: 'Salesforce' },
  { icon: 'simple-icons:googledrive', label: 'Google Drive' },
]

const blockedApps = [
  { label: 'No permission', y: 64 },
  { label: 'No permission', y: 116 },
  { label: 'No permission', y: 544 },
  { label: 'No permission', y: 596 },
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
    <svg aria-hidden="true" height={size} viewBox="0 0 116 104" width={size * 1.12}>
      <path d="M23 13 C39 33 61 43 92 44" fill="none" stroke={color} strokeLinecap="square" strokeWidth="20" />
      <path d="M23 91 C39 71 61 61 92 60" fill="none" stroke={color} strokeLinecap="square" strokeWidth="20" />
    </svg>
  )
}

function AppRow({ icon, index, label }: { icon: string; index: number; label: string }) {
  const frame = useCurrentFrame()
  const enter = progress(frame, 2 + index * 4, 22 + index * 4)
  const y = 122 + index * 54

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 19,
        left: 82,
        opacity: enter,
        position: 'absolute',
        top: y,
        transform: `translateX(${(1 - enter) * -24}px)`,
      }}
    >
      <span style={{ alignItems: 'center', background: '#ffffff', borderRadius: 8, boxShadow: '0 8px 24px rgba(20,24,22,0.05)', color: INK, display: 'flex', height: 26, justifyContent: 'center', width: 26 }}>
        <Icon height={14} icon={icon} width={14} />
      </span>
      <span style={{ color: INK, fontSize: 15, fontWeight: 720, letterSpacing: 0 }}>{label}</span>
    </div>
  )
}

function BlockedRow({ index, label, y }: { index: number; label: string; y: number }) {
  const frame = useCurrentFrame()
  const enter = progress(frame, 50 + index * 6, 70 + index * 6)

  return (
    <div
      style={{
        alignItems: 'center',
        color: RED,
        display: 'flex',
        gap: 12,
        left: 80,
        opacity: enter,
        position: 'absolute',
        top: y,
        transform: `translateX(${(1 - enter) * -18}px)`,
      }}
    >
      <span style={{ alignItems: 'center', background: RED, borderRadius: 7, boxShadow: '0 0 34px rgba(239,77,93,0.42)', color: '#ffffff', display: 'flex', height: 32, justifyContent: 'center', position: 'relative', width: 32 }}>
        <span style={{ border: '2px solid #ffffff', borderBottom: 0, borderRadius: '9px 9px 0 0', height: 10, left: 10, position: 'absolute', top: 7, width: 12 }} />
        <span style={{ background: '#ffffff', borderRadius: 2, height: 11, left: 9, position: 'absolute', top: 16, width: 14 }} />
      </span>
      <span style={{ fontSize: 13, fontWeight: 850 }}>{label}</span>
    </div>
  )
}

function AccessCard() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 20, 44)
  const apps = allowedApps.slice(0, 6)

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #dddeda',
        borderRadius: 14,
        boxShadow: '0 22px 54px rgba(20,24,22,0.12)',
        height: 342,
        opacity: enter,
        overflow: 'hidden',
        position: 'absolute',
        right: 116,
        top: 198,
        transform: `translateX(${(1 - enter) * 46}px)`,
        width: 308,
      }}
    >
      <header style={{ alignItems: 'center', background: '#f8f8f7', display: 'flex', gap: 14, height: 78, padding: '0 18px' }}>
        <div style={{ background: 'linear-gradient(135deg, #2c2c2c, #6d6a61)', borderRadius: 999, height: 45, overflow: 'hidden', position: 'relative', width: 45 }}>
          <span style={{ background: '#d9b99a', borderRadius: 999, height: 16, left: 15, position: 'absolute', top: 9, width: 16 }} />
          <span style={{ background: '#475240', borderRadius: '50% 50% 0 0', bottom: 4, height: 20, left: 8, position: 'absolute', width: 29 }} />
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          <strong style={{ color: INK, fontSize: 18, fontWeight: 880 }}>Jeanelle</strong>
          <span style={{ color: MUTED, fontSize: 13, fontWeight: 680 }}>Marketing specialist</span>
        </div>
      </header>
      <div style={{ display: 'grid' }}>
        {apps.map((app, index) => {
          const row = progress(frame, 28 + index * 5, 48 + index * 5)
          return (
            <div key={app.label} style={{ alignItems: 'center', borderTop: '1px solid #ededeb', display: 'grid', gridTemplateColumns: '30px 1fr 90px', height: 43, opacity: row, padding: '0 12px', transform: `translateY(${(1 - row) * 8}px)` }}>
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

function NetworkLines() {
  const frame = useCurrentFrame()
  const draw = progress(frame, 0, 44)
  const blocked = progress(frame, 52, 82)
  const centerX = 640
  const centerY = 360

  return (
    <svg height="720" style={{ inset: 0, position: 'absolute' }} viewBox="0 0 1280 720" width="1280">
      {allowedApps.map((app, index) => {
        const y = 135 + index * 54
        const dash = 520 - draw * 520
        const particle = (frame * 4 + index * 72) % 360
        const dotX = interpolate(particle, [0, 360], [258, centerX - 58])
        const dotY = interpolate(particle, [0, 360], [y, centerY + (y - centerY) * 0.12])
        return (
          <g key={app.label}>
            <path d={`M260 ${y} C404 ${y} 430 ${centerY} ${centerX - 63} ${centerY}`} fill="none" opacity="0.72" stroke="#5b5c58" strokeDasharray="3 7" strokeDashoffset={dash} strokeLinecap="round" strokeWidth="1.5" />
            <circle cx={dotX} cy={dotY} fill={ORANGE} opacity={draw} r={3.2} />
          </g>
        )
      })}
      {blockedApps.map((app, index) => {
        const y = app.y + 14
        const dash = 520 - blocked * 520
        return (
          <g key={`${app.label}-${index}`} opacity={blocked}>
            <path d={`M258 ${y} C430 ${y} 432 ${centerY} ${centerX - 68} ${centerY}`} fill="none" stroke={RED} strokeDasharray="3 7" strokeDashoffset={dash} strokeLinecap="round" strokeWidth="1.6" />
            <path d={`M430 ${y - 11} L446 ${y + 5} M446 ${y - 11} L430 ${y + 5}`} fill="none" opacity={progress(frame, 66 + index * 4, 76 + index * 4)} stroke={RED} strokeLinecap="round" strokeWidth="2" />
          </g>
        )
      })}
      {[0, 1].map((line) => {
        const y = centerY - 10 + line * 20
        const pulse = (frame * 5 + line * 92) % 360
        return (
          <g key={line}>
            <path d={`M${centerX + 58} ${y} C760 ${y} 812 ${y} 856 ${y}`} fill="none" stroke="#40403c" strokeLinecap="round" strokeWidth="1.5" />
            <circle cx={interpolate(pulse, [0, 360], [centerX + 58, 856])} cy={y} fill={line ? '#cf6d35' : ORANGE} r={3.2} />
          </g>
        )
      })}
    </svg>
  )
}

export function OttoIntegrationAccessMap() {
  const frame = useCurrentFrame()
  const center = progress(frame, 0, 24)
  const captionPhase = frame < 35 ? 'Otto recebe acesso aos apps certos' : frame < 66 ? 'conecta tudo que precisa' : 'sem abrir permissoes perigosas'

  return (
    <AbsoluteFill style={{ background: '#f7f7f2', color: INK, fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 52%, rgba(34,34,31,0.06), rgba(247,247,242,0) 42%)', inset: -120, position: 'absolute' }} />
      <NetworkLines />
      {blockedApps.map((app, index) => <BlockedRow index={index} key={`${app.label}-${index}`} label={app.label} y={app.y} />)}
      {allowedApps.map((app, index) => <AppRow icon={app.icon} index={index} key={app.label} label={app.label} />)}

      <div
        style={{
          alignItems: 'center',
          background: '#242421',
          borderRadius: 58,
          boxShadow: '0 24px 54px rgba(20,24,22,0.24)',
          display: 'flex',
          height: 145,
          justifyContent: 'center',
          left: 574,
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

      <div
        style={{
          background: 'rgba(54,54,54,0.88)',
          borderRadius: 7,
          bottom: 34,
          color: '#ffffff',
          fontSize: 25,
          fontWeight: 760,
          left: '50%',
          letterSpacing: 0,
          lineHeight: 1,
          padding: '13px 18px 14px',
          position: 'absolute',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {captionPhase}
      </div>
    </AbsoluteFill>
  )
}
