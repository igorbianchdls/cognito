'use client'

import React from 'react'
import type { Layout } from 'react-grid-layout'

export type DashboardStructuralDrag = {
  panelId: string
  panelPath: number[]
  span: number
} | null

export type DashboardLayoutDropTargetType = 'vertical' | 'horizontal'

export type DashboardLayoutEditContextValue = {
  enabled: boolean
  structuralDrag: DashboardStructuralDrag
  hoverTargetKey: string | null
  startStructuralDrag: (drag: NonNullable<DashboardStructuralDrag>) => void
  endStructuralDrag: () => void
  setHoverTargetKey: (key: string | null) => void
  movePanelToContainer: (targetPath: number[], targetType: DashboardLayoutDropTargetType) => void
  applyPanelLayout: (nextLayout: Layout[]) => void
}

const noop = () => {}

export const DashboardLayoutEditContext = React.createContext<DashboardLayoutEditContextValue>({
  enabled: false,
  structuralDrag: null,
  hoverTargetKey: null,
  startStructuralDrag: noop,
  endStructuralDrag: noop,
  setHoverTargetKey: noop,
  movePanelToContainer: noop,
  applyPanelLayout: noop,
})
