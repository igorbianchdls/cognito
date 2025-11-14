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
import { ShoppingCart, RotateCcw, Ticket, LayoutGrid } from 'lucide-react'

type Row = TableData

type PedidoItem = {
  produto: string
  quantidade: number
  preco_unitario: number
  desconto_item: number
  subtotal_item: number
}

type PedidoRow = Row & {
  itens?: PedidoItem[]
}

type DevolucaoItem = {
  produto: string
  quantidade: number
  valor_unitario: number
  subtotal: number
}

type DevolucaoRow = Row & {
  itens?: DevolucaoItem[]
}

type TabelaPrecoItem = {
  produto: string
  preco_produto: number | null
}

type TabelaPrecoRow = Row & {
  itens?: TabelaPrecoItem[]
}

type PromocaoItem = {
  produto: string
}

type PromocaoRow = Row & {
  itens?: PromocaoItem[]
}

export default function ModulosVendasPage() {
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
    if (name === 'Barlow') return 'var(--font-barlow), "Barlow", sans-serif'
    return name
  }

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Vendas',
      subtitle: 'Gestão de pedidos, devoluções e cupons'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'pedidos', label: 'Pedidos' },
        { value: 'devolucoes', label: 'Devoluções' },
        { value: 'cupons', label: 'Cupons' },
        { value: 'canais', label: 'Canais de Venda' },
        { value: 'tabelas_preco', label: 'Tabelas de Preço' },
        { value: 'promocoes', label: 'Promoções' },
        { value: 'regras_desconto', label: 'Regras de Desconto' },
      ],
      selected: 'pedidos',
    })
  }, [])

  const iconFor = (v: string) => {
    if (v === 'pedidos') return <ShoppingCart className="h-4 w-4" />
    if (v === 'devolucoes') return <RotateCcw className="h-4 w-4" />
    if (v === 'cupons') return <Ticket className="h-4 w-4" />
    if (v === 'canais') return <LayoutGrid className="h-4 w-4" />
    return <ShoppingCart className="h-4 w-4" />
  }
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
    if (isNaN(n)) return String(value ?? '')
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const renderPedidoItems = (row: Row) => {
    const pedidoRow = row as PedidoRow
    const itens = pedidoRow.itens || []

    if (itens.length === 0) return null

    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Itens do Pedido</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Produto</th>
              <th className="text-right py-2 px-3">Quantidade</th>
              <th className="text-right py-2 px-3">Preço Unitário</th>
              <th className="text-right py-2 px-3">Desconto</th>
              <th className="text-right py-2 px-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.produto}</td>
                <td className="text-right py-2 px-3">{item.quantidade}</td>
                <td className="text-right py-2 px-3">{formatBRL(item.preco_unitario)}</td>
                <td className="text-right py-2 px-3">{formatBRL(item.desconto_item)}</td>
                <td className="text-right py-2 px-3">{formatBRL(item.subtotal_item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderDevolucaoItems = (row: Row) => {
    const devolucaoRow = row as DevolucaoRow
    const itens = devolucaoRow.itens || []

    if (itens.length === 0) return null

    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Itens da Devolução</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Produto</th>
              <th className="text-right py-2 px-3">Quantidade</th>
              <th className="text-right py-2 px-3">Valor Unitário</th>
              <th className="text-right py-2 px-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.produto}</td>
                <td className="text-right py-2 px-3">{item.quantidade}</td>
                <td className="text-right py-2 px-3">{formatBRL(item.valor_unitario)}</td>
                <td className="text-right py-2 px-3">{formatBRL(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderTabelaPrecoItems = (row: Row) => {
    const tpRow = row as TabelaPrecoRow
    const itens = tpRow.itens || []
    if (itens.length === 0) return null
    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Itens da Tabela</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Produto</th>
              <th className="text-right py-2 px-3">Preço</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.produto}</td>
                <td className="text-right py-2 px-3">{item.preco_produto != null ? formatBRL(item.preco_produto) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderPromocaoItems = (row: Row) => {
    const promRow = row as PromocaoRow
    const itens = promRow.itens || []
    if (itens.length === 0) return null
    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Produtos da Promoção</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Produto</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.produto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'pedidos':
        return [
          { accessorKey: 'pedido', header: 'Pedido' },
          { accessorKey: 'cliente', header: 'Cliente' },
          { accessorKey: 'vendedor', header: 'Vendedor' },
          { accessorKey: 'territorio', header: 'Território' },
          { accessorKey: 'canal_venda', header: 'Canal' },
          { accessorKey: 'cupom', header: 'Cupom' },
          { accessorKey: 'data_pedido', header: 'Data Pedido', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'pedido_subtotal', header: 'Subtotal', cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'desconto_total', header: 'Desconto', cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'valor_total', header: 'Total', cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'devolucoes':
        return [
          { accessorKey: 'devolucao', header: 'Devolução' },
          { accessorKey: 'pedido', header: 'Pedido' },
          { accessorKey: 'cliente', header: 'Cliente' },
          { accessorKey: 'motivo', header: 'Motivo' },
          { accessorKey: 'data_devolucao', header: 'Data Devolução', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'valor_total', header: 'Valor', cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'cupons':
        return [
          { accessorKey: 'cupom', header: 'Cupom' },
          { accessorKey: 'tipo_desconto', header: 'Tipo' },
          { accessorKey: 'valor_desconto', header: 'Valor Desconto' },
          { accessorKey: 'valor_minimo', header: 'Valor Mínimo', cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'limite_uso_total', header: 'Limite Total' },
          { accessorKey: 'limite_uso_por_cliente', header: 'Limite/Cliente' },
          { accessorKey: 'data_inicio', header: 'Data Início', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'data_fim', header: 'Data Fim', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'ativo', header: 'Ativo' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'canais':
        return [
          { accessorKey: 'canal', header: 'Canal' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'ativo', header: 'Ativo' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'tabelas_preco':
        return [
          { accessorKey: 'tabela_preco', header: 'ID' },
          { accessorKey: 'nome_tabela', header: 'Tabela de Preço' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'ativo', header: 'Ativo' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'promocoes':
        return [
          { accessorKey: 'promocao', header: 'ID' },
          { accessorKey: 'nome_promocao', header: 'Promoção' },
          { accessorKey: 'tipo_desconto', header: 'Tipo' },
          { accessorKey: 'valor_desconto', header: 'Valor Desconto', cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'valor_minimo', header: 'Valor Mínimo', cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'data_inicio', header: 'Início', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'data_fim', header: 'Fim', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'ativo', header: 'Ativo' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'regras_desconto':
        return [
          { accessorKey: 'regra', header: 'ID' },
          { accessorKey: 'nome_regra', header: 'Regra' },
          { accessorKey: 'tipo_regra', header: 'Tipo' },
          { accessorKey: 'quantidade_minima', header: 'Qtd. Mínima' },
          { accessorKey: 'valor_minimo', header: 'Valor Mínimo', cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'tipo_desconto', header: 'Tipo Desc.' },
          { accessorKey: 'valor_desconto', header: 'Valor Desconto', cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'referencia', header: 'Referência' },
          { accessorKey: 'ativo', header: 'Ativo' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      default:
        return []
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
        const url = `/api/modulos/vendas?${params.toString()}`
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
                  enableExpand={tabs.selected === 'pedidos' || tabs.selected === 'devolucoes' || tabs.selected === 'tabelas_preco' || tabs.selected === 'promocoes'}
                  renderDetail={
                    tabs.selected === 'pedidos'
                      ? renderPedidoItems
                      : tabs.selected === 'devolucoes'
                      ? renderDevolucaoItems
                      : tabs.selected === 'tabelas_preco'
                      ? renderTabelaPrecoItems
                      : tabs.selected === 'promocoes'
                      ? renderPromocaoItems
                      : undefined
                  }
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
