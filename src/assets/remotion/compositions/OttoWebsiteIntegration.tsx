import { Icon } from '@iconify/react'
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

export const OTTO_WEBSITE_INTEGRATION_DURATION = 340

const INK = '#242424'
const MUTED = '#77746e'
const LINE = '#ece9e2'
const GREEN = '#14916f'
const CYAN = '#35bfe3'

const connectors = [
  { icon: 'simple-icons:calendly', label: 'Calendly' },
  { icon: 'simple-icons:figma', label: 'Figma' },
  { icon: 'simple-icons:fireflyiii', label: 'Fireflies.ai' },
  { icon: '', label: 'Frame.io' },
  { icon: 'simple-icons:googledrive', label: 'Google Drive' },
  { icon: 'simple-icons:wordpress', label: 'WordPress' },
  { icon: 'simple-icons:salesforce', label: 'Salesforce' },
  { icon: 'simple-icons:slack', label: 'Slack' },
  { icon: 'simple-icons:notion', label: 'Notion' },
]

const sidebarApps = [
  'Google Drive',
  'Figma',
  'WordPress',
  'Salesforce',
  'Slack',
  'Sanity',
  'SendGrid',
  'SharePoint',
]

const toolRows = [
  { label: 'list_channels', muted: 'List all channels in a workspace.', selectedAt: 216 },
  { label: 'get_channel', muted: 'Get a single channel by ID with details.', selectedAt: 222 },
  { label: 'create_channel', muted: 'Create a new channel inside any workspace.', selectedAt: 226 },
  { label: 'get_user_information', muted: 'Get a user profile with status and roles.', selectedAt: 232 },
  { label: 'send_message_to_channel', muted: 'Send a message to a channel.', selectedAt: 366 },
  { label: 'read_messages', muted: 'Read messages from a channel or thread.', selectedAt: 246 },
]

const salesforceRows = [
  { label: 'list_accounts', muted: 'List all customer accounts.', checked: false },
  { label: 'create_account', muted: 'Create a new account in the customer database.', checked: true },
  { label: 'list_top_opportunities', muted: 'List top opportunities by stage.', checked: true },
  { label: 'view_contracts', muted: 'Block contracts with pagination and filters.', checked: false },
  { label: 'get_open_opportunity', muted: 'Get open opportunity details.', checked: true },
  { label: 'update_opportunity_data', muted: 'Update an opportunity record.', checked: false },
]

function clampProgress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function frameBetween(frame: number, start: number, end: number) {
  return frame >= start && frame < end
}

function OttoGlyph({ color = '#ffffff', size = 34 }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 116 104" width={size * 1.12}>
      <path d="M23 13 C39 33 61 43 92 44" fill="none" stroke={color} strokeLinecap="square" strokeWidth="20" />
      <path d="M23 91 C39 71 61 61 92 60" fill="none" stroke={color} strokeLinecap="square" strokeWidth="20" />
    </svg>
  )
}

function Cursor({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.2))',
        height: 72,
        position: 'absolute',
        width: 72,
        ...style,
      }}
    >
      <svg height="72" viewBox="0 0 84 84" width="72">
        <path d="M16 9 L73 33 L48 42 L37 70 Z" fill="#262626" stroke="#ffffff" strokeLinejoin="round" strokeWidth="3" />
      </svg>
    </div>
  )
}

function OttoBadge({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#262626',
        border: '2px solid rgba(255,255,255,0.92)',
        borderRadius: 18,
        boxShadow: '0 18px 44px rgba(25,25,25,0.22)',
        color: '#fff',
        display: 'flex',
        gap: 14,
        height: 68,
        padding: '0 24px 0 18px',
        position: 'absolute',
        ...style,
      }}
    >
      <OttoGlyph size={34} />
      <span style={{ fontSize: 31, fontWeight: 720, letterSpacing: 4 }}>OTTO</span>
    </div>
  )
}

function Caption({ text }: { text: string }) {
  return (
    <div
      style={{
        background: 'rgba(32,32,32,0.86)',
        borderRadius: 8,
        bottom: 35,
        color: '#ffffff',
        fontSize: 26,
        fontWeight: 650,
        left: '50%',
        letterSpacing: 0,
        lineHeight: 1.1,
        padding: '10px 18px 12px',
        position: 'absolute',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  )
}

function BrowserShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${LINE}`,
        borderRadius: 18,
        boxShadow: '0 32px 90px rgba(41,39,34,0.13)',
        height: 548,
        overflow: 'hidden',
        position: 'absolute',
        width: 1040,
      }}
    >
      <div style={{ alignItems: 'center', borderBottom: `1px solid ${LINE}`, display: 'flex', height: 50, padding: '0 22px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['#f2a19a', '#efcc66', '#7ccf93'].map((color) => (
            <span key={color} style={{ background: color, borderRadius: 99, height: 10, width: 10 }} />
          ))}
        </div>
        <div style={{ color: MUTED, flex: 1, fontSize: 13, fontWeight: 650, textAlign: 'center' }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

function Sidebar({ active }: { active: string }) {
  return (
    <div style={{ background: '#faf9f6', borderRight: `1px solid ${LINE}`, height: '100%', left: 0, padding: '24px 14px', position: 'absolute', top: 50, width: 188 }}>
      <div style={{ color: INK, fontSize: 18, fontWeight: 760, marginBottom: 26 }}>Connectors</div>
      {['All', 'Communication', 'CRM', 'Files', 'Design'].map((item) => (
        <div
          key={item}
          style={{
            background: item === active ? '#efede7' : 'transparent',
            borderRadius: 10,
            color: item === active ? INK : MUTED,
            fontSize: 14,
            fontWeight: 680,
            marginBottom: 8,
            padding: '10px 12px',
          }}
        >
          {item}
        </div>
      ))}
    </div>
  )
}

function ConnectorCard({ index, label, icon }: { icon: string; index: number; label: string }) {
  const frame = useCurrentFrame()
  const added = frame > [999, 999, 999, 66, 88, 999, 122, 142, 999][index]
  const enter = clampProgress(frame, 18 + index * 3, 38 + index * 3)

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${LINE}`,
        borderRadius: 13,
        boxShadow: '0 10px 26px rgba(28,27,23,0.04)',
        height: 122,
        opacity: enter,
        padding: 18,
        transform: `translateY(${(1 - enter) * 16}px)`,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
        <span style={{ alignItems: 'center', background: '#f4f2ed', borderRadius: 9, display: 'flex', height: 34, justifyContent: 'center', width: 34 }}>
          {icon ? <Icon height={18} icon={icon} width={18} /> : <span style={{ background: INK, borderRadius: 5, height: 16, width: 16 }} />}
        </span>
        <span style={{ color: INK, fontSize: 16, fontWeight: 720 }}>{label}</span>
      </div>
      <div
        style={{
          alignItems: 'center',
          background: added ? '#e4f5ef' : '#262626',
          borderRadius: 9,
          color: added ? GREEN : '#ffffff',
          display: 'flex',
          fontSize: 13,
          fontWeight: 760,
          height: 34,
          justifyContent: 'center',
          marginTop: 20,
        }}
      >
        {added ? 'Added' : 'Add credential'}
      </div>
    </div>
  )
}

function ConnectorsDashboard() {
  return (
    <BrowserShell title="otto.app/connectors">
      <Sidebar active="All" />
      <div style={{ left: 220, position: 'absolute', right: 34, top: 82 }}>
        <div style={{ color: INK, fontSize: 31, fontWeight: 760 }}>Connectors</div>
        <div style={{ color: MUTED, fontSize: 15, fontWeight: 550, marginTop: 8 }}>Add credentials for Jeanelle's agent workspace.</div>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 26 }}>
          {connectors.map((connector, index) => (
            <ConnectorCard key={connector.label} index={index} {...connector} />
          ))}
        </div>
      </div>
    </BrowserShell>
  )
}

function ToolPackPage({ modal }: { modal: boolean }) {
  return (
    <BrowserShell title="otto.app/tool-packs/communication">
      <Sidebar active="Communication" />
      <div style={{ left: 220, position: 'absolute', right: 34, top: 82 }}>
        <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: INK, fontSize: 30, fontWeight: 760 }}>Communication</div>
            <div style={{ color: MUTED, fontSize: 15, fontWeight: 550, marginTop: 8 }}>Tools and credentials for the agent.</div>
          </div>
          <div style={{ background: '#262626', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 760, padding: '11px 15px' }}>Select tools</div>
        </div>
        <div style={{ display: 'grid', gap: 22, gridTemplateColumns: '1.08fr 0.92fr', marginTop: 30 }}>
          <div style={{ border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
            {sidebarApps.slice(0, 6).map((app, index) => (
              <div key={app} style={{ alignItems: 'center', borderBottom: index === 5 ? 'none' : `1px solid ${LINE}`, display: 'flex', gap: 12, height: 55, padding: '0 18px' }}>
                <span style={{ background: index < 4 ? GREEN : '#d9d6cf', borderRadius: 5, height: 16, width: 16 }} />
                <span style={{ color: INK, fontSize: 15, fontWeight: 690 }}>{app}</span>
                <span style={{ color: MUTED, fontSize: 13, marginLeft: 'auto' }}>{index < 4 ? 'Enabled' : 'Limited'}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#faf9f6', border: `1px solid ${LINE}`, borderRadius: 14, padding: 22 }}>
            <div style={{ color: INK, fontSize: 19, fontWeight: 760 }}>Tool Pack details</div>
            <div style={{ color: MUTED, fontSize: 14, lineHeight: 1.45, marginTop: 12 }}>The agent can use selected app actions while sensitive operations stay blocked.</div>
            <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12, marginTop: 22, padding: 16 }}>
              <div style={{ color: MUTED, fontSize: 12, fontWeight: 760, textTransform: 'uppercase' }}>Policy</div>
              <div style={{ color: INK, fontSize: 23, fontWeight: 760, marginTop: 5 }}>Limited access</div>
            </div>
          </div>
        </div>
      </div>
      {modal ? <ToolsModal /> : null}
    </BrowserShell>
  )
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        alignItems: 'center',
        background: checked ? '#353535' : '#ffffff',
        border: checked ? 'none' : '2px solid #d0cdc7',
        borderRadius: 5,
        color: '#fff',
        display: 'flex',
        flexShrink: 0,
        fontSize: 14,
        fontWeight: 900,
        height: 22,
        justifyContent: 'center',
        width: 22,
      }}
    >
      {checked ? '✓' : ''}
    </span>
  )
}

function ToolsModal() {
  const frame = useCurrentFrame()
  const enter = clampProgress(frame, 176, 196)

  return (
    <div
      style={{
        background: 'rgba(18,18,18,0.22)',
        inset: 0,
        opacity: enter,
        position: 'absolute',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 18,
          boxShadow: '0 34px 90px rgba(0,0,0,0.2)',
          height: 424,
          left: 236,
          overflow: 'hidden',
          position: 'absolute',
          top: 70,
          transform: `translateY(${(1 - enter) * 18}px)`,
          width: 710,
        }}
      >
        <div style={{ borderBottom: `1px solid ${LINE}`, color: INK, fontSize: 22, fontWeight: 760, height: 60, padding: '18px 22px' }}>Select tools</div>
        <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', height: 364 }}>
          <div style={{ background: '#fbfaf7', borderRight: `1px solid ${LINE}`, padding: '18px 12px' }}>
            {['Google Drive', 'Figma', 'WordPress', 'Salesforce', 'Slack', 'Snowflake'].map((app) => (
              <div key={app} style={{ background: app === 'Slack' || frame > 286 && app === 'Salesforce' ? '#efede7' : 'transparent', borderRadius: 9, color: INK, fontSize: 14, fontWeight: 700, marginBottom: 7, padding: '10px 12px' }}>{app}</div>
            ))}
          </div>
          <div style={{ padding: '14px 22px' }}>
            {(frame < 286 ? toolRows : salesforceRows).map((row, index) => {
              const checked = 'selectedAt' in row ? frame > row.selectedAt : row.checked
              const blocked = row.label === 'send_message_to_channel' || row.label === 'view_contracts'
              return (
                <div key={row.label} style={{ alignItems: 'flex-start', display: 'flex', gap: 14, marginBottom: 13, opacity: blocked ? 0.56 : 1 }}>
                  <CheckBox checked={checked} />
                  <span style={{ background: CYAN, borderRadius: 99, height: 7, marginTop: 8, width: 12 }} />
                  <div>
                    <div style={{ color: INK, fontSize: 15, fontWeight: 760 }}>{row.label}</div>
                    <div style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.35, marginTop: 4 }}>{row.muted}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function MainScene() {
  const frame = useCurrentFrame()
  const secondScene = clampProgress(frame, 146, 174)
  const modalVisible = frame > 174
  const finalZoom = clampProgress(frame, 284, 330)
  const browserScale = interpolate(frame, [0, 40, 96, 146, 174, 246, 330], [0.82, 0.92, 1.1, 0.98, 0.92, 1.02, 1.26], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const panX = interpolate(frame, [0, 72, 128, 174, 246, 330], [40, -70, -108, 18, -92, -178], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const panY = interpolate(frame, [0, 72, 128, 174, 246, 330], [28, 6, -8, 0, -18, -42], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const badgeX = interpolate(frame, [0, 46, 76, 112, 142, 202, 250, 300], [855, 390, 500, 590, 705, 214, 258, 252], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const badgeY = interpolate(frame, [0, 46, 76, 112, 142, 202, 250, 300], [96, 330, 370, 405, 410, 398, 404, 414], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorX = badgeX + 180 + interpolate(frame, [250, 330], [0, 40], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorY = badgeY - 28 - finalZoom * 24
  const caption = frameBetween(frame, 0, 50)
    ? 'with Otto Agent Handler'
    : frameBetween(frame, 50, 106)
      ? 'Otto automatically sets'
      : frameBetween(frame, 106, 164)
        ? "Jeanelle's access permissions"
        : frameBetween(frame, 164, 214)
          ? 'We can also manually adjust them'
          : frameBetween(frame, 214, 260)
            ? 'Like letting her agent'
            : frameBetween(frame, 260, 300)
              ? 'read Slack messages'
              : frameBetween(frame, 300, 326)
                ? 'but blocking access'
                : 'to Salesforce contracts'

  return (
    <AbsoluteFill style={{ background: '#f5f2eb', fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <div
        style={{
          height: 548,
          left: 120,
          opacity: 1 - secondScene,
          position: 'absolute',
          top: 78,
          transform: `translate(${panX}px, ${panY}px) scale(${browserScale})`,
          transformOrigin: 'center center',
          width: 1040,
        }}
      >
        <ConnectorsDashboard />
      </div>
      <div
        style={{
          height: 548,
          left: 120,
          opacity: secondScene,
          position: 'absolute',
          top: 78,
          transform: `translate(${panX}px, ${panY}px) scale(${browserScale})`,
          transformOrigin: 'center center',
          width: 1040,
        }}
      >
        <ToolPackPage modal={modalVisible} />
      </div>
      <OttoBadge style={{ left: badgeX, opacity: clampProgress(frame, 4, 20), top: badgeY, transform: `scale(${interpolate(frame, [0, 18], [0.86, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })})` }} />
      <Cursor style={{ left: cursorX, opacity: clampProgress(frame, 8, 24), top: cursorY }} />
      <Caption text={caption} />
    </AbsoluteFill>
  )
}

export function OttoWebsiteIntegration() {
  return <MainScene />
}
