import type { ReactElement } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

export const OTTO_ERP_HOME_DASHBOARD_DURATION = 240

const LINE = '#E6EAF0'
const INK = '#182033'
const MUTED = '#697386'
const GREEN = '#157A5A'
const BLUE = '#2563EB'
const RED = '#DC2626'
const TEAL = '#0F766E'

const navItems = [
  { icon: 'home', label: 'Home', active: true },
  { icon: 'chat', label: 'Chat' },
  { icon: 'wallet', label: 'Financeiro' },
  { icon: 'file', label: 'Fiscal' },
  { icon: 'chart', label: 'Dashboards' },
  { icon: 'plug', label: 'Integracoes' },
]

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function money(value: number) {
  return `R$ ${Math.round(value).toLocaleString('pt-BR')}`
}

function LineIcon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.9 }
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

function OttoSidebar() {
  const frame = useCurrentFrame()

  return (
    <aside style={{ background: '#FAFAFA', borderRight: `1px solid ${LINE}`, bottom: 0, left: 0, position: 'absolute', top: 0, width: 88 }}>
      <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 5, height: 66, justifyContent: 'center' }}>
        <Img src={staticFile('logoOttoIcon.svg')} style={{ display: 'block', height: 23, objectFit: 'contain', width: 23 }} />
        <span style={{ color: '#181818', fontSize: 12, fontWeight: 650, lineHeight: 1 }}>Otto</span>
      </div>
      <div style={{ display: 'grid', gap: 10, justifyItems: 'center', paddingTop: 4 }}>
        {navItems.map((item, index) => (
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

function TopBar() {
  return (
    <div style={{ alignItems: 'center', background: '#FFFFFF', borderBottom: `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: '1fr 340px auto', height: 54, padding: '0 22px' }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
        <Img src={staticFile('logoOttoIcon.svg')} style={{ height: 20, width: 20 }} />
        <strong style={{ color: INK, fontSize: 18, fontWeight: 780 }}>Otto ERP</strong>
        <span style={{ color: MUTED, fontSize: 13, fontWeight: 560 }}>Acme Inc.</span>
      </div>
      <div style={{ alignItems: 'center', background: '#F8FAFC', border: `1px solid ${LINE}`, borderRadius: 8, color: '#8A94A6', display: 'flex', gap: 8, height: 34, padding: '0 12px' }}>
        <LineIcon name="search" size={16} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Buscar no ERP...</span>
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 10, justifyContent: 'flex-end', paddingLeft: 18 }}>
        <button style={{ background: '#FFFFFF', border: `1px solid ${TEAL}`, borderRadius: 4, color: TEAL, fontSize: 13, fontWeight: 700, height: 34, padding: '0 16px' }}>Editar</button>
        <button style={{ background: TEAL, border: 0, borderRadius: 4, color: '#FFFFFF', fontSize: 13, fontWeight: 740, height: 34, padding: '0 18px' }}>Criar visao</button>
      </div>
    </div>
  )
}

function ModuleNav() {
  const tabs = ['Resumo executivo', 'Caixa', 'Contas a pagar', 'Contas a receber', 'Fiscal', 'Relatorios']
  return (
    <div style={{ alignItems: 'end', borderBottom: `1px solid ${LINE}`, display: 'flex', gap: 34, height: 52, padding: '0 22px' }}>
      {tabs.map((tab, index) => (
        <div key={tab} style={{ color: index === 0 ? INK : '#737B8A', fontSize: 14, fontWeight: index === 0 ? 740 : 540, height: 52, lineHeight: '52px', position: 'relative' }}>
          {tab}
          {index === 0 ? <span style={{ background: TEAL, bottom: -1, height: 2, left: 0, position: 'absolute', right: 0 }} /> : null}
        </div>
      ))}
    </div>
  )
}

function StatCard({ color, delay, label, trend, value }: { color: string; delay: number; label: string; trend: string; value: string }) {
  const frame = useCurrentFrame()
  const show = progress(frame, delay, delay + 22)
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 2, minHeight: 116, opacity: show, padding: 18, transform: `translateY(${(1 - show) * 16}px)` }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#3E4758', fontSize: 15, fontWeight: 680 }}>{label}</span>
        <span style={{ color, fontSize: 12, fontWeight: 760 }}>{trend}</span>
      </div>
      <div style={{ color: INK, fontSize: 30, fontWeight: 540, letterSpacing: -0.3, marginTop: 14 }}>{value}</div>
      <Sparkline color={color} delay={delay + 8} />
    </div>
  )
}

function Sparkline({ color, delay }: { color: string; delay: number }) {
  const frame = useCurrentFrame()
  const draw = progress(frame, delay, delay + 32)
  const points = '0,35 26,32 52,33 78,28 104,26 130,22 156,24 182,18 210,16'
  return (
    <svg height="42" style={{ marginTop: 10, overflow: 'visible' }} viewBox="0 0 210 42" width="100%">
      <path d={`M${points.replaceAll(' ', ' L')}`} fill="none" stroke={color} strokeLinecap="round" strokeWidth="2.4" style={{ strokeDasharray: 280, strokeDashoffset: 280 - 280 * draw }} />
      <path d={`M${points.replaceAll(' ', ' L')} L210,42 L0,42 Z`} fill={color} opacity={0.09 * draw} />
    </svg>
  )
}

function InsightBanner() {
  const frame = useCurrentFrame()
  const show = progress(frame, 24, 46)
  return (
    <div style={{ alignItems: 'center', background: '#F6F1FF', border: '1px solid #E9D5FF', display: 'grid', gridTemplateColumns: '34px 1fr auto', minHeight: 72, opacity: show, padding: '0 18px', transform: `translateY(${(1 - show) * 14}px)` }}>
      <span style={{ alignItems: 'center', color: '#8B5CF6', display: 'flex', fontSize: 30, fontWeight: 800, justifyContent: 'center' }}>*</span>
      <span style={{ color: INK, fontSize: 18, fontWeight: 520 }}>Desde ontem, a receita prevista aumentou em <strong style={{ fontWeight: 820 }}>R$ 124.300</strong> e 3 pagamentos precisam de aprovacao.</span>
      <span style={{ color: '#8B5CF6', fontSize: 22 }}>⋮</span>
    </div>
  )
}

function CashflowChart() {
  const frame = useCurrentFrame()
  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Total']
  const values = [160, 40, -80, 120, -50, 300, 320]
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 2, padding: 18 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <strong style={{ color: INK, fontSize: 16, fontWeight: 740 }}>Fluxo de caixa liquido</strong>
        <span style={{ color: MUTED, fontSize: 12, fontWeight: 540 }}>Ultimos 6 meses</span>
      </div>
      <div style={{ height: 174, marginTop: 18, position: 'relative' }}>
        {[0, 1, 2, 3].map((line) => <span key={line} style={{ background: '#EFF3F8', height: 1, left: 26, position: 'absolute', right: 12, top: 18 + line * 38 }} />)}
        {values.map((value, index) => {
          const bar = progress(frame, 72 + index * 5, 96 + index * 5)
          const height = Math.abs(value) * 0.32 * bar
          const positive = value >= 0
          return (
            <div key={labels[index]} style={{ bottom: 20, left: 54 + index * 72, position: 'absolute', width: 34 }}>
              <div style={{ color: MUTED, fontSize: 10, fontWeight: 650, height: 14, textAlign: 'center' }}>{value > 0 ? `${value}K` : `(${Math.abs(value)}K)`}</div>
              <div style={{ alignItems: positive ? 'flex-end' : 'flex-start', display: 'flex', height: 102 }}>
                <span style={{ background: index === values.length - 1 ? '#5CA27B' : positive ? '#72B6C8' : '#DBA586', display: 'block', height, width: 34 }} />
              </div>
              <div style={{ color: MUTED, fontSize: 11, fontWeight: 520, textAlign: 'center' }}>{labels[index]}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SubsidiaryNavigator() {
  const frame = useCurrentFrame()
  const show = progress(frame, 82, 108)
  const nodes = [
    { x: 180, y: 28, label: 'Otto Brasil', flag: 'BR' },
    { x: 82, y: 96, label: 'Filial Sul', flag: 'BR' },
    { x: 280, y: 96, label: 'Ecommerce', flag: 'US', active: true },
    { x: 42, y: 162, label: 'Varejo', flag: 'BR' },
    { x: 234, y: 162, label: 'Servicos', flag: 'PT' },
  ]
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 2, opacity: show, padding: 18, transform: `translateY(${(1 - show) * 14}px)` }}>
      <strong style={{ color: INK, fontSize: 16, fontWeight: 740 }}>Mapa da operacao</strong>
      <div style={{ height: 205, marginTop: 14, position: 'relative' }}>
        <svg height="205" style={{ inset: 0, position: 'absolute' }} width="100%">
          <path d="M250 55 V82 M250 82 H150 M250 82 H350 M150 125 V148 M350 125 V148" fill="none" stroke="#CBD5E1" strokeWidth="1.4" />
        </svg>
        {nodes.map((node, index) => {
          const nodeIn = progress(frame, 92 + index * 7, 110 + index * 7)
          return (
            <div key={node.label} style={{ background: node.active ? '#D6F2F4' : '#FFFFFF', border: `1px solid ${node.active ? '#80C7CE' : '#CBD5E1'}`, color: INK, left: node.x, opacity: nodeIn, padding: '8px 10px', position: 'absolute', top: node.y, transform: `translateY(${(1 - nodeIn) * 10}px)`, width: 132 }}>
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 13, fontWeight: 720 }}>{node.label}</strong>
                <span style={{ color: MUTED, fontSize: 11, fontWeight: 760 }}>{node.flag}</span>
              </div>
              <div style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>Financeiro · BRL</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReportShortcut({ delay, label, tone }: { delay: number; label: string; tone: string }) {
  const frame = useCurrentFrame()
  const show = progress(frame, delay, delay + 18)
  return (
    <div style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${LINE}`, display: 'flex', gap: 14, height: 64, opacity: show, padding: '0 18px', transform: `translateY(${(1 - show) * 12}px)` }}>
      <span style={{ alignItems: 'center', background: `${tone}22`, borderRadius: 999, color: tone, display: 'flex', fontSize: 18, fontWeight: 780, height: 36, justifyContent: 'center', width: 36 }}>↗</span>
      <span style={{ color: INK, fontSize: 17, fontWeight: 620 }}>{label}</span>
    </div>
  )
}

function BalanceTable() {
  const frame = useCurrentFrame()
  const rows = ['Ativo circulante', 'Bancos', 'Contas a receber', 'Fornecedores', 'Impostos', 'Resultado operacional']
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ color: INK, fontSize: 15, fontWeight: 740, padding: '13px 16px' }}>Resumo financeiro</div>
      <div style={{ background: '#F8FAFC', borderBottom: `1px solid ${LINE}`, borderTop: `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: '1.3fr repeat(5, 1fr)', padding: '9px 16px' }}>
        {['Conta', 'Jul', 'Ago', 'Set', 'Out', 'Nov'].map((label) => <span key={label} style={{ color: MUTED, fontSize: 11, fontWeight: 700 }}>{label}</span>)}
      </div>
      {rows.map((row, index) => {
        const show = progress(frame, 140 + index * 5, 156 + index * 5)
        return (
          <div key={row} style={{ background: index === rows.length - 1 ? '#EAF4F3' : '#FFFFFF', borderBottom: `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: '1.3fr repeat(5, 1fr)', opacity: show, padding: '8px 16px', transform: `translateX(${(1 - show) * 14}px)` }}>
            <span style={{ color: INK, fontSize: 12, fontWeight: index === rows.length - 1 ? 760 : 520 }}>{row}</span>
            {[0, 1, 2, 3, 4].map((month) => <span key={month} style={{ color: index === rows.length - 1 ? TEAL : '#4B5563', fontSize: 12, fontWeight: index === rows.length - 1 ? 740 : 520 }}>{money(12345 + index * 1860 + month * 480)}</span>)}
          </div>
        )
      })}
    </div>
  )
}

export function OttoErpHomeDashboard() {
  const frame = useCurrentFrame()
  const titleIn = progress(frame, 12, 34)
  const cash = money(interpolate(progress(frame, 32, 80), [0, 1], [1700000, 2523672]))
  const runway = money(interpolate(progress(frame, 38, 86), [0, 1], [1300000, 2523672]))

  return (
    <AbsoluteFill style={{ background: '#EEF3F4', color: INK, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <OttoSidebar />
      <main style={{ background: '#F8FAFC', bottom: 0, left: 88, overflow: 'hidden', position: 'absolute', right: 0, top: 0 }}>
        <TopBar />
        <section style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 54 }}>
          <div style={{ alignItems: 'center', display: 'flex', height: 82, justifyContent: 'space-between', padding: '0 22px' }}>
            <div>
              <h1 style={{ color: INK, fontSize: 38, fontWeight: 600, letterSpacing: -1.1, lineHeight: 1, margin: 0, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 18}px)` }}>Dashboard</h1>
              <p style={{ color: MUTED, fontSize: 14, fontWeight: 520, margin: '8px 0 0', opacity: titleIn }}>Visao inicial do ERP financeiro, fiscal e operacional.</p>
            </div>
            <div style={{ alignItems: 'center', display: 'flex', gap: 10, opacity: progress(frame, 28, 48) }}>
              <span style={{ background: '#ECFDF3', border: '1px solid #BBF7D0', borderRadius: 999, color: GREEN, fontSize: 13, fontWeight: 760, padding: '8px 12px' }}>IA ativa</span>
              <span style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 999, color: MUTED, fontSize: 13, fontWeight: 620, padding: '8px 12px' }}>Atualizado agora</span>
            </div>
          </div>
          <ModuleNav />
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1.2fr 1fr 1fr', padding: 18 }}>
            <div style={{ display: 'grid', gridColumn: 'span 1', gridTemplateRows: '72px 1fr', gap: 14 }}>
              <InsightBanner />
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
                <StatCard color={GREEN} delay={44} label="Receita" trend="↗ 12%" value="R$ 56.209" />
                <StatCard color={RED} delay={50} label="Custo de vendas" trend="↘ 12%" value="R$ 42.051" />
                <StatCard color={GREEN} delay={56} label="Lucro bruto" trend="↗ 12%" value="R$ 82.051" />
                <StatCard color={GREEN} delay={62} label="Despesas" trend="↗ 8%" value="R$ 882.051" />
              </div>
            </div>
            <StatCard color={TEAL} delay={34} label="Caixa" trend="↗ 12%" value={cash} />
            <StatCard color={BLUE} delay={40} label="Runway de caixa" trend="↗ 12%" value={runway} />
            <div style={{ gridColumn: 'span 2' }}>
              <CashflowChart />
            </div>
            <SubsidiaryNavigator />
            <div style={{ display: 'grid', gap: 12, gridColumn: 'span 3', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <ReportShortcut delay={124} label="Balanco patrimonial" tone="#67B7C7" />
              <ReportShortcut delay={130} label="DRE" tone="#8BCFAF" />
              <ReportShortcut delay={136} label="Fluxo de caixa" tone="#A78BFA" />
              <ReportShortcut delay={142} label="Balancete" tone="#67B7C7" />
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <BalanceTable />
            </div>
          </div>
        </section>
      </main>
    </AbsoluteFill>
  )
}
