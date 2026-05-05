'use client'

import { Icon } from '@iconify/react'
import type { ReactNode } from 'react'

import { ArtifactViewModeToggle } from '@/products/artifacts/core/workspace/components/ArtifactViewModeToggle'
import { ArtifactZoomControls } from '@/products/artifacts/core/workspace/components/ArtifactZoomControls'

export function ArtifactWorkspaceHeader({
  title,
  activeView,
  zoom,
  onChangeView,
  onZoomChange,
  onOpenTheme,
  titleIcon = 'solar:widget-5-bold',
  leadingActions,
  extraActions,
  showChromeActions = true,
  showThemeAction = true,
  primaryActionLabel = 'Exportar',
}: {
  title: string
  activeView: 'preview' | 'code'
  zoom: number
  onChangeView: (view: 'preview' | 'code') => void
  onZoomChange: (zoom: number) => void
  onOpenTheme?: () => void
  titleIcon?: string
  leadingActions?: ReactNode
  extraActions?: ReactNode
  showChromeActions?: boolean
  showThemeAction?: boolean
  primaryActionLabel?: string
}) {
  return (
    <header className="flex items-center justify-between border-b-[0.5px] border-[#DDDDD8] bg-[#F7F7F6] px-5 py-3 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        {leadingActions}
        <div className="flex shrink-0 items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2">
          <Icon icon={titleIcon} className="h-4 w-4 text-[#5F5F5A]" />
        </div>
        <div className="min-w-0">
          <div
            className="truncate text-[16px] font-semibold text-[#1F1F1D]"
            style={{ fontFamily: 'var(--font-eb-garamond), "EB Garamond", serif' }}
          >
            {title}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ArtifactViewModeToggle activeView={activeView} previewLabel="Visualizar dashboard" onChange={onChangeView} />
        <ArtifactZoomControls
          zoom={zoom}
          onDecrease={() => onZoomChange(Math.max(0.5, Number((zoom - 0.1).toFixed(2))))}
          onIncrease={() => onZoomChange(Math.min(1.4, Number((zoom + 0.1).toFixed(2))))}
        />
        {extraActions}
        {showChromeActions ? (
          <>
            <button type="button" className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]">
              <Icon icon="solar:download-square-bold" className="h-4 w-4" />
            </button>
            <button type="button" className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]">
              <Icon icon="solar:playback-speed-bold" className="h-4 w-4" />
            </button>
            {showThemeAction && onOpenTheme ? (
              <button
                type="button"
                onClick={onOpenTheme}
                className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-2 py-[0.35rem] text-[14px] font-medium text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
              >
                Tema
              </button>
            ) : null}
            <button type="button" className="flex items-center justify-center rounded-md bg-[#039AFE] px-2 py-[0.35rem] text-[14px] font-medium text-[#FFFFFF] transition hover:bg-[#028ae0] hover:text-[#FFFFFF]">
              {primaryActionLabel}
            </button>
          </>
        ) : null}
      </div>
    </header>
  )
}
