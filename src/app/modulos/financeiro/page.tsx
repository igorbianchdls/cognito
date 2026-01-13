'use client'

import { useMemo, useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import DataToolbar from '@/components/modulos/DataToolbar'
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { CreditCard, ArrowDownCircle, ArrowUpCircle, List, Landmark, Wallet, Activity, CheckCheck, Receipt, Building2, FileText, Calendar, CalendarClock, DollarSign, CheckCircle2, Tag, Folder, PieChart, Building, User, Pencil } from 'lucide-react'
import DocumentViewer from '@/components/modulos/documentos/DocumentViewer'
import IconLabelHeader from '@/components/widgets/IconLabelHeader'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import FornecedorEditorSheet from '@/components/modulos/financeiro/FornecedorEditorSheet'
import ClienteEditorSheet from '@/components/modulos/financeiro/ClienteEditorSheet'
import BancoEditorSheet from '@/components/modulos/financeiro/BancoEditorSheet'
import CadastroContaAPagarSheet from '@/components/modulos/financeiro/CadastroContaAPagarSheet'
import CadastroContaAReceberSheet from '@/components/modulos/financeiro/CadastroContaAReceberSheet'
import CadastroPagamentoEfetuadoSheet from '@/components/modulos/financeiro/CadastroPagamentoEfetuadoSheet'
import CadastroPagamentoRecebidoSheet from '@/components/modulos/financeiro/CadastroPagamentoRecebidoSheet'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import CadastroBancoSheet from '@/components/modulos/financeiro/CadastroBancoSheet'
import CadastroContaFinanceiraSheet from '@/components/modulos/financeiro/CadastroContaFinanceiraSheet'
import CategoriaDespesaEditorModal from '@/components/modulos/financeiro/CategoriaDespesaEditorModal'
import CadastroCategoriaReceitaSheet from '@/components/modulos/financeiro/CadastroCategoriaReceitaSheet'
import CadastroCategoriaDespesaSheet from '@/components/modulos/financeiro/CadastroCategoriaDespesaSheet'
import CategoriaReceitaEditorModal from '@/components/modulos/financeiro/CategoriaReceitaEditorModal'
import ApKpiRow from '@/components/modulos/financeiro/ApKpiRow'
import ExtratoKpiRow from '@/components/modulos/financeiro/ExtratoKpiRow'
import RowActionsMenu from '@/components/modulos/financeiro/RowActionsMenu'
import { useRouter } from 'next/navigation'

type Row = TableData

export default function ModulosFinanceiroPage() {
  const router = useRouter()
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const tabelaUI = useStore($tabelaUI)
  const layout = useStore($layout)
  const toolbarUI = useStore($toolbarUI)

  // Filtro de datas (range)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)

  useEffect(() => {
    moduleUiActions.setTitulo({
      title: 'Financeiro',
      subtitle: 'Selecione uma opção para visualizar os dados'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'contas-a-pagar', label: 'A Pagar', icon: <ArrowUpCircle className="text-rose-500" /> },
        { value: 'contas-a-receber', label: 'A Receber', icon: <ArrowDownCircle className="text-emerald-600" /> },
        { value: 'extrato', label: 'Extrato', icon: <List className="text-blue-600" /> },
        { value: 'movimentos', label: 'Movimentos', icon: <Activity className="text-amber-600" /> },
        { value: 'contas', label: 'Contas Financeiras', icon: <Wallet className="text-gray-700" /> },
        { value: 'categorias-despesa', label: 'Categorias Despesa', icon: <Folder className="text-violet-700" /> },
        { value: 'categorias-receita', label: 'Categorias Receita', icon: <Folder className="text-emerald-700" /> },
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

  // Nested detail component for Contas a Pagar: linhas do título
  function LinhasContaPagar({ contaPagarId }: { contaPagarId: number }) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [rows, setRows] = useState<Array<Record<string, unknown>>>([])
    // Simple cache per ID to avoid refetch on re-open
    const cacheRef = (LinhasContaPagar as unknown as { _cache?: Map<number, Array<Record<string, unknown>>> })._cache
      || new Map<number, Array<Record<string, unknown>>>()
    ;(LinhasContaPagar as unknown as { _cache?: Map<number, Array<Record<string, unknown>>> })._cache = cacheRef

    useEffect(() => {
      let cancelled = false
      async function load() {
        try {
          setLoading(true); setError(null)
          if (!contaPagarId || !Number.isFinite(contaPagarId)) throw new Error('ID de conta inválido')
          if (cacheRef.has(contaPagarId)) {
            setRows(cacheRef.get(contaPagarId) || [])
            return
          }
          const res = await fetch(`/api/modulos/financeiro/contas-a-pagar/${contaPagarId}/linhas`, { cache: 'no-store' })
          const j = await res.json()
          if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
          const list: Array<Record<string, unknown>> = Array.isArray(j.rows) ? j.rows : []
          if (!cancelled) {
            setRows(list)
            cacheRef.set(contaPagarId, list)
          }
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Falha ao carregar linhas')
        } finally {
          if (!cancelled) setLoading(false)
        }
      }
      load();
      return () => { cancelled = true }
    }, [contaPagarId])

    if (loading) return <div className="text-xs text-gray-500 p-3">Carregando itens…</div>
    if (error) return <div className="text-xs text-red-600 p-3">{error}</div>
    if (!rows.length) return <div className="text-xs text-gray-500 p-3">Sem itens para este lançamento.</div>

    return (
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600">
              <th className="text-left p-2">Linha</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Descrição</th>
              <th className="text-right p-2">Qtd</th>
              <th className="text-right p-2">Valor Unit.</th>
              <th className="text-right p-2">Bruto</th>
              <th className="text-right p-2">Desconto</th>
              <th className="text-right p-2">Impostos</th>
              <th className="text-right p-2">Líquido</th>
              <th className="text-left p-2">Categoria</th>
              <th className="text-left p-2">Departamento</th>
              <th className="text-left p-2">Centro Custo</th>
              <th className="text-left p-2">Unidade</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={String(r['conta_pagar_linha_id'] ?? i)} className="border-t border-gray-200">
                <td className="p-2">{String(r['conta_pagar_linha_id'] ?? i + 1)}</td>
                <td className="p-2">{String(r['tipo_linha'] ?? '—')}</td>
                <td className="p-2">{String(r['descricao'] ?? '—')}</td>
                <td className="p-2 text-right">{String(r['quantidade'] ?? '0')}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_unitario'])}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_bruto'])}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_desconto'])}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_impostos'])}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_liquido'])}</td>
                <td className="p-2">{String(r['categoria_despesa'] ?? '')}</td>
                <td className="p-2">{String(r['departamento'] ?? '')}</td>
                <td className="p-2">{String(r['centro_custo'] ?? '')}</td>
                <td className="p-2">{String(r['unidade_negocio'] ?? '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Nested detail component for Pagamentos Efetuados: linhas do pagamento
  function LinhasPagamentoEfetuado({ pagamentoId }: { pagamentoId: number }) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [rows, setRows] = useState<Array<Record<string, unknown>>>([])
    const cacheRef = (LinhasPagamentoEfetuado as unknown as { _cache?: Map<number, Array<Record<string, unknown>>> })._cache
      || new Map<number, Array<Record<string, unknown>>>()
    ;(LinhasPagamentoEfetuado as unknown as { _cache?: Map<number, Array<Record<string, unknown>>> })._cache = cacheRef

    useEffect(() => {
      let cancelled = false
      async function load() {
        try {
          setLoading(true); setError(null)
          if (!pagamentoId || !Number.isFinite(pagamentoId)) throw new Error('ID de pagamento inválido')
          if (cacheRef.has(pagamentoId)) { setRows(cacheRef.get(pagamentoId) || []); return }
          const res = await fetch(`/api/modulos/financeiro/pagamentos-efetuados/${pagamentoId}/linhas`, { cache: 'no-store' })
          const j = await res.json()
          if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
          const list: Array<Record<string, unknown>> = Array.isArray(j.rows) ? j.rows : []
          if (!cancelled) { setRows(list); cacheRef.set(pagamentoId, list) }
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Falha ao carregar linhas')
        } finally { if (!cancelled) setLoading(false) }
      }
      load();
      return () => { cancelled = true }
    }, [pagamentoId])

    if (loading) return <div className="text-xs text-gray-500 p-3">Carregando linhas…</div>
    if (error) return <div className="text-xs text-red-600 p-3">{error}</div>
    if (!rows.length) return <div className="text-xs text-gray-500 p-3">Sem linhas para este pagamento.</div>

    return (
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600">
              <th className="text-left p-2">Linha</th>
              <th className="text-left p-2">Documento</th>
              <th className="text-left p-2">Fornecedor</th>
              <th className="text-right p-2">Valor Original</th>
              <th className="text-right p-2">Valor Pago</th>
              <th className="text-right p-2">Saldo Após Pag.</th>
              <th className="text-right p-2">Desc. Fin.</th>
              <th className="text-right p-2">Juros</th>
              <th className="text-right p-2">Multa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={String(r['pagamento_linha_id'] ?? i)} className="border-t border-gray-200">
                <td className="p-2">{String(r['pagamento_linha_id'] ?? i + 1)}</td>
                <td className="p-2">{String(r['documento_origem'] ?? '')}</td>
                <td className="p-2">{String(r['fornecedor'] ?? '')}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_original_documento'])}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_pago'])}</td>
                <td className="p-2 text-right">{formatBRL(r['saldo_apos_pagamento'])}</td>
                <td className="p-2 text-right">{formatBRL(r['desconto_financeiro'])}</td>
                <td className="p-2 text-right">{formatBRL(r['juros'])}</td>
                <td className="p-2 text-right">{formatBRL(r['multa'])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Nested detail component for Pagamentos Recebidos: linhas do pagamento
  function LinhasPagamentoRecebido({ pagamentoId }: { pagamentoId: number }) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [rows, setRows] = useState<Array<Record<string, unknown>>>([])
    const cacheRef = (LinhasPagamentoRecebido as unknown as { _cache?: Map<number, Array<Record<string, unknown>>> })._cache
      || new Map<number, Array<Record<string, unknown>>>()
    ;(LinhasPagamentoRecebido as unknown as { _cache?: Map<number, Array<Record<string, unknown>>> })._cache = cacheRef

    useEffect(() => {
      let cancelled = false
      async function load() {
        try {
          setLoading(true); setError(null)
          if (!pagamentoId || !Number.isFinite(pagamentoId)) throw new Error('ID de pagamento inválido')
          if (cacheRef.has(pagamentoId)) { setRows(cacheRef.get(pagamentoId) || []); return }
          const res = await fetch(`/api/modulos/financeiro/pagamentos-recebidos/${pagamentoId}/linhas`, { cache: 'no-store' })
          const j = await res.json()
          if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
          const list: Array<Record<string, unknown>> = Array.isArray(j.rows) ? j.rows : []
          if (!cancelled) { setRows(list); cacheRef.set(pagamentoId, list) }
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Falha ao carregar linhas')
        } finally { if (!cancelled) setLoading(false) }
      }
      load();
      return () => { cancelled = true }
    }, [pagamentoId])

    if (loading) return <div className="text-xs text-gray-500 p-3">Carregando linhas…</div>
    if (error) return <div className="text-xs text-red-600 p-3">{error}</div>
    if (!rows.length) return <div className="text-xs text-gray-500 p-3">Sem linhas para este pagamento.</div>

    return (
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600">
              <th className="text-left p-2">Linha</th>
              <th className="text-left p-2">Documento</th>
              <th className="text-left p-2">Cliente</th>
              <th className="text-right p-2">Valor Original</th>
              <th className="text-right p-2">Valor Recebido</th>
              <th className="text-right p-2">Saldo Após Rec.</th>
              <th className="text-right p-2">Desc. Fin.</th>
              <th className="text-right p-2">Juros</th>
              <th className="text-right p-2">Multa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={String(r['pagamento_recebido_linha_id'] ?? i)} className="border-t border-gray-200">
                <td className="p-2">{String(r['pagamento_recebido_linha_id'] ?? i + 1)}</td>
                <td className="p-2">{String(r['documento_origem'] ?? '')}</td>
                <td className="p-2">{String(r['cliente'] ?? '')}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_original_documento'])}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_recebido'])}</td>
                <td className="p-2 text-right">{formatBRL(r['saldo_apos_recebimento'])}</td>
                <td className="p-2 text-right">{formatBRL(r['desconto_financeiro'])}</td>
                <td className="p-2 text-right">{formatBRL(r['juros'])}</td>
                <td className="p-2 text-right">{formatBRL(r['multa'])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Nested detail component for Contas a Receber: linhas do título
  function LinhasContaReceber({ contaReceberId }: { contaReceberId: number }) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [rows, setRows] = useState<Array<Record<string, unknown>>>([])
    const cacheRef = (LinhasContaReceber as unknown as { _cache?: Map<number, Array<Record<string, unknown>>> })._cache
      || new Map<number, Array<Record<string, unknown>>>()
    ;(LinhasContaReceber as unknown as { _cache?: Map<number, Array<Record<string, unknown>>> })._cache = cacheRef

    useEffect(() => {
      let cancelled = false
      async function load() {
        try {
          setLoading(true); setError(null)
          if (!contaReceberId || !Number.isFinite(contaReceberId)) throw new Error('ID de conta inválido')
          if (cacheRef.has(contaReceberId)) { setRows(cacheRef.get(contaReceberId) || []); return }
          const res = await fetch(`/api/modulos/financeiro/contas-a-receber/${contaReceberId}/linhas`, { cache: 'no-store' })
          const j = await res.json()
          if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
          const list: Array<Record<string, unknown>> = Array.isArray(j.rows) ? j.rows : []
          if (!cancelled) { setRows(list); cacheRef.set(contaReceberId, list) }
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Falha ao carregar linhas')
        } finally { if (!cancelled) setLoading(false) }
      }
      load();
      return () => { cancelled = true }
    }, [contaReceberId])

    if (loading) return <div className="text-xs text-gray-500 p-3">Carregando linhas…</div>
    if (error) return <div className="text-xs text-red-600 p-3">{error}</div>
    if (!rows.length) return <div className="text-xs text-gray-500 p-3">Sem linhas para este título.</div>

    return (
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600">
              <th className="text-left p-2">Linha</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Descrição</th>
              <th className="text-right p-2">Qtd</th>
              <th className="text-right p-2">Valor Unit.</th>
              <th className="text-right p-2">Bruto</th>
              <th className="text-right p-2">Desconto</th>
              <th className="text-right p-2">Impostos</th>
              <th className="text-right p-2">Líquido</th>
              <th className="text-left p-2">Categoria</th>
              <th className="text-left p-2">Departamento</th>
              <th className="text-left p-2">Centro Custo</th>
              <th className="text-left p-2">Unidade</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={String(r['conta_receber_linha_id'] ?? i)} className="border-t border-gray-200">
                <td className="p-2">{String(r['conta_receber_linha_id'] ?? i + 1)}</td>
                <td className="p-2">{String(r['tipo_linha'] ?? '—')}</td>
                <td className="p-2">{String(r['descricao'] ?? '—')}</td>
                <td className="p-2 text-right">{String(r['quantidade'] ?? '0')}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_unitario'])}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_bruto'])}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_desconto'])}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_impostos'])}</td>
                <td className="p-2 text-right">{formatBRL(r['valor_liquido'])}</td>
                <td className="p-2">{String(r['categoria_financeira'] ?? '')}</td>
                <td className="p-2">{String(r['departamento'] ?? '')}</td>
                <td className="p-2">{String(r['centro_custo'] ?? '')}</td>
                <td className="p-2">{String(r['unidade_negocio'] ?? '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (tabs.selected) {
      case 'contas':
        return [
          { accessorKey: 'conta_id', header: () => <IconLabelHeader icon={<Wallet className="h-3.5 w-3.5" />} label="Conta ID" /> },
          { accessorKey: 'nome_conta', header: () => <IconLabelHeader icon={<Wallet className="h-3.5 w-3.5" />} label="Nome" /> },
          { accessorKey: 'tipo_conta', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo" /> },
          { accessorKey: 'agencia', header: () => <IconLabelHeader icon={<Building className="h-3.5 w-3.5" />} label="Agência" /> },
          { accessorKey: 'numero_conta', header: () => <IconLabelHeader icon={<Wallet className="h-3.5 w-3.5" />} label="Número Conta" /> },
          { accessorKey: 'pix_chave', header: () => <IconLabelHeader icon={<CreditCard className="h-3.5 w-3.5" />} label="Pix" /> },
          { accessorKey: 'saldo_inicial', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Saldo Inicial" />, cell: ({ row }) => formatBRL(row.original['saldo_inicial']) },
          { accessorKey: 'saldo_atual', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Saldo Atual" />, cell: ({ row }) => formatBRL(row.original['saldo_atual']) },
          { accessorKey: 'data_abertura', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Abertura" />, cell: ({ row }) => formatDate(row.original['data_abertura']) },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativa" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado em" />, cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Atualizado em" />, cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'bancos':
        return [
          {
            accessorKey: 'nome_banco',
            header: () => <IconLabelHeader icon={<Landmark className="h-3.5 w-3.5" />} label="Banco" />,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['nome_banco'] ? String(row.original['nome_banco']) : 'Sem nome'}
                imageUrl={row.original['banco_imagem_url'] || row.original['imagem_url'] ? String(row.original['banco_imagem_url'] || row.original['imagem_url']) : undefined}
                onClick={() => openBancoEditor(row.original)}
                clickable
                size={32}
              />
            )
          },
          { accessorKey: 'numero_banco', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Número" /> },
          { accessorKey: 'agencia', header: () => <IconLabelHeader icon={<Building className="h-3.5 w-3.5" />} label="Agência" /> },
          { accessorKey: 'endereco', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Endereço" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado em" />, cell: ({ row }) => formatDate(row.original['criado_em']) },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Atualizado em" />, cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'conciliacao':
        return [
          { accessorKey: 'conciliacao_id', header: () => <IconLabelHeader icon={<CheckCheck className="h-3.5 w-3.5" />} label="Conciliação" /> },
          { accessorKey: 'periodo_inicio', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Início" />, cell: ({ row }) => formatDate(row.original['periodo_inicio']) },
          { accessorKey: 'periodo_fim', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Fim" />, cell: ({ row }) => formatDate(row.original['periodo_fim']) },
          { accessorKey: 'banco', header: () => <IconLabelHeader icon={<Landmark className="h-3.5 w-3.5" />} label="Banco" /> },
          { accessorKey: 'conta_financeira', header: () => <IconLabelHeader icon={<Wallet className="h-3.5 w-3.5" />} label="Conta" /> },
          { accessorKey: 'tipo_conta', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo Conta" /> },
          { accessorKey: 'saldo_inicial', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Saldo Inicial" />, cell: ({ row }) => formatBRL(row.original['saldo_inicial']) },
          { accessorKey: 'saldo_extrato', header: () => <IconLabelHeader icon={<Receipt className="h-3.5 w-3.5" />} label="Saldo Extrato" />, cell: ({ row }) => formatBRL(row.original['saldo_extrato']) },
          { accessorKey: 'saldo_sistema', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Saldo Sistema" />, cell: ({ row }) => formatBRL(row.original['saldo_sistema']) },
          { accessorKey: 'diferenca', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Diferença" />, cell: ({ row }) => formatBRL(row.original['diferenca']) },
          { accessorKey: 'status', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" />, cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado em" />, cell: ({ row }) => formatDate(row.original['criado_em']) },
        ]
      case 'extrato':
        return [
          { accessorKey: 'extrato_id', header: () => <IconLabelHeader icon={<Receipt className="h-3.5 w-3.5" />} label="Extrato" /> },
          { accessorKey: 'data_extrato', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Data Extrato" />, cell: ({ row }) => formatDate(row.original['data_extrato']) },
          {
            accessorKey: 'banco',
            header: () => <IconLabelHeader icon={<Landmark className="h-3.5 w-3.5" />} label="Banco" />,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['banco'] ? String(row.original['banco']) : 'Sem nome'}
                imageUrl={row.original['banco_imagem_url'] ? String(row.original['banco_imagem_url']) : undefined}
                onClick={() => openBancoEditor(row.original)}
                clickable
                size={32}
              />
            )
          },
          { accessorKey: 'conta_financeira', header: () => <IconLabelHeader icon={<Wallet className="h-3.5 w-3.5" />} label="Conta" /> },
          {
            accessorKey: 'tipo_conta',
            header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo Conta" />,
            cell: ({ row }) => <StatusBadge value={row.original['tipo_conta']} type="fin_tipo_conta" />
          },
          { accessorKey: 'saldo_inicial', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Saldo Inicial" />, cell: ({ row }) => formatBRL(row.original['saldo_inicial']) },
          { accessorKey: 'total_creditos', header: () => <IconLabelHeader icon={<ArrowDownCircle className="h-3.5 w-3.5" />} label="Créditos" />, cell: ({ row }) => formatBRL(row.original['total_creditos']) },
          { accessorKey: 'total_debitos', header: () => <IconLabelHeader icon={<ArrowUpCircle className="h-3.5 w-3.5" />} label="Débitos" />, cell: ({ row }) => formatBRL(row.original['total_debitos']) },
          { accessorKey: 'saldo_final', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Saldo Final" />, cell: ({ row }) => formatBRL(row.original['saldo_final']) },
          { accessorKey: 'status', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" />, cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
        ]
      case 'contas-a-receber':
        return [
          {
            id: 'acoes',
            header: () => <span className="sr-only">Ações</span>,
            cell: ({ row }) => (
              <RowActionsMenu
                type="contas-a-receber"
                row={row.original}
                onViewDetails={() => console.log('Ver detalhes AR', row.original)}
                onEdit={() => console.log('Editar AR', row.original)}
                onOpenDocs={() => {
                  setDocName(String(row.original['numero_documento'] || 'documento'))
                  setDocUrl(String(row.original['documento_url'] || ''))
                  setDocType(String(row.original['content_type'] || ''))
                  setDocLancId(Number(row.original['conta_receber_id'] || row.original['conta_id'] || 0))
                  setDocViewerOpen(true)
                }}
                onInformRecebimento={() => {
                  const id = row.original['conta_receber_id'] || row.original['conta_id']
                  if (id) router.push(`/modulos/financeiro/contas-a-receber/receber?id=${id}`)
                }}
                onMark={() => console.log('Marcar recebido AR', row.original)}
                onDuplicate={() => console.log('Duplicar AR', row.original)}
                onDelete={() => console.log('Excluir AR', row.original)}
              />
            ),
          },
          { accessorKey: 'cliente', header: () => <IconLabelHeader icon={<User className="h-3.5 w-3.5" />} label="Cliente" /> },
          { accessorKey: 'status', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" />, cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'data_documento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Emissão" />, cell: ({ row }) => formatDate(row.original['data_documento']) },
          { accessorKey: 'data_lancamento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Lançamento" />, cell: ({ row }) => formatDate(row.original['data_lancamento']) },
          { accessorKey: 'data_vencimento', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Vencimento" />, cell: ({ row }) => formatDate(row.original['data_vencimento']) },
          { accessorKey: 'valor_bruto', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Total" />, cell: ({ row }) => formatBRL(row.original['valor_bruto']) },
          { accessorKey: 'valor_desconto', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Desc" />, cell: ({ row }) => formatBRL(row.original['valor_desconto']) },
          { accessorKey: 'categoria_receita', header: () => <IconLabelHeader icon={<Folder className="h-3.5 w-3.5" />} label="Categoria Receita" /> },
          { accessorKey: 'departamento', header: () => <IconLabelHeader icon={<Building className="h-3.5 w-3.5" />} label="Departamento" /> },
          { accessorKey: 'centro_lucro', header: () => <IconLabelHeader icon={<PieChart className="h-3.5 w-3.5" />} label="Centro Lucro" /> },
          { accessorKey: 'filial', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Filial" /> },
          { accessorKey: 'unidade_negocio', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Unid. Negócio" /> },
        ]
      case 'categorias-despesa':
        return [
          { accessorKey: 'id', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="ID" /> },
          { accessorKey: 'codigo', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Código" /> },
          { accessorKey: 'nome', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Nome" /> },
          { accessorKey: 'descricao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" /> },
          { accessorKey: 'tipo', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo" /> },
          { accessorKey: 'natureza', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Natureza" /> },
          { accessorKey: 'categoria_pai_id', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Categoria Pai ID" /> },
          { accessorKey: 'plano_conta_id', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Plano Conta ID" /> },
          { accessorKey: 'acoes', header: () => <IconLabelHeader icon={<Pencil className="h-3.5 w-3.5" />} label="Ações" />, cell: ({ row }) => {
            const idRaw = row.original['id']
            const id = idRaw ? Number(idRaw) : NaN
            return (
              <button
                className="inline-flex items-center text-xs text-violet-700 hover:underline"
                onClick={() => { if (Number.isFinite(id)) { setSelectedCategoriaDespesaId(id); setCategoriaModalOpen(true) } }}
              >Editar…</button>
            )
          } },
        ]
      case 'categorias-receita':
        return [
          { accessorKey: 'id', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="ID" /> },
          { accessorKey: 'codigo', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Código" /> },
          { accessorKey: 'nome', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Nome" /> },
          { accessorKey: 'descricao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" /> },
          { accessorKey: 'tipo', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo" /> },
          { accessorKey: 'natureza', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Natureza" /> },
          { accessorKey: 'plano_conta_id', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Plano Conta ID" /> },
          { accessorKey: 'ativo', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativo" /> },
          { accessorKey: 'criado_em', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Criado em" /> },
          { accessorKey: 'atualizado_em', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Atualizado em" /> },
          { accessorKey: 'acoes', header: () => <IconLabelHeader icon={<Pencil className="h-3.5 w-3.5" />} label="Ações" />, cell: ({ row }) => {
            const idRaw = row.original['id']
            const id = idRaw ? Number(idRaw) : NaN
            return (
              <button
                className="inline-flex items-center text-xs text-emerald-700 hover:underline"
                onClick={() => { if (Number.isFinite(id)) { setSelectedCategoriaReceitaId(id); setCategoriaReceitaModalOpen(true) } }}
              >Editar…</button>
            )
          } },
        ]
      case 'pagamentos-efetuados':
        return [
          { accessorKey: 'numero_pagamento', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Nº Pagamento" /> },
          { accessorKey: 'status', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" />, cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'data_pagamento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Pago em" />, cell: ({ row }) => formatDate(row.original['data_pagamento']) },
          { accessorKey: 'data_lancamento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Lançamento" />, cell: ({ row }) => formatDate(row.original['data_lancamento']) },
          { accessorKey: 'fornecedor', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Fornecedor" /> },
          { accessorKey: 'conta_financeira', header: () => <IconLabelHeader icon={<Wallet className="h-3.5 w-3.5" />} label="Conta" /> },
          { accessorKey: 'metodo_pagamento', header: () => <IconLabelHeader icon={<CreditCard className="h-3.5 w-3.5" />} label="Método" /> },
          { accessorKey: 'valor_total_pagamento', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor" />, cell: ({ row }) => formatBRL(row.original['valor_total_pagamento']) },
          { accessorKey: 'observacao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Observação" /> },
        ]
      case 'pagamentos-recebidos':
        return [
          { accessorKey: 'numero_pagamento', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Nº Pagamento" /> },
          { accessorKey: 'status', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" />, cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'data_recebimento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Recebido em" />, cell: ({ row }) => formatDate(row.original['data_recebimento']) },
          { accessorKey: 'data_lancamento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Lançamento" />, cell: ({ row }) => formatDate(row.original['data_lancamento']) },
          { accessorKey: 'cliente', header: () => <IconLabelHeader icon={<User className="h-3.5 w-3.5" />} label="Cliente" /> },
          { accessorKey: 'conta_financeira', header: () => <IconLabelHeader icon={<Wallet className="h-3.5 w-3.5" />} label="Conta" /> },
          { accessorKey: 'metodo_pagamento', header: () => <IconLabelHeader icon={<CreditCard className="h-3.5 w-3.5" />} label="Método" /> },
          { accessorKey: 'valor_total_recebido', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor" />, cell: ({ row }) => formatBRL(row.original['valor_total_recebido']) },
          { accessorKey: 'observacao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Observação" /> },
        ]
      case 'movimentos':
        return [
          { accessorKey: 'data', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Data" />, cell: ({ row }) => formatDate(row.original['data']) },
          { accessorKey: 'tipo', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo" /> },
          { accessorKey: 'valor', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor" />, cell: ({ row }) => formatBRL(row.original['valor']) },
          { accessorKey: 'categoria_nome', header: () => <IconLabelHeader icon={<Folder className="h-3.5 w-3.5" />} label="Categoria" /> },
          { accessorKey: 'conta_nome', header: () => <IconLabelHeader icon={<Wallet className="h-3.5 w-3.5" />} label="Conta" /> },
        ]
      case 'contas-a-pagar':
      default:
        return [
          {
            id: 'acoes',
            header: () => <span className="sr-only">Ações</span>,
            cell: ({ row }) => (
              <RowActionsMenu
                type="contas-a-pagar"
                row={row.original}
                onViewDetails={() => console.log('Ver detalhes AP', row.original)}
                onEdit={() => openEditor(row.original as Row)}
                onOpenDocs={() => {
                  setDocName(String(row.original['numero_documento'] || 'documento'))
                  setDocUrl(String(row.original['documento_url'] || ''))
                  setDocType(String(row.original['content_type'] || ''))
                  setDocLancId(Number(row.original['conta_pagar_id'] || row.original['conta_id'] || 0))
                  setDocViewerOpen(true)
                }}
                onInformPagamento={() => {
                  const id = row.original['conta_pagar_id'] || row.original['conta_id']
                  if (id) router.push(`/modulos/financeiro/contas-a-pagar/pagar?id=${id}`)
                }}
                onMark={() => console.log('Marcar pago AP', row.original)}
                onDuplicate={() => console.log('Duplicar AP', row.original)}
                onDelete={() => console.log('Excluir AP', row.original)}
              />
            ),
          },
          { accessorKey: 'fornecedor', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Fornecedor" /> },
          { accessorKey: 'status', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" />, cell: ({ row }) => <StatusBadge value={row.original['status']} type="status" /> },
          { accessorKey: 'data_documento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Emissão" />, cell: ({ row }) => formatDate(row.original['data_documento']) },
          { accessorKey: 'data_lancamento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Lançamento" />, cell: ({ row }) => formatDate(row.original['data_lancamento']) },
          { accessorKey: 'data_vencimento', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Vencimento" />, cell: ({ row }) => formatDate(row.original['data_vencimento']) },
          { accessorKey: 'valor_bruto', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Total" />, cell: ({ row }) => formatBRL(row.original['valor_bruto']) },
          { accessorKey: 'valor_desconto', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Desc" />, cell: ({ row }) => formatBRL(row.original['valor_desconto']) },
          { accessorKey: 'categoria_despesa', header: () => <IconLabelHeader icon={<Folder className="h-3.5 w-3.5" />} label="Categoria" /> },
          { accessorKey: 'departamento', header: () => <IconLabelHeader icon={<Building className="h-3.5 w-3.5" />} label="Departamento" /> },
          { accessorKey: 'centro_custo', header: () => <IconLabelHeader icon={<PieChart className="h-3.5 w-3.5" />} label="Centro Custo" /> },
          { accessorKey: 'filial', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Filial" /> },
          { accessorKey: 'unidade_negocio', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Unid. Negócio" /> },
        ]
    }
  }, [tabs.selected])

  const [data, setData] = useState<Row[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)

  // Visualizador de Documento (mock)
  const [docViewerOpen, setDocViewerOpen] = useState(false)
  const [docUrl, setDocUrl] = useState<string | null>(null)
  const [docName, setDocName] = useState<string | null>(null)
  const [docType, setDocType] = useState<string | null>(null)
  const [docLancId, setDocLancId] = useState<number | null>(null)
  // Editor Categoria Despesa (modal)
  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false)
  const [selectedCategoriaDespesaId, setSelectedCategoriaDespesaId] = useState<number | null>(null)
  // Editor Categoria Receita (modal)
  const [categoriaReceitaModalOpen, setCategoriaReceitaModalOpen] = useState(false)
  const [selectedCategoriaReceitaId, setSelectedCategoriaReceitaId] = useState<number | null>(null)

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

  // Editor Cliente
  const [clienteEditorOpen, setClienteEditorOpen] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState<string | number | null>(null)
  const [clientePrefill, setClientePrefill] = useState<{ nome_cliente?: string; imagem_url?: string } | undefined>(undefined)

  // Editor Banco
  const [bancoEditorOpen, setBancoEditorOpen] = useState(false)
  const [selectedBancoId, setSelectedBancoId] = useState<string | number | null>(null)
  const [bancoPrefill, setBancoPrefill] = useState<{ nome_banco?: string; imagem_url?: string } | undefined>(undefined)

  // Removido: coluna/aba de anexos e drawer para anexos por lançamento

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
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        if (tabs.selected === 'extrato') params.set('grouped', '1')
        const url = `/api/modulos/financeiro?${params.toString()}`
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const rows = (json?.rows || []) as Row[]
        if (tabs.selected === 'contas-a-pagar' && Array.isArray(rows) && rows.length > 0 && rows.some(r => r && String((r as any)['tipo_registro'] || '').length > 0)) {
          // Agrupa por conta_pagar_id: mantém apenas CABECALHO na lista e pré-carrega o cache do detalhe
          const headers = rows.filter(r => String((r as any)['tipo_registro']).toUpperCase() === 'CABECALHO')
          const linhas = rows.filter(r => String((r as any)['tipo_registro']).toUpperCase() === 'LINHA')
          const cacheRef = (LinhasContaPagar as unknown as { _cache?: Map<number, Array<Record<string, unknown>>> })._cache
            || new Map<number, Array<Record<string, unknown>>>()
          ;(LinhasContaPagar as unknown as { _cache?: Map<number, Array<Record<string, unknown>>> })._cache = cacheRef

          const headersOnly = headers.map(h => {
            const id = Number((h as any)['conta_pagar_id'] ?? (h as any)['conta_id'])
            const child = linhas.filter(l => Number((l as any)['conta_pagar_id'] ?? (l as any)['conta_id']) === id)
            if (Number.isFinite(id)) cacheRef.set(id, child)
            // Garante presença de conta_id para o expand
            return { ...h, conta_id: (h as any)['conta_id'] ?? (h as any)['conta_pagar_id'] ?? id }
          })
          setData(headersOnly as unknown as Row[])
          setTotal(Number(json?.total ?? headersOnly.length) || headersOnly.length)
        } else {
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

  // Reset page when tab or date range changes
  useEffect(() => { setPage(1) }, [tabs.selected, dateRange?.from, dateRange?.to])

  const openEditor = (row: Row) => {
    const fornecedorId = row['fornecedor_id']
    const contaId = row['conta_id']
    setSelectedFornecedorId(fornecedorId ? String(fornecedorId) : null)
    setSelectedConta({
      id: contaId ? String(contaId) : '',
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

  const openClienteEditor = (row: Row) => {
    const clienteId = row['cliente_id']
    if (!clienteId) return
    setSelectedClienteId(String(clienteId))
    setClientePrefill({
      nome_cliente: row['cliente'] ? String(row['cliente']) : undefined,
      imagem_url: row['cliente_imagem_url'] ? String(row['cliente_imagem_url']) : undefined,
    })
    setClienteEditorOpen(true)
  }

  const openBancoEditor = (row: Row) => {
    const bancoId = row['banco_id']
    if (!bancoId) return
    setSelectedBancoId(String(bancoId))
    setBancoPrefill({
      nome_banco: row['nome_banco'] ? String(row['nome_banco']) : undefined,
      imagem_url: row['banco_imagem_url'] ? String(row['banco_imagem_url']) : undefined,
    })
    setBancoEditorOpen(true)
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
        case 'extrato':
          return <Receipt className="h-4 w-4" />
        case 'conciliacao':
          return <CheckCheck className="h-4 w-4" />
        case 'bancos':
          return <Landmark className="h-4 w-4" />
        case 'movimentos':
          return <Activity className="h-4 w-4" />
        case 'contas':
          return <Wallet className="h-4 w-4" />
        case 'categorias-despesa':
          return <Folder className="h-4 w-4" />
        case 'categorias-receita':
          return <Folder className="h-4 w-4" />
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
        <div className="flex h-full overflow-hidden bg-gray-50">
          <div className="flex flex-col h-full w-full">
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-2 pb-2" data-page="nexus">
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
                {/* Conteúdo abaixo das tabs */}
                <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
                  {/* Toolbar direita (paginador + botão) */}
                  <div className="px-4 md:px-6" style={{ marginBottom: 8 }}>
            <DataToolbar
              from={total === 0 ? 0 : (page - 1) * pageSize + 1}
              to={total === 0 ? 0 : Math.min(page * pageSize, total)}
              total={total}
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
              actionComponent={
                tabs.selected === 'contas-a-pagar' ? (
                  <Link href="/modulos/financeiro/contas-a-pagar/novo" className="inline-flex">
                    <Button variant="default">Cadastrar</Button>
                  </Link>
                ) : tabs.selected === 'contas-a-receber' ? (
                  <Link href="/modulos/financeiro/contas-a-receber/novo" className="inline-flex">
                    <Button variant="default">Cadastrar</Button>
                  </Link>
                ) : tabs.selected === 'pagamentos-efetuados' ? (
                  <CadastroPagamentoEfetuadoSheet triggerLabel="Cadastrar" onSaved={() => setReloadKey((k) => k + 1)} />
                ) : tabs.selected === 'pagamentos-recebidos' ? (
                  <CadastroPagamentoRecebidoSheet triggerLabel="Cadastrar" onSaved={() => setReloadKey((k) => k + 1)} />
                ) : tabs.selected === 'bancos' ? (
                  <CadastroBancoSheet triggerLabel="Cadastrar" onSaved={() => setReloadKey((k) => k + 1)} />
                ) : tabs.selected === 'contas' ? (
                  <CadastroContaFinanceiraSheet triggerLabel="Cadastrar" onSaved={() => setReloadKey((k) => k + 1)} />
                ) : tabs.selected === 'categorias-receita' ? (
                  <CadastroCategoriaReceitaSheet triggerLabel="Cadastrar" onSaved={() => setReloadKey((k) => k + 1)} />
                ) : tabs.selected === 'categorias-despesa' ? (
                  <CadastroCategoriaDespesaSheet triggerLabel="Cadastrar" onSaved={() => setReloadKey((k) => k + 1)} />
                ) : undefined
              }
            />
          </div>
          {/* KPIs acima da tabela (somente Contas a Pagar) */}
          {tabs.selected === 'contas-a-pagar' || tabs.selected === 'contas-a-receber' ? (
            <div className="px-1 mb-3">
              <ApKpiRow />
            </div>
          ) : tabs.selected === 'extrato' ? (
            <div className="px-1 mb-3">
              <ExtratoKpiRow />
            </div>
          ) : null}
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
                    acoes: { headerNoWrap: true, cellNoWrap: true, widthMode: 'fixed', minWidth: 96 },
                    // Tipo de registro (CABECALHO/LINHA)
                    tipo_registro: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 90 },
                    // Fornecedor
                    fornecedor: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    // Descrição
                    descricao: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 180 },
                    // Doc/Tipo
                    numero_documento: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 100 },
                    tipo_documento: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 90 },
                    // Datas
                    data_documento: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    data_lancamento: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    data_vencimento: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    // Valores
                    valor_bruto: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 110 },
                    valor_desconto: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 110 },
                    valor_impostos: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 110 },
                    valor_liquido: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 110 },
                    // Dimensões
                    categoria_despesa: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    departamento: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    centro_custo: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    centro_lucro: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    filial: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    unidade_negocio: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    // Conta e Método (Pagamentos Efetuados/Recebidos)
                    conta_financeira: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    conta_financeira_nome: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    metodo_pagamento: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    metodo_pagamento_nome: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    // Cliente (Contas a Receber e Pagamentos Recebidos)
                    cliente_nome: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                    // Banco (Extrato)
                    banco: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 140 },
                  }}
                  enableExpand={tabs.selected === 'extrato' || tabs.selected === 'contas-a-pagar' || tabs.selected === 'pagamentos-efetuados' || tabs.selected === 'contas-a-receber' || tabs.selected === 'pagamentos-recebidos'}
                  renderDetail={(row) => {
                    if (tabs.selected === 'extrato') {
                      type ExtratoTransacao = {
                        transacao_id?: string | number | null
                        tipo_transacao?: string | null
                        data_transacao?: string | null
                        descricao_transacao?: string | null
                        valor_transacao?: number | string | null
                        origem_transacao?: string | null
                        transacao_conciliada?: boolean | string | null
                      }
                      const raw = row['transacoes'] as unknown
                      const items: ExtratoTransacao[] = Array.isArray(raw)
                        ? raw.filter((it: unknown): it is ExtratoTransacao => typeof it === 'object' && it !== null)
                        : []
                      if (!items.length) return <div className="text-xs text-gray-500">Sem transações neste extrato.</div>
                      return (
                        <div className="overflow-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-600">
                                <th className="text-left p-2">Data</th>
                                <th className="text-left p-2">Tipo</th>
                                <th className="text-left p-2">Descrição</th>
                                <th className="text-right p-2">Valor</th>
                                <th className="text-left p-2">Origem</th>
                                <th className="text-left p-2">Conciliada</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((t, i) => (
                                <tr key={String(t.transacao_id ?? i)} className="border-t border-gray-200">
                                  <td className="p-2">{formatDate(t.data_transacao)}</td>
                                  <td className="p-2"><StatusBadge value={t.tipo_transacao} type="fin_transacao" /></td>
                                  <td className="p-2">{t.descricao_transacao}</td>
                                  <td className="p-2 text-right">{formatBRL(t.valor_transacao)}</td>
                                  <td className="p-2">{t.origem_transacao}</td>
                                  <td className="p-2"><StatusBadge value={t.transacao_conciliada} type="bool" /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    }
                    if (tabs.selected === 'contas-a-pagar') {
                      const idRaw = (row['conta_id'] ?? row['conta_pagar_id']) as string | number | undefined
                      const contaId = idRaw ? Number(idRaw) : NaN
                      if (!Number.isFinite(contaId)) return <div className="text-xs text-gray-500 p-3">ID de lançamento inválido.</div>
                      return <LinhasContaPagar contaPagarId={contaId} />
                    }
                    if (tabs.selected === 'pagamentos-efetuados') {
                      const idRaw = row['pagamento_id'] as string | number | undefined
                      const pagamentoId = idRaw ? Number(idRaw) : NaN
                      if (!Number.isFinite(pagamentoId)) return <div className="text-xs text-gray-500 p-3">ID de pagamento inválido.</div>
                      return <LinhasPagamentoEfetuado pagamentoId={pagamentoId} />
                    }
                    if (tabs.selected === 'contas-a-receber') {
                      const idRaw = row['conta_receber_id'] as string | number | undefined
                      const contaId = idRaw ? Number(idRaw) : NaN
                      if (!Number.isFinite(contaId)) return <div className="text-xs text-gray-500 p-3">ID de lançamento inválido.</div>
                      return <LinhasContaReceber contaReceberId={contaId} />
                    }
                    if (tabs.selected === 'pagamentos-recebidos') {
                      const idRaw = row['pagamento_recebido_id'] as string | number | undefined
                      const pagamentoId = idRaw ? Number(idRaw) : NaN
                      if (!Number.isFinite(pagamentoId)) return <div className="text-xs text-gray-500 p-3">ID de pagamento inválido.</div>
                      return <LinhasPagamentoRecebido pagamentoId={pagamentoId} />
                    }
                    return null
                  }}
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
      <FornecedorEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        conta={selectedConta}
        fornecedorId={selectedFornecedorId}
        fornecedorPrefill={fornecedorPrefill}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
      <ClienteEditorSheet
        open={clienteEditorOpen}
        onOpenChange={setClienteEditorOpen}
        clienteId={selectedClienteId}
        prefill={clientePrefill}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
      <BancoEditorSheet
        open={bancoEditorOpen}
        onOpenChange={setBancoEditorOpen}
        bancoId={selectedBancoId}
        prefill={bancoPrefill}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
      {/* Drawer de anexos removido */}
      <DocumentViewer
        open={docViewerOpen}
        onOpenChange={setDocViewerOpen}
        url={docUrl ?? undefined}
        fileName={docName ?? undefined}
        contentType={docType ?? undefined}
        lancamentoId={docLancId ?? undefined}
        onChanged={() => setReloadKey((k) => k + 1)}
      />
      <CategoriaDespesaEditorModal
        open={categoriaModalOpen}
        onOpenChange={(v) => { setCategoriaModalOpen(v); if (!v) setSelectedCategoriaDespesaId(null) }}
        categoriaId={selectedCategoriaDespesaId}
        onSaved={() => setReloadKey(k => k + 1)}
      />
      <CategoriaReceitaEditorModal
        open={categoriaReceitaModalOpen}
        onOpenChange={(v) => { setCategoriaReceitaModalOpen(v); if (!v) setSelectedCategoriaReceitaId(null) }}
        categoriaId={selectedCategoriaReceitaId}
        onSaved={() => setReloadKey(k => k + 1)}
      />
    </SidebarProvider>
  )
}
