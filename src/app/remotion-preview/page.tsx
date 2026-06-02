'use client'

import { Player } from '@remotion/player'
import type { ComponentType, ReactNode } from 'react'
import { useMemo, useState } from 'react'

import {
  AIChatWorkspaceMock,
  AuditLogMock,
  BeforeAfterSlider,
  BrowserFrame,
  CommandPaletteMock,
  ConnectionLine,
  CursorTrail,
  DashboardMock,
  FeatureMatrix,
  FloatingScreenshot,
  getSaaSIntroDurationInFrames,
  HotspotPulse,
  InboxTriageMock,
  IntegrationHubMock,
  KanbanMock,
  ledgerAIIntroConfig,
  LogoCloud,
  MetricCard,
  NumberTicker,
  PhoneFrame,
  PricingCard,
  ProgressRing,
  Reveal,
  resolveSaaSTheme,
  SaaSIntroVideo,
  ScreenCarousel,
  SettingsPermissionsMock,
  TableMock,
  TabletFrame,
  TestimonialCard,
  TypingText,
  UseCaseCard,
} from '@/remotion/saas/index'

type CatalogKind = 'Componentes' | 'Mockups' | 'Motion' | 'Marketing' | 'Templates'

type CatalogItem = {
  code: string
  component: ComponentType
  description: string
  height?: number
  kind: CatalogKind
  label: string
  tags: string[]
  value: string
  width?: number
  duration?: number
}

const theme = resolveSaaSTheme(ledgerAIIntroConfig.brand)

const metrics = [
  { label: 'Close time', value: '3 days', delta: 'from 11 days' },
  { label: 'Manual checks', value: '-64%', delta: 'automated' },
  { label: 'Forecast accuracy', value: '+18%', delta: 'month over month' },
]

const productScreens = [
  { accent: '#245BDB', eyebrow: 'Analytics', metric: '+24%', title: 'Executive dashboard' },
  { accent: '#22A06B', eyebrow: 'Actions', metric: '98 flows', title: 'Workflow center' },
  { accent: '#C28F2C', eyebrow: 'Reports', metric: '5 reports', title: 'Board narratives' },
]

const logos = [
  { label: 'Stripe', mark: 'S' },
  { label: 'HubSpot', mark: 'H' },
  { label: 'QuickBooks', mark: 'Q' },
  { label: 'Salesforce', mark: 'SF' },
  { label: 'Google Ads', mark: 'G' },
  { label: 'Shopify', mark: 'S' },
]

function DemoStage({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: theme.background,
        color: theme.text,
        display: 'flex',
        fontFamily: theme.fontFamily,
        height: '100%',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: compact ? 36 : 56,
        position: 'relative',
        width: '100%',
      }}
    >
      <div style={{ background: `radial-gradient(circle at 52% 44%, ${theme.accent}24, rgba(255,255,255,0) 58%)`, inset: -80, position: 'absolute' }} />
      <div style={{ position: 'relative', width: '100%' }}>{children}</div>
    </div>
  )
}

function BrowserFrameDemo() {
  return (
    <DemoStage>
      <BrowserFrame theme={theme} url="ledger.ai/workspace">
        <DashboardMock metrics={metrics} screen={productScreens[0]} theme={theme} />
      </BrowserFrame>
    </DemoStage>
  )
}

function DeviceFramesDemo() {
  return (
    <DemoStage>
      <div style={{ alignItems: 'end', display: 'flex', gap: 28, justifyContent: 'center' }}>
        <TabletFrame style={{ height: 430, width: 650 }} theme={theme}>
          <DashboardMock metrics={metrics} screen={productScreens[1]} theme={theme} />
        </TabletFrame>
        <PhoneFrame style={{ height: 500, width: 250 }} theme={theme}>
          <InboxTriageMock theme={theme} />
        </PhoneFrame>
      </div>
    </DemoStage>
  )
}

function FloatingScreenshotDemo() {
  return (
    <DemoStage>
      <div style={{ display: 'grid', justifyContent: 'center' }}>
        <FloatingScreenshot active label="Revenue command center" metric="+24%" theme={theme} />
      </div>
    </DemoStage>
  )
}

function MetricCardDemo() {
  return (
    <DemoStage compact>
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {metrics.map((metric, index) => <MetricCard key={metric.label} index={index} metric={metric} theme={theme} />)}
      </div>
    </DemoStage>
  )
}

function DashboardMockDemo() {
  return (
    <DemoStage>
      <BrowserFrame theme={theme}>
        <DashboardMock metrics={metrics} screen={productScreens[0]} theme={theme} />
      </BrowserFrame>
    </DemoStage>
  )
}

function TableMockDemo() {
  return (
    <DemoStage compact>
      <TableMock theme={theme} />
    </DemoStage>
  )
}

function KanbanMockDemo() {
  return (
    <DemoStage compact>
      <KanbanMock theme={theme} />
    </DemoStage>
  )
}

function CommandPaletteDemo() {
  return (
    <DemoStage compact>
      <CommandPaletteMock theme={theme} />
    </DemoStage>
  )
}

function IntegrationHubDemo() {
  return (
    <DemoStage compact>
      <IntegrationHubMock apps={logos} centerLabel="Ledger AI" theme={theme} />
    </DemoStage>
  )
}

function AuditLogDemo() {
  return (
    <DemoStage compact>
      <AuditLogMock theme={theme} />
    </DemoStage>
  )
}

function PermissionsDemo() {
  return (
    <DemoStage compact>
      <SettingsPermissionsMock theme={theme} />
    </DemoStage>
  )
}

function InboxDemo() {
  return (
    <DemoStage compact>
      <InboxTriageMock theme={theme} />
    </DemoStage>
  )
}

function AIChatDemo() {
  return (
    <DemoStage compact>
      <AIChatWorkspaceMock theme={theme} />
    </DemoStage>
  )
}

function MotionRevealDemo() {
  return (
    <DemoStage compact>
      <div style={{ display: 'grid', gap: 18, margin: '0 auto', maxWidth: 720 }}>
        {[0, 1, 2].map((index) => (
          <Reveal key={index} delay={index * 14}>
            <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 22, display: 'flex', justifyContent: 'space-between', padding: 22 }}>
              <strong style={{ color: theme.text, fontSize: 24, letterSpacing: 0 }}>Reveal block {index + 1}</strong>
              <span style={{ color: theme.accent, fontSize: 20, fontWeight: 900 }}>Ready</span>
            </div>
          </Reveal>
        ))}
      </div>
    </DemoStage>
  )
}

function TypingTextDemo() {
  return (
    <DemoStage compact>
      <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 24, margin: '0 auto', padding: 28, width: 760 }}>
        <TypingText delay={12} speed={1.3} style={{ fontSize: 34, lineHeight: 1.18 }} text="Generate the board report from live finance data" theme={theme} />
      </div>
    </DemoStage>
  )
}

function NumberTickerDemo() {
  return (
    <DemoStage compact>
      <div style={{ display: 'grid', gap: 14, justifyItems: 'center' }}>
        <NumberTicker style={{ color: theme.text, fontSize: 96, fontWeight: 940, letterSpacing: 0 }} suffix="h" to={184} />
        <span style={{ color: theme.muted, fontSize: 24, fontWeight: 760 }}>hours saved this month</span>
      </div>
    </DemoStage>
  )
}

function HotspotDemo() {
  return (
    <DemoStage>
      <BrowserFrame theme={theme}>
        <div style={{ height: 560, position: 'relative' }}>
          <DashboardMock metrics={metrics} screen={productScreens[0]} theme={theme} />
          <HotspotPulse label="New insight" left={610} theme={theme} top={250} />
        </div>
      </BrowserFrame>
    </DemoStage>
  )
}

function CursorTrailDemo() {
  return (
    <DemoStage compact>
      <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 28, height: 520, margin: '0 auto', position: 'relative', width: 860 }}>
        <ConnectionLine from={{ x: 150, y: 160 }} theme={theme} to={{ x: 680, y: 360 }} />
        <CursorTrail path={[{ x: 120, y: 120 }, { x: 260, y: 190 }, { x: 440, y: 280 }, { x: 680, y: 360 }]} theme={theme} />
      </div>
    </DemoStage>
  )
}

function ProgressRingDemo() {
  return (
    <DemoStage compact>
      <div style={{ display: 'flex', gap: 34, justifyContent: 'center' }}>
        <ProgressRing label="84%" progress={0.84} theme={theme} />
        <ProgressRing label="62%" progress={0.62} theme={theme} />
        <ProgressRing label="91%" progress={0.91} theme={theme} />
      </div>
    </DemoStage>
  )
}

function LogoCloudDemo() {
  return (
    <DemoStage compact>
      <LogoCloud logos={logos} theme={theme} />
    </DemoStage>
  )
}

function TestimonialDemo() {
  return (
    <DemoStage compact>
      <TestimonialCard author="Marina Costa" metric={{ label: 'Close cycle reduction', value: '68%' }} quote="The product turned our weekly reporting process into a live operating rhythm." role="VP Finance, Northstar" theme={theme} />
    </DemoStage>
  )
}

function PricingDemo() {
  return (
    <DemoStage compact>
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr', margin: '0 auto', maxWidth: 860 }}>
        <PricingCard features={['Dashboards', 'Reports', 'Approvals']} name="Growth" price="$49" theme={theme} />
        <PricingCard features={['Automations', 'Audit logs', 'SAML']} highlighted name="Scale" price="$149" theme={theme} />
      </div>
    </DemoStage>
  )
}

function FeatureMatrixDemo() {
  return (
    <DemoStage compact>
      <FeatureMatrix
        features={[
          { description: 'Connects ERP, CRM and revenue systems.', metric: 'Live', title: 'Data sync' },
          { description: 'Routes exceptions to owners with status.', metric: 'Automated', title: 'Approvals' },
          { description: 'Creates board-ready narratives.', metric: 'Export', title: 'Reports' },
        ]}
        theme={theme}
      />
    </DemoStage>
  )
}

function UseCaseDemo() {
  return (
    <DemoStage compact>
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <UseCaseCard description="Spot risk before month-end." metric="Finance" theme={theme} title="Close management" />
        <UseCaseCard description="Route approvals and follow-ups." metric="Ops" theme={theme} title="Workflow control" />
        <UseCaseCard description="Turn live data into narratives." metric="Board" theme={theme} title="Executive reporting" />
      </div>
    </DemoStage>
  )
}

function BeforeAfterDemo() {
  return (
    <DemoStage compact>
      <BeforeAfterSlider
        after={<DashboardMock metrics={metrics} screen={productScreens[1]} theme={theme} />}
        before={<TableMock theme={theme} />}
        theme={theme}
      />
    </DemoStage>
  )
}

function ScreenCarouselDemo() {
  return (
    <DemoStage compact>
      <ScreenCarousel screens={productScreens} theme={theme} />
    </DemoStage>
  )
}

function SaaSIntroTemplateDemo() {
  return <SaaSIntroVideo config={ledgerAIIntroConfig} />
}

const catalog: CatalogItem[] = [
  {
    code: '<BrowserFrame theme={theme} url="ledger.ai/workspace">...</BrowserFrame>',
    component: BrowserFrameDemo,
    description: 'Frame de navegador para hero, product tour e screenshots de produto.',
    kind: 'Componentes',
    label: 'BrowserFrame',
    tags: ['Frame', 'Desktop', 'Product'],
    value: 'browser-frame',
  },
  {
    code: '<PhoneFrame theme={theme}>...</PhoneFrame>\n<TabletFrame theme={theme}>...</TabletFrame>',
    component: DeviceFramesDemo,
    description: 'Frames de phone/tablet para demos responsivas.',
    kind: 'Componentes',
    label: 'Device Frames',
    tags: ['Device', 'Mobile', 'Responsive'],
    value: 'device-frames',
  },
  {
    code: '<FloatingScreenshot active label="Revenue" metric="+24%" theme={theme} />',
    component: FloatingScreenshotDemo,
    description: 'Card flutuante para screenshots, galerias e hero stacks.',
    kind: 'Componentes',
    label: 'FloatingScreenshot',
    tags: ['Screenshot', 'Card', 'Gallery'],
    value: 'floating-screenshot',
  },
  {
    code: '<MetricCard metric={metric} index={0} theme={theme} />',
    component: MetricCardDemo,
    description: 'Card de métrica com variação escura para destaque.',
    kind: 'Componentes',
    label: 'MetricCard',
    tags: ['Metric', 'KPI', 'Proof'],
    value: 'metric-card',
  },
  {
    code: '<DashboardMock metrics={metrics} screen={screen} theme={theme} />',
    component: DashboardMockDemo,
    description: 'Dashboard SaaS genérico com KPIs, header e gráfico.',
    kind: 'Mockups',
    label: 'DashboardMock',
    tags: ['Dashboard', 'Analytics', 'Product'],
    value: 'dashboard-mock',
  },
  {
    code: '<TableMock rows={rows} theme={theme} />',
    component: TableMockDemo,
    description: 'Tabela analítica para data products, CRM e backoffice.',
    kind: 'Mockups',
    label: 'TableMock',
    tags: ['Table', 'Data', 'Grid'],
    value: 'table-mock',
  },
  {
    code: '<KanbanMock theme={theme} />',
    component: KanbanMockDemo,
    description: 'Kanban de processo para workflow, CRM ou onboarding.',
    kind: 'Mockups',
    label: 'KanbanMock',
    tags: ['Kanban', 'Workflow', 'Cards'],
    value: 'kanban-mock',
  },
  {
    code: '<CommandPaletteMock theme={theme} />',
    component: CommandPaletteDemo,
    description: 'Command palette para produtos AI-first e automações.',
    kind: 'Mockups',
    label: 'CommandPaletteMock',
    tags: ['Command', 'AI', 'Actions'],
    value: 'command-palette',
  },
  {
    code: '<IntegrationHubMock apps={apps} centerLabel="Ledger AI" theme={theme} />',
    component: IntegrationHubDemo,
    description: 'Hub radial de integrações e sistemas conectados.',
    kind: 'Mockups',
    label: 'IntegrationHubMock',
    tags: ['Integrations', 'Hub', 'Network'],
    value: 'integration-hub',
  },
  {
    code: '<AuditLogMock events={events} theme={theme} />',
    component: AuditLogDemo,
    description: 'Log de auditoria para segurança, compliance e operações.',
    kind: 'Mockups',
    label: 'AuditLogMock',
    tags: ['Audit', 'Security', 'Log'],
    value: 'audit-log',
  },
  {
    code: '<SettingsPermissionsMock theme={theme} />',
    component: PermissionsDemo,
    description: 'Matriz de permissões por papel para SaaS enterprise.',
    kind: 'Mockups',
    label: 'SettingsPermissionsMock',
    tags: ['Settings', 'Permissions', 'Enterprise'],
    value: 'permissions',
  },
  {
    code: '<InboxTriageMock theme={theme} />',
    component: InboxDemo,
    description: 'Inbox com priorização para triagem operacional.',
    kind: 'Mockups',
    label: 'InboxTriageMock',
    tags: ['Inbox', 'Triage', 'Ops'],
    value: 'inbox-triage',
  },
  {
    code: '<AIChatWorkspaceMock theme={theme} />',
    component: AIChatDemo,
    description: 'Chat de IA com plano de ação e contexto de workspace.',
    kind: 'Mockups',
    label: 'AIChatWorkspaceMock',
    tags: ['AI', 'Chat', 'Workspace'],
    value: 'ai-chat-workspace',
  },
  {
    code: '<Reveal delay={20}>...</Reveal>',
    component: MotionRevealDemo,
    description: 'Entrada simples para cards e blocos de conteúdo.',
    kind: 'Motion',
    label: 'Reveal',
    tags: ['Motion', 'Entrance', 'Stagger'],
    value: 'reveal',
  },
  {
    code: '<TypingText text="Generate report..." theme={theme} />',
    component: TypingTextDemo,
    description: 'Texto digitando para AI assistants e command bars.',
    kind: 'Motion',
    label: 'TypingText',
    tags: ['Typing', 'AI', 'Text'],
    value: 'typing-text',
  },
  {
    code: '<NumberTicker to={184} suffix="h" />',
    component: NumberTickerDemo,
    description: 'Contador numérico para métricas de impacto.',
    kind: 'Motion',
    label: 'NumberTicker',
    tags: ['Counter', 'Metric', 'Motion'],
    value: 'number-ticker',
  },
  {
    code: '<HotspotPulse label="New insight" left={610} top={250} theme={theme} />',
    component: HotspotDemo,
    description: 'Hotspot pulsante para apontar detalhes de interface.',
    kind: 'Motion',
    label: 'HotspotPulse',
    tags: ['Hotspot', 'Pulse', 'Tour'],
    value: 'hotspot-pulse',
  },
  {
    code: '<CursorTrail path={[...]} theme={theme} />\n<ConnectionLine from={...} to={...} theme={theme} />',
    component: CursorTrailDemo,
    description: 'Cursor e linha para guiar interações e conexões.',
    kind: 'Motion',
    label: 'Cursor + Connection',
    tags: ['Cursor', 'Line', 'Interaction'],
    value: 'cursor-connection',
  },
  {
    code: '<ProgressRing progress={0.84} label="84%" theme={theme} />',
    component: ProgressRingDemo,
    description: 'Ring de progresso para status, score e completion.',
    kind: 'Motion',
    label: 'ProgressRing',
    tags: ['Progress', 'Score', 'Status'],
    value: 'progress-ring',
  },
  {
    code: '<LogoCloud logos={logos} theme={theme} />',
    component: LogoCloudDemo,
    description: 'Cloud de logos para integrações ou social proof.',
    kind: 'Marketing',
    label: 'LogoCloud',
    tags: ['Logos', 'Integrations', 'Proof'],
    value: 'logo-cloud',
  },
  {
    code: '<TestimonialCard quote="..." author="..." theme={theme} />',
    component: TestimonialDemo,
    description: 'Card de depoimento com métrica opcional.',
    kind: 'Marketing',
    label: 'TestimonialCard',
    tags: ['Quote', 'Customer', 'Proof'],
    value: 'testimonial-card',
  },
  {
    code: '<PricingCard highlighted name="Scale" price="$149" features={features} theme={theme} />',
    component: PricingDemo,
    description: 'Card de pricing para planos, upsell e packaging.',
    kind: 'Marketing',
    label: 'PricingCard',
    tags: ['Pricing', 'Plan', 'CTA'],
    value: 'pricing-card',
  },
  {
    code: '<FeatureMatrix features={features} theme={theme} />',
    component: FeatureMatrixDemo,
    description: 'Matriz de features para diferenciais e comparação.',
    kind: 'Marketing',
    label: 'FeatureMatrix',
    tags: ['Features', 'Matrix', 'Compare'],
    value: 'feature-matrix',
  },
  {
    code: '<UseCaseCard title="Close management" metric="Finance" theme={theme} />',
    component: UseCaseDemo,
    description: 'Cards de caso de uso por persona, função ou segmento.',
    kind: 'Marketing',
    label: 'UseCaseCard',
    tags: ['Use case', 'Persona', 'Cards'],
    value: 'use-case-card',
  },
  {
    code: '<BeforeAfterSlider before={...} after={...} theme={theme} />',
    component: BeforeAfterDemo,
    description: 'Slider before/after para transformação visual.',
    kind: 'Marketing',
    label: 'BeforeAfterSlider',
    tags: ['Before', 'After', 'Compare'],
    value: 'before-after-slider',
  },
  {
    code: '<ScreenCarousel screens={screens} theme={theme} />',
    component: ScreenCarouselDemo,
    description: 'Carousel de telas para hero e product tours.',
    kind: 'Marketing',
    label: 'ScreenCarousel',
    tags: ['Carousel', 'Screens', 'Gallery'],
    value: 'screen-carousel',
  },
  {
    code: '<SaaSIntroVideo config={ledgerAIIntroConfig} />',
    component: SaaSIntroTemplateDemo,
    description: 'Template completo gerado por config, usando os blocos da biblioteca.',
    duration: getSaaSIntroDurationInFrames(ledgerAIIntroConfig),
    height: 1080,
    kind: 'Templates',
    label: 'SaaSIntroVideo',
    tags: ['Template', 'Intro', 'Config'],
    value: 'saas-intro-video',
    width: 1920,
  },
]

const kinds: Array<'Todos' | CatalogKind> = ['Todos', 'Componentes', 'Mockups', 'Motion', 'Marketing', 'Templates']

function Thumbnail({ item }: { item: CatalogItem }) {
  const color = item.kind === 'Motion' ? '#245BDB' : item.kind === 'Marketing' ? '#C28F2C' : item.kind === 'Templates' ? '#7C3AED' : item.kind === 'Mockups' ? '#22A06B' : '#101828'
  return (
    <div style={{ background: '#F8FBF9', border: '1px solid #E3E8EF', borderRadius: 12, display: 'grid', gap: 10, height: 96, padding: 12 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ background: color, borderRadius: 999, display: 'block', height: 10, width: 10 }} />
        <span style={{ background: '#D9E2F1', borderRadius: 999, display: 'block', height: 8, width: 52 }} />
      </div>
      {item.kind === 'Motion' ? (
        <div style={{ position: 'relative' }}>
          <span style={{ background: '#D9E2F1', borderRadius: 999, display: 'block', height: 3, marginTop: 30, width: '100%' }} />
          <span style={{ background: color, borderRadius: 999, display: 'block', height: 18, left: '54%', position: 'absolute', top: 21, width: 18 }} />
        </div>
      ) : item.kind === 'Marketing' ? (
        <div style={{ display: 'grid', gap: 7, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[0, 1, 2].map((index) => <span key={index} style={{ background: index === 1 ? color : '#E3E8EF', borderRadius: 10, height: 42 }} />)}
        </div>
      ) : (
        <div style={{ alignItems: 'end', display: 'flex', gap: 6, height: 48 }}>
          {[26, 38, 30, 48, 34].map((height, index) => <span key={height} style={{ background: index === 3 ? color : '#D9E2F1', borderRadius: 6, flex: 1, height }} />)}
        </div>
      )}
    </div>
  )
}

export default function RemotionPreviewPage() {
  const [selectedKind, setSelectedKind] = useState<'Todos' | CatalogKind>('Componentes')
  const [query, setQuery] = useState('')
  const [selectedValue, setSelectedValue] = useState('browser-frame')

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return catalog.filter((item) => {
      const matchesKind = selectedKind === 'Todos' || item.kind === selectedKind
      const searchable = `${item.label} ${item.description} ${item.kind} ${item.tags.join(' ')}`.toLowerCase()
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery)
      return matchesKind && matchesQuery
    })
  }, [query, selectedKind])

  const selectedItem = catalog.find((item) => item.value === selectedValue) || visibleItems[0] || catalog[0]
  const SelectedComponent = selectedItem.component
  const width = selectedItem.width || 1280
  const height = selectedItem.height || 720
  const duration = selectedItem.duration || 180
  const aspectRatio = `${width} / ${height}`

  return (
    <main style={{ background: '#F4F6F3', color: '#101828', display: 'grid', fontFamily: theme.fontFamily, gridTemplateColumns: '248px minmax(0, 1fr)', minHeight: '100vh' }}>
      <aside style={{ background: '#FFFFFF', borderRight: '1px solid #E3E8EF', display: 'grid', gridTemplateRows: 'auto 1fr auto', minHeight: '100vh', padding: 22, position: 'sticky', top: 0 }}>
        <div style={{ display: 'grid', gap: 26 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span style={{ color: theme.accent, fontSize: 12, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>Remotion</span>
            <h1 style={{ color: theme.text, fontSize: 27, fontWeight: 900, letterSpacing: 0, lineHeight: 1.02, margin: 0 }}>Component Library</h1>
            <p style={{ color: theme.muted, fontSize: 13, fontWeight: 650, lineHeight: 1.42, margin: 0 }}>Blocos reutilizáveis para vídeos introdutórios de SaaS.</p>
          </div>
          <nav style={{ display: 'grid', gap: 8 }}>
            {kinds.map((kind) => {
              const active = selectedKind === kind
              const count = kind === 'Todos' ? catalog.length : catalog.filter((item) => item.kind === kind).length
              return (
                <button
                  key={kind}
                  onClick={() => setSelectedKind(kind)}
                  style={{
                    alignItems: 'center',
                    background: active ? '#EFF6FF' : 'transparent',
                    border: active ? '1px solid #BBD5FF' : '1px solid transparent',
                    borderRadius: 12,
                    color: active ? '#245BDB' : theme.text,
                    cursor: 'pointer',
                    display: 'flex',
                    fontSize: 14,
                    fontWeight: 820,
                    justifyContent: 'space-between',
                    letterSpacing: 0,
                    padding: '11px 12px',
                    textAlign: 'left',
                  }}
                  type="button"
                >
                  <span>{kind}</span>
                  <span style={{ color: active ? '#245BDB' : theme.muted, fontSize: 12 }}>{count}</span>
                </button>
              )
            })}
          </nav>
        </div>
        <div />
        <div style={{ background: '#F8FBF9', border: '1px solid #E3E8EF', borderRadius: 14, display: 'grid', gap: 7, padding: 14 }}>
          <strong style={{ color: theme.text, fontSize: 13, fontWeight: 880 }}>Formato</strong>
          <span style={{ color: theme.muted, fontSize: 12, fontWeight: 650, lineHeight: 1.35 }}>Componentes isolados, mockups e templates por config.</span>
        </div>
      </aside>

      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: 'minmax(520px, 1fr) minmax(460px, 560px)', padding: 30 }}>
        <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
          <header style={{ alignItems: 'end', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <h2 style={{ color: theme.text, fontSize: 34, fontWeight: 920, letterSpacing: 0, margin: 0 }}>Catálogo</h2>
              <span style={{ color: theme.muted, fontSize: 14, fontWeight: 680 }}>{visibleItems.length} componentes encontrados</span>
            </div>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar componente"
              style={{ background: '#FFFFFF', border: '1px solid #D9E2F1', borderRadius: 12, color: theme.text, fontSize: 14, fontWeight: 700, outline: 'none', padding: '13px 14px', width: 280 }}
              value={query}
            />
          </header>

          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            {visibleItems.map((item) => {
              const active = selectedItem.value === item.value
              return (
                <button
                  key={item.value}
                  onClick={() => setSelectedValue(item.value)}
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${active ? '#245BDB' : '#E3E8EF'}`,
                    borderRadius: 16,
                    boxShadow: active ? '0 20px 54px rgba(36,91,219,0.16)' : '0 10px 30px rgba(16,24,40,0.04)',
                    cursor: 'pointer',
                    display: 'grid',
                    gap: 12,
                    minHeight: 236,
                    padding: 14,
                    textAlign: 'left',
                  }}
                  type="button"
                >
                  <Thumbnail item={item} />
                  <div style={{ display: 'grid', gap: 7 }}>
                    <div style={{ alignItems: 'start', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                      <strong style={{ color: theme.text, fontSize: 17, fontWeight: 900, letterSpacing: 0, lineHeight: 1.08 }}>{item.label}</strong>
                      <span style={{ background: '#EFF6FF', borderRadius: 999, color: '#245BDB', fontSize: 10, fontWeight: 900, padding: '5px 7px', textTransform: 'uppercase' }}>{item.kind}</span>
                    </div>
                    <span style={{ color: theme.muted, fontSize: 12, fontWeight: 650, lineHeight: 1.35 }}>{item.description}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 'auto' }}>
                    {item.tags.slice(0, 3).map((tag) => <span key={tag} style={{ background: '#F4F6F8', borderRadius: 999, color: '#5E6D82', fontSize: 10, fontWeight: 850, padding: '5px 7px' }}>{tag}</span>)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <aside style={{ alignSelf: 'start', display: 'grid', gap: 16, position: 'sticky', top: 30 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E3E8EF', borderRadius: 18, boxShadow: '0 22px 64px rgba(16,24,40,0.08)', overflow: 'hidden', padding: 12 }}>
            <Player
              key={selectedItem.value}
              component={SelectedComponent}
              compositionHeight={height}
              compositionWidth={width}
              controls
              durationInFrames={duration}
              fps={30}
              style={{
                aspectRatio,
                background: theme.background,
                borderRadius: 12,
                maxHeight: selectedItem.kind === 'Templates' ? '58vh' : '52vh',
                width: '100%',
              }}
            />
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E3E8EF', borderRadius: 18, boxShadow: '0 18px 46px rgba(16,24,40,0.05)', display: 'grid', gap: 16, padding: 18 }}>
            <div style={{ alignItems: 'start', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <div style={{ display: 'grid', gap: 5 }}>
                <span style={{ color: '#245BDB', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>{selectedItem.kind}</span>
                <h3 style={{ color: theme.text, fontSize: 25, fontWeight: 920, letterSpacing: 0, lineHeight: 1.04, margin: 0 }}>{selectedItem.label}</h3>
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(selectedItem.code)}
                style={{ background: '#EFF6FF', border: 0, borderRadius: 999, color: '#245BDB', cursor: 'pointer', fontSize: 12, fontWeight: 900, padding: '9px 12px' }}
                type="button"
              >
                Copiar
              </button>
            </div>
            <p style={{ color: theme.muted, fontSize: 14, fontWeight: 650, lineHeight: 1.45, margin: 0 }}>{selectedItem.description}</p>
            <pre style={{ background: '#101828', borderRadius: 14, color: '#E4E7EC', fontSize: 12, lineHeight: 1.55, margin: 0, overflow: 'auto', padding: 14, whiteSpace: 'pre-wrap' }}>
              <code>{selectedItem.code}</code>
            </pre>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {selectedItem.tags.map((tag) => <span key={tag} style={{ background: '#F4F6F8', borderRadius: 999, color: '#5E6D82', fontSize: 11, fontWeight: 850, padding: '7px 9px' }}>{tag}</span>)}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
