import type { ReactElement } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

export const OTTO_INTEGRATION_ACCESS_MAP_DURATION = 110

const INK = '#17203A'
const MUTED = '#647089'
const LINE = '#E8ECF4'
const GREEN = '#166534'
const VIOLET = '#6A50F0'

const navItems = [
  { icon: 'chat', label: 'Chat' },
  { icon: 'history', label: 'Historico' },
  { icon: 'plug', label: 'Integracoes', active: true },
  { icon: 'chart', label: 'Dashboards' },
  { icon: 'slides', label: 'Slides' },
  { icon: 'file', label: 'Reports' },
]

const integrations = [
  { category: 'ERP', initials: 'CA', label: 'Conta Azul', tone: '#2563EB' },
  { category: 'ERP', initials: 'BL', label: 'Bling', tone: '#16A34A' },
  { category: 'ERP', initials: 'OM', label: 'Omie', tone: '#0891B2' },
  { category: 'Ads', initials: 'M', label: 'Meta Ads', tone: '#0866FF' },
  { category: 'Ads', initials: 'G', label: 'Google Ads', tone: '#F59E0B' },
  { category: 'Ecommerce', initials: 'S', label: 'Shopify', tone: '#95BF47' },
]

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function OttoGlyph({ color = '#4D4D4D', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 116 104" width={size * 1.12}>
      <path d="M23 13 C39 33 61 43 92 44" fill="none" stroke={color} strokeLinecap="square" strokeWidth="20" />
      <path d="M23 91 C39 71 61 61 92 60" fill="none" stroke={color} strokeLinecap="square" strokeWidth="20" />
    </svg>
  )
}

function LineIcon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.9 }
  const paths: Record<string, ReactElement> = {
    chart: <path d="M4 16 V10 M10 16 V5 M16 16 V8 M3 17 H17" {...common} />,
    chat: <path d="M4 5 H16 V13 H8 L4 16 Z" {...common} />,
    check: <path d="M4 10 L8 14 L16 6" {...common} />,
    file: <path d="M6 3 H12 L16 7 V17 H6 Z M12 3 V7 H16 M8 11 H14 M8 14 H13" {...common} />,
    history: <path d="M5 7 H2 V4 M3 7 A7 7 0 1 1 5 15 M10 6 V10 L13 12" {...common} />,
    plug: <path d="M7 3 V8 M13 3 V8 M5 8 H15 V11 A5 5 0 0 1 10 16 A5 5 0 0 1 5 11 Z M10 16 V18" {...common} />,
    search: <path d="M9 4 A5 5 0 1 1 9 14 A5 5 0 1 1 9 4 M13 13 L17 17" {...common} />,
    slides: <path d="M3 4 H17 V14 H3 Z M8 17 H12 M10 14 V17" {...common} />,
    sync: <path d="M15 7 A5 5 0 0 0 6.3 4.2 L5 5.5 M5 3 V5.5 H7.5 M5 13 A5 5 0 0 0 13.7 15.8 L15 14.5 M15 17 V14.5 H12.5" {...common} />,
  }

  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 20 20" width={size}>
      {paths[name] || paths.file}
    </svg>
  )
}

function Sidebar() {
  const frame = useCurrentFrame()

  return (
    <aside style={{ background: '#FAFAFA', borderRight: `1px solid ${LINE}`, bottom: 0, left: 0, position: 'absolute', top: 0, width: 88 }}>
      <div style={{ alignItems: 'center', display: 'flex', height: 52, justifyContent: 'center' }}>
        <OttoGlyph />
      </div>
      <div style={{ display: 'grid', gap: 10, justifyItems: 'center', paddingTop: 18 }}>
        {navItems.map((item, index) => (
          <div
            key={item.label}
            style={{
              alignItems: 'center',
              background: item.active ? '#EEF2FF' : 'transparent',
              borderRadius: 14,
              color: item.active ? VIOLET : '#4D4D4D',
              display: 'flex',
              flexDirection: 'column',
              fontSize: 10,
              fontWeight: item.active ? 760 : 520,
              gap: 5,
              height: 58,
              justifyContent: 'center',
              opacity: progress(frame, index * 3, 18 + index * 3),
              width: 72,
            }}
          >
            <LineIcon name={item.icon} size={19} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ alignItems: 'center', bottom: 20, display: 'flex', flexDirection: 'column', gap: 8, left: 0, position: 'absolute', right: 0 }}>
        <div style={{ background: '#E2E8F0', borderRadius: 999, height: 34, position: 'relative', width: 34 }}>
          <span style={{ background: '#E0B391', borderRadius: 999, height: 12, left: 11, position: 'absolute', top: 7, width: 12 }} />
          <span style={{ background: '#475569', borderRadius: '50% 50% 0 0', bottom: 5, height: 12, left: 7, position: 'absolute', width: 20 }} />
        </div>
      </div>
    </aside>
  )
}

function ProviderMark({ initials, tone }: { initials: string; tone: string }) {
  return (
    <div style={{ alignItems: 'center', background: tone, borderRadius: 14, color: '#FFFFFF', display: 'flex', fontSize: 16, fontWeight: 840, height: 48, justifyContent: 'center', letterSpacing: 0, width: 48 }}>
      {initials}
    </div>
  )
}

function StatPanel() {
  const frame = useCurrentFrame()
  const connected = frame > 84 ? 1 : 0
  const values = [
    { label: 'Conectadas', value: connected, color: GREEN },
    { label: 'Disponiveis', value: 6, color: '#2563EB' },
    { label: 'Pendentes', value: frame > 84 ? 0 : 1, color: '#A16207' },
  ]

  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
      {values.map((item, index) => {
        const enter = progress(frame, 8 + index * 5, 26 + index * 5)
        return (
          <div
            key={item.label}
            style={{
              alignItems: 'center',
              background: '#FFFFFF',
              border: `1px solid ${LINE}`,
              borderRadius: 16,
              boxShadow: '0 12px 30px rgba(23,32,58,0.05)',
              display: 'flex',
              gap: 14,
              height: 82,
              opacity: enter,
              padding: '0 18px',
              transform: `translateY(${(1 - enter) * 12}px)`,
            }}
          >
            <div style={{ alignItems: 'center', background: '#F7F8FC', borderRadius: 14, color: item.color, display: 'flex', height: 42, justifyContent: 'center', width: 42 }}>
              <LineIcon name={index === 0 ? 'check' : index === 1 ? 'plug' : 'sync'} size={22} />
            </div>
            <div>
              <div style={{ color: item.color, fontSize: 25, fontWeight: 780, lineHeight: 1 }}>{item.value}</div>
              <div style={{ color: MUTED, fontSize: 13, fontWeight: 650, marginTop: 5 }}>{item.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      style={{
        background: connected ? GREEN : '#FFFFFF',
        border: connected ? 'none' : `1px solid ${LINE}`,
        borderRadius: 999,
        color: connected ? '#FFFFFF' : MUTED,
        fontSize: 12,
        fontWeight: 760,
        padding: '7px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {connected ? 'Conectado' : 'Nao conectado'}
    </span>
  )
}

function IntegrationCard({ index, integration }: { index: number; integration: typeof integrations[number] }) {
  const frame = useCurrentFrame()
  const enter = progress(frame, 16 + index * 5, 34 + index * 5)
  const selected = integration.label === 'Conta Azul'
  const connected = selected && frame > 84
  const highlight = selected && frame > 38
  const pulse = connected ? 1 + Math.sin(frame / 4) * 0.008 : 1

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: highlight ? `2px solid ${connected ? GREEN : INK}` : `1px solid ${LINE}`,
        borderRadius: 16,
        boxShadow: highlight ? `0 18px 38px ${connected ? 'rgba(22,101,52,0.16)' : 'rgba(23,32,58,0.13)'}` : '0 12px 30px rgba(23,32,58,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: 184,
        opacity: enter,
        padding: 19,
        transform: `translateY(${(1 - enter) * 18}px) scale(${pulse})`,
      }}
    >
      <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between' }}>
        <ProviderMark initials={integration.initials} tone={integration.tone} />
        <StatusBadge connected={connected} />
      </div>
      <div style={{ color: INK, fontSize: 20, fontWeight: 760, marginTop: 20 }}>{integration.label}</div>
      <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.35, marginTop: 7 }}>{integration.category}</div>
      <div
        style={{
          alignItems: 'center',
          background: connected ? '#DCFCE7' : INK,
          borderRadius: 10,
          color: connected ? GREEN : '#FFFFFF',
          display: 'flex',
          fontSize: 13,
          fontWeight: 760,
          height: 36,
          justifyContent: 'center',
          marginTop: 'auto',
        }}
      >
        {connected ? 'Conectado' : 'Conectar'}
      </div>
    </div>
  )
}

function Cursor() {
  const frame = useCurrentFrame()
  const firstClick = progress(frame, 39, 49)
  const secondClick = progress(frame, 73, 83)
  const x = interpolate(frame, [0, 34, 44, 58, 76, 92], [632, 512, 374, 622, 700, 700], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = interpolate(frame, [0, 34, 44, 58, 76, 92], [610, 503, 512, 456, 494, 494], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const click = Math.max(firstClick * (1 - progress(frame, 49, 54)), secondClick * (1 - progress(frame, 83, 88)))

  return (
    <div style={{ filter: 'drop-shadow(0 10px 12px rgba(0,0,0,0.22))', left: x, opacity: progress(frame, 26, 38) * (1 - progress(frame, 92, 106)), position: 'absolute', top: y, transform: `scale(${1 - click * 0.1})` }}>
      <svg height="50" viewBox="0 0 84 84" width="50">
        <path d="M16 9 L73 33 L48 42 L37 70 Z" fill="#1F2937" stroke="#ffffff" strokeLinejoin="round" strokeWidth="4" />
      </svg>
    </div>
  )
}

function ConnectionModal() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 48, 62)
  const exit = progress(frame, 84, 96)
  const visible = enter * (1 - exit)
  const confirmed = frame > 78

  return (
    <div style={{ alignItems: 'center', background: `rgba(15,23,42,${0.18 * visible})`, display: 'flex', inset: 0, justifyContent: 'center', opacity: visible, position: 'absolute' }}>
      <div
        style={{
          background: '#FFFFFF',
          border: `1px solid ${LINE}`,
          borderRadius: 18,
          boxShadow: '0 34px 90px rgba(15,23,42,0.22)',
          height: 348,
          padding: 28,
          transform: `translateY(${(1 - enter) * 18}px) scale(${0.96 + enter * 0.04})`,
          width: 486,
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 15 }}>
          <ProviderMark initials="CA" tone="#2563EB" />
          <div>
            <div style={{ color: INK, fontSize: 25, fontWeight: 760 }}>Conectar Conta Azul</div>
            <div style={{ color: MUTED, fontSize: 13, fontWeight: 650, marginTop: 6 }}>ERP · OAuth seguro</div>
          </div>
        </div>
        <div style={{ background: '#F8FAFC', border: `1px solid ${LINE}`, borderRadius: 14, display: 'grid', gap: 12, marginTop: 24, padding: 18 }}>
          {['Autorizar leitura de clientes, vendas e financeiro', 'Sincronizar dados automaticamente', 'Permitir consulta pela Otto IA com confirmacao'].map((item, index) => (
            <div key={item} style={{ alignItems: 'center', color: '#475569', display: 'flex', fontSize: 14, fontWeight: 650, gap: 10, opacity: progress(frame, 58 + index * 5, 70 + index * 5) }}>
              <span style={{ alignItems: 'center', background: '#DCFCE7', borderRadius: 999, color: GREEN, display: 'flex', height: 21, justifyContent: 'center', width: 21 }}>
                <LineIcon name="check" size={14} />
              </span>
              {item}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <div style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 10, color: MUTED, display: 'flex', fontSize: 13, fontWeight: 760, height: 40, justifyContent: 'center', width: 92 }}>Cancelar</div>
          <div style={{ alignItems: 'center', background: confirmed ? GREEN : INK, borderRadius: 10, color: '#FFFFFF', display: 'flex', fontSize: 13, fontWeight: 780, height: 40, justifyContent: 'center', width: 154 }}>
            {confirmed ? 'Conectado' : 'Confirmar'}
          </div>
        </div>
      </div>
    </div>
  )
}

function Caption() {
  const frame = useCurrentFrame()
  const text = frame < 38
    ? 'Usuario escolhe uma integracao'
    : frame < 54
      ? 'clica em Conectar'
      : frame < 84
        ? 'confirma no modal'
        : 'Conta Azul fica conectada'

  return (
    <div
      style={{
        background: 'rgba(32,32,32,0.86)',
        borderRadius: 8,
        bottom: 30,
        color: '#FFFFFF',
        fontSize: 23,
        fontWeight: 720,
        left: '50%',
        padding: '12px 18px 13px',
        position: 'absolute',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  )
}

export function OttoIntegrationAccessMap() {
  const frame = useCurrentFrame()
  const appEnter = progress(frame, 0, 18)

  return (
    <AbsoluteFill style={{ background: '#F4F6FA', color: INK, fontFamily: 'Inter, Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <div
        style={{
          background: '#FFFFFF',
          border: `1px solid ${LINE}`,
          borderRadius: 24,
          boxShadow: '0 30px 90px rgba(23,32,58,0.12)',
          height: 640,
          left: 52,
          opacity: appEnter,
          overflow: 'hidden',
          position: 'absolute',
          top: 40,
          transform: `scale(${interpolate(appEnter, [0, 1], [0.96, 1])})`,
          width: 1176,
        }}
      >
        <Sidebar />
        <main style={{ bottom: 0, left: 88, overflow: 'hidden', padding: '38px 34px', position: 'absolute', right: 0, top: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ color: INK, fontSize: 30, fontWeight: 760, letterSpacing: 0, margin: 0 }}>Conexoes</h1>
              <p style={{ color: MUTED, fontSize: 17, lineHeight: 1.45, margin: '8px 0 0' }}>
                Conecte seus apps uma vez e configure Otto IA e sincronizacao depois.
              </p>
            </div>
            <div style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 12, color: MUTED, display: 'flex', fontSize: 13, fontWeight: 650, gap: 9, height: 42, padding: '0 13px' }}>
              <LineIcon name="search" size={17} />
              Buscar integracao
            </div>
          </div>
          <StatPanel />
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {integrations.map((integration, index) => (
              <IntegrationCard index={index} integration={integration} key={integration.label} />
            ))}
          </div>
        </main>
        <ConnectionModal />
      </div>
      <Cursor />
      <Caption />
    </AbsoluteFill>
  )
}
