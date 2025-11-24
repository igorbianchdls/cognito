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
import { $titulo, $tabs, $tabelaUI, $layout, $toolbarUI, moduleUiActions } from '@/stores/modulos/moduleUiStore'
import type { Opcao } from '@/components/modulos/TabsNav'
import { CreditCard, ArrowDownCircle, ArrowUpCircle, List, Landmark, Wallet, Activity, CheckCheck, Receipt, Building2, FileText, Calendar, CalendarClock, DollarSign, CheckCircle2, Tag, Folder, PieChart, Building, User } from 'lucide-react'
import DocumentViewer from '@/components/documentos/DocumentViewer'
import IconLabelHeader from '@/components/widgets/IconLabelHeader'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import FornecedorEditorSheet from '@/components/modulos/financeiro/FornecedorEditorSheet'
import ClienteEditorSheet from '@/components/modulos/financeiro/ClienteEditorSheet'
import BancoEditorSheet from '@/components/modulos/financeiro/BancoEditorSheet'
import CadastroContaAPagarSheet from '@/components/financeiro/CadastroContaAPagarSheet'
import CadastroContaAReceberSheet from '@/components/financeiro/CadastroContaAReceberSheet'
import CadastroPagamentoEfetuadoSheet from '@/components/financeiro/CadastroPagamentoEfetuadoSheet'
import CadastroPagamentoRecebidoSheet from '@/components/financeiro/CadastroPagamentoRecebidoSheet'
import CadastroBancoSheet from '@/components/financeiro/CadastroBancoSheet'
import CadastroContaFinanceiraSheet from '@/components/financeiro/CadastroContaFinanceiraSheet'

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
    moduleUiActions.setTitulo({
      title: 'Financeiro',
      subtitle: 'Selecione uma opção para visualizar os dados'
    })
    moduleUiActions.setTabs({
      options: [
        { value: 'contas-a-pagar', label: 'Contas a Pagar', icon: <ArrowUpCircle className="text-rose-500" /> },
        { value: 'contas-a-receber', label: 'Contas a Receber', icon: <ArrowDownCircle className="text-emerald-600" /> },
        { value: 'pagamentos-efetuados', label: 'Pagamentos Efetuados', icon: <CreditCard className="text-rose-500" /> },
        { value: 'pagamentos-recebidos', label: 'Pagamentos Recebidos', icon: <CreditCard className="text-emerald-600" /> },
        { value: 'extrato', label: 'Extrato', icon: <List className="text-blue-600" /> },
        { value: 'conciliacao', label: 'Conciliação', icon: <CheckCheck className="text-indigo-600" /> },
        { value: 'movimentos', label: 'Movimentos', icon: <Activity className="text-amber-600" /> },
        { value: 'bancos', label: 'Bancos', icon: <Landmark className="text-sky-600" /> },
        { value: 'contas', label: 'Contas Financeiras', icon: <Wallet className="text-gray-700" /> },
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
            accessorKey: 'cliente_nome',
            header: () => <IconLabelHeader icon={<User className="h-3.5 w-3.5" />} label="Cliente" />,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['cliente_nome'] ? String(row.original['cliente_nome']) : 'Sem nome'}
                subtitle={row.original['categoria_nome'] ? String(row.original['categoria_nome']) : 'Sem categoria'}
                imageUrl={undefined}
                onClick={() => openClienteEditor(row.original)}
                clickable
              />
            )
          },
          {
            accessorKey: 'descricao_conta',
            header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" />,
            cell: ({ row }) => {
              const raw = (row.original['descricao_conta'] ?? row.original['descricao']) as unknown
              const text = raw ? String(raw) : 'Sem descrição'
              const mockUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
              const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
                if (e.altKey) {
                  window.open(mockUrl, '_blank', 'noopener,noreferrer')
                  return
                }
                setDocUrl(mockUrl)
                setDocName(text || 'documento.pdf')
                setDocType('application/pdf')
                setDocViewerOpen(true)
              }
              return (
                <div
                  className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-90"
                  title={text}
                  onClick={handleClick}
                  role="button"
                  aria-label={`Abrir documento: ${text}`}
                >
                  <FileText className="h-4 w-4 text-gray-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">{text}</span>
                </div>
              )
            }
          },
          { accessorKey: 'data_lancamento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Lançamento" />, cell: ({ row }) => formatDate(row.original['data_lancamento']) },
          { accessorKey: 'data_vencimento', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Vencimento" />, cell: ({ row }) => formatDate(row.original['data_vencimento']) },
          { accessorKey: 'valor_a_receber', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor" />, cell: ({ row }) => formatBRL(row.original['valor_a_receber']) },
          { accessorKey: 'status_conta', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" />, cell: ({ row }) => <StatusBadge value={row.original['status_conta']} type="status" /> },
          { accessorKey: 'tipo_conta', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo" /> },
          { accessorKey: 'observacao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Observação" /> },
          { accessorKey: 'categoria_nome', header: () => <IconLabelHeader icon={<Folder className="h-3.5 w-3.5" />} label="Categoria" /> },
          { accessorKey: 'centro_lucro_nome', header: () => <IconLabelHeader icon={<PieChart className="h-3.5 w-3.5" />} label="Centro de Lucro" /> },
          { accessorKey: 'departamento_nome', header: () => <IconLabelHeader icon={<Building className="h-3.5 w-3.5" />} label="Departamento" /> },
          { accessorKey: 'filial_nome', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Filial" /> },
          { accessorKey: 'projeto_nome', header: () => <IconLabelHeader icon={<Folder className="h-3.5 w-3.5" />} label="Projeto" /> },
        ]
      case 'pagamentos-efetuados':
        return [
          {
            accessorKey: 'fornecedor',
            header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Fornecedor" />,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['fornecedor'] ? String(row.original['fornecedor']) : 'Sem nome'}
                subtitle={row.original['categoria_financeira'] ? String(row.original['categoria_financeira']) : (row.original['categoria'] ? String(row.original['categoria']) : 'Sem categoria')}
                imageUrl={row.original['fornecedor_imagem_url'] ? String(row.original['fornecedor_imagem_url']) : undefined}
              />
            )
          },
          {
            accessorKey: 'descricao_pagamento',
            header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" />,
            cell: ({ row }) => {
              const raw = (row.original['descricao_pagamento'] ?? row.original['descricao']) as unknown
              const text = raw ? String(raw) : 'Sem descrição'
              const mockUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
              const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
                if (e.altKey) {
                  window.open(mockUrl, '_blank', 'noopener,noreferrer')
                  return
                }
                setDocUrl(mockUrl)
                setDocName(text || 'documento.pdf')
                setDocType('application/pdf')
                setDocViewerOpen(true)
              }
              return (
                <div
                  className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-90"
                  title={text}
                  onClick={handleClick}
                  role="button"
                  aria-label={`Abrir documento: ${text}`}
                >
                  <FileText className="h-4 w-4 text-gray-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">{text}</span>
                </div>
              )
            }
          },
          { accessorKey: 'data_pagamento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Pago em" />, cell: ({ row }) => formatDate(row.original['data_pagamento']) },
          { accessorKey: 'valor_pago', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor" />, cell: ({ row }) => formatBRL(row.original['valor_pago']) },
          { accessorKey: 'conta_financeira', header: () => <IconLabelHeader icon={<Wallet className="h-3.5 w-3.5" />} label="Conta" /> },
          { accessorKey: 'metodo_pagamento', header: () => <IconLabelHeader icon={<CreditCard className="h-3.5 w-3.5" />} label="Método" /> },
          { accessorKey: 'categoria_financeira', header: () => <IconLabelHeader icon={<Folder className="h-3.5 w-3.5" />} label="Categoria" /> },
          { accessorKey: 'centro_custo', header: () => <IconLabelHeader icon={<PieChart className="h-3.5 w-3.5" />} label="Centro de Custo" /> },
          { accessorKey: 'departamento', header: () => <IconLabelHeader icon={<Building className="h-3.5 w-3.5" />} label="Departamento" /> },
          { accessorKey: 'filial', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Filial" /> },
          { accessorKey: 'projeto', header: () => <IconLabelHeader icon={<Folder className="h-3.5 w-3.5" />} label="Projeto" /> },
        ]
      case 'pagamentos-recebidos':
        return [
          {
            accessorKey: 'cliente_nome',
            header: () => <IconLabelHeader icon={<User className="h-3.5 w-3.5" />} label="Cliente" />,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['cliente_nome'] ? String(row.original['cliente_nome']) : 'Sem nome'}
                subtitle={row.original['categoria_nome'] ? String(row.original['categoria_nome']) : 'Sem categoria'}
                imageUrl={undefined}
                onClick={() => openClienteEditor(row.original)}
                clickable
              />
            )
          },
          {
            accessorKey: 'descricao_pagamento',
            header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" />,
            cell: ({ row }) => {
              const raw = (row.original['descricao_pagamento'] ?? row.original['descricao']) as unknown
              const text = raw ? String(raw) : 'Sem descrição'
              const mockUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
              const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
                if (e.altKey) {
                  window.open(mockUrl, '_blank', 'noopener,noreferrer')
                  return
                }
                setDocUrl(mockUrl)
                setDocName(text || 'documento.pdf')
                setDocType('application/pdf')
                setDocViewerOpen(true)
              }
              return (
                <div
                  className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-90"
                  title={text}
                  onClick={handleClick}
                  role="button"
                  aria-label={`Abrir documento: ${text}`}
                >
                  <FileText className="h-4 w-4 text-gray-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">{text}</span>
                </div>
              )
            }
          },
          { accessorKey: 'data_pagamento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Recebido em" />, cell: ({ row }) => formatDate(row.original['data_pagamento']) },
          { accessorKey: 'valor_recebido', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor" />, cell: ({ row }) => formatBRL(row.original['valor_recebido']) },
          { accessorKey: 'status_pagamento', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" />, cell: ({ row }) => <StatusBadge value={row.original['status_pagamento']} type="status" /> },
          { accessorKey: 'tipo_pagamento', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo" /> },
          { accessorKey: 'observacao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Observação" /> },
          { accessorKey: 'metodo_pagamento_nome', header: () => <IconLabelHeader icon={<CreditCard className="h-3.5 w-3.5" />} label="Método" /> },
          { accessorKey: 'conta_financeira_nome', header: () => <IconLabelHeader icon={<Wallet className="h-3.5 w-3.5" />} label="Conta" /> },
          { accessorKey: 'categoria_nome', header: () => <IconLabelHeader icon={<Folder className="h-3.5 w-3.5" />} label="Categoria" /> },
          { accessorKey: 'centro_lucro_nome', header: () => <IconLabelHeader icon={<PieChart className="h-3.5 w-3.5" />} label="Centro de Lucro" /> },
          { accessorKey: 'departamento_nome', header: () => <IconLabelHeader icon={<Building className="h-3.5 w-3.5" />} label="Departamento" /> },
          { accessorKey: 'filial_nome', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Filial" /> },
          { accessorKey: 'projeto_nome', header: () => <IconLabelHeader icon={<Folder className="h-3.5 w-3.5" />} label="Projeto" /> },
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
            accessorKey: 'fornecedor_nome',
            header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Fornecedor" />,
            cell: ({ row }) => (
              <EntityDisplay
                name={row.original['fornecedor_nome'] ? String(row.original['fornecedor_nome']) : 'Sem nome'}
                subtitle={row.original['categoria_nome'] ? String(row.original['categoria_nome']) : 'Sem categoria'}
                imageUrl={undefined}
                onClick={() => openEditor(row.original)}
                clickable
              />
            )
          },
          {
            accessorKey: 'descricao_conta',
            header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Descrição" />,
            cell: ({ row }) => {
              const raw = (row.original['descricao_conta'] ?? row.original['descricao']) as unknown
              const text = raw ? String(raw) : 'Sem descrição'
              const mockUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
              const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
                if (e.altKey) {
                  window.open(mockUrl, '_blank', 'noopener,noreferrer')
                  return
                }
                setDocUrl(mockUrl)
                setDocName(text || 'documento.pdf')
                setDocType('application/pdf')
                setDocViewerOpen(true)
              }
              return (
                <div
                  className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-90"
                  title={text}
                  onClick={handleClick}
                  role="button"
                  aria-label={`Abrir documento: ${text}`}
                >
                  <FileText className="h-4 w-4 text-gray-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">{text}</span>
                </div>
              )
            }
          },
          { accessorKey: 'data_lancamento', header: () => <IconLabelHeader icon={<Calendar className="h-3.5 w-3.5" />} label="Lançamento" />, cell: ({ row }) => formatDate(row.original['data_lancamento']) },
          { accessorKey: 'data_vencimento', header: () => <IconLabelHeader icon={<CalendarClock className="h-3.5 w-3.5" />} label="Vencimento" />, cell: ({ row }) => formatDate(row.original['data_vencimento']) },
          { accessorKey: 'valor_a_pagar', header: () => <IconLabelHeader icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor" />, cell: ({ row }) => formatBRL(row.original['valor_a_pagar']) },
          { accessorKey: 'status_conta', header: () => <IconLabelHeader icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" />, cell: ({ row }) => <StatusBadge value={row.original['status_conta']} type="status" /> },
          { accessorKey: 'tipo_conta', header: () => <IconLabelHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tipo" /> },
          { accessorKey: 'observacao', header: () => <IconLabelHeader icon={<FileText className="h-3.5 w-3.5" />} label="Observação" /> },
          { accessorKey: 'categoria_nome', header: () => <IconLabelHeader icon={<Folder className="h-3.5 w-3.5" />} label="Categoria" /> },
          { accessorKey: 'centro_lucro_nome', header: () => <IconLabelHeader icon={<PieChart className="h-3.5 w-3.5" />} label="Centro de Lucro" /> },
          { accessorKey: 'departamento_nome', header: () => <IconLabelHeader icon={<Building className="h-3.5 w-3.5" />} label="Departamento" /> },
          { accessorKey: 'filial_nome', header: () => <IconLabelHeader icon={<Building2 className="h-3.5 w-3.5" />} label="Filial" /> },
          { accessorKey: 'projeto_nome', header: () => <IconLabelHeader icon={<Folder className="h-3.5 w-3.5" />} label="Projeto" /> },
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

  // Reset page when tab or date range changes
  useEffect(() => { setPage(1) }, [tabs.selected, dateRange?.from, dateRange?.to])

  const openEditor = (row: Row) => {
    const fornecedorId = row['fornecedor_id']
    const contaId = row['conta_id']
    if (!contaId) return
    setSelectedFornecedorId(fornecedorId ? String(fornecedorId) : null)
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
                  <CadastroContaAPagarSheet triggerLabel="Cadastrar" onSaved={() => setReloadKey((k) => k + 1)} />
                ) : tabs.selected === 'contas-a-receber' ? (
                  <CadastroContaAReceberSheet triggerLabel="Cadastrar" onSaved={() => setReloadKey((k) => k + 1)} />
                ) : tabs.selected === 'pagamentos-efetuados' ? (
                  <CadastroPagamentoEfetuadoSheet triggerLabel="Cadastrar" onSaved={() => setReloadKey((k) => k + 1)} />
                ) : tabs.selected === 'pagamentos-recebidos' ? (
                  <CadastroPagamentoRecebidoSheet triggerLabel="Cadastrar" onSaved={() => setReloadKey((k) => k + 1)} />
                ) : tabs.selected === 'bancos' ? (
                  <CadastroBancoSheet triggerLabel="Cadastrar" onSaved={() => setReloadKey((k) => k + 1)} />
                ) : tabs.selected === 'contas' ? (
                  <CadastroContaFinanceiraSheet triggerLabel="Cadastrar" onSaved={() => setReloadKey((k) => k + 1)} />
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
                  headerPadding={8}
                  columnOptions={{
                    // Fornecedor (diversas visões)
                    fornecedor_nome: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    fornecedor: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    // Descrição
                    descricao_conta: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    descricao_pagamento: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    // Observação
                    observacao: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    // Categoria (variações por view)
                    categoria_nome: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    categoria_financeira: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    categoria: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    // Filial (variações por view)
                    filial_nome: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
                    filial: { headerNoWrap: true, cellNoWrap: true, widthMode: 'auto', minWidth: 120 },
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
                  enableExpand={tabs.selected === 'extrato'}
                  renderDetail={tabs.selected === 'extrato' ? (row => {
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
                  }) : undefined}
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
      <DocumentViewer
        open={docViewerOpen}
        onOpenChange={setDocViewerOpen}
        url={docUrl ?? undefined}
        fileName={docName ?? undefined}
        contentType={docType ?? undefined}
      />
    </SidebarProvider>
  )
}
