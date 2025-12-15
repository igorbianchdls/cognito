'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusHeader from '@/components/navigation/nexus/NexusHeader'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import DataToolbar from '@/components/modulos/DataToolbar'
import CadastroOportunidadeSheet from '@/components/modulos/crm/CadastroOportunidadeSheet'
import CadastroLeadSheet from '@/components/modulos/crm/CadastroLeadSheet'
import StatusBadge from '@/components/modulos/StatusBadge'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { Briefcase, UserPlus, CalendarClock, MessageSquare, Package, GitBranch } from 'lucide-react'

type Row = TableData

type OportunidadeProdutoItem = {
  produto: string
  quantidade: number | null
  preco: number | null
  subtotal: number | null
}

type OportunidadeProdutosRow = Row & {
  produtos?: OportunidadeProdutoItem[]
}

type PipelineOportunidadeItem = {
  oportunidade: number
  lead: string | null
  empresa_lead: string | null
  vendedor: string | null
  territorio: string | null
  valor_estimado: number | null
  probabilidade: number | null
  data_prevista: string | null
  status: string | null
  motivo_perda: string | null
  descricao: string | null
  criado_em: string | null
  atualizado_em: string | null
}

type PipelineRow = Row & {
  oportunidades?: PipelineOportunidadeItem[]
}

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
        { value: 'oportunidades_produtos', label: 'Oportunidades + Produtos' },
        { value: 'pipeline', label: 'Pipeline' },
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

  const renderOportunidadeProdutos = (row: Row) => {
    const oportunidadeRow = row as OportunidadeProdutosRow
    const produtos = oportunidadeRow.produtos || []

    if (produtos.length === 0) return null

    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Produtos da Oportunidade</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Produto</th>
              <th className="text-right py-2 px-3">Quantidade</th>
              <th className="text-right py-2 px-3">Preço</th>
              <th className="text-right py-2 px-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.produto}</td>
                <td className="text-right py-2 px-3">{item.quantidade ?? '-'}</td>
                <td className="text-right py-2 px-3">{item.preco ? formatBRL(item.preco) : '-'}</td>
                <td className="text-right py-2 px-3">{item.subtotal ? formatBRL(item.subtotal) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderPipelineOportunidades = (row: Row) => {
    const pipelineRow = row as PipelineRow
    const oportunidades = pipelineRow.oportunidades || []

    if (oportunidades.length === 0) return null

    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Oportunidades da Fase</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">ID</th>
              <th className="text-left py-2 px-3">Lead</th>
              <th className="text-left py-2 px-3">Empresa</th>
              <th className="text-left py-2 px-3">Vendedor</th>
              <th className="text-right py-2 px-3">Valor Estimado</th>
              <th className="text-center py-2 px-3">Status</th>
              <th className="text-left py-2 px-3">Data Prevista</th>
            </tr>
          </thead>
          <tbody>
            {oportunidades.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.oportunidade}</td>
                <td className="py-2 px-3">{item.lead ?? '-'}</td>
                <td className="py-2 px-3">{item.empresa_lead ?? '-'}</td>
                <td className="py-2 px-3">{item.vendedor ?? '-'}</td>
                <td className="text-right py-2 px-3">{item.valor_estimado ? formatBRL(item.valor_estimado) : '-'}</td>
                <td className="text-center py-2 px-3"><StatusBadge value={item.status} type="status" /></td>
                <td className="py-2 px-3">{item.data_prevista ? formatDate(item.data_prevista) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
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
      case 'oportunidades_produtos':
        return [
          { accessorKey: 'oportunidade', header: 'ID' },
          { accessorKey: 'lead', header: 'Lead' },
          { accessorKey: 'empresa_lead', header: 'Empresa Lead' },
          { accessorKey: 'vendedor', header: 'Vendedor' },
          { accessorKey: 'territorio', header: 'Território' },
          { accessorKey: 'fase', header: 'Fase' },
          { accessorKey: 'ordem_fase', header: 'Ordem Fase' },
          { accessorKey: 'probabilidade_fase', header: '% Prob. Fase' },
          { accessorKey: 'valor_estimado', header: 'Valor Estimado', cell: ({ row }) => formatBRL(row.original['valor_estimado']) },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'motivo_perda', header: 'Motivo Perda' },
          { accessorKey: 'data_prevista', header: 'Data Prevista', cell: ({ row }) => formatDate(row.original['data_prevista']) },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em'], true) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em'], true) },
        ]
      case 'pipeline':
        return [
          { accessorKey: 'pipeline', header: 'Pipeline' },
          { accessorKey: 'fase', header: 'Fase' },
          { accessorKey: 'ordem_fase', header: 'Ordem' },
          { accessorKey: 'probabilidade_fase', header: '% Probabilidade' },
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
        case 'oportunidades_produtos':
          return <Package className="h-4 w-4" />
        case 'pipeline':
          return <GitBranch className="h-4 w-4" />
        default:
          return null
      }
    }
    return tabs.options.map((opt) => ({ ...opt, icon: iconFor(opt.value) })) as Opcao[]
  }, [tabs.options])

  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#fdfdfd' }}>
          <div className="flex flex-col h-full w-full">
            <NexusHeader viewMode={'dashboard'} onChangeViewMode={() => {}} borderless size="sm" showBreadcrumb={false} />
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2" data-page="nexus">
              <NexusPageContainer className="h-full">
                <div>
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
                  enableExpand={tabs.selected === 'oportunidades_produtos' || tabs.selected === 'pipeline'}
                  renderDetail={
                    tabs.selected === 'oportunidades_produtos'
                      ? renderOportunidadeProdutos
                      : tabs.selected === 'pipeline'
                      ? renderPipelineOportunidades
                      : undefined
                  }
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
                </div>
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
