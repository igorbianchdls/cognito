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
import { Wrench, Calendar, User, Users, List } from 'lucide-react'

type Row = TableData

export default function ModulosServicosPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    financeiroUiActions.setTitulo({
      title: 'Serviços',
      subtitle: 'Selecione uma opção para visualizar os dados',
    })
    financeiroUiActions.setTabs({
      options: [
        { value: 'ordens-servico', label: 'Ordens de Serviço' },
        { value: 'agendamentos', label: 'Agendamentos' },
        { value: 'tecnicos', label: 'Técnicos' },
        { value: 'clientes', label: 'Clientes' },
        { value: 'servicos', label: 'Serviços' },
      ],
      selected: 'ordens-servico',
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
      case 'ordens-servico':
      default:
        return {
          columns: [
            { accessorKey: 'os', header: 'OS' },
            { accessorKey: 'cliente', header: 'Cliente' },
            { accessorKey: 'data', header: 'Data' },
            { accessorKey: 'tecnico', header: 'Técnico' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { os: 'OS-5001', cliente: 'Cliente X', data: '2025-10-19', tecnico: 'João', status: 'Em execução' },
            { os: 'OS-5002', cliente: 'Cliente Y', data: '2025-10-22', tecnico: 'Maria', status: 'Concluída' },
          ],
        }
      case 'agendamentos':
        return {
          columns: [
            { accessorKey: 'id', header: 'ID' },
            { accessorKey: 'data_hora', header: 'Data/Hora' },
            { accessorKey: 'cliente', header: 'Cliente' },
            { accessorKey: 'tecnico', header: 'Técnico' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { id: 'AG-1001', data_hora: '2025-10-25 14:00', cliente: 'Cliente X', tecnico: 'João', status: 'Confirmado' },
            { id: 'AG-1002', data_hora: '2025-10-26 09:30', cliente: 'Cliente Z', tecnico: 'Pedro', status: 'Pendente' },
          ],
        }
      case 'tecnicos':
        return {
          columns: [
            { accessorKey: 'nome', header: 'Nome' },
            { accessorKey: 'especialidade', header: 'Especialidade' },
            { accessorKey: 'regional', header: 'Regional' },
            { accessorKey: 'os_abertas', header: 'OS Abertas' },
            { accessorKey: 'avaliacao', header: 'Avaliação' },
          ],
          data: [
            { nome: 'João', especialidade: 'Elétrica', regional: 'Sudeste', os_abertas: 3, avaliacao: 4.7 },
            { nome: 'Maria', especialidade: 'Hidráulica', regional: 'Sul', os_abertas: 1, avaliacao: 4.9 },
          ],
        }
      case 'clientes':
        return {
          columns: [
            { accessorKey: 'nome', header: 'Nome' },
            { accessorKey: 'telefone', header: 'Telefone' },
            { accessorKey: 'cidade', header: 'Cidade' },
            { accessorKey: 'os_abertas', header: 'OS Abertas' },
            { accessorKey: 'ultima_os', header: 'Última OS' },
          ],
          data: [
            { nome: 'Cliente X', telefone: '(11) 99999-0000', cidade: 'São Paulo', os_abertas: 1, ultima_os: '2025-10-19' },
            { nome: 'Cliente Y', telefone: '(21) 98888-1111', cidade: 'Rio de Janeiro', os_abertas: 0, ultima_os: '2025-09-28' },
          ],
        }
      case 'servicos':
        return {
          columns: [
            { accessorKey: 'codigo', header: 'Código' },
            { accessorKey: 'descricao', header: 'Descrição' },
            { accessorKey: 'categoria', header: 'Categoria' },
            { accessorKey: 'preco_base', header: 'Preço Base (R$)' },
          ],
          data: [
            { codigo: 'SRV-001', descricao: 'Instalação elétrica', categoria: 'Elétrica', preco_base: 350 },
            { codigo: 'SRV-002', descricao: 'Troca de registro', categoria: 'Hidráulica', preco_base: 180 },
          ],
        }
    }
  }, [tabs.selected])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'ordens-servico':
          return <Wrench className="h-4 w-4" />
        case 'agendamentos':
          return <Calendar className="h-4 w-4" />
        case 'tecnicos':
          return <User className="h-4 w-4" />
        case 'clientes':
          return <Users className="h-4 w-4" />
        case 'servicos':
          return <List className="h-4 w-4" />
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
