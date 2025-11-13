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
import CadastroOportunidadeSheet from '@/components/crm/CadastroOportunidadeSheet'
import CadastroLeadSheet from '@/components/crm/CadastroLeadSheet'
import StatusBadge from '@/components/modulos/StatusBadge'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { Briefcase, UserPlus, CalendarClock, MessageSquare } from 'lucide-react'

type Row = TableData

export default function ModulosCrmPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    moduleUiActions.setTitulo({ title: 'CRM', subtitle: 'Relacione-se com clientes, leads e oportunidades' })
    moduleUiActions.setTabs({
      options: [
        { value: 'oportunidades', label: 'Oportunidades' },
        { value: 'leads', label: 'Leads' },
        { value: 'atividades', label: 'Atividades' },
        { value: 'interacoes', label: 'Interações' },
      ],
      selected: 'oportunidades',
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
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)
  const [refreshKey, setRefreshKey] = useState<number>(0)

  const formatDate = (value?: unknown, withTime?: boolean) => {
    if (!value) return ''
    try {
      const d = new Date(String(value))
      if (isNaN(d.getTime())) return String(value)
      return d.toLocaleString('pt-BR', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' })
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
      case 'leads':
        return [
          { accessorKey: 'lead', header: 'ID' },
          { accessorKey: 'nome', header: 'Nome' },
          { accessorKey: 'empresa', header: 'Empresa' },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'telefone', header: 'Telefone' },
          { accessorKey: 'origem', header: 'Origem' },
          { accessorKey: 'responsavel', header: 'Responsável' },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'tag', header: 'Tag' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em'], true) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em'], true) },
        ]
      case 'atividades':
        return [
          { accessorKey: 'atividade', header: 'ID' },
          { accessorKey: 'lead', header: 'Lead' },
          { accessorKey: 'oportunidade', header: 'Oportunidade' },
          { accessorKey: 'responsavel', header: 'Responsável' },
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'data_prevista', header: 'Data Prevista', cell: ({ row }) => formatDate(row.original['data_prevista']) },
          { accessorKey: 'data_conclusao', header: 'Data Conclusão', cell: ({ row }) => formatDate(row.original['data_conclusao']) },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em'], true) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em'], true) },
        ]
      case 'interacoes':
        return [
          { accessorKey: 'interacao', header: 'ID' },
          { accessorKey: 'lead', header: 'Lead' },
          { accessorKey: 'oportunidade', header: 'Oportunidade' },
          { accessorKey: 'responsavel', header: 'Responsável' },
          { accessorKey: 'canal', header: 'Canal' },
          { accessorKey: 'conteudo', header: 'Conteúdo' },
          { accessorKey: 'data_interacao', header: 'Data Interação', cell: ({ row }) => formatDate(row.original['data_interacao'], true) },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em'], true) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em'], true) },
        ]
      case 'oportunidades':
      default:
        return [
          { accessorKey: 'oportunidade', header: 'ID' },
          { accessorKey: 'lead', header: 'Lead' },
          { accessorKey: 'lead_empresa', header: 'Lead Empresa' },
          { accessorKey: 'cliente', header: 'Cliente' },
          { accessorKey: 'vendedor', header: 'Vendedor' },
          { accessorKey: 'territorio', header: 'Território' },
          { accessorKey: 'fase', header: 'Fase' },
          { accessorKey: 'ordem_fase', header: 'Ordem Fase' },
          { accessorKey: 'probabilidade_fase', header: '% Prob. Fase' },
          { accessorKey: 'valor_estimado', header: 'Valor Estimado', cell: ({ row }) => formatBRL(row.original['valor_estimado']) },
          { accessorKey: 'probabilidade', header: '% Probabilidade' },
          { accessorKey: 'data_prevista', header: 'Data Prevista', cell: ({ row }) => formatDate(row.original['data_prevista']) },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'motivo_perda', header: 'Motivo Perda' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em'], true) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em'], true) },
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
        // Date range em Oportunidades (data_prevista)
        if (tabs.selected === 'oportunidades') {
          if (dateRange?.from) {
            const d = dateRange.from
            params.set('de', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
          if (dateRange?.to) {
            const d = dateRange.to
            params.set('ate', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
        }
        // Server-side pagination
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        const url = `/api/modulos/crm?${params.toString()}`
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
  }, [tabs.selected, dateRange?.from, dateRange?.to, page, pageSize, refreshKey])

  // Reset page quando mudar de aba ou período
  useEffect(() => { setPage(1) }, [tabs.selected, dateRange?.from, dateRange?.to])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'oportunidades':
          return <Briefcase className="h-4 w-4" />
        case 'leads':
          return <UserPlus className="h-4 w-4" />
        case 'atividades':
          return <CalendarClock className="h-4 w-4" />
        case 'interacoes':
          return <MessageSquare className="h-4 w-4" />
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
              from={total === 0 ? 0 : (page - 1) * pageSize + 1}
              to={total === 0 ? 0 : Math.min(page * pageSize, total)}
              total={total}
              dateRange={tabs.selected === 'oportunidades' ? dateRange : undefined}
              onDateRangeChange={tabs.selected === 'oportunidades' ? setDateRange : undefined}
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
                tabs.selected === 'oportunidades' ? (
                  <CadastroOportunidadeSheet triggerLabel="Cadastrar" onCreated={() => setRefreshKey((k) => k + 1)} />
                ) : tabs.selected === 'leads' ? (
                  <CadastroLeadSheet triggerLabel="Cadastrar" onCreated={() => setRefreshKey((k) => k + 1)} />
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
                  pageIndex={page - 1}
                  serverSidePagination={true}
                  serverTotalRows={total}
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
    </SidebarProvider>
  )
}
