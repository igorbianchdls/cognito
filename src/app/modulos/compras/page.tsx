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
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { ShoppingCart, PackageCheck, ClipboardList, FileText } from 'lucide-react'
import ComprasKpiRow from '@/components/modulos/compras/ComprasKpiRow'
import CotacoesKpiRow from '@/components/modulos/compras/CotacoesKpiRow'

type Row = TableData

type CompraLinhaItem = {
  linha_id: number
  produto: string | null
  quantidade: number | null
  unidade_medida: string | null
  preco_unitario: number | null
  total_linha: number | null
}

type CompraRow = Row & {
  linhas?: CompraLinhaItem[]
}

type RecebimentoLinhaItem = {
  recebimento_linha_id: number
  produto: string | null
  quantidade_recebida: number | null
  lote: string | null
  validade: string | null
}

type RecebimentoRow = Row & {
  linhas?: RecebimentoLinhaItem[]
}

type SolicitacaoItemItem = {
  solicitacao_linha_id: number
  produto: string | null
  quantidade: number | null
  unidade_medida: string | null
  centro_custo: string | null
  projeto: string | null
}

type SolicitacaoRow = Row & {
  itens?: SolicitacaoItemItem[]
}

type CotacaoFornecedorItem = {
  cotacao_fornecedor_id: number
  fornecedor: string | null
  status_fornecedor: string | null
  data_envio: string | null
  data_resposta: string | null
  resposta_data: string | null
  resposta_validade: string | null
  resposta_prazo: string | null
  resposta_pagamento: string | null
  preco_ofertado: number | null
  desconto: number | null
  prazo_item: string | null
}

type CotacaoLinhaItem = {
  cotacao_linha_id: number
  produto: string | null
  quantidade: number | null
  unidade_medida: string | null
  fornecedores: CotacaoFornecedorItem[]
}

type CotacaoRow = Row & {
  linhas?: CotacaoLinhaItem[]
}

export default function ModulosComprasPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Compras',
      subtitle: 'Gestão de ordens de compra e recebimentos'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'compras', label: 'Compras' },
        { value: 'recebimentos', label: 'Recebimentos' },
        { value: 'solicitacoes_compra', label: 'Solicitações de Compra' },
        { value: 'cotacoes', label: 'Cotações' },
      ],
      selected: 'compras',
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
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [kpisCotacoes, setKpisCotacoes] = useState({ abertas: 0, respondidas: 0, aprovadas: 0, totalPeriodo: 0 })
  const [kpisCompras, setKpisCompras] = useState({ canceladas: 0, emAprovacao: 0, aprovadas: 0, totalPeriodo: 0 })

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

  const renderCompraLinhas = (row: Row) => {
    const compraRow = row as CompraRow
    const linhas = compraRow.linhas || []

    if (linhas.length === 0) return null

    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Linhas da Compra</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Produto</th>
              <th className="text-right py-2 px-3">Quantidade</th>
              <th className="text-left py-2 px-3">Unidade</th>
              <th className="text-right py-2 px-3">Preço Unitário</th>
              <th className="text-right py-2 px-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.produto ?? '-'}</td>
                <td className="text-right py-2 px-3">{item.quantidade ?? '-'}</td>
                <td className="py-2 px-3">{item.unidade_medida ?? '-'}</td>
                <td className="text-right py-2 px-3">{item.preco_unitario ? formatBRL(item.preco_unitario) : '-'}</td>
                <td className="text-right py-2 px-3">{item.total_linha ? formatBRL(item.total_linha) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderRecebimentoLinhas = (row: Row) => {
    const recebimentoRow = row as RecebimentoRow
    const linhas = recebimentoRow.linhas || []

    if (linhas.length === 0) return null

    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Linhas do Recebimento</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Produto</th>
              <th className="text-right py-2 px-3">Quantidade Recebida</th>
              <th className="text-left py-2 px-3">Lote</th>
              <th className="text-left py-2 px-3">Validade</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.produto ?? '-'}</td>
                <td className="text-right py-2 px-3">{item.quantidade_recebida ?? '-'}</td>
                <td className="py-2 px-3">{item.lote ?? '-'}</td>
                <td className="py-2 px-3">{item.validade ? formatDate(item.validade) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderSolicitacaoItens = (row: Row) => {
    const solicitacaoRow = row as SolicitacaoRow
    const itens = solicitacaoRow.itens || []

    if (itens.length === 0) return null

    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Itens da Solicitação</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Produto</th>
              <th className="text-right py-2 px-3">Quantidade</th>
              <th className="text-left py-2 px-3">Unidade</th>
              <th className="text-left py-2 px-3">Centro de Custo</th>
              <th className="text-left py-2 px-3">Projeto</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 px-3">{item.produto ?? '-'}</td>
                <td className="text-right py-2 px-3">{item.quantidade ?? '-'}</td>
                <td className="py-2 px-3">{item.unidade_medida ?? '-'}</td>
                <td className="py-2 px-3">{item.centro_custo ?? '-'}</td>
                <td className="py-2 px-3">{item.projeto ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderCotacaoLinhas = (row: Row) => {
    const cotacaoRow = row as CotacaoRow
    const linhas = cotacaoRow.linhas || []

    if (linhas.length === 0) return null

    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-2">Linhas da Cotação</h4>
        {linhas.map((linha, idx) => (
          <div key={idx} className="mb-4 last:mb-0">
            <div className="bg-white p-3 rounded mb-2">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><span className="font-semibold">Produto:</span> {linha.produto ?? '-'}</div>
                <div><span className="font-semibold">Quantidade:</span> {linha.quantidade ?? '-'}</div>
                <div><span className="font-semibold">Unidade:</span> {linha.unidade_medida ?? '-'}</div>
              </div>
            </div>
            {linha.fornecedores && linha.fornecedores.length > 0 && (
              <table className="w-full text-sm ml-4">
                <thead>
                  <tr className="border-b bg-gray-100">
                    <th className="text-left py-2 px-3">Fornecedor</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-right py-2 px-3">Preço</th>
                    <th className="text-right py-2 px-3">Desconto</th>
                    <th className="text-left py-2 px-3">Prazo Item</th>
                    <th className="text-left py-2 px-3">Data Envio</th>
                    <th className="text-left py-2 px-3">Data Resposta</th>
                  </tr>
                </thead>
                <tbody>
                  {linha.fornecedores.map((forn, fidx) => (
                    <tr key={fidx} className="border-b last:border-0">
                      <td className="py-2 px-3">{forn.fornecedor ?? '-'}</td>
                      <td className="py-2 px-3">{forn.status_fornecedor ?? '-'}</td>
                      <td className="text-right py-2 px-3">{forn.preco_ofertado ? formatBRL(forn.preco_ofertado) : '-'}</td>
                      <td className="text-right py-2 px-3">{forn.desconto ?? '-'}</td>
                      <td className="py-2 px-3">{forn.prazo_item ?? '-'}</td>
                      <td className="py-2 px-3">{forn.data_envio ? formatDate(forn.data_envio) : '-'}</td>
                      <td className="py-2 px-3">{forn.data_resposta ? formatDate(forn.data_resposta) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    )
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    if (tabs.selected === 'recebimentos') {
      return [
        { accessorKey: 'recebimento_id', header: 'ID' },
        { accessorKey: 'data_recebimento', header: 'Data Recebimento', cell: ({ row }) => formatDate(row.original['data_recebimento']) },
        { accessorKey: 'numero_oc', header: 'Número OC' },
        { accessorKey: 'compra_data', header: 'Data Compra', cell: ({ row }) => formatDate(row.original['compra_data']) },
        { accessorKey: 'fornecedor', header: 'Fornecedor' },
        { accessorKey: 'compra_valor_total', header: 'Valor Compra', cell: ({ row }) => formatBRL(row.original['compra_valor_total']) },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
        { accessorKey: 'observacoes', header: 'Observações' },
        { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
      ]
    }

    if (tabs.selected === 'solicitacoes_compra') {
      return [
        { accessorKey: 'solicitacao_id', header: 'ID' },
        { accessorKey: 'solicitado_por', header: 'Solicitado Por' },
        { accessorKey: 'departamento', header: 'Departamento' },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
        { accessorKey: 'urgencia', header: 'Urgência' },
        { accessorKey: 'observacoes', header: 'Observações' },
        { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
      ]
    }

    if (tabs.selected === 'cotacoes') {
      return [
        { accessorKey: 'cotacao_id', header: 'ID' },
        { accessorKey: 'numero_cotacao', header: 'Número Cotação' },
        { accessorKey: 'data_solicitacao', header: 'Data Solicitação', cell: ({ row }) => formatDate(row.original['data_solicitacao']) },
        { accessorKey: 'prazo_resposta', header: 'Prazo Resposta', cell: ({ row }) => formatDate(row.original['prazo_resposta']) },
        { accessorKey: 'valor_estimado', header: 'Valor Estimado', cell: ({ row }) => formatBRL(row.original['valor_estimado']) },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
        { accessorKey: 'observacoes', header: 'Observações' },
        { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
      ]
    }

    return [
    { accessorKey: 'compra_id', header: 'ID' },
    { accessorKey: 'numero_oc', header: 'Número OC' },
    { accessorKey: 'data_emissao', header: 'Data Emissão', cell: ({ row }) => formatDate(row.original['data_emissao']) },
    { accessorKey: 'data_entrega_prevista', header: 'Entrega Prevista', cell: ({ row }) => formatDate(row.original['data_entrega_prevista']) },
    { accessorKey: 'fornecedor', header: 'Fornecedor' },
    { accessorKey: 'filial', header: 'Filial' },
    { accessorKey: 'centro_custo', header: 'Centro de Custo' },
    { accessorKey: 'projeto', header: 'Projeto' },
    { accessorKey: 'categoria_financeira', header: 'Categoria Financeira' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
    { accessorKey: 'valor_total', header: 'Valor Total', cell: ({ row }) => formatBRL(row.original['valor_total']) },
    { accessorKey: 'observacoes', header: 'Observações' },
    { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
  ]}, [tabs.selected])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Removido: mock data para a aba Compras; passa a usar API real
        if (tabs.selected === 'cotacoes') {
          const rows = [
            { cotacao_id: 5001, numero_cotacao: 'CT-2024-001', data_solicitacao: '2024-06-10', prazo_resposta: '2024-06-15', valor_estimado: 4000, status: 'Aberta', observacoes: 'Enviar até 15/06', criado_em: '2024-06-10' },
            { cotacao_id: 5002, numero_cotacao: 'CT-2024-002', data_solicitacao: '2024-06-12', prazo_resposta: '2024-06-18', valor_estimado: 9200, status: 'Respondida', observacoes: '', criado_em: '2024-06-12' },
            { cotacao_id: 5003, numero_cotacao: 'CT-2024-003', data_solicitacao: '2024-06-14', prazo_resposta: '2024-06-19', valor_estimado: 1500, status: 'Aprovada', observacoes: '', criado_em: '2024-06-14' },
          ] as unknown as Row[]
          setData(rows)
          setTotal(rows.length)
          setKpisCotacoes({ abertas: 4000, respondidas: 9200, aprovadas: 1500, totalPeriodo: 14700 })
          return
        }
        const params = new URLSearchParams()
        params.set('view', tabs.selected)
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        const url = `/api/modulos/compras?${params.toString()}`
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

  useEffect(() => { setPage(1) }, [tabs.selected])

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'compras':
          return <ShoppingCart className="h-4 w-4" />
        case 'recebimentos':
          return <PackageCheck className="h-4 w-4" />
        case 'solicitacoes_compra':
          return <ClipboardList className="h-4 w-4" />
        case 'cotacoes':
          return <FileText className="h-4 w-4" />
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
            
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2">
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
                    {tabs.selected === 'compras' && (
                      <div className="mb-3">
                        <ComprasKpiRow
                          canceladas={kpisCompras.canceladas}
                          emAprovacao={kpisCompras.emAprovacao}
                          aprovadas={kpisCompras.aprovadas}
                          totalPeriodo={kpisCompras.totalPeriodo}
                        />
                      </div>
                    )}
                    {tabs.selected === 'cotacoes' && (
                      <div className="mb-3">
                        <CotacoesKpiRow
                          abertas={kpisCotacoes.abertas}
                          respondidas={kpisCotacoes.respondidas}
                          aprovadas={kpisCotacoes.aprovadas}
                          totalPeriodo={kpisCotacoes.totalPeriodo}
                        />
                      </div>
                    )}
                    <DataToolbar
                      from={total === 0 ? 0 : (page - 1) * pageSize + 1}
                      to={total === 0 ? 0 : Math.min(page * pageSize, total)}
                      total={total}
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
                        tabs.selected === 'compras' ? (
                          <a href="/modulos/compras/novo" className="inline-flex"><button className="inline-flex items-center px-3 py-2 rounded-md bg-primary text-primary-foreground">Nova Compra</button></a>
                        ) : tabs.selected === 'cotacoes' ? (
                          <a href="/modulos/compras/cotacoes/novo" className="inline-flex"><button className="inline-flex items-center px-3 py-2 rounded-md bg-primary text-primary-foreground">Nova Cotação</button></a>
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
                          enableExpand={true}
                          renderDetail={
                            tabs.selected === 'compras'
                              ? renderCompraLinhas
                              : tabs.selected === 'recebimentos'
                              ? renderRecebimentoLinhas
                              : tabs.selected === 'solicitacoes_compra'
                              ? renderSolicitacaoItens
                              : renderCotacaoLinhas
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
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
