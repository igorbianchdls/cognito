import type { ReactElement } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

export const OTTO_ERP_HOME_DASHBOARD_DURATION = 240

const INK = '#111827'
const MUTED = '#6B7280'
const SOFT = '#F7F8FA'
const LINE = '#E6E8EC'
const GREEN = '#16A34A'
const RED = '#DC2626'
const BLUE = '#2563EB'
const TEAL = '#0F766E'

const navItems = [
  { icon: 'home', label: 'Inicio', active: true },
  { icon: 'chat', label: 'Chat' },
  { icon: 'wallet', label: 'Financeiro' },
  { icon: 'file', label: 'Fiscal' },
  { icon: 'chart', label: 'Relatorios' },
  { icon: 'plug', label: 'Integracoes' },
]

function ease(frame: number, start: number, end: number) {
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
      <div style={{ alignItems: 'center', bottom: 20, display: 'flex', flexDirection: 'column', left: 0, position: 'absolute', right: 0 }}>
        <div style={{ alignItems: 'center', background: '#E8EEF5', borderRadius: 999, color: '#475569', display: 'flex', fontSize: 13, fontWeight: 800, height: 34, justifyContent: 'center', width: 34 }}>AF</div>
      </div>
    </aside>
  )
}

function TopBar() {
  return (
    <div style={{ alignItems: 'center', background: '#FFFFFF', borderBottom: `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: '1fr 360px auto', height: 56, padding: '0 28px' }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
        <strong style={{ color: INK, fontSize: 17, fontWeight: 760 }}>Acme Inc.</strong>
        <span style={{ background: '#F3F4F6', borderRadius: 999, color: MUTED, fontSize: 12, fontWeight: 650, padding: '6px 10px' }}>ERP financeiro</span>
      </div>
      <div style={{ alignItems: 'center', background: SOFT, border: `1px solid ${LINE}`, borderRadius: 10, color: '#9CA3AF', display: 'flex', gap: 9, height: 36, padding: '0 13px' }}>
        <LineIcon name="search" size={16} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Buscar lancamentos, clientes ou notas...</span>
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 12, justifyContent: 'flex-end', paddingLeft: 18 }}>
        <span style={{ background: '#ECFDF3', border: '1px solid #BBF7D0', borderRadius: 999, color: GREEN, fontSize: 12, fontWeight: 760, padding: '7px 10px' }}>IA ativa</span>
        <button style={{ background: INK, border: 0, borderRadius: 10, color: '#FFFFFF', fontSize: 13, fontWeight: 740, height: 36, padding: '0 16px' }}>Nova rotina</button>
      </div>
    </div>
  )
}

function KpiCard({ color, delay, label, trend, value }: { color: string; delay: number; label: string; trend: string; value: string }) {
  const frame = useCurrentFrame()
  const show = ease(frame, delay, delay + 22)
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 16, opacity: show, padding: 18, transform: `translateY(${(1 - show) * 14}px)` }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: MUTED, fontSize: 13, fontWeight: 650 }}>{label}</span>
        <span style={{ background: `${color}14`, borderRadius: 999, color, fontSize: 12, fontWeight: 760, padding: '5px 8px' }}>{trend}</span>
      </div>
      <div style={{ color: INK, fontSize: 30, fontWeight: 760, letterSpacing: -0.8, marginTop: 12 }}>{value}</div>
      <Sparkline color={color} delay={delay + 8} />
    </div>
  )
}

function Sparkline({ color, delay }: { color: string; delay: number }) {
  const frame = useCurrentFrame()
  const draw = ease(frame, delay, delay + 34)
  const points = '0,34 30,31 60,32 90,25 120,24 150,20 180,22 212,16'
  return (
    <svg height="40" style={{ marginTop: 10, overflow: 'visible' }} viewBox="0 0 212 40" width="100%">
      <path d={`M${points.replaceAll(' ', ' L')}`} fill="none" stroke={color} strokeLinecap="round" strokeWidth="2.4" style={{ strokeDasharray: 280, strokeDashoffset: 280 - 280 * draw }} />
      <path d={`M${points.replaceAll(' ', ' L')} L212,40 L0,40 Z`} fill={color} opacity={0.07 * draw} />
    </svg>
  )
}

function AssistantPanel() {
  const frame = useCurrentFrame()
  const show = ease(frame, 42, 64)
  const items = [
    ['Conciliei bancos e cartoes', '3 divergencias precisam revisao'],
    ['Atualizei o caixa projetado', 'Runway subiu para 92 dias'],
    ['Identifiquei economia', 'R$ 18.400 em compras recorrentes'],
  ]

  return (
    <div style={{ background: '#0B1220', borderRadius: 18, color: '#FFFFFF', opacity: show, padding: 20, transform: `translateY(${(1 - show) * 14}px)` }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#86EFAC', fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>Otto IA</div>
          <div style={{ fontSize: 23, fontWeight: 780, letterSpacing: -0.5, marginTop: 6 }}>Resumo da operacao</div>
        </div>
        <span style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 999, color: '#D1FAE5', fontSize: 12, fontWeight: 760, padding: '7px 10px' }}>Agora</span>
      </div>
      <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
        {items.map(([title, subtitle], index) => {
          const itemIn = ease(frame, 62 + index * 10, 82 + index * 10)
          return (
            <div key={title} style={{ alignItems: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 13, display: 'grid', gap: 12, gridTemplateColumns: '28px 1fr', opacity: itemIn, padding: '12px 13px', transform: `translateY(${(1 - itemIn) * 10}px)` }}>
              <span style={{ alignItems: 'center', background: '#22C55E', borderRadius: 999, display: 'flex', fontSize: 14, fontWeight: 900, height: 28, justifyContent: 'center', width: 28 }}>✓</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 720 }}>{title}</div>
                <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 12, fontWeight: 500, marginTop: 3 }}>{subtitle}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CashChart() {
  const frame = useCurrentFrame()
  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
  const bars = [64, 88, 72, 104, 92, 126]
  const line = '18,122 112,102 206,106 300,76 394,86 488,54'

  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 18, padding: 20 }}>
      <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: INK, fontSize: 20, fontWeight: 780, letterSpacing: -0.35 }}>Fluxo de caixa</div>
          <div style={{ color: MUTED, fontSize: 13, fontWeight: 500, marginTop: 5 }}>Entradas, saidas e saldo projetado</div>
        </div>
        <span style={{ background: SOFT, border: `1px solid ${LINE}`, borderRadius: 999, color: MUTED, fontSize: 12, fontWeight: 680, padding: '7px 10px' }}>6 meses</span>
      </div>
      <div style={{ height: 238, marginTop: 18, position: 'relative' }}>
        {[0, 1, 2, 3].map((lineIndex) => <span key={lineIndex} style={{ background: '#EEF1F5', height: 1, left: 0, position: 'absolute', right: 0, top: 32 + lineIndex * 44 }} />)}
        <svg height="168" style={{ left: 0, overflow: 'visible', position: 'absolute', top: 28 }} viewBox="0 0 520 168" width="100%">
          <path d={`M${line.replaceAll(' ', ' L')}`} fill="none" stroke={GREEN} strokeLinecap="round" strokeWidth="3" style={{ strokeDasharray: 720, strokeDashoffset: 720 - 720 * ease(frame, 82, 126) }} />
        </svg>
        {bars.map((height, index) => {
          const bar = ease(frame, 72 + index * 7, 98 + index * 7)
          return (
            <div key={labels[index]} style={{ bottom: 24, left: 22 + index * 82, position: 'absolute', width: 40 }}>
              <div style={{ alignItems: 'flex-end', display: 'flex', height: 150 }}>
                <span style={{ background: index % 2 === 0 ? '#DBEAFE' : '#D1FAE5', borderRadius: '8px 8px 0 0', display: 'block', height: height * bar, width: 40 }} />
              </div>
              <div style={{ color: MUTED, fontSize: 12, fontWeight: 620, marginTop: 8, textAlign: 'center' }}>{labels[index]}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OperationList() {
  const frame = useCurrentFrame()
  const rows = [
    ['Conta Azul', '125 lancamentos importados', 'Sincronizado', GREEN],
    ['Banco Inter', '3 transacoes para revisar', 'Revisar', RED],
    ['Google Ads', 'Custo acima do previsto', 'Alerta', BLUE],
    ['NFS-e', '2 notas prontas para emitir', 'Pendente', TEAL],
  ]

  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ borderBottom: `1px solid ${LINE}`, padding: '17px 18px' }}>
        <div style={{ color: INK, fontSize: 18, fontWeight: 780 }}>Operacao de hoje</div>
        <div style={{ color: MUTED, fontSize: 12, fontWeight: 500, marginTop: 4 }}>Financeiro, fiscal e integracoes</div>
      </div>
      {rows.map(([title, subtitle, status, color], index) => {
        const rowIn = ease(frame, 96 + index * 8, 116 + index * 8)
        return (
          <div key={title} style={{ alignItems: 'center', borderBottom: index === rows.length - 1 ? 'none' : `1px solid ${LINE}`, display: 'grid', gap: 12, gridTemplateColumns: '34px 1fr auto', opacity: rowIn, padding: '14px 18px', transform: `translateX(${(1 - rowIn) * 14}px)` }}>
            <span style={{ alignItems: 'center', background: `${color}18`, borderRadius: 10, color, display: 'flex', fontSize: 12, fontWeight: 820, height: 34, justifyContent: 'center', width: 34 }}>{title.slice(0, 1)}</span>
            <div>
              <div style={{ color: INK, fontSize: 14, fontWeight: 720 }}>{title}</div>
              <div style={{ color: MUTED, fontSize: 12, fontWeight: 500, marginTop: 3 }}>{subtitle}</div>
            </div>
            <span style={{ background: `${color}12`, borderRadius: 999, color, fontSize: 11, fontWeight: 760, padding: '6px 8px' }}>{status}</span>
          </div>
        )
      })}
    </div>
  )
}

function FinancialTable() {
  const frame = useCurrentFrame()
  const rows = [
    ['Receita operacional', 'R$ 482.900', '+14,2%', GREEN],
    ['Contas a receber', 'R$ 192.500', '+8,1%', GREEN],
    ['Contas a pagar', 'R$ 63.980', '-3,4%', RED],
    ['Margem bruta', '38,4%', '+2,8 p.p.', BLUE],
    ['Caixa projetado', 'R$ 918.400', '+11,7%', GREEN],
  ]

  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ alignItems: 'center', borderBottom: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', padding: '15px 18px' }}>
        <div>
          <div style={{ color: INK, fontSize: 18, fontWeight: 780 }}>Resumo financeiro</div>
          <div style={{ color: MUTED, fontSize: 12, fontWeight: 500, marginTop: 4 }}>Periodo atual</div>
        </div>
        <span style={{ color: MUTED, fontSize: 12, fontWeight: 650 }}>Atualizado as 09:41</span>
      </div>
      {rows.map(([label, value, delta, color], index) => {
        const rowIn = ease(frame, 130 + index * 7, 150 + index * 7)
        return (
          <div key={label} style={{ alignItems: 'center', background: index % 2 === 0 ? '#FFFFFF' : '#FBFCFD', borderBottom: index === rows.length - 1 ? 'none' : `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: '1fr 150px 100px', opacity: rowIn, padding: '11px 18px', transform: `translateY(${(1 - rowIn) * 8}px)` }}>
            <span style={{ color: INK, fontSize: 13, fontWeight: 650 }}>{label}</span>
            <span style={{ color: INK, fontSize: 13, fontWeight: 760, textAlign: 'right' }}>{value}</span>
            <span style={{ color, fontSize: 12, fontWeight: 760, textAlign: 'right' }}>{delta}</span>
          </div>
        )
      })}
    </div>
  )
}

function ReportStrip() {
  const frame = useCurrentFrame()
  const items = [
    ['DRE', 'Lucro e margem'],
    ['Fluxo de caixa', 'Projetado 90 dias'],
    ['Balancete', 'Contas contabeis'],
    ['Notas fiscais', 'XML e PDF'],
  ]

  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {items.map(([title, subtitle], index) => {
        const show = ease(frame, 154 + index * 6, 174 + index * 6)
        return (
          <div key={title} style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 16, display: 'grid', gap: 12, gridTemplateColumns: '38px 1fr', opacity: show, padding: 14, transform: `translateY(${(1 - show) * 10}px)` }}>
            <span style={{ alignItems: 'center', background: SOFT, borderRadius: 12, color: INK, display: 'flex', fontSize: 16, fontWeight: 820, height: 38, justifyContent: 'center', width: 38 }}>↗</span>
            <div>
              <div style={{ color: INK, fontSize: 14, fontWeight: 750 }}>{title}</div>
              <div style={{ color: MUTED, fontSize: 11, fontWeight: 500, marginTop: 3 }}>{subtitle}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CashForecastCard({ delay, label, tone, value }: { delay: number; label: string; tone: string; value: string }) {
  const frame = useCurrentFrame()
  const show = ease(frame, delay, delay + 22)
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 18, opacity: show, padding: 20, transform: `translateY(${(1 - show) * 16}px)` }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: MUTED, fontSize: 13, fontWeight: 650 }}>{label}</span>
        <span style={{ background: `${tone}14`, borderRadius: 999, color: tone, fontSize: 12, fontWeight: 780, padding: '6px 9px' }}>Atual</span>
      </div>
      <div style={{ color: INK, fontSize: 34, fontWeight: 780, letterSpacing: -1, marginTop: 14 }}>{value}</div>
      <div style={{ background: SOFT, borderRadius: 999, height: 8, marginTop: 18, overflow: 'hidden' }}>
        <span style={{ background: tone, borderRadius: 999, display: 'block', height: 8, width: `${interpolate(show, [0, 1], [0, 74])}%` }} />
      </div>
    </div>
  )
}

function CashTimeline() {
  const frame = useCurrentFrame()
  const items = [
    ['Hoje', 'Saldo disponivel', 'R$ 918.400', GREEN],
    ['3 dias', 'Fornecedores e impostos', '-R$ 63.980', RED],
    ['7 dias', 'Recebimentos previstos', '+R$ 122.300', BLUE],
    ['15 dias', 'Caixa projetado', 'R$ 976.720', TEAL],
  ] as const

  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ borderBottom: `1px solid ${LINE}`, padding: '17px 20px' }}>
        <div style={{ color: INK, fontSize: 19, fontWeight: 800 }}>Linha do tempo do caixa</div>
        <div style={{ color: MUTED, fontSize: 12, fontWeight: 500, marginTop: 4 }}>Projecao de entradas e saidas</div>
      </div>
      {items.map(([date, title, value, color], index) => {
        const show = ease(frame, 166 + index * 10, 188 + index * 10)
        return (
          <div key={title} style={{ alignItems: 'center', borderBottom: index === items.length - 1 ? 'none' : `1px solid ${LINE}`, display: 'grid', gap: 16, gridTemplateColumns: '76px 1fr 150px', opacity: show, padding: '17px 20px', transform: `translateX(${(1 - show) * 18}px)` }}>
            <span style={{ background: SOFT, borderRadius: 999, color: MUTED, fontSize: 12, fontWeight: 760, padding: '7px 10px', textAlign: 'center' }}>{date}</span>
            <span style={{ color: INK, fontSize: 15, fontWeight: 690 }}>{title}</span>
            <span style={{ color, fontSize: 15, fontWeight: 820, textAlign: 'right' }}>{value}</span>
          </div>
        )
      })}
    </div>
  )
}

function CashTabContent() {
  const frame = useCurrentFrame()
  const panelIn = ease(frame, 142, 164)

  return (
    <div style={{ opacity: panelIn, transform: `translateY(${(1 - panelIn) * 18}px)` }}>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 24 }}>
        <CashForecastCard delay={150} label="Caixa disponivel" tone={GREEN} value="R$ 918.400" />
        <CashForecastCard delay={156} label="Runway" tone={BLUE} value="92 dias" />
        <CashForecastCard delay={162} label="Saidas 7 dias" tone={RED} value="R$ 63.980" />
        <CashForecastCard delay={168} label="Entradas 7 dias" tone={TEAL} value="R$ 122.300" />
      </div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.35fr 0.95fr', marginTop: 16 }}>
        <CashChart />
        <div style={{ background: '#0B1220', borderRadius: 18, color: '#FFFFFF', padding: 22 }}>
          <div style={{ color: '#86EFAC', fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>Alerta do Otto</div>
          <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.12, marginTop: 10 }}>O caixa fica saudavel se Mercado Sul pagar ate sexta.</div>
          <div style={{ color: 'rgba(255,255,255,0.64)', fontSize: 14, fontWeight: 500, lineHeight: 1.45, marginTop: 12 }}>Se atrasar mais 7 dias, recomendo segurar R$ 18.400 em compras recorrentes.</div>
          <div style={{ display: 'grid', gap: 9, marginTop: 20 }}>
            {['Cobrar Mercado Sul', 'Adiar compra Fornecedor Cloud', 'Aprovar impostos federais'].map((item, index) => {
              const itemIn = ease(frame, 178 + index * 9, 196 + index * 9)
              return (
                <div key={item} style={{ alignItems: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 13, display: 'grid', gap: 10, gridTemplateColumns: '24px 1fr', opacity: itemIn, padding: '11px 12px', transform: `translateY(${(1 - itemIn) * 10}px)` }}>
                  <span style={{ alignItems: 'center', background: '#22C55E', borderRadius: 999, display: 'flex', fontSize: 12, fontWeight: 900, height: 24, justifyContent: 'center', width: 24 }}>✓</span>
                  <span style={{ fontSize: 13, fontWeight: 650 }}>{item}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <CashTimeline />
      </div>
    </div>
  )
}

export function OttoErpHomeDashboard() {
  const frame = useCurrentFrame()
  const titleIn = ease(frame, 10, 30)
  const cash = money(interpolate(ease(frame, 28, 78), [0, 1], [720000, 918400]))
  const activeTab = frame >= 136 ? 'Caixa' : 'Resumo'
  const summaryOut = interpolate(frame, [126, 146], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#FFFFFF', color: INK, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar />
      <main style={{ background: '#FFFFFF', bottom: 0, left: 88, overflow: 'hidden', position: 'absolute', right: 0, top: 0 }}>
        <TopBar />
        <div style={{ padding: '28px 32px 0' }}>
          <div style={{ alignItems: 'end', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * 14}px)` }}>
              <h1 style={{ color: INK, fontSize: 42, fontWeight: 760, letterSpacing: -1.4, lineHeight: 1, margin: 0 }}>Olá, Márcio</h1>
              <p style={{ color: MUTED, fontSize: 15, fontWeight: 500, margin: '10px 0 0' }}>Aqui esta o resumo da sua operacao financeira hoje.</p>
            </div>
            <div style={{ alignItems: 'center', display: 'flex', gap: 9, opacity: ease(frame, 20, 38) }}>
              {['Resumo', 'Caixa', 'Fiscal', 'Relatorios'].map((tab, index) => (
                <span key={tab} style={{ background: activeTab === tab ? INK : '#FFFFFF', border: `1px solid ${activeTab === tab ? INK : LINE}`, borderRadius: 999, color: activeTab === tab ? '#FFFFFF' : MUTED, fontSize: 12, fontWeight: 720, padding: '8px 12px', transition: 'none' }}>{tab}</span>
              ))}
            </div>
          </div>
          <div style={{ opacity: summaryOut, pointerEvents: summaryOut > 0 ? 'auto' : 'none', position: summaryOut === 0 ? 'absolute' : 'relative', transform: `translateY(${(1 - summaryOut) * -18}px)` }}>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 24 }}>
              <KpiCard color={GREEN} delay={34} label="Caixa atual" trend="+11,7%" value={cash} />
              <KpiCard color={BLUE} delay={40} label="Receita prevista" trend="+14,2%" value="R$ 482.900" />
              <KpiCard color={RED} delay={46} label="A pagar" trend="3 alertas" value="R$ 63.980" />
              <KpiCard color={TEAL} delay={52} label="Margem" trend="+2,8 p.p." value="38,4%" />
            </div>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.45fr 0.85fr', marginTop: 16 }}>
              <CashChart />
              <AssistantPanel />
            </div>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '0.8fr 1.2fr', marginTop: 16 }}>
              <OperationList />
              <FinancialTable />
            </div>
            <div style={{ marginTop: 16 }}>
              <ReportStrip />
            </div>
          </div>
          <CashTabContent />
        </div>
      </main>
    </AbsoluteFill>
  )
}
