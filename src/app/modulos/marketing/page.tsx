'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusHeader from '@/components/navigation/nexus/NexusHeader'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import DataToolbar from '@/components/modulos/DataToolbar'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { Megaphone, FileText, BarChart3 } from 'lucide-react'
import PlataformaEditorSheet from '@/components/modulos/marketing/PlataformaEditorSheet'

type Row = TableData

export default function ModulosMarketingPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Marketing',
      subtitle: 'Selecione uma opção para visualizar os dados'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'contas', label: 'Contas' },
        { value: 'publicacoes', label: 'Publicações' },
        { value: 'metricas', label: 'Métricas' },
      ],
      selected: 'contas',
    })
  }, [])

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    return name
  }

  const [data, setData] = useState<Row[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>()
  const [reloadKey, setReloadKey] = useState(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)

  // Editor de plataforma (contas)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorContaId, setEditorContaId] = useState<string | number | null>(null)
  const [editorPrefill, setEditorPrefill] = useState<{ plataforma?: string; imagem_url?: string } | undefined>(undefined)

  const openPlataformaEditor = (row: Row) => {
    const id = row['id'] as string | number | undefined
    if (!id) return
    setEditorContaId(id)
    setEditorPrefill({
      plataforma: row['plataforma'] ? String(row['plataforma']) : undefined,
      imagem_url: row['plataforma_imagem_url'] ? String(row['plataforma_imagem_url']) : undefined,
    })
    setEditorOpen(true)
  }

  const formatDate = (value?: unknown) => {
    if (!value) return ''
    try {
      const d = new Date(String(value))
      if (isNaN(d.getTime())) return String(value)
      return d.toLocaleDateString('pt-BR')
    } catch {
      return String(value)
    }
  }

  const getColorFromName = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    const colors = [
      { bg: '#DBEAFE', text: '#1E40AF' },
      { bg: '#DCFCE7', text: '#15803D' },
      { bg: '#FEF3C7', text: '#B45309' },
      { bg: '#FCE7F3', text: '#BE185D' },
      { bg: '#E0E7FF', text: '#4338CA' },
      { bg: '#FED7AA', text: '#C2410C' },
      { bg: '#E9D5FF', text: '#7C3AED' },
      { bg: '#D1FAE5', text: '#047857' },
    ]

    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'contas':
        return [
          {
            accessorKey: 'plataforma',
            header: 'Plataforma',
            cell: ({ row }) => {
              const nome = row.original['plataforma'] || 'Sem nome'
              const imagemUrl = row.original['plataforma_imagem_url']
              const colors = getColorFromName(String(nome))

              return (
                <div className="flex items-center">
                  <div
                    className="flex items-center justify-center mr-3 cursor-pointer"
                    role="button"
                    onClick={() => openPlataformaEditor(row.original)}
                    style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: imagemUrl ? 'transparent' : colors.bg }}>
                    {imagemUrl ? (
                      <img src={String(imagemUrl)} alt={String(nome)} className="w-full h-full object-cover" />
                    ) : (
                      <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
                        {String(nome)?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openPlataformaEditor(row.original)}
                    className="text-left"
                    style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}
                  >
                    {String(nome)}
                  </button>
                </div>
              )
            }
          },
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'seguidores', header: 'Seguidores' },
          { accessorKey: 'seguindo', header: 'Seguindo' },
          { accessorKey: 'total_publicacoes', header: 'Total de Publicações' },
          { accessorKey: 'taxa_engajamento', header: 'Engajamento (%)' },
          { accessorKey: 'registrado_em', header: 'Registrado em', cell: ({ row }) => formatDate(row.original['registrado_em']) },
        ]
      case 'publicacoes':
        return [
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'titulo', header: 'Título' },
          { accessorKey: 'tipo', header: 'Tipo de Post' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'legenda', header: 'Legenda' },
          { accessorKey: 'hashtags', header: 'Hashtags' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'metricas':
      default:
        return [
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'titulo', header: 'Título' },
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'curtidas', header: 'Curtidas' },
          { accessorKey: 'comentarios', header: 'Comentários' },
          { accessorKey: 'compartilhamentos', header: 'Compartilhamentos' },
          { accessorKey: 'visualizacoes', header: 'Visualizações' },
          { accessorKey: 'impressoes', header: 'Impressões' },
          { accessorKey: 'taxa_engajamento', header: 'Taxa de Engajamento (%)' },
          { accessorKey: 'ultimo_registro', header: 'Último Registro', cell: ({ row }) => formatDate(row.original['ultimo_registro']) },
        ]
    }
  }, [tabs.selected])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('view', tabs.selected)
        if (dateRange?.from) {
          const d = dateRange.from
          params.set('de', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
        }
        if (dateRange?.to) {
          const d = dateRange.to
          params.set('ate', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
        }
        if (tabs.selected !== 'metricas') {
          params.set('page', String(page))
          params.set('pageSize', String(pageSize))
        }
        const url = `/api/modulos/marketing?${params.toString()}`
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const rows = (json?.rows || []) as Row[]
        setData(Array.isArray(rows) ? rows : [])
        setTotal(Number(json?.total ?? rows.length) || 0)
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          setError(e instanceof Error ? e.message : 'Falha ao carregar dados')
          setData([])
          setTotal(0)
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [tabs.selected, dateRange?.from, dateRange?.to, page, pageSize, reloadKey])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'contas':
          return <Megaphone className="h-4 w-4" />
        case 'publicacoes':
          return <FileText className="h-4 w-4" />
        case 'metricas':
          return <BarChart3 className="h-4 w-4" />
        default:
          return null
      }
    }
    return tabs.options.map((opt) => ({ ...opt, icon: iconFor(opt.value) })) as Opcao[]
  }, [tabs.options])

  // Reset page on tab change
  useEffect(() => { setPage(1) }, [tabs.selected])

  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#fdfdfd' }}>
          <div className="flex flex-col h-full w-full">
            <NexusHeader viewMode={'dashboard'} onChangeViewMode={() => {}} borderless size="sm" showBreadcrumb={false} />
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2" data-page="nexus">
              <NexusPageContainer className="h-full">
          <div style={{ marginBottom: layout.mbTitle }}>
            <PageHeader
              title={titulo.title}
              subtitle={titulo.subtitle}
              titleFontFamily={fontVar(titulo.titleFontFamily)}
              titleFontSize={titulo.titleFontSize}
              titleFontWeight={titulo.titleFontWeight}
              titleColor={titulo.titleColor}
              titleLetterSpacing={titulo.titleLetterSpacing}
              subtitleFontFamily={fontVar(titulo.subtitleFontFamily)}
              subtitleLetterSpacing={titulo.subtitleLetterSpacing}
            />
          </div>
          <div style={{ marginBottom: 0 }}>
            <TabsNav
              options={tabOptions}
              value={tabs.selected}
              onValueChange={(v) => moduleUiActions.setTabs({ selected: v })}
              fontFamily={fontVar(tabs.fontFamily)}
              fontSize={tabs.fontSize}
              fontWeight={tabs.fontWeight}
              color={tabs.color}
              letterSpacing={tabs.letterSpacing}
              iconSize={tabs.iconSize}
              labelOffsetY={tabs.labelOffsetY}
              startOffset={tabs.leftOffset}
              activeColor={tabs.activeColor}
              activeFontWeight={tabs.activeFontWeight}
              activeBorderColor={tabs.activeBorderColor}
              className="px-0 md:px-0"
            />
          </div>
                <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
          <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
            <DataToolbar
              from={(tabs.selected !== 'metricas' ? total : data.length) === 0 ? 0 : (page - 1) * pageSize + 1}
              to={(tabs.selected !== 'metricas' ? total : data.length) === 0 ? 0 : Math.min(page * pageSize, (tabs.selected !== 'metricas' ? total : data.length))}
              total={tabs.selected !== 'metricas' ? total : data.length}
              fontFamily={fontVar(toolbarUI.fontFamily)}
              fontSize={toolbarUI.fontSize}
              fontWeight={toolbarUI.fontWeight}
              fontColor={toolbarUI.fontColor}
              letterSpacing={toolbarUI.letterSpacing}
              borderBottomWidth={toolbarUI.borderBottomWidth}
              borderBottomColor={toolbarUI.borderBottomColor}
              borderDistanceTop={toolbarUI.borderDistanceTop}
              underlineColor={toolbarUI.underlineColor}
              underlineWidth={toolbarUI.underlineWidth}
              underlineOffsetTop={toolbarUI.underlineOffsetTop}
              iconGap={toolbarUI.iconGap}
              iconColor={toolbarUI.iconColor}
              iconSize={toolbarUI.iconSize}
              searchWidth={toolbarUI.searchWidth}
              dateRangeWidth={toolbarUI.dateRangeWidth}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-auto" style={{ marginBottom: layout.mbTable }}>
            <div className="border-y bg-background" style={{ borderColor: tabelaUI.borderColor }}>
              {isLoading ? (
                <div className="p-6 text-sm text-gray-500">Carregando dados…</div>
              ) : error ? (
                <div className="p-6 text-sm text-red-600">Erro ao carregar: {error}</div>
              ) : (
                <DataTable
                  key={tabs.selected}
                  columns={columns}
                  data={data}
                  enableSearch={tabelaUI.enableSearch}
                  showColumnToggle={tabelaUI.enableColumnToggle}
                  showPagination={tabelaUI.showPagination}
                  pageSize={pageSize}
                  pageIndex={tabs.selected !== 'metricas' ? page - 1 : undefined}
                  serverSidePagination={tabs.selected !== 'metricas'}
                  serverTotalRows={tabs.selected !== 'metricas' ? total : undefined}
                  headerBackground={tabelaUI.headerBg}
                  headerTextColor={tabelaUI.headerText}
                  cellTextColor={tabelaUI.cellText}
                  headerFontSize={tabelaUI.headerFontSize}
                  headerFontFamily={fontVar(tabelaUI.headerFontFamily)}
                  headerFontWeight={tabelaUI.headerFontWeight}
                  headerLetterSpacing={tabelaUI.headerLetterSpacing}
                  cellFontSize={tabelaUI.cellFontSize}
                  cellFontFamily={fontVar(tabelaUI.cellFontFamily)}
                  cellFontWeight={tabelaUI.cellFontWeight}
                  cellLetterSpacing={tabelaUI.cellLetterSpacing}
                  enableZebraStripes={tabelaUI.enableZebraStripes}
                  rowAlternateBgColor={tabelaUI.rowAlternateBgColor}
                  borderColor={tabelaUI.borderColor}
                  borderWidth={tabelaUI.borderWidth}
                  selectionColumnWidth={tabelaUI.selectionColumnWidth}
                  enableRowSelection={tabelaUI.enableRowSelection}
                  selectionMode={tabelaUI.selectionMode}
                  defaultSortColumn={tabelaUI.defaultSortColumn}
                  defaultSortDirection={tabelaUI.defaultSortDirection}
                  onPaginationChange={({ pageIndex, pageSize: newSize }) => {
                    setPage(pageIndex + 1)
                    setPageSize(newSize)
                  }}
                />
              )}
            </div>
          </div>
                </div>
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
      <PlataformaEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        contaId={editorContaId}
        prefill={editorPrefill}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </SidebarProvider>
  )
}
