'use client'

import { Icon } from '@iconify/react'
import { useMemo, useState } from 'react'

import { DataProvider } from '@/products/bi/json-render/context'
import { parseDashboardTemplateDslToTree } from '@/products/bi/json-render/parsers/dashboardTemplateDslParser'
import { registry } from '@/products/bi/json-render/registry'
import { Renderer } from '@/products/bi/json-render/renderer'
import { ThemeProvider } from '@/products/bi/json-render/theme/ThemeContext'
import { buildThemeVars } from '@/products/bi/json-render/theme/themeAdapter'
import { APPS_THEME_OPTIONS } from '@/products/bi/shared/themeOptions'
import { APPS_VENDAS_TEMPLATE_DSL } from '@/products/bi/shared/templates/appsVendasTemplate'
import { DashboardThemeModal } from '@/products/dashboard/theme-modal'

type AnyRecord = Record<string, any>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getDashboardTitle(tree: unknown) {
  if (!isRecord(tree) || String(tree.type || '').trim() !== 'DashboardTemplate') return 'Dashboard'
  const props = isRecord(tree.props) ? (tree.props as AnyRecord) : {}
  const title = typeof props.title === 'string' && props.title.trim() ? props.title.trim() : ''
  const name = typeof props.name === 'string' && props.name.trim() ? props.name.trim() : ''
  return title || name || 'Dashboard'
}

function applyThemeToTree(tree: any, themeName: string) {
  if (!tree || !Array.isArray(tree.children)) return tree

  const children = tree.children.map((child: any) => {
    if (!child || child.type !== 'Theme') return child
    return {
      ...child,
      props: {
        ...(child.props || {}),
        name: themeName,
      },
    }
  })

  return {
    ...tree,
    children,
  }
}

function DashboardCanvas({ tree, zoom, themeName }: { tree: any; zoom: number; themeName: string }) {
  const themeVars = useMemo(() => buildThemeVars(themeName), [themeName])

  return (
    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
      <div className="min-w-[1120px] overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
        <ThemeProvider name={themeName} cssVars={themeVars.cssVars}>
          <Renderer tree={tree} registry={registry} />
        </ThemeProvider>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const parsed = useMemo(() => parseDashboardTemplateDslToTree(APPS_VENDAS_TEMPLATE_DSL), [])
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [draftThemeName, setDraftThemeName] = useState('dark')
  const [appliedThemeName, setAppliedThemeName] = useState('dark')
  const [zoom, setZoom] = useState(0.82)
  const themedTree = useMemo(() => applyThemeToTree(parsed, appliedThemeName), [parsed, appliedThemeName])
  const rootName = useMemo(() => getDashboardTitle(themedTree), [themedTree])

  return (
    <DataProvider initialData={{ ui: {}, filters: {}, dashboard: {} }}>
      <div className="flex h-screen flex-col bg-[#080808] tracking-[-0.03em] text-[#F2F3F4]">
        <header className="flex items-center justify-between border-b-[0.5px] border-[#1E1E1E] bg-[#080808] px-5 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center justify-center rounded-md bg-[#1B1B1B] p-2">
              <Icon icon="solar:widget-5-bold" className="h-4 w-4 text-[#FFFFFF]" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[16px] font-semibold text-[#D8D8D8]">{rootName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-2 flex items-center gap-1 rounded-xl border-[0.5px] border-[#1E1E1E] bg-[#1B1B1B] px-1 py-1">
              <button
                type="button"
                onClick={() => setZoom((current) => Math.max(0.5, Number((current - 0.1).toFixed(2))))}
                className="flex items-center rounded-md bg-[#1B1B1B] p-2 text-[#FFFFFF] transition hover:bg-[#262626] hover:text-[#FFFFFF]"
              >
                <Icon icon="solar:minus-square-bold" className="h-3.5 w-3.5" />
                <span className="sr-only">Zoom menos</span>
              </button>
              <span className="min-w-[56px] text-center text-xs font-medium text-[#FFFFFF]">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((current) => Math.min(1.4, Number((current + 0.1).toFixed(2))))}
                className="flex items-center rounded-md bg-[#1B1B1B] p-2 text-[#FFFFFF] transition hover:bg-[#262626] hover:text-[#FFFFFF]"
              >
                <Icon icon="solar:add-square-bold" className="h-3.5 w-3.5" />
                <span className="sr-only">Zoom mais</span>
              </button>
            </div>
            <button type="button" className="flex items-center justify-center rounded-md bg-[#1B1B1B] p-2 text-[#FFFFFF] transition hover:bg-[#262626] hover:text-[#FFFFFF]">
              <Icon icon="solar:chat-round-dots-bold" className="h-4 w-4" />
            </button>
            <button type="button" className="flex items-center justify-center rounded-md bg-[#1B1B1B] p-2 text-[#FFFFFF] transition hover:bg-[#262626] hover:text-[#FFFFFF]">
              <Icon icon="solar:download-square-bold" className="h-4 w-4" />
            </button>
            <button type="button" className="flex items-center justify-center rounded-md bg-[#1B1B1B] p-2 text-[#FFFFFF] transition hover:bg-[#262626] hover:text-[#FFFFFF]">
              <Icon icon="solar:playback-speed-bold" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftThemeName(appliedThemeName)
                setIsThemeModalOpen(true)
              }}
              className="flex items-center justify-center rounded-md bg-[#1B1B1B] px-2 py-[0.35rem] text-[14px] font-medium text-[#FFFFFF] transition hover:bg-[#262626] hover:text-[#FFFFFF]"
            >
              Tema
            </button>
            <button type="button" className="flex items-center justify-center rounded-md bg-[#039AFE] px-2 py-[0.35rem] text-[14px] font-medium text-[#FFFFFF] transition hover:bg-[#028ae0] hover:text-[#FFFFFF]">
              Exportar
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto border-r-[0.5px] border-[#1E1E1E] bg-[#121212]">
          <div className="mx-auto flex min-h-full items-start justify-center p-8">
            <DashboardCanvas tree={themedTree} zoom={zoom} themeName={appliedThemeName} />
          </div>
        </main>
        <DashboardThemeModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          onConfirm={() => {
            setAppliedThemeName(draftThemeName)
            setIsThemeModalOpen(false)
          }}
          onSelect={setDraftThemeName}
          selectedTheme={draftThemeName}
          themes={APPS_THEME_OPTIONS}
        />
      </div>
    </DataProvider>
  )
}
