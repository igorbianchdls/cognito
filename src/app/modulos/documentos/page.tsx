"use client"

import { useMemo, useState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import DataToolbar from '@/components/modulos/DataToolbar'
import CadastroFiscalDocumentoAnexoSheet from '@/components/documentos/CadastroFiscalDocumentoAnexoSheet'
import DataTable, { type TableData } from '@/components/widgets/Table'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { List } from 'lucide-react'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'

type Row = TableData

export default function ModulosDocumentosPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState<number>(0)
  const [anexosOpenFor, setAnexosOpenFor] = useState<number | null>(null)
  const [anexos, setAnexos] = useState<Array<{ id: number; nome_arquivo?: string; tipo_arquivo?: string; tamanho_bytes?: number; criado_em?: string }>>([])
  const [anexoUpload, setAnexoUpload] = useState<File | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    moduleUiActions.setTitulo({ title: 'Documentos', subtitle: 'Selecione uma opção para visualizar os dados', titleFontFamily: 'var(--font-crimson-text)' })
    moduleUiActions.setTabs({
      options: [
        { value: 'fiscal', label: 'Fiscal' },
        { value: 'financeiro', label: 'Financeiro' },
        { value: 'operacional', label: 'Operacional' },
        { value: 'juridico', label: 'Jurídico' },
        { value: 'comercial', label: 'Comercial' },
        { value: 'rh', label: 'RH' },
        { value: 'contratos', label: 'Contratos' },
        { value: 'outros', label: 'Outros' },
      ],
      selected: 'fiscal',
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
  const formatBRL = (value?: unknown) => {
    const n = Number(value ?? 0)
    return isNaN(n) ? String(value ?? '') : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const openAnexosDrawer = async (documentoId: number) => {
    if (!documentoId || Number.isNaN(documentoId)) return
    setAnexosOpenFor(documentoId)
    try {
      const res = await fetch(`/api/documentos/anexos/list?documento_id=${documentoId}`, { cache: 'no-store' })
      const json = await res.json()
      setAnexos(Array.isArray(json?.rows) ? json.rows : [])
    } catch {
      setAnexos([])
    }
  }

  const uploadAnexo = async () => {
    if (!anexosOpenFor || !anexoUpload) return
    const fd = new FormData()
    fd.set('documento_id', String(anexosOpenFor))
    fd.set('file', anexoUpload)
    const res = await fetch('/api/documentos/anexos/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (json?.success) {
      setAnexoUpload(null)
      await openAnexosDrawer(anexosOpenFor)
    }
  }

  const downloadAnexo = async (id: number) => {
    const res = await fetch(`/api/documentos/anexos/download?id=${id}`)
    const json = await res.json()
    if (json?.success && json?.url) {
      window.open(json.url, '_blank')
    }
  }

  const deleteAnexo = async (id: number) => {
    if (!confirm('Excluir anexo?')) return
    const res = await fetch(`/api/documentos/anexos/delete?id=${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json?.success && anexosOpenFor) {
      await openAnexosDrawer(anexosOpenFor)
    }
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'fiscal':
        return [
          { accessorKey: 'data_emissao', header: 'Emissão', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'tipo_documento', header: 'Tipo' },
          { accessorKey: 'numero', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'valor_total', header: 'Valor Total', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'cfop', header: 'CFOP' },
          { accessorKey: 'chave_acesso', header: 'Chave de Acesso' },
          { accessorKey: 'natureza_operacao', header: 'Natureza' },
          { accessorKey: 'modelo', header: 'Modelo' },
          { accessorKey: 'serie', header: 'Série' },
          { accessorKey: 'data_autorizacao', header: 'Autorizado em', cell: ({ row }) => formatDate(row.original['data_autorizacao']) },
          { accessorKey: 'xml_url', header: 'XML', cell: ({ row }) => {
            const url = row.original['xml_url'] as string | undefined
            return url ? (<a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Baixar</a>) : '-'
          } },
          { accessorKey: 'anexos', header: 'Anexos', cell: ({ row }) => {
            const rawId = (row.original['documento_id'] ?? row.original['id']) as unknown
            const docId = Number(rawId)
            if (!docId || Number.isNaN(docId)) return <span className="text-gray-400">-</span>
            return (
              <button className="text-blue-600 underline" onClick={() => openAnexosDrawer(docId)}>
                Ver anexos
              </button>
            )
          } },
        ]
      case 'financeiro':
        return [
          { accessorKey: 'data_emissao', header: 'Emissão', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'tipo_documento', header: 'Tipo' },
          { accessorKey: 'numero', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'meio_pagamento', header: 'Meio de Pagamento' },
          { accessorKey: 'banco_id', header: 'Banco' },
          { accessorKey: 'codigo_barras', header: 'Código de Barras' },
          { accessorKey: 'data_liquidacao', header: 'Liquidação', cell: ({ row }) => formatDate(row.original['data_liquidacao']) },
          { accessorKey: 'valor_total', header: 'Valor Total', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'valor_pago', header: 'Valor Pago', cell: ({ row }) => formatBRL(row.original['valor_pago']) },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
          { accessorKey: 'anexos', header: 'Anexos', cell: ({ row }) => {
            const rawId = (row.original['documento_id'] ?? row.original['id']) as unknown
            const docId = Number(rawId)
            if (!docId || Number.isNaN(docId)) return <span className="text-gray-400">-</span>
            return (
              <button className="text-blue-600 underline" onClick={() => openAnexosDrawer(docId)}>
                Ver anexos
              </button>
            )
          } },
        ]
      case 'operacional':
        return [
          { accessorKey: 'data_emissao', header: 'Emissão', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'tipo_documento', header: 'Tipo' },
          { accessorKey: 'numero', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'valor_total', header: 'Valor Total', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'responsavel_id', header: 'Responsável' },
          { accessorKey: 'local_execucao', header: 'Local de Execução' },
          { accessorKey: 'data_execucao', header: 'Data Execução', cell: ({ row }) => formatDate(row.original['data_execucao']) },
          { accessorKey: 'checklist_json', header: 'Checklist', cell: ({ row }) => {
            const v = row.original['checklist_json']
            try { return v ? JSON.stringify(v).slice(0, 120) + '…' : '-' } catch { return String(v ?? '-') }
          } },
          { accessorKey: 'observacoes', header: 'Observações' },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
          { accessorKey: 'anexos', header: 'Anexos', cell: ({ row }) => {
            const rawId = (row.original['documento_id'] ?? row.original['id']) as unknown
            const docId = Number(rawId)
            if (!docId || Number.isNaN(docId)) return <span className="text-gray-400">-</span>
            return (
              <button className="text-blue-600 underline" onClick={() => openAnexosDrawer(docId)}>
                Ver anexos
              </button>
            )
          } },
        ]
      case 'juridico':
        return [
          { accessorKey: 'data_emissao', header: 'Data', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'tipo_documento', header: 'Tipo (Procurações, Aditivos, etc.)' },
          { accessorKey: 'numero', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'anexos', header: 'Anexos', cell: ({ row }) => {
            const rawId = (row.original['documento_id'] ?? row.original['id']) as unknown
            const docId = Number(rawId)
            if (!docId || Number.isNaN(docId)) return <span className="text-gray-400">-</span>
            return (
              <button className="text-blue-600 underline" onClick={() => openAnexosDrawer(docId)}>
                Ver anexos
              </button>
            )
          } },
        ]
      case 'comercial':
        return [
          { accessorKey: 'data_emissao', header: 'Data', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'tipo_documento', header: 'Tipo (Propostas, Pedidos)' },
          { accessorKey: 'numero', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'anexos', header: 'Anexos', cell: ({ row }) => {
            const rawId = (row.original['documento_id'] ?? row.original['id']) as unknown
            const docId = Number(rawId)
            if (!docId || Number.isNaN(docId)) return <span className="text-gray-400">-</span>
            return (
              <button className="text-blue-600 underline" onClick={() => openAnexosDrawer(docId)}>
                Ver anexos
              </button>
            )
          } },
        ]
      case 'rh':
        return [
          { accessorKey: 'data_emissao', header: 'Data', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'tipo_documento', header: 'Tipo (Contracheque, Atestado, etc.)' },
          { accessorKey: 'numero', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'anexos', header: 'Anexos', cell: ({ row }) => {
            const rawId = (row.original['documento_id'] ?? row.original['id']) as unknown
            const docId = Number(rawId)
            if (!docId || Number.isNaN(docId)) return <span className="text-gray-400">-</span>
            return (
              <button className="text-blue-600 underline" onClick={() => openAnexosDrawer(docId)}>
                Ver anexos
              </button>
            )
          } },
        ]
      case 'contratos':
        return [
          { accessorKey: 'data_emissao', header: 'Emissão', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'tipo_documento', header: 'Tipo' },
          { accessorKey: 'numero', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'valor_total', header: 'Valor Total', cell: ({ row }) => formatBRL(row.original['valor_total']) },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'data_inicio', header: 'Início', cell: ({ row }) => formatDate(row.original['data_inicio']) },
          { accessorKey: 'data_fim', header: 'Fim', cell: ({ row }) => formatDate(row.original['data_fim']) },
          { accessorKey: 'prazo_meses', header: 'Prazo (meses)' },
          { accessorKey: 'renovacao_automatica', header: 'Renovação Automática' },
          { accessorKey: 'valor_mensal', header: 'Valor Mensal', cell: ({ row }) => formatBRL(row.original['valor_mensal']) },
          { accessorKey: 'objeto', header: 'Objeto' },
          { accessorKey: 'clausulas_json', header: 'Cláusulas', cell: ({ row }) => {
            const v = row.original['clausulas_json']
            try { return v ? JSON.stringify(v).slice(0, 120) + '…' : '-' } catch { return String(v ?? '-') }
          } },
          { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
          { accessorKey: 'anexos', header: 'Anexos', cell: ({ row }) => {
            const rawId = (row.original['documento_id'] ?? row.original['id']) as unknown
            const docId = Number(rawId)
            if (!docId || Number.isNaN(docId)) return <span className="text-gray-400">-</span>
            return (
              <button className="text-blue-600 underline" onClick={() => openAnexosDrawer(docId)}>
                Ver anexos
              </button>
            )
          } },
        ]
      case 'outros':
      default:
        return [
          { accessorKey: 'data_emissao', header: 'Data', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'tipo_documento', header: 'Tipo' },
          { accessorKey: 'numero', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'anexos', header: 'Anexos', cell: ({ row }) => {
            const rawId = (row.original['documento_id'] ?? row.original['id']) as unknown
            const docId = Number(rawId)
            if (!docId || Number.isNaN(docId)) return <span className="text-gray-400">-</span>
            return (
              <button className="text-blue-600 underline" onClick={() => openAnexosDrawer(docId)}>
                Ver anexos
              </button>
            )
          } },
        ]
    }
  }, [tabs.selected])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('view', tabs.selected)
        if (dateRange?.from) {
          const d = new Date(dateRange.from)
          params.set('de', `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
        }
        if (dateRange?.to) {
          const d = new Date(dateRange.to)
          params.set('ate', `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
        }
        params.set('page', '1')
        params.set('pageSize', '50')
        const url = `/api/modulos/documentos?${params.toString()}`
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setRows(Array.isArray(json?.rows) ? (json.rows as Row[]) : [])
        setTotal(Number(json?.total ?? 0))
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          setRows([])
          setTotal(0)
          setError(e instanceof Error ? e.message : 'Falha ao carregar dados')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [tabs.selected, dateRange?.from, dateRange?.to, refreshKey])

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto" style={{ background: layout.contentBg }}>
        <div style={{ background: 'white' }}>
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
        </div>
        <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
          <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
          <DataToolbar
            from={0}
            to={rows.length}
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
            actionComponent={tabs.selected === 'fiscal' ? (
              <CadastroFiscalDocumentoAnexoSheet
                triggerLabel="Cadastrar"
                onCreated={() => setRefreshKey((k) => k + 1)}
              />
            ) : undefined}
          />
          </div>
          <div className="flex-1 min-h-0 overflow-auto" style={{ marginBottom: layout.mbTable }}>
            <div className="border-y bg-background" style={{ borderColor: tabelaUI.borderColor }}>
              <DataTable
                columns={columns}
                data={rows}
                enableSearch={tabelaUI.enableSearch}
                showColumnToggle={tabelaUI.enableColumnToggle}
                showPagination={tabelaUI.showPagination}
                pageSize={tabelaUI.pageSize}
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
              />
            </div>
          </div>
          {anexosOpenFor && (
            <div className="fixed inset-0 bg-black/30 flex justify-end z-50" onClick={() => setAnexosOpenFor(null)}>
              <div className="w-full max-w-md bg-white h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Anexos do Documento #{anexosOpenFor}</h3>
                    <button className="text-gray-500" onClick={() => setAnexosOpenFor(null)}>Fechar</button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input type="file" onChange={(e) => setAnexoUpload(e.target.files?.[0] || null)} />
                    <button className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50" onClick={uploadAnexo} disabled={!anexoUpload}>Enviar</button>
                  </div>
                </div>
                <div className="p-4 overflow-auto h-[calc(100%-100px)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="p-2">Arquivo</th>
                        <th className="p-2">Tipo</th>
                        <th className="p-2">Data</th>
                        <th className="p-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anexos.length === 0 && (
                        <tr><td className="p-2 text-gray-500" colSpan={4}>Nenhum anexo</td></tr>
                      )}
                      {anexos.map((a) => (
                        <tr key={a.id} className="border-t">
                          <td className="p-2">{a.nome_arquivo || '-'}</td>
                          <td className="p-2">{a.tipo_arquivo || '-'}</td>
                          <td className="p-2">{a.criado_em ? new Date(a.criado_em).toLocaleString('pt-BR') : '-'}</td>
                          <td className="p-2 flex items-center gap-3">
                            <button className="text-blue-600 underline" onClick={() => downloadAnexo(a.id)}>Baixar</button>
                            <button className="text-red-600 underline" onClick={() => deleteAnexo(a.id)}>Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
 
// Drawer simples de anexos (inserido abaixo do componente principal)
// Nota: Em um cenário ideal, mover para componente separado e estilizar conforme design system
