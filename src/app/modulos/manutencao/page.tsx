'use client'

import { useMemo, useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import DataToolbar from '@/components/modulos/DataToolbar'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { ClipboardList, RotateCw, Wrench, Package, Users, History, TrendingUp, Box } from 'lucide-react'
import StatusBadge from '@/components/modulos/StatusBadge'

type Row = TableData

export default function ModulosManutencaoPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  // Filtro de datas (range)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Manutenção',
      subtitle: 'Gestão de ordens de serviço, ativos e manutenções',
      titleFontFamily: 'var(--font-crimson-text)'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'ordens-servico', label: 'Ordens de Serviço', icon: <ClipboardList className="text-blue-600" /> },
        { value: 'preventivas', label: 'Preventivas', icon: <RotateCw className="text-green-600" /> },
        { value: 'corretivas', label: 'Corretivas', icon: <Wrench className="text-orange-600" /> },
        { value: 'ativos', label: 'Ativos', icon: <Box className="text-purple-600" /> },
        { value: 'tecnicos', label: 'Técnicos', icon: <Users className="text-indigo-600" /> },
        { value: 'pecas', label: 'Peças/Estoque', icon: <Package className="text-amber-600" /> },
        { value: 'historico', label: 'Histórico', icon: <History className="text-gray-600" /> },
        { value: 'indicadores', label: 'Indicadores', icon: <TrendingUp className="text-emerald-600" /> },
      ],
      selected: 'ordens-servico',
    })
  }, [])

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    return name
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

  const formatBRL = (value?: unknown) => {
    const n = Number(value ?? 0)
    if (isNaN(n)) return String(value ?? '')
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'ordens-servico':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'ativo', header: 'Ativo' },
          {
            accessorKey: 'tipo',
            header: 'Tipo',
            cell: ({ row }) => <StatusBadge value={row.original['tipo']} type="status" />
          },
          { accessorKey: 'prioridade', header: 'Prioridade' },
          {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" />
          },
          { accessorKey: 'tecnico', header: 'Técnico' },
          { accessorKey: 'data_abertura', header: 'Data Abertura', cell: ({ row }) => formatDate(row.original['data_abertura']) },
          { accessorKey: 'data_conclusao', header: 'Data Conclusão', cell: ({ row }) => formatDate(row.original['data_conclusao']) },
        ]
      case 'preventivas':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'ativo', header: 'Ativo' },
          { accessorKey: 'periodicidade', header: 'Periodicidade' },
          { accessorKey: 'ultima_execucao', header: 'Última Execução', cell: ({ row }) => formatDate(row.original['ultima_execucao']) },
          { accessorKey: 'proxima_execucao', header: 'Próxima Execução', cell: ({ row }) => formatDate(row.original['proxima_execucao']) },
          {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" />
          },
          { accessorKey: 'tecnico_responsavel', header: 'Técnico Responsável' },
        ]
      case 'corretivas':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'ativo', header: 'Ativo' },
          { accessorKey: 'problema', header: 'Problema' },
          { accessorKey: 'prioridade', header: 'Prioridade' },
          { accessorKey: 'data_abertura', header: 'Data Abertura', cell: ({ row }) => formatDate(row.original['data_abertura']) },
          { accessorKey: 'tempo_parada', header: 'Tempo Parada (h)' },
          {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" />
          },
        ]
      case 'ativos':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'nome', header: 'Nome' },
          { accessorKey: 'categoria', header: 'Categoria' },
          { accessorKey: 'local', header: 'Local' },
          { accessorKey: 'marca_modelo', header: 'Marca/Modelo' },
          {
            accessorKey: 'status_operacional',
            header: 'Status Operacional',
            cell: ({ row }) => <StatusBadge value={row.original['status_operacional']} type="status" />
          },
          { accessorKey: 'ultima_manutencao', header: 'Última Manutenção', cell: ({ row }) => formatDate(row.original['ultima_manutencao']) },
        ]
      case 'tecnicos':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'nome', header: 'Nome' },
          { accessorKey: 'especialidade', header: 'Especialidade' },
          { accessorKey: 'os_abertas', header: 'OS em Aberto' },
          { accessorKey: 'os_concluidas_mes', header: 'OS Concluídas (mês)' },
          {
            accessorKey: 'disponibilidade',
            header: 'Disponibilidade',
            cell: ({ row }) => <StatusBadge value={row.original['disponibilidade']} type="status" />
          },
          { accessorKey: 'contato', header: 'Contato' },
        ]
      case 'pecas':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'codigo', header: 'Código' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'quantidade', header: 'Quantidade' },
          { accessorKey: 'estoque_minimo', header: 'Estoque Mínimo' },
          { accessorKey: 'localizacao', header: 'Localização' },
          { accessorKey: 'ultima_entrada', header: 'Última Entrada', cell: ({ row }) => formatDate(row.original['ultima_entrada']) },
        ]
      case 'historico':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'data', header: 'Data', cell: ({ row }) => formatDate(row.original['data']) },
          { accessorKey: 'ativo', header: 'Ativo' },
          { accessorKey: 'tipo_manutencao', header: 'Tipo Manutenção' },
          { accessorKey: 'tecnico', header: 'Técnico' },
          { accessorKey: 'duracao', header: 'Duração (h)' },
          { accessorKey: 'custo', header: 'Custo', cell: ({ row }) => formatBRL(row.original['custo']) },
          { accessorKey: 'pecas_utilizadas', header: 'Peças Utilizadas' },
        ]
      case 'indicadores':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'metrica', header: 'Métrica' },
          { accessorKey: 'valor', header: 'Valor' },
          { accessorKey: 'periodo', header: 'Período' },
          { accessorKey: 'meta', header: 'Meta' },
          {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" />
          },
        ]
      default:
        return []
    }
  }, [tabs.selected])

  const [data, setData] = useState<Row[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('view', tabs.selected)
        if (dateRange?.from) {
          const d = new Date(dateRange.from)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          params.set('de', `${yyyy}-${mm}-${dd}`)
        }
        if (dateRange?.to) {
          const d = new Date(dateRange.to)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          params.set('ate', `${yyyy}-${mm}-${dd}`)
        }
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        const url = `/api/modulos/manutencao?${params.toString()}`
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

  // Reset page when tab or date range changes
  useEffect(() => { setPage(1) }, [tabs.selected, dateRange?.from, dateRange?.to])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'ordens-servico':
          return <ClipboardList className="h-4 w-4" />
        case 'preventivas':
          return <RotateCw className="h-4 w-4" />
        case 'corretivas':
          return <Wrench className="h-4 w-4" />
        case 'ativos':
          return <Box className="h-4 w-4" />
        case 'tecnicos':
          return <Users className="h-4 w-4" />
        case 'pecas':
          return <Package className="h-4 w-4" />
        case 'historico':
          return <History className="h-4 w-4" />
        case 'indicadores':
          return <TrendingUp className="h-4 w-4" />
        default:
          return null
      }
    }
    return tabs.options.map((opt) => ({ ...opt, icon: iconFor(opt.value) })) as Opcao[]
  }, [tabs.options])

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto" style={{ background: layout.contentBg }}>
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
        {/* Conteúdo abaixo das tabs */}
        <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
          {/* Toolbar direita (paginador + filtro de data) */}
          <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
            <DataToolbar
              from={total === 0 ? 0 : (page - 1) * pageSize + 1}
              to={total === 0 ? 0 : Math.min(page * pageSize, total)}
              total={total}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
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
              ) : data.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">Nenhum dado disponível</div>
              ) : (
                <DataTable
                  key={tabs.selected}
                  columns={columns}
                  data={data}
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
      </SidebarInset>
    </SidebarProvider>
  )
}
