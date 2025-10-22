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
import { Users, Briefcase, Building } from 'lucide-react'

type Row = TableData

export default function ModulosRecursosHumanosPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    financeiroUiActions.setTitulo({
      title: 'Recursos Humanos',
      subtitle: 'Selecione uma opção para visualizar os dados',
    })
    financeiroUiActions.setTabs({
      options: [
        { value: 'funcionarios', label: 'Funcionários' },
        { value: 'cargos', label: 'Cargos' },
        { value: 'departamentos', label: 'Departamentos' },
      ],
      selected: 'funcionarios',
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
      case 'funcionarios':
      default:
        return {
          columns: [
            { accessorKey: 'nome', header: 'Nome' },
            { accessorKey: 'cargo', header: 'Cargo' },
            { accessorKey: 'departamento', header: 'Departamento' },
            { accessorKey: 'admissao', header: 'Admissão' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { nome: 'Ana Lima', cargo: 'Analista RH', departamento: 'RH', admissao: '2023-04-15', status: 'Ativo' },
            { nome: 'Carlos Souza', cargo: 'Dev Frontend', departamento: 'Tecnologia', admissao: '2024-02-10', status: 'Ativo' },
          ],
        }
      case 'cargos':
        return {
          columns: [
            { accessorKey: 'cargo', header: 'Cargo' },
            { accessorKey: 'nivel', header: 'Nível' },
            { accessorKey: 'salario_base', header: 'Salário Base (R$)' },
            { accessorKey: 'departamento', header: 'Departamento' },
          ],
          data: [
            { cargo: 'Analista RH', nivel: 'Pleno', salario_base: 6000, departamento: 'RH' },
            { cargo: 'Dev Frontend', nivel: 'Sênior', salario_base: 12000, departamento: 'Tecnologia' },
          ],
        }
      case 'departamentos':
        return {
          columns: [
            { accessorKey: 'departamento', header: 'Departamento' },
            { accessorKey: 'gestor', header: 'Gestor' },
            { accessorKey: 'colaboradores', header: 'Colaboradores' },
            { accessorKey: 'orcamento', header: 'Orçamento (R$)' },
          ],
          data: [
            { departamento: 'RH', gestor: 'Mariana Freitas', colaboradores: 6, orcamento: 300000 },
            { departamento: 'Tecnologia', gestor: 'Paulo Nogueira', colaboradores: 18, orcamento: 1500000 },
          ],
        }
    }
  }, [tabs.selected])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'funcionarios':
          return <Users className="h-4 w-4" />
        case 'cargos':
          return <Briefcase className="h-4 w-4" />
        case 'departamentos':
          return <Building className="h-4 w-4" />
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
