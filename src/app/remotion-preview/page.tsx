'use client'

import { Player } from '@remotion/player'
import type { ComponentType, ReactNode } from 'react'
import { useMemo, useState } from 'react'

import {
  AccountingEntryAnimation,
  AIAgentStepsAnimation,
  ApprovalFlowAnimation,
  BankReconciliationAnimation,
  ChatGptWebAnimation,
  ClaudeWebAnimation,
  ClosingSlidesAnimation,
  CompareScenariosAnimation,
  ContractManagementAnimation,
  DashboardsAnimation,
  DataPipelineAnimation,
  EmailAnimation,
  ExpenseClassificationAnimation,
  FileUploadProcessingAnimation,
  ForecastAnimation,
  InboxAnimation,
  IntegrationFlowAnimation,
  ManagementReportAnimation,
  MCP_SINGLE_ANIMATION_DURATION,
  MobileAppDemoAnimation,
  NewsAnimation,
  NotificationCenterAnimation,
  ReportExportAnimation,
  SaaSAccordionGalleryAnimation,
  SaaSArtifactDashboardMosaicGalleryAnimation,
  SaaSArtifactDeckCarouselGalleryAnimation,
  SaaSArtifactLedgerFlowGalleryAnimation,
  SaaSArtifactPageStackGalleryAnimation,
  SaaSArtifactPipelineGalleryAnimation,
  SaaSArtifactReconciliationMatchGalleryAnimation,
  SaaSArtifactRiskBoardGalleryAnimation,
  SaaSBeforeAfterAnimation,
  SaaSBentoGalleryAnimation,
  SaaSCarouselGalleryAnimation,
  SaaSCommandCenterAnimation,
  SaaSCoverflowGalleryAnimation,
  SaaSDeviceGalleryAnimation,
  SaaSDocumentFanGalleryAnimation,
  SaaSGridZoomGalleryAnimation,
  SaaSKanbanFlowAnimation,
  SaaSLogoCloudAnimation,
  SaaSMagnifierGalleryAnimation,
  SaaSMarqueeGalleryAnimation,
  SaaSMetricCounterAnimation,
  SaaSNetworkMapAnimation,
  SaaSOrbitAnimation,
  SaaSProductTourAnimation,
  SaaSRoom3DGalleryAnimation,
  SaaSSpotlightGalleryAnimation,
  SaaSStackGalleryAnimation,
  SaaSStoryboardGalleryAnimation,
  SaaSSwipeCardsGalleryAnimation,
  SaaSTimelineAnimation,
  SaaSWallGalleryAnimation,
  TableDrilldownAnimation,
  TweetAnimation,
} from '@/remotion/compositions/McpOperationsDemo'
import {
  AIChatWorkspaceMock,
  AnimatedBarGroup,
  AnimatedLineChart,
  AuditLogMock,
  BeforeAfterSlider,
  BrowserFrame,
  CalloutConnector,
  CardStack,
  CharacterReveal,
  CheckmarkDraw,
  ClickRipple,
  CommandPaletteMock,
  ConnectionLine,
  CursorPath,
  CursorTrail,
  DashboardMock,
  DataRowSweep,
  DeltaBadgeMotion,
  FeatureMatrix,
  FloatingScreenshot,
  FocusRect,
  GaugeMotion,
  getSaaSIntroDurationInFrames,
  GradientTextSweep,
  HotspotPulse,
  InboxTriageMock,
  IntegrationCatalogMock,
  IntegrationFieldMappingMock,
  IntegrationHealthMatrixMock,
  IntegrationHubMock,
  IntegrationPipelineMock,
  KanbanMock,
  ledgerAIIntroConfig,
  LoadingToSuccess,
  LogoCloud,
  MarqueeRow,
  MetricCard,
  MouseClick,
  NumberTicker,
  PhoneFrame,
  PricingCard,
  ProgressBar,
  ProgressRing,
  Reveal,
  resolveSaaSTheme,
  SaaSIntroVideo,
  ScreenCarousel,
  SettingsPermissionsMock,
  SparklineMotion,
  StepIndicator,
  StatusBadgeCycle,
  TableMock,
  TabletFrame,
  TaskCompletionList,
  TestimonialCard,
  TextScramble,
  TextHighlightSweep,
  TooltipCallout,
  TypingText,
  UnderlineDraw,
  UseCaseCard,
  WordReveal,
  ZoomToRegion,
  RotatingWords,
} from '@/remotion/saas/index'

type CatalogKind = 'Componentes' | 'Mockups' | 'Motion' | 'Marketing' | 'Galerias' | 'Animações' | 'Templates'

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

function IntegrationCatalogDemo() {
  return (
    <DemoStage compact>
      <IntegrationCatalogMock theme={theme} />
    </DemoStage>
  )
}

function IntegrationPipelineDemo() {
  return (
    <DemoStage compact>
      <IntegrationPipelineMock theme={theme} />
    </DemoStage>
  )
}

function IntegrationHealthMatrixDemo() {
  return (
    <DemoStage compact>
      <IntegrationHealthMatrixMock theme={theme} />
    </DemoStage>
  )
}

function IntegrationFieldMappingDemo() {
  return (
    <DemoStage compact>
      <IntegrationFieldMappingMock theme={theme} />
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

function WordRevealDemo() {
  return (
    <DemoStage compact>
      <div style={{ margin: '0 auto', maxWidth: 860 }}>
        <WordReveal style={{ fontSize: 54, fontWeight: 920, lineHeight: 1.03 }} text="Close finance work faster with live data" theme={theme} />
      </div>
    </DemoStage>
  )
}

function RotatingWordsDemo() {
  return (
    <DemoStage compact>
      <RotatingWords prefix="Build reports" style={{ fontSize: 56, fontWeight: 920 }} suffix="than before" theme={theme} words={['faster', 'cleaner', 'safer']} />
    </DemoStage>
  )
}

function TextHighlightSweepDemo() {
  return (
    <DemoStage compact>
      <TextHighlightSweep style={{ fontSize: 52, fontWeight: 920, lineHeight: 1.08 }} text="Turn live operational data into a board-ready narrative." theme={theme} />
    </DemoStage>
  )
}

function CursorPathDemo() {
  return (
    <DemoStage>
      <BrowserFrame theme={theme}>
        <div style={{ height: 560, position: 'relative' }}>
          <DashboardMock metrics={metrics} screen={productScreens[0]} theme={theme} />
          <CursorPath path={[{ x: 180, y: 120 }, { x: 420, y: 190 }, { x: 690, y: 320 }, { x: 820, y: 210 }]} theme={theme} />
          <MouseClick delay={75} left={820} theme={theme} top={210} />
        </div>
      </BrowserFrame>
    </DemoStage>
  )
}

function ZoomToRegionDemo() {
  return (
    <DemoStage compact>
      <ZoomToRegion delay={24} region={{ x: 640, y: 250 }} scale={1.18} style={{ borderRadius: 28, height: 560 }}>
        <BrowserFrame theme={theme}>
          <DashboardMock metrics={metrics} screen={productScreens[0]} theme={theme} />
        </BrowserFrame>
      </ZoomToRegion>
    </DemoStage>
  )
}

function CalloutConnectorDemo() {
  return (
    <DemoStage compact>
      <div style={{ height: 560, margin: '0 auto', position: 'relative', width: 900 }}>
        <BrowserFrame theme={theme}>
          <DashboardMock metrics={metrics} screen={productScreens[0]} theme={theme} />
        </BrowserFrame>
        <CalloutConnector end={{ x: 720, y: 180 }} label="Anomaly found" start={{ x: 540, y: 260 }} theme={theme} />
      </div>
    </DemoStage>
  )
}

function AnimatedBarGroupDemo() {
  return (
    <DemoStage compact>
      <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 28, margin: '0 auto', padding: 28, width: 760 }}>
        <AnimatedBarGroup theme={theme} values={[42, 68, 55, 92, 76, 128, 104]} />
      </div>
    </DemoStage>
  )
}

function ProgressBarDemo() {
  return (
    <DemoStage compact>
      <div style={{ display: 'grid', gap: 22, margin: '0 auto', width: 760 }}>
        <ProgressBar label="Data connected" progress={0.84} theme={theme} />
        <ProgressBar delay={16} label="Exceptions resolved" progress={0.62} theme={theme} />
        <ProgressBar delay={32} label="Report ready" progress={0.91} theme={theme} />
      </div>
    </DemoStage>
  )
}

function CardStackDemo() {
  return (
    <DemoStage compact>
      <CardStack>
        {[
          <FloatingScreenshot key="one" label="Finance workspace" metric="+24%" theme={theme} />,
          <FloatingScreenshot key="two" label="Workflow center" metric="98 flows" theme={theme} />,
          <FloatingScreenshot key="three" label="Board report" metric="Ready" theme={theme} />,
        ]}
      </CardStack>
    </DemoStage>
  )
}

function MarqueeRowDemo() {
  return (
    <DemoStage compact>
      <MarqueeRow>
        {productScreens.map((screen) => <FloatingScreenshot key={screen.title} label={screen.title} metric={screen.metric} theme={theme} />)}
      </MarqueeRow>
    </DemoStage>
  )
}

function CharacterRevealDemo() {
  return (
    <DemoStage compact>
      <CharacterReveal style={{ fontSize: 58, fontWeight: 920, lineHeight: 1.04 }} text="Launch faster" theme={theme} />
    </DemoStage>
  )
}

function TextScrambleDemo() {
  return (
    <DemoStage compact>
      <TextScramble style={{ fontSize: 54, fontWeight: 920, lineHeight: 1.08 }} text="BOARD REPORT READY" theme={theme} />
    </DemoStage>
  )
}

function GradientTextSweepDemo() {
  return (
    <DemoStage compact>
      <GradientTextSweep style={{ fontSize: 58, fontWeight: 940, lineHeight: 1.04 }} text="Automate the work behind every report" theme={theme} />
    </DemoStage>
  )
}

function UnderlineDrawDemo() {
  return (
    <DemoStage compact>
      <UnderlineDraw style={{ fontSize: 56, fontWeight: 920 }} text="Reduce manual close work" theme={theme} />
    </DemoStage>
  )
}

function FocusRectDemo() {
  return (
    <DemoStage>
      <BrowserFrame theme={theme}>
        <div style={{ height: 560, position: 'relative' }}>
          <DashboardMock metrics={metrics} screen={productScreens[0]} theme={theme} />
          <FocusRect height={120} label="Drill into risk" left={520} theme={theme} top={180} width={320} />
          <ClickRipple delay={42} left={680} theme={theme} top={240} />
        </div>
      </BrowserFrame>
    </DemoStage>
  )
}

function TooltipCalloutDemo() {
  return (
    <DemoStage>
      <BrowserFrame theme={theme}>
        <div style={{ height: 560, position: 'relative' }}>
          <DashboardMock metrics={metrics} screen={productScreens[0]} theme={theme} />
          <TooltipCallout delay={16} label="AI found a variance before month-end." left={580} theme={theme} top={160} />
        </div>
      </BrowserFrame>
    </DemoStage>
  )
}

function StepIndicatorDemo() {
  return (
    <DemoStage compact>
      <div style={{ display: 'grid', gap: 28, justifyContent: 'center' }}>
        <StepIndicator activeIndex={1} steps={['Connect', 'Analyze', 'Publish']} theme={theme} />
        <TaskCompletionList tasks={['Data synced', 'Exceptions reviewed', 'Board pack generated']} theme={theme} />
      </div>
    </DemoStage>
  )
}

function StatusWorkflowDemo() {
  return (
    <DemoStage compact>
      <div style={{ alignItems: 'center', display: 'flex', gap: 26, justifyContent: 'center' }}>
        <CheckmarkDraw theme={theme} />
        <StatusBadgeCycle statuses={['Syncing', 'Reviewing', 'Ready']} theme={theme} />
        <LoadingToSuccess label="Published" theme={theme} />
      </div>
    </DemoStage>
  )
}

function AnimatedLineChartDemo() {
  return (
    <DemoStage compact>
      <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 28, margin: '0 auto', padding: 34, width: 760 }}>
        <AnimatedLineChart theme={theme} values={[12, 18, 14, 28, 24, 42, 38, 56]} />
      </div>
    </DemoStage>
  )
}

function SparkGaugeDemo() {
  return (
    <DemoStage compact>
      <div style={{ alignItems: 'center', display: 'flex', gap: 40, justifyContent: 'center' }}>
        <SparklineMotion theme={theme} values={[12, 20, 16, 32, 28, 44]} />
        <GaugeMotion label="84%" progress={0.84} theme={theme} />
        <DeltaBadgeMotion label="+18%" theme={theme} />
      </div>
    </DemoStage>
  )
}

function DataRowSweepDemo() {
  return (
    <DemoStage compact>
      <DataRowSweep rows={['ERP sync completed', '8 exceptions detected', '3 approvals routed', 'Board summary generated']} theme={theme} />
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
    code: '<IntegrationCatalogMock theme={theme} />',
    component: IntegrationCatalogDemo,
    description: 'Grade de conectores com categoria, latência e status.',
    kind: 'Mockups',
    label: 'IntegrationCatalogMock',
    tags: ['Integrations', 'Catalog', 'Connectors'],
    value: 'integration-catalog',
  },
  {
    code: '<IntegrationPipelineMock theme={theme} />',
    component: IntegrationPipelineDemo,
    description: 'Pipeline visual de extração, normalização, validação e publicação.',
    kind: 'Mockups',
    label: 'IntegrationPipelineMock',
    tags: ['Integrations', 'Pipeline', 'Sync'],
    value: 'integration-pipeline',
  },
  {
    code: '<IntegrationHealthMatrixMock theme={theme} />',
    component: IntegrationHealthMatrixDemo,
    description: 'Matriz operacional de saúde, latência e volume por conector.',
    kind: 'Mockups',
    label: 'IntegrationHealthMatrixMock',
    tags: ['Integrations', 'Health', 'SLA'],
    value: 'integration-health-matrix',
  },
  {
    code: '<IntegrationFieldMappingMock theme={theme} />',
    component: IntegrationFieldMappingDemo,
    description: 'Mapeamento de campos de origem para o modelo normalizado.',
    kind: 'Mockups',
    label: 'IntegrationFieldMappingMock',
    tags: ['Integrations', 'Mapping', 'Data model'],
    value: 'integration-field-mapping',
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
    code: '<WordReveal text="Close finance work faster" theme={theme} />',
    component: WordRevealDemo,
    description: 'Revela palavras em sequência para headlines premium.',
    kind: 'Motion',
    label: 'WordReveal',
    tags: ['Text', 'Headline', 'Reveal'],
    value: 'word-reveal',
  },
  {
    code: '<RotatingWords prefix="Build reports" words={words} suffix="than before" theme={theme} />',
    component: RotatingWordsDemo,
    description: 'Alterna palavras em uma frase sem remontar o layout.',
    kind: 'Motion',
    label: 'RotatingWords',
    tags: ['Text', 'Loop', 'Headline'],
    value: 'rotating-words',
  },
  {
    code: '<TextHighlightSweep text="Turn live data into narrative" theme={theme} />',
    component: TextHighlightSweepDemo,
    description: 'Sweep de destaque para frases e claims importantes.',
    kind: 'Motion',
    label: 'TextHighlightSweep',
    tags: ['Text', 'Highlight', 'Sweep'],
    value: 'text-highlight-sweep',
  },
  {
    code: '<CursorPath path={path} theme={theme} />\n<MouseClick left={820} top={210} theme={theme} />',
    component: CursorPathDemo,
    description: 'Cursor animado por path com clique sincronizado.',
    kind: 'Motion',
    label: 'CursorPath + MouseClick',
    tags: ['Cursor', 'Click', 'Product Tour'],
    value: 'cursor-path-click',
  },
  {
    code: '<ZoomToRegion region={{ x: 640, y: 250 }} scale={1.18}>...</ZoomToRegion>',
    component: ZoomToRegionDemo,
    description: 'Zoom suave para uma região específica da interface.',
    kind: 'Motion',
    label: 'ZoomToRegion',
    tags: ['Zoom', 'Product Tour', 'Focus'],
    value: 'zoom-to-region',
  },
  {
    code: '<CalloutConnector start={...} end={...} label="Anomaly found" theme={theme} />',
    component: CalloutConnectorDemo,
    description: 'Linha animada com label para destacar pontos da UI.',
    kind: 'Motion',
    label: 'CalloutConnector',
    tags: ['Callout', 'Connector', 'Tour'],
    value: 'callout-connector',
  },
  {
    code: '<AnimatedBarGroup values={[42, 68, 55, 92]} theme={theme} />',
    component: AnimatedBarGroupDemo,
    description: 'Grupo de barras animadas para gráficos simples.',
    kind: 'Motion',
    label: 'AnimatedBarGroup',
    tags: ['Chart', 'Bars', 'Data'],
    value: 'animated-bar-group',
  },
  {
    code: '<ProgressBar progress={0.84} label="Data connected" theme={theme} />',
    component: ProgressBarDemo,
    description: 'Barra de progresso animada para status e execução.',
    kind: 'Motion',
    label: 'ProgressBar',
    tags: ['Progress', 'Status', 'Workflow'],
    value: 'progress-bar',
  },
  {
    code: '<CardStack>{cards}</CardStack>',
    component: CardStackDemo,
    description: 'Stack de cards entrando em camadas.',
    kind: 'Motion',
    label: 'CardStack',
    tags: ['Cards', 'Stack', 'Gallery'],
    value: 'card-stack',
  },
  {
    code: '<MarqueeRow>{screens}</MarqueeRow>',
    component: MarqueeRowDemo,
    description: 'Fileira horizontal contínua para screenshots e logos.',
    kind: 'Motion',
    label: 'MarqueeRow',
    tags: ['Marquee', 'Loop', 'Gallery'],
    value: 'marquee-row',
  },
  {
    code: '<CharacterReveal text="Launch faster" theme={theme} />',
    component: CharacterRevealDemo,
    description: 'Revela caracteres individualmente para títulos curtos.',
    kind: 'Motion',
    label: 'CharacterReveal',
    tags: ['Text', 'Characters', 'Reveal'],
    value: 'character-reveal',
  },
  {
    code: '<TextScramble text="BOARD REPORT READY" theme={theme} />',
    component: TextScrambleDemo,
    description: 'Scramble de texto que resolve no conteúdo final.',
    kind: 'Motion',
    label: 'TextScramble',
    tags: ['Text', 'Scramble', 'Premium'],
    value: 'text-scramble',
  },
  {
    code: '<GradientTextSweep text="Automate the work..." theme={theme} />',
    component: GradientTextSweepDemo,
    description: 'Sweep de gradiente passando pelo texto.',
    kind: 'Motion',
    label: 'GradientTextSweep',
    tags: ['Text', 'Gradient', 'Sweep'],
    value: 'gradient-text-sweep',
  },
  {
    code: '<UnderlineDraw text="Reduce manual close work" theme={theme} />',
    component: UnderlineDrawDemo,
    description: 'Underline animado para destacar claims.',
    kind: 'Motion',
    label: 'UnderlineDraw',
    tags: ['Text', 'Underline', 'Claim'],
    value: 'underline-draw',
  },
  {
    code: '<FocusRect left={520} top={180} width={320} height={120} theme={theme} />',
    component: FocusRectDemo,
    description: 'Retângulo de foco para product tours.',
    kind: 'Motion',
    label: 'FocusRect + ClickRipple',
    tags: ['Tour', 'Focus', 'Click'],
    value: 'focus-rect',
  },
  {
    code: '<TooltipCallout label="AI found a variance" theme={theme} />',
    component: TooltipCalloutDemo,
    description: 'Tooltip animado com seta para explicar uma área.',
    kind: 'Motion',
    label: 'TooltipCallout',
    tags: ['Tooltip', 'Callout', 'Tour'],
    value: 'tooltip-callout',
  },
  {
    code: '<StepIndicator activeIndex={1} steps={steps} theme={theme} />',
    component: StepIndicatorDemo,
    description: 'Indicador de etapas com lista de tarefas concluindo.',
    kind: 'Motion',
    label: 'StepIndicator + Tasks',
    tags: ['Steps', 'Tasks', 'Workflow'],
    value: 'step-indicator',
  },
  {
    code: '<CheckmarkDraw theme={theme} />\n<StatusBadgeCycle statuses={statuses} theme={theme} />',
    component: StatusWorkflowDemo,
    description: 'Status e sucesso animados para workflows.',
    kind: 'Motion',
    label: 'Status Workflow',
    tags: ['Status', 'Success', 'Workflow'],
    value: 'status-workflow',
  },
  {
    code: '<AnimatedLineChart values={values} theme={theme} />',
    component: AnimatedLineChartDemo,
    description: 'Linha de gráfico desenhada por SVG.',
    kind: 'Motion',
    label: 'AnimatedLineChart',
    tags: ['Chart', 'Line', 'Data'],
    value: 'animated-line-chart',
  },
  {
    code: '<SparklineMotion values={values} theme={theme} />\n<GaugeMotion progress={0.84} theme={theme} />',
    component: SparkGaugeDemo,
    description: 'Sparkline, gauge e delta badge animados.',
    kind: 'Motion',
    label: 'Sparkline + Gauge',
    tags: ['Sparkline', 'Gauge', 'Delta'],
    value: 'sparkline-gauge',
  },
  {
    code: '<DataRowSweep rows={rows} theme={theme} />',
    component: DataRowSweepDemo,
    description: 'Linhas de tabela acendendo em sequência.',
    kind: 'Motion',
    label: 'DataRowSweep',
    tags: ['Table', 'Rows', 'Sweep'],
    value: 'data-row-sweep',
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
    code: '<SaaSCarouselGalleryAnimation />',
    component: SaaSCarouselGalleryAnimation,
    description: 'Carousel com foco central e profundidade.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Carousel Gallery',
    tags: ['Gallery', 'Hero', 'Product'],
    value: 'gallery-carousel',
    width: 1080,
  },
  {
    code: '<SaaSArtifactPipelineGalleryAnimation />',
    component: SaaSArtifactPipelineGalleryAnimation,
    description: 'Galeria vertical de artefatos, base usada antes por relatórios, slides e contratos.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Artifact Pipeline',
    tags: ['Artifacts', 'Pipeline', 'Vertical'],
    value: 'gallery-artifact-pipeline',
    width: 1080,
  },
  {
    code: '<SaaSArtifactReconciliationMatchGalleryAnimation />',
    component: SaaSArtifactReconciliationMatchGalleryAnimation,
    description: 'Galeria de conciliação com pares banco/ERP e linha de match.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Artifact Reconciliation Match',
    tags: ['Artifacts', 'Reconciliation', 'Match'],
    value: 'gallery-artifact-reconciliation-match',
    width: 1080,
  },
  {
    code: '<SaaSArtifactDashboardMosaicGalleryAnimation />',
    component: SaaSArtifactDashboardMosaicGalleryAnimation,
    description: 'Mosaico de dashboards com tela principal e painéis laterais.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Artifact Dashboard Mosaic',
    tags: ['Artifacts', 'Dashboards', 'Mosaic'],
    value: 'gallery-artifact-dashboard-mosaic',
    width: 1080,
  },
  {
    code: '<SaaSArtifactPageStackGalleryAnimation />',
    component: SaaSArtifactPageStackGalleryAnimation,
    description: 'Stack de páginas para relatórios, documentos e anexos.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Artifact Page Stack',
    tags: ['Artifacts', 'Reports', 'Pages'],
    value: 'gallery-artifact-page-stack',
    width: 1080,
  },
  {
    code: '<SaaSArtifactDeckCarouselGalleryAnimation />',
    component: SaaSArtifactDeckCarouselGalleryAnimation,
    description: 'Deck carousel para slides e apresentações executivas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Artifact Deck Carousel',
    tags: ['Artifacts', 'Slides', 'Deck'],
    value: 'gallery-artifact-deck-carousel',
    width: 1080,
  },
  {
    code: '<SaaSArtifactRiskBoardGalleryAnimation />',
    component: SaaSArtifactRiskBoardGalleryAnimation,
    description: 'Board de risco para contratos, renovações e alertas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Artifact Risk Board',
    tags: ['Artifacts', 'Contracts', 'Risk'],
    value: 'gallery-artifact-risk-board',
    width: 1080,
  },
  {
    code: '<SaaSArtifactLedgerFlowGalleryAnimation />',
    component: SaaSArtifactLedgerFlowGalleryAnimation,
    description: 'Fluxo de etapas para lançamentos, aprovações e envio ao ERP.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Artifact Ledger Flow',
    tags: ['Artifacts', 'Ledger', 'Workflow'],
    value: 'gallery-artifact-ledger-flow',
    width: 1080,
  },
  {
    code: '<SaaSBentoGalleryAnimation />',
    component: SaaSBentoGalleryAnimation,
    description: 'Bento grid com cards entrando em sequência.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Bento Gallery',
    tags: ['Gallery', 'Grid', 'SaaS'],
    value: 'gallery-bento',
    width: 1080,
  },
  {
    code: '<SaaSWallGalleryAnimation />',
    component: SaaSWallGalleryAnimation,
    description: 'Wall de screenshots em movimento contínuo.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Wall Gallery',
    tags: ['Gallery', 'Wall', 'Hero'],
    value: 'gallery-wall',
    width: 1080,
  },
  {
    code: '<SaaSStackGalleryAnimation />',
    component: SaaSStackGalleryAnimation,
    description: 'Cards empilhados trocando em camadas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Stack Gallery',
    tags: ['Gallery', 'Stack', 'Cards'],
    value: 'gallery-stack',
    width: 1080,
  },
  {
    code: '<SaaSMarqueeGalleryAnimation />',
    component: SaaSMarqueeGalleryAnimation,
    description: 'Fileiras horizontais infinitas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Marquee Gallery',
    tags: ['Gallery', 'Marquee', 'Loop'],
    value: 'gallery-marquee',
    width: 1080,
  },
  {
    code: '<SaaSSpotlightGalleryAnimation />',
    component: SaaSSpotlightGalleryAnimation,
    description: 'Tela principal em destaque com callouts.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Spotlight Gallery',
    tags: ['Gallery', 'Zoom', 'Callouts'],
    value: 'gallery-spotlight',
    width: 1080,
  },
  {
    code: '<SaaSBeforeAfterAnimation />',
    component: SaaSBeforeAfterAnimation,
    description: 'Comparação antes/depois com slider animado.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Before After',
    tags: ['SaaS', 'Compare', 'Impact'],
    value: 'gallery-before-after',
    width: 1080,
  },
  {
    code: '<SaaSTimelineAnimation />',
    component: SaaSTimelineAnimation,
    description: 'Timeline de processo, do dado bruto ao board pack.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Timeline',
    tags: ['Process', 'Workflow', 'SaaS'],
    value: 'gallery-timeline',
    width: 1080,
  },
  {
    code: '<SaaSOrbitAnimation />',
    component: SaaSOrbitAnimation,
    description: 'Telas orbitando um hub central.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Orbit',
    tags: ['Hub', 'Motion', 'SaaS'],
    value: 'gallery-orbit',
    width: 1080,
  },
  {
    code: '<SaaSCommandCenterAnimation />',
    component: SaaSCommandCenterAnimation,
    description: 'Command center executivo agregando múltiplas telas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Command Center',
    tags: ['Dashboard', 'Executive', 'SaaS'],
    value: 'gallery-command-center',
    width: 1080,
  },
  {
    code: '<SaaSDocumentFanGalleryAnimation />',
    component: SaaSDocumentFanGalleryAnimation,
    description: 'Documentos e telas abrindo em leque.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Document Fan',
    tags: ['Gallery', 'Documents', 'Fan'],
    value: 'gallery-document-fan',
    width: 1080,
  },
  {
    code: '<SaaSDeviceGalleryAnimation />',
    component: SaaSDeviceGalleryAnimation,
    description: 'Desktop, tablet e mobile em camadas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Device Gallery',
    tags: ['Gallery', 'Devices', 'Responsive'],
    value: 'gallery-device',
    width: 1080,
  },
  {
    code: '<SaaSGridZoomGalleryAnimation />',
    component: SaaSGridZoomGalleryAnimation,
    description: 'Grade de screenshots com foco rotativo.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Grid Zoom',
    tags: ['Gallery', 'Grid', 'Zoom'],
    value: 'gallery-grid-zoom',
    width: 1080,
  },
  {
    code: '<SaaSSwipeCardsGalleryAnimation />',
    component: SaaSSwipeCardsGalleryAnimation,
    description: 'Cards em gesto visual de stories.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Swipe Cards',
    tags: ['Gallery', 'Cards', 'Swipe'],
    value: 'gallery-swipe-cards',
    width: 1080,
  },
  {
    code: '<SaaSCoverflowGalleryAnimation />',
    component: SaaSCoverflowGalleryAnimation,
    description: 'Coverflow em perspectiva para telas de produto.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Coverflow',
    tags: ['Gallery', '3D', 'Product'],
    value: 'gallery-coverflow',
    width: 1080,
  },
  {
    code: '<SaaSRoom3DGalleryAnimation />',
    component: SaaSRoom3DGalleryAnimation,
    description: 'Telas posicionadas como uma sala 3D.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: '3D Room',
    tags: ['Gallery', '3D', 'Room'],
    value: 'gallery-room-3d',
    width: 1080,
  },
  {
    code: '<SaaSMagnifierGalleryAnimation />',
    component: SaaSMagnifierGalleryAnimation,
    description: 'Lupa percorrendo uma grade de telas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Magnifier',
    tags: ['Gallery', 'Zoom', 'Detail'],
    value: 'gallery-magnifier',
    width: 1080,
  },
  {
    code: '<SaaSAccordionGalleryAnimation />',
    component: SaaSAccordionGalleryAnimation,
    description: 'Cards expandindo e recolhendo verticalmente.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Accordion',
    tags: ['Gallery', 'Cards', 'Accordion'],
    value: 'gallery-accordion',
    width: 1080,
  },
  {
    code: '<SaaSStoryboardGalleryAnimation />',
    component: SaaSStoryboardGalleryAnimation,
    description: 'Frames em sequência como storyboard.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Storyboard',
    tags: ['Gallery', 'Storyboard', 'Frames'],
    value: 'gallery-storyboard',
    width: 1080,
  },
  {
    code: '<SaaSLogoCloudAnimation />',
    component: SaaSLogoCloudAnimation,
    description: 'Cloud de logos para integrações e social proof.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Logo Cloud Animation',
    tags: ['Logos', 'Integrations', 'Proof'],
    value: 'gallery-logo-cloud-animation',
    width: 1080,
  },
  {
    code: '<SaaSMetricCounterAnimation />',
    component: SaaSMetricCounterAnimation,
    description: 'Números grandes crescendo com cards de impacto.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Metric Counter',
    tags: ['Metrics', 'Impact', 'SaaS'],
    value: 'gallery-metric-counter',
    width: 1080,
  },
  {
    code: '<SaaSKanbanFlowAnimation />',
    component: SaaSKanbanFlowAnimation,
    description: 'Cards atravessando colunas de processo.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Kanban Flow',
    tags: ['Kanban', 'Workflow', 'Process'],
    value: 'gallery-kanban-flow',
    width: 1080,
  },
  {
    code: '<SaaSNetworkMapAnimation />',
    component: SaaSNetworkMapAnimation,
    description: 'Mapa de nós conectados para dados e entidades.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Network Map',
    tags: ['Network', 'Data', 'Integrations'],
    value: 'gallery-network-map',
    width: 1080,
  },
  {
    code: '<SaaSProductTourAnimation />',
    component: SaaSProductTourAnimation,
    description: 'Tour de produto com hotspots sobre uma interface.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Product Tour Animation',
    tags: ['Tour', 'Hotspots', 'Product'],
    value: 'gallery-product-tour-animation',
    width: 1080,
  },
  {
    code: '<ExpenseClassificationAnimation />',
    component: ExpenseClassificationAnimation,
    description: 'Esteira vertical de documentos financeiros classificados por IA.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Classificação',
    tags: ['Finance', 'AI', 'Pipeline'],
    value: 'animation-classification',
    width: 1080,
  },
  {
    code: '<BankReconciliationAnimation />',
    component: BankReconciliationAnimation,
    description: 'Pareamento entre banco e ERP em fluxo vertical.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Conciliação',
    tags: ['Bank', 'ERP', 'Finance'],
    value: 'animation-reconciliation',
    width: 1080,
  },
  {
    code: '<DashboardsAnimation />',
    component: DashboardsAnimation,
    description: 'Dashboards financeiros renderizados em sequência.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Dashboards',
    tags: ['BI', 'Finance', 'Reports'],
    value: 'animation-dashboards',
    width: 1080,
  },
  {
    code: '<ManagementReportAnimation />',
    component: ManagementReportAnimation,
    description: 'Relatório gerencial em páginas executivas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Relatório',
    tags: ['Word', 'Finance', 'Executive'],
    value: 'animation-report',
    width: 1080,
  },
  {
    code: '<ClosingSlidesAnimation />',
    component: ClosingSlidesAnimation,
    description: 'Deck executivo de fechamento mensal em esteira.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Slides',
    tags: ['PPT', 'Close', 'Board'],
    value: 'animation-slides',
    width: 1080,
  },
  {
    code: '<ContractManagementAnimation />',
    component: ContractManagementAnimation,
    description: 'Contratos monitorados por risco, vencimento e reajuste.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Contratos',
    tags: ['Legal', 'Risk', 'Finance'],
    value: 'animation-contracts',
    width: 1080,
  },
  {
    code: '<AccountingEntryAnimation />',
    component: AccountingEntryAnimation,
    description: 'Lançamento contábil preparado, validado e enviado ao ERP.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Lançamento',
    tags: ['ERP', 'Accounting', 'Workflow'],
    value: 'animation-entry',
    width: 1080,
  },
  {
    code: '<IntegrationFlowAnimation />',
    component: IntegrationFlowAnimation,
    description: 'Integrações conectando apps a um hub central.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Integração',
    tags: ['SaaS', 'Integration', 'Hub'],
    value: 'animation-integration',
    width: 1080,
  },
  {
    code: '<AIAgentStepsAnimation />',
    component: AIAgentStepsAnimation,
    description: 'Agente de IA executando etapas, logs e saída operacional.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'AI Agent',
    tags: ['Agent', 'AI', 'Steps'],
    value: 'animation-ai-agent',
    width: 1080,
  },
  {
    code: '<TableDrilldownAnimation />',
    component: TableDrilldownAnimation,
    description: 'Tabela analítica com linha ativa e painel de detalhe.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Table Drilldown',
    tags: ['Table', 'Data', 'Drilldown'],
    value: 'animation-table-drilldown',
    width: 1080,
  },
  {
    code: '<CompareScenariosAnimation />',
    component: CompareScenariosAnimation,
    description: 'Comparação de cenários financeiros lado a lado.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Compare Scenarios',
    tags: ['Scenarios', 'Finance', 'Compare'],
    value: 'animation-compare-scenarios',
    width: 1080,
  },
  {
    code: '<ForecastAnimation />',
    component: ForecastAnimation,
    description: 'Forecast financeiro com histórico, projeção e confiança.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Forecast',
    tags: ['Forecast', 'Finance', 'Chart'],
    value: 'animation-forecast',
    width: 1080,
  },
  {
    code: '<NewsAnimation />',
    component: NewsAnimation,
    description: 'Notícia editorial animada com headline e cards de apoio.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Notícia',
    tags: ['Editorial', 'Social', 'News'],
    value: 'animation-news',
    width: 1080,
  },
  {
    code: '<TweetAnimation />',
    component: TweetAnimation,
    description: 'Tweet animado com mídia e métricas de engajamento.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Tweet',
    tags: ['Social', 'Post', 'Metrics'],
    value: 'animation-tweet',
    width: 1080,
  },
  {
    code: '<ChatGptWebAnimation />',
    component: ChatGptWebAnimation,
    description: 'Janela web do ChatGPT com sidebar, conversa e card analítico.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'ChatGPT Web',
    tags: ['Web', 'Chat', 'Assistant'],
    value: 'animation-chatgpt-web',
    width: 1080,
  },
  {
    code: '<ClaudeWebAnimation />',
    component: ClaudeWebAnimation,
    description: 'Janela web do Claude com conversa e composer desktop.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Claude Web',
    tags: ['Web', 'Chat', 'Assistant'],
    value: 'animation-claude-web',
    width: 1080,
  },
  {
    code: '<EmailAnimation />',
    component: EmailAnimation,
    description: 'Email sendo redigido com resumo e plano de ação.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Email',
    tags: ['Email', 'AI Compose', 'Workflow'],
    value: 'animation-email',
    width: 1080,
  },
  {
    code: '<InboxAnimation />',
    component: InboxAnimation,
    description: 'Inbox financeiro com triagem, prioridade e resumo por IA.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Inbox',
    tags: ['Inbox', 'Triage', 'Workflow'],
    value: 'animation-inbox',
    width: 1080,
  },
  {
    code: '<NotificationCenterAnimation />',
    component: NotificationCenterAnimation,
    description: 'Central de notificações com severidade e ações rápidas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Notification Center',
    tags: ['Alerts', 'Operations', 'Workflow'],
    value: 'animation-notification-center',
    width: 1080,
  },
  {
    code: '<DataPipelineAnimation />',
    component: DataPipelineAnimation,
    description: 'Pipeline de dados fluindo por etapas técnicas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Data Pipeline',
    tags: ['Data', 'Pipeline', 'ETL'],
    value: 'animation-data-pipeline',
    width: 1080,
  },
  {
    code: '<ReportExportAnimation />',
    component: ReportExportAnimation,
    description: 'Exportação de relatório para PDF, PPT e XLS.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Report Export',
    tags: ['Export', 'Reports', 'Office'],
    value: 'animation-report-export',
    width: 1080,
  },
  {
    code: '<ApprovalFlowAnimation />',
    component: ApprovalFlowAnimation,
    description: 'Fluxo de aprovação com validações e envio ao ERP.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Approval Flow',
    tags: ['Approval', 'ERP', 'Workflow'],
    value: 'animation-approval-flow',
    width: 1080,
  },
  {
    code: '<FileUploadProcessingAnimation />',
    component: FileUploadProcessingAnimation,
    description: 'Arquivos entrando, passando por OCR e classificação.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'File Upload',
    tags: ['Upload', 'OCR', 'Workflow'],
    value: 'animation-file-upload',
    width: 1080,
  },
  {
    code: '<MobileAppDemoAnimation />',
    component: MobileAppDemoAnimation,
    description: 'Mock mobile financeiro com cards, alertas e navegação.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Mobile App',
    tags: ['Mobile', 'App', 'Finance'],
    value: 'animation-mobile-app',
    width: 1080,
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

const kinds: Array<'Todos' | CatalogKind> = ['Todos', 'Componentes', 'Mockups', 'Motion', 'Marketing', 'Galerias', 'Animações', 'Templates']

function Thumbnail({ item }: { item: CatalogItem }) {
  const color = item.kind === 'Motion' ? '#245BDB' : item.kind === 'Marketing' ? '#C28F2C' : item.kind === 'Galerias' ? '#7C3AED' : item.kind === 'Animações' ? '#0EA5E9' : item.kind === 'Templates' ? '#9333EA' : item.kind === 'Mockups' ? '#22A06B' : '#101828'
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
