"use client"

import { useMemo, useState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import DataToolbar from '@/components/modulos/DataToolbar'
import CadastroRegraContabilSheet from '@/components/modulos/contabilidade/CadastroRegraContabilSheet'
import DataTable, { type TableData } from '@/components/widgets/Table'
import BalanceTAccountView from '@/components/modulos/contabilidade/BalanceTAccountView'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusHeader from '@/components/navigation/nexus/NexusHeader'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'
import { FileText, Landmark, BarChart3, BookOpen, Wrench, Calendar, CalendarClock, CheckCircle2, DollarSign, Tag, Briefcase, ChevronRight, ChevronDown } from 'lucide-react'
import IconLabelHeader from '@/components/widgets/IconLabelHeader'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'

type Row = TableData

export default function ModulosContabilidadePage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)
  const [data, setData] = useState<Row[]>([])
  // DRE agora usa tabela simples (API: view=dre-tabela)
  type BPLinha = { conta: string; valor: number }
  type BPGrupo = { nome: string; linhas: BPLinha[] }
  type BPData = { ativo: BPGrupo[]; passivo: BPGrupo[]; pl: BPGrupo[] }
  const [bpData, setBpData] = useState<BPData>({ ativo: [], passivo: [], pl: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)
  const [dreExpanded, setDreExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    moduleUiActions.setTitulo({ title: 'Contabilidade', subtitle: 'Lançamentos, balancetes e plano de contas' })
    moduleUiActions.setTabs({
      options: [
        { value: 'lancamentos', label: 'Lançamentos contábeis', icon: <FileText className="text-slate-600" /> },
        { value: 'balanco-patrimonial', label: 'Balanço Patrimonial', icon: <Landmark className="text-blue-700" /> },
        { value: 'dre', label: 'DRE', icon: <BarChart3 className="text-emerald-700" /> },
        { value: 'plano-contas', label: 'Plano de Contas', icon: <BookOpen className="text-indigo-700" /> },
        { value: 'regras-contabeis', label: 'Regras contábeis', icon: <Wrench className="text-amber-600" /> },
      ],
      selected: 'lancamentos',
    })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        // Aba DRE usa a view específica 'dre-tabela'
        params.set('view', tabs.selected === 'dre' ? 'dre-tabela' : tabs.selected)
        let deParam: string | undefined
        let ateParam: string | undefined
        if (dateRange?.from) {
          const d = new Date(dateRange.from)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          deParam = `${yyyy}-${mm}-${dd}`
          params.set('de', deParam)
        }
        if (dateRange?.to) {
          const d = new Date(dateRange.to)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          ateParam = `${yyyy}-${mm}-${dd}`
          params.set('ate', ateParam)
        }
        // Paginação server-side (não aplicável para Balanço, pois usa componente próprio)
        if (!['balanco-patrimonial'].includes(tabs.selected)) {
          params.set('page', String(page))
          params.set('pageSize', String(pageSize))
        }
        if (tabs.selected === 'balanco-patrimonial') {
          const url = `/api/modulos/contabilidade?${params.toString()}`
          const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const json = await res.json()
          setBpData({
            ativo: Array.isArray(json?.ativo) ? (json.ativo as BPGrupo[]) : [],
            passivo: Array.isArray(json?.passivo) ? (json.passivo as BPGrupo[]) : [],
            pl: Array.isArray(json?.pl) ? (json.pl as BPGrupo[]) : [],
          })
          setTotal(0)
        } else {
          const url = `/api/modulos/contabilidade?${params.toString()}`
          const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const json = await res.json()
          const rows = (json?.rows || []) as Row[]
          setData(Array.isArray(rows) ? rows : [])
          setTotal(Number(json?.total ?? rows.length) || 0)
        }
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

  // Reset page ao mudar de aba ou período
  useEffect(() => {
    setPage(1)
  }, [tabs.selected, dateRange?.from, dateRange?.to])

  const tabOptions: Opcao[] = useMemo(() => (tabs.options as Opcao[]), [tabs.options])

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

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'lancamentos':
        return [
          { accessorKey: 'data_lancamento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Data" />, cell: ({ row }) => formatDate(row.original['data_lancamento']) },
          { accessorKey: 'historico', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Histórico" /> },
          { accessorKey: 'linha_id', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Linha" /> },
          { accessorKey: 'conta_id', header: () => <IconLabelHeader icon={<BookOpen className="h-3.5 w-3.5" />} label="Conta" /> },
          { accessorKey: 'debito', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Débito" />, cell: ({ row }) => formatBRL(row.original['debito']) },
          { accessorKey: 'credito', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Crédito" />, cell: ({ row }) => formatBRL(row.original['credito']) },
          { accessorKey: 'historico_linha', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Histórico Linha" /> },
          { accessorKey: 'total_debitos', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Total Débitos" />, cell: ({ row }) => formatBRL(row.original['total_debitos']) },
          { accessorKey: 'total_creditos', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Total Créditos" />, cell: ({ row }) => formatBRL(row.original['total_creditos']) },
        ]
      case 'balanco-patrimonial':
        return [
          { accessorKey: 'grupo', header: 'Grupo' },
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'tipo', header: 'Tipo (Ativo/Passivo/PL)' },
          { accessorKey: 'saldo_inicial', header: 'Saldo Inicial', cell: ({ row }) => formatBRL(row.original['saldo_inicial']) },
          { accessorKey: 'movimentos', header: 'Movimentos', cell: ({ row }) => formatBRL(row.original['movimentos']) },
          { accessorKey: 'saldo_final', header: 'Saldo Final', cell: ({ row }) => formatBRL(row.original['saldo_final']) },
          { accessorKey: 'nivel', header: 'Nível' },
        ]
      case 'dre':
        return [
          { accessorKey: 'secao', header: 'Seção' },
          { accessorKey: 'codigo_conta', header: 'Código' },
          { accessorKey: 'conta_contabil', header: 'Conta' },
          { accessorKey: 'valor', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor']) },
        ]
      case 'centros-de-custo':
        return [
          { accessorKey: 'codigo', header: 'Código' },
          { accessorKey: 'nome', header: 'Nome' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'centros-de-lucro':
        return [
          { accessorKey: 'codigo', header: 'Código' },
          { accessorKey: 'nome', header: 'Nome' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'plano-contas':
        return [
          { accessorKey: 'codigo', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Código" /> },
          { accessorKey: 'nome', header: () => <IconLabelHeader icon={<BookOpen className="h-3.5 w-3.5" />} label="Nome" /> },
          { accessorKey: 'grupo_principal', header: () => <IconLabelHeader icon={<Briefcase className="h-3.5 w-3.5" />} label="Grupo" /> },
          { accessorKey: 'nivel', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Nível" /> },
          { accessorKey: 'aceita_lancamento', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Aceita Lançamento" /> },
          { accessorKey: 'codigo_pai', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Código Pai" /> },
          { accessorKey: 'conta_pai', header: () => <IconLabelHeader icon={<BookOpen className="h-3.5 w-3.5" />} label="Conta Pai" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado em" />, cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado em" />, cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'categorias':
        return [
          { accessorKey: 'codigo', header: 'Código' },
          { accessorKey: 'nome', header: 'Nome' },
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'nivel', header: 'Nível' },
          { accessorKey: 'ativo', header: 'Ativo' },
        ]
      case 'segmentos':
        return [
          { accessorKey: 'codigo', header: 'Código' },
          { accessorKey: 'nome', header: 'Nome' },
          { accessorKey: 'ordem', header: 'Ordem' },
          { accessorKey: 'separador', header: 'Separador' },
          { accessorKey: 'ativo', header: 'Ativo' },
        ]
      case 'regras-contabeis':
        return [
          { accessorKey: 'origem', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Origem" /> },
          { accessorKey: 'subtipo', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Subtipo" /> },
          { accessorKey: 'codigo_conta_debito', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Cód. Débito" /> },
          { accessorKey: 'conta_debito', header: () => <IconLabelHeader icon={<BookOpen className="h-3.5 w-3.5" />} label="Conta Débito" /> },
          { accessorKey: 'codigo_conta_credito', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Cód. Crédito" /> },
          { accessorKey: 'conta_credito', header: () => <IconLabelHeader icon={<BookOpen className="h-3.5 w-3.5" />} label="Conta Crédito" /> },
          { accessorKey: 'descricao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado em" />, cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado em" />, cell: ({ row }) => formatDate(row.original['atualizado_em']) },
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
            <NexusHeader viewMode={'dashboard'} onChangeViewMode={() => {}} borderless size="sm" showBreadcrumb={false} />
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2" data-page="nexus">
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
                      actionComponent={tabs.selected === 'regras-contabeis' ? (
                        <CadastroRegraContabilSheet onSaved={() => setReloadKey(k => k + 1)} />
                      ) : undefined}
                    />
                  </div>
                  <div className="flex-1 min-h-0 overflow-auto" style={{ marginBottom: layout.mbTable }}>
                    <div
                      className={`border-y ${tabs.selected === 'balanco-patrimonial' ? '' : 'bg-background'} ${tabs.selected === 'dre' ? 'overflow-auto max-h-[70vh]' : ''}`}
                      style={{ borderColor: tabelaUI.borderColor, background: tabs.selected === 'balanco-patrimonial' ? 'transparent' : undefined }}
                    >
                      {isLoading ? (
                        <div className="p-6 text-sm text-gray-500">Carregando dados…</div>
                      ) : error ? (
                        <div className="p-6 text-sm text-red-600">Erro ao carregar: {error}</div>
                      ) : tabs.selected === 'dre' ? (
                        <div className="rounded-lg border bg-white">
                          <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Seção / Conta</th>
                                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const bySec = new Map<string, Row[]>()
                                  for (const r of data) {
                                    const s = String((r as any)['secao'] || '')
                                    if (!bySec.has(s)) bySec.set(s, [])
                                    bySec.get(s)!.push(r)
                                  }
                                  const sections = Array.from(bySec.entries())
                                  return sections.map(([secao, rows]) => {
                                    const total = rows.reduce((acc, r) => acc + Number((r as any)['valor'] || 0), 0)
                                    const open = Boolean(dreExpanded[secao])
                                    return (
                                      <>
                                        <tr key={secao} className="border-b border-gray-200 bg-white">
                                          <td className="px-4 py-3 text-gray-900 font-semibold">
                                            <button
                                              type="button"
                                              onClick={() => setDreExpanded(prev => ({ ...prev, [secao]: !prev[secao] }))}
                                              className="mr-2 text-gray-700 hover:text-gray-900 align-middle"
                                              aria-label={open ? 'Recolher' : 'Expandir'}
                                            >
                                              {open ? <ChevronDown className="w-4 h-4 inline" /> : <ChevronRight className="w-4 h-4 inline" />}
                                            </button>
                                            <span>{secao}</span>
                                          </td>
                                          <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                                            {Number.isFinite(total) ? Number(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}
                                          </td>
                                        </tr>
                                        {open && rows.map((r, idx) => {
                                          const codigo = String((r as any)['codigo_conta'] ?? '')
                                          const conta = String((r as any)['conta_contabil'] ?? '')
                                          const valor = Number((r as any)['valor'] || 0)
                                          return (
                                            <tr key={`${secao}-${codigo}-${idx}`} className="border-b border-gray-100">
                                              <td className="px-4 py-2 text-gray-800">
                                                <span className="text-xs text-gray-500 mr-2">{codigo}</span>
                                                <span>{conta}</span>
                                              </td>
                                              <td className="px-4 py-2 text-right text-gray-800">
                                                {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </>
                                    )
                                  })
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : tabs.selected === 'balanco-patrimonial' ? (
                        <BalanceTAccountView data={bpData} />
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
