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
import { Megaphone } from 'lucide-react'

type Row = TableData

export default function ModulosTrafegoPagoPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    financeiroUiActions.setTitulo({
      title: 'Tráfego Pago',
      subtitle: 'Campanhas pagas e performance',
    })
    financeiroUiActions.setTabs({
      options: [
        { value: 'contas-ads', label: 'Contas de Anúncio' },
        { value: 'campanhas', label: 'Campanhas' },
        { value: 'grupos-anuncio', label: 'Grupos de Anúncio' },
        { value: 'anuncios', label: 'Anúncios' },
      ],
      selected: 'campanhas',
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
      case 'contas-ads':
        return [
          { accessorKey: 'conta', header: 'Conta de Anúncios' },
          { accessorKey: 'plataforma', header: 'Plataforma' },
          { accessorKey: 'conectado_em', header: 'Conectado em', cell: ({ row }) => formatDate(row.original['conectado_em']) },
          { accessorKey: 'gasto_total', header: 'Gasto Total (R$)', cell: ({ row }) => formatBRL(row.original['gasto_total']) },
          { accessorKey: 'impressoes', header: 'Impressões' },
          { accessorKey: 'cliques', header: 'Cliques' },
          { accessorKey: 'ctr_medio', header: 'CTR Médio (%)' },
          { accessorKey: 'cpc_medio', header: 'CPC Médio (R$)' },
          { accessorKey: 'roas_medio', header: 'ROAS Médio' },
        ]
      case 'grupos-anuncio':
        return [
          { accessorKey: 'grupo', header: 'Grupo de Anúncios' },
          { accessorKey: 'campanha', header: 'Campanha' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'orcamento_diario', header: 'Orçamento Diário (R$)', cell: ({ row }) => formatBRL(row.original['orcamento_diario']) },
          { accessorKey: 'gasto_total', header: 'Gasto Total (R$)', cell: ({ row }) => formatBRL(row.original['gasto_total']) },
          { accessorKey: 'impressoes', header: 'Impressões' },
          { accessorKey: 'cliques', header: 'Cliques' },
          { accessorKey: 'ctr', header: 'CTR (%)' },
          { accessorKey: 'cpc', header: 'CPC (R$)' },
          { accessorKey: 'roas', header: 'ROAS' },
        ]
      case 'anuncios':
        return [
          { accessorKey: 'titulo', header: 'Título do Anúncio' },
          { accessorKey: 'plataforma', header: 'Plataforma' },
          { accessorKey: 'campanha', header: 'Campanha' },
          { accessorKey: 'grupo', header: 'Grupo de Anúncios' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'publicado_em', header: 'Publicado em', cell: ({ row }) => formatDate(row.original['publicado_em']) },
          { accessorKey: 'gasto', header: 'Gasto (R$)', cell: ({ row }) => formatBRL(row.original['gasto']) },
          { accessorKey: 'impressoes', header: 'Impressões' },
          { accessorKey: 'cliques', header: 'Cliques' },
          { accessorKey: 'ctr', header: 'CTR (%)' },
          { accessorKey: 'cpc', header: 'CPC (R$)' },
          { accessorKey: 'conversoes', header: 'Conversões' },
          { accessorKey: 'cpa', header: 'CPA (R$)' },
          { accessorKey: 'roas', header: 'ROAS' },
        ]
      case 'campanhas':
      default:
        return [
          { accessorKey: 'campanha', header: 'Campanha' },
          { accessorKey: 'objetivo', header: 'Objetivo' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'conta', header: 'Conta de Anúncios' },
          { accessorKey: 'orcamento_total', header: 'Orçamento Total (R$)', cell: ({ row }) => formatBRL(row.original['orcamento_total']) },
          { accessorKey: 'inicio', header: 'Início', cell: ({ row }) => formatDate(row.original['inicio']) },
          { accessorKey: 'fim', header: 'Fim', cell: ({ row }) => formatDate(row.original['fim']) },
          { accessorKey: 'gasto_total', header: 'Gasto Total (R$)', cell: ({ row }) => formatBRL(row.original['gasto_total']) },
          { accessorKey: 'impressoes', header: 'Impressões' },
          { accessorKey: 'cliques', header: 'Cliques' },
          { accessorKey: 'conversoes', header: 'Conversões' },
          { accessorKey: 'ctr', header: 'CTR (%)' },
          { accessorKey: 'cpc', header: 'CPC (R$)' },
          { accessorKey: 'roas', header: 'ROAS' },
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
        const url = `/api/modulos/trafego-pago?${params.toString()}`
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
        case 'campanhas':
          return <Megaphone className="h-4 w-4" />
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
