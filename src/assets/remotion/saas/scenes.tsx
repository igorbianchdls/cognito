import { interpolate, useCurrentFrame } from 'remotion'

import { clampProgress, fadeSlide, stagger } from '@/assets/remotion/saas/animation'
import { BrowserWindowMock, ChatAssistantMock, CommandPaletteMock, DashboardMock, KanbanMock, TableMock } from '@/assets/remotion/saas/productMockups'
import { FeatureCard, FloatingPanel, MetricCard, SaaSSceneShell, SceneCopy } from '@/assets/remotion/saas/primitives'
import type {
  SaaSBrand,
  SaaSHeroScene,
  SaaSIntegrationsScene,
  SaaSMetricsScene,
  SaaSOutroScene,
  SaaSProblemScene,
  SaaSProductTourScene,
  SaaSTheme,
  SaaSWorkflowScene,
} from '@/assets/remotion/saas/types'

const fallbackMetrics = [
  { label: 'Manual work removed', value: '42%', delta: '+18 pts' },
  { label: 'Time to insight', value: '8 min', delta: 'from 3 days' },
  { label: 'Teams aligned', value: '12', delta: 'live now' },
]

export function SaaSHeroIntroScene({ brand, scene, theme }: { brand: SaaSBrand; scene: SaaSHeroScene; theme: SaaSTheme }) {
  const frame = useCurrentFrame()
  const metrics = scene.metrics?.length ? scene.metrics : fallbackMetrics
  return (
    <SaaSSceneShell brand={brand} footer="Hero intro with product context and proof points" status="Product launch" theme={theme}>
      <section style={{ display: 'grid', gap: 46, gridTemplateColumns: '0.88fr 1.12fr', left: 72, position: 'absolute', right: 72, top: 210, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 34, paddingTop: 54 }}>
          <SceneCopy eyebrow={brand.name} subtitle={scene.subtitle} theme={theme} title={scene.title} />
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, 1fr)', ...fadeSlide(frame, 30) }}>
            {metrics.slice(0, 3).map((metric, index) => <MetricCard key={metric.label} index={index} metric={metric} theme={theme} />)}
          </div>
        </div>
        <div style={{ position: 'relative', ...fadeSlide(frame, 18, { distance: 42 }) }}>
          <BrowserWindowMock delay={16} theme={theme} title={`${brand.name.toLowerCase().replace(/\s+/g, '')}.app`}>
            <DashboardMock metrics={metrics} screen={scene.productScreens?.[0]} theme={theme} />
          </BrowserWindowMock>
          <div style={{ bottom: -54, position: 'absolute', right: 42, width: 520 }}>
            <CommandPaletteMock theme={theme} />
          </div>
        </div>
      </section>
    </SaaSSceneShell>
  )
}

export function SaaSProblemToSolutionScene({ brand, scene, theme }: { brand: SaaSBrand; scene: SaaSProblemScene; theme: SaaSTheme }) {
  const frame = useCurrentFrame()
  return (
    <SaaSSceneShell brand={brand} footer="Problem framing before product reveal" status="Before and after" theme={theme}>
      <section style={{ display: 'grid', gap: 54, gridTemplateColumns: '0.9fr 1.1fr', left: 82, position: 'absolute', right: 82, top: 230, zIndex: 20 }}>
        <SceneCopy eyebrow="The old way" subtitle={scene.subtitle} theme={theme} title={scene.title} width={680} />
        <div style={{ display: 'grid', gap: 18 }}>
          {scene.painPoints.map((pain, index) => {
            const p = clampProgress(frame, stagger(frame, index, 22, 13), 62 + index * 13)
            return (
              <div key={pain} style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 26, boxShadow: '0 18px 48px rgba(20,24,22,0.10)', display: 'grid', gap: 18, gridTemplateColumns: '54px 1fr', opacity: p, padding: 22, transform: `translateX(${(1 - p) * 36}px)` }}>
                <span style={{ alignItems: 'center', background: '#FCEDEE', borderRadius: 18, color: '#B42318', display: 'flex', fontSize: 24, fontWeight: 900, height: 54, justifyContent: 'center', letterSpacing: 0 }}>{index + 1}</span>
                <strong style={{ color: theme.text, fontSize: 31, fontWeight: 840, letterSpacing: 0, lineHeight: 1.08 }}>{pain}</strong>
              </div>
            )
          })}
          <FloatingPanel delay={58} style={{ display: 'grid', gap: 18, marginTop: 20 }} theme={theme}>
            <span style={{ color: theme.accent, fontSize: 18, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase' }}>The new workflow</span>
            <strong style={{ color: theme.text, fontSize: 42, fontWeight: 900, letterSpacing: 0, lineHeight: 1 }}>One operating layer connects teams, data and actions.</strong>
          </FloatingPanel>
        </div>
      </section>
    </SaaSSceneShell>
  )
}

export function SaaSProductTourScene({ brand, scene, theme }: { brand: SaaSBrand; scene: SaaSProductTourScene; theme: SaaSTheme }) {
  const frame = useCurrentFrame()
  const activeIndex = Math.floor(frame / 96) % Math.max(1, scene.screens.length)
  const active = scene.screens[activeIndex]
  return (
    <SaaSSceneShell brand={brand} footer="Product tour with rotating screens" status="Product tour" theme={theme}>
      <section style={{ display: 'grid', gap: 42, left: 72, position: 'absolute', right: 72, top: 176, zIndex: 20 }}>
        <div style={{ alignItems: 'end', display: 'flex', justifyContent: 'space-between' }}>
          <SceneCopy eyebrow="Inside the product" subtitle={scene.subtitle} theme={theme} title={scene.title} width={900} />
          <div style={{ display: 'flex', gap: 10, paddingBottom: 10 }}>
            {scene.screens.map((screen, index) => <span key={screen.title} style={{ background: index === activeIndex ? screen.accent || theme.accent : '#CAD8CF', borderRadius: 999, height: 12, width: index === activeIndex ? 46 : 12 }} />)}
          </div>
        </div>
        <BrowserWindowMock delay={16} theme={theme} title={`${brand.name.toLowerCase().replace(/\s+/g, '')}.app/${active?.title.toLowerCase().replace(/\s+/g, '-') || 'overview'}`}>
          <DashboardMock metrics={fallbackMetrics} screen={active} theme={theme} />
        </BrowserWindowMock>
      </section>
    </SaaSSceneShell>
  )
}

export function SaaSWorkflowAutomationScene({ brand, scene, theme }: { brand: SaaSBrand; scene: SaaSWorkflowScene; theme: SaaSTheme }) {
  const frame = useCurrentFrame()
  return (
    <SaaSSceneShell brand={brand} footer="Workflow automation scene with task movement" status="Automation running" theme={theme}>
      <section style={{ display: 'grid', gap: 44, gridTemplateColumns: '0.82fr 1.18fr', left: 78, position: 'absolute', right: 78, top: 220, zIndex: 20 }}>
        <SceneCopy eyebrow="From request to outcome" subtitle={scene.subtitle} theme={theme} title={scene.title} width={680} />
        <div style={{ display: 'grid', gap: 22 }}>
          {scene.steps.map((step, index) => {
            const p = clampProgress(frame, 18 + index * 16, 54 + index * 16)
            return (
              <div key={step.title} style={{ alignItems: 'center', background: index === scene.steps.length - 1 ? theme.text : '#FFFFFF', border: `1px solid ${index === scene.steps.length - 1 ? theme.text : theme.border}`, borderRadius: 24, color: index === scene.steps.length - 1 ? '#FFFFFF' : theme.text, display: 'grid', gap: 18, gridTemplateColumns: '58px 1fr auto', opacity: p, padding: 20, transform: `translateY(${(1 - p) * 26}px)` }}>
                <span style={{ alignItems: 'center', background: index === scene.steps.length - 1 ? theme.accent : '#F0F5F2', borderRadius: 18, display: 'flex', fontSize: 24, fontWeight: 900, height: 58, justifyContent: 'center', letterSpacing: 0 }}>{index + 1}</span>
                <div style={{ display: 'grid', gap: 5 }}>
                  <strong style={{ fontSize: 28, fontWeight: 880, letterSpacing: 0 }}>{step.title}</strong>
                  {step.description ? <span style={{ color: index === scene.steps.length - 1 ? 'rgba(255,255,255,0.68)' : theme.muted, fontSize: 18, fontWeight: 650, letterSpacing: 0 }}>{step.description}</span> : null}
                </div>
                {step.status ? <span style={{ color: index === scene.steps.length - 1 ? '#A8F0C6' : theme.accent, fontSize: 18, fontWeight: 880, letterSpacing: 0 }}>{step.status}</span> : null}
              </div>
            )
          })}
        </div>
      </section>
    </SaaSSceneShell>
  )
}

export function SaaSIntegrationsScene({ brand, scene, theme }: { brand: SaaSBrand; scene: SaaSIntegrationsScene; theme: SaaSTheme }) {
  const frame = useCurrentFrame()
  return (
    <SaaSSceneShell brand={brand} footer="Integration network with connected systems" status="Connected systems" theme={theme}>
      <section style={{ display: 'grid', gap: 42, gridTemplateColumns: '0.8fr 1.2fr', left: 78, position: 'absolute', right: 78, top: 220, zIndex: 20 }}>
        <SceneCopy eyebrow="Integrations" subtitle={scene.subtitle} theme={theme} title={scene.title} width={680} />
        <div style={{ height: 760, position: 'relative' }}>
          <div style={{ background: theme.text, borderRadius: 999, color: '#FFFFFF', display: 'grid', gap: 6, height: 210, left: '50%', placeContent: 'center', position: 'absolute', textAlign: 'center', top: '50%', transform: 'translate(-50%, -50%)', width: 210, zIndex: 20 }}>
            <strong style={{ fontSize: 42, fontWeight: 900, letterSpacing: 0 }}>{brand.mark || brand.name.slice(0, 1)}</strong>
            <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 17, fontWeight: 760, letterSpacing: 0 }}>{brand.name}</span>
          </div>
          {scene.logos.map((logo, index) => {
            const angle = (Math.PI * 2 * index) / scene.logos.length - Math.PI / 2
            const p = clampProgress(frame, 18 + index * 5, 44 + index * 5)
            const radius = 285
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            return (
              <div key={logo.label} style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 24, boxShadow: '0 18px 48px rgba(20,24,22,0.10)', display: 'flex', gap: 14, left: '50%', opacity: p, padding: '16px 18px', position: 'absolute', top: '50%', transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`, zIndex: 10 }}>
                <span style={{ alignItems: 'center', background: '#F0F5F2', borderRadius: 15, color: theme.accent, display: 'flex', fontSize: 20, fontWeight: 900, height: 42, justifyContent: 'center', letterSpacing: 0, width: 42 }}>{logo.mark || logo.label.slice(0, 1)}</span>
                <strong style={{ color: theme.text, fontSize: 20, fontWeight: 820, letterSpacing: 0 }}>{logo.label}</strong>
              </div>
            )
          })}
        </div>
      </section>
    </SaaSSceneShell>
  )
}

export function SaaSMetricsImpactScene({ brand, scene, theme }: { brand: SaaSBrand; scene: SaaSMetricsScene; theme: SaaSTheme }) {
  return (
    <SaaSSceneShell brand={brand} footer="Impact metrics and outcome proof" status="Impact report" theme={theme}>
      <section style={{ display: 'grid', gap: 48, left: 82, position: 'absolute', right: 82, top: 212, zIndex: 20 }}>
        <SceneCopy eyebrow="Measured impact" subtitle={scene.subtitle} theme={theme} title={scene.title} width={1040} />
        <div style={{ display: 'grid', gap: 22, gridTemplateColumns: `repeat(${Math.min(4, scene.metrics.length)}, 1fr)` }}>
          {scene.metrics.map((metric, index) => <MetricCard key={metric.label} index={index} metric={metric} theme={theme} />)}
        </div>
        <div style={{ display: 'grid', gap: 22, gridTemplateColumns: '1fr 1fr' }}>
          <FloatingPanel delay={52} theme={theme}>
            <TableMock theme={theme} />
          </FloatingPanel>
          <FloatingPanel delay={64} theme={theme}>
            <KanbanMock theme={theme} />
          </FloatingPanel>
        </div>
      </section>
    </SaaSSceneShell>
  )
}

export function SaaSOutroScene({ brand, scene, theme }: { brand: SaaSBrand; scene: SaaSOutroScene; theme: SaaSTheme }) {
  const frame = useCurrentFrame()
  const scale = interpolate(Math.sin(frame / 42), [-1, 1], [0.98, 1.03])
  return (
    <SaaSSceneShell brand={brand} footer="CTA outro" status="Ready to launch" theme={theme}>
      <section style={{ display: 'grid', gap: 42, left: 130, placeItems: 'center', position: 'absolute', right: 130, textAlign: 'center', top: 250, zIndex: 20 }}>
        <div style={{ transform: `scale(${scale})` }}>
          <SceneCopy eyebrow={brand.name} subtitle={scene.subtitle} theme={theme} title={scene.title} width={1180} />
        </div>
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr', width: 1180 }}>
          <FloatingPanel delay={28} theme={theme}>
            <ChatAssistantMock theme={theme} />
          </FloatingPanel>
          <FloatingPanel delay={38} theme={theme}>
            <CommandPaletteMock theme={theme} />
          </FloatingPanel>
        </div>
        {scene.cta ? <span style={{ background: theme.text, borderRadius: 999, color: '#FFFFFF', fontSize: 28, fontWeight: 900, letterSpacing: 0, padding: '20px 28px', ...fadeSlide(frame, 58) }}>{scene.cta}</span> : null}
      </section>
    </SaaSSceneShell>
  )
}

export function SaaSFeatureRevealScene({ brand, features, subtitle, theme, title }: { brand: SaaSBrand; features: Array<{ title: string; description?: string; eyebrow?: string; metric?: string }>; subtitle?: string; theme: SaaSTheme; title: string }) {
  return (
    <SaaSSceneShell brand={brand} footer="Reusable feature reveal scene" status="Feature reveal" theme={theme}>
      <section style={{ display: 'grid', gap: 48, left: 82, position: 'absolute', right: 82, top: 220, zIndex: 20 }}>
        <SceneCopy eyebrow="What changes" subtitle={subtitle} theme={theme} title={title} width={980} />
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {features.map((feature, index) => <FeatureCard key={feature.title} feature={feature} index={index} theme={theme} />)}
        </div>
      </section>
    </SaaSSceneShell>
  )
}
