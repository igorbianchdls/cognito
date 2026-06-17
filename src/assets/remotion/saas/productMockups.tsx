import type { ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'

import { fadeSlide } from '@/assets/remotion/saas/animation'
import type { SaaSMetric, SaaSProductScreen, SaaSTheme } from '@/assets/remotion/saas/types'

export function BrowserWindowMock({
  children,
  delay = 0,
  title = 'app.company.com',
  theme,
}: {
  children: ReactNode
  delay?: number
  title?: string
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  return (
    <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 32, boxShadow: '0 42px 110px rgba(20,24,22,0.22)', overflow: 'hidden', ...fadeSlide(frame, delay) }}>
      <div style={{ alignItems: 'center', background: '#EEF3EF', borderBottom: `1px solid ${theme.border}`, display: 'grid', gap: 16, gridTemplateColumns: '74px 1fr 74px', padding: '15px 20px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['#EF625D', '#E5B84E', '#4DB36E'].map((color) => <span key={color} style={{ background: color, borderRadius: 999, height: 12, width: 12 }} />)}
        </div>
        <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 999, color: theme.muted, fontSize: 15, fontWeight: 700, letterSpacing: 0, padding: '9px 14px', textAlign: 'center' }}>{title}</div>
        <div />
      </div>
      {children}
    </div>
  )
}

export function AppShellMock({
  active = 'Overview',
  children,
  theme,
}: {
  active?: string
  children: ReactNode
  theme: SaaSTheme
}) {
  const nav = ['Overview', 'Workflows', 'Customers', 'Reports', 'Settings']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 640 }}>
      <aside style={{ background: '#F7FAF8', borderRight: `1px solid ${theme.border}`, display: 'grid', gap: 18, padding: 24 }}>
        <strong style={{ color: theme.text, fontSize: 22, fontWeight: 880, letterSpacing: 0 }}>Workspace</strong>
        <div style={{ display: 'grid', gap: 8 }}>
          {nav.map((item) => (
            <span key={item} style={{ background: item === active ? theme.text : 'transparent', borderRadius: 14, color: item === active ? '#FFFFFF' : theme.muted, fontSize: 16, fontWeight: 780, letterSpacing: 0, padding: '12px 14px' }}>{item}</span>
          ))}
        </div>
      </aside>
      <main style={{ background: '#FFFFFF', display: 'grid', gap: 20, padding: 26 }}>{children}</main>
    </div>
  )
}

export function DashboardMock({
  metrics,
  screen,
  theme,
}: {
  metrics: SaaSMetric[]
  screen?: SaaSProductScreen
  theme: SaaSTheme
}) {
  const bars = [92, 128, 86, 164, 142, 210, 176, 238]
  return (
    <AppShellMock active="Overview" theme={theme}>
      <header style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <span style={{ color: theme.accent, fontSize: 15, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase' }}>{screen?.eyebrow || 'Live analytics'}</span>
          <strong style={{ color: theme.text, fontSize: 34, fontWeight: 900, letterSpacing: 0, lineHeight: 1 }}>{screen?.title || 'Executive dashboard'}</strong>
        </div>
        <span style={{ background: '#ECF7F0', border: `1px solid ${theme.border}`, borderRadius: 999, color: theme.positive, fontSize: 16, fontWeight: 850, letterSpacing: 0, padding: '10px 14px' }}>{screen?.metric || '+24% this month'}</span>
      </header>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {metrics.slice(0, 3).map((metric, index) => (
          <div key={metric.label} style={{ background: '#F8FBF9', border: `1px solid ${theme.border}`, borderRadius: 18, display: 'grid', gap: 6, padding: 18 }}>
            <span style={{ color: theme.muted, fontSize: 14, fontWeight: 750, letterSpacing: 0 }}>{metric.label}</span>
            <strong style={{ color: theme.text, fontSize: 28, fontWeight: 900, letterSpacing: 0 }}>{metric.value}</strong>
            <span style={{ background: index === 0 ? theme.accent : '#DDE7E1', borderRadius: 999, display: 'block', height: 8, width: `${70 + index * 10}%` }} />
          </div>
        ))}
      </div>
      <div style={{ background: '#F8FBF9', border: `1px solid ${theme.border}`, borderRadius: 22, display: 'grid', gap: 18, padding: 22 }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <strong style={{ color: theme.text, fontSize: 22, fontWeight: 860, letterSpacing: 0 }}>Revenue trend</strong>
          <span style={{ color: theme.muted, fontSize: 14, fontWeight: 760 }}>Last 8 periods</span>
        </div>
        <div style={{ alignItems: 'end', display: 'flex', gap: 12, height: 230 }}>
          {bars.map((height, index) => <span key={`${height}-${index}`} style={{ background: index > 5 ? theme.accent : '#DCE6DF', borderRadius: 10, flex: 1, height }} />)}
        </div>
      </div>
    </AppShellMock>
  )
}

export function TableMock({ rows, theme }: { rows?: SaaSProductScreen['rows']; theme: SaaSTheme }) {
  const tableRows = rows || [
    { Account: 'Acme Co', Status: 'Active', Value: '$42k' },
    { Account: 'Northstar', Status: 'Review', Value: '$31k' },
    { Account: 'Atlas', Status: 'Closed', Value: '$28k' },
    { Account: 'Riverline', Status: 'Active', Value: '$18k' },
  ]
  const columns = Object.keys(tableRows[0] || { Account: '', Status: '', Value: '' })
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 22, overflow: 'hidden' }}>
      <div style={{ background: '#F8FBF9', borderBottom: `1px solid ${theme.border}`, display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
        {columns.map((column) => <span key={column} style={{ color: theme.muted, fontSize: 14, fontWeight: 850, letterSpacing: 0, padding: '14px 16px' }}>{column}</span>)}
      </div>
      {tableRows.map((row, index) => (
        <div key={index} style={{ borderBottom: index === tableRows.length - 1 ? 'none' : `1px solid ${theme.border}`, display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((column) => <span key={column} style={{ color: column === 'Status' ? theme.accent : theme.text, fontSize: 15, fontWeight: column === 'Status' ? 850 : 720, letterSpacing: 0, padding: '14px 16px' }}>{row[column]}</span>)}
        </div>
      ))}
    </div>
  )
}

export function KanbanMock({ theme }: { theme: SaaSTheme }) {
  const columns = [
    { title: 'New', cards: ['Lead enriched', 'Demo requested', 'Inbound scored'] },
    { title: 'Working', cards: ['Proposal drafted', 'Security review', 'Pricing approved'] },
    { title: 'Done', cards: ['Contract signed', 'Onboarding started', 'Renewal saved'] },
  ]
  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {columns.map((column, columnIndex) => (
        <section key={column.title} style={{ background: '#F8FBF9', border: `1px solid ${theme.border}`, borderRadius: 22, display: 'grid', gap: 12, padding: 16 }}>
          <strong style={{ color: theme.text, fontSize: 18, fontWeight: 860, letterSpacing: 0 }}>{column.title}</strong>
          {column.cards.map((card, index) => (
            <div key={card} style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 16, boxShadow: columnIndex === 1 && index === 0 ? '0 18px 40px rgba(20,24,22,0.12)' : 'none', display: 'grid', gap: 8, padding: 14 }}>
              <span style={{ color: theme.text, fontSize: 15, fontWeight: 780, letterSpacing: 0 }}>{card}</span>
              <span style={{ background: index === 0 ? theme.accent : '#DDE7E1', borderRadius: 999, display: 'block', height: 7, width: `${56 + index * 12}%` }} />
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

export function CommandPaletteMock({ theme }: { theme: SaaSTheme }) {
  const actions = ['Create weekly report', 'Sync CRM accounts', 'Forecast next quarter', 'Invite finance team']
  return (
    <div style={{ background: theme.text, borderRadius: 28, boxShadow: '0 34px 90px rgba(20,24,22,0.22)', color: '#FFFFFF', display: 'grid', gap: 16, padding: 22 }}>
      <div style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 18, color: 'rgba(255,255,255,0.78)', fontSize: 20, fontWeight: 760, letterSpacing: 0, padding: '16px 18px' }}>Ask the workspace...</div>
      {actions.map((action, index) => (
        <div key={action} style={{ alignItems: 'center', background: index === 0 ? 'rgba(255,255,255,0.14)' : 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, display: 'flex', justifyContent: 'space-between', padding: '14px 16px' }}>
          <span style={{ fontSize: 18, fontWeight: 760, letterSpacing: 0 }}>{action}</span>
          <span style={{ color: index === 0 ? '#A8F0C6' : 'rgba(255,255,255,0.48)', fontSize: 15, fontWeight: 850 }}>⌘K</span>
        </div>
      ))}
    </div>
  )
}

export function ChatAssistantMock({ theme }: { theme: SaaSTheme }) {
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 26, display: 'grid', gap: 16, padding: 20 }}>
      {[
        ['user', 'Show me churn risk by segment'],
        ['assistant', 'I found 3 cohorts with elevated risk and prepared a retention plan.'],
        ['user', 'Turn that into a board summary'],
        ['assistant', 'Done. I created an executive narrative with metrics and next steps.'],
      ].map(([role, text]) => (
        <div key={text} style={{ alignSelf: role === 'user' ? 'end' : 'start', background: role === 'user' ? theme.text : '#F8FBF9', border: `1px solid ${role === 'user' ? theme.text : theme.border}`, borderRadius: 18, color: role === 'user' ? '#FFFFFF' : theme.text, fontSize: 18, fontWeight: 690, letterSpacing: 0, lineHeight: 1.28, maxWidth: 470, padding: '14px 16px' }}>
          {text}
        </div>
      ))}
    </div>
  )
}
