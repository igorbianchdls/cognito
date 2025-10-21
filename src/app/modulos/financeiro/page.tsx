'use client'

import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'

import TituloModulo from '@/components/modulos/TituloModulo'
import OpcoesTabs, { type Opcao } from '@/components/modulos/OpcoesTabs'
import TabelaDados from '@/components/modulos/TabelaDados'

type Row = {
  [key: string]: string | number | boolean | null | undefined
}

export default function ModulosFinanceiroPage() {
  const [tab, setTab] = useState<string>('visao')

  const opcoes: Opcao[] = [
    { value: 'visao', label: 'Visão geral' },
    { value: 'contas', label: 'Contas' },
    { value: 'pagamentos', label: 'Pagamentos' },
    { value: 'recebimentos', label: 'Recebimentos' },
  ]

  const { columns, data } = useMemo((): { columns: ColumnDef<Row>[]; data: Row[] } => {
    switch (tab) {
      case 'contas':
        return {
          columns: [
            { accessorKey: 'banco', header: 'Banco' },
            { accessorKey: 'agencia', header: 'Agência' },
            { accessorKey: 'conta', header: 'Conta' },
            { accessorKey: 'saldo', header: 'Saldo' },
          ],
          data: [
            { banco: 'Banco A', agencia: '0001', conta: '12345-6', saldo: 15234.9 },
            { banco: 'Banco B', agencia: '0002', conta: '98765-4', saldo: 834.12 },
          ],
        }
      case 'pagamentos':
        return {
          columns: [
            { accessorKey: 'fornecedor', header: 'Fornecedor' },
            { accessorKey: 'documento', header: 'Documento' },
            { accessorKey: 'vencimento', header: 'Vencimento' },
            { accessorKey: 'valor', header: 'Valor' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { fornecedor: 'ACME Ltda', documento: 'NF 123', vencimento: '2025-10-30', valor: 1200.5, status: 'Pendente' },
            { fornecedor: 'Supply Co', documento: 'NF 456', vencimento: '2025-11-05', valor: 349.9, status: 'Pago' },
          ],
        }
      case 'recebimentos':
        return {
          columns: [
            { accessorKey: 'cliente', header: 'Cliente' },
            { accessorKey: 'pedido', header: 'Pedido' },
            { accessorKey: 'data', header: 'Data' },
            { accessorKey: 'valor', header: 'Valor' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { cliente: 'Cliente X', pedido: 'PO-1001', data: '2025-10-20', valor: 899.0, status: 'Recebido' },
            { cliente: 'Cliente Y', pedido: 'PO-1002', data: '2025-10-21', valor: 120.0, status: 'Em aberto' },
          ],
        }
      case 'visao':
      default:
        return {
          columns: [
            { accessorKey: 'indicador', header: 'Indicador' },
            { accessorKey: 'valor', header: 'Valor' },
          ],
          data: [
            { indicador: 'Saldo total', valor: 16068.02 },
            { indicador: 'A pagar (30d)', valor: 1550.4 },
            { indicador: 'A receber (30d)', valor: 1019.0 },
          ],
        }
    }
  }, [tab])

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col overflow-hidden">
        <TituloModulo title="Financeiro" subtitle="Selecione uma opção para visualizar os dados" />
        <OpcoesTabs options={opcoes} value={tab} onValueChange={setTab} />
        <div className="flex-1 min-h-0 overflow-hidden">
          <TabelaDados columns={columns} data={data} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

