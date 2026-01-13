'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import DataToolbar from '@/components/modulos/DataToolbar'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { Building2, Package, List, Shuffle, ClipboardList, DollarSign, Settings } from 'lucide-react'

type Row = TableData

export default function ModulosEstoquePage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Estoque',
      subtitle: 'Dados operacionais do estoque (Supabase)'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'almoxarifados', label: 'Almoxarifados' },
        { value: 'estoque-atual', label: 'Estoque Atual' },
        { value: 'movimentacoes', label: 'Movimentações' },
        { value: 'transferencias', label: 'Transferências' },
        { value: 'inventarios', label: 'Inventários' },
        { value: 'custos-estoque', label: 'Custos de Estoque' },
        { value: 'tipos-movimentacao', label: 'Tipos Movimentação' },
      ],
      selected: 'almoxarifados',
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
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)

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
      case 'almoxarifados':
        return [
          { accessorKey: 'almoxarifado', header: 'Almoxarifado' },
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'endereco', header: 'Endereço' },
          { accessorKey: 'responsavel', header: 'Responsável' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
        ]
      case 'estoque-atual':
        return [
          { accessorKey: 'produto', header: 'Produto' },
          { accessorKey: 'almoxarifado', header: 'Almoxarifado' },
          { accessorKey: 'quantidade_atual', header: 'Quantidade Atual' },
          { accessorKey: 'custo_medio', header: 'Custo Médio (R$)', cell: ({ row }) => formatBRL(row.original['custo_medio']) },
          { accessorKey: 'valor_total', header: 'Valor Total (R$)', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'movimentacoes':
        return [
          { accessorKey: 'produto', header: 'Produto' },
          { accessorKey: 'almoxarifado', header: 'Almoxarifado' },
          { accessorKey: 'tipo_movimento', header: 'Tipo Movimento' },
          { accessorKey: 'descricao_movimento', header: 'Descrição Movimento' },
          { accessorKey: 'natureza', header: 'Natureza' },
          { accessorKey: 'quantidade', header: 'Quantidade' },
          { accessorKey: 'valor_unitario', header: 'Valor Unitário (R$)', cell: ({ row }) => formatBRL(row.original['valor_unitario']) },
          { accessorKey: 'valor_total', header: 'Valor Total (R$)', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'data_movimento', header: 'Data Movimento', cell: ({ row }) => formatDate(row.original['data_movimento']) },
          { accessorKey: 'origem', header: 'Origem' },
          { accessorKey: 'observacoes', header: 'Observações' },
        ]
      case 'transferencias':
        return [
          { accessorKey: 'origem', header: 'Origem' },
          { accessorKey: 'destino', header: 'Destino' },
          { accessorKey: 'responsavel', header: 'Responsável' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'data', header: 'Data', cell: ({ row }) => formatDate(row.original['data']) },
          { accessorKey: 'produto', header: 'Produto' },
          { accessorKey: 'quantidade', header: 'Quantidade' },
          { accessorKey: 'observacoes', header: 'Observações' },
        ]
      case 'inventarios':
        return [
          { accessorKey: 'almoxarifado', header: 'Almoxarifado' },
          { accessorKey: 'responsavel', header: 'Responsável' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'inicio', header: 'Início', cell: ({ row }) => formatDate(row.original['inicio']) },
          { accessorKey: 'fim', header: 'Fim', cell: ({ row }) => formatDate(row.original['fim']) },
          { accessorKey: 'produto', header: 'Produto' },
          { accessorKey: 'qtde_sistema', header: 'Qtde Sistema' },
          { accessorKey: 'qtde_contada', header: 'Qtde Contada' },
          { accessorKey: 'diferenca', header: 'Diferença' },
          { accessorKey: 'ajuste_gerado', header: 'Ajuste Gerado' },
        ]
      case 'custos-estoque':
        return [
          { accessorKey: 'produto', header: 'Produto' },
          { accessorKey: 'metodo', header: 'Método de Custo' },
          { accessorKey: 'fonte', header: 'Fonte' },
          { accessorKey: 'custo', header: 'Custo (R$)', cell: ({ row }) => formatBRL(row.original['custo']) },
          { accessorKey: 'data_referencia', header: 'Data Referência', cell: ({ row }) => formatDate(row.original['data_referencia']) },
          { accessorKey: 'registrado_em', header: 'Registrado em', cell: ({ row }) => formatDate(row.original['registrado_em']) },
        ]
      case 'tipos-movimentacao':
        return [
          { accessorKey: 'codigo', header: 'Código' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'natureza', header: 'Natureza' },
          { accessorKey: 'gera_financeiro', header: 'Gera Financeiro' },
          { accessorKey: 'status', header: 'Status' },
        ]
      default:
        return []
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
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        const url = `/api/modulos/estoque?${params.toString()}`
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
  }, [tabs.selected, dateRange?.from, dateRange?.to, page, pageSize])

  useEffect(() => { setPage(1) }, [tabs.selected, dateRange?.from, dateRange?.to])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'almoxarifados': return <Building2 className="h-4 w-4" />
        case 'estoque-atual': return <Package className="h-4 w-4" />
        case 'movimentacoes': return <List className="h-4 w-4" />
        case 'transferencias': return <Shuffle className="h-4 w-4" />
        case 'inventarios': return <ClipboardList className="h-4 w-4" />
        case 'custos-estoque': return <DollarSign className="h-4 w-4" />
        case 'tipos-movimentacao': return <Settings className="h-4 w-4" />
        default: return null
      }
    }
    return tabs.options.map((opt) => ({ ...opt, icon: iconFor(opt.value) })) as Opcao[]
  }, [tabs.options])

  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden bg-gray-100">
          <div className="flex flex-col h-full w-full">
            
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-2 pb-2">
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
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
