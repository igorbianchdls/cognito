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
        return [
          { accessorKey: 'id', header: 'ID' },
          {
            accessorKey: 'tecnico',
            header: 'Técnico',
            size: 250,
            minSize: 200,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['tecnico'] ? String(row.original['tecnico']) : 'Sem nome'}
                subtitle={row.original['cargo'] ? String(row.original['cargo']) : 'Sem cargo'}
                imageUrl={row.original['tecnico_imagem_url'] ? String(row.original['tecnico_imagem_url']) : undefined}
                onClick={() => openImagemEditor('tecnico', row.original['id'] as string | number, { nome: String(row.original['tecnico'] || ''), imagem_url: row.original['tecnico_imagem_url'] ? String(row.original['tecnico_imagem_url']) : undefined })}
                clickable
              />
            )
          },
          { accessorKey: 'cargo', header: 'Cargo' },
          { accessorKey: 'especialidade', header: 'Especialidade' },
          { accessorKey: 'custo_hora', header: 'Custo/Hora (R$)', cell: ({ row }) => formatBRL(row.original['custo_hora']) },
          { accessorKey: 'telefone', header: 'Telefone' },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'ordens_servico', header: 'Ordens de Serviço' },
          { accessorKey: 'horas_trabalhadas', header: 'Horas Trabalhadas' },
          { accessorKey: 'admissao', header: 'Admissão', cell: ({ row }) => formatDate(row.original['admissao']) },
        ]
      case 'servicos-executados':
        return [
          { accessorKey: 'numero_os', header: 'Nº OS' },
          { accessorKey: 'servico', header: 'Serviço' },
          { accessorKey: 'cliente', header: 'Cliente' },
          { accessorKey: 'tecnico', header: 'Técnico' },
          { accessorKey: 'quantidade', header: 'Qtd.' },
          { accessorKey: 'valor_total', header: 'Valor (R$)', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'data_execucao', header: 'Data Execução', cell: ({ row }) => formatDate(row.original['data_execucao']) },
        ]
      case 'itens-materiais':
        return [
          { accessorKey: 'numero_os', header: 'Nº OS' },
          { accessorKey: 'item', header: 'Item' },
          { accessorKey: 'categoria', header: 'Categoria' },
          { accessorKey: 'quantidade', header: 'Qtd.' },
          { accessorKey: 'custo_unitario', header: 'Custo Unit.', cell: ({ row }) => formatBRL(row.original['custo_unitario']) },
          { accessorKey: 'custo_total', header: 'Total (R$)', cell: ({ row }) => formatBRL(row.original['custo_total']) },
        ]
      case 'checklist':
        return [
          { accessorKey: 'item', header: 'Item de Verificação' },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'responsavel', header: 'Responsável' },
          { accessorKey: 'data', header: 'Data', cell: ({ row }) => formatDate(row.original['data']) },
          { accessorKey: 'observacoes', header: 'Observações' },
        ]
      case 'ordens-servico':
      default:
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'numero_os', header: 'Nº OS' },
          {
            accessorKey: 'cliente',
            header: 'Cliente',
            size: 250,
            minSize: 200,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['cliente'] ? String(row.original['cliente']) : 'Sem nome'}
                subtitle={row.original['segmento'] ? String(row.original['segmento']) : 'Sem segmento'}
                imageUrl={row.original['cliente_imagem_url'] ? String(row.original['cliente_imagem_url']) : undefined}
                onClick={() => openImagemEditor('cliente', row.original['cliente_id'] as string | number | undefined, { nome: String(row.original['cliente'] || ''), imagem_url: row.original['cliente_imagem_url'] ? String(row.original['cliente_imagem_url']) : undefined })}
                clickable
              />
            )
          },
          {
            accessorKey: 'tecnico_responsavel',
            header: 'Técnico Responsável',
            size: 250,
            minSize: 200,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['tecnico_responsavel'] ? String(row.original['tecnico_responsavel']) : 'Sem nome'}
                subtitle={row.original['cargo_tecnico'] ? String(row.original['cargo_tecnico']) : 'Sem cargo'}
                imageUrl={row.original['tecnico_imagem_url'] ? String(row.original['tecnico_imagem_url']) : undefined}
                onClick={() => openImagemEditor('tecnico', row.original['tecnico_id'] as string | number | undefined, { nome: String(row.original['tecnico_responsavel'] || ''), imagem_url: row.original['tecnico_imagem_url'] ? String(row.original['tecnico_imagem_url']) : undefined })}
                clickable
              />
            )
          },
          {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" />
          },
          {
            accessorKey: 'prioridade',
            header: 'Prioridade',
            cell: ({ row }) => <StatusBadge value={row.original['prioridade']} type="prioridade" />
          },
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

  const fetchableViews = new Set(['ordens-servico', 'tecnicos'])

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
        const url = `/api/modulos/servicos?${params.toString()}`
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
              startOffset={tabs.leftOffset}
              labelOffsetY={tabs.labelOffsetY}
              activeColor={tabs.activeColor}
              activeFontWeight={tabs.activeFontWeight}
              activeBorderColor={tabs.activeBorderColor}
            />
          </div>
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
                  pageIndex={tabs.selected === 'ordens-servico' ? page - 1 : undefined}
                  serverSidePagination={tabs.selected === 'ordens-servico'}
                  serverTotalRows={tabs.selected === 'ordens-servico' ? total : undefined}
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
