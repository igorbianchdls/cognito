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

function getShellTheme(themeName: string) {
  const themes: Record<string, { bg: string; border: string; iconBg: string; title: string; viewer: string }> = {
    light: { bg: '#f7f7f6', border: '#d9d9d6', iconBg: '#ececeb', title: '#1d1d1b', viewer: '#eeeeeb' },
    blue: { bg: '#e9f2ff', border: '#bfd4ff', iconBg: '#d3e3ff', title: '#102a56', viewer: '#dbe8ff' },
    dark: { bg: '#080808', border: '#1E1E1E', iconBg: '#1B1B1B', title: '#D8D8D8', viewer: '#121212' },
    black: { bg: '#020202', border: '#181818', iconBg: '#111111', title: '#f3f3f3', viewer: '#0d0d0d' },
    slate: { bg: '#111827', border: '#293548', iconBg: '#1b2435', title: '#dbe4f0', viewer: '#0f1724' },
    navy: { bg: '#081120', border: '#1a2d4f', iconBg: '#10203a', title: '#e5eefc', viewer: '#0b1426' },
    sand: { bg: '#f6f0e7', border: '#ded3c5', iconBg: '#ebe1d4', title: '#473426', viewer: '#efe6d8' },
    charcoal: { bg: '#151515', border: '#262626', iconBg: '#1f1f1f', title: '#ececec', viewer: '#101010' },
    midnight: { bg: '#050b16', border: '#162133', iconBg: '#0d1626', title: '#d9e7ff', viewer: '#08101c' },
    metro: { bg: '#111111', border: '#262626', iconBg: '#1b1b1b', title: '#ededed', viewer: '#171717' },
    aero: { bg: '#edf7fb', border: '#c6dde8', iconBg: '#deeff6', title: '#153a4d', viewer: '#dfeff6' },
  }

  return themes[themeName] || themes.dark
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
  const shellTheme = useMemo(() => getShellTheme(appliedThemeName), [appliedThemeName])

  return (
    <DataProvider initialData={{ ui: {}, filters: {}, dashboard: {} }}>
      <div className="flex h-screen flex-col tracking-[-0.03em] text-[#F2F3F4]" style={{ backgroundColor: shellTheme.bg }}>
        <header
          className="flex items-center justify-between border-b-[0.5px] px-5 py-3 backdrop-blur"
          style={{ backgroundColor: shellTheme.bg, borderColor: shellTheme.border }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center justify-center rounded-md p-2" style={{ backgroundColor: shellTheme.iconBg }}>
              <Icon icon="solar:widget-5-bold" className="h-4 w-4 text-[#FFFFFF]" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[16px] font-semibold" style={{ color: shellTheme.title }}>{rootName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-2 flex items-center gap-1 rounded-xl border-[0.5px] px-1 py-1" style={{ borderColor: shellTheme.border, backgroundColor: shellTheme.iconBg }}>
              <button
                type="button"
                onClick={() => setZoom((current) => Math.max(0.5, Number((current - 0.1).toFixed(2))))}
                className="flex items-center rounded-md p-2 text-[#FFFFFF] transition hover:text-[#FFFFFF]"
                style={{ backgroundColor: shellTheme.iconBg }}
              >
                <Icon icon="solar:minus-square-bold" className="h-3.5 w-3.5" />
                <span className="sr-only">Zoom menos</span>
              </button>
              <span className="min-w-[56px] text-center text-xs font-medium text-[#FFFFFF]">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((current) => Math.min(1.4, Number((current + 0.1).toFixed(2))))}
                className="flex items-center rounded-md p-2 text-[#FFFFFF] transition hover:text-[#FFFFFF]"
                style={{ backgroundColor: shellTheme.iconBg }}
              >
                <Icon icon="solar:add-square-bold" className="h-3.5 w-3.5" />
                <span className="sr-only">Zoom mais</span>
              </button>
            </div>
            <button type="button" className="flex items-center justify-center rounded-md p-2 text-[#FFFFFF] transition hover:text-[#FFFFFF]" style={{ backgroundColor: shellTheme.iconBg }}>
              <Icon icon="solar:chat-round-dots-bold" className="h-4 w-4" />
            </button>
            <button type="button" className="flex items-center justify-center rounded-md p-2 text-[#FFFFFF] transition hover:text-[#FFFFFF]" style={{ backgroundColor: shellTheme.iconBg }}>
              <Icon icon="solar:download-square-bold" className="h-4 w-4" />
            </button>
            <button type="button" className="flex items-center justify-center rounded-md p-2 text-[#FFFFFF] transition hover:text-[#FFFFFF]" style={{ backgroundColor: shellTheme.iconBg }}>
              <Icon icon="solar:playback-speed-bold" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftThemeName(appliedThemeName)
                setIsThemeModalOpen(true)
              }}
              className="flex items-center justify-center rounded-md px-2 py-[0.35rem] text-[14px] font-medium text-[#FFFFFF] transition hover:text-[#FFFFFF]"
              style={{ backgroundColor: shellTheme.iconBg }}
            >
              Tema
            </button>
            <button type="button" className="flex items-center justify-center rounded-md bg-[#039AFE] px-2 py-[0.35rem] text-[14px] font-medium text-[#FFFFFF] transition hover:bg-[#028ae0] hover:text-[#FFFFFF]">
              Exportar
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto border-r-[0.5px]" style={{ borderColor: shellTheme.border, backgroundColor: shellTheme.viewer }}>
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
