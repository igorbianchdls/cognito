'use client'

import { useEffect, useMemo } from 'react'
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
import { ShoppingCart, Users, UserCircle, Map, Users2, LayoutGrid } from 'lucide-react'

type Row = TableData

export default function ModulosVendasPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    financeiroUiActions.setTitulo({
      title: 'Vendas',
      subtitle: 'Selecione uma opção para visualizar os dados',
    })
    financeiroUiActions.setTabs({
      options: [
        { value: 'pedidos', label: 'Pedidos' },
        { value: 'clientes', label: 'Clientes' },
        { value: 'vendedores', label: 'Vendedores' },
        { value: 'territorios', label: 'Territórios' },
        { value: 'equipes', label: 'Equipes' },
        { value: 'canais', label: 'Canais' },
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

  const { columns, data } = useMemo((): { columns: ColumnDef<Row>[]; data: Row[] } => {
    switch (tabs.selected) {
      case 'pedidos':
      default:
        return {
          columns: [
            { accessorKey: 'numero', header: 'Pedido' },
            { accessorKey: 'cliente', header: 'Cliente' },
            { accessorKey: 'data', header: 'Data' },
            { accessorKey: 'valor', header: 'Valor' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { numero: 'PO-2001', cliente: 'ACME', data: '2025-10-20', valor: 1290.0, status: 'Faturado' },
            { numero: 'PO-2002', cliente: 'Beta Ltda', data: '2025-10-21', valor: 520.5, status: 'Em aberto' },
          ],
        }
      case 'clientes':
        return {
          columns: [
            { accessorKey: 'nome', header: 'Nome' },
            { accessorKey: 'email', header: 'Email' },
            { accessorKey: 'telefone', header: 'Telefone' },
            { accessorKey: 'segmento', header: 'Segmento' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { nome: 'João Silva', email: 'joao@exemplo.com', telefone: '(11) 99999-0000', segmento: 'B2C', status: 'Ativo' },
            { nome: 'Maria Souza', email: 'maria@exemplo.com', telefone: '(21) 98888-1111', segmento: 'B2B', status: 'Inativo' },
          ],
        }
      case 'vendedores':
        return {
          columns: [
            { accessorKey: 'nome', header: 'Nome' },
            { accessorKey: 'matricula', header: 'Matrícula' },
            { accessorKey: 'regional', header: 'Regional' },
            { accessorKey: 'meta', header: 'Meta (R$)' },
            { accessorKey: 'vendas', header: 'Vendas (R$)' },
          ],
          data: [
            { nome: 'Carlos Lima', matricula: 'V001', regional: 'Sudeste', meta: 50000, vendas: 43210 },
            { nome: 'Ana Pereira', matricula: 'V002', regional: 'Sul', meta: 40000, vendas: 38900 },
          ],
        }
      case 'territorios':
        return {
          columns: [
            { accessorKey: 'territorio', header: 'Território' },
            { accessorKey: 'regional', header: 'Regional' },
            { accessorKey: 'responsavel', header: 'Responsável' },
            { accessorKey: 'clientes', header: 'Clientes' },
            { accessorKey: 'vendas', header: 'Vendas (R$)' },
          ],
          data: [
            { territorio: 'SP Capital', regional: 'Sudeste', responsavel: 'Carlos Lima', clientes: 120, vendas: 210000 },
            { territorio: 'PR Norte', regional: 'Sul', responsavel: 'Ana Pereira', clientes: 80, vendas: 145000 },
          ],
        }
      case 'equipes':
        return {
          columns: [
            { accessorKey: 'equipe', header: 'Equipe' },
            { accessorKey: 'lider', header: 'Líder' },
            { accessorKey: 'membros', header: 'Membros' },
            { accessorKey: 'meta', header: 'Meta (R$)' },
            { accessorKey: 'vendas', header: 'Vendas (R$)' },
          ],
          data: [
            { equipe: 'Alpha', lider: 'Carlos Lima', membros: 5, meta: 200000, vendas: 178000 },
            { equipe: 'Beta', lider: 'Ana Pereira', membros: 4, meta: 160000, vendas: 152000 },
          ],
        }
      case 'canais':
        return {
          columns: [
            { accessorKey: 'canal', header: 'Canal' },
            { accessorKey: 'tipo', header: 'Tipo' },
            { accessorKey: 'status', header: 'Status' },
            { accessorKey: 'pedidos', header: 'Pedidos (30d)' },
            { accessorKey: 'receita', header: 'Receita (R$ 30d)' },
          ],
          data: [
            { canal: 'E-commerce', tipo: 'Online', status: 'Ativo', pedidos: 320, receita: 125000 },
            { canal: 'Loja Física', tipo: 'Offline', status: 'Ativo', pedidos: 210, receita: 98000 },
          ],
        }
    }
  }, [tabs.selected])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'pedidos':
          return <ShoppingCart className="h-4 w-4" />
        case 'clientes':
          return <Users className="h-4 w-4" />
        case 'vendedores':
          return <UserCircle className="h-4 w-4" />
        case 'territorios':
          return <Map className="h-4 w-4" />
        case 'equipes':
          return <Users2 className="h-4 w-4" />
        case 'canais':
          return <LayoutGrid className="h-4 w-4" />
        default:
          return null
      }
    }
    return tabs.options.map((opt) => ({ ...opt, icon: iconFor(opt.value) })) as Opcao[]
  }, [tabs.options])

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto">
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
        <div style={{ background: layout.contentBg, paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
          <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
            <DataToolbar
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
