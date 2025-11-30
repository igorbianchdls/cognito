"use client"

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusHeader from '@/components/nexus/NexusHeader'
import NexusPageContainer from '@/components/nexus/NexusPageContainer'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import DataToolbar from '@/components/modulos/DataToolbar'
import DataTable, { type TableData } from '@/components/widgets/Table'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import { List, Building2, Tag, FileText, Globe, MapPin, Flag, CheckCircle2, BookOpen, Briefcase } from 'lucide-react'
import IconLabelHeader from '@/components/widgets/IconLabelHeader'
import { Button } from '@/components/ui/button'

import CadastroEmpresaSheet from '@/components/empresa/CadastroEmpresaSheet'
import CadastroFilialSheet from '@/components/empresa/CadastroFilialSheet'
import CadastroDepartamentoSheet from '@/components/empresa/CadastroDepartamentoSheet'
import CadastroCargoSheet from '@/components/empresa/CadastroCargoSheet'

type Row = TableData

export default function ModulosEmpresaPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)
  const [data, setData] = useState<Row[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    return name
  }

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Empresa',
      subtitle: 'Selecione uma opção para visualizar os dados'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'dados', label: 'Dados Cadastrais' },
        { value: 'filiais', label: 'Filiais' },
        { value: 'departamentos', label: 'Departamentos' },
        { value: 'cargos', label: 'Cargos' },
      ],
      selected: 'dados',
    })
  }, [])

  const iconFor = (v: string) => <List className="h-4 w-4" />
  const tabOptions: Opcao[] = useMemo(() => (tabs.options.map((opt) => ({ ...opt, icon: iconFor(opt.value) })) as Opcao[]), [tabs.options])

  const formatDate = (value?: unknown) => {
    if (!value) return ''
    try {
      const d = new Date(String(value))
      if (isNaN(d.getTime())) return String(value)
      return d.toLocaleDateString('pt-BR')
    } catch { return String(value) }
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'dados':
        return [
          { accessorKey: 'razao_social', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Razão Social" /> },
          { accessorKey: 'nome_fantasia', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Nome Fantasia" /> },
          { accessorKey: 'cnpj', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="CNPJ" /> },
          { accessorKey: 'inscricao_estadual', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Inscrição Estadual" /> },
          { accessorKey: 'regime_tributario', header: () => <IconLabelHeader icon={<BookOpen className="h-3.5 w-3.5" />} label="Regime Tributário" /> },
          { accessorKey: 'endereco', header: () => <IconLabelHeader icon={<MapPin className="h-3.5 w-3.5" />} label="Endereço" /> },
          { accessorKey: 'cidade', header: () => <IconLabelHeader icon={<MapPin className="h-3.5 w-3.5" />} label="Cidade" /> },
          { accessorKey: 'estado', header: () => <IconLabelHeader icon={<Flag className="h-3.5 w-3.5" />} label="Estado" /> },
          { accessorKey: 'pais', header: () => <IconLabelHeader icon={<Globe className="h-3.5 w-3.5" />} label="País" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
        ]
      case 'filiais':
        return [
          { accessorKey: 'codigo', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Código" /> },
          { accessorKey: 'nome', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Nome" /> },
          { accessorKey: 'cnpj', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="CNPJ" /> },
          { accessorKey: 'inscricao_estadual', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Inscrição Estadual" /> },
          { accessorKey: 'endereco', header: () => <IconLabelHeader icon={<MapPin className="h-3.5 w-3.5" />} label="Endereço" /> },
          { accessorKey: 'cidade', header: () => <IconLabelHeader icon={<MapPin className="h-3.5 w-3.5" />} label="Cidade" /> },
          { accessorKey: 'estado', header: () => <IconLabelHeader icon={<Flag className="h-3.5 w-3.5" />} label="Estado" /> },
          { accessorKey: 'pais', header: () => <IconLabelHeader icon={<Globe className="h-3.5 w-3.5" />} label="País" /> },
          { accessorKey: 'matriz', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Matriz" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
        ]
      case 'departamentos':
        return [
          { accessorKey: 'codigo', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Código" /> },
          { accessorKey: 'nome', header: () => <IconLabelHeader icon={<Briefcase className="h-3.5 w-3.5" />} label="Nome" /> },
          { accessorKey: 'responsavel', header: () => <IconLabelHeader icon={<Briefcase className="h-3.5 w-3.5" />} label="Responsável" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
        ]
      case 'cargos':
      default:
        return [
          { accessorKey: 'codigo', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Código" /> },
          { accessorKey: 'nome', header: () => <IconLabelHeader icon={<Briefcase className="h-3.5 w-3.5" />} label="Nome" /> },
          { accessorKey: 'nivel', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Nível" /> },
          { accessorKey: 'descricao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
        ]
    }
  }, [tabs.selected])

  // Reset page when tab changes
  useEffect(() => { setPage(1) }, [tabs.selected])

  // Server-side fetch per tab
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('view', tabs.selected)
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        const url = `/api/modulos/empresa?${params.toString()}`
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
  }, [tabs.selected, page, pageSize, refreshKey])

  // Carrega dados conforme a tab selecionada
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('view', tabs.selected)
        const url = `/api/modulos/empresa?${params.toString()}`
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const rows = (json?.rows || []) as Row[]
        setData(Array.isArray(rows) ? rows : [])
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          setError(e instanceof Error ? e.message : 'Falha ao carregar dados')
          setData([])
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [tabs.selected, refreshKey])

  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#fdfdfd' }}>
          <div className="flex flex-col h-full w-full">
            <NexusHeader viewMode={'dashboard'} onChangeViewMode={() => {}} borderless size="sm" showBreadcrumb={false} />
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2" data-page="nexus">
              <NexusPageContainer className="h-full">
        <div style={{ background: 'white' }}>
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
              subtitleFontSize={titulo.subtitleFontSize}
              subtitleFontWeight={titulo.subtitleFontWeight}
              subtitleColor={titulo.subtitleColor}
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
        </div>
        <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
          <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
            <DataToolbar
              from={total === 0 ? 0 : (page - 1) * pageSize + 1}
              to={total === 0 ? 0 : Math.min(page * pageSize, total)}
              total={total}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              fontFamily={fontVar(tabs.fontFamily)}
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
              actionComponent={
                tabs.selected === 'dados' ? (
                  <CadastroEmpresaSheet
                    triggerLabel="Cadastrar"
                    onCreated={() => setRefreshKey((k) => k + 1)}
                  />
                ) : tabs.selected === 'filiais' ? (
                  <CadastroFilialSheet
                    triggerLabel="Cadastrar"
                    onCreated={() => setRefreshKey((k) => k + 1)}
                  />
                ) : tabs.selected === 'departamentos' ? (
                  <CadastroDepartamentoSheet
                    triggerLabel="Cadastrar"
                    onCreated={() => setRefreshKey((k) => k + 1)}
                  />
                ) : tabs.selected === 'cargos' ? (
                  <CadastroCargoSheet
                    triggerLabel="Cadastrar"
                    onCreated={() => setRefreshKey((k) => k + 1)}
                  />
                ) : undefined
              }
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
                  columnOptions={{
                    // Dados cadastrais
                    razao_social: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 160 },
                    nome_fantasia: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 160 },
                    regime_tributario: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 160 },
                    endereco: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 180 },
                    cidade: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    estado: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    pais: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    // Filiais / Departamentos / Cargos
                    nome: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 160 },
                    responsavel: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 160 },
                    descricao: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 180 },
                  }}
                  enableSearch={tabelaUI.enableSearch}
                  showColumnToggle={tabelaUI.enableColumnToggle}
                  showPagination={tabelaUI.showPagination}
                  pageSize={pageSize}
                  pageIndex={page - 1}
                  serverSidePagination
                  serverTotalRows={total}
                  headerBackground={tabelaUI.headerBg}
                  headerTextColor={tabelaUI.headerText}
                  cellTextColor={tabelaUI.cellText}
                  headerFontSize={tabelaUI.headerFontSize}
                  headerFontFamily={tabelaUI.headerFontFamily}
                  headerFontWeight={tabelaUI.headerFontWeight}
                  headerLetterSpacing={tabelaUI.headerLetterSpacing}
                  cellFontSize={tabelaUI.cellFontSize}
                  cellFontFamily={tabelaUI.cellFontFamily}
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

          {/* Controles de UI */}
          <div className="px-4 md:px-6 mt-8 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-6">Configurações de UI</h3>

              {/* SEÇÃO: Título */}
              <div className="mb-8">
                <h4 className="text-sm font-medium mb-4 text-gray-700">Título do Header</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Family</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={titulo.titleFontFamily || 'Inter'}
                      onChange={(e) => moduleUiActions.setTitulo({ titleFontFamily: e.target.value })}
                    >
                      <option>Inter</option>
                      <option>Geist</option>
                      <option>Roboto Mono</option>
                      <option>Geist Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Avenir</option>
                      <option>Space Mono</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Barlow</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Size (px)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={titulo.titleFontSize || 32}
                      onChange={(e) => moduleUiActions.setTitulo({ titleFontSize: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Weight</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min="100"
                      max="900"
                      step="100"
                      value={titulo.titleFontWeight || '600'}
                      onChange={(e) => moduleUiActions.setTitulo({ titleFontWeight: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Color</label>
                    <input
                      type="color"
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md"
                      value={titulo.titleColor || '#111827'}
                      onChange={(e) => moduleUiActions.setTitulo({ titleColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Letter Spacing (em)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      step="0.01"
                      value={titulo.titleLetterSpacing || 0}
                      onChange={(e) => moduleUiActions.setTitulo({ titleLetterSpacing: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: Subtítulo */}
              <div className="mb-8">
                <h4 className="text-sm font-medium mb-4 text-gray-700">Subtítulo do Header</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Family</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={titulo.subtitleFontFamily || 'Inter'}
                      onChange={(e) => moduleUiActions.setTitulo({ subtitleFontFamily: e.target.value })}
                    >
                      <option>Inter</option>
                      <option>Geist</option>
                      <option>Roboto Mono</option>
                      <option>Geist Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Avenir</option>
                      <option>Space Mono</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Barlow</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Size (px)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={titulo.subtitleFontSize || 14}
                      onChange={(e) => moduleUiActions.setTitulo({ subtitleFontSize: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Weight</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min="100"
                      max="900"
                      step="100"
                      value={titulo.subtitleFontWeight || '400'}
                      onChange={(e) => moduleUiActions.setTitulo({ subtitleFontWeight: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Color</label>
                    <input
                      type="color"
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md"
                      value={titulo.subtitleColor || '#666666'}
                      onChange={(e) => moduleUiActions.setTitulo({ subtitleColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Letter Spacing (em)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      step="0.01"
                      value={titulo.subtitleLetterSpacing || -0.28}
                      onChange={(e) => moduleUiActions.setTitulo({ subtitleLetterSpacing: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: Tabs */}
              <div className="mb-8">
                <h4 className="text-sm font-medium mb-4 text-gray-700">Tabs</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Family</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={tabs.fontFamily || 'Geist'}
                      onChange={(e) => moduleUiActions.setTabs({ fontFamily: e.target.value })}
                    >
                      <option>Inter</option>
                      <option>Geist</option>
                      <option>Roboto Mono</option>
                      <option>Geist Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Avenir</option>
                      <option>Space Mono</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Barlow</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Size (px)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={tabs.fontSize || 14}
                      onChange={(e) => moduleUiActions.setTabs({ fontSize: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Weight</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min="100"
                      max="900"
                      step="100"
                      value={tabs.fontWeight || '400'}
                      onChange={(e) => moduleUiActions.setTabs({ fontWeight: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Color (Inactive)</label>
                    <input
                      type="color"
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md"
                      value={tabs.color || 'rgb(180, 180, 180)'}
                      onChange={(e) => moduleUiActions.setTabs({ color: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Active Color</label>
                    <input
                      type="color"
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md"
                      value={tabs.activeColor || 'rgb(41, 41, 41)'}
                      onChange={(e) => moduleUiActions.setTabs({ activeColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Letter Spacing (em)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      step="0.01"
                      value={tabs.letterSpacing || -0.3}
                      onChange={(e) => moduleUiActions.setTabs({ letterSpacing: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Icon Size (px)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={tabs.iconSize || 16}
                      onChange={(e) => moduleUiActions.setTabs({ iconSize: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Active Font Weight</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min="100"
                      max="900"
                      step="100"
                      value={tabs.activeFontWeight || '500'}
                      onChange={(e) => moduleUiActions.setTabs({ activeFontWeight: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Padding Left Primeira Tab (px)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={tabs.leftOffset || 20}
                      onChange={(e) => moduleUiActions.setTabs({ leftOffset: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Padding Bottom Título/Ícone (px)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={tabs.labelOffsetY || 6}
                      onChange={(e) => moduleUiActions.setTabs({ labelOffsetY: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: Layout */}
              <div className="mb-8">
                <h4 className="text-sm font-medium mb-4 text-gray-700">Layout</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Cor de Fundo (área abaixo das tabs)</label>
                    <input
                      type="color"
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md"
                      value={layout.contentBg || 'rgb(253, 253, 253)'}
                      onChange={(e) => moduleUiActions.setLayout({ contentBg: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: Tabela */}
              <div className="mb-8">
                <h4 className="text-sm font-medium mb-4 text-gray-700">Tabela - Header</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Family</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={tabelaUI.headerFontFamily || 'Inter'}
                      onChange={(e) => moduleUiActions.setTabelaUI({ headerFontFamily: e.target.value })}
                    >
                      <option>Inter</option>
                      <option>Geist</option>
                      <option>Roboto Mono</option>
                      <option>Geist Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Avenir</option>
                      <option>Space Mono</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Barlow</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Size (px)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={tabelaUI.headerFontSize || 13}
                      onChange={(e) => moduleUiActions.setTabelaUI({ headerFontSize: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Color</label>
                    <input
                      type="color"
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md"
                      value={tabelaUI.headerText || '#aaaaaa'}
                      onChange={(e) => moduleUiActions.setTabelaUI({ headerText: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Letter Spacing (em)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      step="0.01"
                      value={tabelaUI.headerLetterSpacing || -0.28}
                      onChange={(e) => moduleUiActions.setTabelaUI({ headerLetterSpacing: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <h4 className="text-sm font-medium mb-4 text-gray-700">Tabela - Células</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Family</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={tabelaUI.cellFontFamily || 'Inter'}
                      onChange={(e) => moduleUiActions.setTabelaUI({ cellFontFamily: e.target.value })}
                    >
                      <option>Inter</option>
                      <option>Geist</option>
                      <option>Roboto Mono</option>
                      <option>Geist Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Avenir</option>
                      <option>Space Mono</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Barlow</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Font Size (px)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={tabelaUI.cellFontSize || 13}
                      onChange={(e) => moduleUiActions.setTabelaUI({ cellFontSize: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Color</label>
                    <input
                      type="color"
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md"
                      value={tabelaUI.cellText || '#1f2937'}
                      onChange={(e) => moduleUiActions.setTabelaUI({ cellText: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Letter Spacing (em)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      step="0.01"
                      value={tabelaUI.cellLetterSpacing || -0.28}
                      onChange={(e) => moduleUiActions.setTabelaUI({ cellLetterSpacing: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Botão Reset */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => moduleUiActions.resetAll()}
                >
                  Resetar Padrões
                </Button>
              </div>
            </div>
          </div>

                </div>
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
