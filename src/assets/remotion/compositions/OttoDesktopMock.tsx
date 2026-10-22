import {
  IconAddressBook,
  IconBuildingWarehouse,
  IconCashBanknote,
  IconChartBar,
  IconClipboardList,
  IconFileInvoice,
  IconHelpCircle,
  IconPackage,
  IconSearch,
  IconSettings,
  IconShoppingBag,
} from '@tabler/icons-react'
import type { CSSProperties, ReactNode } from 'react'
import { Easing, Img, interpolate, staticFile } from 'remotion'

/**
 * The Otto ERP web app (sidebar + workspace page), drawn for a vertical reel: same structure, colors and
 * labels as SidebarShadcn / ErpWorkspaceChrome, at a larger scale so it reads on a phone.
 */

export const DESKTOP_W = 1000
export const DESKTOP_H = 860

const INK = '#111111'
const MUTED = '#6b6b6b'
const LINE = '#e8e8e5'
const SIDEBAR = '#f7f7f4'
const BAR_H = 52
const SIDEBAR_W = 272
const ITEM_TOP = BAR_H + 150
const ITEM_H = 50
const ITEM_GAP = 4

const ease = (frame: number, from: number, to: number) => interpolate(frame, [from, to], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

const NAV = [
  { icon: IconChartBar, title: 'Visão geral' },
  { icon: IconShoppingBag, title: 'Vendas' },
  { icon: IconClipboardList, title: 'Compras' },
  { icon: IconCashBanknote, title: 'Financeiro' },
  { icon: IconBuildingWarehouse, title: 'Estoque' },
  { icon: IconFileInvoice, title: 'Notas fiscais' },
  { icon: IconAddressBook, title: 'Cadastros' },
  { icon: IconPackage, title: 'Produtos e serviços' },
]

/** Vertical center of a sidebar item, in window coordinates (for the cursor). */
export const navItemY = (index: number) => ITEM_TOP + index * (ITEM_H + ITEM_GAP) + ITEM_H / 2
export const NAV_X = 150

type Tone = 'danger' | 'default' | 'success' | 'warning'

const TONES: Record<Tone, [string, string]> = {
  danger: ['#fbe9e7', '#9b392a'],
  default: ['#eeeeec', '#666666'],
  success: ['#e4f6e7', '#21683a'],
  warning: ['#fff4d9', '#71541a'],
}

function Status({ label, tone }: { label: string; tone: Tone }) {
  return <span style={{ background: TONES[tone][0], borderRadius: 6, color: TONES[tone][1], fontSize: 17, padding: '4px 10px', whiteSpace: 'nowrap' }}>{label}</span>
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ padding: '30px 34px 0' }}>
      <span style={{ color: MUTED, display: 'block', fontSize: 17 }}>{eyebrow}</span>
      <span style={{ color: INK, display: 'block', fontSize: 36, fontWeight: 650, letterSpacing: '-0.025em', marginTop: 4 }}>{title}</span>
    </div>
  )
}

function Tabs({ active, tabs }: { active: number; tabs: string[] }) {
  return (
    <div style={{ borderBottom: `1px solid ${LINE}`, display: 'flex', gap: 28, margin: '22px 34px 0' }}>
      {tabs.map((tab, i) => (
        <span key={tab} style={{ borderBottom: i === active ? `2px solid ${INK}` : '2px solid transparent', color: i === active ? INK : MUTED, fontSize: 18, fontWeight: i === active ? 550 : 400, paddingBottom: 12, whiteSpace: 'nowrap' }}>
          {tab}
        </span>
      ))}
    </div>
  )
}

function Metrics({ items }: { items: [string, string, string?][] }) {
  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: `repeat(${items.length}, 1fr)`, margin: '22px 34px 0' }}>
      {items.map(([label, value, color]) => (
        <div key={label} style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: '16px 18px' }}>
          <span style={{ color: MUTED, display: 'block', fontSize: 16 }}>{label}</span>
          <span style={{ color: color ?? INK, display: 'block', fontSize: 27, fontWeight: 650, letterSpacing: '-0.02em', marginTop: 6 }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

function Table({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  const grid = `1.7fr ${columns
    .slice(1)
    .map(() => '1fr')
    .join(' ')}`
  return (
    <div style={{ margin: '20px 34px 0' }}>
      <div style={{ borderBottom: `1px solid ${LINE}`, color: MUTED, display: 'grid', fontSize: 15, gridTemplateColumns: grid, padding: '0 4px 10px' }}>
        {columns.map((c, i) => (
          <span key={c} style={{ textAlign: i === columns.length - 1 ? 'right' : 'left' }}>{c}</span>
        ))}
      </div>
      {rows.map((row, r) => (
        <div key={r} style={{ alignItems: 'center', borderBottom: `1px solid ${LINE}`, color: '#292929', display: 'grid', fontSize: 18, gridTemplateColumns: grid, height: 62, padding: '0 4px' }}>
          {row.map((cell, i) => (
            <span key={i} style={{ display: 'flex', justifyContent: i === row.length - 1 ? 'flex-end' : 'flex-start', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

function OverviewPage() {
  const bars = [
    [62, 34],
    [78, 41],
    [55, 38],
    [86, 44],
    [70, 36],
    [92, 47],
  ]
  return (
    <>
      <Header eyebrow="Visão geral" title="Resumo" />
      <Metrics
        items={[
          ['Saldo em caixa', 'R$ 64.280'],
          ['A receber', 'R$ 12.480', '#21683a'],
          ['A pagar', 'R$ 8.920', '#9b392a'],
        ]}
      />
      <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, margin: '18px 34px 0', padding: '18px 20px' }}>
        <span style={{ color: INK, fontSize: 19, fontWeight: 600 }}>Entradas e saídas</span>
        <div style={{ alignItems: 'flex-end', borderBottom: `1px solid ${LINE}`, display: 'flex', height: 260, justifyContent: 'space-around', marginTop: 14 }}>
          {bars.map(([a, b], i) => (
            <span key={i} style={{ alignItems: 'flex-end', display: 'flex', gap: 6 }}>
              <span style={{ background: '#7aa8f2', borderRadius: '5px 5px 0 0', height: a * 2.6, width: 26 }} />
              <span style={{ background: '#e09868', borderRadius: '5px 5px 0 0', height: b * 2.6, width: 26 }} />
            </span>
          ))}
        </div>
        <div style={{ color: MUTED, display: 'flex', fontSize: 15, justifyContent: 'space-around', marginTop: 10 }}>
          {['Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
    </>
  )
}

function SalesPage() {
  return (
    <>
      <Header eyebrow="Vendas" title="Pedidos" />
      <Tabs active={1} tabs={['Orçamentos', 'Pedidos', 'Ordens de serviço', 'Contratos']} />
      <Metrics
        items={[
          ['Pedidos no mês', '42'],
          ['Faturado', 'R$ 38.420', '#21683a'],
        ]}
      />
      <Table
        columns={['Cliente', 'Pedido', 'Valor', 'Status']}
        rows={[
          ['Clínica Horizonte', '#2031', 'R$ 1.500,00', <Status key="s" label="Confirmada" tone="success" />],
          ['Agência Atlas', '#2032', 'R$ 850,00', <Status key="s" label="Confirmada" tone="success" />],
          ['Marina Oliveira', '#2033', 'R$ 430,00', <Status key="s" label="Pendente" tone="warning" />],
          ['Nova Empresa Ltda.', '#2034', 'R$ 2.200,00', <Status key="s" label="Rascunho" tone="warning" />],
          ['Lume Comércio', '#2035', 'R$ 2.480,00', <Status key="s" label="Confirmada" tone="success" />],
        ]}
      />
    </>
  )
}

function FinancePage() {
  return (
    <>
      <Header eyebrow="Financeiro" title="Contas a pagar" />
      <Tabs active={0} tabs={['Contas a pagar', 'Contas a receber', 'Conciliação']} />
      <Metrics
        items={[
          ['Em aberto', 'R$ 8.920'],
          ['Vencido', 'R$ 1.250', '#9b392a'],
          ['Pago', 'R$ 19.630', '#21683a'],
        ]}
      />
      <Table
        columns={['Descrição', 'Vencimento', 'Valor', 'Status']}
        rows={[
          ['Aluguel escritório', '25/10', 'R$ 1.800,00', <Status key="s" label="Em aberto" tone="warning" />],
          ['Meta Ads', '20/10', 'R$ 850,00', <Status key="s" label="Vencido" tone="danger" />],
          ['AWS Cloud', '18/10', 'R$ 420,00', <Status key="s" label="Pago" tone="success" />],
          ['Google Workspace', '18/10', 'R$ 129,90', <Status key="s" label="Pago" tone="success" />],
          ['Contabilidade', '30/10', 'R$ 650,00', <Status key="s" label="Em aberto" tone="warning" />],
        ]}
      />
    </>
  )
}

function StockPage() {
  return (
    <>
      <Header eyebrow="Estoque" title="Situação" />
      <Tabs active={0} tabs={['Situação', 'Movimentações', 'Inventários', 'Transferências']} />
      <Metrics
        items={[
          ['Itens em estoque', '1.284'],
          ['Para repor', '3', '#9b392a'],
        ]}
      />
      <Table
        columns={['Produto', 'Local', 'Saldo', 'Situação']}
        rows={[
          ['Cadeira ergonômica', 'Depósito', '24 un', <Status key="s" label="Normal" tone="success" />],
          ['Monitor 27"', 'Loja', '3 un', <Status key="s" label="Repor" tone="danger" />],
          ['Teclado sem fio', 'Depósito', '41 un', <Status key="s" label="Normal" tone="success" />],
          ['Notebook Pro 14', 'Loja', '7 un', <Status key="s" label="Normal" tone="success" />],
          ['Headset USB', 'Depósito', '2 un', <Status key="s" label="Repor" tone="danger" />],
        ]}
      />
    </>
  )
}

function ClientsPage() {
  return (
    <>
      <Header eyebrow="Cadastros" title="Clientes" />
      <Tabs active={0} tabs={['Clientes', 'Fornecedores', 'Vendedores', 'Contas contábeis']} />
      <Metrics
        items={[
          ['Clientes ativos', '128'],
          ['Novos no mês', '9', '#21683a'],
        ]}
      />
      <Table
        columns={['Nome', 'Cidade', 'Tipo', 'Status']}
        rows={[
          ['Cliente Exemplo Brasil', 'Recife', 'PJ', <Status key="s" label="Ativo" tone="success" />],
          ['Nova Empresa Ltda.', 'Recife', 'PJ', <Status key="s" label="Ativo" tone="success" />],
          ['Maria Souza', 'Olinda', 'PF', <Status key="s" label="Ativo" tone="success" />],
          ['Agência Atlas Ltda.', 'São Paulo', 'PJ', <Status key="s" label="Ativo" tone="success" />],
          ['Clínica Horizonte', 'Recife', 'PJ', <Status key="s" label="Ativo" tone="success" />],
        ]}
      />
    </>
  )
}

/** Page shown for each sidebar item (by NAV index). */
const PAGES: Record<number, () => ReactNode> = { 0: OverviewPage, 1: SalesPage, 3: FinancePage, 4: StockPage, 6: ClientsPage }

function Cursor() {
  return (
    <svg height={34} viewBox="0 0 24 24" width={34}>
      <path d="M4 2 L4 19 L8.6 14.8 L11.6 21.6 L14.6 20.3 L11.7 13.7 L18 13.4 Z" fill="#111" stroke="#fff" strokeLinejoin="round" strokeWidth={1.5} />
    </svg>
  )
}

/** One stop of the cursor: it reaches sidebar item `item` at `at` and the page switches to it. */
export type Hover = { at: number; item: number }

/**
 * `frame`: local frame. The cursor glides between `hovers` (each move takes `MOVE` frames before `at`);
 * the hovered item highlights and the workspace crossfades to that item's page.
 */
export function OttoDesktopWindow({ cursorFrom, frame, hovers, style }: { cursorFrom: number; frame: number; hovers: Hover[]; style?: CSSProperties }) {
  const MOVE = 14
  let current = -1
  hovers.forEach((h, i) => {
    if (frame >= h.at) current = i
  })
  const active = current >= 0 ? hovers[current].item : 0
  const changedAt = current >= 0 ? hovers[current].at : -100
  const previous = current > 0 ? hovers[current - 1].item : current === 0 ? 0 : -1
  const swap = ease(frame, changedAt, changedAt + 8)

  // cursor path: enters from the content area, then item to item
  const stops = [{ at: cursorFrom, x: 620, y: 640 }, ...hovers.map((h) => ({ at: h.at, x: NAV_X, y: navItemY(h.item) }))]
  let cx = stops[0].x
  let cy = stops[0].y
  for (let i = 1; i < stops.length; i++) {
    const t = ease(frame, stops[i].at - MOVE, stops[i].at)
    cx += (stops[i].x - cx) * t
    cy += (stops[i].y - cy) * t
  }
  const cursorIn = ease(frame, cursorFrom, cursorFrom + 8)
  const press = hovers.some((h) => frame >= h.at && frame < h.at + 5) ? 0.86 : 1

  const ActivePage = PAGES[active] ?? OverviewPage
  const PreviousPage = previous >= 0 && previous !== active ? (PAGES[previous] ?? OverviewPage) : null

  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 22, boxShadow: '0 30px 80px rgba(20,20,19,0.16)', fontFamily: 'inherit', height: DESKTOP_H, overflow: 'hidden', position: 'absolute', width: DESKTOP_W, ...style }}>
      {/* browser bar */}
      <div style={{ alignItems: 'center', background: '#f1f1ee', borderBottom: `1px solid ${LINE}`, display: 'flex', gap: 10, height: BAR_H, padding: '0 20px' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} style={{ background: c, borderRadius: 99, height: 14, width: 14 }} />
        ))}
        <span style={{ background: '#fff', borderRadius: 8, color: MUTED, flex: 1, fontSize: 16, margin: '0 120px 0 40px', padding: '6px 0', textAlign: 'center' }}>app.otto.com.br/erp</span>
      </div>

      {/* sidebar */}
      <div style={{ background: SIDEBAR, borderRight: `1px solid ${LINE}`, bottom: 0, left: 0, position: 'absolute', top: BAR_H, width: SIDEBAR_W }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 10, height: 64, padding: '18px 22px 0' }}>
          <Img src={staticFile('logoOttoIcon.svg')} style={{ height: 28, objectFit: 'contain', width: 28 }} />
          <span style={{ color: INK, fontSize: 30, fontWeight: 650, letterSpacing: '-0.04em' }}>otto</span>
        </div>
        <div style={{ alignItems: 'center', color: '#626262', display: 'flex', gap: 12, height: 50, margin: '14px 12px 0', padding: '0 12px' }}>
          <IconSearch size={22} stroke={1.7} />
          <span style={{ flex: 1, fontSize: 19 }}>Pesquisar</span>
          <span style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #deded9', borderRadius: 5, color: '#777', fontSize: 14, padding: '1px 6px' }}>⌘ K</span>
        </div>
        {NAV.map(({ icon: Icon, title }, i) => {
          const on = i === active
          return (
            <div key={title} style={{ alignItems: 'center', background: on ? 'rgba(0,0,0,0.06)' : 'transparent', borderRadius: 10, color: on ? INK : '#5d5d5d', display: 'flex', fontSize: 19, fontWeight: on ? 550 : 400, gap: 12, height: ITEM_H, left: 12, padding: '0 12px', position: 'absolute', right: 12, top: ITEM_TOP - BAR_H + i * (ITEM_H + ITEM_GAP) }}>
              <Icon size={22} stroke={1.7} />
              {title}
            </div>
          )
        })}
        <div style={{ borderTop: '1px solid #e6e6e2', bottom: 0, left: 0, padding: '8px 12px 14px', position: 'absolute', right: 0 }}>
          {[
            [IconSettings, 'Configurações'],
            [IconHelpCircle, 'Ajuda'],
          ].map(([Icon, label]) => {
            const I = Icon as typeof IconSettings
            return (
              <div key={label as string} style={{ alignItems: 'center', color: '#5d5d5d', display: 'flex', fontSize: 18, gap: 12, height: 44, padding: '0 12px' }}>
                <I size={21} stroke={1.7} />
                {label as string}
              </div>
            )
          })}
        </div>
      </div>

      {/* workspace page */}
      <div style={{ bottom: 0, left: SIDEBAR_W, position: 'absolute', right: 0, top: BAR_H }}>
        {PreviousPage && swap < 1 ? (
          <div style={{ inset: 0, opacity: 1 - swap, position: 'absolute' }}>
            <PreviousPage />
          </div>
        ) : null}
        <div style={{ inset: 0, opacity: PreviousPage ? swap : 1, position: 'absolute', transform: `translateY(${PreviousPage ? (1 - swap) * 10 : 0}px)` }}>
          <ActivePage />
        </div>
      </div>

      {/* cursor */}
      {frame >= cursorFrom ? (
        <div style={{ left: cx - 4, opacity: cursorIn, position: 'absolute', top: cy - 4, transform: `scale(${press})`, transformOrigin: '4px 4px', zIndex: 3 }}>
          <Cursor />
        </div>
      ) : null}
    </div>
  )
}
