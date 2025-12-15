'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusHeader from '@/components/nexus/NexusHeader'
import NexusPageContainer from '@/components/nexus/NexusPageContainer'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import DataToolbar from '@/components/modulos/DataToolbar'
import CadastroOrdemServicoSheet from '@/components/modulos/servicos/CadastroOrdemServicoSheet'
import CadastroAgendamentoSheet from '@/components/modulos/servicos/CadastroAgendamentoSheet'
import CadastroTecnicoSheet from '@/components/modulos/servicos/CadastroTecnicoSheet'
import CadastroClienteSheet from '@/components/modulos/servicos/CadastroClienteSheet'
import CadastroServicoSheet from '@/components/modulos/servicos/CadastroServicoSheet'
import StatusBadge from '@/components/modulos/StatusBadge'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { Wrench, Calendar, User, Users, List } from 'lucide-react'
import ImagemEditorSheet from '@/components/modulos/servicos/ImagemEditorSheet'

type Row = TableData

export default function ModulosServicosPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Serviços',
      subtitle: 'Selecione uma opção para visualizar os dados'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'catalogo', label: 'Catálogo de Serviços' },
        { value: 'categorias', label: 'Categorias' },
        { value: 'tabelas-preco', label: 'Tabelas de Preço' },
        { value: 'slas', label: 'SLAs' },
      ],
      selected: 'catalogo',
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
      case 'categorias':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'nome', header: 'Categoria' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'categoria_pai_id', header: 'Categoria Pai' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'tabelas-preco':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'nome', header: 'Tabela' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'ativo', header: 'Status' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'slas':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'servico', header: 'Serviço' },
          { accessorKey: 'tempo_estimado', header: 'Tempo Estimado' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'catalogo':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'nome', header: 'Serviço' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'categoria_nome', header: 'Categoria' },
          { accessorKey: 'unidade_medida', header: 'Unidade' },
          { accessorKey: 'preco_padrao', header: 'Preço Padrão', cell: ({ row }) => formatBRL(row.original['preco_padrao']) },
          { accessorKey: 'ativo', header: 'Status' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      // Legacy cases retained for now (if needed)
      case 'agendamentos':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'numero_os', header: 'Nº OS' },
          { accessorKey: 'tecnico', header: 'Técnico' },
          { accessorKey: 'data_agendada', header: 'Data Agendada', cell: ({ row }) => formatDate(row.original['data_agendada'], true) },
          { accessorKey: 'data_inicio', header: 'Início', cell: ({ row }) => formatDate(row.original['data_inicio'], true) },
          { accessorKey: 'data_fim', header: 'Fim', cell: ({ row }) => formatDate(row.original['data_fim'], true) },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'observacoes', header: 'Observações' },
        ]
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
      case 'clientes':
        return [
          { accessorKey: 'id', header: 'ID' },
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
                onClick={() => openImagemEditor('cliente', row.original['id'] as string | number, { nome: String(row.original['cliente'] || ''), imagem_url: row.original['cliente_imagem_url'] ? String(row.original['cliente_imagem_url']) : undefined })}
                clickable
              />
            )
          },
          { accessorKey: 'segmento', header: 'Segmento' },
          { accessorKey: 'telefone', header: 'Telefone' },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'cidade_uf', header: 'Cidade/UF' },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'total_ordens', header: 'Total de Ordens' },
          { accessorKey: 'ultima_os', header: 'Última OS', cell: ({ row }) => formatDate(row.original['ultima_os']) },
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

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('view', tabs.selected)
        if (['ordens-servico', 'agendamentos', 'servicos'].includes(tabs.selected)) {
          if (dateRange?.from) {
            const d = dateRange.from
            params.set('de', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
          if (dateRange?.to) {
            const d = dateRange.to
            params.set('ate', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
          }
        }
        if (!(tabs.selected === 'tecnicos' || tabs.selected === 'clientes')) {
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
        case 'catalogo':
          return <List className="h-4 w-4" />
        case 'categorias':
          return <List className="h-4 w-4" />
        case 'tabelas-preco':
          return <List className="h-4 w-4" />
        case 'slas':
          return <Wrench className="h-4 w-4" />
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
                      from={(tabs.selected !== 'tecnicos' && tabs.selected !== 'clientes' ? total : data.length) === 0 ? 0 : (page - 1) * pageSize + 1}
                      to={(tabs.selected !== 'tecnicos' && tabs.selected !== 'clientes' ? total : data.length) === 0 ? 0 : Math.min(page * pageSize, (tabs.selected !== 'tecnicos' && tabs.selected !== 'clientes' ? total : data.length))}
                      total={tabs.selected !== 'tecnicos' && tabs.selected !== 'clientes' ? total : data.length}
                      dateRange={['ordens-servico', 'agendamentos'].includes(tabs.selected) ? dateRange : undefined}
                      onDateRangeChange={['ordens-servico', 'agendamentos'].includes(tabs.selected) ? setDateRange : undefined}
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
                          pageIndex={!(tabs.selected === 'tecnicos' || tabs.selected === 'clientes') ? page - 1 : undefined}
                          serverSidePagination={!(tabs.selected === 'tecnicos' || tabs.selected === 'clientes')}
                          serverTotalRows={!(tabs.selected === 'tecnicos' || tabs.selected === 'clientes') ? total : undefined}
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
