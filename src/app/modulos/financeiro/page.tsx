'use client'

import { useMemo } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'

import TituloModulo from '@/components/modulos/TituloModulo'
import OpcoesTabs from '@/components/modulos/OpcoesTabs'
import DataTable, { type TableData } from '@/components/widgets/Table'
import FinanceiroUiPanel from '@/components/modulos/FinanceiroUiPanel'
import FinanceiroToolbar from '@/components/modulos/FinanceiroToolbar'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, financeiroUiActions } from '@/stores/modulos/financeiroUiStore'

type Row = TableData

export default function ModulosFinanceiroPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    return name
  }

  const { columns, data } = useMemo((): { columns: ColumnDef<Row>[]; data: Row[] } => {
    switch (tabs.selected) {
      case 'contas':
        return {
          columns: [
            { accessorKey: 'banco', header: 'Banco' },
            { accessorKey: 'agencia', header: 'Agência' },
            { accessorKey: 'conta', header: 'Conta' },
            { accessorKey: 'saldo', header: 'Saldo' },
          ],
          data: [
            { banco: 'Banco A', agencia: '0001', conta: '12345-6', saldo: 15234.9 },
            { banco: 'Banco B', agencia: '0002', conta: '98765-4', saldo: 834.12 },
          ],
        }
      case 'pagamentos':
        return {
          columns: [
            { accessorKey: 'fornecedor', header: 'Fornecedor' },
            { accessorKey: 'documento', header: 'Documento' },
            { accessorKey: 'vencimento', header: 'Vencimento' },
            { accessorKey: 'valor', header: 'Valor' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { fornecedor: 'ACME Ltda', documento: 'NF 123', vencimento: '2025-10-30', valor: 1200.5, status: 'Pendente' },
            { fornecedor: 'Supply Co', documento: 'NF 456', vencimento: '2025-11-05', valor: 349.9, status: 'Pago' },
          ],
        }
      case 'recebimentos':
        return {
          columns: [
            { accessorKey: 'cliente', header: 'Cliente' },
            { accessorKey: 'pedido', header: 'Pedido' },
            { accessorKey: 'data', header: 'Data' },
            { accessorKey: 'valor', header: 'Valor' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { cliente: 'Cliente X', pedido: 'PO-1001', data: '2025-10-20', valor: 899.0, status: 'Recebido' },
            { cliente: 'Cliente Y', pedido: 'PO-1002', data: '2025-10-21', valor: 120.0, status: 'Em aberto' },
          ],
        }
      case 'visao':
      default:
        return {
          columns: [
            { accessorKey: 'indicador', header: 'Indicador' },
            { accessorKey: 'valor', header: 'Valor' },
          ],
          data: [
            { indicador: 'Saldo total', valor: 16068.02 },
            { indicador: 'A pagar (30d)', valor: 1550.4 },
            { indicador: 'A receber (30d)', valor: 1019.0 },
            { indicador: 'Caixa disponível', valor: 12450.0 },
            { indicador: 'Disponível em D+1', valor: 735.5 },
            { indicador: 'Limite de crédito', valor: 25000.0 },
            { indicador: 'Utilizado do limite', valor: 8200.0 },
            { indicador: 'Fluxo estimado (7d)', valor: 1450.75 },
            { indicador: 'Fluxo estimado (30d)', valor: 5340.2 },
            { indicador: 'Inadimplência (90d)', valor: 280.0 },
            { indicador: 'Boletos a compensar', valor: 320.0 },
            { indicador: 'Tarifas bancárias (mês)', valor: 95.8 },
          ],
        }
    }
  }, [tabs.selected])

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto">
        <div style={{ marginBottom: layout.mbTitle }}>
          <TituloModulo
            title={titulo.title}
            subtitle={titulo.subtitle}
            titleFontFamily={fontVar(titulo.titleFontFamily)}
            titleFontSize={titulo.titleFontSize}
            titleFontWeight={titulo.titleFontWeight}
            titleColor={titulo.titleColor}
            titleLetterSpacing={titulo.titleLetterSpacing}
          />
        </div>
        <div style={{ marginBottom: layout.mbTabs }}>
          <OpcoesTabs
            options={tabs.options}
            value={tabs.selected}
            onValueChange={(v) => financeiroUiActions.setTabs({ selected: v })}
            fontFamily={fontVar(tabs.fontFamily)}
            fontSize={tabs.fontSize}
            fontWeight={tabs.fontWeight}
            color={tabs.color}
            letterSpacing={tabs.letterSpacing}
          />
        </div>
        {/* Toolbar direita (paginador + botão) */}
        <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
          <FinanceiroToolbar
            from={data.length === 0 ? 0 : 1}
            to={Math.min(tabelaUI.pageSize, data.length)}
            total={data.length}
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
        </div>
        <FinanceiroUiPanel />
      </SidebarInset>
    </SidebarProvider>
  )
}
