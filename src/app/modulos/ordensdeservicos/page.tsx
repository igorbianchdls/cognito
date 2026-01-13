'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import DataToolbar from '@/components/modulos/DataToolbar'
import StatusBadge from '@/components/modulos/StatusBadge'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import ImagemEditorSheet from '@/components/modulos/servicos/ImagemEditorSheet'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { Wrench, List, Users, CheckSquare } from 'lucide-react'

type Row = TableData

export default function OrdensDeServicosPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Ordens de Serviço',
      subtitle: 'Acompanhe ordens, serviços e técnicos'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'ordens-servico', label: 'Ordens de Serviço' },
        { value: 'servicos-executados', label: 'Serviços Executados' },
        { value: 'itens-materiais', label: 'Itens Materiais' },
        { value: 'tecnicos', label: 'Técnicos' },
        { value: 'checklist', label: 'Checklist' },
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
  const [reloadKey, setReloadKey] = useState(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)

  // Editor de imagem
  const [imgEditorOpen, setImgEditorOpen] = useState(false)
  const [imgEditorTipo, setImgEditorTipo] = useState<'cliente' | 'tecnico'>('cliente')
  const [imgEditorId, setImgEditorId] = useState<string | number | null>(null)
  const [imgEditorPrefill, setImgEditorPrefill] = useState<{ nome?: string; imagem_url?: string } | undefined>(undefined)

  const openImagemEditor = (
    tipo: 'cliente' | 'tecnico',
    id: string | number | undefined,
    prefill: { nome?: string; imagem_url?: string }
  ) => {
    if (!id) return
    setImgEditorTipo(tipo)
    setImgEditorId(id)
    setImgEditorPrefill(prefill)
    setImgEditorOpen(true)
  }

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
      case 'tecnicos':
        // Alinhado aos campos da query de técnicos (os_tecnicos + funcionarios)
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'ordem_servico_id', header: 'OS' },
          { accessorKey: 'tecnico_id', header: 'ID Técnico' },
          { accessorKey: 'tecnico_nome', header: 'Técnico' },
          { accessorKey: 'hora_inicio', header: 'Início', cell: ({ row }) => formatDate(row.original['hora_inicio'], true) },
          { accessorKey: 'hora_fim', header: 'Fim', cell: ({ row }) => formatDate(row.original['hora_fim'], true) },
          { accessorKey: 'horas_trabalhadas', header: 'Horas Trabalhadas' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em'], true) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em'], true) },
        ]
      case 'servicos-executados':
        // Alinhado exatamente aos campos da query de serviços executados
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'ordem_servico_id', header: 'OS' },
          { accessorKey: 'servico_nome', header: 'Serviço' },
          { accessorKey: 'categoria_servico', header: 'Categoria' },
          { accessorKey: 'quantidade', header: 'Qtd.' },
          { accessorKey: 'valor_unitario', header: 'Valor Unit. (R$)', cell: ({ row }) => formatBRL(row.original['valor_unitario']) },
          { accessorKey: 'valor_total', header: 'Valor Total (R$)', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
        ]
      case 'itens-materiais':
        // Alinhado exatamente aos campos da query de itens materiais
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'ordem_servico_id', header: 'OS' },
          { accessorKey: 'produto_nome', header: 'Produto' },
          { accessorKey: 'quantidade', header: 'Qtd.' },
          { accessorKey: 'custo_unitario', header: 'Custo Unit. (R$)', cell: ({ row }) => formatBRL(row.original['custo_unitario']) },
          { accessorKey: 'custo_total', header: 'Total (R$)', cell: ({ row }) => formatBRL(row.original['custo_total']) },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
        ]
      case 'checklist':
        // Alinhado exatamente aos campos da query de checklist
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'ordem_servico_id', header: 'OS' },
          { accessorKey: 'item', header: 'Item' },
          { accessorKey: 'concluido', header: 'Concluído', cell: ({ row }) => <StatusBadge value={row.original['concluido'] ? 'Concluído' : 'Pendente'} type="status" /> },
          { accessorKey: 'observacao', header: 'Observação' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'ordens-servico':
      default:
        // Alinhado exatamente aos campos da query fornecida (sem imagens/segmento/valores)
        return [
          { accessorKey: 'id', header: 'Nº OS' },
          { accessorKey: 'cliente_nome', header: 'Cliente' },
          { accessorKey: 'tecnico_nome', header: 'Técnico Responsável' },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'prioridade', header: 'Prioridade', cell: ({ row }) => <StatusBadge value={row.original['prioridade']} type="prioridade" /> },
          { accessorKey: 'descricao_problema', header: 'Descrição do Problema' },
          { accessorKey: 'data_abertura', header: 'Abertura', cell: ({ row }) => formatDate(row.original['data_abertura']) },
          { accessorKey: 'data_agendada', header: 'Agendada', cell: ({ row }) => formatDate(row.original['data_agendada']) },
          { accessorKey: 'data_conclusao', header: 'Conclusão', cell: ({ row }) => formatDate(row.original['data_conclusao']) },
          { accessorKey: 'observacoes', header: 'Observações' },
        ]
    }
  }, [tabs.selected])

  const fetchableViews = new Set(['ordens-servico', 'servicos-executados', 'itens-materiais', 'checklist', 'tecnicos'])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      // Somente busca para views integradas na API
      if (!fetchableViews.has(tabs.selected)) {
        setData([])
        setTotal(0)
        setError(null)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('view', tabs.selected)
        if (tabs.selected === 'ordens-servico') {
          if (dateRange?.from) {
            const d = dateRange.from
            params.set('de', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
          if (dateRange?.to) {
            const d = dateRange.to
            params.set('ate', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
        }
        if (tabs.selected !== 'tecnicos') {
          params.set('page', String(page))
          params.set('pageSize', String(pageSize))
        }
        const url = `/api/modulos/ordensdeservico?${params.toString()}`
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
  }, [tabs.selected, dateRange?.from, dateRange?.to, page, pageSize, reloadKey])

  // Reset page quando aba ou período mudar
  useEffect(() => { setPage(1) }, [tabs.selected, dateRange?.from, dateRange?.to])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'ordens-servico':
          return <Wrench className="h-4 w-4" />
        case 'servicos-executados':
          return <List className="h-4 w-4" />
        case 'itens-materiais':
          return <List className="h-4 w-4" />
        case 'tecnicos':
          return <Users className="h-4 w-4" />
        case 'checklist':
          return <CheckSquare className="h-4 w-4" />
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
        <div className="flex h-full overflow-hidden bg-gray-100">
          <div className="flex flex-col h-full w-full">
            
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-2 pb-2">
              <NexusPageContainer className="h-full">
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
                    startOffset={tabs.leftOffset}
                    labelOffsetY={tabs.labelOffsetY}
                    activeColor={tabs.activeColor}
                    activeFontWeight={tabs.activeFontWeight}
                    activeBorderColor={tabs.activeBorderColor}
                  />
                </div>
                <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
                  <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
                    <DataToolbar
                      from={((tabs.selected === 'ordens-servico' ? total : data.length) === 0) ? 0 : (page - 1) * pageSize + 1}
                      to={((tabs.selected === 'ordens-servico' ? total : data.length) === 0) ? 0 : Math.min(page * pageSize, (tabs.selected === 'ordens-servico' ? total : data.length))}
                      total={tabs.selected === 'ordens-servico' ? total : data.length}
                      dateRange={['ordens-servico'].includes(tabs.selected) ? dateRange : undefined}
                      onDateRangeChange={['ordens-servico'].includes(tabs.selected) ? setDateRange : undefined}
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
                      actionComponent={undefined}
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
                          pageIndex={undefined}
                          serverSidePagination={false}
                          serverTotalRows={undefined}
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
                      {!fetchableViews.has(tabs.selected) && !isLoading && !error && (
                        <div className="p-4 text-xs text-gray-500 border-t" style={{ borderColor: tabelaUI.borderColor }}>
                          Área em preparação para “{tabs.options.find(o => o.value === tabs.selected)?.label || tabs.selected}”.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
      <ImagemEditorSheet
        open={imgEditorOpen}
        onOpenChange={setImgEditorOpen}
        tipo={imgEditorTipo}
        id={imgEditorId}
        prefill={imgEditorPrefill}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </SidebarProvider>
  )
}
