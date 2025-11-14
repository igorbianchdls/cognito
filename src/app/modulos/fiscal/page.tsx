'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import DataToolbar from '@/components/modulos/DataToolbar'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import { FileText } from 'lucide-react'

type Row = TableData

export default function ModulosFiscalPage() {
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

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    if (name === 'Barlow') return 'var(--font-barlow), "Barlow", sans-serif'
    return name
  }

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Fiscal',
      subtitle: 'Gestão de notas fiscais e documentos fiscais'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'notas_fiscais', label: 'Notas Fiscais' },
        { value: 'notas_fiscais_servico', label: 'Notas Fiscais de Serviço' },
      ],
      selected: 'notas_fiscais',
    })
  }, [])

  useEffect(() => {
    async function fetchData() {
      if (!tabs.selected) return
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          view: tabs.selected,
          page: String(page),
          pageSize: String(pageSize),
        })
        if (dateRange?.from) params.set('de', dateRange.from.toISOString().split('T')[0])
        if (dateRange?.to) params.set('ate', dateRange.to.toISOString().split('T')[0])
        const res = await fetch('/api/modulos/fiscal?' + params.toString(), { cache: 'no-store' })
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const json = await res.json()
        setData(json.rows || [])
        setTotal(json.total || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setData([])
        setTotal(0)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [tabs.selected, page, pageSize, dateRange])

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

  const columns: ColumnDef<Row>[] =
    tabs.selected === 'notas_fiscais'
      ? [
          { accessorKey: 'numero_nota', header: 'Número' },
          { accessorKey: 'data_emissao', header: 'Data Emissão', cell: ({ row }) => formatDate(row.getValue('data_emissao')) },
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'cliente_fornecedor', header: 'Cliente/Fornecedor' },
          { accessorKey: 'valor_total', header: 'Valor Total', cell: ({ row }) => formatBRL(row.getValue('valor_total')) },
          { accessorKey: 'status', header: 'Status' },
        ]
      : tabs.selected === 'notas_fiscais_servico'
      ? [
          { accessorKey: 'numero_nfse', header: 'Número NFS-e' },
          { accessorKey: 'data_emissao', header: 'Data Emissão', cell: ({ row }) => formatDate(row.getValue('data_emissao')) },
          { accessorKey: 'prestador', header: 'Prestador' },
          { accessorKey: 'tomador', header: 'Tomador' },
          { accessorKey: 'valor_servico', header: 'Valor Serviço', cell: ({ row }) => formatBRL(row.getValue('valor_servico')) },
          { accessorKey: 'status', header: 'Status' },
        ]
      : []

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="overflow-hidden">
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
        <TabsNav
          options={tabs.options}
          value={tabs.selected}
          onValueChange={(value) => {
            moduleUiActions.setTabs({ ...tabs, selected: value })
            setPage(1)
          }}
          fontFamily={fontVar(tabs.fontFamily)}
          fontSize={tabs.fontSize}
          fontWeight={tabs.fontWeight}
          color={tabs.color}
          letterSpacing={tabs.letterSpacing}
        />
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
            />
          </div>
          <div className="flex-1 min-h-0 overflow-auto px-4 md:px-6" style={{ marginBottom: layout.mbTable }}>
            <div className="rounded-lg bg-white">
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
