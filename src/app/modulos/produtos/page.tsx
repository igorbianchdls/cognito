"use client"

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import DataToolbar from '@/components/modulos/DataToolbar'
import DataTable, { type TableData } from '@/components/widgets/Table'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import { List } from 'lucide-react'

type Row = TableData

export default function ModulosProdutosPage() {
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
    return name
  }

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Produtos',
      subtitle: 'Selecione uma opção para visualizar os dados',
      titleFontFamily: 'var(--font-crimson-text)'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'produtos', label: 'Produtos' },
        { value: 'variacoes', label: 'Variações' },
        { value: 'dados-fiscais', label: 'Dados Fiscais' },
      ],
      selected: 'produtos',
    })
  }, [])

  // Reset page when tab changes
  useEffect(() => {
    setPage(1)
  }, [tabs.selected])

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
  const formatBRL = (value?: unknown) => {
    const n = Number(value ?? 0)
    return isNaN(n) ? String(value ?? '') : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
      case 'produtos':
        return [
          {
            accessorKey: 'nome',
            header: 'Produto',
            cell: ({ row }) => {
              const nome = row.original['nome'] || 'Sem nome'
              const categoria = row.original['categoria'] || 'Sem categoria'
              const imagemUrl = row.original['produto_imagem_url']
              const colors = getColorFromName(String(nome))
              return (
                <div className="flex items-center">
                  <div
                    className="flex items-center justify-center mr-3"
                    style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: imagemUrl ? 'transparent' : colors.bg }}
                  >
                    {imagemUrl ? (
                      <img src={String(imagemUrl)} alt={String(nome)} className="w-full h-full object-cover" />
                    ) : (
                      <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
                        {String(nome)?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{String(nome)}</div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{String(categoria)}</div>
                  </div>
                </div>
              )
            }
          },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'marca', header: 'Marca' },
          { accessorKey: 'ativo', header: 'Ativo' },
        ]
      case 'variacoes':
        return [
          { accessorKey: 'produto_pai', header: 'Produto' },
          { accessorKey: 'sku', header: 'SKU' },
          { accessorKey: 'preco_base', header: 'Preço Base', cell: ({ row }) => formatBRL(row.original['preco_base']) },
          { accessorKey: 'peso_kg', header: 'Peso (kg)' },
          { accessorKey: 'altura_cm', header: 'Altura (cm)' },
          { accessorKey: 'largura_cm', header: 'Largura (cm)' },
          { accessorKey: 'profundidade_cm', header: 'Profundidade (cm)' },
          { accessorKey: 'ativo', header: 'Ativo' },
        ]
      case 'dados-fiscais':
        return [
          { accessorKey: 'produto', header: 'Produto' },
          { accessorKey: 'sku', header: 'SKU' },
          { accessorKey: 'ncm', header: 'NCM' },
          { accessorKey: 'cest', header: 'CEST' },
          { accessorKey: 'cfop', header: 'CFOP' },
          { accessorKey: 'cst', header: 'CST' },
          { accessorKey: 'origem', header: 'Origem' },
          { accessorKey: 'aliquota_icms', header: 'ICMS (%)' },
          { accessorKey: 'aliquota_ipi', header: 'IPI (%)' },
          { accessorKey: 'aliquota_pis', header: 'PIS (%)' },
          { accessorKey: 'aliquota_cofins', header: 'COFINS (%)' },
          { accessorKey: 'regime_tributario', header: 'Regime Tributário' },
        ]
      default:
        return []
    }
  }, [tabs.selected])

  // Carrega dados conforme a tab selecionada (server-side pagination)
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
        const url = `/api/modulos/produtos?${params.toString()}`
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
  }, [tabs.selected, page, pageSize])

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
                    // tanstack pageIndex é 0-based
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
