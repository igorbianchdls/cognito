"use client"

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusHeader from '@/components/navigation/nexus/NexusHeader'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import DataToolbar from '@/components/modulos/DataToolbar'
import DataTable, { type TableData } from '@/components/widgets/Table'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { List, Package, FileText, Tag, CheckCircle2, DollarSign, Ruler, Globe, ShoppingCart, Calendar, User } from 'lucide-react'
import IconLabelHeader from '@/components/widgets/IconLabelHeader'
import CadastroProdutoSheet from '@/components/modulos/produtos/CadastroProdutoSheet'
import CadastroVariacaoSheet from '@/components/modulos/produtos/CadastroVariacaoSheet'
import CadastroDadosFiscaisSheet from '@/components/modulos/produtos/CadastroDadosFiscaisSheet'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
  const [refreshKey, setRefreshKey] = useState<number>(0)

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    return name
  }

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Produtos',
      subtitle: 'Selecione uma opção para visualizar os dados'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'vendas', label: 'Vendas' },
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

  const iconFor = (v: string) => v === 'vendas' ? <ShoppingCart className="h-4 w-4" /> : <List className="h-4 w-4" />
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

  

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'vendas':
        return [
          { accessorKey: 'pedido', header: () => <IconLabelHeader icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Pedido" /> },
          { accessorKey: 'cliente', header: () => <IconLabelHeader icon={<User className="h-3.5 w-3.5" />} label="Cliente" /> },
          { accessorKey: 'data_venda', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Data" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'status', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" />, cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'valor_total', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Total" />, cell: ({ getValue }) => formatBRL(getValue()) },
        ]
      case 'produtos':
        return [
          {
            accessorKey: 'nome',
            header: () => <IconLabelHeader icon={<Package className="h-3.5 w-3.5" />} label="Produto" />,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['nome'] ? String(row.original['nome']) : 'Sem nome'}
                subtitle={row.original['categoria'] ? String(row.original['categoria']) : 'Sem categoria'}
                imageUrl={row.original['produto_imagem_url'] ? String(row.original['produto_imagem_url']) : undefined}
              />
            )
          },
          { accessorKey: 'descricao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" /> },
          { accessorKey: 'marca', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Marca" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" />, cell: ({ row }) => <StatusBadge value={row.original['ativo']} type="bool" /> },
        ]
      case 'variacoes':
        return [
          { accessorKey: 'produto_pai', header: () => <IconLabelHeader icon={<Package className="h-3.5 w-3.5" />} label="Produto" /> },
          { accessorKey: 'sku', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="SKU" /> },
          { accessorKey: 'preco_base', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Preço Base" />, cell: ({ row }) => formatBRL(row.original['preco_base']) },
          { accessorKey: 'peso_kg', header: () => <IconLabelHeader icon={<Ruler className="h-3.5 w-3.5" />} label="Peso (kg)" /> },
          { accessorKey: 'altura_cm', header: () => <IconLabelHeader icon={<Ruler className="h-3.5 w-3.5" />} label="Altura (cm)" /> },
          { accessorKey: 'largura_cm', header: () => <IconLabelHeader icon={<Ruler className="h-3.5 w-3.5" />} label="Largura (cm)" /> },
          { accessorKey: 'profundidade_cm', header: () => <IconLabelHeader icon={<Ruler className="h-3.5 w-3.5" />} label="Profundidade (cm)" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" />, cell: ({ row }) => <StatusBadge value={row.original['ativo']} type="bool" /> },
        ]
      case 'dados-fiscais':
        return [
          { accessorKey: 'produto', header: () => <IconLabelHeader icon={<Package className="h-3.5 w-3.5" />} label="Produto" /> },
          { accessorKey: 'sku', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="SKU" /> },
          { accessorKey: 'ncm', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="NCM" /> },
          { accessorKey: 'cest', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="CEST" /> },
          { accessorKey: 'cfop', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="CFOP" /> },
          { accessorKey: 'cst', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="CST" /> },
          { accessorKey: 'origem', header: () => <IconLabelHeader icon={<Globe className="h-3.5 w-3.5" />} label="Origem" /> },
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
        if (tabs.selected === 'vendas') {
          const rows: Row[] = [
            { id: 301, pedido: 'P-001', cliente: 'Cliente A', data_venda: '2024-10-05', status: 'Concluído', valor_total: 890 },
            { id: 302, pedido: 'P-002', cliente: 'Cliente B', data_venda: '2024-10-12', status: 'Em andamento', valor_total: 1790.5 },
          ]
          setData(rows)
          setTotal(rows.length)
          return
        }
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
  }, [tabs.selected, page, pageSize, refreshKey])

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
                        tabs.selected === 'vendas' ? (
                          <Link href="/modulos/vendas/pedidos/novo" className="inline-flex"><Button variant="default">Cadastrar Venda</Button></Link>
                        ) : tabs.selected === 'produtos' ? (
                          <CadastroProdutoSheet triggerLabel="Cadastrar" onCreated={() => setRefreshKey((k) => k + 1)} />
                        ) : tabs.selected === 'variacoes' ? (
                          <CadastroVariacaoSheet triggerLabel="Cadastrar" onCreated={() => setRefreshKey((k) => k + 1)} />
                        ) : tabs.selected === 'dados-fiscais' ? (
                          <CadastroDadosFiscaisSheet triggerLabel="Cadastrar" onCreated={() => setRefreshKey((k) => k + 1)} />
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
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
