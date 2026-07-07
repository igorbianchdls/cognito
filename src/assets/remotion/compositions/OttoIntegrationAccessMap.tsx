import { Icon } from '@iconify/react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'

export const OTTO_INTEGRATION_ACCESS_MAP_DURATION = 95

const INK = '#17203A'
const MUTED = '#647089'
const LINE = '#E8ECF4'
const GREEN = '#166534'
const BLUE = '#2563EB'
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
  { category: 'Arquivos', icon: 'simple-icons:googledrive', label: 'Google Drive', status: 'Conectado', tone: GREEN },
  { category: 'Comunicacao', icon: 'simple-icons:slack', label: 'Slack', status: 'Conectado', tone: GREEN },
  { category: 'CRM', icon: 'simple-icons:hubspot', label: 'HubSpot', status: 'Pendente', tone: '#A16207' },
  { category: 'Ecommerce', icon: 'simple-icons:shopify', label: 'Shopify', status: 'Nao conectado', tone: MUTED },
  { category: 'CRM', icon: 'simple-icons:salesforce', label: 'Salesforce', status: 'Conectado', tone: GREEN },
  { category: 'Workspace', icon: 'simple-icons:notion', label: 'Notion', status: 'Nao conectado', tone: MUTED },
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

function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg height={size} viewBox="0 0 20 20" width={size}>
      <path d="M4 10.5 L8.1 14.5 L16 5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </svg>
  )
}

function LineIcon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.9 }
  const paths: Record<string, JSX.Element> = {
    alert: <path d="M10 3 L18 17 H2 Z M10 8 V11 M10 14 H10.01" {...common} />,
    chart: <path d="M4 16 V10 M10 16 V5 M16 16 V8 M3 17 H17" {...common} />,
    chat: <path d="M4 5 H16 V13 H8 L4 16 Z" {...common} />,
    check: <path d="M4 10 L8 14 L16 6" {...common} />,
    clock: <path d="M10 3 A7 7 0 1 1 10 17 A7 7 0 1 1 10 3 M10 7 V10 L13 12" {...common} />,
    file: <path d="M6 3 H12 L16 7 V17 H6 Z M12 3 V7 H16 M8 11 H14 M8 14 H13" {...common} />,
    history: <path d="M5 7 H2 V4 M3 7 A7 7 0 1 1 5 15 M10 6 V10 L13 12" {...common} />,
    plug: <path d="M7 3 V8 M13 3 V8 M5 8 H15 V11 A5 5 0 0 1 10 16 A5 5 0 0 1 5 11 Z M10 16 V18" {...common} />,
    robot: <path d="M5 8 H15 A2 2 0 0 1 17 10 V15 H3 V10 A2 2 0 0 1 5 8 M10 8 V5 M7 12 H7.01 M13 12 H13.01 M7 15 V17 H13 V15" {...common} />,
    search: <path d="M9 4 A5 5 0 1 1 9 14 A5 5 0 1 1 9 4 M13 13 L17 17" {...common} />,
    settings: <path d="M10 7 A3 3 0 1 1 10 13 A3 3 0 1 1 10 7 M10 2 V4 M10 16 V18 M4.3 4.3 L5.7 5.7 M14.3 14.3 L15.7 15.7 M2 10 H4 M16 10 H18 M4.3 15.7 L5.7 14.3 M14.3 5.7 L15.7 4.3" {...common} />,
    slides: <path d="M3 4 H17 V14 H3 Z M8 17 H12 M10 14 V17" {...common} />,
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
              opacity: progress(frame, 0 + index * 3, 18 + index * 3),
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

function StatPanel() {
  const frame = useCurrentFrame()
  const values = [
    { icon: 'check', label: 'Conectadas', value: 3, color: GREEN },
    { icon: 'clock', label: 'Pendentes', value: 1, color: '#A16207' },
    { icon: 'alert', label: 'Atencao', value: 0, color: BLUE },
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
              <LineIcon name={item.icon} size={22} />
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

function StatusBadge({ status, tone }: { status: string; tone: string }) {
  const connected = status === 'Conectado'
  return (
    <span
      style={{
        background: connected ? tone : status === 'Pendente' ? '#FEF3C7' : '#FFFFFF',
        border: connected ? 'none' : `1px solid ${status === 'Pendente' ? '#FDE68A' : LINE}`,
        borderRadius: 999,
        color: connected ? '#FFFFFF' : status === 'Pendente' ? '#92400E' : MUTED,
        fontSize: 12,
        fontWeight: 760,
        padding: '7px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  )
}

function IntegrationCard({ index, integration }: { index: number; integration: typeof integrations[number] }) {
  const frame = useCurrentFrame()
  const enter = progress(frame, 16 + index * 5, 34 + index * 5)
  const selected = integration.label === 'Slack' && frame > 48
  const pulse = selected ? 1 + Math.sin(frame / 4) * 0.01 : 1

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: selected ? `2px solid ${VIOLET}` : `1px solid ${LINE}`,
        borderRadius: 16,
        boxShadow: selected ? '0 18px 38px rgba(106,80,240,0.16)' : '0 12px 30px rgba(23,32,58,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: 184,
        opacity: enter,
        padding: 19,
        transform: `translateY(${(1 - enter) * 18}px) scale(${pulse})`,
      }}
    >
      <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ alignItems: 'center', background: '#F7F8FC', border: `1px solid ${LINE}`, borderRadius: 14, display: 'flex', height: 48, justifyContent: 'center', width: 48 }}>
          <Icon height={24} icon={integration.icon} width={24} />
        </div>
        <StatusBadge status={integration.status} tone={integration.tone} />
      </div>
      <div style={{ color: INK, fontSize: 20, fontWeight: 760, marginTop: 20 }}>{integration.label}</div>
      <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.35, marginTop: 7 }}>{integration.category}</div>
      <div style={{ alignItems: 'center', borderTop: `1px solid ${LINE}`, color: MUTED, display: 'flex', fontSize: 12, fontWeight: 650, gap: 8, marginTop: 'auto', paddingTop: 14 }}>
        <LineIcon name="settings" size={15} />
        {integration.status === 'Conectado' ? 'Configurar' : 'Conectar'}
      </div>
    </div>
  )
}

function Cursor() {
  const frame = useCurrentFrame()
  const click = progress(frame, 42, 56)
  const x = interpolate(frame, [0, 36, 48, 64], [620, 630, 425, 858], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = interpolate(frame, [0, 36, 48, 64], [610, 488, 408, 176], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ filter: 'drop-shadow(0 10px 12px rgba(0,0,0,0.22))', left: x, opacity: progress(frame, 22, 36), position: 'absolute', top: y, transform: `scale(${1 - click * 0.08})` }}>
      <svg height="50" viewBox="0 0 84 84" width="50">
        <path d="M16 9 L73 33 L48 42 L37 70 Z" fill="#1F2937" stroke="#ffffff" strokeLinejoin="round" strokeWidth="4" />
      </svg>
    </div>
  )
}

function Toggle({ checked, delay = 0 }: { checked: boolean; delay?: number }) {
  const frame = useCurrentFrame()
  const on = checked ? progress(frame, delay, delay + 14) : 0
  return (
    <span style={{ background: checked ? VIOLET : '#CBD5E1', borderRadius: 999, display: 'inline-flex', height: 24, padding: 3, position: 'relative', width: 43 }}>
      <span style={{ background: '#FFFFFF', borderRadius: 999, boxShadow: '0 2px 5px rgba(0,0,0,0.18)', height: 18, transform: `translateX(${on * 19}px)`, width: 18 }} />
    </span>
  )
}

function Drawer() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 54, 72)
  const otto = progress(frame, 68, 84)
  const pulse = Math.max(0, Math.sin(frame / 5)) * progress(frame, 70, 90)

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderLeft: `1px solid ${LINE}`,
        bottom: 0,
        boxShadow: '-24px 0 54px rgba(23,32,58,0.12)',
        opacity: enter,
        position: 'absolute',
        right: 0,
        top: 0,
        transform: `translateX(${(1 - enter) * 360}px)`,
        width: 390,
      }}
    >
      <div style={{ borderBottom: `1px solid ${LINE}`, padding: '28px 26px 24px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 15 }}>
          <div style={{ alignItems: 'center', background: '#F7F8FC', border: `1px solid ${LINE}`, borderRadius: 16, display: 'flex', height: 50, justifyContent: 'center', width: 50 }}>
            <Icon height={25} icon="simple-icons:slack" width={25} />
          </div>
          <div>
            <div style={{ color: INK, fontSize: 25, fontWeight: 760, letterSpacing: 0 }}>Slack</div>
            <div style={{ color: MUTED, fontSize: 13, fontWeight: 650, marginTop: 6 }}>COMUNICACAO · slack</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 16, padding: 26 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          <InfoBox label="Status" value="Conectado" />
          <InfoBox label="Ultimo sync" value="Hoje" />
        </div>
        <section style={{ background: '#FAFBFD', border: `1px solid ${LINE}`, borderRadius: 16, padding: 18 }}>
          <div style={{ alignItems: 'flex-start', display: 'flex', gap: 13 }}>
            <div style={{ alignItems: 'center', background: '#FFFFFF', borderRadius: 14, color: VIOLET, display: 'flex', height: 40, justifyContent: 'center', position: 'relative', width: 40 }}>
              <span style={{ background: `rgba(106,80,240,${0.16 + pulse * 0.18})`, borderRadius: 999, inset: -5 - pulse * 8, position: 'absolute' }} />
              <span style={{ position: 'relative' }}>
                <LineIcon name="robot" size={22} />
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                <div style={{ color: INK, fontSize: 15, fontWeight: 760 }}>Acesso da IA</div>
                <span style={{ background: otto ? GREEN : '#FFFFFF', border: otto ? 'none' : `1px solid ${LINE}`, borderRadius: 999, color: otto ? '#FFFFFF' : MUTED, fontSize: 11, fontWeight: 760, padding: '5px 8px' }}>
                  {otto ? 'Permitido' : 'Bloqueado'}
                </span>
              </div>
              <div style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.45, marginTop: 7 }}>
                Otto pode consultar dados desta conexao e executar acoes seguras.
              </div>
            </div>
            <Toggle checked={frame > 68} delay={68} />
          </div>
          <div style={{ alignItems: 'center', borderTop: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', marginTop: 17, paddingTop: 15 }}>
            <span style={{ color: '#475569', fontSize: 12.5, fontWeight: 700 }}>Exigir confirmacao</span>
            <Toggle checked={frame > 76} delay={76} />
          </div>
        </section>
        <section style={{ background: '#FAFBFD', border: `1px solid ${LINE}`, borderRadius: 16, padding: 18 }}>
          <div style={{ color: INK, fontSize: 14, fontWeight: 760, marginBottom: 12 }}>Permissoes ativas</div>
          {['Ler canais', 'Ler mensagens', 'Criar resumo', 'Enviar mensagem com confirmacao'].map((item, index) => (
            <div key={item} style={{ alignItems: 'center', color: '#475569', display: 'flex', fontSize: 12.5, fontWeight: 650, gap: 9, marginTop: index ? 10 : 0, opacity: progress(frame, 72 + index * 4, 86 + index * 4) }}>
              <span style={{ alignItems: 'center', background: '#DCFCE7', borderRadius: 999, color: GREEN, display: 'flex', height: 18, justifyContent: 'center', width: 18 }}>
                <CheckIcon size={12} />
              </span>
              {item}
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#FAFBFD', border: `1px solid ${LINE}`, borderRadius: 14, padding: 15 }}>
      <div style={{ color: '#98A4BA', fontSize: 11, fontWeight: 760, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: INK, fontSize: 16, fontWeight: 760, marginTop: 7 }}>{value}</div>
    </div>
  )
}

function Caption() {
  const frame = useCurrentFrame()
  const text = frame < 34
    ? 'Usuario abre Integracoes no Otto'
    : frame < 58
      ? 'conecta os apps principais'
      : frame < 78
        ? 'configura o acesso da Otto'
        : 'com permissao e confirmacao controladas'

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
  const contentWidth = interpolate(frame, [54, 72], [1112, 802], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

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
        <main style={{ bottom: 0, left: 88, overflow: 'hidden', padding: '38px 34px', position: 'absolute', top: 0, width: contentWidth }}>
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
        <Drawer />
      </div>
      <Cursor />
      <Caption />
    </AbsoluteFill>
  )
}
