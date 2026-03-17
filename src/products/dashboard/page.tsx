'use client'

import { Icon } from '@iconify/react'
import { useMemo, useState } from 'react'

import { DataProvider } from '@/products/bi/json-render/context'
import { parseDashboardTemplateDslToTree } from '@/products/bi/json-render/parsers/dashboardTemplateDslParser'
import { registry } from '@/products/bi/json-render/registry'
import { Renderer } from '@/products/bi/json-render/renderer'
import { APPS_THEME_OPTIONS } from '@/products/bi/shared/themeOptions'
import { APPS_VENDAS_TEMPLATE_DSL } from '@/products/bi/shared/templates/appsVendasTemplate'
import { buildDashboardCodeFiles } from '@/products/dashboard/code-files'
import { DashboardCodeEditorPane } from '@/products/dashboard/code-editor-pane'
import { DashboardCodeFileTree } from '@/products/dashboard/code-file-tree'
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

function applyThemeToDsl(dsl: string, themeName: string) {
  return dsl.replace(/<Theme\s+name="[^"]+"/, `<Theme name="${themeName}"`)
}

function DashboardCanvas({ tree, zoom }: { tree: any; zoom: number }) {
  return (
    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
      <div className="min-w-[1120px] overflow-hidden rounded-none bg-white p-0 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
        <Renderer tree={tree} registry={registry} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [draftThemeName, setDraftThemeName] = useState('dark')
  const [appliedThemeName, setAppliedThemeName] = useState('dark')
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview')
  const [selectedCodePath, setSelectedCodePath] = useState('app/dashboard-vendas.dsl')
  const [selectedDashboardPath, setSelectedDashboardPath] = useState('app/dashboard-vendas.dsl')
  const [zoom, setZoom] = useState(1)
  const baseDsl = useMemo(() => applyThemeToDsl(APPS_VENDAS_TEMPLATE_DSL, appliedThemeName), [appliedThemeName])
  const codeFiles = useMemo(() => buildDashboardCodeFiles(baseDsl, appliedThemeName), [baseDsl, appliedThemeName])
  const selectedDashboardFile = useMemo(
    () => codeFiles.find((file) => file.path === selectedDashboardPath && file.extension === 'dsl') ?? codeFiles[0],
    [codeFiles, selectedDashboardPath],
  )
  const themedDsl = selectedDashboardFile?.content ?? baseDsl
  const parsed = useMemo(() => parseDashboardTemplateDslToTree(themedDsl), [themedDsl])
  const rootName = useMemo(() => getDashboardTitle(parsed), [parsed])
  const dashboardFiles = useMemo(() => codeFiles.filter((file) => file.extension === 'dsl'), [codeFiles])
  const selectedCodeFile = useMemo(
    () => codeFiles.find((file) => file.path === selectedCodePath) ?? codeFiles[0],
    [codeFiles, selectedCodePath],
  )

  return (
    <DataProvider initialData={{ ui: {}, filters: {}, dashboard: {} }}>
      <div className="flex h-screen flex-col bg-[#F7F7F6] tracking-[-0.03em] text-[#3F3F3D]">
        <header className="flex items-center justify-between border-b-[0.5px] border-[#DDDDD8] bg-[#F7F7F6] px-5 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2">
              <Icon icon="solar:widget-5-bold" className="h-4 w-4 text-[#5F5F5A]" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[16px] font-semibold text-[#1F1F1D]">{rootName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-1 flex items-center gap-1 rounded-xl border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-0">
              <button
                type="button"
                onClick={() => setActiveView('preview')}
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
                onClick={() => setActiveView('code')}
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
                onClick={() => setZoom((current) => Math.max(0.5, Number((current - 0.1).toFixed(2))))}
                className="m-[1px] flex items-center rounded-md bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
              >
                <Icon icon="solar:minus-square-bold" className="h-3.5 w-3.5" />
                <span className="sr-only">Zoom menos</span>
              </button>
              <span className="min-w-[56px] text-center text-xs font-medium text-[#5F5F5A] leading-normal">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((current) => Math.min(1.4, Number((current + 0.1).toFixed(2))))}
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
              onClick={() => {
                setDraftThemeName(appliedThemeName)
                setIsThemeModalOpen(true)
              }}
              className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-2 py-[0.35rem] text-[14px] font-medium text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
            >
              Tema
            </button>
            <button type="button" className="flex items-center justify-center rounded-md bg-[#039AFE] px-2 py-[0.35rem] text-[14px] font-medium text-[#FFFFFF] transition hover:bg-[#028ae0] hover:text-[#FFFFFF]">
              Exportar
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto border-r-[0.5px] border-[#DDDDD8] bg-[#EEEEEB]">
          {activeView === 'preview' ? (
            <div className="mx-auto flex min-h-full items-start justify-center p-0">
              <DashboardCanvas tree={parsed} zoom={zoom} />
            </div>
          ) : (
            <div className="flex min-h-full w-full">
              <DashboardCodeFileTree
                files={codeFiles}
                selectedPath={selectedCodeFile?.path ?? 'app/dashboard-vendas.dsl'}
                onSelect={setSelectedCodePath}
              />
              <DashboardCodeEditorPane
                file={selectedCodeFile}
                dashboardFiles={dashboardFiles}
                selectedDashboardPath={selectedDashboardPath}
                onSelectDashboard={(path) => {
                  setSelectedDashboardPath(path)
                  setSelectedCodePath(path)
                }}
              />
            </div>
          )}
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
