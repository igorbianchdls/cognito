import type { ReactElement } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

export const OTTO_INTEGRATION_ACCESS_MAP_DURATION = 210

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
  { category: 'ERP', description: 'ERP financeiro para vendas, clientes, contas e fluxo de caixa.', initials: 'CA', label: 'Conta Azul', tone: '#2563EB' },
  { category: 'ERP', description: 'Gestao comercial e fiscal para pedidos, notas e estoque.', initials: 'BL', label: 'Bling', tone: '#16A34A' },
  { category: 'ERP', description: 'Operacao empresarial com financeiro, CRM e servicos.', initials: 'OM', label: 'Omie', tone: '#0891B2' },
  { category: 'Ads', description: 'Campanhas, criativos, conjuntos de anuncios e resultados.', initials: 'M', label: 'Meta Ads', tone: '#0866FF' },
  { category: 'Ads', description: 'Midia paga, conversoes, campanhas e palavras-chave.', initials: 'G', label: 'Google Ads', tone: '#F59E0B' },
  { category: 'Ecommerce', description: 'Pedidos, catalogo, clientes e performance da loja.', initials: 'S', label: 'Shopify', tone: '#95BF47' },
]

const sequence = [
  { confirm: 74, end: 90, index: 0, modalIn: 48, name: 'Conta Azul', start: 40 },
  { confirm: 120, end: 136, index: 1, modalIn: 94, name: 'Bling', start: 86 },
  { confirm: 166, end: 182, index: 3, modalIn: 140, name: 'Meta Ads', start: 132 },
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
    <Img
      src={staticFile('logoOtto.svg')}
      style={{ display: 'block', filter: color === '#ffffff' ? 'brightness(0) invert(1)' : undefined, height: size, objectFit: 'contain', width: size * 2.33 }}
    />
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
    more: <path d="M5 10 H5.01 M10 10 H10.01 M15 10 H15.01" {...common} />,
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

function connectedCount(frame: number) {
  return sequence.filter((item) => frame > item.end).length
}

function isConnected(index: number, frame: number) {
  const item = sequence.find((step) => step.index === index)
  return Boolean(item && frame > item.end)
}

function activeStep(frame: number) {
  return sequence.find((step) => frame >= step.start && frame < step.end)
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
      <div style={{ alignItems: 'center', bottom: 20, display: 'flex', flexDirection: 'column', left: 0, position: 'absolute', right: 0 }}>
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
    <div style={{ alignItems: 'center', background: tone, borderRadius: 14, color: '#FFFFFF', display: 'flex', fontSize: 16, fontWeight: 840, height: 56, justifyContent: 'center', letterSpacing: 0, width: 56 }}>
      {initials}
    </div>
  )
}

function StatPanel() {
  const frame = useCurrentFrame()
  const connected = connectedCount(frame)
  const values = [
    { label: 'Conectadas', value: connected, color: GREEN },
    { label: 'Disponiveis', value: 6, color: '#2563EB' },
    { label: 'Pendentes', value: 3 - connected, color: '#A16207' },
  ]

  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
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
              height: 74,
              opacity: enter,
              padding: '0 18px',
              transform: `translateY(${(1 - enter) * 12}px)`,
            }}
          >
            <div style={{ alignItems: 'center', background: '#F7F8FC', borderRadius: 14, color: item.color, display: 'flex', height: 40, justifyContent: 'center', width: 40 }}>
              <LineIcon name={index === 0 ? 'check' : index === 1 ? 'plug' : 'sync'} size={21} />
            </div>
            <div>
              <div style={{ color: item.color, fontSize: 24, fontWeight: 780, lineHeight: 1 }}>{item.value}</div>
              <div style={{ color: MUTED, fontSize: 12.5, fontWeight: 650, marginTop: 5 }}>{item.label}</div>
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
  const enter = progress(frame, 16 + index * 4, 34 + index * 4)
  const active = activeStep(frame)?.index === index
  const connected = isConnected(index, frame)
  const pulse = connected ? 1 + Math.sin(frame / 4) * 0.006 : 1

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: active || connected ? `2px solid ${connected ? GREEN : INK}` : `1px solid ${LINE}`,
        borderRadius: 12,
        boxShadow: active || connected ? `0 18px 38px ${connected ? 'rgba(22,101,52,0.15)' : 'rgba(23,32,58,0.12)'}` : '0 12px 30px rgba(23,32,58,0.06)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 252,
        opacity: enter,
        padding: 20,
        transform: `translateY(${(1 - enter) * 18}px) scale(${pulse})`,
      }}
    >
      <div style={{ alignItems: 'flex-start', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
        <ProviderMark initials={integration.initials} tone={integration.tone} />
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <StatusBadge connected={connected} />
          <div style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 9, color: MUTED, display: 'flex', height: 34, justifyContent: 'center', width: 34 }}>
            <LineIcon name="more" size={18} />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 104, paddingTop: 18 }}>
        <div style={{ color: INK, fontSize: 19, fontWeight: 760, letterSpacing: 0 }}>{integration.label}</div>
        <div style={{ color: MUTED, fontSize: 13.5, lineHeight: 1.45, marginTop: 8 }}>{integration.description}</div>
        <span style={{ background: '#F1F5F9', borderRadius: 999, color: '#475569', display: 'inline-flex', fontSize: 12, fontWeight: 700, marginTop: 14, padding: '6px 10px' }}>
          {integration.category}
        </span>
      </div>
      <div style={{ alignItems: 'flex-end', borderTop: `1px solid ${LINE}`, display: 'flex', gap: 12, justifyContent: 'space-between', paddingTop: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#98A4BA', fontSize: 10.5, fontWeight: 760, letterSpacing: 0, textTransform: 'uppercase' }}>Conexao</div>
          <div style={{ color: MUTED, fontSize: 12.2, lineHeight: 1.35, marginTop: 5 }}>
            {connected ? 'Conexao pronta para Otto IA e sincronizacao.' : 'Conecte sua conta para importar os dados.'}
          </div>
        </div>
        <div
          style={{
            alignItems: 'center',
            background: connected ? '#DCFCE7' : INK,
            borderRadius: 10,
            color: connected ? GREEN : '#FFFFFF',
            display: 'flex',
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 760,
            height: 38,
            justifyContent: 'center',
            width: 104,
          }}
        >
          {connected ? 'Conectado' : 'Conectar'}
        </div>
      </div>
    </div>
  )
}

function modalStep(frame: number) {
  return sequence.find((step) => frame >= step.modalIn && frame < step.end + 10)
}

function Cursor() {
  const frame = useCurrentFrame()
  const firstClick = progress(frame, 40, 50)
  const secondClick = progress(frame, 86, 96)
  const thirdClick = progress(frame, 132, 142)
  const confirmClick = Math.max(progress(frame, 74, 84), progress(frame, 120, 130), progress(frame, 166, 176))
  const x = interpolate(frame, [0, 36, 44, 64, 78, 88, 94, 110, 124, 134, 140, 156, 170, 188], [640, 512, 374, 620, 700, 620, 704, 620, 700, 512, 374, 620, 700, 1012], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = interpolate(frame, [0, 36, 44, 64, 78, 88, 94, 110, 124, 134, 140, 156, 170, 188], [610, 503, 520, 456, 494, 503, 520, 456, 494, 503, 520, 456, 494, 506], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const click = Math.max(firstClick * (1 - progress(frame, 50, 54)), secondClick * (1 - progress(frame, 96, 100)), thirdClick * (1 - progress(frame, 142, 146)), confirmClick * (1 - progress(frame, 176, 182)))

  return (
    <div style={{ filter: 'drop-shadow(0 10px 12px rgba(0,0,0,0.22))', left: x, opacity: progress(frame, 26, 38) * (1 - progress(frame, 192, 206)), position: 'absolute', top: y, transform: `scale(${1 - click * 0.1})` }}>
      <svg height="50" viewBox="0 0 84 84" width="50">
        <path d="M16 9 L73 33 L48 42 L37 70 Z" fill="#1F2937" stroke="#ffffff" strokeLinejoin="round" strokeWidth="4" />
      </svg>
    </div>
  )
}

function ConnectionModal() {
  const frame = useCurrentFrame()
  const step = modalStep(frame)
  if (!step) return null

  const integration = integrations[step.index]
  const enter = progress(frame, step.modalIn, step.modalIn + 12)
  const exit = progress(frame, step.end, step.end + 10)
  const visible = enter * (1 - exit)
  const confirmed = frame > step.confirm

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
          <ProviderMark initials={integration.initials} tone={integration.tone} />
          <div>
            <div style={{ color: INK, fontSize: 25, fontWeight: 760 }}>Conectar {integration.label}</div>
            <div style={{ color: MUTED, fontSize: 13, fontWeight: 650, marginTop: 6 }}>{integration.category} - OAuth seguro</div>
          </div>
        </div>
        <div style={{ background: '#F8FAFC', border: `1px solid ${LINE}`, borderRadius: 14, display: 'grid', gap: 12, marginTop: 24, padding: 18 }}>
          {['Autorizar leitura dos dados principais', 'Sincronizar historico automaticamente', 'Permitir consulta pela Otto IA com confirmacao'].map((item, index) => (
            <div key={item} style={{ alignItems: 'center', color: '#475569', display: 'flex', fontSize: 14, fontWeight: 650, gap: 10, opacity: progress(frame, step.modalIn + 10 + index * 4, step.modalIn + 22 + index * 4) }}>
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

function Toggle({ delay }: { delay: number }) {
  const frame = useCurrentFrame()
  const on = progress(frame, delay, delay + 12)
  return (
    <span style={{ background: VIOLET, borderRadius: 999, display: 'inline-flex', height: 24, padding: 3, width: 43 }}>
      <span style={{ background: '#FFFFFF', borderRadius: 999, boxShadow: '0 2px 5px rgba(0,0,0,0.18)', height: 18, transform: `translateX(${on * 19}px)`, width: 18 }} />
    </span>
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

function ConnectionDrawer() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 184, 202)
  const pulse = Math.max(0, Math.sin(frame / 5)) * progress(frame, 194, 210)

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
        transform: `translateX(${(1 - enter) * 390}px)`,
        width: 390,
      }}
    >
      <div style={{ borderBottom: `1px solid ${LINE}`, padding: '28px 26px 24px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 15 }}>
          <ProviderMark initials="M" tone="#0866FF" />
          <div>
            <div style={{ color: INK, fontSize: 25, fontWeight: 760 }}>Meta Ads</div>
            <div style={{ color: MUTED, fontSize: 13, fontWeight: 650, marginTop: 6 }}>Ads - meta_ads</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 16, padding: 26 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          <InfoBox label="Status" value="Conectado" />
          <InfoBox label="Ultimo sync" value="Agora" />
        </div>
        <section style={{ background: '#FAFBFD', border: `1px solid ${LINE}`, borderRadius: 16, padding: 18 }}>
          <div style={{ alignItems: 'flex-start', display: 'flex', gap: 13 }}>
            <div style={{ alignItems: 'center', background: '#FFFFFF', borderRadius: 14, color: VIOLET, display: 'flex', height: 40, justifyContent: 'center', position: 'relative', width: 40 }}>
              <span style={{ background: `rgba(106,80,240,${0.16 + pulse * 0.18})`, borderRadius: 999, inset: -5 - pulse * 8, position: 'absolute' }} />
              <span style={{ position: 'relative' }}>
                <OttoGlyph color={VIOLET} size={21} />
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                <div style={{ color: INK, fontSize: 15, fontWeight: 760 }}>Acesso da IA</div>
                <span style={{ background: GREEN, borderRadius: 999, color: '#FFFFFF', fontSize: 11, fontWeight: 760, padding: '5px 8px' }}>Permitido</span>
              </div>
              <div style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.45, marginTop: 7 }}>
                Otto pode consultar campanhas, criativos e metricas desta conexao.
              </div>
            </div>
            <Toggle delay={194} />
          </div>
          <div style={{ alignItems: 'center', borderTop: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', marginTop: 17, paddingTop: 15 }}>
            <span style={{ color: '#475569', fontSize: 12.5, fontWeight: 700 }}>Exigir confirmacao</span>
            <Toggle delay={200} />
          </div>
        </section>
        <section style={{ background: '#FAFBFD', border: `1px solid ${LINE}`, borderRadius: 16, padding: 18 }}>
          <div style={{ color: INK, fontSize: 14, fontWeight: 760, marginBottom: 12 }}>Dados sincronizados</div>
          {['Campanhas', 'Conjuntos de anuncios', 'Criativos', 'Resultados diarios'].map((item, index) => (
            <div key={item} style={{ alignItems: 'center', color: '#475569', display: 'flex', fontSize: 12.5, fontWeight: 650, gap: 9, marginTop: index ? 10 : 0, opacity: progress(frame, 194 + index * 4, 208 + index * 4) }}>
              <span style={{ alignItems: 'center', background: '#DCFCE7', borderRadius: 999, color: GREEN, display: 'flex', height: 18, justifyContent: 'center', width: 18 }}>
                <LineIcon name="check" size={12} />
              </span>
              {item}
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

function Caption() {
  const frame = useCurrentFrame()
  const text = frame < 48
    ? 'Usuario conecta Conta Azul'
    : frame < 92
      ? 'confirma o acesso no modal'
      : frame < 138
        ? 'depois conecta Bling'
        : frame < 184
          ? 'depois conecta Meta Ads'
          : 'drawer lateral mostra a configuracao'

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
  const drawerShift = progress(frame, 184, 202)

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
        <main style={{ bottom: 0, left: 88, overflow: 'hidden', padding: '30px 34px', position: 'absolute', right: drawerShift * 390, top: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
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
        <ConnectionDrawer />
      </div>
      <Cursor />
      <Caption />
    </AbsoluteFill>
  )
}
