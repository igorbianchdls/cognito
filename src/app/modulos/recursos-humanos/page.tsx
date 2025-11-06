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
import StatusBadge from '@/components/modulos/StatusBadge'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { Users, CalendarDays, FileText, BadgeDollarSign } from 'lucide-react'
import FuncionarioEditorSheet from '@/components/modulos/rh/FuncionarioEditorSheet'
import CadastroFuncionarioSheet from '@/components/modulos/rh/CadastroFuncionarioSheet'
import CadastroTipoAusenciaSheet from '@/components/modulos/rh/CadastroTipoAusenciaSheet'
import CadastroContratoSheet from '@/components/modulos/rh/CadastroContratoSheet'
import CadastroHistoricoSalarialSheet from '@/components/modulos/rh/CadastroHistoricoSalarialSheet'

type Row = TableData

export default function ModulosRecursosHumanosPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Recursos Humanos',
      subtitle: 'Selecione uma opção para visualizar os dados',
      titleFontFamily: 'var(--font-crimson-text)'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'funcionarios', label: 'Funcionários', icon: <Users className="text-slate-700" /> },
        { value: 'tipos-ausencia', label: 'Tipos de Ausência', icon: <CalendarDays className="text-blue-600" /> },
        { value: 'contratos', label: 'Contratos', icon: <FileText className="text-indigo-700" /> },
        { value: 'historico-salarial', label: 'Histórico Salarial', icon: <BadgeDollarSign className="text-emerald-700" /> },
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
  const [reloadKey, setReloadKey] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)

  // Editor
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<string | null>(null)
  const [funcionarioPrefill, setFuncionarioPrefill] = useState<{
    nome_completo?: string
    imagem_url?: string
    email_corporativo?: string
    telefone?: string
    status?: string
    data_nascimento?: string
  } | undefined>(undefined)

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

  

  const openEditor = (row: Row) => {
    const id = row['id']
    if (!id) return
    setSelectedFuncionarioId(String(id))
    setFuncionarioPrefill({
      nome_completo: row['funcionario'] ? String(row['funcionario']) : undefined,
      imagem_url: row['funcionario_imagem_url'] ? String(row['funcionario_imagem_url']) : undefined,
      email_corporativo: row['email_corporativo'] ? String(row['email_corporativo']) : undefined,
      telefone: row['telefone'] ? String(row['telefone']) : undefined,
      status: row['status'] ? String(row['status']) : undefined,
      data_nascimento: row['data_nascimento'] ? String(row['data_nascimento']) : undefined,
    })
    setEditorOpen(true)
  }

  const openFuncionarioEditorFromRow = (row: Row) => {
    const id = row['funcionario_id'] || row['id']
    if (!id) return
    setSelectedFuncionarioId(String(id))
    setFuncionarioPrefill({
      nome_completo: row['funcionario'] ? String(row['funcionario']) : undefined,
      imagem_url: row['funcionario_imagem_url'] ? String(row['funcionario_imagem_url']) : undefined,
      email_corporativo: row['email_corporativo'] ? String(row['email_corporativo']) : undefined,
      telefone: row['telefone'] ? String(row['telefone']) : undefined,
      status: row['status'] ? String(row['status']) : undefined,
      data_nascimento: row['data_nascimento'] ? String(row['data_nascimento']) : undefined,
    })
    setEditorOpen(true)
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'contratos':
        return [
          { accessorKey: 'id', header: 'ID' },
          {
            accessorKey: 'funcionario',
            header: 'Funcionário',
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['funcionario'] ? String(row.original['funcionario']) : 'Sem nome'}
                imageUrl={row.original['funcionario_imagem_url'] ? String(row.original['funcionario_imagem_url']) : undefined}
                onClick={() => openFuncionarioEditorFromRow(row.original)}
                clickable
              />
            )
          },
          { accessorKey: 'tipo_de_contrato', header: 'Tipo de Contrato' },
          { accessorKey: 'admissao', header: 'Admissão', cell: ({ row }) => formatDate(row.original['admissao']) },
          { accessorKey: 'demissao', header: 'Demissão', cell: ({ row }) => formatDate(row.original['demissao']) },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
        ]
      case 'historico-salarial':
        return [
          { accessorKey: 'id', header: 'ID' },
          {
            accessorKey: 'funcionario',
            header: 'Funcionário',
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['funcionario'] ? String(row.original['funcionario']) : 'Sem nome'}
                imageUrl={row.original['funcionario_imagem_url'] ? String(row.original['funcionario_imagem_url']) : undefined}
                onClick={() => openFuncionarioEditorFromRow(row.original)}
                clickable
              />
            )
          },
          { accessorKey: 'salario_base', header: 'Salário Base (R$)' },
          { accessorKey: 'tipo_de_pagamento', header: 'Tipo de Pagamento' },
          { accessorKey: 'inicio_vigencia', header: 'Início Vigência', cell: ({ row }) => formatDate(row.original['inicio_vigencia']) },
          { accessorKey: 'fim_vigencia', header: 'Fim Vigência', cell: ({ row }) => formatDate(row.original['fim_vigencia']) },
        ]
      case 'tipos-ausencia':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'tipo_de_ausencia', header: 'Tipo de Ausência' },
          { accessorKey: 'desconta_saldo_ferias', header: 'Desconta do Saldo de Férias', cell: ({ row }) => <StatusBadge value={row.original['desconta_saldo_ferias']} type="bool" /> },
        ]
      case 'funcionarios':
      default:
        return [
          { accessorKey: 'id', header: 'ID' },
          {
            accessorKey: 'funcionario',
            header: 'Funcionário',
            size: 250,
            minSize: 200,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['funcionario'] ? String(row.original['funcionario']) : 'Sem nome'}
                subtitle={row.original['cargo'] ? String(row.original['cargo']) : 'Sem cargo'}
                imageUrl={row.original['funcionario_imagem_url'] ? String(row.original['funcionario_imagem_url']) : undefined}
                onClick={() => openEditor(row.original)}
                clickable
              />
            )
          },
          { accessorKey: 'cargo', header: 'Cargo' },
          {
            accessorKey: 'departamento',
            header: 'Departamento',
            cell: ({ row }) => <StatusBadge value={row.original['departamento']} type="departamento" />
          },
          {
            accessorKey: 'gestor_direto',
            header: 'Gestor Direto',
            size: 250,
            minSize: 200,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['gestor_direto'] ? String(row.original['gestor_direto']) : 'Sem gestor'}
                subtitle={row.original['cargo_gestor'] ? String(row.original['cargo_gestor']) : 'Sem cargo'}
              />
            )
          },
          { accessorKey: 'email_corporativo', header: 'E-mail Corporativo' },
          { accessorKey: 'telefone', header: 'Telefone' },
          {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" />
          },
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
        if (!(tabs.selected === 'departamentos' || tabs.selected === 'cargos')) {
          params.set('page', String(page))
          params.set('pageSize', String(pageSize))
        }
        const url = `/api/modulos/rh?${params.toString()}`
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
  }, [tabs.selected, dateRange?.from, dateRange?.to, page, pageSize, reloadKey, refreshKey])

  // Reset page quando mudar de aba ou período
  useEffect(() => { setPage(1) }, [tabs.selected, dateRange?.from, dateRange?.to])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'funcionarios':
          return <Users className="h-4 w-4" />
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
              subtitleFontFamily={fontVar(titulo.subtitleFontFamily)}
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
              from={(!(tabs.selected === 'departamentos' || tabs.selected === 'cargos') ? total : data.length) === 0 ? 0 : (page - 1) * pageSize + 1}
              to={(!(tabs.selected === 'departamentos' || tabs.selected === 'cargos') ? total : data.length) === 0 ? 0 : Math.min(page * pageSize, (!(tabs.selected === 'departamentos' || tabs.selected === 'cargos') ? total : data.length))}
              total={!(tabs.selected === 'departamentos' || tabs.selected === 'cargos') ? total : data.length}
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
              actionComponent={
                tabs.selected === 'funcionarios' ? (
                  <CadastroFuncionarioSheet
                    triggerLabel="Cadastrar"
                    onCreated={() => setRefreshKey((k) => k + 1)}
                  />
                ) : tabs.selected === 'tipos-ausencia' ? (
                  <CadastroTipoAusenciaSheet
                    triggerLabel="Cadastrar"
                    onCreated={() => setRefreshKey((k) => k + 1)}
                  />
                ) : tabs.selected === 'contratos' ? (
                  <CadastroContratoSheet
                    triggerLabel="Cadastrar"
                    onCreated={() => setRefreshKey((k) => k + 1)}
                  />
                ) : tabs.selected === 'historico-salarial' ? (
                  <CadastroHistoricoSalarialSheet
                    triggerLabel="Cadastrar"
                    onCreated={() => setRefreshKey((k) => k + 1)}
                  />
                ) : undefined
              }
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
                  enableSearch={tabelaUI.enableSearch}
                  showColumnToggle={tabelaUI.enableColumnToggle}
                  showPagination={tabelaUI.showPagination}
                  pageSize={pageSize}
                  pageIndex={!(tabs.selected === 'departamentos' || tabs.selected === 'cargos') ? page - 1 : undefined}
                  serverSidePagination={!(tabs.selected === 'departamentos' || tabs.selected === 'cargos')}
                  serverTotalRows={!(tabs.selected === 'departamentos' || tabs.selected === 'cargos') ? total : undefined}
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
      <FuncionarioEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        funcionarioId={selectedFuncionarioId}
        funcionarioPrefill={funcionarioPrefill}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </SidebarProvider>
  )
}
