import type { ReactNode } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

import { FloatingScreenshot } from '@/remotion/saas/frames'
import type { SaaSFeature, SaaSLogo, SaaSMetric, SaaSProductScreen, SaaSTheme } from '@/remotion/saas/types'

type InstagramPostMetric = {
  label: string
  value: string
}

export function InstagramPostMock({
  accentLabel = 'Product launch',
  caption = 'From scattered finance data to a board-ready close workflow in one workspace.',
  handle = 'cognito.ops',
  mediaTitle = 'Close faster with live operations',
  metrics,
  theme,
}: {
  accentLabel?: string
  caption?: string
  handle?: string
  mediaTitle?: string
  metrics?: InstagramPostMetric[]
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const active = Math.floor(frame / 72) % 3
  const postMetrics = metrics || [
    { label: 'Likes', value: '12.8k' },
    { label: 'Saves', value: '842' },
    { label: 'Shares', value: '318' },
  ]
  const sweep = interpolate(Math.sin(frame / 34), [-1, 1], [0.18, 0.86])

  return (
    <article style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 30, boxShadow: '0 28px 78px rgba(20,24,22,0.14)', display: 'grid', gap: 0, margin: '0 auto', maxWidth: 520, overflow: 'hidden' }}>
      <header style={{ alignItems: 'center', display: 'flex', gap: 12, justifyContent: 'space-between', padding: '16px 18px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
          <span style={{ background: `linear-gradient(135deg, ${theme.accent}, #C28F2C 58%, #D946EF)`, borderRadius: 999, display: 'grid', height: 44, padding: 3, placeContent: 'center', width: 44 }}>
            <span style={{ background: '#FFFFFF', borderRadius: 999, color: theme.text, display: 'grid', fontSize: 15, fontWeight: 920, height: 36, letterSpacing: 0, placeContent: 'center', width: 36 }}>{handle.slice(0, 1).toUpperCase()}</span>
          </span>
          <div style={{ display: 'grid', gap: 2 }}>
            <strong style={{ color: theme.text, fontSize: 17, fontWeight: 900, letterSpacing: 0 }}>{handle}</strong>
            <span style={{ color: theme.muted, fontSize: 13, fontWeight: 720, letterSpacing: 0 }}>{accentLabel}</span>
          </div>
        </div>
        <span style={{ color: theme.muted, fontSize: 24, fontWeight: 900, letterSpacing: 0 }}>...</span>
      </header>
      <div style={{ background: '#F3F7F4', borderBottom: `1px solid ${theme.border}`, borderTop: `1px solid ${theme.border}`, height: 520, overflow: 'hidden', position: 'relative' }}>
        <div style={{ background: `linear-gradient(135deg, ${theme.text} 0%, ${theme.text} 44%, ${theme.accent} 100%)`, inset: 0, position: 'absolute' }} />
        <div style={{ background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) ${sweep * 100}%, transparent 100%)`, inset: 0, position: 'absolute' }} />
        <div style={{ display: 'grid', gap: 18, left: 28, position: 'absolute', right: 28, top: 34 }}>
          <span style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, color: '#FFFFFF', fontSize: 14, fontWeight: 900, justifySelf: 'start', letterSpacing: 0, padding: '9px 12px', textTransform: 'uppercase' }}>{accentLabel}</span>
          <strong style={{ color: '#FFFFFF', fontSize: 48, fontWeight: 940, letterSpacing: 0, lineHeight: 0.96 }}>{mediaTitle}</strong>
        </div>
        <div style={{ bottom: 28, display: 'grid', gap: 12, left: 28, position: 'absolute', right: 28 }}>
          {postMetrics.map((metric, index) => (
            <div key={metric.label} style={{ alignItems: 'center', background: index === active ? '#FFFFFF' : 'rgba(255,255,255,0.16)', border: `1px solid ${index === active ? '#FFFFFF' : 'rgba(255,255,255,0.18)'}`, borderRadius: 18, color: index === active ? theme.text : '#FFFFFF', display: 'flex', justifyContent: 'space-between', padding: '13px 15px', transform: `scale(${index === active ? 1.02 : 1})` }}>
              <span style={{ fontSize: 14, fontWeight: 850, letterSpacing: 0, textTransform: 'uppercase' }}>{metric.label}</span>
              <strong style={{ color: index === active ? theme.accent : '#FFFFFF', fontSize: 25, fontWeight: 940, letterSpacing: 0 }}>{metric.value}</strong>
            </div>
          ))}
        </div>
      </div>
      <section style={{ display: 'grid', gap: 12, padding: 18 }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Like', 'Comment', 'Share'].map((action) => <span key={action} style={{ border: `1px solid ${theme.border}`, borderRadius: 999, color: theme.text, fontSize: 13, fontWeight: 850, letterSpacing: 0, padding: '8px 10px' }}>{action}</span>)}
          </div>
          <span style={{ border: `1px solid ${theme.border}`, borderRadius: 999, color: theme.accent, fontSize: 13, fontWeight: 900, letterSpacing: 0, padding: '8px 10px' }}>Save</span>
        </div>
        <p style={{ color: theme.text, fontSize: 16, fontWeight: 720, letterSpacing: 0, lineHeight: 1.34, margin: 0 }}><strong>{handle}</strong> {caption}</p>
        <span style={{ color: theme.muted, fontSize: 12, fontWeight: 760, letterSpacing: 0, textTransform: 'uppercase' }}>View all comments</span>
      </section>
    </article>
  )
}

export function LogoCloud({
  logos,
  theme,
}: {
  logos: SaaSLogo[]
  theme: SaaSTheme
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
      {logos.map((logo) => (
        <div key={logo.label} style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 18, display: 'flex', gap: 12, padding: '14px 16px' }}>
          <span style={{ alignItems: 'center', background: '#F0F5F2', borderRadius: 12, color: theme.accent, display: 'flex', fontSize: 17, fontWeight: 900, height: 36, justifyContent: 'center', letterSpacing: 0, width: 36 }}>{logo.mark || logo.label.slice(0, 1)}</span>
          <strong style={{ color: theme.text, fontSize: 18, fontWeight: 840, letterSpacing: 0 }}>{logo.label}</strong>
        </div>
      ))}
    </div>
  )
}

export function TestimonialCard({
  author,
  metric,
  quote,
  role,
  theme,
}: {
  author: string
  metric?: SaaSMetric
  quote: string
  role?: string
  theme: SaaSTheme
}) {
  return (
    <article style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 28, boxShadow: '0 24px 70px rgba(20,24,22,0.12)', display: 'grid', gap: 22, padding: 28 }}>
      <p style={{ color: theme.text, fontSize: 30, fontWeight: 760, letterSpacing: 0, lineHeight: 1.16, margin: 0 }}>"{quote}"</p>
      {metric ? (
        <div style={{ background: '#F8FBF9', border: `1px solid ${theme.border}`, borderRadius: 18, display: 'grid', gap: 4, padding: 16 }}>
          <span style={{ color: theme.muted, fontSize: 14, fontWeight: 780 }}>{metric.label}</span>
          <strong style={{ color: theme.accent, fontSize: 34, fontWeight: 920, letterSpacing: 0 }}>{metric.value}</strong>
        </div>
      ) : null}
      <footer style={{ display: 'grid', gap: 4 }}>
        <strong style={{ color: theme.text, fontSize: 20, fontWeight: 880, letterSpacing: 0 }}>{author}</strong>
        {role ? <span style={{ color: theme.muted, fontSize: 15, fontWeight: 680 }}>{role}</span> : null}
      </footer>
    </article>
  )
}

export function PricingCard({
  cta = 'Start now',
  features,
  highlighted = false,
  name,
  price,
  theme,
}: {
  cta?: string
  features: string[]
  highlighted?: boolean
  name: string
  price: string
  theme: SaaSTheme
}) {
  return (
    <article style={{ background: highlighted ? theme.text : '#FFFFFF', border: `1px solid ${highlighted ? theme.text : theme.border}`, borderRadius: 28, color: highlighted ? '#FFFFFF' : theme.text, display: 'grid', gap: 22, padding: 28 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <strong style={{ fontSize: 28, fontWeight: 900, letterSpacing: 0 }}>{name}</strong>
        <span style={{ color: highlighted ? 'rgba(255,255,255,0.70)' : theme.muted, fontSize: 17, fontWeight: 680 }}>For growing teams</span>
      </div>
      <strong style={{ fontSize: 54, fontWeight: 940, letterSpacing: 0 }}>{price}</strong>
      <div style={{ display: 'grid', gap: 11 }}>
        {features.map((feature) => <span key={feature} style={{ color: highlighted ? 'rgba(255,255,255,0.82)' : theme.muted, fontSize: 17, fontWeight: 720 }}>+ {feature}</span>)}
      </div>
      <span style={{ background: highlighted ? theme.accent : theme.text, borderRadius: 999, color: '#FFFFFF', fontSize: 18, fontWeight: 900, letterSpacing: 0, padding: '14px 18px', textAlign: 'center' }}>{cta}</span>
    </article>
  )
}

export function FeatureMatrix({
  features,
  theme,
}: {
  features: SaaSFeature[]
  theme: SaaSTheme
}) {
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 26, display: 'grid', overflow: 'hidden' }}>
      {features.map((feature, index) => (
        <div key={feature.title} style={{ borderBottom: index === features.length - 1 ? 'none' : `1px solid ${theme.border}`, display: 'grid', gap: 16, gridTemplateColumns: '0.7fr 1fr 150px', padding: '18px 22px' }}>
          <strong style={{ color: theme.text, fontSize: 20, fontWeight: 880, letterSpacing: 0 }}>{feature.title}</strong>
          <span style={{ color: theme.muted, fontSize: 17, fontWeight: 650, lineHeight: 1.35 }}>{feature.description}</span>
          <span style={{ color: theme.accent, fontSize: 18, fontWeight: 900, textAlign: 'right' }}>{feature.metric || feature.eyebrow || 'Included'}</span>
        </div>
      ))}
    </div>
  )
}

export function UseCaseCard({
  description,
  icon,
  metric,
  theme,
  title,
}: {
  description?: string
  icon?: ReactNode
  metric?: string
  theme: SaaSTheme
  title: string
}) {
  return (
    <article style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 24, display: 'grid', gap: 14, padding: 22 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ alignItems: 'center', background: '#F0F5F2', borderRadius: 16, color: theme.accent, display: 'flex', fontSize: 22, fontWeight: 900, height: 48, justifyContent: 'center', width: 48 }}>{icon || title.slice(0, 1)}</span>
        {metric ? <span style={{ color: theme.accent, fontSize: 18, fontWeight: 900 }}>{metric}</span> : null}
      </div>
      <strong style={{ color: theme.text, fontSize: 26, fontWeight: 900, letterSpacing: 0, lineHeight: 1 }}>{title}</strong>
      {description ? <span style={{ color: theme.muted, fontSize: 17, fontWeight: 650, lineHeight: 1.32 }}>{description}</span> : null}
    </article>
  )
}

export function BeforeAfterSlider({
  after,
  before,
  theme,
}: {
  after: ReactNode
  before: ReactNode
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const position = interpolate(Math.sin(frame / 34), [-1, 1], [0.25, 0.76])
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 28, height: 560, overflow: 'hidden', position: 'relative' }}>
      <div style={{ inset: 0, position: 'absolute' }}>{before}</div>
      <div style={{ bottom: 0, left: 0, overflow: 'hidden', position: 'absolute', top: 0, width: `${position * 100}%` }}>{after}</div>
      <div style={{ background: theme.accent, bottom: 0, left: `${position * 100}%`, position: 'absolute', top: 0, transform: 'translateX(-50%)', width: 5 }} />
      <span style={{ background: theme.accent, borderRadius: 999, color: '#FFFFFF', fontSize: 16, fontWeight: 900, left: `${position * 100}%`, letterSpacing: 0, padding: '10px 13px', position: 'absolute', top: 24, transform: 'translateX(-50%)' }}>Compare</span>
    </div>
  )
}

export function ScreenCarousel({
  screens,
  theme,
}: {
  screens: SaaSProductScreen[]
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const activeIndex = Math.floor(frame / 90) % Math.max(1, screens.length)
  return (
    <div style={{ height: 520, position: 'relative' }}>
      {[-1, 0, 1].map((slot) => {
        const index = (activeIndex + slot + screens.length) % screens.length
        const screen = screens[index]
        const active = slot === 0
        return (
          <div key={`${screen.title}-${slot}`} style={{ left: '50%', opacity: active ? 1 : 0.44, position: 'absolute', top: active ? 18 : 64, transform: `translateX(-50%) translateX(${slot * 330}px) scale(${active ? 1 : 0.82})`, zIndex: active ? 5 : 2 }}>
            <FloatingScreenshot active={active} label={screen.title} metric={screen.metric} theme={theme} />
          </div>
        )
      })}
    </div>
  )
}
