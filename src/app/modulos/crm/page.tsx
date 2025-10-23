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
import { Briefcase, UserPlus, Building2, UserCircle2, CalendarClock, Megaphone } from 'lucide-react'

type Row = TableData

export default function ModulosCrmPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    financeiroUiActions.setTitulo({ title: 'CRM', subtitle: 'Relacione-se com clientes, leads e oportunidades' })
    financeiroUiActions.setTabs({
      options: [
        { value: 'oportunidades', label: 'Oportunidades' },
        { value: 'leads', label: 'Leads' },
        { value: 'contas', label: 'Contas' },
        { value: 'contatos', label: 'Contatos' },
        { value: 'atividades', label: 'Atividades' },
        { value: 'campanhas', label: 'Campanhas' },
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
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'lead', header: 'Lead' },
          { accessorKey: 'empresa', header: 'Empresa' },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'telefone', header: 'Telefone' },
          { accessorKey: 'origem', header: 'Origem' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'responsavel', header: 'Responsável' },
        ]
      case 'contas':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'setor', header: 'Setor' },
          { accessorKey: 'site', header: 'Site' },
          { accessorKey: 'telefone', header: 'Telefone' },
          { accessorKey: 'endereco_cobranca', header: 'Endereço de Cobrança' },
          { accessorKey: 'responsavel', header: 'Responsável' },
        ]
      case 'contatos':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'contato', header: 'Contato' },
          { accessorKey: 'cargo', header: 'Cargo' },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'telefone', header: 'Telefone' },
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'responsavel', header: 'Responsável' },
        ]
      case 'atividades':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'assunto', header: 'Assunto' },
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'data_vencimento', header: 'Data Vencimento', cell: ({ row }) => formatDate(row.original['data_vencimento'], true) },
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'contato', header: 'Contato' },
          { accessorKey: 'lead', header: 'Lead' },
          { accessorKey: 'oportunidade', header: 'Oportunidade' },
          { accessorKey: 'responsavel', header: 'Responsável' },
          { accessorKey: 'anotacoes', header: 'Anotações' },
        ]
      case 'campanhas':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'campanha', header: 'Campanha' },
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'inicio', header: 'Início', cell: ({ row }) => formatDate(row.original['inicio']) },
          { accessorKey: 'fim', header: 'Fim', cell: ({ row }) => formatDate(row.original['fim']) },
          { accessorKey: 'responsavel', header: 'Responsável' },
          { accessorKey: 'total_membros', header: 'Total Membros' },
        ]
      case 'oportunidades':
      default:
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'oportunidade', header: 'Oportunidade' },
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'responsavel', header: 'Responsável' },
          { accessorKey: 'estagio', header: 'Estágio' },
          { accessorKey: 'valor', header: 'Valor (R$)', cell: ({ row }) => formatBRL(row.original['valor']) },
          { accessorKey: 'probabilidade', header: '% Probabilidade' },
          { accessorKey: 'data_fechamento', header: 'Data Fechamento', cell: ({ row }) => formatDate(row.original['data_fechamento']) },
          { accessorKey: 'prioridade', header: 'Prioridade' },
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
        // Date range em Oportunidades (data_fechamento), Atividades (data_vencimento), Campanhas (inicio)
        if (['oportunidades', 'atividades', 'campanhas'].includes(tabs.selected)) {
          if (dateRange?.from) {
            const d = dateRange.from
            params.set('de', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
          if (dateRange?.to) {
            const d = dateRange.to
            params.set('ate', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
        }
        const url = `/api/modulos/crm?${params.toString()}`
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
        case 'oportunidades':
          return <Briefcase className="h-4 w-4" />
        case 'leads':
          return <UserPlus className="h-4 w-4" />
        case 'contas':
          return <Building2 className="h-4 w-4" />
        case 'contatos':
          return <UserCircle2 className="h-4 w-4" />
        case 'atividades':
          return <CalendarClock className="h-4 w-4" />
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
              dateRange={['oportunidades', 'atividades', 'campanhas'].includes(tabs.selected) ? dateRange : undefined}
              onDateRangeChange={['oportunidades', 'atividades', 'campanhas'].includes(tabs.selected) ? setDateRange : undefined}
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

