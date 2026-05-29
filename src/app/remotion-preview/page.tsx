'use client'

import { Player } from '@remotion/player'
import type { ComponentType } from 'react'
import { useState } from 'react'

import { McpChartIntro, type McpTemplate } from '@/remotion/compositions/McpChartIntro'
import {
  AccountingEntryAnimation,
  BankReconciliationAnimation,
  ClosingSlidesAnimation,
  ContractManagementAnimation,
  DashboardsAnimation,
  ExpenseClassificationAnimation,
  ManagementReportAnimation,
  MCP_SINGLE_ANIMATION_DURATION,
} from '@/remotion/compositions/McpOperationsDemo'
import { PdfViewerMock, type PdfMockPage } from '@/remotion/components/PdfViewerMock'
import { PowerPointEditorMock, type PowerPointMockSlide } from '@/remotion/components/PowerPointEditorMock'

type PreviewComposition = 'intro' | 'classification' | 'reconciliation' | 'dashboards' | 'report' | 'slides' | 'contracts' | 'entry' | 'powerpoint' | 'pdf'

type AnimationOption = {
  component: ComponentType
  label: string
  value: Exclude<PreviewComposition, 'intro'>
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

const animationOptions: AnimationOption[] = [
  { component: ExpenseClassificationAnimation, label: 'Classificação', value: 'classification' },
  { component: BankReconciliationAnimation, label: 'Conciliação', value: 'reconciliation' },
  { component: DashboardsAnimation, label: 'Dashboards', value: 'dashboards' },
  { component: ManagementReportAnimation, label: 'Relatório', value: 'report' },
  { component: ClosingSlidesAnimation, label: 'Slides', value: 'slides' },
  { component: ContractManagementAnimation, label: 'Contratos', value: 'contracts' },
  { component: AccountingEntryAnimation, label: 'Lançamento', value: 'entry' },
  { component: PowerPointPreviewAnimation, label: 'PowerPoint', value: 'powerpoint' },
  { component: PdfPreviewAnimation, label: 'PDF', value: 'pdf' },
]

export default function RemotionPreviewPage() {
  const [composition, setComposition] = useState<PreviewComposition>('classification')
  const [template, setTemplate] = useState<McpTemplate>('chatgpt')
  const isIntro = composition === 'intro'
  const selectedAnimation = animationOptions.find((option) => option.value === composition) || animationOptions[0]

  return (
    <main
      style={{
        alignItems: 'center',
        background: '#f8fafc',
        display: 'flex',
        minHeight: '100vh',
        padding: 32,
      }}
    >
      <section
        style={{
          margin: '0 auto',
          maxWidth: 430,
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'flex-start',
            display: 'flex',
            gap: 14,
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <div>
            <h1
              style={{
                color: '#0f172a',
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Remotion preview
            </h1>
            <p
              style={{
                color: '#475569',
                fontSize: 13,
                margin: '6px 0 0',
              }}
            >
              Templates mobile com componentes MCP Apps reais.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
            <div
              style={{
                background: '#e2e8f0',
                borderRadius: 8,
                display: 'inline-flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'flex-end',
                maxWidth: 310,
                padding: 3,
              }}
            >
              {[{ label: 'Intro', value: 'intro' as const }, ...animationOptions].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setComposition(option.value)}
                  style={{
                    background: composition === option.value ? '#ffffff' : 'transparent',
                    border: 0,
                    borderRadius: 6,
                    color: composition === option.value ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '7px 9px',
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            {isIntro ? (
              <div
                style={{
                  background: '#e2e8f0',
                  borderRadius: 8,
                  display: 'inline-flex',
                  gap: 2,
                  padding: 3,
                }}
              >
                {(['chatgpt', 'claude'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setTemplate(value)}
                    style={{
                      background: template === value ? '#ffffff' : 'transparent',
                      border: 0,
                      borderRadius: 6,
                      color: template === value ? '#0f172a' : '#64748b',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '7px 9px',
                      textTransform: 'capitalize',
                    }}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.10)',
            overflow: 'hidden',
          }}
        >
          {isIntro ? (
            <Player
              component={McpChartIntro}
              compositionHeight={1920}
              compositionWidth={1080}
              controls
              durationInFrames={4200}
              fps={30}
              inputProps={{ template }}
              style={{
                aspectRatio: '9 / 16',
                maxHeight: '82vh',
                width: '100%',
              }}
            />
          ) : (
            <Player
              component={selectedAnimation.component}
              compositionHeight={1920}
              compositionWidth={1080}
              controls
              durationInFrames={MCP_SINGLE_ANIMATION_DURATION}
              fps={30}
              style={{
                aspectRatio: '9 / 16',
                maxHeight: '82vh',
                width: '100%',
              }}
            />
          )}
        </div>
      </section>
    </main>
  )
}
