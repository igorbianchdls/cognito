'use client'

import { Player } from '@remotion/player'
import { interpolate, useCurrentFrame } from 'remotion'
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
  SaaSFilmstripGalleryAnimation,
  FileUploadProcessingAnimation,
  ForecastAnimation,
  SaaSFolderTabsGalleryAnimation,
  InboxAnimation,
  SaaSInfiniteCanvasGalleryAnimation,
  IntegrationFlowAnimation,
  IntegrationBridgeAnimation,
  IntegrationHubDockAnimation,
  IntegrationHubMeshAnimation,
  IntegrationHubRingsAnimation,
  IntegrationSyncStackAnimation,
  IntegrationTimelineAnimation,
  SaaSLightboxGalleryAnimation,
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
  SaaSArtifactReconciliationLedgerSweepGalleryAnimation,
  SaaSArtifactPipelineGalleryAnimation,
  SaaSArtifactReconciliationMatrixGalleryAnimation,
  SaaSArtifactReconciliationMatchGalleryAnimation,
  SaaSArtifactReconciliationSplitGalleryAnimation,
  SaaSArtifactRiskBoardGalleryAnimation,
  SaaSBeforeAfterAnimation,
  SaaSBentoGalleryAnimation,
  SaaSCarouselGalleryAnimation,
  SaaSClassifiedBucketsGalleryAnimation,
  SaaSClassifiedDistributionGalleryAnimation,
  SaaSClassifiedFanGalleryAnimation,
  SaaSClassifiedRadarGalleryAnimation,
  SaaSCommandCenterAnimation,
  SaaSCoverflowGalleryAnimation,
  SaaSDeviceGalleryAnimation,
  SaaSDocumentFanGalleryAnimation,
  SaaSGridZoomGalleryAnimation,
  SaaSKanbanFlowAnimation,
  SaaSLogoCloudAnimation,
  SaaSMagnifierGalleryAnimation,
  SaaSMarqueeGalleryAnimation,
  SaaSMasonryGalleryAnimation,
  SaaSMetricCounterAnimation,
  SaaSMosaicGalleryAnimation,
  SaaSNetworkMapAnimation,
  SaaSOrbitAnimation,
  SaaSPageFlipGalleryAnimation,
  SaaSPageTransitionGalleryAnimation,
  SaaSProductTourAnimation,
  SaaSRoom3DGalleryAnimation,
  SaaSSpotlightGalleryAnimation,
  SaaSStackGalleryAnimation,
  SaaSStackedPagesGalleryAnimation,
  SaaSStoryboardGalleryAnimation,
  SaaSSwipeCardsGalleryAnimation,
  SaaSTimelineGalleryAnimation,
  SaaSTimelineAnimation,
  SaaSWallGalleryAnimation,
  TableDrilldownAnimation,
  TweetAnimation,
} from '@/assets/remotion/compositions/McpOperationsDemo'
import { ChatGptMobileAnimation, ChatGptToolCallDemoAnimation } from '@/assets/remotion/compositions/ChatGptMobileMarketing'
import { ChatGptOperationalFlowsVideo } from '@/assets/remotion/compositions/ChatGptOperationalFlowsVideo'
import { ChatGptTaskLauncherAnimation } from '@/assets/remotion/compositions/ChatGptTaskLauncherAnimation'
import { ClaudeMobileAnimation } from '@/assets/remotion/compositions/ClaudeMobileMarketing'
import { ClaudeOperationalFlowsVideo } from '@/assets/remotion/compositions/ClaudeOperationalFlowsVideo'
import {
  ExpenseClassificationFoldersAction,
  ExpenseClassificationMatchingAction,
  ExpenseClassificationTableAction,
} from '@/assets/remotion/compositions/ExpenseClassificationActions'
import { TaskLauncherAnimation } from '@/assets/remotion/compositions/TaskLauncherAnimation'
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
  FloatingScreenshot,
  FocusRect,
  GaugeMotion,
  getSaaSIntroDurationInFrames,
  GradientTextSweep,
  HotspotPulse,
  InboxTriageMock,
  IntegrationHubMock,
  InstagramPostMock,
  IPhoneMockupFrame,
  KanbanMock,
  ledgerAIIntroConfig,
  LoadingToSuccess,
  LogoCloud,
  MarqueeRow,
  MetricCard,
  MouseClick,
  NumberTicker,
  PromptInputHeroMock,
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
  TextScramble,
  TextHighlightSweep,
  TooltipCallout,
  TypingText,
  UnderlineDraw,
  WordReveal,
  ZoomToRegion,
  RotatingWords,
} from '@/assets/remotion/saas/index'

type CatalogKind = 'Componentes' | 'Mockups' | 'Motion' | 'Tipografia Animada' | 'Marketing' | 'Vídeos criados' | 'Galerias' | 'Animações' | 'Actions' | 'Logo' | 'Templates'

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
        <IPhoneMockupFrame scale={0.58} screenStyle={{ background: theme.panel }}>
          <InboxTriageMock theme={theme} />
        </IPhoneMockupFrame>
      </div>
    </DemoStage>
  )
}

function IPhoneMockupOnlyDemo() {
  const iphoneMockupWidth = 540
  const iphoneMockupHeight = 932
  const iphoneFramePadding = Math.max(10, Math.round(iphoneMockupWidth * 0.032))
  const screenWidth = iphoneMockupWidth - iphoneFramePadding * 2
  const screenHeight = iphoneMockupHeight - iphoneFramePadding * 2
  const chatGptScale = Math.min(screenWidth / 1080, screenHeight / 1920)

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
        position: 'relative',
        width: '100%',
      }}
    >
      <div style={{ background: `radial-gradient(circle at 50% 45%, ${theme.accent}28, rgba(255,255,255,0) 56%)`, inset: -120, position: 'absolute' }} />
      <div style={{ position: 'relative' }}>
        <IPhoneMockupFrame height={iphoneMockupHeight} scale={1.68} screenStyle={{ background: '#ffffff' }} width={iphoneMockupWidth}>
          <div
            style={{
              background: '#ffffff',
              height: '100%',
              overflow: 'hidden',
              position: 'relative',
              width: '100%',
            }}
          >
            <div
              style={{
                height: screenHeight,
                left: '50%',
                position: 'absolute',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: screenWidth,
              }}
            >
              <div
                style={{
                  height: 1920,
                  left: 0,
                  position: 'absolute',
                  top: 0,
                  transform: `scale(${chatGptScale})`,
                  transformOrigin: 'top left',
                  width: 1080,
                }}
              >
                <ChatGptMobileAnimation />
              </div>
            </div>
          </div>
        </IPhoneMockupFrame>
      </div>
    </div>
  )
}

function IPhoneMockupCompactDemo() {
  const iphoneMockupWidth = 430
  const iphoneMockupHeight = 932
  const iphoneFramePadding = Math.max(10, Math.round(iphoneMockupWidth * 0.032))
  const screenWidth = iphoneMockupWidth - iphoneFramePadding * 2
  const screenHeight = iphoneMockupHeight - iphoneFramePadding * 2
  const chatGptScale = screenWidth / 1080
  const chatGptHeight = 1920 * chatGptScale

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
        position: 'relative',
        width: '100%',
      }}
    >
      <div style={{ background: `radial-gradient(circle at 50% 45%, ${theme.accent}28, rgba(255,255,255,0) 56%)`, inset: -120, position: 'absolute' }} />
      <div style={{ position: 'relative' }}>
        <IPhoneMockupFrame height={iphoneMockupHeight} scale={1.68} screenStyle={{ background: '#ffffff' }} width={iphoneMockupWidth}>
          <div
            style={{
              background: '#ffffff',
              height: '100%',
              overflow: 'hidden',
              position: 'relative',
              width: '100%',
            }}
          >
            <div
              style={{
                height: chatGptHeight,
                left: '50%',
                position: 'absolute',
                top: (screenHeight - chatGptHeight) / 2,
                transform: 'translateX(-50%)',
                width: screenWidth,
              }}
            >
              <div
                style={{
                  height: 1920,
                  left: 0,
                  position: 'absolute',
                  top: 0,
                  transform: `scale(${chatGptScale})`,
                  transformOrigin: 'top left',
                  width: 1080,
                }}
              >
                <ChatGptMobileAnimation />
              </div>
            </div>
          </div>
        </IPhoneMockupFrame>
      </div>
    </div>
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

function previewProgress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function IntegrationHubDemo() {
  const frame = useCurrentFrame()
  const sceneIn = previewProgress(frame, 0, 38)
  const pulse = 1 + Math.sin(frame / 18) * 0.018

  return (
    <DemoStage compact>
      <div style={{ opacity: sceneIn, position: 'relative', transform: `translateY(${(1 - sceneIn) * 18}px) scale(${pulse})` }}>
        <IntegrationHubMock apps={logos} centerLabel="Ledger AI" theme={theme} />
        <div style={{ border: `2px dashed ${theme.accent}44`, borderRadius: 999, height: 360, left: '50%', opacity: 0.48 + Math.sin(frame / 20) * 0.16, position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 360 }} />
      </div>
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

function InstagramPostDemo() {
  return (
    <DemoStage compact>
      <InstagramPostMock theme={theme} />
    </DemoStage>
  )
}

function PromptInputHeroDemo() {
  const frame = useCurrentFrame()
  const sceneIn = previewProgress(frame, 0, 34)
  const float = Math.sin(frame / 26) * 10

  return (
    <div style={{ background: '#0f1512', color: '#ffffff', fontFamily: theme.fontFamily, height: '100%', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <div style={{ background: `radial-gradient(circle at 50% 42%, ${theme.accent}44, transparent 56%)`, inset: -180, opacity: sceneIn, position: 'absolute' }} />
      <div style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '86px 86px', inset: 0, opacity: 0.32, position: 'absolute', transform: `translateY(${frame * -0.35}px)` }} />
      <header style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', left: 58, position: 'absolute', right: 58, top: 64, zIndex: 20 }}>
        <strong style={{ color: '#ffffff', fontSize: 34, fontWeight: 900, letterSpacing: 0 }}>Cognito</strong>
        <span style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, color: '#ffffff', fontSize: 22, fontWeight: 850, padding: '12px 16px' }}>AI prompt</span>
      </header>
      <section style={{ left: 70, opacity: sceneIn, position: 'absolute', right: 70, top: 360, transform: `translateY(${(1 - sceneIn) * 34 + float}px)`, zIndex: 10 }}>
        <PromptInputHeroMock prompt="Crie um video executivo para apresentar as integrações do produto" theme={theme} />
      </section>
      <aside style={{ alignItems: 'center', bottom: 330, display: 'grid', gap: 28, position: 'absolute', right: 42, zIndex: 30 }}>
        {['+', 'AI', '^'].map((label, index) => (
          <span key={label} style={{ alignItems: 'center', background: index === 1 ? theme.accent : 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 24, fontWeight: 900, height: 68, justifyContent: 'center', width: 68 }}>{label}</span>
        ))}
      </aside>
      <footer style={{ bottom: 74, display: 'grid', gap: 14, left: 58, position: 'absolute', right: 150, zIndex: 20 }}>
        <strong style={{ color: '#ffffff', fontSize: 36, fontWeight: 900, letterSpacing: 0 }}>Prompt input para vídeos sociais</strong>
        <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 24, fontWeight: 720, lineHeight: 1.25 }}>Composer vertical no formato Reels/TikTok, com digitação animada.</span>
      </footer>
    </div>
  )
}

function WhatsAppConversationDemo() {
  const frame = useCurrentFrame()
  const sceneIn = previewProgress(frame, 0, 34)
  const messages = [
    { body: 'Bom dia. Como ficou o fechamento de maio?', from: 'user', time: '09:41' },
    { body: 'Fechamento revisado. Encontrei 3 pontos: frete, mídia paga e contratos.', from: 'assistant', time: '09:42' },
    { body: 'Me manda o resumo executivo em linguagem simples.', from: 'user', time: '09:43' },
    { body: 'Resumo: receita subiu 18%, margem estável e caixa com folga. O maior risco é o reajuste de fornecedores.', from: 'assistant', time: '09:44' },
    { body: 'Perfeito. Crie uma pauta para a reunião.', from: 'user', time: '09:45' },
    { body: 'Pauta pronta: indicadores, riscos, decisões e responsáveis. Posso transformar em slide também.', from: 'assistant', time: '09:46' },
  ]

  return (
    <div style={{ background: '#071d17', color: '#ffffff', fontFamily: theme.fontFamily, height: '100%', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 38%, rgba(37,211,102,0.26), transparent 58%)', inset: -180, opacity: sceneIn, position: 'absolute' }} />
      <div style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)', backgroundSize: '72px 72px', inset: 0, opacity: 0.36, position: 'absolute', transform: `translateY(${frame * -0.22}px)` }} />
      <section style={{ background: '#efe7dc', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 48, boxShadow: '0 46px 120px rgba(0,0,0,0.42)', display: 'grid', gridTemplateRows: '122px 1fr 108px', height: 1420, left: 74, opacity: sceneIn, overflow: 'hidden', position: 'absolute', right: 74, top: 190, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 10 }}>
        <header style={{ alignItems: 'center', background: '#075e54', color: '#ffffff', display: 'flex', gap: 18, padding: '0 30px' }}>
          <span style={{ alignItems: 'center', background: '#25d366', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 30, fontWeight: 900, height: 64, justifyContent: 'center', width: 64 }}>C</span>
          <div style={{ display: 'grid', gap: 5 }}>
            <strong style={{ color: '#ffffff', fontSize: 31, fontWeight: 900, letterSpacing: 0 }}>Cognito AI</strong>
            <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: 20, fontWeight: 720 }}>online agora</span>
          </div>
          <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.78)', fontSize: 34, fontWeight: 900 }}>...</span>
        </header>
        <main style={{ background: '#efe7dc', display: 'grid', gap: 20, overflow: 'hidden', padding: '34px 28px', position: 'relative' }}>
          <div style={{ backgroundImage: 'radial-gradient(rgba(7,94,84,0.10) 1px, transparent 1px)', backgroundSize: '24px 24px', inset: 0, opacity: 0.35, position: 'absolute' }} />
          {messages.map((message, index) => {
            const p = previewProgress(frame, 22 + index * 20, 56 + index * 20)
            const sentByUser = message.from === 'user'
            return (
              <div key={`${message.time}-${index}`} style={{ display: 'flex', justifyContent: sentByUser ? 'flex-end' : 'flex-start', opacity: p, position: 'relative', transform: `translateY(${(1 - p) * 26}px) scale(${0.96 + p * 0.04})`, zIndex: 2 }}>
                <div style={{ background: sentByUser ? '#d9fdd3' : '#ffffff', borderRadius: sentByUser ? '24px 8px 24px 24px' : '8px 24px 24px 24px', boxShadow: '0 8px 20px rgba(15,23,42,0.10)', color: '#111b21', display: 'grid', gap: 10, maxWidth: 650, padding: '20px 22px 15px' }}>
                  <span style={{ color: '#111b21', fontSize: 28, fontWeight: 560, letterSpacing: 0, lineHeight: 1.26 }}>{message.body}</span>
                  <span style={{ color: '#667781', fontSize: 17, fontWeight: 760, justifySelf: 'end' }}>{message.time} {sentByUser ? '✓✓' : ''}</span>
                </div>
              </div>
            )
          })}
        </main>
        <footer style={{ alignItems: 'center', background: '#efe7dc', display: 'flex', gap: 14, padding: '18px 24px' }}>
          <span style={{ alignItems: 'center', background: '#ffffff', borderRadius: 999, color: '#667781', display: 'flex', flex: 1, fontSize: 24, fontWeight: 720, height: 70, padding: '0 24px' }}>Digite uma mensagem</span>
          <span style={{ alignItems: 'center', background: '#00a884', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 28, fontWeight: 900, height: 70, justifyContent: 'center', width: 70 }}>›</span>
        </footer>
      </section>
      <footer style={{ bottom: 72, display: 'grid', gap: 12, left: 58, position: 'absolute', right: 58, zIndex: 20 }}>
        <strong style={{ color: '#ffffff', fontSize: 38, fontWeight: 900, letterSpacing: 0 }}>Conversa WhatsApp para marketing</strong>
        <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 24, fontWeight: 720, lineHeight: 1.25 }}>Mock vertical com mensagens animadas para demo social.</span>
      </footer>
    </div>
  )
}

function MetaAdsManagerDemo() {
  const frame = useCurrentFrame()
  const sceneIn = previewProgress(frame, 0, 34)
  const activeRow = Math.floor(frame / 34) % 10
  const cursorPulse = interpolate(Math.sin(frame / 5), [-1, 1], [0.82, 1])
  const tableShift = interpolate(frame % 120, [0, 119], [0, -14])
  const campaigns = [
    ['Jogger Before and After #1', 'Ad set on', '1.19', 'R$ 47,30', 'R$ 35,00', 'R$ 1.312,40'],
    ['Jacket Brand Identity #7', 'Ad set on', '1.27', 'R$ 52,15', 'R$ 60,00', 'R$ 1.401,00'],
    ['Sweater Before and After #3', 'Ad set on', '1.14', 'R$ 49,95', 'R$ 45,00', 'R$ 1.278,65'],
    ['Sweater Before and After #5', 'Ad set on', '1.14', 'R$ 49,95', 'R$ 45,00', 'R$ 1.276,85'],
    ['MOF Portrait KnitPolo_01', 'Ad set on', '1.33', 'R$ 58,20', 'R$ 75,00', 'R$ 1.338,18'],
    ['TOF Mirror Selfie KnitTop_07', 'Ad set on', '1.22', 'R$ 45,10', 'R$ 45,00', 'R$ 1.201,90'],
    ['BOF Catalog Retargeting', 'Ad set on', '1.08', 'R$ 39,80', 'R$ 80,00', 'R$ 1.118,34'],
    ['Launch Creative Test', 'Learning', '1.42', 'R$ 62,70', 'R$ 50,00', 'R$ 942,22'],
    ['Research Control 01', 'Ad set on', '1.17', 'R$ 43,10', 'R$ 40,00', 'R$ 884,90'],
    ['Creative Refresh 06', 'Ad set on', '1.31', 'R$ 54,60', 'R$ 55,00', 'R$ 1.022,18'],
  ]
  const sideIcons = ['●', '⌕', '◎', '▦', '□', '◇', '≋', '⚙']
  const metaFont = 'Arial, Helvetica, sans-serif'

  return (
    <div style={{ background: '#000000', color: '#1c1e21', fontFamily: metaFont, height: '100%', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <section style={{ background: '#f5f6f7', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, boxShadow: '0 28px 90px rgba(0,0,0,0.45)', height: 600, left: 18, opacity: sceneIn, overflow: 'hidden', position: 'absolute', right: 18, top: 630, transform: `translateY(${(1 - sceneIn) * 26}px)`, zIndex: 10 }}>
        <header style={{ alignItems: 'center', background: 'linear-gradient(#f7f8fa, #eceef2)', borderBottom: '1px solid #c7cbd1', display: 'grid', gridTemplateColumns: '74px 44px 1fr 88px', height: 40, padding: '0 12px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ff5f57', '#ffbd2e', '#28c840'].map((color) => <span key={color} style={{ background: color, border: '1px solid rgba(0,0,0,0.10)', borderRadius: 999, height: 10, width: 10 }} />)}
          </div>
          <span style={{ color: '#606770', fontSize: 14, fontWeight: 500, letterSpacing: 0 }}>‹ ›</span>
          <span style={{ background: '#ffffff', border: '1px solid #cdd1d6', borderRadius: 7, boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.03)', color: '#606770', fontSize: 10, fontWeight: 400, justifySelf: 'stretch', padding: '7px 12px', textAlign: 'center' }}>business.facebook.com/latest/adsmanager/manage</span>
          <div style={{ alignItems: 'center', color: '#606770', display: 'flex', fontSize: 14, fontWeight: 600, gap: 14, justifyContent: 'flex-end' }}>
            <span>↻</span>
            <span>⤴</span>
          </div>
        </header>

        <main style={{ display: 'grid', gridTemplateColumns: '44px 1fr', height: 560 }}>
          <aside style={{ alignItems: 'center', background: '#ffffff', borderRight: '1px solid #dadde1', display: 'flex', flexDirection: 'column', gap: 13, paddingTop: 14 }}>
            <span style={{ color: '#1877f2', fontSize: 18, fontWeight: 700 }}>∞</span>
            {sideIcons.map((icon, index) => (
              <span key={`${icon}-${index}`} style={{ alignItems: 'center', background: index === 3 ? '#e7f3ff' : 'transparent', borderRadius: 5, color: index === 3 ? '#1877f2' : '#65676b', display: 'flex', fontSize: 13, fontWeight: 600, height: 24, justifyContent: 'center', width: 24 }}>{icon}</span>
            ))}
          </aside>

          <section style={{ background: '#ffffff', display: 'grid', gridTemplateRows: '48px 44px 46px 1fr', overflow: 'hidden' }}>
            <div style={{ alignItems: 'center', borderBottom: '1px solid #dadde1', display: 'grid', gridTemplateColumns: '1fr 168px 170px', padding: '0 14px' }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
                <strong style={{ color: '#1c1e21', fontSize: 15, fontWeight: 600, letterSpacing: 0 }}>Ads</strong>
                <span style={{ background: '#f5f6f7', border: '1px solid #ccd0d5', borderRadius: 3, color: '#4b4f56', fontSize: 10, fontWeight: 400, padding: '5px 8px' }}>Heaven</span>
                <span style={{ background: '#f5f6f7', border: '1px solid #ccd0d5', borderRadius: 3, color: '#4b4f56', fontSize: 10, fontWeight: 500, padding: '5px 8px' }}>02 Opportunity Score</span>
              </div>
              <span style={{ color: '#65676b', fontSize: 10, fontWeight: 400, textAlign: 'right' }}>Columns: Performance</span>
              <span style={{ color: '#65676b', fontSize: 10, fontWeight: 400, textAlign: 'right' }}>Breakdown · Reports</span>
            </div>

            <div style={{ alignItems: 'center', borderBottom: '1px solid #dadde1', display: 'flex', gap: 7, padding: '0 14px' }}>
              <span style={{ background: '#00a778', borderRadius: 3, color: '#ffffff', fontSize: 10, fontWeight: 600, padding: '7px 11px' }}>+ Create</span>
              {['Duplicate', 'Edit', 'A/B test', 'Actions', 'Active ads', 'See more'].map((filter) => (
                <span key={filter} style={{ background: '#ffffff', border: '1px solid #ccd0d5', borderRadius: 3, color: '#1c1e21', fontSize: 10, fontWeight: 500, padding: '6px 8px' }}>{filter}</span>
              ))}
              <span style={{ background: '#f5f6f7', border: '1px solid #ccd0d5', borderRadius: 3, color: '#4b4f56', fontSize: 10, fontWeight: 500, marginLeft: 'auto', padding: '6px 8px' }}>Search by name, ID or metrics</span>
            </div>

            <div style={{ borderBottom: '1px solid #dadde1', display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr', padding: '8px 14px' }}>
              {['Campaigns', 'Ad sets', 'Ads'].map((tab, index) => (
                <div key={tab} style={{ alignItems: 'center', background: index === 2 ? '#e7f3ff' : '#ffffff', border: `1px solid ${index === 2 ? '#b8d9fb' : '#dadde1'}`, borderRadius: 4, display: 'flex', gap: 7, padding: '8px 10px' }}>
                  <span style={{ background: index === 2 ? '#1877f2' : '#ccd0d5', borderRadius: 2, height: 12, width: 12 }} />
                  <strong style={{ color: index === 2 ? '#1877f2' : '#4b4f56', fontSize: 10, fontWeight: 600 }}>{tab}</strong>
                </div>
              ))}
            </div>

            <div style={{ overflow: 'hidden', padding: '0 14px 14px' }}>
              <div style={{ alignItems: 'center', borderBottom: '1px solid #dadde1', color: '#4b4f56', display: 'grid', fontSize: 10, fontWeight: 600, gridTemplateColumns: '40px 2.05fr 1fr 0.8fr 1.05fr 0.75fr 1fr', height: 34 }}>
                {['Off/On', 'Ad', 'Delivery', 'Frequency', 'Cost per result', 'Budget', 'Amount spent'].map((header) => <span key={header}>{header}</span>)}
              </div>
              <div style={{ transform: `translateY(${tableShift}px)` }}>
                {campaigns.map(([name, delivery, freq, cost, budget, spent], index) => {
                  const active = index === activeRow
                  return (
                    <div key={name} style={{ alignItems: 'center', background: active ? '#fff1e6' : '#ffffff', borderBottom: '1px solid #edf0f2', color: '#1c1e21', display: 'grid', fontSize: 10, fontWeight: 400, gridTemplateColumns: '40px 2.05fr 1fr 0.8fr 1.05fr 0.75fr 1fr', minHeight: 42, outline: active ? '1px solid rgba(251,146,60,0.55)' : 'none', outlineOffset: -1 }}>
                      <span style={{ background: active ? '#fb923c' : '#ccd0d5', borderRadius: 999, height: 9, width: 9 }} />
                      <span style={{ alignItems: 'center', display: 'grid', gap: 7, gridTemplateColumns: '28px 1fr' }}>
                        <span style={{ background: `linear-gradient(135deg, ${index % 2 ? '#fdba74' : '#fecaca'}, #f8fafc)`, borderRadius: 3, height: 28, width: 28 }} />
                        <strong style={{ color: '#1c1e21', fontSize: 10, fontWeight: 500, letterSpacing: 0 }}>{name}</strong>
                      </span>
                      <span style={{ color: '#31a24c', fontWeight: 500 }}>{delivery}</span>
                      <span>{freq}</span>
                      <span style={{ background: active ? '#fec89a' : '#f5f6f7', borderRadius: 3, color: active ? '#8a3f08' : '#1c1e21', display: 'inline-flex', fontWeight: 500, justifySelf: 'start', padding: '5px 7px' }}>{cost}</span>
                      <span>{budget}</span>
                      <span>{spent}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </main>
        <span style={{ background: '#4f46e5', border: '3px solid rgba(255,255,255,0.75)', borderRadius: 999, boxShadow: '0 0 0 7px rgba(79,70,229,0.18)', height: 24, left: 486, opacity: sceneIn, position: 'absolute', top: 33, transform: `scale(${cursorPulse})`, width: 24 }} />
      </section>
    </div>
  )
}

function AdLibraryDemo() {
  const frame = useCurrentFrame()
  const sceneIn = previewProgress(frame, 0, 34)
  const activeIndex = Math.floor(frame / 30) % 10
  const gridShift = interpolate(frame % 150, [0, 149], [0, -18])
  const adLibraryFont = 'Arial, Helvetica, sans-serif'
  const ads = [
    { brand: 'Taqueria Factory', copy: 'Weekly specials and fresh tacos for pickup.', image: '#c2410c', status: 'Sponsored' },
    { brand: 'Taqueria Factory', copy: 'Our menu is packed with delicious favorites.', image: '#f97316', status: 'Sponsored' },
    { brand: 'Taqueria Jalisco Catedral', copy: 'Bar and details. Hiring now for weekend shifts.', image: '#111827', status: 'Sponsored' },
    { brand: 'Taqueria Jalisco Catedral', copy: 'Stop by for authentic Mexican food this week.', image: '#0f766e', status: 'Sponsored' },
    { brand: 'Taqueria Jalisco Midland', copy: 'We are hiring. Apply today for open positions.', image: '#16a34a', status: 'Sponsored' },
    { brand: 'Primoso Taqueria', copy: 'Good food. Good mood. Order online today.', image: '#dc2626', status: 'Sponsored' },
    { brand: 'Primoso Taqueria', copy: 'Special lunch combo available this week.', image: '#ea580c', status: 'Sponsored' },
    { brand: 'Qdoba taqueria', copy: 'Tasty weekend offer near you.', image: '#a855f7', status: 'Sponsored' },
    { brand: 'Primoso Taqueria', copy: 'Fresh tacos, nachos and cold drinks.', image: '#b45309', status: 'Sponsored' },
    { brand: 'Primoso Taqueria', copy: 'Family pack available for pickup and delivery.', image: '#15803d', status: 'Sponsored' },
  ]

  return (
    <div style={{ background: '#000000', color: '#1c1e21', fontFamily: adLibraryFont, height: '100%', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <section style={{ background: '#f0f2f5', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, boxShadow: '0 30px 96px rgba(0,0,0,0.46)', height: 640, left: 18, opacity: sceneIn, overflow: 'hidden', position: 'absolute', right: 18, top: 612, transform: `translateY(${(1 - sceneIn) * 26}px)`, zIndex: 10 }}>
        <header style={{ alignItems: 'center', background: 'linear-gradient(#f7f8fa, #eceef2)', borderBottom: '1px solid #c7cbd1', display: 'grid', gridTemplateColumns: '74px 44px 1fr 88px', height: 40, padding: '0 12px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ff5f57', '#ffbd2e', '#28c840'].map((color) => <span key={color} style={{ background: color, border: '1px solid rgba(0,0,0,0.10)', borderRadius: 999, height: 10, width: 10 }} />)}
          </div>
          <span style={{ color: '#606770', fontSize: 14, fontWeight: 500, letterSpacing: 0 }}>‹ ›</span>
          <span style={{ background: '#ffffff', border: '1px solid #cdd1d6', borderRadius: 7, boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.03)', color: '#606770', fontSize: 10, fontWeight: 400, justifySelf: 'stretch', padding: '7px 12px', textAlign: 'center' }}>facebook.com/ads/library/?active_status=all&ad_type=all&q=taqueria</span>
          <div style={{ alignItems: 'center', color: '#606770', display: 'flex', fontSize: 14, fontWeight: 600, gap: 14, justifyContent: 'flex-end' }}>
            <span>↻</span>
            <span>⤴</span>
          </div>
        </header>

        <main style={{ background: '#f0f2f5', display: 'grid', gridTemplateRows: '48px 48px 42px 1fr', height: 600 }}>
          <nav style={{ alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #dadde1', display: 'grid', gridTemplateColumns: '1fr 340px', padding: '0 14px' }}>
            <div style={{ alignItems: 'center', display: 'flex', gap: 7 }}>
              <span style={{ color: '#1877f2', fontSize: 18, fontWeight: 700 }}>∞</span>
              <strong style={{ color: '#1c1e21', fontSize: 13, fontWeight: 600 }}>Meta</strong>
            </div>
            <div style={{ alignItems: 'center', color: '#4b4f56', display: 'flex', fontSize: 10, fontWeight: 500, gap: 20, justifyContent: 'flex-end' }}>
              <span>Ad Library</span>
              <span>Ad Library Report</span>
              <span>Ad Library API</span>
              <span style={{ fontSize: 16 }}>☰</span>
            </div>
          </nav>

          <div style={{ alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #dadde1', display: 'grid', gap: 10, gridTemplateColumns: '120px 100px 1fr 100px', padding: '0 14px' }}>
            <span style={{ background: '#f5f6f7', border: '1px solid #ccd0d5', borderRadius: 4, color: '#1c1e21', fontSize: 10, fontWeight: 500, padding: '7px 8px' }}>United States</span>
            <span style={{ background: '#f5f6f7', border: '1px solid #ccd0d5', borderRadius: 4, color: '#1c1e21', fontSize: 10, fontWeight: 500, padding: '7px 8px' }}>All ads</span>
            <span style={{ background: '#f5f6f7', border: '1px solid #ccd0d5', borderRadius: 4, color: '#606770', fontSize: 10, fontWeight: 400, padding: '7px 10px' }}>⌕ "taqueria"</span>
            <span style={{ background: '#f5f6f7', border: '1px solid #ccd0d5', borderRadius: 4, color: '#1c1e21', fontSize: 10, fontWeight: 500, padding: '7px 8px', textAlign: 'center' }}>Saved</span>
          </div>

          <div style={{ alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #dadde1', display: 'grid', gridTemplateColumns: '1fr 90px 120px', padding: '0 14px' }}>
            <strong style={{ color: '#1c1e21', fontSize: 11, fontWeight: 600 }}>Launched March 2023</strong>
            <span style={{ background: '#f5f6f7', border: '1px solid #ccd0d5', borderRadius: 4, color: '#1c1e21', fontSize: 10, fontWeight: 500, padding: '6px 8px', textAlign: 'center' }}>Filters</span>
            <span style={{ background: '#f5f6f7', border: '1px solid #ccd0d5', borderRadius: 4, color: '#1c1e21', fontSize: 10, fontWeight: 500, padding: '6px 8px', textAlign: 'center' }}>Save search</span>
          </div>

          <section style={{ overflow: 'hidden', padding: '14px 14px 20px' }}>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(5, 1fr)', transform: `translateY(${gridShift}px)` }}>
              {ads.map((ad, index) => {
                const active = index === activeIndex
                return (
                  <article key={`${ad.brand}-${index}`} style={{ background: active ? '#fff7ed' : '#ffffff', border: `1px solid ${active ? '#fdba74' : '#dadde1'}`, borderRadius: 3, boxShadow: active ? '0 12px 28px rgba(194,65,12,0.18)' : '0 1px 2px rgba(0,0,0,0.05)', minHeight: 232, overflow: 'hidden', transform: active ? 'scale(1.015)' : 'scale(1)' }}>
                    <div style={{ display: 'grid', gap: 4, padding: '9px 9px 6px' }}>
                      <div style={{ alignItems: 'center', display: 'grid', gap: 6, gridTemplateColumns: '18px 1fr' }}>
                        <span style={{ background: '#e4e6eb', borderRadius: 999, height: 18, width: 18 }} />
                        <div style={{ display: 'grid', gap: 1 }}>
                          <strong style={{ color: '#1c1e21', fontSize: 9, fontWeight: 600, letterSpacing: 0 }}>{ad.brand}</strong>
                          <span style={{ color: '#65676b', fontSize: 8, fontWeight: 400 }}>{ad.status}</span>
                        </div>
                      </div>
                      <p style={{ color: '#1c1e21', fontSize: 8.5, fontWeight: 400, lineHeight: 1.25, margin: 0, minHeight: 30 }}>{ad.copy}</p>
                    </div>
                    <div style={{ background: `linear-gradient(135deg, ${ad.image}, #fff7ed)`, height: 82, margin: '0 9px 8px', overflow: 'hidden', position: 'relative' }}>
                      <span style={{ background: 'rgba(255,255,255,0.78)', borderRadius: 3, bottom: 8, color: '#1c1e21', fontSize: 8, fontWeight: 700, left: 8, padding: '4px 5px', position: 'absolute' }}>{index % 2 ? 'Apply Now' : 'Learn more'}</span>
                      <span style={{ background: 'rgba(255,255,255,0.32)', bottom: 0, left: `${(frame * 1.6 + index * 18) % 160 - 60}px`, position: 'absolute', top: 0, transform: 'skewX(-18deg)', width: 34 }} />
                    </div>
                    <div style={{ borderTop: '1px solid #e4e6eb', color: '#65676b', display: 'grid', gap: 4, fontSize: 8, fontWeight: 400, padding: '7px 9px' }}>
                      <span style={{ color: '#31a24c', fontWeight: 600 }}>● Active</span>
                      <span>Started running on Mar {20 + index}, 2023</span>
                      <span>Platforms: ◎ 〇 □</span>
                      <span style={{ background: '#f5f6f7', borderRadius: 3, color: '#1c1e21', fontWeight: 500, marginTop: 3, padding: '5px 7px', textAlign: 'center' }}>See ad details</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </main>
      </section>
    </div>
  )
}

function AIScanOverlayDemo() {
  const frame = useCurrentFrame()
  const sceneIn = previewProgress(frame, 0, 34)
  const activeScene = Math.floor(frame / 58) % 3
  const loop = frame % 136
  const scanFrames = [0, 24, 34, 58, 68, 92, 102, 126, 135]
  const scanX = interpolate(loop, scanFrames, [24, 24, 34, 34, 34, 34, 34, 34, 24])
  const scanY = interpolate(loop, scanFrames, [24, 24, 146, 146, 274, 274, 548, 548, 24])
  const scanWidth = interpolate(loop, scanFrames, [868, 868, 848, 848, 848, 848, 848, 848, 868])
  const scanHeight = interpolate(loop, scanFrames, [96, 96, 106, 106, 144, 144, 314, 314, 96])
  const sweep = (frame * 5.2) % 900
  const pulse = interpolate(Math.sin(frame / 5), [-1, 1], [0.72, 1])
  const sources = [
    {
      accent: '#ef4444',
      body: ['Sarah Whitman', 'Last Day to Register - Soccer Camp!', 'Registration closes tonight. Reply to confirm enrollment.'],
      meta: 'Email',
      title: 'Gmail inbox',
    },
    {
      accent: '#f43f5e',
      body: ['Silver Lakes U10', 'You said Carla would bring orange slices.', 'I can scan the thread and find the task owner.'],
      meta: 'Messages',
      title: 'Group chat',
    },
    {
      accent: '#dc2626',
      body: ['Dashboard review', 'Revenue gap in Paid Social', 'Unassigned follow-up detected in campaign notes.'],
      meta: 'Workspace',
      title: 'Marketing ops',
    },
  ]
  const source = sources[activeScene]
  const rows = activeScene === 1
    ? ['Carla brings orange slices', 'Pickup reminder: 8:00 PM', 'Sarah paid registration fee', 'Coach needs medical waiver']
    : activeScene === 2
      ? ['Campaign spend increased 18%', 'ROAS dropped on retargeting', 'New lead source detected', 'Follow-up assigned to sales']
      : ['Registration closes tonight', 'Reply needed from parent', 'Payment window expires at 6 PM', 'Camp roster nearly full']

  return (
    <div style={{ background: '#fff1e8', color: '#111827', fontFamily: theme.fontFamily, height: '100%', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 32%, rgba(255,255,255,0.98), rgba(255,241,232,0.20) 62%)', inset: 0, opacity: sceneIn, position: 'absolute' }} />
      <div style={{ backgroundImage: 'linear-gradient(rgba(185,28,28,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(185,28,28,0.06) 1px, transparent 1px)', backgroundSize: '72px 72px', inset: 0, opacity: 0.42, position: 'absolute', transform: `translateY(${frame * -0.16}px)` }} />

      <section style={{ left: 82, opacity: sceneIn, position: 'absolute', right: 82, top: 156, transform: `translateY(${(1 - sceneIn) * 24}px)`, zIndex: 10 }}>
        <div style={{ display: 'grid', gap: 18, marginBottom: 34 }}>
          <span style={{ color: '#b91c1c', fontSize: 24, fontWeight: 900, letterSpacing: 1.4, textTransform: 'uppercase' }}>AI Scan</span>
          <strong style={{ color: '#111827', fontSize: 58, fontWeight: 900, letterSpacing: 0, lineHeight: 0.95 }}>Scan every connected account</strong>
        </div>

        <article style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 28, boxShadow: '0 48px 110px rgba(120,53,15,0.18)', minHeight: 940, overflow: 'hidden', padding: 34, position: 'relative' }}>
          <header style={{ alignItems: 'center', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 16, paddingBottom: 22 }}>
            <span style={{ alignItems: 'center', background: `${source.accent}18`, borderRadius: 16, color: source.accent, display: 'flex', fontSize: 26, fontWeight: 950, height: 58, justifyContent: 'center', width: 58 }}>{source.meta.slice(0, 1)}</span>
            <div style={{ display: 'grid', gap: 5 }}>
              <strong style={{ color: '#0f172a', fontSize: 30, fontWeight: 900, letterSpacing: 0 }}>{source.title}</strong>
              <span style={{ color: '#64748b', fontSize: 19, fontWeight: 760 }}>{source.meta} account connected</span>
            </div>
            <span style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 999, color: '#b91c1c', fontSize: 17, fontWeight: 900, marginLeft: 'auto', padding: '10px 14px' }}>Scanning</span>
          </header>

          <main style={{ display: 'grid', gap: 20, paddingTop: 30 }}>
            {source.body.map((line, index) => (
              <div key={line} style={{ background: index === 1 ? '#fff1f2' : '#f8fafc', border: `1px solid ${index === 1 ? '#fecdd3' : '#e2e8f0'}`, borderRadius: 18, display: 'grid', gap: 10, padding: index === 1 ? '28px 26px' : '22px 24px' }}>
                <span style={{ color: index === 1 ? '#b91c1c' : '#64748b', fontSize: 17, fontWeight: 900, textTransform: 'uppercase' }}>{index === 1 ? 'Priority signal' : `Item 0${index + 1}`}</span>
                <strong style={{ color: '#0f172a', fontSize: index === 1 ? 34 : 25, fontWeight: index === 1 ? 900 : 760, letterSpacing: 0, lineHeight: 1.12 }}>{line}</strong>
              </div>
            ))}

            <div style={{ display: 'grid', gap: 14, marginTop: 8 }}>
              {rows.map((row, index) => (
                <div key={row} style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, display: 'grid', gap: 16, gridTemplateColumns: '22px 1fr 108px', padding: '18px 20px' }}>
                  <span style={{ background: index === activeScene ? '#ef4444' : '#cbd5e1', borderRadius: 999, height: 14, width: 14 }} />
                  <span style={{ color: '#334155', fontSize: 22, fontWeight: 700 }}>{row}</span>
                  <span style={{ color: index % 2 === 0 ? '#b91c1c' : '#64748b', fontSize: 18, fontWeight: 850, textAlign: 'right' }}>{index % 2 === 0 ? 'Found' : 'Queued'}</span>
                </div>
              ))}
            </div>
          </main>

          <div style={{ background: 'rgba(244,63,94,0.22)', border: '4px solid rgba(153,27,27,0.96)', borderRadius: 18, boxShadow: `0 0 ${34 + pulse * 30}px rgba(239,68,68,0.46)`, height: scanHeight, left: scanX, opacity: 0.98, overflow: 'hidden', position: 'absolute', top: scanY, width: scanWidth }}>
            <span style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.65), transparent)', height: 86, left: 0, position: 'absolute', right: 0, top: `${(sweep % 320) - 96}px` }} />
            <span style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.54), transparent)', bottom: 0, left: sweep - 220, position: 'absolute', top: 0, transform: 'skewX(-18deg)', width: 136 }} />
            {[0, 1, 2, 3].map((line) => (
              <span key={line} style={{ background: 'rgba(153,27,27,0.30)', height: 2, left: 16, opacity: line * 54 + 42 < scanHeight - 18 ? 1 : 0, position: 'absolute', right: 16, top: 42 + line * 54 }} />
            ))}
            <span style={{ background: 'rgba(153,27,27,0.98)', borderRadius: 999, color: '#ffffff', fontSize: 15, fontWeight: 950, left: 14, letterSpacing: 0.6, padding: '8px 11px', position: 'absolute', textTransform: 'uppercase', top: 14 }}>AI Scan</span>
            <span style={{ borderLeft: '4px solid #991b1b', borderTop: '4px solid #991b1b', height: 30, left: 10, position: 'absolute', top: 10, width: 30 }} />
            <span style={{ borderRight: '4px solid #991b1b', borderTop: '4px solid #991b1b', height: 30, position: 'absolute', right: 10, top: 10, width: 30 }} />
            <span style={{ borderBottom: '4px solid #991b1b', borderLeft: '4px solid #991b1b', bottom: 10, height: 30, left: 10, position: 'absolute', width: 30 }} />
            <span style={{ borderBottom: '4px solid #991b1b', borderRight: '4px solid #991b1b', bottom: 10, height: 30, position: 'absolute', right: 10, width: 30 }} />
          </div>
        </article>
      </section>

      <footer style={{ bottom: 116, left: 82, opacity: sceneIn, position: 'absolute', right: 82, zIndex: 20 }}>
        <div style={{ background: 'rgba(17,24,39,0.82)', borderRadius: 10, color: '#ffffff', display: 'inline-flex', fontSize: 32, fontWeight: 680, letterSpacing: 0, lineHeight: 1.18, padding: '14px 18px' }}>
          to scan all of the accounts you just connected.
        </div>
      </footer>
    </div>
  )
}

function AdAgentScanDemo() {
  const frame = useCurrentFrame()
  const sceneIn = previewProgress(frame, 0, 34)
  const loop = frame % 142
  const scanFrames = [0, 24, 34, 58, 68, 94, 104, 132, 141]
  const scanX = interpolate(loop, scanFrames, [28, 28, 48, 48, 48, 48, 48, 48, 28])
  const scanY = interpolate(loop, scanFrames, [126, 126, 250, 250, 378, 378, 538, 538, 126])
  const scanWidth = interpolate(loop, scanFrames, [844, 844, 806, 806, 806, 806, 806, 806, 844])
  const scanHeight = interpolate(loop, scanFrames, [86, 86, 108, 108, 118, 118, 310, 310, 86])
  const agentX = scanX + scanWidth - 256
  const agentY = scanY + Math.min(scanHeight - 42, 58)
  const sweep = (frame * 5.5) % 940
  const pulse = interpolate(Math.sin(frame / 5), [-1, 1], [0.74, 1])
  const ads = [
    ['Jogger Before and After #1', 'Ad set on', '1.19', 'R$ 47,30'],
    ['Jacket Brand Identity #7', 'Ad set on', '1.27', 'R$ 52,15'],
    ['Sweater Before and After #3', 'Ad set on', '1.14', 'R$ 49,95'],
    ['MOF Portrait KnitPolo_01', 'Ad set on', '1.33', 'R$ 58,20'],
    ['TOF Mirror Selfie KnitTop_07', 'Ad set on', '1.22', 'R$ 45,10'],
  ]

  return (
    <div style={{ background: '#edf7f4', color: '#111827', fontFamily: theme.fontFamily, height: '100%', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <div style={{ background: 'radial-gradient(circle at 52% 35%, rgba(255,255,255,0.94), rgba(237,247,244,0.20) 62%)', inset: 0, opacity: sceneIn, position: 'absolute' }} />
      <div style={{ backgroundImage: 'linear-gradient(rgba(15,118,110,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,118,110,0.07) 1px, transparent 1px)', backgroundSize: '76px 76px', inset: 0, opacity: 0.34, position: 'absolute', transform: `translateY(${frame * -0.14}px)` }} />

      <section style={{ left: 64, opacity: sceneIn, position: 'absolute', right: 64, top: 150, transform: `translateY(${(1 - sceneIn) * 28}px)`, zIndex: 10 }}>
        <div style={{ display: 'grid', gap: 12, marginBottom: 30 }}>
          <span style={{ color: '#ea580c', fontSize: 24, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase' }}>Ad Agent</span>
          <strong style={{ color: '#0f172a', fontSize: 58, fontWeight: 920, letterSpacing: 0, lineHeight: 0.96 }}>Autonomous ad review</strong>
        </div>

        <article style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 30, boxShadow: '0 48px 120px rgba(15,23,42,0.18)', minHeight: 1010, overflow: 'hidden', padding: 28, position: 'relative' }}>
          <header style={{ alignItems: 'center', borderBottom: '1px solid #e5e7eb', display: 'grid', gap: 16, gridTemplateColumns: '56px 1fr 130px', paddingBottom: 22 }}>
            <span style={{ alignItems: 'center', background: '#eff6ff', borderRadius: 16, color: '#2563eb', display: 'flex', fontSize: 24, fontWeight: 950, height: 56, justifyContent: 'center', width: 56 }}>∞</span>
            <div style={{ display: 'grid', gap: 6 }}>
              <strong style={{ color: '#0f172a', fontSize: 30, fontWeight: 900, letterSpacing: 0 }}>Ads Manager</strong>
              <span style={{ color: '#64748b', fontSize: 19, fontWeight: 760 }}>Creative scan · Opportunity score</span>
            </div>
            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, color: '#475569', fontSize: 17, fontWeight: 900, padding: '10px 13px', textAlign: 'center' }}>Updated now</span>
          </header>

          <div style={{ alignItems: 'center', borderBottom: '1px solid #edf2f7', display: 'flex', gap: 12, padding: '20px 0' }}>
            {['All ads', 'AI ads', 'Actions', 'Active ads'].map((filter, index) => (
              <span key={filter} style={{ background: index === 0 ? '#0f172a' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, color: index === 0 ? '#ffffff' : '#475569', fontSize: 17, fontWeight: 850, padding: '11px 14px' }}>{filter}</span>
            ))}
            <span style={{ background: '#2563eb', borderRadius: 999, color: '#ffffff', fontSize: 17, fontWeight: 900, marginLeft: 'auto', padding: '12px 16px' }}>Create</span>
          </div>

          <main style={{ display: 'grid', gap: 12, paddingTop: 22 }}>
            <div style={{ alignItems: 'center', color: '#64748b', display: 'grid', fontSize: 17, fontWeight: 900, gridTemplateColumns: '44px 1.8fr 1fr 1fr 1fr', padding: '0 14px 8px' }}>
              <span />
              <span>Ad</span>
              <span>Delivery</span>
              <span>Frequency</span>
              <span>Cost per result</span>
            </div>
            {ads.map(([name, status, frequency, cost], index) => (
              <div key={name} style={{ alignItems: 'center', background: index < 3 ? '#fff7ed' : '#ffffff', border: `1px solid ${index < 3 ? '#fed7aa' : '#e2e8f0'}`, borderRadius: 18, display: 'grid', gap: 14, gridTemplateColumns: '44px 1.8fr 1fr 1fr 1fr', minHeight: 82, padding: '12px 14px' }}>
                <span style={{ background: index < 3 ? '#fb923c' : '#cbd5e1', borderRadius: 999, height: 16, width: 16 }} />
                <div style={{ alignItems: 'center', display: 'grid', gap: 12, gridTemplateColumns: '54px 1fr' }}>
                  <span style={{ background: `linear-gradient(135deg, ${index % 2 ? '#fb923c' : '#fecaca'}, #f8fafc)`, borderRadius: 12, height: 54, width: 54 }} />
                  <strong style={{ color: '#0f172a', fontSize: 21, fontWeight: 840, letterSpacing: 0, lineHeight: 1.06 }}>{name}</strong>
                </div>
                <span style={{ color: '#16a34a', fontSize: 18, fontWeight: 860 }}>{status}</span>
                <span style={{ color: '#334155', fontSize: 19, fontWeight: 760 }}>{frequency}</span>
                <span style={{ background: index < 3 ? '#fed7aa' : '#f8fafc', borderRadius: 999, color: index < 3 ? '#9a3412' : '#475569', fontSize: 18, fontWeight: 900, padding: '9px 11px', textAlign: 'center' }}>{cost}</span>
              </div>
            ))}
          </main>

          <div style={{ background: 'rgba(251,113,133,0.22)', border: '4px solid rgba(190,18,60,0.94)', borderRadius: 18, boxShadow: `0 0 ${30 + pulse * 30}px rgba(244,63,94,0.42)`, height: scanHeight, left: scanX, opacity: 0.98, overflow: 'hidden', position: 'absolute', top: scanY, width: scanWidth }}>
            <span style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.62), transparent)', height: 86, left: 0, position: 'absolute', right: 0, top: `${(sweep % 340) - 100}px` }} />
            <span style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.54), transparent)', bottom: 0, left: sweep - 230, position: 'absolute', top: 0, transform: 'skewX(-18deg)', width: 138 }} />
            {[0, 1, 2, 3].map((line) => (
              <span key={line} style={{ background: 'rgba(190,18,60,0.30)', height: 2, left: 16, opacity: line * 52 + 42 < scanHeight - 18 ? 1 : 0, position: 'absolute', right: 16, top: 42 + line * 52 }} />
            ))}
          </div>

          <div style={{ alignItems: 'center', background: '#f97316', border: '2px solid #fed7aa', borderRadius: 12, boxShadow: '0 18px 42px rgba(194,65,12,0.32)', color: '#ffffff', display: 'flex', left: agentX, padding: '13px 17px', position: 'absolute', top: agentY, transform: `scale(${0.96 + pulse * 0.04})`, zIndex: 4 }}>
            <span style={{ color: '#f97316', fontSize: 34, fontWeight: 950, left: -24, lineHeight: 1, position: 'absolute', textShadow: '0 8px 18px rgba(194,65,12,0.30)', top: -16, transform: 'rotate(-24deg)' }}>➤</span>
            <strong style={{ color: '#ffffff', fontSize: 25, fontWeight: 920, letterSpacing: 0 }}>Ad Agent</strong>
          </div>
        </article>
      </section>

      <footer style={{ bottom: 116, left: 64, opacity: sceneIn, position: 'absolute', right: 64, zIndex: 20 }}>
        <div style={{ background: 'rgba(17,24,39,0.82)', borderRadius: 10, color: '#ffffff', display: 'inline-flex', fontSize: 31, fontWeight: 680, letterSpacing: 0, lineHeight: 1.18, padding: '14px 18px' }}>
          ad agents scan creative performance and launch fixes.
        </div>
      </footer>
    </div>
  )
}

function AIScanVariantDemo({ variant }: { variant: 'inbox' | 'dashboard' | 'connectors' }) {
  const frame = useCurrentFrame()
  const sceneIn = previewProgress(frame, 0, 34)
  const loop = frame % 132
  const sweep = (frame * 5.4) % 900
  const pulse = interpolate(Math.sin(frame / 5), [-1, 1], [0.74, 1])
  const config = {
    connectors: {
      accent: '#dc2626',
      eyebrow: 'AI Scan · Connectors',
      title: 'Scan connected sources',
      subtitle: 'Verificando status, latência e cobertura por canal.',
      rows: ['Shopify connected', 'Meta Ads records synced', 'ERP financial tables ready', 'Warehouse stream active'],
    },
    dashboard: {
      accent: '#b91c1c',
      eyebrow: 'AI Scan · Dashboard',
      title: 'Scan KPI anomalies',
      subtitle: 'Detectando variações em receita, margem e mídia paga.',
      rows: ['Revenue spike detected', 'Paid social ROAS dropped', 'Margin stable', 'Cash runway healthy'],
    },
    inbox: {
      accent: '#ef4444',
      eyebrow: 'AI Scan · Inbox',
      title: 'Scan messages and tasks',
      subtitle: 'Extraindo responsáveis, prazos e riscos das conversas.',
      rows: ['Reply needed today', 'Missing attachment found', 'Owner assigned to Sarah', 'Deadline moved to Friday'],
    },
  }[variant]
  const scanFrames = [0, 22, 32, 56, 66, 92, 102, 124, 131]
  const scanY = interpolate(loop, scanFrames, [34, 34, 196, 196, 352, 352, 558, 558, 34])
  const scanHeight = interpolate(loop, scanFrames, [118, 118, 124, 124, 142, 142, 300, 300, 118])

  return (
    <div style={{ background: '#fff7ed', color: '#111827', fontFamily: theme.fontFamily, height: '100%', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <div style={{ background: `radial-gradient(circle at 50% 34%, ${config.accent}24, transparent 54%)`, inset: -120, opacity: sceneIn, position: 'absolute' }} />
      <section style={{ left: 76, opacity: sceneIn, position: 'absolute', right: 76, top: 190, transform: `translateY(${(1 - sceneIn) * 28}px)`, zIndex: 10 }}>
        <div style={{ display: 'grid', gap: 14, marginBottom: 36 }}>
          <span style={{ color: config.accent, fontSize: 24, fontWeight: 950, letterSpacing: 1.2, textTransform: 'uppercase' }}>{config.eyebrow}</span>
          <strong style={{ color: '#111827', fontSize: 58, fontWeight: 920, letterSpacing: 0, lineHeight: 0.96 }}>{config.title}</strong>
        </div>
        <article style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 30, boxShadow: '0 48px 110px rgba(120,53,15,0.18)', minHeight: 1000, overflow: 'hidden', padding: 34, position: 'relative' }}>
          <header style={{ borderBottom: '1px solid #e5e7eb', display: 'grid', gap: 10, paddingBottom: 26 }}>
            <strong style={{ color: '#0f172a', fontSize: 32, fontWeight: 900, letterSpacing: 0 }}>Connected workspace</strong>
            <span style={{ color: '#64748b', fontSize: 22, fontWeight: 680, lineHeight: 1.2 }}>{config.subtitle}</span>
          </header>
          <main style={{ display: 'grid', gap: 18, paddingTop: 30 }}>
            {config.rows.map((row, index) => (
              <div key={row} style={{ alignItems: 'center', background: index === 1 ? '#fff1f2' : '#f8fafc', border: `1px solid ${index === 1 ? '#fecdd3' : '#e2e8f0'}`, borderRadius: 20, display: 'grid', gap: 18, gridTemplateColumns: '24px 1fr 104px', minHeight: index === 1 ? 132 : 104, padding: '20px 22px' }}>
                <span style={{ background: index % 2 === 0 ? config.accent : '#cbd5e1', borderRadius: 999, height: 16, width: 16 }} />
                <strong style={{ color: '#0f172a', fontSize: index === 1 ? 31 : 25, fontWeight: index === 1 ? 900 : 760, letterSpacing: 0 }}>{row}</strong>
                <span style={{ color: index % 2 === 0 ? config.accent : '#64748b', fontSize: 18, fontWeight: 900, textAlign: 'right' }}>{index % 2 === 0 ? 'Found' : 'Scan'}</span>
              </div>
            ))}
          </main>
          <div style={{ background: 'rgba(244,63,94,0.22)', border: `4px solid ${config.accent}`, borderRadius: 18, boxShadow: `0 0 ${34 + pulse * 28}px ${config.accent}66`, height: scanHeight, left: 26, opacity: 0.98, overflow: 'hidden', position: 'absolute', right: 26, top: scanY }}>
            <span style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.68), transparent)', height: 86, left: 0, position: 'absolute', right: 0, top: `${(sweep % 340) - 100}px` }} />
            <span style={{ background: 'rgba(153,27,27,0.95)', borderRadius: 999, color: '#ffffff', fontSize: 15, fontWeight: 950, left: 14, letterSpacing: 0.6, padding: '8px 11px', position: 'absolute', textTransform: 'uppercase', top: 14 }}>AI Scan</span>
          </div>
        </article>
      </section>
    </div>
  )
}

function AIScanInboxDemo() {
  return <AIScanVariantDemo variant="inbox" />
}

function AIScanDashboardDemo() {
  return <AIScanVariantDemo variant="dashboard" />
}

function AIScanConnectorsDemo() {
  return <AIScanVariantDemo variant="connectors" />
}

function AdAgentVariantDemo({ variant }: { variant: 'research' | 'creative' | 'budget' }) {
  const frame = useCurrentFrame()
  const sceneIn = previewProgress(frame, 0, 34)
  const loop = frame % 138
  const pulse = interpolate(Math.sin(frame / 5), [-1, 1], [0.76, 1])
  const sweep = (frame * 5.2) % 820
  const config = {
    budget: {
      accent: '#2563eb',
      agent: 'Budget Agent',
      eyebrow: 'Ad Agent · Budget',
      title: 'Reallocate spend by signal',
      columns: ['Campaign', 'Spend', 'CPA', 'Action'],
      rows: ['Retargeting CFOs', 'Creative Test #12', 'Board Report Launch', 'Demo Request Lookalike'],
    },
    creative: {
      accent: '#db2777',
      agent: 'Creative Agent',
      eyebrow: 'Ad Agent · Creative',
      title: 'Generate winning variants',
      columns: ['Creative', 'Hook', 'CTR', 'Action'],
      rows: ['Before/After Reel', 'Founder Story', 'Static Proof', 'Carousel Demo'],
    },
    research: {
      accent: '#f97316',
      agent: 'Research Agent',
      eyebrow: 'Ad Agent · Research',
      title: 'Research competitors and offers',
      columns: ['Advertiser', 'Offer', 'Format', 'Action'],
      rows: ['Tempo AI', 'Parenting App', 'Growth OS', 'Creative Lab'],
    },
  }[variant]
  const scanFrames = [0, 24, 34, 60, 70, 96, 106, 130, 137]
  const scanY = interpolate(loop, scanFrames, [154, 154, 278, 278, 392, 392, 522, 522, 154])
  const scanHeight = interpolate(loop, scanFrames, [88, 88, 102, 102, 102, 102, 250, 250, 88])
  const agentY = scanY + Math.min(scanHeight - 24, 60)

  return (
    <div style={{ background: '#edf7f4', color: '#111827', fontFamily: theme.fontFamily, height: '100%', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <div style={{ background: `radial-gradient(circle at 52% 35%, ${config.accent}24, rgba(237,247,244,0.16) 62%)`, inset: 0, opacity: sceneIn, position: 'absolute' }} />
      <section style={{ left: 64, opacity: sceneIn, position: 'absolute', right: 64, top: 150, transform: `translateY(${(1 - sceneIn) * 28}px)`, zIndex: 10 }}>
        <div style={{ display: 'grid', gap: 12, marginBottom: 30 }}>
          <span style={{ color: config.accent, fontSize: 24, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase' }}>{config.eyebrow}</span>
          <strong style={{ color: '#0f172a', fontSize: 58, fontWeight: 920, letterSpacing: 0, lineHeight: 0.96 }}>{config.title}</strong>
        </div>
        <article style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 30, boxShadow: '0 48px 120px rgba(15,23,42,0.18)', minHeight: 1010, overflow: 'hidden', padding: 28, position: 'relative' }}>
          <header style={{ alignItems: 'center', borderBottom: '1px solid #e5e7eb', display: 'grid', gap: 16, gridTemplateColumns: '56px 1fr 150px', paddingBottom: 22 }}>
            <span style={{ alignItems: 'center', background: `${config.accent}18`, borderRadius: 16, color: config.accent, display: 'flex', fontSize: 24, fontWeight: 950, height: 56, justifyContent: 'center', width: 56 }}>Ad</span>
            <div style={{ display: 'grid', gap: 6 }}>
              <strong style={{ color: '#0f172a', fontSize: 30, fontWeight: 900, letterSpacing: 0 }}>Marketing workspace</strong>
              <span style={{ color: '#64748b', fontSize: 19, fontWeight: 760 }}>Agent is scanning live campaign context</span>
            </div>
            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, color: '#475569', fontSize: 17, fontWeight: 900, padding: '10px 13px', textAlign: 'center' }}>Live</span>
          </header>
          <main style={{ display: 'grid', gap: 12, paddingTop: 22 }}>
            <div style={{ color: '#64748b', display: 'grid', fontSize: 17, fontWeight: 900, gridTemplateColumns: '1.2fr 1fr 0.8fr 0.9fr', padding: '0 14px 8px' }}>
              {config.columns.map((column) => <span key={column}>{column}</span>)}
            </div>
            {config.rows.map((row, index) => (
              <div key={row} style={{ alignItems: 'center', background: index < 3 ? '#fff7ed' : '#ffffff', border: `1px solid ${index < 3 ? '#fed7aa' : '#e2e8f0'}`, borderRadius: 18, display: 'grid', gap: 14, gridTemplateColumns: '1.2fr 1fr 0.8fr 0.9fr', minHeight: 88, padding: '14px 16px' }}>
                <strong style={{ color: '#0f172a', fontSize: 21, fontWeight: 840, letterSpacing: 0 }}>{row}</strong>
                <span style={{ color: '#334155', fontSize: 18, fontWeight: 760 }}>{index % 2 ? 'Active' : 'Rising'}</span>
                <span style={{ color: config.accent, fontSize: 19, fontWeight: 900 }}>{index % 2 ? '3.8x' : '42%'}</span>
                <span style={{ background: index < 3 ? '#fed7aa' : '#f8fafc', borderRadius: 999, color: index < 3 ? '#9a3412' : '#475569', fontSize: 17, fontWeight: 900, padding: '9px 11px', textAlign: 'center' }}>{index === 0 ? 'Create' : 'Queue'}</span>
              </div>
            ))}
          </main>
          <div style={{ background: 'rgba(251,113,133,0.18)', border: `4px solid ${config.accent}`, borderRadius: 18, boxShadow: `0 0 ${30 + pulse * 30}px ${config.accent}55`, height: scanHeight, left: 30, opacity: 0.98, overflow: 'hidden', position: 'absolute', right: 30, top: scanY }}>
            <span style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.54), transparent)', bottom: 0, left: sweep - 230, position: 'absolute', top: 0, transform: 'skewX(-18deg)', width: 138 }} />
          </div>
          <div style={{ alignItems: 'center', background: config.accent, border: '2px solid rgba(255,255,255,0.56)', borderRadius: 12, boxShadow: '0 18px 42px rgba(15,23,42,0.22)', color: '#ffffff', display: 'flex', padding: '13px 17px', position: 'absolute', right: 76, top: agentY, transform: `scale(${0.96 + pulse * 0.04})`, zIndex: 4 }}>
            <span style={{ color: config.accent, fontSize: 34, fontWeight: 950, left: -24, lineHeight: 1, position: 'absolute', textShadow: '0 8px 18px rgba(15,23,42,0.24)', top: -16, transform: 'rotate(-24deg)' }}>➤</span>
            <strong style={{ color: '#ffffff', fontSize: 25, fontWeight: 920, letterSpacing: 0 }}>{config.agent}</strong>
          </div>
        </article>
      </section>
    </div>
  )
}

function AdAgentResearchDemo() {
  return <AdAgentVariantDemo variant="research" />
}

function AdAgentCreativeDemo() {
  return <AdAgentVariantDemo variant="creative" />
}

function AdAgentBudgetDemo() {
  return <AdAgentVariantDemo variant="budget" />
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

function OttoLogoMark({ accent, frame, variant }: { accent: string, frame: number, variant: 'pulse' | 'orbit' | 'reveal' | 'grid' | 'spotlight' }) {
  const pulse = interpolate(Math.sin(frame / 9), [-1, 1], [0.94, 1.06])
  const rotate = variant === 'orbit' ? frame * 1.4 : variant === 'grid' ? Math.sin(frame / 18) * 4 : 0
  const scale = variant === 'pulse' ? pulse : 1

  return (
    <div style={{ alignItems: 'center', display: 'grid', height: 300, justifyItems: 'center', position: 'relative', transform: `scale(${scale}) rotate(${rotate}deg)`, width: 300 }}>
      <span style={{ background: `${accent}16`, borderRadius: 999, height: 300, position: 'absolute', width: 300 }} />
      <span style={{ border: `18px solid ${accent}`, borderRadius: 999, boxShadow: `0 26px 80px ${accent}45`, height: 190, position: 'absolute', width: 190 }} />
      <span style={{ background: accent, borderRadius: 999, height: 54, position: 'absolute', right: 62, top: 62, width: 54 }} />
      <span style={{ background: '#ffffff', borderRadius: 999, height: 72, position: 'absolute', width: 72 }} />
    </div>
  )
}

function OttoLogoReel({ variant }: { variant: 'pulse' | 'orbit' | 'reveal' | 'grid' | 'spotlight' }) {
  const frame = useCurrentFrame()
  const sceneIn = previewProgress(frame, 0, 32)
  const accents = {
    grid: '#0ea5e9',
    orbit: '#7c3aed',
    pulse: '#111827',
    reveal: '#f97316',
    spotlight: '#16a34a',
  }
  const accent = accents[variant]
  const reveal = variant === 'reveal' ? previewProgress(frame, 18, 82) : 1
  const shimmer = (frame * 3.2) % 520
  const orbit = frame * 2.6

  return (
    <div style={{ background: variant === 'pulse' ? '#f8fafc' : '#050505', color: variant === 'pulse' ? '#111827' : '#ffffff', fontFamily: theme.fontFamily, height: '100%', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <div style={{ background: `radial-gradient(circle at 50% 42%, ${accent}30, transparent 48%)`, inset: -120, opacity: sceneIn, position: 'absolute' }} />
      {variant === 'grid' ? (
        <div style={{ backgroundImage: `linear-gradient(${accent}18 1px, transparent 1px), linear-gradient(90deg, ${accent}18 1px, transparent 1px)`, backgroundSize: '92px 92px', inset: 0, opacity: 0.85, position: 'absolute', transform: `translateY(${frame * -0.22}px)` }} />
      ) : null}
      {variant === 'spotlight' ? (
        <div style={{ background: `linear-gradient(115deg, transparent, ${accent}30, transparent)`, bottom: 0, left: shimmer - 560, position: 'absolute', top: 0, transform: 'skewX(-14deg)', width: 360 }} />
      ) : null}
      {variant === 'orbit' ? [0, 1, 2, 3, 4, 5].map((dot) => {
        const angle = (orbit + dot * 60) * Math.PI / 180
        return <span key={dot} style={{ background: dot % 2 ? '#ffffff' : accent, borderRadius: 999, height: 18, left: 540 + Math.cos(angle) * 214, opacity: 0.82, position: 'absolute', top: 820 + Math.sin(angle) * 214, width: 18 }} />
      }) : null}

      <main style={{ alignItems: 'center', display: 'grid', justifyItems: 'center', left: 0, opacity: sceneIn, position: 'absolute', right: 0, top: 612, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 5 }}>
        <div style={{ clipPath: variant === 'reveal' ? `inset(0 ${100 - reveal * 100}% 0 0)` : undefined }}>
          <OttoLogoMark accent={accent} frame={frame} variant={variant} />
        </div>
        <strong style={{ color: variant === 'pulse' ? '#111827' : '#ffffff', fontSize: 76, fontWeight: 850, letterSpacing: 0, lineHeight: 1, marginTop: 46, opacity: variant === 'reveal' ? reveal : 1, transform: `translateY(${variant === 'reveal' ? (1 - reveal) * 24 : 0}px)` }}>Otto</strong>
      </main>

      {variant === 'pulse' ? (
        <div style={{ border: `2px solid ${accent}18`, borderRadius: 999, height: 520 + Math.sin(frame / 12) * 24, left: '50%', position: 'absolute', top: 496, transform: 'translateX(-50%)', width: 520 + Math.sin(frame / 12) * 24 }} />
      ) : null}
    </div>
  )
}

function OttoLogoPulseDemo() {
  return <OttoLogoReel variant="pulse" />
}

function OttoLogoOrbitDemo() {
  return <OttoLogoReel variant="orbit" />
}

function OttoLogoRevealDemo() {
  return <OttoLogoReel variant="reveal" />
}

function OttoLogoGridDemo() {
  return <OttoLogoReel variant="grid" />
}

function OttoLogoSpotlightDemo() {
  return <OttoLogoReel variant="spotlight" />
}

const catalog: CatalogItem[] = [
  {
    code: '<OttoLogoPulse />',
    component: OttoLogoPulseDemo,
    description: 'Logo Otto em formato Reels com pulso central limpo.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Logo',
    label: 'Otto Logo Pulse',
    tags: ['Logo', 'Otto', 'Reels'],
    value: 'otto-logo-pulse',
    width: 1080,
  },
  {
    code: '<OttoLogoOrbit />',
    component: OttoLogoOrbitDemo,
    description: 'Logo Otto com pontos orbitando o símbolo central.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Logo',
    label: 'Otto Logo Orbit',
    tags: ['Logo', 'Otto', 'Orbit'],
    value: 'otto-logo-orbit',
    width: 1080,
  },
  {
    code: '<OttoLogoReveal />',
    component: OttoLogoRevealDemo,
    description: 'Logo Otto com revelação horizontal do símbolo e nome.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Logo',
    label: 'Otto Logo Reveal',
    tags: ['Logo', 'Otto', 'Reveal'],
    value: 'otto-logo-reveal',
    width: 1080,
  },
  {
    code: '<OttoLogoGrid />',
    component: OttoLogoGridDemo,
    description: 'Logo Otto com grid técnico em movimento para Reels.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Logo',
    label: 'Otto Logo Grid',
    tags: ['Logo', 'Otto', 'Grid'],
    value: 'otto-logo-grid',
    width: 1080,
  },
  {
    code: '<OttoLogoSpotlight />',
    component: OttoLogoSpotlightDemo,
    description: 'Logo Otto com faixa de luz passando pelo centro.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Logo',
    label: 'Otto Logo Spotlight',
    tags: ['Logo', 'Otto', 'Spotlight'],
    value: 'otto-logo-spotlight',
    width: 1080,
  },
  {
    code: '<SaaSClassifiedDistributionGalleryAnimation />',
    component: SaaSClassifiedDistributionGalleryAnimation,
    description: 'Galeria de classificação que distribui artefatos para destinos alternados.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Classified Distribution Gallery',
    tags: ['Gallery', 'Classification', 'Distribution'],
    value: 'gallery-classified-distribution',
    width: 1080,
  },
  {
    code: '<SaaSClassifiedFanGalleryAnimation />',
    component: SaaSClassifiedFanGalleryAnimation,
    description: 'Variação em leque: artefatos são classificados e arremessados para direções diferentes.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Classified Fan Gallery',
    tags: ['Gallery', 'Classification', 'Fan'],
    value: 'gallery-classified-fan',
    width: 1080,
  },
  {
    code: '<SaaSClassifiedBucketsGalleryAnimation />',
    component: SaaSClassifiedBucketsGalleryAnimation,
    description: 'Variação em buckets: artefatos saem do classificador e caem em colunas de destino.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Classified Buckets Gallery',
    tags: ['Gallery', 'Classification', 'Buckets'],
    value: 'gallery-classified-buckets',
    width: 1080,
  },
  {
    code: '<SaaSClassifiedRadarGalleryAnimation />',
    component: SaaSClassifiedRadarGalleryAnimation,
    description: 'Variação radar: artefatos são analisados no núcleo e agrupados em clusters orbitais.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Classified Radar Gallery',
    tags: ['Gallery', 'Classification', 'Radar'],
    value: 'gallery-classified-radar',
    width: 1080,
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
    code: '<SaaSMasonryGalleryAnimation />',
    component: SaaSMasonryGalleryAnimation,
    description: 'Grid fluido com cards de alturas diferentes.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Masonry Gallery',
    tags: ['Gallery', 'Masonry', 'Grid'],
    value: 'gallery-masonry',
    width: 1080,
  },
  {
    code: '<SaaSCoverflowGalleryAnimation />',
    component: SaaSCoverflowGalleryAnimation,
    description: 'Coverflow em perspectiva para telas de produto.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Coverflow Gallery',
    tags: ['Gallery', '3D', 'Product'],
    value: 'gallery-coverflow',
    width: 1080,
  },
  {
    code: '<SaaSTimelineGalleryAnimation />',
    component: SaaSTimelineGalleryAnimation,
    description: 'Galeria sequencial organizada por tempo.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Timeline Gallery',
    tags: ['Gallery', 'Timeline', 'Sequence'],
    value: 'gallery-timeline',
    width: 1080,
  },
  {
    code: '<SaaSPageFlipGalleryAnimation />',
    component: SaaSPageFlipGalleryAnimation,
    description: 'Galeria simulando a virada de uma página em perspectiva.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Page Flip Gallery',
    tags: ['Gallery', 'Page', 'Flip'],
    value: 'gallery-page-flip',
    width: 1080,
  },
  {
    code: '<SaaSPageTransitionGalleryAnimation />',
    component: SaaSPageTransitionGalleryAnimation,
    description: 'Transição entre páginas de relatório com folha virando entre cards.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Page Transition Gallery',
    tags: ['Gallery', 'Pages', 'Transition'],
    value: 'gallery-page-transition',
    width: 1080,
  },
  {
    code: '<SaaSFilmstripGalleryAnimation />',
    component: SaaSFilmstripGalleryAnimation,
    description: 'Faixa de frames passando como rolo de filme.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Filmstrip Gallery',
    tags: ['Gallery', 'Filmstrip', 'Frames'],
    value: 'gallery-filmstrip',
    width: 1080,
  },
  {
    code: '<SaaSLightboxGalleryAnimation />',
    component: SaaSLightboxGalleryAnimation,
    description: 'Item ampliado em destaque com miniaturas abaixo.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Lightbox Gallery',
    tags: ['Gallery', 'Lightbox', 'Focus'],
    value: 'gallery-lightbox',
    width: 1080,
  },
  {
    code: '<SaaSFolderTabsGalleryAnimation />',
    component: SaaSFolderTabsGalleryAnimation,
    description: 'Abas de pasta alternando a tela ativa.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Folder Tabs Gallery',
    tags: ['Gallery', 'Tabs', 'Folder'],
    value: 'gallery-folder-tabs',
    width: 1080,
  },
  {
    code: '<SaaSStackedPagesGalleryAnimation />',
    component: SaaSStackedPagesGalleryAnimation,
    description: 'Pilha de páginas onde a primeira desliza para revelar a próxima.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Stacked Pages Gallery',
    tags: ['Gallery', 'Pages', 'Stack'],
    value: 'gallery-stacked-pages',
    width: 1080,
  },
  {
    code: '<SaaSInfiniteCanvasGalleryAnimation />',
    component: SaaSInfiniteCanvasGalleryAnimation,
    description: 'Canvas amplo com câmera navegando entre cards.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Infinite Canvas Gallery',
    tags: ['Gallery', 'Canvas', 'Pan'],
    value: 'gallery-infinite-canvas',
    width: 1080,
  },
  {
    code: '<SaaSMosaicGalleryAnimation />',
    component: SaaSMosaicGalleryAnimation,
    description: 'Mosaico editorial com uma tela dominante e previews ao redor.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Mosaic Gallery',
    tags: ['Gallery', 'Mosaic', 'Product'],
    value: 'gallery-mosaic',
    width: 1080,
  },
  {
    code: '<SaaSSwipeCardsGalleryAnimation />',
    component: SaaSSwipeCardsGalleryAnimation,
    description: 'Cards em gesto visual de stories/deck.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Swipe Gallery',
    tags: ['Gallery', 'Cards', 'Swipe'],
    value: 'gallery-swipe-cards',
    width: 1080,
  },
  {
    code: '<SaaSAccordionGalleryAnimation />',
    component: SaaSAccordionGalleryAnimation,
    description: 'Cards expandindo e recolhendo verticalmente.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Accordion Gallery',
    tags: ['Gallery', 'Cards', 'Accordion'],
    value: 'gallery-accordion',
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
    code: '<SaaSDeviceGalleryAnimation />',
    component: SaaSDeviceGalleryAnimation,
    description: 'Coleção apresentada em desktop, tablet e mobile.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Device Gallery',
    tags: ['Gallery', 'Devices', 'Responsive'],
    value: 'gallery-device',
    width: 1080,
  },
  {
    code: '<SaaSStoryboardGalleryAnimation />',
    component: SaaSStoryboardGalleryAnimation,
    description: 'Frames em sequência como narrativa visual.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Storyboard Gallery',
    tags: ['Gallery', 'Storyboard', 'Frames'],
    value: 'gallery-storyboard',
    width: 1080,
  },
  {
    code: '<SaaSArtifactPipelineGalleryAnimation />',
    component: SaaSArtifactPipelineGalleryAnimation,
    description: 'Galeria vertical de artefatos operacionais em pipeline.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Galerias',
    label: 'Artifact Pipeline',
    tags: ['Gallery', 'Vertical', 'Pipeline'],
    value: 'gallery-artifact-pipeline',
    width: 1080,
  },
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
    code: '<IPhoneMockupFrame scale={0.58}>...</IPhoneMockupFrame>\n<TabletFrame theme={theme}>...</TabletFrame>',
    component: DeviceFramesDemo,
    description: 'Frames de tablet e iPhone para demos responsivas.',
    kind: 'Componentes',
    label: 'Device Frames',
    tags: ['Device', 'iPhone', 'Responsive'],
    value: 'device-frames',
  },
  {
    code: '<IPhoneMockupFrame width={540} height={932} scale={1.68}><ChatGptMobileAnimation /></IPhoneMockupFrame>',
    component: IPhoneMockupOnlyDemo,
    description: 'Composição vertical com a animação mobile do ChatGPT em um iPhone ajustado para viewport 9:16.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Componentes',
    label: 'iPhone Mockup',
    tags: ['Device', 'iPhone', 'ChatGPT', 'Vertical'],
    value: 'iphone-mockup',
    width: 1080,
  },
  {
    code: '<IPhoneMockupFrame width={430} height={932} scale={1.68}><ChatGptMobileAnimation /></IPhoneMockupFrame>',
    component: IPhoneMockupCompactDemo,
    description: 'Composição vertical com o mockup antigo de iPhone e ChatGPT original ajustado pela largura.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Componentes',
    label: 'iPhone Mockup Compact',
    tags: ['Device', 'iPhone', 'ChatGPT', 'Compact'],
    value: 'iphone-mockup-compact',
    width: 1080,
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
    kind: 'Actions',
    label: 'IntegrationHubMock',
    tags: ['Integrations', 'Hub', 'Network'],
    value: 'integration-hub',
  },
  {
    code: '<IntegrationFlowAnimation />',
    component: IntegrationFlowAnimation,
    description: 'Variação de integration hub com mocks orbitando o centro.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Actions',
    label: 'Integration Hub Orbit',
    tags: ['SaaS', 'Integration', 'Hub', 'Orbit'],
    value: 'marketing-integration-hub-orbit',
    width: 1080,
  },
  {
    code: '<IntegrationHubRingsAnimation />',
    component: IntegrationHubRingsAnimation,
    description: 'Variação de integration hub com conectores em anéis concêntricos.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Actions',
    label: 'Integration Hub Rings',
    tags: ['Integrations', 'Hub', 'Rings'],
    value: 'marketing-integration-hub-rings',
    width: 1080,
  },
  {
    code: '<IntegrationHubMeshAnimation />',
    component: IntegrationHubMeshAnimation,
    description: 'Variação de integration hub com conectores em malha viva.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Actions',
    label: 'Integration Hub Mesh',
    tags: ['Integrations', 'Hub', 'Mesh'],
    value: 'marketing-integration-hub-mesh',
    width: 1080,
  },
  {
    code: '<IntegrationHubDockAnimation />',
    component: IntegrationHubDockAnimation,
    description: 'Variação de integration hub com docks laterais alimentando o centro.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Actions',
    label: 'Integration Hub Dock',
    tags: ['Integrations', 'Hub', 'Dock'],
    value: 'marketing-integration-hub-dock',
    width: 1080,
  },
  {
    code: '<IntegrationTimelineAnimation />',
    component: IntegrationTimelineAnimation,
    description: 'Integração em timeline, com cada conector como etapa de sincronização.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Actions',
    label: 'Integration Timeline',
    tags: ['Integrations', 'Timeline', 'Sync'],
    value: 'marketing-integration-timeline',
    width: 1080,
  },
  {
    code: '<IntegrationBridgeAnimation />',
    component: IntegrationBridgeAnimation,
    description: 'Integração em ponte, conectando fontes de um lado ao destino do outro.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Actions',
    label: 'Integration Bridge',
    tags: ['Integrations', 'Bridge', 'Data'],
    value: 'marketing-integration-bridge',
    width: 1080,
  },
  {
    code: '<IntegrationSyncStackAnimation />',
    component: IntegrationSyncStackAnimation,
    description: 'Integração em stack, consolidando conectores em uma camada única.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Actions',
    label: 'Integration Sync Stack',
    tags: ['Integrations', 'Stack', 'Sync'],
    value: 'marketing-integration-sync-stack',
    width: 1080,
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
    kind: 'Tipografia Animada',
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
    kind: 'Tipografia Animada',
    label: 'WordReveal',
    tags: ['Text', 'Headline', 'Reveal'],
    value: 'word-reveal',
  },
  {
    code: '<RotatingWords prefix="Build reports" words={words} suffix="than before" theme={theme} />',
    component: RotatingWordsDemo,
    description: 'Alterna palavras em uma frase sem remontar o layout.',
    kind: 'Tipografia Animada',
    label: 'RotatingWords',
    tags: ['Text', 'Loop', 'Headline'],
    value: 'rotating-words',
  },
  {
    code: '<TextHighlightSweep text="Turn live data into narrative" theme={theme} />',
    component: TextHighlightSweepDemo,
    description: 'Sweep de destaque para frases e claims importantes.',
    kind: 'Tipografia Animada',
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
    kind: 'Tipografia Animada',
    label: 'CharacterReveal',
    tags: ['Text', 'Characters', 'Reveal'],
    value: 'character-reveal',
  },
  {
    code: '<TextScramble text="BOARD REPORT READY" theme={theme} />',
    component: TextScrambleDemo,
    description: 'Scramble de texto que resolve no conteúdo final.',
    kind: 'Tipografia Animada',
    label: 'TextScramble',
    tags: ['Text', 'Scramble', 'Premium'],
    value: 'text-scramble',
  },
  {
    code: '<GradientTextSweep text="Automate the work..." theme={theme} />',
    component: GradientTextSweepDemo,
    description: 'Sweep de gradiente passando pelo texto.',
    kind: 'Tipografia Animada',
    label: 'GradientTextSweep',
    tags: ['Text', 'Gradient', 'Sweep'],
    value: 'gradient-text-sweep',
  },
  {
    code: '<UnderlineDraw text="Reduce manual close work" theme={theme} />',
    component: UnderlineDrawDemo,
    description: 'Underline animado para destacar claims.',
    kind: 'Tipografia Animada',
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
    code: '<InstagramPostMock handle="cognito.ops" mediaTitle="Close faster" theme={theme} />',
    component: InstagramPostDemo,
    description: 'Post de Instagram editável para lançamento, social proof e anúncios.',
    kind: 'Marketing',
    label: 'InstagramPostMock',
    tags: ['Instagram', 'Social', 'Launch'],
    value: 'instagram-post',
  },
  {
    code: '<PromptInputHeroMock prompt="Create an executive launch video..." theme={theme} />',
    component: PromptInputHeroDemo,
    description: 'Composer de prompt no estilo ChatGPT/Claude, centralizado e com texto digitando.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'PromptInputHeroMock',
    tags: ['Prompt', 'AI', 'Typing'],
    value: 'prompt-input-hero',
    width: 1080,
  },
  {
    code: '<WhatsAppConversationMock />',
    component: WhatsAppConversationDemo,
    description: 'Mock vertical de conversa no WhatsApp com mensagens animadas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'WhatsApp Conversation',
    tags: ['WhatsApp', 'Chat', 'Social'],
    value: 'whatsapp-conversation',
    width: 1080,
  },
  {
    code: '<MetaAdsManagerMock />',
    component: MetaAdsManagerDemo,
    description: 'Mock vertical de gerenciador de anúncios do Meta com campanhas e KPIs.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'Meta Ads Manager',
    tags: ['Meta Ads', 'Campaigns', 'Marketing'],
    value: 'meta-ads-manager',
    width: 1080,
  },
  {
    code: '<AdLibraryMock />',
    component: AdLibraryDemo,
    description: 'Mock vertical de biblioteca de anúncios com criativos, filtros e métricas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'Ad Library',
    tags: ['Ads', 'Creative', 'Marketing'],
    value: 'ad-library',
    width: 1080,
  },
  {
    code: '<AIScanOverlayMock />',
    component: AIScanOverlayDemo,
    description: 'Mock vertical de AI Scan com overlay vermelho translúcido sobre emails, chats e relatórios.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'AI Scan Overlay',
    tags: ['AI Scan', 'Overlay', 'Marketing'],
    value: 'ai-scan-overlay',
    width: 1080,
  },
  {
    code: '<AIScanInboxMock />',
    component: AIScanInboxDemo,
    description: 'Variação de AI Scan focada em inbox, tarefas e mensagens.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'AI Scan Inbox',
    tags: ['AI Scan', 'Inbox', 'Marketing'],
    value: 'ai-scan-inbox',
    width: 1080,
  },
  {
    code: '<AIScanDashboardMock />',
    component: AIScanDashboardDemo,
    description: 'Variação de AI Scan focada em dashboard e anomalias de KPI.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'AI Scan Dashboard',
    tags: ['AI Scan', 'Dashboard', 'Marketing'],
    value: 'ai-scan-dashboard',
    width: 1080,
  },
  {
    code: '<AIScanConnectorsMock />',
    component: AIScanConnectorsDemo,
    description: 'Variação de AI Scan focada em conectores e fontes conectadas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'AI Scan Connectors',
    tags: ['AI Scan', 'Connectors', 'Marketing'],
    value: 'ai-scan-connectors',
    width: 1080,
  },
  {
    code: '<AdAgentScanMock />',
    component: AdAgentScanDemo,
    description: 'Mock vertical de scan em Ads Manager com marcador animado de Ad Agent.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'Ad Agent Scan',
    tags: ['Ad Agent', 'AI Scan', 'Marketing'],
    value: 'ad-agent-scan',
    width: 1080,
  },
  {
    code: '<AdAgentResearchMock />',
    component: AdAgentResearchDemo,
    description: 'Variação de Ad Agent analisando concorrentes, ofertas e formatos.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'Ad Agent Research',
    tags: ['Ad Agent', 'Research', 'Marketing'],
    value: 'ad-agent-research',
    width: 1080,
  },
  {
    code: '<AdAgentCreativeMock />',
    component: AdAgentCreativeDemo,
    description: 'Variação de Ad Agent gerando e priorizando criativos vencedores.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'Ad Agent Creative',
    tags: ['Ad Agent', 'Creative', 'Marketing'],
    value: 'ad-agent-creative',
    width: 1080,
  },
  {
    code: '<AdAgentBudgetMock />',
    component: AdAgentBudgetDemo,
    description: 'Variação de Ad Agent redistribuindo verba por sinal de performance.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'Ad Agent Budget',
    tags: ['Ad Agent', 'Budget', 'Marketing'],
    value: 'ad-agent-budget',
    width: 1080,
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
    code: '<SaaSArtifactReconciliationMatchGalleryAnimation />',
    component: SaaSArtifactReconciliationMatchGalleryAnimation,
    description: 'Galeria de conciliação com pares banco/ERP e linha de match.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Artifact Reconciliation Match',
    tags: ['Artifacts', 'Reconciliation', 'Match'],
    value: 'gallery-artifact-reconciliation-match',
    width: 1080,
  },
  {
    code: '<SaaSArtifactReconciliationSplitGalleryAnimation />',
    component: SaaSArtifactReconciliationSplitGalleryAnimation,
    description: 'Variação em split screen com banco e ERP pareados por linha.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Artifact Reconciliation Split',
    tags: ['Artifacts', 'Reconciliation', 'Split'],
    value: 'gallery-artifact-reconciliation-split',
    width: 1080,
  },
  {
    code: '<SaaSArtifactReconciliationMatrixGalleryAnimation />',
    component: SaaSArtifactReconciliationMatrixGalleryAnimation,
    description: 'Variação em matriz de score para matches banco x ERP.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Artifact Reconciliation Matrix',
    tags: ['Artifacts', 'Reconciliation', 'Matrix'],
    value: 'gallery-artifact-reconciliation-matrix',
    width: 1080,
  },
  {
    code: '<SaaSArtifactReconciliationLedgerSweepGalleryAnimation />',
    component: SaaSArtifactReconciliationLedgerSweepGalleryAnimation,
    description: 'Variação com sweep passando por linhas de ledger conciliadas.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Artifact Reconciliation Ledger Sweep',
    tags: ['Artifacts', 'Reconciliation', 'Ledger'],
    value: 'gallery-artifact-reconciliation-ledger-sweep',
    width: 1080,
  },
  {
    code: '<SaaSArtifactDashboardMosaicGalleryAnimation />',
    component: SaaSArtifactDashboardMosaicGalleryAnimation,
    description: 'Mosaico de dashboards com tela principal e painéis laterais.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
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
    kind: 'Animações',
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
    kind: 'Animações',
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
    kind: 'Animações',
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
    kind: 'Animações',
    label: 'Artifact Ledger Flow',
    tags: ['Artifacts', 'Ledger', 'Workflow'],
    value: 'gallery-artifact-ledger-flow',
    width: 1080,
  },
  {
    code: '<SaaSBeforeAfterAnimation />',
    component: SaaSBeforeAfterAnimation,
    description: 'Comparação antes/depois com slider animado.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Before After',
    tags: ['SaaS', 'Compare', 'Impact'],
    value: 'gallery-before-after',
    width: 1080,
  },
  {
    code: '<SaaSOrbitAnimation />',
    component: SaaSOrbitAnimation,
    description: 'Telas orbitando um hub central.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
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
    kind: 'Animações',
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
    kind: 'Animações',
    label: 'Document Fan',
    tags: ['Gallery', 'Documents', 'Fan'],
    value: 'gallery-document-fan',
    width: 1080,
  },
  {
    code: '<SaaSGridZoomGalleryAnimation />',
    component: SaaSGridZoomGalleryAnimation,
    description: 'Grade de screenshots com foco rotativo.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
    label: 'Grid Zoom',
    tags: ['Gallery', 'Grid', 'Zoom'],
    value: 'gallery-grid-zoom',
    width: 1080,
  },
  {
    code: '<SaaSRoom3DGalleryAnimation />',
    component: SaaSRoom3DGalleryAnimation,
    description: 'Telas posicionadas como uma sala 3D.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
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
    kind: 'Animações',
    label: 'Magnifier',
    tags: ['Gallery', 'Zoom', 'Detail'],
    value: 'gallery-magnifier',
    width: 1080,
  },
  {
    code: '<SaaSLogoCloudAnimation />',
    component: SaaSLogoCloudAnimation,
    description: 'Cloud de logos para integrações e social proof.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Animações',
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
    kind: 'Animações',
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
    kind: 'Animações',
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
    kind: 'Animações',
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
    kind: 'Animações',
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
    kind: 'Marketing',
    label: 'Notícia',
    tags: ['Editorial', 'Social', 'News'],
    value: 'marketing-news',
    width: 1080,
  },
  {
    code: '<TweetAnimation />',
    component: TweetAnimation,
    description: 'Tweet animado com mídia e métricas de engajamento.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'Tweet',
    tags: ['Social', 'Post', 'Metrics'],
    value: 'marketing-tweet',
    width: 1080,
  },
  {
    code: '<ChatGptWebAnimation />',
    component: ChatGptWebAnimation,
    description: 'Janela web do ChatGPT com sidebar, conversa e card analítico.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'ChatGPT Web',
    tags: ['Web', 'Chat', 'Assistant', 'Social'],
    value: 'marketing-chatgpt-web',
    width: 1080,
  },
  {
    code: '<TaskLauncherAnimation />',
    component: TaskLauncherAnimation,
    description: 'Cards de ação que se transformam em prompt com cursor, typing e CTA.',
    duration: 220,
    height: 1920,
    kind: 'Marketing',
    label: 'Task Launcher',
    tags: ['Prompt', 'Cursor', 'SaaS', 'Marketing'],
    value: 'marketing-task-launcher',
    width: 1080,
  },
  {
    code: '<ChatGptTaskLauncherAnimation />',
    component: ChatGptTaskLauncherAnimation,
    description: 'Versao mobile do ChatGPT com sugestoes clicaveis, prompt digitado e envio final.',
    duration: 240,
    height: 1920,
    kind: 'Marketing',
    label: 'ChatGPT Task Launcher',
    tags: ['ChatGPT', 'Mobile', 'Prompt', 'Cursor'],
    value: 'marketing-chatgpt-task-launcher',
    width: 1080,
  },
  {
    code: '<ChatGptToolCallDemoAnimation />',
    component: ChatGptToolCallDemoAnimation,
    description: 'ChatGPT mobile com quatro chamadas de tool transparentes e borda sutil.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'ChatGPT Tool Call',
    tags: ['ChatGPT', 'Mobile', 'Tool', 'Assistant'],
    value: 'marketing-chatgpt-tool-call',
    width: 1080,
  },
  {
    code: '<ChatGptOperationalFlowsVideo />',
    component: ChatGptOperationalFlowsVideo,
    description: 'Video mobile do ChatGPT com fluxos operacionais de financeiro, estoque, atendimento, CRM e marketing.',
    duration: 5900,
    height: 1920,
    kind: 'Vídeos criados',
    label: 'ChatGPT Fluxos Operacionais',
    tags: ['ChatGPT', 'Mobile', 'Operacoes', 'Video'],
    value: 'video-chatgpt-operational-flows',
    width: 1080,
  },
  {
    code: '<ClaudeOperationalFlowsVideo />',
    component: ClaudeOperationalFlowsVideo,
    description: 'Video mobile do Claude com fluxos operacionais de financeiro, estoque, atendimento, CRM e marketing.',
    duration: 5900,
    height: 1920,
    kind: 'Vídeos criados',
    label: 'Claude Fluxos Operacionais',
    tags: ['Claude', 'Mobile', 'Operacoes', 'Video'],
    value: 'video-claude-operational-flows',
    width: 1080,
  },
  {
    code: '<ChatGptMobileAnimation />',
    component: ChatGptMobileAnimation,
    description: 'ChatGPT mobile em tela cheia para posts, demos e vídeos sociais.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'ChatGPT Mobile',
    tags: ['Mobile', 'Chat', 'Assistant', 'Social'],
    value: 'marketing-chatgpt-mobile',
    width: 1080,
  },
  {
    code: '<ClaudeWebAnimation />',
    component: ClaudeWebAnimation,
    description: 'Janela web do Claude com conversa e composer desktop.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'Claude Web',
    tags: ['Web', 'Chat', 'Assistant', 'Social'],
    value: 'marketing-claude-web',
    width: 1080,
  },
  {
    code: '<ClaudeMobileAnimation />',
    component: ClaudeMobileAnimation,
    description: 'Claude mobile em tela cheia para posts, demos e vídeos sociais.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Marketing',
    label: 'Claude Mobile',
    tags: ['Mobile', 'Chat', 'Assistant', 'Social'],
    value: 'marketing-claude-mobile',
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
    kind: 'Marketing',
    label: 'Mobile App',
    tags: ['Mobile', 'App', 'Social'],
    value: 'marketing-mobile-app',
    width: 1080,
  },
  {
    code: '<ExpenseClassificationTableAction />',
    component: ExpenseClassificationTableAction,
    description: 'Classificação automática de despesas com tabela, IA central e categorias com confiança.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Actions',
    label: 'Classificação IA Tabela',
    tags: ['Despesas', 'IA', 'Classificação'],
    value: 'actions-expense-classification-table',
    width: 1080,
  },
  {
    code: '<ExpenseClassificationMatchingAction />',
    component: ExpenseClassificationMatchingAction,
    description: 'Despesas conectadas por linhas pontilhadas até suas categorias finais.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Actions',
    label: 'Classificação IA Match',
    tags: ['Despesas', 'Categorias', 'Automação'],
    value: 'actions-expense-classification-match',
    width: 1080,
  },
  {
    code: '<ExpenseClassificationFoldersAction />',
    component: ExpenseClassificationFoldersAction,
    description: 'Recibos e transações organizados automaticamente em pastas de despesa.',
    duration: MCP_SINGLE_ANIMATION_DURATION,
    height: 1920,
    kind: 'Actions',
    label: 'Classificação IA Pastas',
    tags: ['Despesas', 'Pastas', 'IA'],
    value: 'actions-expense-classification-folders',
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

const kinds: Array<'Todos' | CatalogKind> = ['Todos', 'Logo', 'Componentes', 'Mockups', 'Motion', 'Tipografia Animada', 'Marketing', 'Vídeos criados', 'Galerias', 'Animações', 'Actions', 'Templates']

function Thumbnail({ item }: { item: CatalogItem }) {
  const color = item.kind === 'Motion' ? '#245BDB' : item.kind === 'Tipografia Animada' ? '#DB2777' : item.kind === 'Marketing' ? '#C28F2C' : item.kind === 'Vídeos criados' ? '#0F766E' : item.kind === 'Galerias' ? '#7C3AED' : item.kind === 'Animações' ? '#0EA5E9' : item.kind === 'Actions' ? '#1677F2' : item.kind === 'Logo' ? '#111827' : item.kind === 'Templates' ? '#9333EA' : item.kind === 'Mockups' ? '#22A06B' : '#101828'
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
      ) : item.kind === 'Marketing' || item.kind === 'Actions' ? (
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
  const [selectedKind, setSelectedKind] = useState<'Todos' | CatalogKind>('Todos')
  const [query, setQuery] = useState('')
  const [selectedValue, setSelectedValue] = useState('gallery-carousel')

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
