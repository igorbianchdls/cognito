"use client"

import { useMemo, useState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import DataToolbar from '@/components/modulos/DataToolbar'
import DataTable, { type TableData } from '@/components/widgets/Table'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { List } from 'lucide-react'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, contabilidadeUiActions } from '@/stores/modulos/contabilidadeUiStore'

type Row = TableData

export default function ModulosContabilidadePage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)

  useEffect(() => {
    contabilidadeUiActions.setTabs({
      options: [
        { value: 'lancamentos', label: 'Lançamentos' },
        { value: 'plano-contas', label: 'Plano de Contas' },
        { value: 'balancete', label: 'Balancete' },
        { value: 'dre', label: 'DRE' },
        { value: 'balanco', label: 'Balanço Patrimonial' },
        { value: 'obrigacoes', label: 'Obrigações/Impostos' },
      ],
      selected: 'lancamentos',
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
  const formatBRL = (value?: unknown) => {
    const n = Number(value ?? 0)
    return isNaN(n) ? String(value ?? '') : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'lancamentos':
        return [
          { accessorKey: 'data', header: 'Data', cell: ({ row }) => formatDate(row.original['data']) },
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'historico', header: 'Histórico' },
          { accessorKey: 'valor', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor']) },
        ]
      case 'plano-contas':
        return [
          { accessorKey: 'codigo', header: 'Código' },
          { accessorKey: 'nome', header: 'Nome' },
          { accessorKey: 'tipo', header: 'Tipo' },
        ]
      case 'balancete':
        return [
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'debito', header: 'Débito', cell: ({ row }) => formatBRL(row.original['debito']) },
          { accessorKey: 'credito', header: 'Crédito', cell: ({ row }) => formatBRL(row.original['credito']) },
          { accessorKey: 'saldo', header: 'Saldo', cell: ({ row }) => formatBRL(row.original['saldo']) },
        ]
      case 'dre':
        return [
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'valor', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor']) },
        ]
      case 'balanco':
        return [
          { accessorKey: 'grupo', header: 'Grupo' },
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'valor', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor']) },
        ]
      case 'obrigacoes':
      default:
        return [
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'periodo', header: 'Período' },
          { accessorKey: 'status', header: 'Status' },
        ]
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
              titleFontFamily={titulo.titleFontFamily}
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
              onValueChange={(v) => contabilidadeUiActions.setTabs({ selected: v })}
              fontFamily={tabs.fontFamily}
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
            />
          </div>
        </div>
        <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
          <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
            <DataToolbar
              from={0}
              to={0}
              total={0}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              fontFamily={tabs.fontFamily}
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
              <DataTable
                columns={columns}
                data={[]}
                enableSearch={tabelaUI.enableSearch}
                showColumnToggle={tabelaUI.enableColumnToggle}
                showPagination={tabelaUI.showPagination}
                pageSize={tabelaUI.pageSize}
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
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
