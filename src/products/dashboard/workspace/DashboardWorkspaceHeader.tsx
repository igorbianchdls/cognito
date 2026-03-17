'use client'

import { Icon } from '@iconify/react'

export function DashboardWorkspaceHeader({
  title,
  activeView,
  zoom,
  onChangeView,
  onZoomChange,
  onOpenTheme,
}: {
  title: string
  activeView: 'preview' | 'code'
  zoom: number
  onChangeView: (view: 'preview' | 'code') => void
  onZoomChange: (zoom: number) => void
  onOpenTheme: () => void
}) {
  return (
    <header className="flex items-center justify-between border-b-[0.5px] border-[#DDDDD8] bg-[#F7F7F6] px-5 py-3 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex shrink-0 items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2">
          <Icon icon="solar:widget-5-bold" className="h-4 w-4 text-[#5F5F5A]" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[16px] font-semibold text-[#1F1F1D]">{title}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="mr-1 flex items-center gap-1 rounded-xl border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-0">
          <button
            type="button"
            onClick={() => onChangeView('preview')}
            className={`m-[1px] flex items-center justify-center rounded-md p-2 transition ${
              activeView === 'preview'
                ? 'bg-white text-[#1F1F1D]'
                : 'bg-[#ECECEB] text-[#5F5F5A] hover:bg-[#E2E2E0] hover:text-[#4F4F4B]'
            }`}
          >
            <Icon icon="solar:eye-bold" className="h-4 w-4" />
            <span className="sr-only">Visualizar dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeView('code')}
            className={`m-[1px] flex items-center justify-center rounded-md p-2 transition ${
              activeView === 'code'
                ? 'bg-white text-[#1F1F1D]'
                : 'bg-[#ECECEB] text-[#5F5F5A] hover:bg-[#E2E2E0] hover:text-[#4F4F4B]'
            }`}
          >
            <Icon icon="solar:code-bold" className="h-4 w-4" />
            <span className="sr-only">Visualizar DSL</span>
          </button>
        </div>
        <div className="mr-2 flex items-center gap-1 rounded-xl border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-0">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.5, Number((zoom - 0.1).toFixed(2))))}
            className="m-[1px] flex items-center rounded-md bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
          >
            <Icon icon="solar:minus-square-bold" className="h-3.5 w-3.5" />
            <span className="sr-only">Zoom menos</span>
          </button>
          <span className="min-w-[56px] text-center text-xs font-medium text-[#5F5F5A] leading-normal">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(1.4, Number((zoom + 0.1).toFixed(2))))}
            className="m-[1px] flex items-center rounded-md bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
          >
            <Icon icon="solar:add-square-bold" className="h-3.5 w-3.5" />
            <span className="sr-only">Zoom mais</span>
          </button>
        </div>
        <button type="button" className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]">
          <Icon icon="solar:download-square-bold" className="h-4 w-4" />
        </button>
        <button type="button" className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]">
          <Icon icon="solar:playback-speed-bold" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onOpenTheme}
          className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-2 py-[0.35rem] text-[14px] font-medium text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
        >
          Tema
        </button>
        <button type="button" className="flex items-center justify-center rounded-md bg-[#039AFE] px-2 py-[0.35rem] text-[14px] font-medium text-[#FFFFFF] transition hover:bg-[#028ae0] hover:text-[#FFFFFF]">
          Exportar
        </button>
      </div>
    </header>
  )
}
