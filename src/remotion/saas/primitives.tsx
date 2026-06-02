import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'

import { fadeSlide, popIn } from '@/remotion/saas/animation'
import type { SaaSBrand, SaaSMetric, SaaSTheme } from '@/remotion/saas/types'

export function SaaSSceneShell({
  brand,
  children,
  footer,
  status,
  theme,
}: {
  brand: SaaSBrand
  children: ReactNode
  footer?: ReactNode
  status?: string
  theme: SaaSTheme
}) {
  return (
    <AbsoluteFill style={{ background: theme.background, color: theme.text, fontFamily: theme.fontFamily, overflow: 'hidden' }}>
      <SaaSBackdrop theme={theme} />
      <header style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '42px 58px', position: 'relative', zIndex: 40 }}>
        <LogoLockup brand={brand} theme={theme} />
        {status ? <StatusPill label={status} theme={theme} /> : null}
      </header>
      {children}
      {footer ? (
        <div style={{ bottom: 58, color: theme.muted, fontSize: 24, fontWeight: 760, left: 58, letterSpacing: 0, position: 'absolute', zIndex: 45 }}>
          {footer}
        </div>
      ) : null}
    </AbsoluteFill>
  )
}

export function SaaSBackdrop({ theme }: { theme: SaaSTheme }) {
  return (
    <>
      <div style={{ background: `radial-gradient(circle at 52% 44%, ${theme.accent}29, rgba(255,255,255,0) 56%)`, bottom: -180, left: -180, position: 'absolute', right: -180, top: -180 }} />
      <div style={{ backgroundImage: `linear-gradient(${theme.border}55 1px, transparent 1px), linear-gradient(90deg, ${theme.border}55 1px, transparent 1px)`, backgroundSize: '72px 72px', inset: 0, opacity: 0.45, position: 'absolute' }} />
    </>
  )
}

export function LogoLockup({ brand, theme }: { brand: SaaSBrand; theme: SaaSTheme }) {
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
      <div style={{ alignItems: 'center', background: theme.text, borderRadius: 16, color: '#FFFFFF', display: 'flex', fontSize: 24, fontWeight: 900, height: 46, justifyContent: 'center', letterSpacing: 0, width: 46 }}>
        {brand.mark || brand.name.slice(0, 1)}
      </div>
      <div style={{ display: 'grid', gap: 1 }}>
        <strong style={{ color: theme.text, fontSize: 25, fontWeight: 860, letterSpacing: 0 }}>{brand.name}</strong>
        {brand.tagline ? <span style={{ color: theme.muted, fontSize: 15, fontWeight: 720, letterSpacing: 0 }}>{brand.tagline}</span> : null}
      </div>
    </div>
  )
}

export function StatusPill({ label, theme }: { label: string; theme: SaaSTheme }) {
  return (
    <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.86)', border: `1px solid ${theme.border}`, borderRadius: 999, boxShadow: '0 16px 36px rgba(20,24,22,0.08)', color: '#314139', display: 'flex', fontSize: 20, fontWeight: 820, gap: 10, padding: '13px 17px' }}>
      <span style={{ background: theme.positive, borderRadius: 999, display: 'block', height: 12, width: 12 }} />
      {label}
    </div>
  )
}

export function SceneCopy({
  eyebrow,
  title,
  subtitle,
  theme,
  width = 760,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  theme: SaaSTheme
  width?: number
}) {
  const frame = useCurrentFrame()
  return (
    <div style={{ display: 'grid', gap: 18, maxWidth: width, ...fadeSlide(frame, 4) }}>
      {eyebrow ? <span style={{ color: theme.accent, fontSize: 23, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase' }}>{eyebrow}</span> : null}
      <h1 style={{ color: theme.text, fontSize: 82, fontWeight: 900, letterSpacing: 0, lineHeight: 0.94, margin: 0 }}>{title}</h1>
      {subtitle ? <p style={{ color: theme.muted, fontSize: 29, fontWeight: 650, letterSpacing: 0, lineHeight: 1.24, margin: 0 }}>{subtitle}</p> : null}
    </div>
  )
}

export function FloatingPanel({
  children,
  delay = 0,
  style,
  theme,
}: {
  children: ReactNode
  delay?: number
  style?: CSSProperties
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <div
      style={{
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 28,
        boxShadow: '0 34px 90px rgba(20,24,22,0.17)',
        overflow: 'hidden',
        padding: 24,
        ...popIn(frame, delay, fps),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function FeatureCard({ feature, index, theme }: { feature: { title: string; description?: string; eyebrow?: string; metric?: string }; index: number; theme: SaaSTheme }) {
  const frame = useCurrentFrame()
  return (
    <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 24, display: 'grid', gap: 10, padding: 22, ...fadeSlide(frame, 20 + index * 8) }}>
      {feature.eyebrow ? <span style={{ color: theme.muted, fontSize: 15, fontWeight: 850, letterSpacing: 0, textTransform: 'uppercase' }}>{feature.eyebrow}</span> : null}
      <strong style={{ color: theme.text, fontSize: 30, fontWeight: 880, letterSpacing: 0, lineHeight: 1 }}>{feature.title}</strong>
      {feature.description ? <span style={{ color: theme.muted, fontSize: 19, fontWeight: 620, letterSpacing: 0, lineHeight: 1.28 }}>{feature.description}</span> : null}
      {feature.metric ? <span style={{ color: theme.accent, fontSize: 25, fontWeight: 900, letterSpacing: 0 }}>{feature.metric}</span> : null}
    </div>
  )
}

export function MetricCard({ metric, index, theme }: { metric: SaaSMetric; index: number; theme: SaaSTheme }) {
  const frame = useCurrentFrame()
  return (
    <div style={{ background: index === 0 ? theme.text : theme.panel, border: `1px solid ${index === 0 ? theme.text : theme.border}`, borderRadius: 26, color: index === 0 ? '#FFFFFF' : theme.text, display: 'grid', gap: 12, minHeight: 190, padding: 26, ...fadeSlide(frame, 18 + index * 9) }}>
      <span style={{ color: index === 0 ? 'rgba(255,255,255,0.68)' : theme.muted, fontSize: 19, fontWeight: 800, letterSpacing: 0 }}>{metric.label}</span>
      <strong style={{ fontSize: 58, fontWeight: 920, letterSpacing: 0, lineHeight: 0.92 }}>{metric.value}</strong>
      {metric.delta ? <span style={{ color: index === 0 ? '#A8F0C6' : theme.positive, fontSize: 22, fontWeight: 850, letterSpacing: 0 }}>{metric.delta}</span> : null}
    </div>
  )
}
