'use client'

import { useMemo, useEffect, useState } from 'react'
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
import { CreditCard, ArrowDownCircle, ArrowUpCircle, List } from 'lucide-react'
import FornecedorEditorSheet from '@/components/modulos/financeiro/FornecedorEditorSheet'

type Row = TableData

export default function ModulosFinanceiroPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  // Filtro de datas (range)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)

  useEffect(() => {
    financeiroUiActions.setTabs({
      options: [
        { value: 'contas-a-pagar', label: 'Contas a Pagar' },
        { value: 'contas-a-receber', label: 'Contas a Receber' },
        { value: 'pagamentos-efetuados', label: 'Pagamentos Efetuados' },
        { value: 'pagamentos-recebidos', label: 'Pagamentos Recebidos' },
        { value: 'movimentos', label: 'Movimentos' },
      ],
      selected: 'contas-a-pagar',
    })
  }, [])

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    return name
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

  const renderStatusBadge = (status?: unknown) => {
    const statusStr = String(status || '').toLowerCase()

    let bgColor = '#f3f4f6'
    let textColor = '#6b7280'

    if (statusStr === 'pago' || statusStr === 'recebido') {
      bgColor = '#dcfce7'
      textColor = '#16a34a'
    } else if (statusStr === 'pendente' || statusStr === 'em aberto') {
      bgColor = '#fef3c7'
      textColor = '#ca8a04'
    } else if (statusStr === 'vencido' || statusStr === 'atrasado') {
      bgColor = '#fee2e2'
      textColor = '#dc2626'
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 500,
        backgroundColor: bgColor,
        color: textColor
      }}>
        {String(status)}
      </span>
    )
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'contas-a-receber':
        return [
          {
            accessorKey: 'cliente',
            header: 'Cliente',
            cell: ({ row }) => {
              const nome = row.original['cliente'] || 'Sem nome'
              const categoria = row.original['cliente_categoria'] || 'Sem categoria'
              const imagemUrl = row.original['cliente_imagem_url']
              const colors = getColorFromName(String(nome))

              return (
                <div className="flex items-center">
                  <div
                    className="flex items-center justify-center mr-3 cursor-pointer"
                    role="button"
                    onClick={() => openEditor(row.original)}
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
                    <button
                      type="button"
                      onClick={() => openEditor(row.original)}
                      className="text-left"
                      style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}
                    >
                      {String(nome)}
                    </button>
                    <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{String(categoria)}</div>
                  </div>
                </div>
              )
            }
          },
          {
            id: 'acoes',
            header: 'Ações',
            cell: ({ row }) => (
              <button
                type="button"
                onClick={() => openEditor(row.original)}
                className="text-blue-600 hover:underline"
                style={{ fontSize: 13 }}
              >
                Editar
              </button>
            ),
            enableSorting: false,
          },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'data_vencimento', header: 'Vencimento', cell: ({ row }) => formatDate(row.original['data_vencimento']) },
          { accessorKey: 'valor_total', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => renderStatusBadge(row.original['status']) },
        ]
      case 'pagamentos-efetuados':
        return [
          {
            accessorKey: 'fornecedor',
            header: 'Fornecedor',
            cell: ({ row }) => {
              const nome = row.original['fornecedor'] || 'Sem nome'
              const categoria = row.original['fornecedor_categoria'] || 'Sem categoria'
              const imagemUrl = row.original['fornecedor_imagem_url']
              const colors = getColorFromName(String(nome))

              return (
                <div className="flex items-center">
                  <div
                    className="flex items-center justify-center mr-3 cursor-pointer"
                    role="button"
                    onClick={() => openEditor(row.original)}
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
                    <button
                      type="button"
                      onClick={() => openEditor(row.original)}
                      className="text-left"
                      style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}
                    >
                      {String(nome)}
                    </button>
                    <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{String(categoria)}</div>
                  </div>
                </div>
              )
            }
          },
          {
            id: 'acoes',
            header: 'Ações',
            cell: ({ row }) => (
              <button
                type="button"
                onClick={() => openEditor(row.original)}
                className="text-blue-600 hover:underline"
                style={{ fontSize: 13 }}
              >
                Editar
              </button>
            ),
            enableSorting: false,
          },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'data_pagamento', header: 'Pago em', cell: ({ row }) => formatDate(row.original['data_pagamento']) },
          { accessorKey: 'valor_total', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'tipo_titulo', header: 'Tipo' },
        ]
      case 'pagamentos-recebidos':
        return [
          {
            accessorKey: 'cliente',
            header: 'Cliente',
            cell: ({ row }) => {
              const nome = row.original['cliente'] || 'Sem nome'
              const categoria = row.original['cliente_categoria'] || 'Sem categoria'
              const imagemUrl = row.original['cliente_imagem_url']
              const colors = getColorFromName(String(nome))

              return (
                <div className="flex items-center">
                  <div
                    className="flex items-center justify-center mr-3 cursor-pointer"
                    role="button"
                    onClick={() => openEditor(row.original)}
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
                    <button
                      type="button"
                      onClick={() => openEditor(row.original)}
                      className="text-left"
                      style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}
                    >
                      {String(nome)}
                    </button>
                    <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{String(categoria)}</div>
                  </div>
                </div>
              )
            }
          },
          {
            id: 'acoes',
            header: 'Ações',
            cell: ({ row }) => (
              <button
                type="button"
                onClick={() => openEditor(row.original)}
                className="text-blue-600 hover:underline"
                style={{ fontSize: 13 }}
              >
                Editar
              </button>
            ),
            enableSorting: false,
          },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'data_recebimento', header: 'Recebido em', cell: ({ row }) => formatDate(row.original['data_recebimento']) },
          { accessorKey: 'valor_total', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => renderStatusBadge(row.original['status']) },
        ]
      case 'movimentos':
        return [
          { accessorKey: 'data', header: 'Data', cell: ({ row }) => formatDate(row.original['data']) },
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'valor', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor']) },
          { accessorKey: 'categoria_nome', header: 'Categoria' },
          { accessorKey: 'conta_nome', header: 'Conta' },
        ]
      case 'contas-a-pagar':
      default:
        return [
          {
            accessorKey: 'fornecedor',
            header: 'Fornecedor',
            cell: ({ row }) => {
              const nome = row.original['fornecedor'] || 'Sem nome'
              const categoria = row.original['fornecedor_categoria'] || 'Sem categoria'
              const imagemUrl = row.original['fornecedor_imagem_url']
              const colors = getColorFromName(String(nome))

              return (
                <div className="flex items-center">
                  <div className="flex items-center justify-center mr-3"
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
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{String(nome)}</div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{String(categoria)}</div>
                  </div>
                </div>
              )
            }
          },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'data_vencimento', header: 'Vencimento', cell: ({ row }) => formatDate(row.original['data_vencimento']) },
          { accessorKey: 'valor_total', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => renderStatusBadge(row.original['status']) },
        ]
    }
  }, [tabs.selected])

  const [data, setData] = useState<Row[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState<number>(0)

  // Editor (fornecedor + conta)
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedConta, setSelectedConta] = useState<{
    id: string
    descricao?: string
    data_vencimento?: string
    valor_total?: number | string
    status?: string
    tipo_titulo?: string
  } | null>(null)
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<string | null>(null)
  const [fornecedorPrefill, setFornecedorPrefill] = useState<{ nome_fornecedor?: string; imagem_url?: string } | undefined>(undefined)

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
        const url = `/api/modulos/financeiro?${params.toString()}`
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
  }, [tabs.selected, dateRange?.from, dateRange?.to, reloadKey])

  const openEditor = (row: Row) => {
    const fornecedorId = row['fornecedor_id']
    const contaId = row['conta_id']
    if (!fornecedorId || !contaId) return
    setSelectedFornecedorId(String(fornecedorId))
    setSelectedConta({
      id: String(contaId),
      descricao: String(row['descricao'] ?? ''),
      data_vencimento: String(row['data_vencimento'] ?? ''),
      valor_total: (row['valor_total'] as number) ?? '',
      status: String(row['status'] ?? ''),
      tipo_titulo: row['tipo_titulo'] ? String(row['tipo_titulo']) : undefined,
    })
    setFornecedorPrefill({
      nome_fornecedor: row['fornecedor'] ? String(row['fornecedor']) : undefined,
      imagem_url: row['fornecedor_imagem_url'] ? String(row['fornecedor_imagem_url']) : undefined,
    })
    setEditorOpen(true)
  }

  const tabOptions: Opcao[] = useMemo(() => {
    const iconFor = (v: string) => {
      switch (v) {
        case 'contas-a-pagar':
          return <CreditCard className="h-4 w-4" />
        case 'contas-a-receber':
          return <ArrowDownCircle className="h-4 w-4" />
        case 'pagamentos-efetuados':
          return <ArrowUpCircle className="h-4 w-4" />
        case 'pagamentos-recebidos':
          return <ArrowDownCircle className="h-4 w-4" />
        case 'movimentos':
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
        {/* Conteúdo abaixo das tabs */}
        <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
          {/* Toolbar direita (paginador + botão) */}
          <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
            <DataToolbar
              from={data.length === 0 ? 0 : 1}
              to={Math.min(tabelaUI.pageSize, data.length)}
              total={data.length}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
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
      <FornecedorEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        conta={selectedConta}
        fornecedorId={selectedFornecedorId}
        fornecedorPrefill={fornecedorPrefill}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </SidebarProvider>
  )
}
