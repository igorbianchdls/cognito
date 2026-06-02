import type { CSSProperties, ReactNode } from 'react'

export type SaaSTheme = {
  accent: string
  accent2: string
  background: string
  border: string
  fontFamily: string
  muted: string
  panel: string
  positive: string
  text: string
}

export type SaaSBrand = {
  name: string
  tagline?: string
  mark?: string
  theme?: Partial<SaaSTheme>
}

export type SaaSMetric = {
  label: string
  value: string
  delta?: string
}

export type SaaSFeature = {
  title: string
  description?: string
  eyebrow?: string
  metric?: string
}

export type SaaSProductScreen = {
  title: string
  eyebrow?: string
  metric?: string
  accent?: string
  rows?: Array<Record<string, string>>
}

export type SaaSWorkflowStep = {
  title: string
  description?: string
  status?: string
}

export type SaaSLogo = {
  label: string
  mark?: string
}

export type SaaSSceneBase = {
  duration?: number
}

export type SaaSHeroScene = SaaSSceneBase & {
  type: 'hero'
  title: string
  subtitle?: string
  metrics?: SaaSMetric[]
  productScreens?: SaaSProductScreen[]
}

export type SaaSProblemScene = SaaSSceneBase & {
  type: 'problem'
  title: string
  subtitle?: string
  painPoints: string[]
}

export type SaaSProductTourScene = SaaSSceneBase & {
  type: 'product-tour'
  title: string
  subtitle?: string
  screens: SaaSProductScreen[]
}

export type SaaSWorkflowScene = SaaSSceneBase & {
  type: 'workflow'
  title: string
  subtitle?: string
  steps: SaaSWorkflowStep[]
}

export type SaaSIntegrationsScene = SaaSSceneBase & {
  type: 'integrations'
  title: string
  subtitle?: string
  logos: SaaSLogo[]
}

export type SaaSMetricsScene = SaaSSceneBase & {
  type: 'metrics'
  title: string
  subtitle?: string
  metrics: SaaSMetric[]
}

export type SaaSOutroScene = SaaSSceneBase & {
  type: 'outro'
  title: string
  subtitle?: string
  cta?: string
}

export type SaaSIntroScene =
  | SaaSHeroScene
  | SaaSProblemScene
  | SaaSProductTourScene
  | SaaSWorkflowScene
  | SaaSIntegrationsScene
  | SaaSMetricsScene
  | SaaSOutroScene

export type SaaSIntroVideoConfig = {
  brand: SaaSBrand
  scenes: SaaSIntroScene[]
}

export type SaaSComponentProps = {
  children?: ReactNode
  startFrame?: number
  style?: CSSProperties
  theme: SaaSTheme
}
