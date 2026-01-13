"use client"

import { useMemo, useState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import DataToolbar from '@/components/modulos/DataToolbar'
import DataTable, { type TableData } from '@/components/widgets/Table'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'
import { List } from 'lucide-react'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'

type Row = TableData

export default function ModulosAdmnistrativoPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)
  const [data, setData] = useState<Row[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)

  useEffect(() => {
    moduleUiActions.setTitulo({ title: 'Administrativo', subtitle: 'Selecione uma opção para visualizar os dados' })
    moduleUiActions.setTabs({
      options: [
        { value: 'despesas', label: 'Despesas' },
        { value: 'compras', label: 'Compras' },
        { value: 'contratos', label: 'Contratos' },
        { value: 'reembolsos', label: 'Reembolsos' },
        { value: 'obrigacoes-legais', label: 'Obrigações Legais' },
        { value: 'documentos', label: 'Documentos' },
        { value: 'categorias', label: 'Categorias' },
      ],
      selected: 'despesas',
    })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('view', tabs.selected)
        if (dateRange?.from) {
          const d = new Date(dateRange.from)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          params.set('de', `${yyyy}-${mm}-${dd}`)
        }
        if (dateRange?.to) {
          const d = new Date(dateRange.to)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          params.set('ate', `${yyyy}-${mm}-${dd}`)
        }
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        const url = `/api/modulos/admnistrativo?${params.toString()}`
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
  }, [tabs.selected, dateRange?.from, dateRange?.to, page, pageSize])

  useEffect(() => { setPage(1) }, [tabs.selected, dateRange?.from, dateRange?.to])

  const iconFor = (v: string) => <List className="h-4 w-4" />
  const tabOptions: Opcao[] = useMemo(() => (tabs.options.map((opt) => ({ ...opt, icon: iconFor(opt.value) })) as Opcao[]), [tabs.options])

  const formatDate = (value?: unknown) => {
    if (!value) return ''
    try {
      const d = new Date(String(value))
      if (isNaN(d.getTime())) return String(value)
      return d.toLocaleDateString('pt-BR')
    } catch { return String(value) }
  }
  const formatBRL = (value?: unknown) => {
    const n = Number(value ?? 0)
    return isNaN(n) ? String(value ?? '') : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const getColorFromName = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
      { bg: '#DBEAFE', text: '#1E40AF' },
      { bg: '#DCFCE7', text: '#15803D' },
      { bg: '#FEF3C7', text: '#B45309' },
      { bg: '#FCE7F3', text: '#BE185D' },
      { bg: '#E0E7FF', text: '#4338CA' },
      { bg: '#FED7AA', text: '#C2410C' },
      { bg: '#E9D5FF', text: '#7C3AED' },
      { bg: '#D1FAE5', text: '#047857' },
    ]
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'compras':
        return [
          {
            accessorKey: 'fornecedor',
            header: 'Fornecedor',
            size: 280,
            minSize: 220,
            cell: ({ row }) => {
              const nome = row.original['fornecedor'] || 'Sem fornecedor'
              const subtitulo = row.original['categoria_financeira'] || ''
              const imagemUrl = row.original['fornecedor_imagem_url']
              const colors = getColorFromName(String(nome))
              return (
                <div className="flex items-center">
                  <div
                    className="flex items-center justify-center mr-3"
                    style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: imagemUrl ? 'transparent' : colors.bg }}
                  >
                    {imagemUrl ? (
                      <img src={String(imagemUrl)} alt={String(nome)} className="w-full h-full object-cover" />
                    ) : (
                      <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
                        {String(nome)?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-left" style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                      {String(nome)}
                    </div>
                    {subtitulo ? (
                      <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{String(subtitulo)}</div>
                    ) : null}
                  </div>
                </div>
              )
            }
          },
          { accessorKey: 'categoria_financeira', header: 'Categoria' },
          { accessorKey: 'valor_total', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'data_pedido', header: 'Pedido', cell: ({ row }) => formatDate(row.original['data_pedido']) },
          { accessorKey: 'data_prevista_entrega', header: 'Prevista Entrega', cell: ({ row }) => formatDate(row.original['data_prevista_entrega']) },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'centro_custo', header: 'Centro Custo' },
          { accessorKey: 'departamento', header: 'Departamento' },
          { accessorKey: 'projeto', header: 'Projeto' },
          { accessorKey: 'observacao', header: 'Observação' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
        ]
      case 'despesas':
        return [
          { accessorKey: 'descricao_despesa', header: 'Descrição' },
          {
            accessorKey: 'fornecedor',
            header: 'Fornecedor',
            size: 280,
            minSize: 220,
            cell: ({ row }) => {
              const nome = row.original['fornecedor'] || 'Sem fornecedor'
              const subtitulo = (() => {
                const cat = row.original['categoria']
                const dep = row.original['departamento']
                if (cat && dep) return `${String(cat)} / ${String(dep)}`
                return String(cat || dep || '')
              })()
              const imagemUrl = row.original['fornecedor_imagem_url']
              const colors = getColorFromName(String(nome))
              return (
                <div className="flex items-center">
                  <div
                    className="flex items-center justify-center mr-3"
                    style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: imagemUrl ? 'transparent' : colors.bg }}
                  >
                    {imagemUrl ? (
                      <img src={String(imagemUrl)} alt={String(nome)} className="w-full h-full object-cover" />
                    ) : (
                      <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
                        {String(nome)?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-left" style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                      {String(nome)}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{subtitulo}</div>
                  </div>
                </div>
              )
            }
          },
          { accessorKey: 'categoria', header: 'Categoria' },
          { accessorKey: 'data_competencia', header: 'Competência', cell: ({ row }) => formatDate(row.original['data_competencia']) },
          { accessorKey: 'data_vencimento', header: 'Vencimento', cell: ({ row }) => formatDate(row.original['data_vencimento']) },
          { accessorKey: 'valor_total', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'status', header: 'Status' },
        ]
      case 'contratos':
        return [
          { accessorKey: 'descricao', header: 'Descrição' },
          {
            accessorKey: 'fornecedor',
            header: 'Fornecedor',
            size: 280,
            minSize: 220,
            cell: ({ row }) => {
              const nome = row.original['fornecedor'] || 'Sem fornecedor'
              const subtitulo = (() => {
                const cat = row.original['categoria']
                const dep = row.original['departamento']
                if (cat && dep) return `${String(cat)} / ${String(dep)}`
                return String(cat || dep || '')
              })()
              const imagemUrl = row.original['fornecedor_imagem_url']
              const colors = getColorFromName(String(nome))
              return (
                <div className="flex items-center">
                  <div
                    className="flex items-center justify-center mr-3"
                    style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: imagemUrl ? 'transparent' : colors.bg }}
                  >
                    {imagemUrl ? (
                      <img src={String(imagemUrl)} alt={String(nome)} className="w-full h-full object-cover" />
                    ) : (
                      <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
                        {String(nome)?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-left" style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                      {String(nome)}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{subtitulo}</div>
                  </div>
                </div>
              )
            }
          },
          { accessorKey: 'categoria', header: 'Categoria' },
          { accessorKey: 'data_inicio', header: 'Início', cell: ({ row }) => formatDate(row.original['data_inicio']) },
          { accessorKey: 'data_fim', header: 'Fim', cell: ({ row }) => formatDate(row.original['data_fim']) },
          { accessorKey: 'status', header: 'Status' },
        ]
      case 'reembolsos':
        return [
          {
            accessorKey: 'funcionario',
            header: 'Funcionário',
            size: 280,
            minSize: 220,
            cell: ({ row }) => {
              const nome = row.original['funcionario'] || 'Sem nome'
              const subtitulo = (() => {
                const cat = row.original['categoria']
                const dep = row.original['departamento']
                const catText = cat ? String(cat) : 'sem Categoria'
                return dep ? `${catText} / ${String(dep)}` : catText
              })()
              const imagemUrl = row.original['funcionario_imagem_url']
              const colors = getColorFromName(String(nome))
              return (
                <div className="flex items-center">
                  <div
                    className="flex items-center justify-center mr-3"
                    style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: imagemUrl ? 'transparent' : colors.bg }}
                  >
                    {imagemUrl ? (
                      <img src={String(imagemUrl)} alt={String(nome)} className="w-full h-full object-cover" />
                    ) : (
                      <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
                        {String(nome)?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-left" style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                      {String(nome)}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{subtitulo}</div>
                  </div>
                </div>
              )
            }
          },
          { accessorKey: 'tipo_reembolso', header: 'Tipo' },
          { accessorKey: 'descricao_linha', header: 'Descrição' },
          { accessorKey: 'categoria', header: 'Categoria' },
          { accessorKey: 'data_despesa', header: 'Data Despesa', cell: ({ row }) => formatDate(row.original['data_despesa']) },
          { accessorKey: 'valor_linha', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor_linha']) },
          { accessorKey: 'status', header: 'Status' },
        ]
      case 'obrigacoes-legais':
        return [
          { accessorKey: 'tipo_obrigacao', header: 'Tipo' },
          { accessorKey: 'descricao_obrigacao', header: 'Descrição' },
          { accessorKey: 'data_vencimento', header: 'Vencimento', cell: ({ row }) => formatDate(row.original['data_vencimento']) },
          { accessorKey: 'valor', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor']) },
          { accessorKey: 'responsavel', header: 'Responsável' },
          { accessorKey: 'categoria', header: 'Categoria' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
        ]
      case 'documentos':
        return [
          { accessorKey: 'tipo_documento', header: 'Tipo' },
          { accessorKey: 'numero_documento', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'data_emissao', header: 'Emissão', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'valor_total', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
        ]
      case 'categorias':
        return [
          { accessorKey: 'categoria', header: 'Categoria' },
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'ativo', header: 'Ativo' },
          { accessorKey: 'codigo_conta', header: 'Código Conta' },
          { accessorKey: 'nome_conta_contabil', header: 'Conta Contábil' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      default:
        return [
          { accessorKey: 'codigo', header: 'Código' },
          { accessorKey: 'nome', header: 'Nome' },
          { accessorKey: 'descricao', header: 'Descrição' },
        ]
    }
  }, [tabs.selected])

  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#fdfdfd' }}>
          <div className="flex flex-col h-full w-full">
            
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-2 pb-2" data-page="nexus">
              <NexusPageContainer className="h-full">
                <div style={{ marginBottom: layout.mbTitle }}>
                  <PageHeader
                    title={titulo.title}
                    subtitle={titulo.subtitle}
                    titleFontFamily={titulo.titleFontFamily}
                    titleFontSize={titulo.titleFontSize}
                    titleFontWeight={titulo.titleFontWeight}
                    titleColor={titulo.titleColor}
                    titleLetterSpacing={titulo.titleLetterSpacing}
                    subtitleFontFamily={titulo.subtitleFontFamily}
                    subtitleLetterSpacing={titulo.subtitleLetterSpacing}
                  />
                </div>
                <div style={{ marginBottom: 0 }}>
                  <TabsNav
                    options={tabOptions}
                    value={tabs.selected}
                    onValueChange={(v) => moduleUiActions.setTabs({ selected: v })}
                    fontFamily={tabs.fontFamily}
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
                  />
                </div>
                <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
                  <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
                    <DataToolbar
                      from={total === 0 ? 0 : (page - 1) * pageSize + 1}
                      to={total === 0 ? 0 : Math.min(page * pageSize, total)}
                      total={total}
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                      fontFamily={tabs.fontFamily}
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
                          key={tabs.selected}
                          columns={columns}
                          data={data}
                          enableSearch={tabelaUI.enableSearch}
                          showColumnToggle={tabelaUI.enableColumnToggle}
                          showPagination={tabelaUI.showPagination}
                          pageSize={pageSize}
                          pageIndex={page - 1}
                          serverSidePagination
                          serverTotalRows={total}
                          headerBackground={tabelaUI.headerBg}
                          headerTextColor={tabelaUI.headerText}
                          cellTextColor={tabelaUI.cellText}
                          headerFontSize={tabelaUI.headerFontSize}
                          headerFontFamily={tabelaUI.headerFontFamily}
                          headerFontWeight={tabelaUI.headerFontWeight}
                          headerLetterSpacing={tabelaUI.headerLetterSpacing}
                          cellFontSize={tabelaUI.cellFontSize}
                          cellFontFamily={tabelaUI.cellFontFamily}
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
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
