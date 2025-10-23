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
import { Users, Briefcase, Building, CalendarDays } from 'lucide-react'

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
        { value: 'tipos-ausencia', label: 'Tipos de Ausência' },
        { value: 'contratos', label: 'Contratos' },
        { value: 'historico-salarial', label: 'Histórico Salarial' },
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

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'contratos':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'funcionario', header: 'Funcionário' },
          { accessorKey: 'tipo_de_contrato', header: 'Tipo de Contrato' },
          { accessorKey: 'admissao', header: 'Admissão', cell: ({ row }) => formatDate(row.original['admissao']) },
          { accessorKey: 'demissao', header: 'Demissão', cell: ({ row }) => formatDate(row.original['demissao']) },
          { accessorKey: 'status', header: 'Status' },
        ]
      case 'historico-salarial':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'funcionario', header: 'Funcionário' },
          { accessorKey: 'salario_base', header: 'Salário Base (R$)' },
          { accessorKey: 'tipo_de_pagamento', header: 'Tipo de Pagamento' },
          { accessorKey: 'inicio_vigencia', header: 'Início Vigência', cell: ({ row }) => formatDate(row.original['inicio_vigencia']) },
          { accessorKey: 'fim_vigencia', header: 'Fim Vigência', cell: ({ row }) => formatDate(row.original['fim_vigencia']) },
        ]
      case 'cargos':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'cargo', header: 'Cargo' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'qtd_funcionarios', header: 'Qtd Funcionários' },
        ]
      case 'departamentos':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'departamento', header: 'Departamento' },
          { accessorKey: 'departamento_pai', header: 'Departamento Pai' },
          { accessorKey: 'gestor', header: 'Gestor' },
          { accessorKey: 'qtd_funcionarios', header: 'Qtd Funcionários' },
        ]
      case 'tipos-ausencia':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'tipo_de_ausencia', header: 'Tipo de Ausência' },
          { accessorKey: 'desconta_saldo_ferias', header: 'Desconta do Saldo de Férias' },
        ]
      case 'funcionarios':
      default:
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'funcionario', header: 'Funcionário' },
          { accessorKey: 'cargo', header: 'Cargo' },
          { accessorKey: 'departamento', header: 'Departamento' },
          { accessorKey: 'gestor_direto', header: 'Gestor Direto' },
          { accessorKey: 'email_corporativo', header: 'E-mail Corporativo' },
          { accessorKey: 'telefone', header: 'Telefone' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'data_nascimento', header: 'Data de Nascimento', cell: ({ row }) => formatDate(row.original['data_nascimento']) },
          { accessorKey: 'data_criacao', header: 'Data de Criação', cell: ({ row }) => formatDate(row.original['data_criacao']) },
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
        if (['funcionarios', 'contratos', 'historico-salarial'].includes(tabs.selected)) {
          if (dateRange?.from) {
            const d = dateRange.from
            params.set('de', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
          if (dateRange?.to) {
            const d = dateRange.to
            params.set('ate', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
        }
        const url = `/api/modulos/rh?${params.toString()}`
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
        case 'funcionarios':
          return <Users className="h-4 w-4" />
        case 'cargos':
          return <Briefcase className="h-4 w-4" />
        case 'departamentos':
          return <Building className="h-4 w-4" />
        case 'tipos-ausencia':
          return <CalendarDays className="h-4 w-4" />
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
              dateRange={['funcionarios', 'contratos', 'historico-salarial'].includes(tabs.selected) ? dateRange : undefined}
              onDateRangeChange={['funcionarios', 'contratos', 'historico-salarial'].includes(tabs.selected) ? setDateRange : undefined}
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
