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
import { List, Users, Briefcase, LayoutGrid, Calendar, CalendarClock, CheckCircle2, DollarSign, Tag, TrendingUp, FileText, Mail, Phone, Percent, Settings } from 'lucide-react'
import IconLabelHeader from '@/components/widgets/IconLabelHeader'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import dynamic from 'next/dynamic'
const CadastroTerritorioSheet = dynamic(() => import('@/components/modulos/comercial/CadastroTerritorioSheet').then(m => m.default), { ssr: false })
const CadastroVendedorSheet = dynamic(() => import('@/components/modulos/comercial/CadastroVendedorSheet').then(m => m.default), { ssr: false })
const CadastroTipoMetaSheet = dynamic(() => import('@/components/modulos/comercial/CadastroTipoMetaSheet').then(m => m.default), { ssr: false })
const CadastroRegraComissaoSheet = dynamic(() => import('@/components/modulos/comercial/CadastroRegraComissaoSheet').then(m => m.default), { ssr: false })
const CadastroCampanhaVendasSheet = dynamic(() => import('@/components/modulos/comercial/CadastroCampanhaVendasSheet').then(m => m.default), { ssr: false })

type Row = TableData

type CampanhaItem = {
  produto: string
  incentivo_percentual: number | null
  incentivo_valor: number | null
  meta_quantidade: number | null
}

type CampanhaRow = Row & {
  produtos?: CampanhaItem[]
}

export default function ModulosComercialPage() {
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
  const [refreshKey] = useState(0)
  // Filtros específicos (aba Metas)
  const [metaAno, setMetaAno] = useState<number | 'todos'>('todos')
  const [metaMes, setMetaMes] = useState<number | 'todos'>('todos')
  // Escopo do desempenho: vendedores | territorios
  const [perfScope, setPerfScope] = useState<'vendedores' | 'territorios'>('vendedores')
  // Escopo dos resultados: vendedores | territorios
  const [resScope, setResScope] = useState<'vendedores' | 'territorios'>('vendedores')

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    if (name === 'Barlow') return 'var(--font-barlow), "Barlow", sans-serif'
    return name
  }

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Comercial',
      subtitle: 'Gestão de territórios e vendedores'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'territorios', label: 'Territórios' },
        { value: 'vendedores', label: 'Vendedores' },
        { value: 'desempenho', label: 'Visão Geral' },
        { value: 'resultados', label: 'Metas x Realizado' },
        { value: 'metas', label: 'Metas' },
        { value: 'tipos_metas', label: 'Tipos de Metas' },
        { value: 'regras_comissoes', label: 'Regras de Comissões' },
        { value: 'campanhas_vendas', label: 'Campanhas de Vendas' },
      ],
      selected: 'territorios',
    })
  }, [])

  const iconFor = (_v: string) => <List className="h-4 w-4" />
  const tabOptions: Opcao[] = useMemo(() => (tabs.options.map((opt) => ({ ...opt, icon: iconFor(opt.value) })) as Opcao[]), [tabs.options])

  const formatDate = (value?: unknown) => {
    if (!value) return ''
    try {
      const d = new Date(String(value))
      if (isNaN(d.getTime())) return String(value)
      return d.toLocaleDateString('pt-BR')
    } catch { return String(value) }
  }

  const formatPercent = (value?: unknown) => {
    const n = Number(value)
    if (Number.isFinite(n)) return `${n.toFixed(1)}%`
    return ''
  }

  const formatBRL = (value?: unknown) => {
    const n = Number(value ?? 0)
    if (isNaN(n)) return String(value ?? '')
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const renderCampanhaProdutos = (row: Row) => {
    const campanhaRow = row as CampanhaRow
    const produtos = campanhaRow.produtos || []

    if (produtos.length === 0) return null

    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Produtos da Campanha</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Produto</th>
              <th className="text-right py-2 px-3">Incentivo %</th>
              <th className="text-right py-2 px-3">Incentivo Valor</th>
              <th className="text-right py-2 px-3">Meta Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.produto}</td>
                <td className="text-right py-2 px-3">{item.incentivo_percentual ?? '-'}</td>
                <td className="text-right py-2 px-3">{item.incentivo_valor ?? '-'}</td>
                <td className="text-right py-2 px-3">{item.meta_quantidade ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Detalhe colapsável para a aba "Metas"
  const renderMetaDetail = (row: Row) => {
    const metaId = row['meta_id']
    const children = data.filter(r => r['meta_id'] === metaId && r !== row)

    // (dim label map removido por não uso)

    return (
      <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Itens da Meta — {String(row['vendedor'] || '')}</div>
        {children.length === 0 ? (
          <div className="text-xs text-gray-500">Sem metas específicas para este vendedor nesta página.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Tipo Meta</th>
                  <th className="text-right py-2 px-3">Ano</th>
                  <th className="text-right py-2 px-3">Mês</th>
                  <th className="text-left py-2 px-3">Tipo Valor</th>
                  <th className="text-right py-2 px-3">Valor Meta</th>
                  <th className="text-right py-2 px-3">% Meta</th>
                  <th className="text-left py-2 px-3">Criado</th>
                  <th className="text-left py-2 px-3">Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {children.map((c, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2 px-3">{String(c['tipo_meta'] || '')}</td>
                    <td className="text-right py-2 px-3">{c['ano'] ?? ''}</td>
                    <td className="text-right py-2 px-3">{c['mes'] ?? ''}</td>
                    <td className="py-2 px-3">{String(c['tipo_meta_valor'] || '')}</td>
                    <td className="text-right py-2 px-3">{String(c['valor_meta'] ?? '')}</td>
                    <td className="text-right py-2 px-3">{String(c['meta_percentual'] ?? '')}</td>
                    <td className="py-2 px-3">{formatDate(c['criado_em'])}</td>
                    <td className="py-2 px-3">{formatDate(c['atualizado_em'])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'territorios':
        return [
          { accessorKey: 'territorio', header: () => <IconLabelHeader icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Território" /> },
          { accessorKey: 'descricao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" /> },
          { accessorKey: 'territorio_pai', header: () => <IconLabelHeader icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Território Pai" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'vendedores':
        return [
          { accessorKey: 'vendedor', header: () => <IconLabelHeader icon={<Users className="h-3.5 w-3.5" />} label="Vendedor" />,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['vendedor'] ? String(row.original['vendedor']) : '—'}
              />
            )
          },
          { accessorKey: 'email', header: () => <IconLabelHeader icon={<Mail className="h-3.5 w-3.5" />} label="E-mail" /> },
          { accessorKey: 'telefone', header: () => <IconLabelHeader icon={<Phone className="h-3.5 w-3.5" />} label="Telefone" /> },
          { accessorKey: 'territorio', header: () => <IconLabelHeader icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Território" />,
            cell: ({ row }) => (
              <StatusBadge value={row.original['territorio']} type="status" />
            )
          },
          { accessorKey: 'territorio_descricao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição Território" /> },
          { accessorKey: 'comissao', header: () => <IconLabelHeader icon={<Percent className="h-3.5 w-3.5" />} label="Comissão (%)" /> },
          { accessorKey: 'vendedor_ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'regras_comissoes':
        return [
          { accessorKey: 'regra', header: () => <IconLabelHeader icon={<Settings className="h-3.5 w-3.5" />} label="Regra" /> },
          { accessorKey: 'descricao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" /> },
          { accessorKey: 'percentual_padrao', header: () => <IconLabelHeader icon={<Percent className="h-3.5 w-3.5" />} label="Percentual Padrão (%)" /> },
          { accessorKey: 'percentual_minimo', header: () => <IconLabelHeader icon={<Percent className="h-3.5 w-3.5" />} label="Percentual Mínimo (%)" /> },
          { accessorKey: 'percentual_maximo', header: () => <IconLabelHeader icon={<Percent className="h-3.5 w-3.5" />} label="Percentual Máximo (%)" /> },
          { accessorKey: 'regra_ativa', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'metas':
        return [
          { accessorKey: 'vendedor', header: () => <IconLabelHeader icon={<Users className="h-3.5 w-3.5" />} label="Vendedor" /> },
          { accessorKey: 'ano', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Ano" /> },
          { accessorKey: 'mes', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Mês" /> },
          { accessorKey: 'tipo_meta', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo Meta" /> },
          { accessorKey: 'tipo_valor', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo Valor" /> },
          { accessorKey: 'valor_meta', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor Meta" /> },
          { accessorKey: 'meta_percentual', header: () => <IconLabelHeader icon={<Percent className="h-3.5 w-3.5" />} label="% Meta" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'desempenho':
        return perfScope === 'vendedores'
          ? [
              { accessorKey: 'vendedor_nome', header: () => <IconLabelHeader icon={<Users className="h-3.5 w-3.5" />} label="Vendedor" /> },
              { accessorKey: 'territorio_nome', header: () => <IconLabelHeader icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Território" /> },
              { accessorKey: 'faturamento_total', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Faturamento" /> , cell: ({ getValue }) => formatBRL(getValue()) },
              { accessorKey: 'total_pedidos', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Pedidos" /> },
              { accessorKey: 'quantidade_servicos', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Serviços" /> },
              { accessorKey: 'ticket_medio', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Ticket Médio" />, cell: ({ getValue }) => formatBRL(getValue()) },
            ]
          : [
              { accessorKey: 'territorio_nome', header: () => <IconLabelHeader icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Território" /> },
              { accessorKey: 'faturamento_total', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Faturamento" /> , cell: ({ getValue }) => formatBRL(getValue()) },
              { accessorKey: 'total_pedidos', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Pedidos" /> },
              { accessorKey: 'quantidade_servicos', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Serviços" /> },
              { accessorKey: 'ticket_medio', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Ticket Médio" />, cell: ({ getValue }) => formatBRL(getValue()) },
            ]
      case 'resultados':
        return resScope === 'vendedores'
          ? [
              { accessorKey: 'vendedor_nome', header: () => <IconLabelHeader icon={<Users className="h-3.5 w-3.5" />} label="Vendedor" /> },
              { accessorKey: 'meta_faturamento', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Meta Faturamento" />, cell: ({ getValue }) => formatBRL(getValue()) },
              { accessorKey: 'realizado_faturamento', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Faturamento" />, cell: ({ getValue }) => formatBRL(getValue()) },
              { accessorKey: 'meta_ticket_medio', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Meta Ticket Médio" />, cell: ({ getValue }) => formatBRL(getValue()) },
              { accessorKey: 'realizado_ticket_medio', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Ticket Médio" />, cell: ({ getValue }) => formatBRL(getValue()) },
              { accessorKey: 'meta_novos_clientes', header: () => <IconLabelHeader icon={<Users className="h-3.5 w-3.5" />} label="Meta Novos Clientes" /> },
              { accessorKey: 'realizado_novos_clientes', header: () => <IconLabelHeader icon={<Users className="h-3.5 w-3.5" />} label="Novos Clientes" /> },
            ]
          : [
              { accessorKey: 'territorio_nome', header: () => <IconLabelHeader icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Território" /> },
              { accessorKey: 'meta_faturamento', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Meta Faturamento" />, cell: ({ getValue }) => formatBRL(getValue()) },
              { accessorKey: 'realizado_faturamento', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Faturamento" />, cell: ({ getValue }) => formatBRL(getValue()) },
              { accessorKey: 'meta_ticket_medio', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Meta Ticket Médio" />, cell: ({ getValue }) => formatBRL(getValue()) },
              { accessorKey: 'realizado_ticket_medio', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Ticket Médio" />, cell: ({ getValue }) => formatBRL(getValue()) },
              { accessorKey: 'meta_novos_clientes', header: () => <IconLabelHeader icon={<Users className="h-3.5 w-3.5" />} label="Meta Novos Clientes" /> },
              { accessorKey: 'realizado_novos_clientes', header: () => <IconLabelHeader icon={<Users className="h-3.5 w-3.5" />} label="Novos Clientes" /> },
            ]
      case 'tipos_metas':
        return [
          { accessorKey: 'tipo_meta_id', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="ID" /> },
          { accessorKey: 'tipo_meta_nome', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Nome" /> },
          { accessorKey: 'descricao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" /> },
          { accessorKey: 'tipo_valor', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo Valor" /> },
          { accessorKey: 'medida_sql', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Medida SQL" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'campanhas_vendas':
        return [
          { accessorKey: 'campanha', header: () => <IconLabelHeader icon={<Briefcase className="h-3.5 w-3.5" />} label="Campanha" /> },
          { accessorKey: 'tipo', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo" /> },
          { accessorKey: 'descricao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" /> },
          { accessorKey: 'data_inicio', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Data Início" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'data_fim', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Data Fim" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado Em" />, cell: ({ getValue }) => formatDate(getValue()) },
        ]
      default:
        return []
    }
  }, [tabs.selected, perfScope, resScope])

  // Forçar no-wrap em TODAS as colunas da tabela atual
  const allNoWrapOptions = useMemo(() => {
    const opts: Record<string, { cellNoWrap: boolean; widthMode: 'auto'; minWidth?: number }> = {}
    for (const col of columns) {
      const def = col as ColumnDef<Row>
      const ak = (def as { accessorKey?: string | keyof Row }).accessorKey
      const id = (def as { id?: string }).id
      const key = typeof ak === 'string' ? ak : id
      if (key) {
        opts[String(key)] = { cellNoWrap: true, widthMode: 'auto' }
      }
    }
    return opts
  }, [columns])

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
        if (tabs.selected === 'metas') {
          if (metaAno !== 'todos') params.set('ano', String(metaAno))
          if (metaMes !== 'todos') params.set('mes', String(metaMes))
        } else if (tabs.selected === 'desempenho') {
          params.set('scope', perfScope)
        } else if (tabs.selected === 'resultados') {
          params.set('scope', resScope)
        }
        const url = `/api/modulos/comercial?${params.toString()}`
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
  }, [tabs.selected, page, pageSize, refreshKey, metaAno, metaMes, perfScope, resScope])

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
                  />
                </div>
                <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
                  <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
                    {tabs.selected === 'metas' ? (
                      <div className="w-full">
                        <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">Ano</label>
                              <select
                                className="h-8 px-2 border rounded text-sm"
                                value={metaAno === 'todos' ? '' : String(metaAno)}
                                onChange={(e) => setMetaAno(e.target.value ? Number(e.target.value) : 'todos')}
                              >
                                <option value="">Todos</option>
                                {Array.from({ length: 7 }).map((_, i) => {
                                  const y = new Date().getFullYear() - i
                                  return <option key={y} value={y}>{y}</option>
                                })}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">Mês</label>
                              <select
                                className="h-8 px-2 border rounded text-sm"
                                value={metaMes === 'todos' ? '' : String(metaMes)}
                                onChange={(e) => setMetaMes(e.target.value ? Number(e.target.value) : 'todos')}
                              >
                                <option value="">Todos</option>
                                {Array.from({ length: 12 }).map((_, i) => (
                                  <option key={i+1} value={i+1}>{i+1}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="h-7 w-7 p-0 border rounded text-sm"
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                              disabled={page <= 1}
                              title="Anterior"
                            >
                              &lsaquo;
                            </button>
                            <div className="mx-1 min-w-[120px] text-center text-sm">
                              {total === 0 ? 0 : (page - 1) * pageSize + 1}–{total === 0 ? 0 : Math.min(page * pageSize, total)} de {total}
                            </div>
                            <button
                              className="h-7 w-7 p-0 border rounded text-sm"
                              onClick={() => setPage((p) => p + 1)}
                              disabled={page * pageSize >= total}
                              title="Próxima"
                            >
                              &rsaquo;
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <DataToolbar
                        from={total === 0 ? 0 : (page - 1) * pageSize + 1}
                        to={total === 0 ? 0 : Math.min(page * pageSize, total)}
                        total={total}
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        leftExtra={(tabs.selected === 'desempenho' || tabs.selected === 'resultados') ? (
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Agrupar</label>
                            <select
                              className="h-8 px-2 border rounded text-sm"
                              value={tabs.selected === 'desempenho' ? perfScope : resScope}
                              onChange={(e) => {
                                const v = e.target.value as 'vendedores' | 'territorios'
                                if (tabs.selected === 'desempenho') setPerfScope(v)
                                else setResScope(v)
                              }}
                            >
                              <option value="vendedores">Vendedores</option>
                              <option value="territorios">Territórios</option>
                            </select>
                          </div>
                        ) : undefined}
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
                          tabs.selected === 'territorios' ? (
                            <CadastroTerritorioSheet triggerLabel="Cadastrar" onSaved={() => setPage(1)} />
                          ) : tabs.selected === 'vendedores' ? (
                            <CadastroVendedorSheet triggerLabel="Cadastrar" onSaved={() => setPage(1)} />
                          ) : tabs.selected === 'tipos_metas' ? (
                            <CadastroTipoMetaSheet triggerLabel="Cadastrar" onSaved={() => setPage(1)} />
                          ) : tabs.selected === 'regras_comissoes' ? (
                            <CadastroRegraComissaoSheet triggerLabel="Cadastrar" onSaved={() => setPage(1)} />
                          ) : tabs.selected === 'campanhas_vendas' ? (
                            <CadastroCampanhaVendasSheet triggerLabel="Cadastrar" onSaved={() => setPage(1)} />
                          ) : undefined
                        }
                      />
                    )}
                  </div>
                  <div className="flex-1 min-h-0 overflow-auto" style={{ marginBottom: layout.mbTable }}>
                    <div className="border-y bg-background" style={{ borderColor: tabelaUI.borderColor }}>
                      {isLoading ? (
                        <div className="p-6 text-sm text-gray-500">Carregando dados…</div>
                      ) : error ? (
                        <div className="p-6 text-sm text-red-600">Erro ao carregar: {error}</div>
                      ) : (
                        <DataTable
                          key={`${tabs.selected}-${tabs.selected === 'desempenho' ? perfScope : tabs.selected === 'resultados' ? resScope : ''}`}
                          columns={columns}
                          data={
                            (tabs.selected === 'metas')
                              ? (() => {
                                  const seen = new Set<string | number>()
                                  const heads: Row[] = []
                                  for (const r of data) {
                                    const k = r['meta_id'] as string | number | undefined
                                    if (k == null) continue
                                    if (!seen.has(k)) { seen.add(k); heads.push(r) }
                                  }
                                  return heads
                                })()
                              : data
                          }
                          columnOptions={{
                            ...allNoWrapOptions,
                            ...(allNoWrapOptions['territorio'] ? { territorio: { ...allNoWrapOptions['territorio'], minWidth: 160 } } : {}),
                            ...(allNoWrapOptions['vendedor'] ? { vendedor: { ...allNoWrapOptions['vendedor'], minWidth: 160 } } : {}),
                            ...(allNoWrapOptions['tipo_meta'] ? { tipo_meta: { ...allNoWrapOptions['tipo_meta'], minWidth: 140 } } : {}),
                            ...(allNoWrapOptions['campanha'] ? { campanha: { ...allNoWrapOptions['campanha'], minWidth: 160 } } : {}),
                            ...(allNoWrapOptions['descricao'] ? { descricao: { ...allNoWrapOptions['descricao'], minWidth: 180 } } : {}),
                          }}
                          enableExpand={tabs.selected === 'campanhas_vendas' || tabs.selected === 'metas'}
                          renderDetail={
                            tabs.selected === 'campanhas_vendas' ? renderCampanhaProdutos
                            : tabs.selected === 'metas' ? renderMetaDetail
                            : undefined
                          }
                          rowCanExpand={tabs.selected === 'metas' ? () => true : undefined}
                          enableSearch={tabs.selected === 'metas' ? false : tabelaUI.enableSearch}
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
