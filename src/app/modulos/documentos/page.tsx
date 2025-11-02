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
import { List } from 'lucide-react'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, documentosUiActions } from '@/stores/modulos/documentosUiStore'

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
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    documentosUiActions.setTabs({
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
        ]
      case 'juridico':
        return [
          { accessorKey: 'data_emissao', header: 'Data', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'tipo_documento', header: 'Tipo (Procurações, Aditivos, etc.)' },
          { accessorKey: 'numero', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'status', header: 'Status' },
        ]
      case 'comercial':
        return [
          { accessorKey: 'data_emissao', header: 'Data', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'tipo_documento', header: 'Tipo (Propostas, Pedidos)' },
          { accessorKey: 'numero', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'status', header: 'Status' },
        ]
      case 'rh':
        return [
          { accessorKey: 'data_emissao', header: 'Data', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'tipo_documento', header: 'Tipo (Contracheque, Atestado, etc.)' },
          { accessorKey: 'numero', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'status', header: 'Status' },
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
        ]
      case 'outros':
      default:
        return [
          { accessorKey: 'data_emissao', header: 'Data', cell: ({ row }) => formatDate(row.original['data_emissao']) },
          { accessorKey: 'tipo_documento', header: 'Tipo' },
          { accessorKey: 'numero', header: 'Número' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'status', header: 'Status' },
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
  }, [tabs.selected, dateRange?.from, dateRange?.to])

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
            />
          </div>
          <div style={{ marginBottom: 0 }}>
            <TabsNav
              options={tabOptions}
              value={tabs.selected}
              onValueChange={(v) => documentosUiActions.setTabs({ selected: v })}
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
