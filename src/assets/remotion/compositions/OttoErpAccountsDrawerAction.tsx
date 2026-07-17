import type { ReactElement } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

export const OTTO_ERP_ACCOUNTS_DRAWER_ACTION_DURATION = 300

const INK = '#111827'
const MUTED = '#6B7280'
const SOFT = '#F7F8FA'
const LINE = '#E6E8EC'
const GREEN = '#16A34A'
const RED = '#DC2626'
const BLUE = '#2563EB'
const TEAL = '#0F766E'
const AMBER = '#D97706'

const navItems = [
  { icon: 'home', label: 'Inicio' },
  { icon: 'chat', label: 'Chat' },
  { icon: 'wallet', label: 'Financeiro', active: true },
  { icon: 'file', label: 'Fiscal' },
  { icon: 'chart', label: 'Relatorios' },
  { icon: 'plug', label: 'Integracoes' },
]

const rows = [
  ['AWS Brasil', 'Infraestrutura recorrente e cloud', 'Pagar', '25 Jun', 'R$ 12.790,00', 'Aprovar', RED, 'AW'],
  ['Cliente Norte', 'NFS-e 2048 - consultoria operacional', 'Receber', '28 Jun', 'R$ 42.100,00', 'Previsto', GREEN, 'CN'],
  ['Google Ads', 'Campanhas de aquisicao e remarketing', 'Pagar', '30 Jun', 'R$ 8.420,00', 'Agendado', BLUE, 'G'],
  ['Mercado Sul', 'Pedido faturado com atraso', 'Receber', '02 Jul', 'R$ 28.900,00', 'Atrasado', RED, 'MS'],
  ['Fornecedor Cloud', 'Renovacao anual de software', 'Pagar', '05 Jul', 'R$ 18.400,00', 'Rascunho', TEAL, 'FC'],
  ['Loja Prime', 'Repasse ecommerce Shopify', 'Receber', '07 Jul', 'R$ 16.800,00', 'Confirmado', GREEN, 'LP'],
] as const

function ease(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function LineIcon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.85 }
  const paths: Record<string, ReactElement> = {
    chart: <path d="M4 16 V10 M10 16 V5 M16 16 V8 M3 17 H17" {...common} />,
    chat: <path d="M4 5 H16 V13 H8 L4 16 Z" {...common} />,
    file: <path d="M6 3 H12 L16 7 V17 H6 Z M12 3 V7 H16 M8 11 H14 M8 14 H13" {...common} />,
    home: <path d="M3 9 L10 3 L17 9 M5 8 V17 H15 V8 M8 17 V12 H12 V17" {...common} />,
    plug: <path d="M7 3 V8 M13 3 V8 M5 8 H15 V11 A5 5 0 0 1 10 16 A5 5 0 0 1 5 11 Z M10 16 V18" {...common} />,
    search: <path d="M9 4 A5 5 0 1 1 9 14 A5 5 0 1 1 9 4 M13 13 L17 17" {...common} />,
    wallet: <path d="M4 6 H16 V15 H4 Z M13 10 H16 M6 6 V4 H15" {...common} />,
  }

  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 20 20" width={size}>
      {paths[name] || paths.file}
    </svg>
  )
}

function Sidebar() {
  return (
    <aside style={{ background: '#FAFAFA', borderRight: `1px solid ${LINE}`, bottom: 0, left: 0, position: 'absolute', top: 0, width: 88 }}>
      <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 5, height: 68, justifyContent: 'center' }}>
        <Img src={staticFile('logoOttoIcon.svg')} style={{ display: 'block', height: 24, objectFit: 'contain', width: 24 }} />
        <span style={{ color: '#181818', fontSize: 12, fontWeight: 650, lineHeight: 1 }}>Otto</span>
      </div>
      <div style={{ display: 'grid', gap: 10, justifyItems: 'center', paddingTop: 6 }}>
        {navItems.map((item) => (
          <div
            key={item.label}
            style={{
              alignItems: 'center',
              background: item.active ? '#ECFDF3' : 'transparent',
              borderRadius: 14,
              color: item.active ? GREEN : '#4D4D4D',
              display: 'flex',
              flexDirection: 'column',
              fontSize: 10,
              fontWeight: item.active ? 760 : 520,
              gap: 5,
              height: 58,
              justifyContent: 'center',
              width: 72,
            }}
          >
            <LineIcon name={item.icon} size={19} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}

function TopBar() {
  return (
    <div style={{ alignItems: 'center', background: '#FFFFFF', borderBottom: `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: '1fr 360px auto', height: 56, padding: '0 28px' }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
        <strong style={{ color: INK, fontSize: 17, fontWeight: 760 }}>Acme Inc.</strong>
        <span style={{ background: '#F3F4F6', borderRadius: 999, color: MUTED, fontSize: 12, fontWeight: 650, padding: '6px 10px' }}>Financeiro</span>
      </div>
      <div style={{ alignItems: 'center', background: SOFT, border: `1px solid ${LINE}`, borderRadius: 10, color: '#9CA3AF', display: 'flex', gap: 9, height: 36, padding: '0 13px' }}>
        <LineIcon name="search" size={16} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Buscar cliente, fornecedor ou lançamento...</span>
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 12, justifyContent: 'flex-end', paddingLeft: 18 }}>
        <span style={{ background: '#ECFDF3', border: '1px solid #BBF7D0', borderRadius: 999, color: GREEN, fontSize: 12, fontWeight: 760, padding: '7px 10px' }}>Otto IA ativo</span>
      </div>
    </div>
  )
}

function MetricCard({ delay, label, tone, value }: { delay: number; label: string; tone: string; value: string }) {
  const frame = useCurrentFrame()
  const show = ease(frame, delay, delay + 20)
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 18, opacity: show, padding: 18, transform: `translateY(${(1 - show) * 14}px)` }}>
      <span style={{ color: MUTED, fontSize: 13, fontWeight: 650 }}>{label}</span>
      <div style={{ color: INK, fontSize: 29, fontWeight: 790, letterSpacing: -0.8, marginTop: 13 }}>{value}</div>
      <span style={{ background: `${tone}12`, borderRadius: 999, color: tone, display: 'inline-block', fontSize: 12, fontWeight: 780, marginTop: 12, padding: '6px 9px' }}>Atualizado</span>
    </div>
  )
}

function StatusPill({ color, label }: { color: string; label: string }) {
  return <span style={{ background: `${color}12`, borderRadius: 999, color, display: 'inline-block', fontSize: 12, fontWeight: 760, padding: '7px 9px', textAlign: 'center' }}>{label}</span>
}

function AccountsTable() {
  const frame = useCurrentFrame()

  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ alignItems: 'center', borderBottom: `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: '1fr auto', padding: '19px 22px' }}>
        <div>
          <div style={{ color: INK, fontSize: 20, fontWeight: 820, letterSpacing: -0.25 }}>Contas a pagar e receber</div>
          <div style={{ color: MUTED, fontSize: 13, fontWeight: 500, marginTop: 5 }}>Visão operacional dos próximos vencimentos</div>
        </div>
        <button style={{ background: INK, border: 0, borderRadius: 12, color: '#FFFFFF', fontSize: 13, fontWeight: 760, height: 38, padding: '0 15px' }}>Novo lançamento</button>
      </div>
      <div style={{ background: '#FBFCFD', borderBottom: `1px solid ${LINE}`, color: '#8A94A6', display: 'grid', fontSize: 11, fontWeight: 780, gridTemplateColumns: '1.35fr 110px 118px 132px 110px', padding: '10px 22px', textTransform: 'uppercase' }}>
        <span>Conta</span>
        <span>Tipo</span>
        <span>Vencimento</span>
        <span>Valor</span>
        <span>Status</span>
      </div>
      {rows.map(([name, description, type, due, value, status, color, initials], index) => {
        const rowIn = ease(frame, 56 + index * 9, 78 + index * 9)
        return (
          <div key={`${name}-${type}`} style={{ alignItems: 'center', borderBottom: index === rows.length - 1 ? 'none' : `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: '1.35fr 110px 118px 132px 110px', minHeight: 72, opacity: rowIn, padding: '0 22px', transform: `translateX(${(1 - rowIn) * 18}px)` }}>
            <div style={{ alignItems: 'center', display: 'grid', gap: 13, gridTemplateColumns: '42px 1fr', minWidth: 0 }}>
              <span style={{ alignItems: 'center', background: `${color}14`, border: `1px solid ${color}22`, borderRadius: 13, color, display: 'flex', fontSize: 13, fontWeight: 850, height: 42, justifyContent: 'center', width: 42 }}>{initials}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: INK, fontSize: 14, fontWeight: 760, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                <div style={{ color: MUTED, fontSize: 12, fontWeight: 500, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{description}</div>
              </div>
            </div>
            <span style={{ color: type === 'Receber' ? GREEN : RED, fontSize: 13, fontWeight: 740 }}>{type}</span>
            <span style={{ color: INK, fontSize: 13, fontWeight: 650 }}>{due}</span>
            <span style={{ color: INK, fontSize: 14, fontWeight: 780 }}>{value}</span>
            <StatusPill color={status === 'Atrasado' || status === 'Aprovar' ? RED : status === 'Rascunho' ? AMBER : color} label={status} />
          </div>
        )
      })}
    </div>
  )
}

function CursorPointer() {
  const frame = useCurrentFrame()
  const click = ease(frame, 138, 152)
  const x = interpolate(ease(frame, 112, 144), [0, 1], [820, 1042], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = interpolate(ease(frame, 112, 144), [0, 1], [390, 192], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ filter: 'drop-shadow(0 8px 10px rgba(15, 23, 42, 0.18))', left: x, opacity: ease(frame, 104, 122) * interpolate(frame, [164, 182], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), position: 'absolute', top: y, transform: `scale(${1 - click * 0.12})`, zIndex: 20 }}>
      <svg height="38" viewBox="0 0 42 42" width="38">
        <path d="M8 5L32 24L21 26L16 37L8 5Z" fill="#111111" />
        <path d="M18 25L23 36" stroke="#ffffff" strokeLinecap="round" strokeWidth="3" />
      </svg>
    </div>
  )
}

function AccountDrawer() {
  const frame = useCurrentFrame()
  const open = ease(frame, 150, 178)
  const save = ease(frame, 246, 264)
  const fields = [
    ['Tipo', 'Conta a pagar'],
    ['Fornecedor', 'Fornecedor Cloud'],
    ['Descrição', 'Renovação anual de software'],
    ['Vencimento', '05 Jul 2026'],
    ['Valor', 'R$ 18.400,00'],
    ['Categoria', 'Software e infraestrutura'],
  ]

  return (
    <div style={{ background: '#FFFFFF', borderLeft: `1px solid ${LINE}`, bottom: 0, boxShadow: '-24px 0 60px rgba(15, 23, 42, 0.10)', opacity: open, padding: 24, position: 'absolute', right: 0, top: 0, transform: `translateX(${(1 - open) * 390}px)`, width: 388, zIndex: 12 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: INK, fontSize: 22, fontWeight: 820, letterSpacing: -0.4 }}>Novo lançamento</div>
          <div style={{ color: MUTED, fontSize: 13, fontWeight: 500, marginTop: 5 }}>Registrar conta no ERP</div>
        </div>
        <span style={{ alignItems: 'center', background: SOFT, borderRadius: 999, color: MUTED, display: 'flex', fontSize: 18, fontWeight: 500, height: 34, justifyContent: 'center', width: 34 }}>×</span>
      </div>
      <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        {fields.map(([label, value], index) => {
          const fieldIn = ease(frame, 174 + index * 8, 194 + index * 8)
          return (
            <div key={label} style={{ opacity: fieldIn, transform: `translateY(${(1 - fieldIn) * 10}px)` }}>
              <label style={{ color: MUTED, display: 'block', fontSize: 11, fontWeight: 780, marginBottom: 6, textTransform: 'uppercase' }}>{label}</label>
              <div style={{ alignItems: 'center', background: SOFT, border: `1px solid ${LINE}`, borderRadius: 12, color: INK, display: 'flex', fontSize: 14, fontWeight: 680, height: 42, padding: '0 13px' }}>{value}</div>
            </div>
          )
        })}
      </div>
      <div style={{ background: '#ECFDF3', border: '1px solid #BBF7D0', borderRadius: 14, color: GREEN, fontSize: 13, fontWeight: 650, lineHeight: 1.35, marginTop: 18, opacity: ease(frame, 228, 246), padding: 13 }}>
        Otto vinculou este lançamento ao fornecedor e sugeriu recorrência automática.
      </div>
      <button style={{ background: save > 0.5 ? GREEN : INK, border: 0, borderRadius: 13, bottom: 24, color: '#FFFFFF', fontSize: 14, fontWeight: 800, height: 46, left: 24, position: 'absolute', right: 24 }}>{save > 0.5 ? 'Lançamento registrado' : 'Registrar lançamento'}</button>
    </div>
  )
}

export function OttoErpAccountsDrawerAction() {
  return (
    <AbsoluteFill style={{ background: '#FFFFFF', color: INK, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar />
      <main style={{ background: '#FFFFFF', bottom: 0, left: 88, overflow: 'hidden', position: 'absolute', right: 0, top: 0 }}>
        <TopBar />
        <div style={{ padding: '28px 32px 0', position: 'relative' }}>
          <div style={{ alignItems: 'end', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ color: INK, fontSize: 42, fontWeight: 760, letterSpacing: -1.4, lineHeight: 1, margin: 0 }}>Contas a pagar e receber</h1>
              <p style={{ color: MUTED, fontSize: 15, fontWeight: 500, margin: '10px 0 0' }}>Registre, acompanhe e automatize lançamentos financeiros.</p>
            </div>
            <div style={{ alignItems: 'center', display: 'flex', gap: 9 }}>
              {['Todos', 'A pagar', 'A receber', 'Atrasados'].map((tab, index) => (
                <span key={tab} style={{ background: index === 0 ? INK : '#FFFFFF', border: `1px solid ${index === 0 ? INK : LINE}`, borderRadius: 999, color: index === 0 ? '#FFFFFF' : MUTED, fontSize: 12, fontWeight: 720, padding: '8px 12px' }}>{tab}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 24 }}>
            <MetricCard delay={18} label="A pagar" tone={RED} value="R$ 63.980" />
            <MetricCard delay={24} label="A receber" tone={GREEN} value="R$ 192.500" />
            <MetricCard delay={30} label="Em atraso" tone={RED} value="R$ 28.900" />
            <MetricCard delay={36} label="Registradas hoje" tone={BLUE} value="12" />
          </div>
          <div style={{ marginTop: 16 }}>
            <AccountsTable />
          </div>
          <CursorPointer />
        </div>
        <AccountDrawer />
      </main>
    </AbsoluteFill>
  )
}
