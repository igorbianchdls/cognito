import type { ComponentType, ReactElement } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import AmazonIcon from '@/components/icons/AmazonIcon'
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon'
import ShopifyIcon from '@/components/icons/ShopifyIcon'

export const OTTO_ERP_ACCOUNTS_DRAWER_ACTION_DURATION = 700

const INK = '#111827'
const MUTED = '#6B7280'
const SOFT = '#F7F8FA'
const LINE = '#E6E8EC'
const GREEN = '#16A34A'
const RED = '#DC2626'
const BLUE = '#2563EB'
const TEAL = '#0F766E'
const AMBER = '#D97706'

type AccountRow = {
  color: string
  category: string
  description: string
  due: string
  icon?: ComponentType<{ className?: string }>
  initials: string
  name: string
  status: string
  value: string
}

type PageKey = 'payable' | 'receivable' | 'financialAccounts' | 'sales' | 'purchases' | 'vendors' | 'clients' | 'sellers' | 'products' | 'services'

type PageData = {
  key: PageKey
  metricLabel: string
  metricValue: string
  rows: AccountRow[]
  subtitle: string
  tab: string
  title: string
}

const navItems = [
  { icon: 'home', label: 'Inicio' },
  { icon: 'chat', label: 'Chat' },
  { icon: 'wallet', label: 'Financeiro', active: true },
  { icon: 'file', label: 'Fiscal' },
  { icon: 'chart', label: 'Relatorios' },
  { icon: 'plug', label: 'Integracoes' },
]

const pages: PageData[] = [
  {
    key: 'payable',
    metricLabel: 'Total a pagar',
    metricValue: 'R$ 70.810',
    rows: [
      { category: 'Cloud', color: '#FF9900', description: 'Infraestrutura recorrente e cloud', due: '25 Jun', icon: AmazonIcon, initials: 'AW', name: 'AWS Brasil', status: 'Aprovar', value: 'R$ 12.790,00' },
      { category: 'Marketing', color: BLUE, description: 'Campanhas de aquisicao e remarketing', due: '30 Jun', icon: GoogleAdsIcon, initials: 'G', name: 'Google Ads', status: 'Agendado', value: 'R$ 8.420,00' },
      { category: 'Software', color: TEAL, description: 'Renovacao anual de software', due: '05 Jul', initials: 'FC', name: 'Fornecedor Cloud', status: 'Rascunho', value: 'R$ 18.400,00' },
      { category: 'Fiscal', color: AMBER, description: 'Guia mensal e obrigacoes fiscais', due: '06 Jul', initials: 'TX', name: 'Impostos federais', status: 'Prioridade', value: 'R$ 31.200,00' },
    ],
    subtitle: 'Fornecedores, impostos e despesas pendentes',
    tab: 'Contas a Pagar',
    title: 'Contas a Pagar',
  },
  {
    key: 'receivable',
    metricLabel: 'Total a receber',
    metricValue: 'R$ 106.400',
    rows: [
      { category: 'NFS-e', color: GREEN, description: 'NFS-e 2048 - consultoria operacional', due: '28 Jun', initials: 'CN', name: 'Cliente Norte', status: 'Previsto', value: 'R$ 42.100,00' },
      { category: 'Boleto', color: RED, description: 'Pedido faturado com atraso', due: '02 Jul', initials: 'MS', name: 'Mercado Sul', status: 'Atrasado', value: 'R$ 28.900,00' },
      { category: 'Ecommerce', color: '#95BF47', description: 'Repasse ecommerce Shopify', due: '07 Jul', icon: ShopifyIcon, initials: 'LP', name: 'Loja Prime', status: 'Confirmado', value: 'R$ 16.800,00' },
      { category: 'Recorrente', color: GREEN, description: 'Retainer mensal de performance', due: '09 Jul', initials: 'RA', name: 'Rede Alpha', status: 'Previsto', value: 'R$ 18.600,00' },
    ],
    subtitle: 'Clientes, notas emitidas e recebimentos previstos',
    tab: 'Contas a Receber',
    title: 'Contas a Receber',
  },
  {
    key: 'financialAccounts',
    metricLabel: 'Saldo conectado',
    metricValue: 'R$ 418.200',
    rows: [
      { category: 'Banco', color: '#FF7A00', description: 'Conta corrente principal sincronizada', due: 'Agora', initials: 'BI', name: 'Banco Inter', status: 'Conectada', value: 'R$ 126.400' },
      { category: 'Banco', color: BLUE, description: 'Conta operacional com conciliacao ativa', due: 'Agora', initials: 'IT', name: 'Itau Empresas', status: 'Conectada', value: 'R$ 214.300' },
      { category: 'Cartao', color: '#111827', description: 'Cartao corporativo com faturas importadas', due: 'Hoje', initials: 'ST', name: 'Stone Cartao', status: 'Sincronizado', value: 'R$ 38.900' },
      { category: 'Caixa', color: TEAL, description: 'Conta reserva para pagamentos recorrentes', due: 'Hoje', initials: 'CX', name: 'Caixa operacional', status: 'OK', value: 'R$ 38.600' },
    ],
    subtitle: 'Bancos, cartoes, caixas, saldos e conciliacao',
    tab: 'Contas Financeiras',
    title: 'Contas Financeiras',
  },
  {
    key: 'sales',
    metricLabel: 'Vendas do mes',
    metricValue: 'R$ 162.400',
    rows: [
      { category: 'Servico', color: GREEN, description: 'Contrato operacional aprovado', due: 'Hoje', initials: 'CN', name: 'Cliente Norte', status: 'Faturada', value: 'R$ 42.100,00' },
      { category: 'Projeto', color: BLUE, description: 'Implementacao financeira concluida', due: 'Ontem', initials: 'GD', name: 'Grupo Delta', status: 'Registrada', value: 'R$ 76.500,00' },
      { category: 'Ecommerce', color: '#95BF47', description: 'Pedidos importados da loja', due: '24 Jun', icon: ShopifyIcon, initials: 'SH', name: 'Shopify Store', status: 'Sincronizada', value: 'R$ 16.800,00' },
      { category: 'Recorrente', color: TEAL, description: 'Renovacao mensal automatica', due: '22 Jun', initials: 'RA', name: 'Rede Alpha', status: 'Faturar', value: 'R$ 27.000,00' },
    ],
    subtitle: 'Pedidos, contratos, faturamento e receita',
    tab: 'Vendas',
    title: 'Vendas',
  },
  {
    key: 'purchases',
    metricLabel: 'Compras abertas',
    metricValue: 'R$ 46.690',
    rows: [
      { category: 'Midia', color: BLUE, description: 'Credito de campanha aprovado', due: 'Hoje', icon: GoogleAdsIcon, initials: 'G', name: 'Google Ads', status: 'Comprar', value: 'R$ 8.420,00' },
      { category: 'Cloud', color: '#FF9900', description: 'Reserva de capacidade mensal', due: '27 Jun', icon: AmazonIcon, initials: 'AW', name: 'AWS Brasil', status: 'Aprovar', value: 'R$ 12.790,00' },
      { category: 'Logistica', color: RED, description: 'Pedido com reajuste fora da media', due: '29 Jun', initials: 'FS', name: 'Frete Sul', status: 'Revisar', value: 'R$ 6.830,00' },
      { category: 'Software', color: TEAL, description: 'Licencas e automacoes internas', due: '05 Jul', initials: 'FC', name: 'Fornecedor Cloud', status: 'Rascunho', value: 'R$ 18.650,00' },
    ],
    subtitle: 'Pedidos de compra, aprovacoes e custos',
    tab: 'Compras',
    title: 'Compras',
  },
  {
    key: 'vendors',
    metricLabel: 'Fornecedores ativos',
    metricValue: '48',
    rows: [
      { category: 'Cloud', color: '#FF9900', description: 'Infraestrutura e servicos gerenciados', due: 'Ativo', icon: AmazonIcon, initials: 'AW', name: 'AWS Brasil', status: 'Recorrente', value: 'R$ 12.790/m' },
      { category: 'Marketing', color: BLUE, description: 'Midia paga e campanhas digitais', due: 'Ativo', icon: GoogleAdsIcon, initials: 'G', name: 'Google Ads', status: 'Conectado', value: 'R$ 8.420/m' },
      { category: 'Logistica', color: RED, description: 'Entregas nacionais e armazenagem', due: 'Revisao', initials: 'FS', name: 'Frete Sul', status: 'Revisar', value: 'R$ 6.830/m' },
      { category: 'Fiscal', color: AMBER, description: 'Guias, impostos e obrigacoes', due: 'Ativo', initials: 'EF', name: 'Escritorio Fiscal', status: 'OK', value: 'R$ 4.800/m' },
    ],
    subtitle: 'Cadastro, recorrencia, contratos e risco',
    tab: 'Fornecedores',
    title: 'Fornecedores',
  },
  {
    key: 'clients',
    metricLabel: 'Clientes ativos',
    metricValue: '126',
    rows: [
      { category: 'Enterprise', color: BLUE, description: 'Contrato anual com renovacao em agosto', due: 'Ativo', initials: 'GD', name: 'Grupo Delta', status: 'Premium', value: 'R$ 76.500' },
      { category: 'Servicos', color: GREEN, description: 'Consultoria operacional e automacao', due: 'Ativo', initials: 'CN', name: 'Cliente Norte', status: 'Em dia', value: 'R$ 42.100' },
      { category: 'Varejo', color: RED, description: 'Pagamento com atraso em acompanhamento', due: 'Atraso', initials: 'MS', name: 'Mercado Sul', status: 'Cobrar', value: 'R$ 28.900' },
      { category: 'Ecommerce', color: '#95BF47', description: 'Pedidos conectados via Shopify', due: 'Ativo', icon: ShopifyIcon, initials: 'LP', name: 'Loja Prime', status: 'Integrado', value: 'R$ 16.800' },
    ],
    subtitle: 'Clientes, cobranca, contratos e relacionamento',
    tab: 'Clientes',
    title: 'Clientes',
  },
  {
    key: 'sellers',
    metricLabel: 'Comissao prevista',
    metricValue: 'R$ 18.240',
    rows: [
      { category: 'Executivo', color: BLUE, description: 'Pipeline enterprise e renovacoes', due: 'Meta 112%', initials: 'AF', name: 'Ana Ferreira', status: 'Alta', value: 'R$ 7.650' },
      { category: 'Inside sales', color: GREEN, description: 'Novas contas SMB no mes', due: 'Meta 98%', initials: 'MR', name: 'Marcio Rocha', status: 'OK', value: 'R$ 4.980' },
      { category: 'Parcerias', color: TEAL, description: 'Canais e indicacoes qualificadas', due: 'Meta 87%', initials: 'LC', name: 'Laura Costa', status: 'Acompanhar', value: 'R$ 3.410' },
      { category: 'Hunter', color: AMBER, description: 'Contas novas em negociacao', due: 'Meta 74%', initials: 'RS', name: 'Rafael Souza', status: 'Acelerar', value: 'R$ 2.200' },
    ],
    subtitle: 'Metas, comissoes, pipeline e desempenho',
    tab: 'Vendedores',
    title: 'Vendedores',
  },
  {
    key: 'products',
    metricLabel: 'Produtos ativos',
    metricValue: '34',
    rows: [
      { category: 'SaaS', color: GREEN, description: 'Plano recorrente com financeiro automatizado', due: 'Ativo', initials: 'OP', name: 'Otto Pro', status: 'Disponivel', value: 'R$ 899/m' },
      { category: 'Add-on', color: BLUE, description: 'Modulo de dashboards e relatorios', due: 'Ativo', initials: 'DG', name: 'Dashboard Gestao', status: 'Disponivel', value: 'R$ 299/m' },
      { category: 'Fiscal', color: AMBER, description: 'Pacote de emissao e organizacao de notas', due: 'Ativo', initials: 'NF', name: 'Notas Fiscais', status: 'Disponivel', value: 'R$ 199/m' },
      { category: 'IA', color: TEAL, description: 'Automacoes extras para rotinas internas', due: 'Ativo', initials: 'AI', name: 'Funcionarios de IA', status: 'Novo', value: 'R$ 490/m' },
    ],
    subtitle: 'Produtos, planos, modulos e recorrencia',
    tab: 'Produtos',
    title: 'Produtos',
  },
  {
    key: 'services',
    metricLabel: 'Servicos ativos',
    metricValue: '18',
    rows: [
      { category: 'Implantacao', color: BLUE, description: 'Setup financeiro, fiscal e integracoes', due: '5 dias', initials: 'IM', name: 'Implantacao Otto', status: 'Em andamento', value: 'R$ 12.400' },
      { category: 'Consultoria', color: GREEN, description: 'Mapeamento de processos financeiros', due: 'Hoje', initials: 'CO', name: 'Consultoria operacional', status: 'Agendada', value: 'R$ 8.900' },
      { category: 'Fiscal', color: AMBER, description: 'Revisao de notas, XMLs e obrigacoes', due: 'Semanal', initials: 'RF', name: 'Revisao fiscal', status: 'Recorrente', value: 'R$ 4.800/m' },
      { category: 'Treinamento', color: TEAL, description: 'Capacitacao de time financeiro e gestores', due: '12 Jul', initials: 'TR', name: 'Treinamento equipe', status: 'Confirmado', value: 'R$ 3.600' },
    ],
    subtitle: 'Servicos, implantacoes, consultorias e recorrencia',
    tab: 'Serviços',
    title: 'Serviços',
  },
]

function ease(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function pageIndex(frame: number) {
  if (frame < 70) return 0
  if (frame < 116) return 1
  if (frame < 162) return 2
  if (frame < 208) return 3
  if (frame < 254) return 4
  if (frame < 300) return 5
  if (frame < 346) return 6
  if (frame < 392) return 7
  if (frame < 438) return 8
  if (frame < 484) return 9
  return 0
}

function currentPage(frame: number) {
  return pages[pageIndex(frame)]
}

function pagePhaseStart(frame: number) {
  const starts = [48, 78, 124, 170, 216, 262, 308, 354, 400, 446]
  return starts[pageIndex(frame)] ?? 48
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
          <div key={item.label} style={{ alignItems: 'center', background: item.active ? '#ECFDF3' : 'transparent', borderRadius: 14, color: item.active ? GREEN : '#4D4D4D', display: 'flex', flexDirection: 'column', fontSize: 10, fontWeight: item.active ? 760 : 520, gap: 5, height: 58, justifyContent: 'center', width: 72 }}>
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
        <span style={{ fontSize: 13, fontWeight: 500 }}>Buscar cliente, fornecedor ou lancamento...</span>
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

function CompanyIcon({ row }: { row: AccountRow }) {
  const Icon = row.icon
  return (
    <span style={{ alignItems: 'center', background: Icon ? '#FFFFFF' : `${row.color}14`, border: `1px solid ${Icon ? LINE : `${row.color}22`}`, borderRadius: 13, color: row.color, display: 'flex', fontSize: 13, fontWeight: 850, height: 42, justifyContent: 'center', overflow: 'hidden', width: 42 }}>
      {Icon ? <Icon className="h-8 w-8" /> : row.initials}
    </span>
  )
}

function StatusPill({ color, label }: { color: string; label: string }) {
  return <span style={{ background: `${color}12`, borderRadius: 999, color, display: 'inline-block', fontSize: 12, fontWeight: 760, padding: '7px 9px', textAlign: 'center' }}>{label}</span>
}

function AccountsTable() {
  const frame = useCurrentFrame()
  const page = currentPage(frame)
  const phaseStart = pagePhaseStart(frame)
  const buttonIn = ease(frame, 506, 528)

  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ alignItems: 'center', borderBottom: `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: '1fr auto', padding: '19px 22px' }}>
        <div>
          <div style={{ color: INK, fontSize: 20, fontWeight: 820, letterSpacing: -0.25 }}>{page.title}</div>
          <div style={{ color: MUTED, fontSize: 13, fontWeight: 500, marginTop: 5 }}>{page.subtitle}</div>
        </div>
        <button style={{ background: INK, border: 0, borderRadius: 12, color: '#FFFFFF', fontSize: 13, fontWeight: 760, height: 38, opacity: buttonIn, padding: '0 15px', transform: `translateY(${(1 - buttonIn) * 8}px)` }}>Nova conta a pagar</button>
      </div>
      <div style={{ background: '#FBFCFD', borderBottom: `1px solid ${LINE}`, color: '#8A94A6', display: 'grid', fontSize: 11, fontWeight: 780, gridTemplateColumns: '1.35fr 110px 118px 132px 110px', padding: '10px 22px', textTransform: 'uppercase' }}>
        <span>Registro</span>
        <span>Categoria</span>
        <span>Data</span>
        <span>Valor</span>
        <span>Status</span>
      </div>
      {page.rows.map((row, index) => {
        const rowIn = ease(frame, phaseStart + index * 9, phaseStart + 22 + index * 9)
        const statusColor = row.status === 'Atrasado' || row.status === 'Aprovar' || row.status === 'Prioridade' ? RED : row.status === 'Rascunho' ? AMBER : row.color
        return (
          <div key={`${page.key}-${row.name}`} style={{ alignItems: 'center', borderBottom: index === page.rows.length - 1 ? 'none' : `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: '1.35fr 110px 118px 132px 110px', minHeight: 72, opacity: rowIn, padding: '0 22px', transform: `translateX(${(1 - rowIn) * 18}px)` }}>
            <div style={{ alignItems: 'center', display: 'grid', gap: 13, gridTemplateColumns: '42px 1fr', minWidth: 0 }}>
              <CompanyIcon row={row} />
              <div style={{ minWidth: 0 }}>
                <div style={{ color: INK, fontSize: 14, fontWeight: 760, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</div>
                <div style={{ color: MUTED, fontSize: 12, fontWeight: 500, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</div>
              </div>
            </div>
            <span style={{ color: row.color, fontSize: 13, fontWeight: 740 }}>{row.category}</span>
            <span style={{ color: INK, fontSize: 13, fontWeight: 650 }}>{row.due}</span>
            <span style={{ color: INK, fontSize: 14, fontWeight: 780 }}>{row.value}</span>
            <StatusPill color={statusColor} label={row.status} />
          </div>
        )
      })}
    </div>
  )
}

function CursorPointer() {
  const frame = useCurrentFrame()
  const click = ease(frame, 526, 540)
  const x = interpolate(ease(frame, 506, 536), [0, 1], [816, 1042], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = interpolate(ease(frame, 506, 536), [0, 1], [392, 192], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <div style={{ filter: 'drop-shadow(0 8px 10px rgba(15, 23, 42, 0.18))', left: x, opacity: ease(frame, 502, 520) * interpolate(frame, [552, 570], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), position: 'absolute', top: y, transform: `scale(${1 - click * 0.12})`, zIndex: 20 }}>
      <svg height="38" viewBox="0 0 42 42" width="38">
        <path d="M8 5L32 24L21 26L16 37L8 5Z" fill="#111111" />
        <path d="M18 25L23 36" stroke="#ffffff" strokeLinecap="round" strokeWidth="3" />
      </svg>
    </div>
  )
}

function AccountDrawer() {
  const frame = useCurrentFrame()
  const open = ease(frame, 540, 568)
  const save = ease(frame, 634, 654)
  const fields = [
    ['Tipo', 'Conta a pagar'],
    ['Fornecedor', 'Fornecedor Cloud'],
    ['Descricao', 'Renovacao anual de software'],
    ['Vencimento', '05 Jul 2026'],
    ['Valor', 'R$ 18.400,00'],
    ['Categoria', 'Software e infraestrutura'],
  ]

  return (
    <div style={{ background: '#FFFFFF', borderLeft: `1px solid ${LINE}`, bottom: 0, boxShadow: '-24px 0 60px rgba(15, 23, 42, 0.10)', opacity: open, padding: 24, position: 'absolute', right: 0, top: 0, transform: `translateX(${(1 - open) * 390}px)`, width: 388, zIndex: 12 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: INK, fontSize: 22, fontWeight: 820, letterSpacing: -0.4 }}>Nova conta a pagar</div>
          <div style={{ color: MUTED, fontSize: 13, fontWeight: 500, marginTop: 5 }}>Registrar conta no ERP</div>
        </div>
        <span style={{ alignItems: 'center', background: SOFT, borderRadius: 999, color: MUTED, display: 'flex', fontSize: 18, fontWeight: 500, height: 34, justifyContent: 'center', width: 34 }}>x</span>
      </div>
      <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        {fields.map(([label, value], index) => {
          const fieldIn = ease(frame, 564 + index * 8, 584 + index * 8)
          return (
            <div key={label} style={{ opacity: fieldIn, transform: `translateY(${(1 - fieldIn) * 10}px)` }}>
              <label style={{ color: MUTED, display: 'block', fontSize: 11, fontWeight: 780, marginBottom: 6, textTransform: 'uppercase' }}>{label}</label>
              <div style={{ alignItems: 'center', background: SOFT, border: `1px solid ${LINE}`, borderRadius: 12, color: INK, display: 'flex', fontSize: 14, fontWeight: 680, height: 42, padding: '0 13px' }}>{value}</div>
            </div>
          )
        })}
      </div>
      <div style={{ background: '#ECFDF3', border: '1px solid #BBF7D0', borderRadius: 14, color: GREEN, fontSize: 13, fontWeight: 650, lineHeight: 1.35, marginTop: 18, opacity: ease(frame, 616, 634), padding: 13 }}>
        Otto vinculou este lancamento ao fornecedor e sugeriu recorrencia automatica.
      </div>
      <button style={{ background: save > 0.5 ? GREEN : INK, border: 0, borderRadius: 13, bottom: 24, color: '#FFFFFF', fontSize: 14, fontWeight: 800, height: 46, left: 24, position: 'absolute', right: 24 }}>{save > 0.5 ? 'Conta a pagar registrada' : 'Registrar conta a pagar'}</button>
    </div>
  )
}

export function OttoErpAccountsDrawerAction() {
  const frame = useCurrentFrame()
  const page = currentPage(frame)

  return (
    <AbsoluteFill style={{ background: '#FFFFFF', color: INK, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar />
      <main style={{ background: '#FFFFFF', bottom: 0, left: 88, overflow: 'hidden', position: 'absolute', right: 0, top: 0 }}>
        <TopBar />
        <div style={{ padding: '28px 32px 0', position: 'relative' }}>
          <div style={{ alignItems: 'end', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ color: INK, fontSize: 88, fontWeight: 760, letterSpacing: 0, lineHeight: 0.96, margin: 0 }}>{page.title}</h1>
              <p style={{ color: MUTED, fontSize: 15, fontWeight: 500, margin: '10px 0 0' }}>Registre, acompanhe e automatize lancamentos financeiros.</p>
            </div>
          </div>
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 20 }}>
            {pages.map((tabPage) => {
              const active = page.key === tabPage.key
              return (
                <span key={tabPage.key} style={{ background: active ? INK : '#FFFFFF', border: `1px solid ${active ? INK : LINE}`, borderRadius: 999, color: active ? '#FFFFFF' : MUTED, fontSize: 12, fontWeight: 720, padding: '8px 12px' }}>{tabPage.tab}</span>
              )
            })}
          </div>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 24 }}>
            <MetricCard delay={18} label={page.metricLabel} tone={page.key === 'receivable' || page.key === 'sales' || page.key === 'clients' || page.key === 'sellers' ? GREEN : RED} value={page.metricValue} />
            <MetricCard delay={24} label="Atualizados hoje" tone={GREEN} value={page.key === 'vendors' || page.key === 'clients' ? '8' : '12'} />
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
