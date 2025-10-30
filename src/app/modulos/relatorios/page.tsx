"use client"

import { useMemo, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { BarChart3, DollarSign, ShoppingCart, Megaphone } from 'lucide-react'
import { $titulo, $tabs, $tabelaUI, $layout, financeiroUiActions } from '@/stores/modulos/financeiroUiStore'
import DRETable from '@/components/relatorios/DRETable'
import BalanceSheetTable from '@/components/relatorios/BalanceSheetTable'
import CashFlowTable from '@/components/relatorios/CashFlowTable'
import DMPLTable from '@/components/relatorios/DMPLTable'
import ReportsFiltersBar from '@/components/relatorios/ReportsFiltersBar'
import { $reportsFilters } from '@/stores/reportsFiltersStore'

export default function ModulosRelatoriosPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const filters = useStore($reportsFilters)

  // Initialize UI and tabs options similar to other modules
  useEffect(() => {
    financeiroUiActions.setTitulo({ title: 'Relatórios', subtitle: 'Central de relatórios gerenciais' })
    financeiroUiActions.setTabs({
      options: [
        { value: 'dre', label: 'DRE' },
        { value: 'balanco', label: 'Balanço' },
        { value: 'dfc', label: 'Fluxo de Caixa' },
        { value: 'balancete', label: 'Balancete' },
        { value: 'dmpl', label: 'DMPL' },
        { value: 'executivo', label: 'Executivo' },
        { value: 'financeiro', label: 'Financeiro' },
        { value: 'vendas', label: 'Vendas' },
        { value: 'marketing', label: 'Marketing' },
      ],
      selected: 'dre',
    })
  }, [])

  const iconFor = (v: string) => {
    switch (v) {
      case 'balanco':
        return <BarChart3 className="h-4 w-4" />
      case 'dfc':
        return <BarChart3 className="h-4 w-4" />
      case 'balancete':
        return <BarChart3 className="h-4 w-4" />
      case 'dmpl':
        return <BarChart3 className="h-4 w-4" />
      case 'dre':
        return <BarChart3 className="h-4 w-4" />
      case 'executivo':
        return <BarChart3 className="h-4 w-4" />
      case 'financeiro':
        return <DollarSign className="h-4 w-4" />
      case 'vendas':
        return <ShoppingCart className="h-4 w-4" />
      case 'marketing':
        return <Megaphone className="h-4 w-4" />
      default:
        return null
    }
  }

  const tabOptions: Opcao[] = (tabs.options || []).map(opt => ({ ...opt, icon: iconFor(opt.value) }))

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    return name
  }

  type Row = TableData

  const { columns, data }: { columns: ColumnDef<Row>[]; data: Row[] } = useMemo(() => {
    switch (tabs.selected) {
      case 'balancete': {
        const columns: ColumnDef<Row>[] = [
          { accessorKey: 'codigo', header: 'Código' },
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'debito', header: 'Débito' },
          { accessorKey: 'credito', header: 'Crédito' },
          { accessorKey: 'saldo', header: 'Saldo' },
        ]
        const data: Row[] = [
          { codigo: '1.1.1.01', conta: 'Caixa', debito: 120000, credito: 0, saldo: 120000 },
          { codigo: '1.1.1.02', conta: 'Bancos', debito: 5000, credito: 0, saldo: 5000 },
          { codigo: '1.1.2.01', conta: 'Clientes', debito: 81000, credito: 0, saldo: 81000 },
          { codigo: '1.1.3.01', conta: 'Estoques', debito: 56000, credito: 0, saldo: 56000 },
          { codigo: '2.1.1.01', conta: 'Fornecedores', debito: 0, credito: 73000, saldo: -73000 },
          { codigo: '2.1.2.01', conta: 'Obrigações trabalhistas', debito: 0, credito: 23000, saldo: -23000 },
          { codigo: '3.1.1.01', conta: 'Capital Social', debito: 0, credito: 180000, saldo: -180000 },
          { codigo: '3.1.2.01', conta: 'Reservas', debito: 0, credito: 35000, saldo: -35000 },
        ]
        return { columns, data }
      }
      case 'dre':
        return { columns: [], data: [] }
      case 'financeiro':
        return {
          columns: [
            { accessorKey: 'conta', header: 'Conta' },
            { accessorKey: 'periodo', header: 'Período' },
            { accessorKey: 'valor', header: 'Valor' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { conta: 'Receita', periodo: 'Mês atual', valor: 125000, status: 'OK' },
            { conta: 'Despesa', periodo: 'Mês atual', valor: 83000, status: 'OK' },
            { conta: 'Margem', periodo: 'Mês atual', valor: 42000, status: 'OK' },
          ],
        }
      case 'vendas':
        return {
          columns: [
            { accessorKey: 'produto', header: 'Produto' },
            { accessorKey: 'quantidade', header: 'Qtd' },
            { accessorKey: 'faturamento', header: 'Faturamento' },
            { accessorKey: 'canal', header: 'Canal' },
          ],
          data: [
            { produto: 'SKU-1001', quantidade: 120, faturamento: 36000, canal: 'E-commerce' },
            { produto: 'SKU-2040', quantidade: 75, faturamento: 22500, canal: 'Marketplace' },
            { produto: 'SKU-3344', quantidade: 58, faturamento: 17400, canal: 'E-commerce' },
          ],
        }
      case 'marketing':
        return {
          columns: [
            { accessorKey: 'campanha', header: 'Campanha' },
            { accessorKey: 'impressoes', header: 'Impressões' },
            { accessorKey: 'cliques', header: 'Cliques' },
            { accessorKey: 'ctr', header: 'CTR (%)' },
          ],
          data: [
            { campanha: 'Awareness Q4', impressoes: 120000, cliques: 7200, ctr: 6.0 },
            { campanha: 'Promo Black', impressoes: 85000, cliques: 5950, ctr: 7.0 },
            { campanha: 'Retargeting', impressoes: 56000, cliques: 3920, ctr: 7.0 },
          ],
        }
      case 'executivo':
      default:
        return {
          columns: [
            { accessorKey: 'indicador', header: 'Indicador' },
            { accessorKey: 'valor', header: 'Valor' },
            { accessorKey: 'variacao', header: 'Variação' },
          ],
          data: [
            { indicador: 'Receita', valor: 125000, variacao: '+8.2%' },
            { indicador: 'CAC', valor: 47.3, variacao: '-3.1%' },
            { indicador: 'Conversão', valor: '2.4%', variacao: '+0.2pp' },
          ],
        }
    }
  }, [tabs.selected])

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
          {/* Filtros de relatório (compartilhável entre abas) */}
          <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
            <ReportsFiltersBar />
          </div>
          <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
            {(() => {
              switch (tabs.selected) {
                case 'balanco':
                  return <BalanceSheetTable periods={periods} />
                case 'dfc':
                  return <CashFlowTable periods={periods} />
                case 'dmpl':
                  return <DMPLTable periods={periods} />
                case 'dre':
                  return <DRETable periods={periods} />
                case 'balancete':
                  return (
                    <div className="border-y bg-background" style={{ borderColor: tabelaUI.borderColor }}>
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
                    </div>
                  )
                default:
                  return (
                    <div className="border-y bg-background" style={{ borderColor: tabelaUI.borderColor }}>
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
                    </div>
                  )
              }
            })()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
  // Build periods (mensal) from dateRange
  const periods = useMemo(() => {
    if (filters.cadence !== 'mensal') {
      return [
        { key: '2025-01', label: 'Janeiro' },
        { key: '2025-02', label: 'Fevereiro' },
        { key: '2025-03', label: 'Março' },
      ]
    }
    const from = filters.dateRange?.from
    const to = filters.dateRange?.to
    if (!from || !to) {
      // default last 3 months relative to today
      const d = new Date()
      const mk = (yr: number, m: number) => `${yr}-${String(m + 1).padStart(2, '0')}`
      const arr: { key: string; label: string }[] = []
      for (let i = 2; i >= 0; i--) {
        const x = new Date(d.getFullYear(), d.getMonth() - i, 1)
        arr.push({ key: mk(x.getFullYear(), x.getMonth()), label: x.toLocaleString('pt-BR', { month: 'long' }) })
      }
      return arr
    }
    // generate month list between from and to
    const list: { key: string; label: string }[] = []
    const cur = new Date(from.getFullYear(), from.getMonth(), 1)
    const end = new Date(to.getFullYear(), to.getMonth(), 1)
    while (cur <= end && list.length < 24) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`
      const label = cur.toLocaleString('pt-BR', { month: 'long' })
      list.push({ key, label })
      cur.setMonth(cur.getMonth() + 1)
    }
    return list
  }, [filters.cadence, filters.dateRange?.from, filters.dateRange?.to])
