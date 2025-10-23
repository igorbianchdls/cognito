'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import DataToolbar from '@/components/modulos/DataToolbar'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, financeiroUiActions } from '@/stores/modulos/financeiroUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { ShoppingBag, Building2, PackageCheck, FilePlus2, FileSpreadsheet } from 'lucide-react'

type Row = TableData

export default function ModulosComprasPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    financeiroUiActions.setTitulo({
      title: 'Compras',
      subtitle: 'Selecione uma opção para visualizar os dados',
    })
    financeiroUiActions.setTabs({
      options: [
        { value: 'fornecedores', label: 'Fornecedores' },
        { value: 'pedidos', label: 'Pedidos' },
        { value: 'recebimentos', label: 'Recebimentos' },
        { value: 'solicitacoes-compra', label: 'Solicitações' },
        { value: 'cotacoes-compra', label: 'Cotações' },
      ],
      selected: 'pedidos',
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
      case 'fornecedores':
        return [
          { accessorKey: 'nome_fantasia', header: 'Nome Fantasia' },
          { accessorKey: 'razao_social', header: 'Razão Social' },
          { accessorKey: 'cnpj', header: 'CNPJ' },
          { accessorKey: 'cidade_uf', header: 'Cidade/UF' },
          { accessorKey: 'telefone', header: 'Telefone' },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'pais', header: 'País' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'cadastrado_em', header: 'Cadastrado em', cell: ({ row }) => formatDate(row.original['cadastrado_em']) },
        ]
      case 'recebimentos':
        return [
          { accessorKey: 'pedido', header: 'Pedido' },
          { accessorKey: 'fornecedor', header: 'Fornecedor' },
          { accessorKey: 'data_recebimento', header: 'Data', cell: ({ row }) => formatDate(row.original['data_recebimento']) },
          { accessorKey: 'nota_fiscal', header: 'Nota Fiscal' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'observacoes', header: 'Observações' },
        ]
      case 'solicitacoes-compra':
        return [
          { accessorKey: 'data_solicitacao', header: 'Data Solicitação', cell: ({ row }) => formatDate(row.original['data_solicitacao']) },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'itens_solicitados', header: 'Itens Solicitados' },
          { accessorKey: 'observacoes', header: 'Observações' },
        ]
      case 'cotacoes-compra':
        return [
          { accessorKey: 'fornecedor', header: 'Fornecedor' },
          { accessorKey: 'data_envio', header: 'Data Envio', cell: ({ row }) => formatDate(row.original['data_envio']) },
          { accessorKey: 'data_retorno', header: 'Data Retorno', cell: ({ row }) => formatDate(row.original['data_retorno']) },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'valor_cotado', header: 'Valor Cotado', cell: ({ row }) => formatBRL(row.original['valor_cotado']) },
          { accessorKey: 'observacoes', header: 'Observações' },
        ]
      case 'pedidos':
      default:
        return [
          { accessorKey: 'numero_pedido', header: 'Número Pedido' },
          { accessorKey: 'fornecedor', header: 'Fornecedor' },
          { accessorKey: 'condicao_pagamento', header: 'Condição de Pagamento' },
          { accessorKey: 'data_pedido', header: 'Data Pedido', cell: ({ row }) => formatDate(row.original['data_pedido']) },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'valor_total', header: 'Valor Total (R$)', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'observacoes', header: 'Observações' },
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
        const url = `/api/modulos/compras?${params.toString()}`
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
  }, [tabs.selected, dateRange?.from, dateRange?.to])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'fornecedores':
          return <Building2 className="h-4 w-4" />
        case 'pedidos':
          return <ShoppingBag className="h-4 w-4" />
        case 'recebimentos':
          return <PackageCheck className="h-4 w-4" />
        case 'solicitacoes-compra':
          return <FilePlus2 className="h-4 w-4" />
        case 'cotacoes-compra':
          return <FileSpreadsheet className="h-4 w-4" />
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
            />
          </div>
          <div style={{ marginBottom: 0 }}>
            <TabsNav
              options={tabOptions}
              value={tabs.selected}
              onValueChange={(v) => financeiroUiActions.setTabs({ selected: v })}
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
              from={data.length === 0 ? 0 : 1}
              to={Math.min(tabelaUI.pageSize, data.length)}
              total={data.length}
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
                  columns={columns}
                  data={data}
                  enableSearch={tabelaUI.enableSearch}
                  showColumnToggle={tabelaUI.enableColumnToggle}
                  showPagination={tabelaUI.showPagination}
                  pageSize={tabelaUI.pageSize}
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
                />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
