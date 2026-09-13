import type { ReactNode } from 'react'
import {
  ArrowDown,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  FileText,
  Home,
  MoreHorizontal,
  MoreVertical,
  Search,
  Settings,
  SlidersHorizontal,
  Truck,
  Users,
} from 'lucide-react'
import { AbsoluteFill } from 'remotion'

export const OTTO_RAMP_PAYABLES_UI_DURATION = 300

const FONT = 'Arial, Helvetica, sans-serif'
const INK = '#121212'
const MUTED = '#737373'
const LINE = '#e7e7e5'
const SIDEBAR = '#f7f6f3'
const ACCENT = '#d7f414'

type NavItemProps = {
  children: ReactNode
  icon: ReactNode
  active?: boolean
  trailing?: ReactNode
}

function NavItem({ active, children, icon, trailing }: NavItemProps) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: active ? '#e9e6e2' : 'transparent',
        borderRadius: 6,
        color: active ? INK : '#5f5f5f',
        display: 'flex',
        fontSize: 15,
        fontWeight: active ? 560 : 440,
        height: 38,
        margin: '0 10px',
        padding: '0 15px',
      }}
    >
      <span style={{ alignItems: 'center', display: 'flex', height: 20, justifyContent: 'center', marginRight: 13, width: 20 }}>{icon}</span>
      <span>{children}</span>
      {trailing ? <span style={{ marginLeft: 'auto' }}>{trailing}</span> : null}
    </div>
  )
}

function Sidebar() {
  return (
    <aside style={{ background: SIDEBAR, borderRight: `1px solid ${LINE}`, bottom: 0, left: 0, position: 'absolute', top: 0, width: 230 }}>
      <div style={{ alignItems: 'center', display: 'flex', height: 65, padding: '0 23px' }}>
        <span style={{ color: '#0b0b0b', fontSize: 29, fontWeight: 800, letterSpacing: 0, lineHeight: 1 }}>otto</span>
      </div>

      <div style={{ alignItems: 'center', color: '#616161', display: 'flex', fontSize: 15, height: 42, padding: '0 24px' }}>
        <Search size={18} strokeWidth={1.7} />
        <span style={{ marginLeft: 11 }}>Pesquisar</span>
        <span style={{ alignItems: 'center', border: '1px solid #dedbd6', borderRadius: 4, color: '#5b5b5b', display: 'flex', fontSize: 12, gap: 8, height: 25, marginLeft: 'auto', padding: '0 7px' }}>
          <span>⌘</span><span>K</span>
        </span>
      </div>

      <nav style={{ marginTop: 16 }}>
        <NavItem icon={<Home size={18} strokeWidth={1.55} />}>Visão geral</NavItem>
        <NavItem icon={<BarChart3 size={18} strokeWidth={1.55} />}>Vendas</NavItem>
        <NavItem icon={<BriefcaseBusiness size={18} strokeWidth={1.55} />} trailing={<ChevronUp size={15} strokeWidth={1.7} />}>Financeiro</NavItem>
        <div style={{ margin: '0 10px 13px 45px' }}>
          <div style={{ alignItems: 'center', background: '#ebe8e5', borderRadius: 6, color: INK, display: 'flex', fontSize: 14, fontWeight: 520, height: 36, paddingLeft: 13 }}>Contas a pagar</div>
          <div style={{ alignItems: 'center', color: '#686868', display: 'flex', fontSize: 14, height: 36, paddingLeft: 13 }}>Contas a receber</div>
          <div style={{ alignItems: 'center', color: '#686868', display: 'flex', fontSize: 14, height: 36, paddingLeft: 13 }}>Conciliação</div>
        </div>
        <NavItem icon={<FileText size={18} strokeWidth={1.55} />}>Notas fiscais</NavItem>
        <NavItem icon={<Users size={18} strokeWidth={1.55} />}>Clientes</NavItem>
        <NavItem icon={<Truck size={18} strokeWidth={1.55} />}>Fornecedores</NavItem>
        <NavItem icon={<BarChart3 size={18} strokeWidth={1.55} />}>Relatórios</NavItem>
      </nav>

      <div style={{ bottom: 20, left: 0, position: 'absolute', right: 0 }}>
        <NavItem icon={<Settings size={18} strokeWidth={1.55} />}>Configurações</NavItem>
        <NavItem icon={<CircleHelp size={18} strokeWidth={1.55} />}>Ajuda</NavItem>
      </div>
    </aside>
  )
}

type VendorLogoProps = { type: 'building' | 'microsoft' | 'aurora' | 'dell' | 'vivo' | 'cr' | 'energy' | 'kalunga' }

function VendorLogo({ type }: VendorLogoProps) {
  if (type === 'building') {
    return (
      <span style={{ alignItems: 'flex-end', display: 'flex', gap: 2, height: 36, justifyContent: 'center', width: 38 }}>
        <i style={{ background: '#2f71b7', height: 22, width: 7 }} />
        <i style={{ background: '#397fc1', height: 31, width: 8 }} />
        <i style={{ background: '#2f71b7', height: 25, width: 7 }} />
        <i style={{ background: '#4f8dc7', height: 16, width: 6 }} />
      </span>
    )
  }
  if (type === 'microsoft') {
    return (
      <span style={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 10px)', height: 22, width: 22 }}>
        <i style={{ background: '#f25022' }} /><i style={{ background: '#7fba00' }} /><i style={{ background: '#00a4ef' }} /><i style={{ background: '#ffb900' }} />
      </span>
    )
  }
  if (type === 'aurora') {
    return <span style={{ background: 'linear-gradient(135deg,#5331b9 0 48%,#dc389a 49% 72%,#ff7845 73%)', clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', height: 32, width: 34 }} />
  }
  if (type === 'dell') return <span style={{ alignItems: 'center', border: '2px solid #0586c3', borderRadius: 999, color: '#057db4', display: 'flex', fontSize: 9, fontWeight: 800, height: 35, justifyContent: 'center', width: 35 }}>DELL</span>
  if (type === 'vivo') return <span style={{ color: '#59117e', fontSize: 18, fontWeight: 800 }}>vivo</span>
  if (type === 'cr') return <span style={{ color: '#0e4b68', fontSize: 24, fontWeight: 650 }}>CR</span>
  if (type === 'energy') {
    return (
      <span style={{ display: 'flex', height: 29, position: 'relative', width: 39 }}>
        <i style={{ background: '#13aa54', borderRadius: '100% 0 100% 100%', height: 20, left: 0, position: 'absolute', top: 7, transform: 'rotate(35deg)', width: 14 }} />
        <i style={{ background: '#00a7df', borderRadius: '100% 0 100% 100%', height: 23, left: 12, position: 'absolute', top: 3, transform: 'rotate(35deg)', width: 14 }} />
        <i style={{ background: '#f4a91d', borderRadius: '100% 0 100% 100%', height: 25, left: 24, position: 'absolute', transform: 'rotate(35deg)', width: 14 }} />
      </span>
    )
  }
  return <span style={{ color: '#101010', fontSize: 12, fontStyle: 'italic', fontWeight: 900 }}>Kalunga</span>
}

const rows: Array<{
  due: string
  paid: string
  title: string
  vendor: string
  logo: VendorLogoProps['type']
  total: string
  open: string
  status: string
  tone: 'danger' | 'warning' | 'info' | 'success'
}> = [
  { due: '05/07/2026', logo: 'building', open: '2.450,00', paid: '–', status: 'Vencido', title: 'Aluguel do escritório', tone: 'danger', total: '2.450,00', vendor: 'Boa Vista' },
  { due: '07/07/2026', logo: 'microsoft', open: '6.000,00', paid: '–', status: 'Em aberto', title: 'Licenças de software', tone: 'warning', total: '6.000,00', vendor: 'Microsoft' },
  { due: '10/07/2026', logo: 'aurora', open: '4.000,00', paid: '04/07/2026', status: 'Pago parcial', title: 'Serviços de marketing', tone: 'info', total: '8.000,00', vendor: 'Aurora' },
  { due: '15/07/2026', logo: 'dell', open: '7.500,00', paid: '–', status: 'Em aberto', title: 'Equipamentos', tone: 'warning', total: '7.500,00', vendor: 'Dell' },
  { due: '18/07/2026', logo: 'vivo', open: '350,00', paid: '–', status: 'Em aberto', title: 'Internet', tone: 'warning', total: '350,00', vendor: 'Vivo' },
  { due: '20/07/2026', logo: 'cr', open: '6.900,00', paid: '–', status: 'Em aberto', title: 'Contabilidade', tone: 'warning', total: '6.900,00', vendor: 'Contábil Recife' },
  { due: '03/07/2026', logo: 'energy', open: '0,00', paid: '03/07/2026', status: 'Pago', title: 'Energia elétrica', tone: 'success', total: '1.200,00', vendor: 'Neoenergia' },
  { due: '02/07/2026', logo: 'kalunga', open: '0,00', paid: '02/07/2026', status: 'Pago', title: 'Materiais de escritório', tone: 'success', total: '6.800,00', vendor: 'Kalunga' },
]

const statusStyle = {
  danger: { background: '#fdebe9', color: '#a43b31' },
  info: { background: '#e5f0fc', color: '#1d5e9e' },
  success: { background: '#e1f7e5', color: '#1c6a35' },
  warning: { background: '#fff4d7', color: '#69582c' },
}

function Checkbox() {
  return <span style={{ border: '1px solid #bdbdbd', borderRadius: 3, display: 'block', height: 18, width: 18 }} />
}

function MainHeader() {
  return (
    <>
      <header style={{ height: 142, padding: '29px 35px 0 38px' }}>
        <div style={{ color: '#686868', fontSize: 15, marginBottom: 10 }}>Financeiro</div>
        <div style={{ alignItems: 'center', display: 'flex' }}>
          <h1 style={{ fontSize: 47, fontWeight: 500, letterSpacing: 0, lineHeight: 1, margin: 0 }}>Contas a pagar</h1>
          <div style={{ alignItems: 'center', display: 'flex', gap: 12, marginLeft: 'auto' }}>
            <MoreVertical size={21} strokeWidth={1.8} />
            <button style={{ alignItems: 'center', background: '#fff', border: '1px solid #d8d8d6', borderRadius: 4, color: INK, display: 'flex', fontFamily: FONT, fontSize: 15, gap: 34, height: 44, padding: '0 15px' }}>Importar planilha <ChevronDown size={16} /></button>
            <button style={{ background: ACCENT, border: 0, borderRadius: 3, color: '#121212', fontFamily: FONT, fontSize: 15, fontWeight: 650, height: 44, padding: '0 25px' }}>Adicionar</button>
          </div>
        </div>
      </header>
      <div style={{ borderBottom: `1px solid ${LINE}`, display: 'flex', gap: 44, height: 40, paddingLeft: 38 }}>
        {['Contas a pagar', 'Contas a receber', 'Conciliação'].map((tab, index) => (
          <div key={tab} style={{ borderBottom: index === 0 ? '2px solid #171717' : 'none', color: index === 0 ? INK : '#686868', fontSize: 14, fontWeight: index === 0 ? 620 : 450, padding: '0 4px 15px' }}>{tab}</div>
        ))}
      </div>
    </>
  )
}

function Summary() {
  const metrics = [
    ['Vencidos', 'R$ 2.450,00', '#a73726'],
    ['Vencem hoje', 'R$ 6.000,00', INK],
    ['A vencer', 'R$ 18.750,00', INK],
    ['Pagos', 'R$ 12.000,00', '#197143'],
    ['Total do período', 'R$ 39.200,00', INK],
  ]
  return (
    <section style={{ borderBottom: `1px solid ${LINE}`, height: 194, padding: '31px 38px 0' }}>
      <div style={{ fontSize: 24, fontWeight: 500 }}>Resumo do período</div>
      <div style={{ color: MUTED, fontSize: 14, marginTop: 4 }}>Acompanhe seus pagamentos de julho de 2026.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.05fr 1fr', marginTop: 24 }}>
        {metrics.map(([label, value, color]) => (
          <div key={label}>
            <div style={{ color: MUTED, fontSize: 14 }}>{label}</div>
            <div style={{ color, fontSize: 28, fontWeight: 470, marginTop: 6 }}>{value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Toolbar() {
  return (
    <div style={{ alignItems: 'center', borderBottom: `1px solid ${LINE}`, display: 'flex', height: 66, padding: '0 28px 0 38px' }}>
      <div style={{ alignItems: 'center', border: '1px solid #d9d9d7', borderRadius: 20, color: '#7d7d7d', display: 'flex', fontSize: 14, height: 39, padding: '0 14px', width: 272 }}><Search size={17} strokeWidth={1.6} /><span style={{ marginLeft: 10 }}>Pesquisar lançamentos...</span></div>
      <div style={{ alignItems: 'center', border: '1px solid #d9d9d7', borderRadius: 5, display: 'flex', fontSize: 14, height: 39, marginLeft: 15, padding: '0 12px', width: 219 }}><CalendarDays size={17} strokeWidth={1.6} /><strong style={{ fontWeight: 570, marginLeft: 10 }}>Julho de 2026</strong><ChevronLeft size={16} style={{ marginLeft: 'auto' }} /><ChevronRight size={16} style={{ marginLeft: 19 }} /></div>
      <button style={{ alignItems: 'center', background: '#fff', border: '1px solid #d9d9d7', borderRadius: 5, display: 'flex', fontFamily: FONT, fontSize: 14, gap: 9, height: 39, marginLeft: 15, padding: '0 14px' }}><SlidersHorizontal size={17} strokeWidth={1.6} />Mais filtros</button>
      <div style={{ alignItems: 'center', color: '#666', display: 'flex', fontSize: 13, marginLeft: 'auto' }}><span>1–8 de 90</span><button style={{ alignItems: 'center', background: '#fff', border: '1px solid #dededc', borderRadius: 7, display: 'flex', height: 39, justifyContent: 'center', marginLeft: 20, width: 39 }}><ChevronLeft size={17} /></button><button style={{ alignItems: 'center', background: '#fff', border: '1px solid #dededc', borderRadius: 7, display: 'flex', height: 39, justifyContent: 'center', marginLeft: 9, width: 39 }}><ChevronRight size={17} /></button></div>
    </div>
  )
}

function Table() {
  const columns = '58px 136px 150px 1fr 133px 133px 160px 59px'
  return (
    <div style={{ bottom: 65, left: 0, position: 'absolute', right: 0, top: 442 }}>
      <div style={{ background: '#fbfbfa', borderBottom: `1px solid ${LINE}`, color: '#6c6c6c', display: 'grid', fontSize: 13, gridTemplateColumns: columns, height: 43 }}>
        <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', justifyContent: 'center' }}><Checkbox /></div>
        <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', paddingLeft: 16 }}>Vencimento <ArrowDown size={14} style={{ marginLeft: 'auto', marginRight: 18 }} /></div>
        <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', paddingLeft: 15 }}>Pagamento</div>
        <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', paddingLeft: 16 }}>Descrição / Fornecedor</div>
        <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', justifyContent: 'flex-end', paddingRight: 18 }}>Total (R$)</div>
        <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', justifyContent: 'flex-end', paddingRight: 18 }}>A pagar (R$)</div>
        <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', paddingLeft: 22 }}>Situação</div>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}><MoreHorizontal size={18} /></div>
      </div>
      {rows.map((row) => (
        <div key={row.title} style={{ borderBottom: `1px solid ${LINE}`, display: 'grid', fontSize: 14, gridTemplateColumns: columns, height: 64 }}>
          <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', justifyContent: 'center' }}><Checkbox /></div>
          <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', paddingLeft: 16 }}>{row.due}</div>
          <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', paddingLeft: 15 }}>{row.paid}</div>
          <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: '51px 1fr', paddingLeft: 18 }}>
            <span style={{ alignItems: 'center', display: 'flex', height: 42, justifyContent: 'center', width: 42 }}><VendorLogo type={row.logo} /></span>
            <span><span style={{ display: 'block', fontSize: 14.5, fontWeight: 510 }}>{row.title}</span><span style={{ color: MUTED, display: 'block', fontSize: 12.5, marginTop: 4 }}>{row.vendor}</span></span>
          </div>
          <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', justifyContent: 'flex-end', paddingRight: 18 }}>{row.total}</div>
          <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', justifyContent: 'flex-end', paddingRight: 18 }}>{row.open}</div>
          <div style={{ alignItems: 'center', borderRight: `1px solid ${LINE}`, display: 'flex', paddingLeft: 22 }}><span style={{ ...statusStyle[row.tone], borderRadius: 4, fontSize: 12.5, padding: '7px 12px' }}>{row.status}</span></div>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}><MoreVertical size={18} strokeWidth={1.8} /></div>
        </div>
      ))}
    </div>
  )
}

function Footer() {
  return (
    <footer style={{ alignItems: 'center', background: '#fbfbfa', bottom: 0, display: 'flex', height: 65, left: 0, padding: '0 30px', position: 'absolute', right: 0 }}>
      <Checkbox />
      <span style={{ color: MUTED, fontSize: 13, marginLeft: 22 }}>0 selecionados</span>
      <button style={{ alignItems: 'center', background: '#fff', border: '1px solid #e1e1df', borderRadius: 5, color: '#a0a0a0', display: 'flex', fontFamily: FONT, fontSize: 13, gap: 17, height: 39, marginLeft: 19, padding: '0 13px' }}>Ações em lote <ChevronDown size={15} /></button>
      <span style={{ color: '#696969', fontSize: 13, marginLeft: 'auto' }}>Total do período</span>
      <strong style={{ fontSize: 14, marginLeft: 17 }}>R$ 39.200,00</strong>
    </footer>
  )
}

export function OttoRampPayablesUi() {
  return (
    <AbsoluteFill style={{ background: '#fff', color: INK, fontFamily: FONT, overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ bottom: 0, left: 230, position: 'absolute', right: 0, top: 0 }}>
        <MainHeader />
        <Summary />
        <Toolbar />
        <Table />
        <Footer />
      </main>
    </AbsoluteFill>
  )
}
