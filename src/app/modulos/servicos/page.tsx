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
      case 'agendamentos':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'numero_os', header: 'Nº OS' },
          { accessorKey: 'tecnico', header: 'Técnico' },
          { accessorKey: 'data_agendada', header: 'Data Agendada', cell: ({ row }) => formatDate(row.original['data_agendada'], true) },
          { accessorKey: 'data_inicio', header: 'Início', cell: ({ row }) => formatDate(row.original['data_inicio'], true) },
          { accessorKey: 'data_fim', header: 'Fim', cell: ({ row }) => formatDate(row.original['data_fim'], true) },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'observacoes', header: 'Observações' },
        ]
      case 'tecnicos':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'tecnico', header: 'Técnico' },
          { accessorKey: 'cargo', header: 'Cargo' },
          { accessorKey: 'especialidade', header: 'Especialidade' },
          { accessorKey: 'custo_hora', header: 'Custo/Hora (R$)', cell: ({ row }) => formatBRL(row.original['custo_hora']) },
          { accessorKey: 'telefone', header: 'Telefone' },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'ordens_servico', header: 'Ordens de Serviço' },
          { accessorKey: 'horas_trabalhadas', header: 'Horas Trabalhadas' },
          { accessorKey: 'admissao', header: 'Admissão', cell: ({ row }) => formatDate(row.original['admissao']) },
        ]
      case 'clientes':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'cliente', header: 'Cliente' },
          { accessorKey: 'segmento', header: 'Segmento' },
          { accessorKey: 'telefone', header: 'Telefone' },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'cidade_uf', header: 'Cidade/UF' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'total_ordens', header: 'Total de Ordens' },
          { accessorKey: 'ultima_os', header: 'Última OS', cell: ({ row }) => formatDate(row.original['ultima_os']) },
        ]
      case 'servicos':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'servico', header: 'Serviço' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'categoria', header: 'Categoria' },
          { accessorKey: 'unidade_medida', header: 'Unidade de Medida' },
          { accessorKey: 'preco_base', header: 'Preço Base (R$)', cell: ({ row }) => formatBRL(row.original['preco_base']) },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'ordens-servico':
      default:
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'numero_os', header: 'Nº OS' },
          { accessorKey: 'cliente', header: 'Cliente' },
          { accessorKey: 'tecnico_responsavel', header: 'Técnico Responsável' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'prioridade', header: 'Prioridade' },
          { accessorKey: 'descricao_problema', header: 'Descrição do Problema' },
          { accessorKey: 'data_abertura', header: 'Abertura', cell: ({ row }) => formatDate(row.original['data_abertura']) },
          { accessorKey: 'data_prevista', header: 'Previsão', cell: ({ row }) => formatDate(row.original['data_prevista']) },
          { accessorKey: 'data_conclusao', header: 'Conclusão', cell: ({ row }) => formatDate(row.original['data_conclusao']) },
          { accessorKey: 'valor_estimado', header: 'Valor Estimado (R$)', cell: ({ row }) => formatBRL(row.original['valor_estimado']) },
          { accessorKey: 'valor_final', header: 'Valor Final (R$)', cell: ({ row }) => formatBRL(row.original['valor_final']) },
          { accessorKey: 'observacoes', header: 'Observações' },
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
        if (['ordens-servico', 'agendamentos', 'servicos'].includes(tabs.selected)) {
          if (dateRange?.from) {
            const d = dateRange.from
            params.set('de', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
          if (dateRange?.to) {
            const d = dateRange.to
            params.set('ate', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
        }
        const url = `/api/modulos/servicos?${params.toString()}`
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
              dateRange={['ordens-servico', 'agendamentos', 'servicos'].includes(tabs.selected) ? dateRange : undefined}
              onDateRangeChange={['ordens-servico', 'agendamentos', 'servicos'].includes(tabs.selected) ? setDateRange : undefined}
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
