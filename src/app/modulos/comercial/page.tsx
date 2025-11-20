"use client"

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import DataToolbar from '@/components/modulos/DataToolbar'
import DataTable, { type TableData } from '@/components/widgets/Table'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import { List } from 'lucide-react'

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
  const [refreshKey, setRefreshKey] = useState(0)
  // Filtros específicos (aba Metas)
  const [metaAno, setMetaAno] = useState<number | 'todos'>('todos')
  const [metaMes, setMetaMes] = useState<number | 'todos'>('todos')

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
        { value: 'meta_vendedores', label: 'Meta Vendedores' },
        { value: 'meta_territorios', label: 'Meta Territórios' },
        { value: 'metas_territorios', label: 'Metas Territórios' },
        { value: 'metas', label: 'Metas' },
        { value: 'tipos_metas', label: 'Tipos de Metas' },
        { value: 'desempenho', label: 'Desempenho' },
        { value: 'regras_comissoes', label: 'Regras de Comissões' },
        { value: 'campanhas_vendas', label: 'Campanhas de Vendas' },
      ],
      selected: 'territorios',
    })
  }, [])

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

  const formatPercent = (value?: unknown) => {
    const n = Number(value)
    if (Number.isFinite(n)) return `${n.toFixed(1)}%`
    return ''
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
    const isParent = Boolean(row['parent_flag'])
    if (!isParent) return null

    const metaId = row['meta_id']
    const children = data.filter(r => r['meta_id'] === metaId && r['meta_item_id'])

    const labelForDim = (dim?: unknown) => {
      const m: Record<string, string> = {
        sales_office_nome: 'Sales Office',
        unidade_negocio_nome: 'Unidade de Negócio',
        filial_nome: 'Filial',
        canal_venda_nome: 'Canal de Venda',
        territorio_nome: 'Território',
      }
      const k = String(dim || '')
      return m[k] || k || 'Dimensão'
    }

    return (
      <div className="p-3 bg-gray-50 rounded border border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">Itens da Meta — {String(row['vendedor_nome'] || '')}</div>
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
                    <td className="py-2 px-3">{String(c['tipo_meta_nome'] || '')}</td>
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
          { accessorKey: 'territorio', header: 'Território' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'territorio_pai', header: 'Território Pai' },
          { accessorKey: 'ativo', header: 'Ativo' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'vendedores':
        return [
          { accessorKey: 'vendedor', header: 'Vendedor' },
          { accessorKey: 'email', header: 'E-mail' },
          { accessorKey: 'telefone', header: 'Telefone' },
          { accessorKey: 'territorio', header: 'Território' },
          { accessorKey: 'territorio_descricao', header: 'Descrição Território' },
          { accessorKey: 'comissao', header: 'Comissão (%)' },
          { accessorKey: 'vendedor_ativo', header: 'Ativo' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'meta_vendedores':
        return [
          { accessorKey: 'vendedor', header: 'Vendedor' },
          { accessorKey: 'territorio', header: 'Território' },
          { accessorKey: 'periodo', header: 'Período' },
          { accessorKey: 'meta', header: 'Meta' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'meta_territorios':
        return [
          { accessorKey: 'territorio', header: 'Território' },
          { accessorKey: 'territorio_descricao', header: 'Descrição Território' },
          { accessorKey: 'periodo', header: 'Período' },
          { accessorKey: 'meta', header: 'Meta' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'regras_comissoes':
        return [
          { accessorKey: 'regra', header: 'Regra' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'percentual_padrao', header: 'Percentual Padrão (%)' },
          { accessorKey: 'percentual_minimo', header: 'Percentual Mínimo (%)' },
          { accessorKey: 'percentual_maximo', header: 'Percentual Máximo (%)' },
          { accessorKey: 'regra_ativa', header: 'Ativo' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'metas':
        return [
          { accessorKey: 'vendedor_nome', header: 'Vendedor' },
          { accessorKey: 'ano', header: 'Ano' },
          { accessorKey: 'mes', header: 'Mês' },
          { accessorKey: 'tipo_meta', header: 'Tipo Meta' },
          { accessorKey: 'tipo_valor', header: 'Tipo Valor' },
          { accessorKey: 'valor_meta', header: 'Valor Meta' },
          { accessorKey: 'meta_percentual', header: '% Meta' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'desempenho':
        return [
          { accessorKey: 'vendedor_nome', header: 'Vendedor' },
          { accessorKey: 'ano', header: 'Ano' },
          { accessorKey: 'mes', header: 'Mês' },
          { accessorKey: 'valor_meta', header: 'Meta' },
          { accessorKey: 'valor_atingido', header: 'Atingido' },
          { accessorKey: 'atingimento_percent', header: 'Atingimento (%)', cell: ({ getValue }) => formatPercent(getValue()) },
        ]
      case 'tipos_metas':
        return [
          { accessorKey: 'tipo_meta_id', header: 'ID' },
          { accessorKey: 'tipo_meta_nome', header: 'Nome' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'tipo_valor', header: 'Tipo Valor' },
          { accessorKey: 'medida_sql', header: 'Medida SQL' },
          { accessorKey: 'ativo', header: 'Ativo' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
      case 'campanhas_vendas':
        return [
          { accessorKey: 'campanha', header: 'Campanha' },
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'data_inicio', header: 'Data Início', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'data_fim', header: 'Data Fim', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'ativo', header: 'Ativo' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
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
        if (tabs.selected === 'metas') {
          if (metaAno !== 'todos') params.set('ano', String(metaAno))
          if (metaMes !== 'todos') params.set('mes', String(metaMes))
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
  }, [tabs.selected, page, pageSize, refreshKey, metaAno, metaMes])

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
        </div>
        <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
          <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
            {tabs.selected === 'metas' || tabs.selected === 'desempenho' ? (
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
                      ‹
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
                      ›
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
                  key={tabs.selected}
                  columns={columns}
                  data={
                    tabs.selected === 'metas' || tabs.selected === 'desempenho' || tabs.selected === 'metas_territorios'
                      ? data.filter(r => Boolean(r['parent_flag']))
                      : data
                  }
                  enableExpand={tabs.selected === 'campanhas_vendas' || tabs.selected === 'metas' || tabs.selected === 'desempenho' || tabs.selected === 'metas_territorios'}
                  renderDetail={
                    tabs.selected === 'campanhas_vendas'
                      ? renderCampanhaProdutos
                      : tabs.selected === 'metas'
                        ? renderMetaDetail
                        : tabs.selected === 'desempenho'
                          ? (row) => {
                              const isParent = Boolean(row['parent_flag'])
                              if (!isParent) return null
                              const ano = row['ano']
                              const mes = row['mes']
                              const vendedor = String(row['vendedor_nome'] || '')
                              const children = data.filter(r => String(r['vendedor_nome'] || '') === vendedor && r['ano'] === ano && r['mes'] === mes && !r['parent_flag'])
                              return (
                                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                  <div className="text-sm font-medium text-gray-700 mb-2">Desempenho por Tipo de Meta — {vendedor}</div>
                                  {children.length === 0 ? (
                                    <div className="text-xs text-gray-500">Sem itens de meta para este período.</div>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="border-b">
                                            <th className="text-left py-2 px-3">Tipo Meta</th>
                                            <th className="text-right py-2 px-3">Meta</th>
                                            <th className="text-right py-2 px-3">Atingido</th>
                                            <th className="text-right py-2 px-3">Atingimento</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {children.map((c, idx) => (
                                            <tr key={idx} className="border-b last:border-0">
                                              <td className="py-2 px-3">{String(c['tipo_meta_nome'] || '')}</td>
                                              <td className="text-right py-2 px-3">{String(c['valor_meta'] ?? '')}</td>
                                              <td className="text-right py-2 px-3">{String(c['valor_atingido'] ?? '')}</td>
                                              <td className="text-right py-2 px-3">{formatPercent(c['atingimento_percent'])}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )
                            }
                          : tabs.selected === 'metas_territorios'
                            ? (row) => {
                                const isParent = Boolean(row['parent_flag'])
                                if (!isParent) return null
                                const metaId = row['meta_id']
                                const children = data.filter(r => r['meta_id'] === metaId && r['meta_item_id'])
                                return (
                                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                    <div className="text-sm font-medium text-gray-700 mb-2">Itens da Meta — {String(row['territorio_nome'] || '')}</div>
                                    {children.length === 0 ? (
                                      <div className="text-xs text-gray-500">Sem itens para esta meta.</div>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="border-b">
                                              <th className="text-left py-2 px-3">Tipo Meta</th>
                                              <th className="text-right py-2 px-3">Valor Meta</th>
                                              <th className="text-right py-2 px-3">% Meta</th>
                                              <th className="text-left py-2 px-3">Tipo Valor</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {children.map((c, idx) => (
                                              <tr key={idx} className="border-b last:border-0">
                                                <td className="py-2 px-3">{String(c['tipo_meta_nome'] || '')}</td>
                                                <td className="text-right py-2 px-3">{String(c['valor_meta'] ?? '')}</td>
                                                <td className="text-right py-2 px-3">{String(c['meta_percentual'] ?? '')}</td>
                                                <td className="py-2 px-3">{String(c['tipo_meta_valor'] || '')}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                )
                              }
                        : undefined
                  }
                  rowCanExpand={
                    tabs.selected === 'metas'
                      ? (r) => Boolean(r['parent_flag'])
                      : tabs.selected === 'desempenho'
                        ? (r) => Boolean(r['parent_flag'])
                        : tabs.selected === 'metas_territorios'
                          ? (r) => Boolean(r['parent_flag'])
                      : undefined
                  }
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
      </SidebarInset>
    </SidebarProvider>
  )
}
      case 'metas_territorios':
        return [
          { accessorKey: 'territorio_nome', header: 'Território' },
          { accessorKey: 'ano', header: 'Ano' },
          { accessorKey: 'mes', header: 'Mês' },
          { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ getValue }) => formatDate(getValue()) },
          { accessorKey: 'atualizado_em', header: 'Atualizado Em', cell: ({ getValue }) => formatDate(getValue()) },
        ]
