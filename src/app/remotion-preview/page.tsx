'use client'

import { Player } from '@remotion/player'
import type { ComponentType } from 'react'
import { useMemo, useState } from 'react'

import { McpChartIntro, type McpTemplate } from '@/remotion/compositions/McpChartIntro'
import {
  AccountingEntryAnimation,
  ApprovalFlowAnimation,
  BankReconciliationAnimation,
  ChatGptWebAnimation,
  ClaudeWebAnimation,
  ClosingSlidesAnimation,
  ContractManagementAnimation,
  DataPipelineAnimation,
  DashboardsAnimation,
  EmailAnimation,
  ExpenseClassificationAnimation,
  InboxAnimation,
  IntegrationFlowAnimation,
  ManagementReportAnimation,
  MCP_SINGLE_ANIMATION_DURATION,
  NewsAnimation,
  NotificationCenterAnimation,
  ReportExportAnimation,
  SaaSAccordionGalleryAnimation,
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
  TweetAnimation,
} from '@/remotion/compositions/McpOperationsDemo'
import { ExcelWorkbookMock, type ExcelMockSheet } from '@/remotion/components/ExcelWorkbookMock'
import { PdfViewerMock, type PdfMockPage } from '@/remotion/components/PdfViewerMock'
import { PowerPointEditorMock, type PowerPointMockSlide } from '@/remotion/components/PowerPointEditorMock'

type PreviewComposition = string
type AnimationCategory = 'Chat / Assistants' | 'Galerias' | 'Operações Financeiras' | 'Apps / Mockups' | 'SaaS Patterns' | 'Workflows'
type AnimationKind = 'chat' | 'gallery' | 'operation' | 'mockup' | 'pattern' | 'workflow'

type AnimationOption = {
  category: AnimationCategory
  component?: ComponentType
  description: string
  duration?: number
  kind: AnimationKind
  label: string
  tags: string[]
  value: PreviewComposition
}

const powerpointSlides: PowerPointMockSlide[] = [
  {
    accent: '#c8a856',
    layout: 'title',
    metrics: [
      { label: 'EBITDA uplift by FY29 (base case)', value: '+$159M' },
      { label: 'p.a. TSR uplift over plan', value: '+9-14%' },
      { label: 'Board review - final POV due', value: 'May 7' },
    ],
    subtitle: 'A value-creation point of view for the Board',
    title: 'Project Lighthouse',
  },
  {
    accent: '#c8a856',
    eyebrow: 'This portfolio showed water',
    layout: 'metrics',
    metrics: [
      { label: 'EBITDA base', value: '+$159M' },
      { label: 'Cash impact', value: '+$94M' },
      { label: 'Risk adjusted', value: '+$78M' },
    ],
    title: 'The portfolio showed strong execution',
  },
  {
    accent: '#0b5878',
    eyebrow: 'Acme has under-grown',
    layout: 'chart',
    title: 'Core assets show margin expansion',
  },
  {
    accent: '#c8a856',
    eyebrow: 'Options and open questions',
    layout: 'bullets',
    bullets: ['Prioritize pricing reset', 'Reduce indirect procurement', 'Accelerate service attach', 'Prepare May board decision'],
    title: 'Four directions on the table',
  },
  {
    accent: '#c8a856',
    eyebrow: 'Reposition the portfolio',
    layout: 'metrics',
    metrics: [
      { label: 'Revenue pool', value: '$430M' },
      { label: 'EBITDA bridge', value: '$92M' },
      { label: 'Downside case', value: '$73M' },
    ],
    title: 'Reposition toward service-led growth',
  },
  {
    accent: '#0b5878',
    eyebrow: 'M&A EBITDA',
    layout: 'chart',
    title: 'Base case bridge from FY26 to FY29',
  },
  {
    accent: '#c8a856',
    eyebrow: 'Commercial plan',
    layout: 'bullets',
    bullets: ['Scale top accounts', 'Shift mix to recurring', 'Retire low-margin SKUs', 'Lock SteerCo milestones'],
    title: 'Three moves for the bridge',
  },
]

const pdfPages: PdfMockPage[] = [
  {
    accent: '#1298e8',
    sections: [
      { kind: 'table', title: 'Canvas element' },
      { kind: 'icons', title: 'Compositing' },
      { kind: 'text', title: '2D Context' },
      { kind: 'chart', title: 'Line styles' },
    ],
    subtitle: 'v1.1',
    title: 'HTML5 Canvas Cheat Sheet',
  },
  {
    accent: '#ff4a1f',
    sections: [
      { kind: 'text', title: 'Transformations' },
      { kind: 'table', title: 'Methods' },
      { kind: 'chart', title: 'Coordinates' },
      { kind: 'icons', title: 'Examples' },
    ],
    subtitle: 'Page 2',
    title: 'Canvas API Reference',
  },
]

const excelSheets: ExcelMockSheet[] = [
  {
    activeCell: 'I1',
    name: 'Assumptions',
    tabs: ['Assumptions', 'Benchmarks', 'Scenarios'],
    title: 'ACME INDUSTRIAL - VALUE-CREATION MODEL',
  },
]

function PowerPointPreviewAnimation() {
  return (
    <PowerPointEditorMock
      slides={powerpointSlides}
      title="Acme_SteerCo"
    />
  )
}

function PdfPreviewAnimation() {
  return (
    <PdfViewerMock
      fileName="HTML5 Canvas Cheat Sheet"
      pages={pdfPages}
      url="https://raw.github.com/mozilla/pdf.js/master/test/pdfs/canvas.pdf"
    />
  )
}

function ExcelPreviewAnimation() {
  return (
    <ExcelWorkbookMock
      fileName="ValueCreation_Model"
      sheets={excelSheets}
    />
  )
}

const animationCatalog: AnimationOption[] = [
  { category: 'Chat / Assistants', description: 'Intro mobile com templates ChatGPT e Claude.', duration: 4200, kind: 'chat', label: 'Intro Mobile', tags: ['Mobile', 'Chat', 'MCP'], value: 'intro' },
  { category: 'Chat / Assistants', component: ChatGptWebAnimation, description: 'Janela web do ChatGPT com sidebar, conversa e card analítico.', kind: 'chat', label: 'ChatGPT Web', tags: ['Web', 'Chat', 'Assistant'], value: 'chatgpt-web' },
  { category: 'Chat / Assistants', component: ClaudeWebAnimation, description: 'Janela web do Claude com conversa e composer desktop.', kind: 'chat', label: 'Claude Web', tags: ['Web', 'Chat', 'Assistant'], value: 'claude-web' },

  { category: 'Operações Financeiras', component: ExpenseClassificationAnimation, description: 'Esteira vertical de documentos financeiros classificados por IA.', kind: 'operation', label: 'Classificação', tags: ['Financeiro', 'IA', 'Esteira'], value: 'classification' },
  { category: 'Operações Financeiras', component: BankReconciliationAnimation, description: 'Pareamento entre banco e ERP em fluxo vertical.', kind: 'operation', label: 'Conciliação', tags: ['Banco', 'ERP', 'Financeiro'], value: 'reconciliation' },
  { category: 'Operações Financeiras', component: DashboardsAnimation, description: 'Dashboards financeiros renderizados em sequência.', kind: 'operation', label: 'Dashboards', tags: ['BI', 'Financeiro', 'Reports'], value: 'dashboards' },
  { category: 'Operações Financeiras', component: ManagementReportAnimation, description: 'Relatório gerencial em páginas executivas.', kind: 'operation', label: 'Relatório', tags: ['Word', 'Financeiro', 'Executivo'], value: 'report' },
  { category: 'Operações Financeiras', component: ClosingSlidesAnimation, description: 'Deck executivo de fechamento mensal em esteira.', kind: 'operation', label: 'Slides', tags: ['PPT', 'Fechamento', 'Board'], value: 'slides' },
  { category: 'Operações Financeiras', component: ContractManagementAnimation, description: 'Contratos monitorados por risco, vencimento e reajuste.', kind: 'operation', label: 'Contratos', tags: ['Jurídico', 'Risco', 'Financeiro'], value: 'contracts' },
  { category: 'Operações Financeiras', component: AccountingEntryAnimation, description: 'Lançamento contábil preparado, validado e enviado ao ERP.', kind: 'operation', label: 'Lançamento', tags: ['ERP', 'Contábil', 'Workflow'], value: 'entry' },

  { category: 'Apps / Mockups', component: PowerPointPreviewAnimation, description: 'Mock desktop de PowerPoint com slides e painel Claude.', kind: 'mockup', label: 'PowerPoint', tags: ['Office', 'Slides', 'Mockup'], value: 'powerpoint' },
  { category: 'Apps / Mockups', component: PdfPreviewAnimation, description: 'Viewer de PDF no padrão desktop/macOS.', kind: 'mockup', label: 'PDF', tags: ['Documentos', 'Viewer', 'Mockup'], value: 'pdf' },
  { category: 'Apps / Mockups', component: ExcelPreviewAnimation, description: 'Mock desktop de Excel com ribbon e workbook financeiro.', kind: 'mockup', label: 'Excel', tags: ['Office', 'Planilha', 'Mockup'], value: 'excel' },

  { category: 'SaaS Patterns', component: IntegrationFlowAnimation, description: 'Integrações conectando apps a um hub central.', kind: 'pattern', label: 'Integração', tags: ['SaaS', 'Integração', 'Hub'], value: 'integration' },
  { category: 'SaaS Patterns', component: NewsAnimation, description: 'Notícia editorial animada com headline e cards de apoio.', kind: 'pattern', label: 'Notícia', tags: ['Editorial', 'Social', 'News'], value: 'news' },
  { category: 'SaaS Patterns', component: TweetAnimation, description: 'Tweet animado com mídia e métricas de engajamento.', kind: 'pattern', label: 'Tweet', tags: ['Social', 'Post', 'Métricas'], value: 'tweet' },
  { category: 'SaaS Patterns', component: SaaSBeforeAfterAnimation, description: 'Comparação antes/depois com slider animado.', kind: 'pattern', label: 'Before After', tags: ['SaaS', 'Comparação', 'Impacto'], value: 'before-after' },
  { category: 'SaaS Patterns', component: SaaSTimelineAnimation, description: 'Timeline de processo, do dado bruto ao board pack.', kind: 'pattern', label: 'Timeline', tags: ['Processo', 'SaaS', 'Workflow'], value: 'timeline' },
  { category: 'SaaS Patterns', component: SaaSOrbitAnimation, description: 'Telas orbitando um hub central.', kind: 'pattern', label: 'Orbit', tags: ['Hub', 'Motion', 'SaaS'], value: 'orbit' },
  { category: 'SaaS Patterns', component: SaaSCommandCenterAnimation, description: 'Command center executivo agregando múltiplas telas.', kind: 'pattern', label: 'Command Center', tags: ['Dashboard', 'Executive', 'SaaS'], value: 'command-center' },
  { category: 'SaaS Patterns', component: SaaSLogoCloudAnimation, description: 'Cloud de logos para integrações e social proof.', kind: 'pattern', label: 'Logo Cloud', tags: ['Logos', 'Integrações', 'Social Proof'], value: 'logo-cloud' },
  { category: 'SaaS Patterns', component: SaaSMetricCounterAnimation, description: 'Números grandes crescendo com cards de impacto.', kind: 'pattern', label: 'Metric Counter', tags: ['Métricas', 'Impacto', 'SaaS'], value: 'metric-counter' },
  { category: 'SaaS Patterns', component: SaaSKanbanFlowAnimation, description: 'Cards atravessando colunas de processo.', kind: 'pattern', label: 'Kanban Flow', tags: ['Kanban', 'Workflow', 'Processo'], value: 'kanban-flow' },
  { category: 'SaaS Patterns', component: SaaSNetworkMapAnimation, description: 'Mapa de nós conectados para dados e entidades.', kind: 'pattern', label: 'Network Map', tags: ['Network', 'Dados', 'Integrações'], value: 'network-map' },
  { category: 'SaaS Patterns', component: SaaSProductTourAnimation, description: 'Tour de produto com hotspots sobre uma interface.', kind: 'pattern', label: 'Product Tour', tags: ['Tour', 'Hotspots', 'Product'], value: 'product-tour' },

  { category: 'Workflows', component: EmailAnimation, description: 'Email sendo redigido com resumo e plano de ação.', kind: 'workflow', label: 'Email', tags: ['Email', 'AI Compose', 'Workflow'], value: 'email' },
  { category: 'Workflows', component: InboxAnimation, description: 'Inbox financeiro com triagem, prioridade e resumo por IA.', kind: 'workflow', label: 'Inbox', tags: ['Inbox', 'Triage', 'Workflow'], value: 'inbox' },
  { category: 'Workflows', component: NotificationCenterAnimation, description: 'Central de notificações com severidade e ações rápidas.', kind: 'workflow', label: 'Notification', tags: ['Alertas', 'Operações', 'Workflow'], value: 'notification-center' },
  { category: 'Workflows', component: DataPipelineAnimation, description: 'Pipeline de dados fluindo por etapas técnicas.', kind: 'workflow', label: 'Data Pipeline', tags: ['Dados', 'Pipeline', 'ETL'], value: 'data-pipeline' },
  { category: 'Workflows', component: ReportExportAnimation, description: 'Exportação de relatório para PDF, PPT e XLS.', kind: 'workflow', label: 'Report Export', tags: ['Export', 'Reports', 'Office'], value: 'report-export' },
  { category: 'Workflows', component: ApprovalFlowAnimation, description: 'Fluxo de aprovação com validações e envio ao ERP.', kind: 'workflow', label: 'Approval Flow', tags: ['Aprovação', 'ERP', 'Workflow'], value: 'approval-flow' },

  { category: 'Galerias', component: SaaSCarouselGalleryAnimation, description: 'Carousel com foco central e profundidade.', kind: 'gallery', label: 'Carousel', tags: ['Gallery', 'Hero', 'Product'], value: 'gallery-carousel' },
  { category: 'Galerias', component: SaaSBentoGalleryAnimation, description: 'Bento grid com cards entrando em sequência.', kind: 'gallery', label: 'Bento', tags: ['Gallery', 'Grid', 'SaaS'], value: 'gallery-bento' },
  { category: 'Galerias', component: SaaSWallGalleryAnimation, description: 'Wall de screenshots em movimento contínuo.', kind: 'gallery', label: 'Wall', tags: ['Gallery', 'Wall', 'Hero'], value: 'gallery-wall' },
  { category: 'Galerias', component: SaaSStackGalleryAnimation, description: 'Cards empilhados trocando em camadas.', kind: 'gallery', label: 'Stack', tags: ['Gallery', 'Stack', 'Cards'], value: 'gallery-stack' },
  { category: 'Galerias', component: SaaSMarqueeGalleryAnimation, description: 'Fileiras horizontais infinitas.', kind: 'gallery', label: 'Marquee', tags: ['Gallery', 'Marquee', 'Loop'], value: 'gallery-marquee' },
  { category: 'Galerias', component: SaaSSpotlightGalleryAnimation, description: 'Tela principal em destaque com callouts.', kind: 'gallery', label: 'Spotlight', tags: ['Gallery', 'Zoom', 'Callouts'], value: 'gallery-spotlight' },
  { category: 'Galerias', component: SaaSDocumentFanGalleryAnimation, description: 'Documentos/telas abrindo em leque.', kind: 'gallery', label: 'Document Fan', tags: ['Gallery', 'Documents', 'Fan'], value: 'gallery-document-fan' },
  { category: 'Galerias', component: SaaSDeviceGalleryAnimation, description: 'Desktop, tablet e mobile em camadas.', kind: 'gallery', label: 'Device', tags: ['Gallery', 'Devices', 'Responsive'], value: 'gallery-device' },
  { category: 'Galerias', component: SaaSGridZoomGalleryAnimation, description: 'Grade de screenshots com foco rotativo.', kind: 'gallery', label: 'Grid Zoom', tags: ['Gallery', 'Grid', 'Zoom'], value: 'gallery-grid-zoom' },
  { category: 'Galerias', component: SaaSSwipeCardsGalleryAnimation, description: 'Cards em gesto visual de stories.', kind: 'gallery', label: 'Swipe Cards', tags: ['Gallery', 'Cards', 'Swipe'], value: 'gallery-swipe-cards' },
  { category: 'Galerias', component: SaaSCoverflowGalleryAnimation, description: 'Coverflow em perspectiva para telas de produto.', kind: 'gallery', label: 'Coverflow', tags: ['Gallery', '3D', 'Product'], value: 'gallery-coverflow' },
  { category: 'Galerias', component: SaaSRoom3DGalleryAnimation, description: 'Telas posicionadas como uma sala 3D.', kind: 'gallery', label: '3D Room', tags: ['Gallery', '3D', 'Room'], value: 'gallery-room-3d' },
  { category: 'Galerias', component: SaaSMagnifierGalleryAnimation, description: 'Lupa percorrendo uma grade de telas.', kind: 'gallery', label: 'Magnifier', tags: ['Gallery', 'Zoom', 'Detail'], value: 'gallery-magnifier' },
  { category: 'Galerias', component: SaaSAccordionGalleryAnimation, description: 'Cards expandindo e recolhendo verticalmente.', kind: 'gallery', label: 'Accordion', tags: ['Gallery', 'Cards', 'Accordion'], value: 'gallery-accordion' },
  { category: 'Galerias', component: SaaSStoryboardGalleryAnimation, description: 'Frames em sequência como storyboard.', kind: 'gallery', label: 'Storyboard', tags: ['Gallery', 'Storyboard', 'Frames'], value: 'gallery-storyboard' },
]

const categories: Array<'Todos' | AnimationCategory> = ['Todos', 'Chat / Assistants', 'Operações Financeiras', 'Apps / Mockups', 'SaaS Patterns', 'Workflows', 'Galerias']
const kinds: Array<'Todos' | AnimationKind> = ['Todos', 'chat', 'operation', 'mockup', 'pattern', 'workflow', 'gallery']

export default function RemotionPreviewPage() {
  const [composition, setComposition] = useState<PreviewComposition>('classification')
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | AnimationCategory>('Todos')
  const [selectedKind, setSelectedKind] = useState<'Todos' | AnimationKind>('Todos')
  const [template, setTemplate] = useState<McpTemplate>('chatgpt')
  const isIntro = composition === 'intro'
  const selectedAnimation = animationCatalog.find((option) => option.value === composition) || animationCatalog[0]
  const SelectedComponent = selectedAnimation.component || ExpenseClassificationAnimation
  const selectedDuration = selectedAnimation.duration || MCP_SINGLE_ANIMATION_DURATION
  const visibleAnimations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return animationCatalog.filter((option) => {
      const matchesCategory = selectedCategory === 'Todos' || option.category === selectedCategory
      const matchesKind = selectedKind === 'Todos' || option.kind === selectedKind
      const searchable = `${option.label} ${option.description} ${option.category} ${option.kind} ${option.tags.join(' ')}`.toLowerCase()
      const matchesQuery = normalizedQuery === '' || searchable.includes(normalizedQuery)

      return matchesCategory && matchesKind && matchesQuery
    })
  }, [query, selectedCategory, selectedKind])

  return (
    <main
      style={{
        background: '#070a0f',
        color: '#f8fafc',
        display: 'grid',
        gridTemplateColumns: '248px minmax(0, 1fr)',
        minHeight: '100vh',
        padding: 0,
      }}
    >
      <aside style={{ background: '#0f141b', borderRight: '1px solid #202a36', display: 'grid', gridTemplateRows: 'auto 1fr auto', minHeight: '100vh', padding: 20, position: 'sticky', top: 0 }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 7 }}>
            <span style={{ color: '#67e08f', fontSize: 12, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>Remotion</span>
            <h1 style={{ color: '#f8fafc', fontSize: 25, fontWeight: 850, letterSpacing: 0, lineHeight: 1.04, margin: 0 }}>Component Portal</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, lineHeight: 1.42, margin: 0 }}>Biblioteca de animações, galerias e mocks para vídeos SaaS.</p>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>Categorias</span>
            {categories.map((category) => {
              const count = category === 'Todos' ? animationCatalog.length : animationCatalog.filter((item) => item.category === category).length
              const active = selectedCategory === category

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    alignItems: 'center',
                    background: active ? '#12251a' : 'transparent',
                    border: active ? '1px solid #25583a' : '1px solid transparent',
                    borderRadius: 10,
                    color: active ? '#bbf7d0' : '#cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    fontSize: 13,
                    fontWeight: 780,
                    justifyContent: 'space-between',
                    padding: '10px 11px',
                    textAlign: 'left',
                  }}
                  type="button"
                >
                  <span>{category}</span>
                  <span style={{ color: active ? '#67e08f' : '#94a3b8', fontSize: 12 }}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div />

        <div style={{ background: '#111827', border: '1px solid #263445', borderRadius: 12, display: 'grid', gap: 7, padding: 12 }}>
          <strong style={{ color: '#f8fafc', fontSize: 13 }}>Preview</strong>
          <span style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.35 }}>1080x1920 · 30 FPS · players locais.</span>
        </div>
      </aside>

      <section style={{ display: 'grid', gap: 22, gridTemplateColumns: 'minmax(420px, 1fr) 430px', padding: 28 }}>
        <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
          <header style={{ alignItems: 'start', display: 'flex', gap: 18, justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <h2 style={{ color: '#f8fafc', fontSize: 30, fontWeight: 850, letterSpacing: 0, margin: 0 }}>Catálogo de componentes</h2>
              <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 650 }}>{visibleAnimations.length} itens encontrados · {selectedAnimation.label} selecionado</span>
            </div>
            {isIntro ? (
              <div style={{ background: '#1f2937', borderRadius: 10, display: 'inline-flex', gap: 3, padding: 3 }}>
                {(['chatgpt', 'claude'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setTemplate(value)}
                    style={{
                      background: template === value ? '#0f141b' : 'transparent',
                      border: 0,
                      borderRadius: 8,
                      color: template === value ? '#f8fafc' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 800,
                      padding: '9px 12px',
                      textTransform: 'capitalize',
                    }}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            ) : null}
          </header>

          <div style={{ background: '#0f141b', border: '1px solid #263445', borderRadius: 14, boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)', display: 'grid', gap: 14, padding: 14 }}>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome, tag, categoria ou descrição"
              style={{
                background: '#0b1118',
                border: '1px solid #293848',
                borderRadius: 10,
                color: '#f8fafc',
                fontSize: 14,
                fontWeight: 650,
                outline: 'none',
                padding: '12px 13px',
                width: '100%',
              }}
              value={query}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {kinds.map((kind) => {
                const active = selectedKind === kind
                return (
                  <button
                    key={kind}
                    onClick={() => setSelectedKind(kind)}
                    style={{
                      background: active ? '#67e08f' : '#16251d',
                      border: 0,
                      borderRadius: 999,
                      color: active ? '#0f141b' : '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 850,
                      padding: '8px 11px',
                      textTransform: kind === 'Todos' ? 'none' : 'capitalize',
                    }}
                    type="button"
                  >
                    {kind}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {visibleAnimations.map((option) => {
              const active = option.value === selectedAnimation.value
              const color = option.kind === 'gallery' ? '#67e08f' : option.kind === 'workflow' ? '#7dd3fc' : option.kind === 'mockup' ? '#fbbf24' : option.kind === 'chat' ? '#e5e7eb' : '#a7f3d0'

              return (
                <button
                  key={option.value}
                  onClick={() => setComposition(option.value)}
                  style={{
                    background: '#0f141b',
                    border: `1px solid ${active ? color : '#263445'}`,
                    borderRadius: 14,
                    boxShadow: active ? `0 22px 60px ${color}22` : '0 12px 34px rgba(15, 23, 42, 0.05)',
                    cursor: 'pointer',
                    display: 'grid',
                    gap: 12,
                    minHeight: 204,
                    padding: 14,
                    textAlign: 'left',
                  }}
                  type="button"
                >
                  <div style={{ background: '#111827', border: '1px solid #293848', borderRadius: 11, display: 'grid', gap: 8, height: 86, overflow: 'hidden', padding: 10 }}>
                    <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
                      <span style={{ background: color, borderRadius: 999, display: 'block', height: 9, width: 9 }} />
                      <span style={{ background: '#334155', borderRadius: 999, display: 'block', height: 7, width: '48%' }} />
                    </div>
                    <div style={{ alignItems: 'end', display: 'flex', gap: 5, height: 42 }}>
                      {[34, 52, 42, 64, 48].map((height, index) => <span key={height} style={{ background: index === 3 ? color : '#334155', borderRadius: 5, flex: 1, height }} />)}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ alignItems: 'start', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                      <strong style={{ color: '#f8fafc', fontSize: 16, fontWeight: 850, letterSpacing: 0, lineHeight: 1.08 }}>{option.label}</strong>
                      <span style={{ background: `${color}18`, borderRadius: 999, color, fontSize: 10, fontWeight: 900, padding: '5px 7px', textTransform: 'uppercase' }}>{option.kind}</span>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 650, lineHeight: 1.35 }}>{option.description}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 'auto' }}>
                    {option.tags.slice(0, 3).map((tag) => <span key={tag} style={{ background: '#182232', borderRadius: 999, color: '#cbd5e1', fontSize: 10, fontWeight: 800, padding: '5px 7px' }}>{tag}</span>)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <aside style={{ alignSelf: 'start', display: 'grid', gap: 14, position: 'sticky', top: 28 }}>
          <div style={{ background: '#0f141b', border: '1px solid #263445', borderRadius: 16, boxShadow: '0 22px 60px rgba(15, 23, 42, 0.08)', overflow: 'hidden', padding: 12 }}>
          {isIntro ? (
            <Player
              key={`${composition}-${template}`}
              component={McpChartIntro}
              compositionHeight={1920}
              compositionWidth={1080}
              controls
              durationInFrames={selectedDuration}
              fps={30}
              inputProps={{ template }}
              style={{
                aspectRatio: '9 / 16',
                borderRadius: 10,
                maxHeight: '72vh',
                width: '100%',
              }}
            />
          ) : (
            <Player
              key={composition}
              component={SelectedComponent}
              compositionHeight={1920}
              compositionWidth={1080}
              controls
              durationInFrames={selectedDuration}
              fps={30}
              style={{
                aspectRatio: '9 / 16',
                borderRadius: 10,
                maxHeight: '72vh',
                width: '100%',
              }}
            />
          )}
          </div>

          <div style={{ background: '#0f141b', border: '1px solid #263445', borderRadius: 16, boxShadow: '0 16px 42px rgba(15, 23, 42, 0.06)', display: 'grid', gap: 13, padding: 16 }}>
            <div style={{ alignItems: 'start', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <div style={{ display: 'grid', gap: 5 }}>
                <span style={{ color: '#67e08f', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>{selectedAnimation.category}</span>
                <h3 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 850, letterSpacing: 0, lineHeight: 1.04, margin: 0 }}>{selectedAnimation.label}</h3>
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(selectedAnimation.value)}
                style={{ background: '#16251d', border: 0, borderRadius: 999, color: '#67e08f', cursor: 'pointer', fontSize: 12, fontWeight: 850, padding: '9px 11px' }}
                type="button"
              >
                Copiar ID
              </button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 650, lineHeight: 1.45, margin: 0 }}>{selectedAnimation.description}</p>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
              {[
                ['Duração', `${selectedDuration}f`],
                ['FPS', '30'],
                ['Tipo', selectedAnimation.kind],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, display: 'grid', gap: 4, padding: 10 }}>
                  <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 850 }}>{label}</span>
                  <strong style={{ color: '#f8fafc', fontSize: 13, fontWeight: 850, textTransform: label === 'Tipo' ? 'capitalize' : 'none' }}>{value}</strong>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {selectedAnimation.tags.map((tag) => <span key={tag} style={{ background: '#182232', borderRadius: 999, color: '#cbd5e1', fontSize: 11, fontWeight: 850, padding: '7px 9px' }}>{tag}</span>)}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
