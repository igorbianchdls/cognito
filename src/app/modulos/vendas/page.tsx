'use client'
/* eslint-disable @next/next/no-img-element */

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
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, financeiroUiActions } from '@/stores/modulos/financeiroUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { ShoppingCart, Users, Map, Users2, LayoutGrid } from 'lucide-react'
import PedidosLinkedEditorSheet from '@/components/modulos/vendas/PedidosLinkedEditorSheet'

type Row = TableData

export default function ModulosVendasPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    financeiroUiActions.setTitulo({
      title: 'Vendas',
      subtitle: 'Selecione uma opção para visualizar os dados',
    })
    financeiroUiActions.setTabs({
      options: [
        { value: 'pedidos', label: 'Pedidos' },
        { value: 'clientes', label: 'Clientes' },
        { value: 'territorios', label: 'Territórios' },
        { value: 'equipes', label: 'Equipes' },
        { value: 'canais', label: 'Canais' },
      ],
      selected: 'pedidos',
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

  // Editor de itens vinculados do pedido (cliente/canal)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorTipo, setEditorTipo] = useState<'cliente' | 'canal'>('cliente')
  const [editorId, setEditorId] = useState<string | number | null>(null)
  const [editorPrefill, setEditorPrefill] = useState<{ nome?: string; imagem_url?: string; segmento?: string } | undefined>(undefined)

  const openEditorCliente = (row: Row) => {
    const id = row['cliente_id'] as string | number | undefined
    if (!id) return
    setEditorTipo('cliente')
    setEditorId(id)
    setEditorPrefill({
      nome: row['cliente'] ? String(row['cliente']) : undefined,
      imagem_url: row['cliente_imagem_url'] ? String(row['cliente_imagem_url']) : undefined,
      segmento: row['segmento_cliente'] ? String(row['segmento_cliente']) : undefined,
    })
    setEditorOpen(true)
  }

  const openEditorCanal = (row: Row) => {
    const id = row['canal_id'] as string | number | undefined
    if (!id) return
    setEditorTipo('canal')
    setEditorId(id)
    setEditorPrefill({
      nome: row['canal_venda'] ? String(row['canal_venda']) : undefined,
      imagem_url: row['canal_imagem_url'] ? String(row['canal_imagem_url']) : undefined,
    })
    setEditorOpen(true)
  }

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

  const formatBRL = (value?: unknown) => {
    const n = Number(value ?? 0)
    if (isNaN(n)) return String(value ?? '')
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
      case 'clientes':
        return [
          { accessorKey: 'cliente', header: 'Cliente' },
          { accessorKey: 'nome_fantasia_ou_razao', header: 'Nome Fantasia/Razão' },
          { accessorKey: 'cpf_cnpj', header: 'CPF/CNPJ' },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'telefone', header: 'Telefone' },
          { accessorKey: 'vendedor_responsavel', header: 'Vendedor Responsável' },
          { accessorKey: 'territorio', header: 'Território' },
          { accessorKey: 'canal_origem', header: 'Canal de Origem' },
          { accessorKey: 'categoria_cliente', header: 'Categoria' },
          { accessorKey: 'status_cliente', header: 'Status' },
          { accessorKey: 'cliente_desde', header: 'Cliente Desde', cell: ({ row }) => formatDate(row.original['cliente_desde']) },
          { accessorKey: 'data_ultima_compra', header: 'Última Compra', cell: ({ row }) => formatDate(row.original['data_ultima_compra']) },
          { accessorKey: 'faturamento_estimado_anual', header: 'Faturamento Estimado', cell: ({ row }) => formatBRL(row.original['faturamento_estimado_anual']) },
          { accessorKey: 'frequencia_pedidos_mensal', header: 'Frequência Mensal (pedidos)' },
          { accessorKey: 'ativo', header: 'Ativo' },
        ]
      case 'territorios':
        return [
          { accessorKey: 'territorio', header: 'Território' },
          { accessorKey: 'qtd_clientes', header: 'Qtd Clientes' },
          { accessorKey: 'qtd_vendedores', header: 'Qtd Vendedores' },
          { accessorKey: 'created_at', header: 'Criado em', cell: ({ row }) => formatDate(row.original['created_at']) },
        ]
      case 'equipes':
        return [
          { accessorKey: 'equipe', header: 'Equipe' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'qtd_vendedores', header: 'Qtd Vendedores' },
          { accessorKey: 'territorios_atendidos', header: 'Territórios Atendidos' },
          { accessorKey: 'ativo', header: 'Ativa' },
          { accessorKey: 'created_at', header: 'Criada em', cell: ({ row }) => formatDate(row.original['created_at']) },
        ]
      case 'canais':
        return [
          { accessorKey: 'canal_venda', header: 'Canal' },
          { accessorKey: 'qtd_pedidos', header: 'Pedidos' },
          { accessorKey: 'total_vendido', header: 'Receita', cell: ({ row }) => formatBRL(row.original['total_vendido']) },
          { accessorKey: 'primeira_venda', header: 'Primeira Venda', cell: ({ row }) => formatDate(row.original['primeira_venda']) },
          { accessorKey: 'ultima_venda', header: 'Última Venda', cell: ({ row }) => formatDate(row.original['ultima_venda']) },
        ]
      case 'pedidos':
      default:
        return [
          { accessorKey: 'numero_pedido', header: 'Número do Pedido' },
          {
            accessorKey: 'cliente',
            header: 'Cliente',
            size: 250,
            minSize: 200,
            cell: ({ row }) => {
              const nome = row.original['cliente'] || 'Sem cliente'
              const subtitulo = row.original['segmento_cliente'] || 'Sem segmento'
              const imagemUrl = row.original['cliente_imagem_url']
              const colors = getColorFromName(String(nome))

              return (
                <div className="flex items-center">
                  <div
                    className="flex items-center justify-center mr-3 cursor-pointer"
                    role="button"
                    onClick={() => openEditorCliente(row.original)}
                    style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: imagemUrl ? 'transparent' : colors.bg }}>
                    {imagemUrl ? (
                      <img src={String(imagemUrl)} alt={String(nome)} className="w-full h-full object-cover" />
                    ) : (
                      <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
                        {String(nome)?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => openEditorCliente(row.original)}
                      className="text-left"
                      style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}
                    >
                      {String(nome)}
                    </button>
                    <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{String(subtitulo)}</div>
                  </div>
                </div>
              )
            }
          },
          {
            accessorKey: 'canal_venda',
            header: 'Canal de Venda',
            size: 200,
            minSize: 150,
            cell: ({ row }) => {
              const nome = row.original['canal_venda'] || 'Sem canal'
              const imagemUrl = row.original['canal_imagem_url']
              const colors = getColorFromName(String(nome))

              return (
                <div className="flex items-center">
                  <div
                    className="flex items-center justify-center mr-3 cursor-pointer"
                    role="button"
                    onClick={() => openEditorCanal(row.original)}
                    style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: imagemUrl ? 'transparent' : colors.bg }}>
                    {imagemUrl ? (
                      <img src={String(imagemUrl)} alt={String(nome)} className="w-full h-full object-cover" />
                    ) : (
                      <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
                        {String(nome)?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditorCanal(row.original)}
                    className="text-left"
                    style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}
                  >
                    {String(nome)}
                  </button>
                </div>
              )
            }
          },
          { accessorKey: 'vendedor', header: 'Vendedor' },
          {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" />
          },
          { accessorKey: 'data_pedido', header: 'Data do Pedido', cell: ({ row }) => formatDate(row.original['data_pedido']) },
          { accessorKey: 'valor_produtos', header: 'Valor Produtos', cell: ({ row }) => formatBRL(row.original['valor_produtos']) },
          { accessorKey: 'valor_frete', header: 'Frete', cell: ({ row }) => formatBRL(row.original['valor_frete']) },
          { accessorKey: 'valor_desconto', header: 'Desconto', cell: ({ row }) => formatBRL(row.original['valor_desconto']) },
          { accessorKey: 'valor_total_pedido', header: 'Total Pedido', cell: ({ row }) => formatBRL(row.original['valor_total_pedido']) },
          { accessorKey: 'cidade_uf', header: 'Cidade/UF' },
          { accessorKey: 'created_at', header: 'Criado em', cell: ({ row }) => formatDate(row.original['created_at']) },
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
        if (tabs.selected === 'pedidos') {
          if (dateRange?.from) {
            const d = dateRange.from
            params.set('de', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
          if (dateRange?.to) {
            const d = dateRange.to
            params.set('ate', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
        }
        if (tabs.selected === 'pedidos' || tabs.selected === 'clientes') {
          params.set('page', String(page))
          params.set('pageSize', String(pageSize))
        }
        const url = `/api/modulos/vendas?${params.toString()}`
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

  useEffect(() => { setPage(1) }, [tabs.selected, dateRange?.from, dateRange?.to])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'pedidos':
          return <ShoppingCart className="h-4 w-4" />
        case 'clientes':
          return <Users className="h-4 w-4" />
        case 'territorios':
          return <Map className="h-4 w-4" />
        case 'equipes':
          return <Users2 className="h-4 w-4" />
        case 'canais':
          return <LayoutGrid className="h-4 w-4" />
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
              from={((tabs.selected === 'pedidos' || tabs.selected === 'clientes') ? total : data.length) === 0 ? 0 : (page - 1) * pageSize + 1}
              to={((tabs.selected === 'pedidos' || tabs.selected === 'clientes') ? total : data.length) === 0 ? 0 : Math.min(page * pageSize, ((tabs.selected === 'pedidos' || tabs.selected === 'clientes') ? total : data.length))}
              total={(tabs.selected === 'pedidos' || tabs.selected === 'clientes') ? total : data.length}
              dateRange={tabs.selected === 'pedidos' ? dateRange : undefined}
              onDateRangeChange={tabs.selected === 'pedidos' ? setDateRange : undefined}
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
                  key={tabs.selected}
                  columns={columns}
                  data={data}
                  enableSearch={tabelaUI.enableSearch}
                  showColumnToggle={tabelaUI.enableColumnToggle}
                  showPagination={tabelaUI.showPagination}
                  pageSize={pageSize}
                  pageIndex={(tabs.selected === 'pedidos' || tabs.selected === 'clientes') ? page - 1 : undefined}
                  serverSidePagination={(tabs.selected === 'pedidos' || tabs.selected === 'clientes')}
                  serverTotalRows={(tabs.selected === 'pedidos' || tabs.selected === 'clientes') ? total : undefined}
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
      <PedidosLinkedEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        tipo={editorTipo}
        id={editorId}
        prefill={editorPrefill}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </SidebarProvider>
  )
}
