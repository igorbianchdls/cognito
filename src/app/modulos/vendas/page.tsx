"use client"

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusHeader from '@/components/navigation/nexus/NexusHeader'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import DataToolbar from '@/components/modulos/DataToolbar'
import DataTable, { type TableData } from '@/components/widgets/Table'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import { ShoppingCart, RotateCcw, Ticket, LayoutGrid, User, Users, Building2, Building, Calendar, CalendarClock, CheckCircle2, DollarSign, Percent, Coins, TrendingUp, Truck, FileText, Tag, Table, Bookmark, Settings, Megaphone, Star, Hash } from 'lucide-react'
import IconLabelHeader from '@/components/widgets/IconLabelHeader'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { Button } from '@/components/ui/button'

type Row = TableData

type PedidoItem = {
  servico: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

type PedidoRow = Row & {
  itens?: PedidoItem[]
}

type DevolucaoItem = {
  produto: string
  quantidade: number
  valor_unitario: number
  subtotal: number
}

type DevolucaoRow = Row & {
  itens?: DevolucaoItem[]
}

type TabelaPrecoItem = {
  produto: string
  preco_produto: number | null
}

type TabelaPrecoRow = Row & {
  itens?: TabelaPrecoItem[]
}

type PromocaoItem = {
  produto: string
}

type PromocaoRow = Row & {
  itens?: PromocaoItem[]
}

export default function ModulosVendasPage() {
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
  const [refreshKey, setRefreshKey] = useState(0)

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    if (name === 'Barlow') return 'var(--font-barlow), "Barlow", sans-serif'
    return name
  }

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Vendas',
      subtitle: 'Gestão de pedidos, devoluções e cupons'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'pedidos', label: 'Pedidos' },
        { value: 'devolucoes', label: 'Devoluções' },
        { value: 'cupons', label: 'Cupons' },
        { value: 'canais', label: 'Canais de Venda' },
        { value: 'tabelas_preco', label: 'Tabelas de Preço' },
        { value: 'promocoes', label: 'Promoções' },
        { value: 'regras_desconto', label: 'Regras de Desconto' },
        { value: 'canais_distribuicao', label: 'Canais de Distribuição' },
      ],
      selected: 'pedidos',
    })
  }, [])

  const iconFor = (v: string) => {
    if (v === 'pedidos') return <ShoppingCart className="h-4 w-4" />
    if (v === 'devolucoes') return <RotateCcw className="h-4 w-4" />
    if (v === 'cupons') return <Ticket className="h-4 w-4" />
    if (v === 'canais') return <LayoutGrid className="h-4 w-4" />
    return <ShoppingCart className="h-4 w-4" />
  }
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
    if (isNaN(n)) return String(value ?? '')
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const renderPedidoItems = (row: Row) => {
    const pedidoRow = row as PedidoRow
    const itens = pedidoRow.itens || []

    if (itens.length === 0) return null

    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Itens do Pedido</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Serviço</th>
              <th className="text-right py-2 px-3">Quantidade</th>
              <th className="text-right py-2 px-3">Preço Unitário</th>
              <th className="text-right py-2 px-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.servico}</td>
                <td className="text-right py-2 px-3">{item.quantidade}</td>
                <td className="text-right py-2 px-3">{formatBRL(item.preco_unitario)}</td>
                <td className="text-right py-2 px-3">{formatBRL(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderDevolucaoItems = (row: Row) => {
    const devolucaoRow = row as DevolucaoRow
    const itens = devolucaoRow.itens || []

    if (itens.length === 0) return null

    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Itens da Devolução</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Produto</th>
              <th className="text-right py-2 px-3">Quantidade</th>
              <th className="text-right py-2 px-3">Valor Unitário</th>
              <th className="text-right py-2 px-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.produto}</td>
                <td className="text-right py-2 px-3">{item.quantidade}</td>
                <td className="text-right py-2 px-3">{formatBRL(item.valor_unitario)}</td>
                <td className="text-right py-2 px-3">{formatBRL(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderTabelaPrecoItems = (row: Row) => {
    const tpRow = row as TabelaPrecoRow
    const itens = tpRow.itens || []
    if (itens.length === 0) return null
    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Itens da Tabela</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Produto</th>
              <th className="text-right py-2 px-3">Preço</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.produto}</td>
                <td className="text-right py-2 px-3">{item.preco_produto != null ? formatBRL(item.preco_produto) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderPromocaoItems = (row: Row) => {
    const promRow = row as PromocaoRow
    const itens = promRow.itens || []
    if (itens.length === 0) return null
    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Produtos da Promoção</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Produto</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.produto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'pedidos':
        return [
          { accessorKey: 'pedido', header: () => <IconLabelHeader icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Pedido" /> },
          { accessorKey: 'cliente', header: () => <IconLabelHeader icon={<User className="h-3.5 w-3.5" />} label="Cliente" />,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['cliente'] ? String(row.original['cliente']) : 'Sem nome'}
                imageUrl={row.original['cliente_imagem_url'] ? String(row.original['cliente_imagem_url']) : undefined}
              />
            )
          },
          { accessorKey: 'vendedor', header: () => <IconLabelHeader icon={<Users className="h-3.5 w-3.5" />} label="Vendedor" />,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['vendedor'] ? String(row.original['vendedor']) : '—'}
              />
            )
          },
          { accessorKey: 'filial', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Filial" /> },
          { accessorKey: 'canal_venda', header: () => <IconLabelHeader icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Canal de Venda" />, 
            cell: ({ row }) => <StatusBadge value={row.original['canal_venda']} id={row.original['canal_venda_id'] as number} type="canal_venda" /> },
          { accessorKey: 'data_pedido', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Data Pedido" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'status', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" />,
            cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'valor_total', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Total" />, cell: ({ getValue }) => formatBRL(getValue()) },
        ]
      case 'devolucoes':
        return [
          { accessorKey: 'devolucao', header: () => <IconLabelHeader icon={<RotateCcw className="h-3.5 w-3.5" />} label="Devolução" /> },
          { accessorKey: 'pedido', header: () => <IconLabelHeader icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Pedido" /> },
          { accessorKey: 'cliente', header: () => <IconLabelHeader icon={<User className="h-3.5 w-3.5" />} label="Cliente" /> },
          { accessorKey: 'motivo', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Motivo" /> },
          { accessorKey: 'data_devolucao', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Data Devolução" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'valor_total', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor" />, cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'cupons':
        return [
          { accessorKey: 'cupom', header: () => <IconLabelHeader icon={<Ticket className="h-3.5 w-3.5" />} label="Cupom" /> },
          { accessorKey: 'tipo_desconto', header: () => <IconLabelHeader icon={<Percent className="h-3.5 w-3.5" />} label="Tipo" /> },
          { accessorKey: 'valor_desconto', header: () => <IconLabelHeader icon={<Percent className="h-3.5 w-3.5" />} label="Valor Desconto" /> },
          { accessorKey: 'valor_minimo', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor Mínimo" />, cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'limite_uso_total', header: () => <IconLabelHeader icon={<Hash className="h-3.5 w-3.5" />} label="Limite Total" /> },
          { accessorKey: 'limite_uso_por_cliente', header: () => <IconLabelHeader icon={<Users className="h-3.5 w-3.5" />} label="Limite/Cliente" /> },
          { accessorKey: 'data_inicio', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Data Início" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'data_fim', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Data Fim" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'canais':
        return [
          { accessorKey: 'canal_venda', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="ID" /> },
          { accessorKey: 'nome_canal_venda', header: () => <IconLabelHeader icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Canal de Venda" /> },
          { accessorKey: 'descricao_canal_venda', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição Canal Venda" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
          { accessorKey: 'canal_distribuicao', header: () => <IconLabelHeader icon={<Truck className="h-3.5 w-3.5" />} label="Canal de Distribuição" /> },
          { accessorKey: 'descricao_canal_distribuicao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição Canal Distribuição" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'canais_distribuicao':
        return [
          { accessorKey: 'canal_distribuicao', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="ID" /> },
          { accessorKey: 'nome_canal', header: () => <IconLabelHeader icon={<Truck className="h-3.5 w-3.5" />} label="Canal de Distribuição" /> },
          { accessorKey: 'descricao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'tabelas_preco':
        return [
          { accessorKey: 'tabela_preco', header: () => <IconLabelHeader icon={<Table className="h-3.5 w-3.5" />} label="ID" /> },
          { accessorKey: 'nome_tabela', header: () => <IconLabelHeader icon={<Table className="h-3.5 w-3.5" />} label="Tabela de Preço" /> },
          { accessorKey: 'descricao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'promocoes':
        return [
          { accessorKey: 'promocao', header: () => <IconLabelHeader icon={<Percent className="h-3.5 w-3.5" />} label="ID" /> },
          { accessorKey: 'nome_promocao', header: () => <IconLabelHeader icon={<Star className="h-3.5 w-3.5" />} label="Promoção" /> },
          { accessorKey: 'tipo_desconto', header: () => <IconLabelHeader icon={<Percent className="h-3.5 w-3.5" />} label="Tipo" /> },
          { accessorKey: 'valor_desconto', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor Desconto" />, cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'valor_minimo', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor Mínimo" />, cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'data_inicio', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Início" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'data_fim', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Fim" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'regras_desconto':
        return [
          { accessorKey: 'regra', header: () => <IconLabelHeader icon={<Settings className="h-3.5 w-3.5" />} label="ID" /> },
          { accessorKey: 'nome_regra', header: () => <IconLabelHeader icon={<Settings className="h-3.5 w-3.5" />} label="Regra" /> },
          { accessorKey: 'tipo_regra', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo" /> },
          { accessorKey: 'quantidade_minima', header: () => <IconLabelHeader icon={<Hash className="h-3.5 w-3.5" />} label="Qtd. Mínima" /> },
          { accessorKey: 'valor_minimo', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor Mínimo" />, cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'tipo_desconto', header: () => <IconLabelHeader icon={<Percent className="h-3.5 w-3.5" />} label="Tipo Desc." /> },
          { accessorKey: 'valor_desconto', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor Desconto" />, cell: ({ getValue }) => formatBRL(getValue()) },
          { accessorKey: 'referencia', header: () => <IconLabelHeader icon={<Bookmark className="h-3.5 w-3.5" />} label="Referência" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      default:
        return []
    }
  }, [tabs.selected])

  // Reset page when tab changes
  useEffect(() => { setPage(1) }, [tabs.selected])

  // Server-side fetch per tab
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('view', tabs.selected)
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
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
  }, [tabs.selected, page, pageSize, refreshKey])

  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#fdfdfd' }}>
          <div className="flex flex-col h-full w-full">
            <NexusHeader viewMode={'dashboard'} onChangeViewMode={() => {}} borderless size="sm" showBreadcrumb={false} />
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2" data-page="nexus">
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
                    subtitleFontSize={titulo.subtitleFontSize}
                    subtitleFontWeight={titulo.subtitleFontWeight}
                    subtitleColor={titulo.subtitleColor}
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
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              fontFamily={fontVar(tabs.fontFamily)}
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
                tabs.selected === 'pedidos'
                  ? (<Button asChild><a href="/modulos/vendas/pedidos/novo">Nova Venda</a></Button>)
                  : undefined
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
                  headerPadding={8}
                  columnOptions={{
                    // Pedidos: evitar quebra de linha
                    cliente: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    vendedor: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    canal_venda: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    canal_distribuicao: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    campanha_venda: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 160 },
                    filial: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    sales_office: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                  }}
                  enableExpand={tabs.selected === 'pedidos' || tabs.selected === 'devolucoes' || tabs.selected === 'tabelas_preco' || tabs.selected === 'promocoes'}
                  renderDetail={
                    tabs.selected === 'pedidos'
                      ? renderPedidoItems
                      : tabs.selected === 'devolucoes'
                      ? renderDevolucaoItems
                      : tabs.selected === 'tabelas_preco'
                      ? renderTabelaPrecoItems
                      : tabs.selected === 'promocoes'
                      ? renderPromocaoItems
                      : undefined
                  }
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
