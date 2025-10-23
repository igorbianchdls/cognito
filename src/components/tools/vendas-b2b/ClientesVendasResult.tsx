'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Users2 } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  cliente?: string
  nome_fantasia_ou_razao?: string
  cpf_cnpj?: string
  email?: string
  telefone?: string
  vendedor_responsavel?: string
  territorio?: string
  status_cliente?: string
  cliente_desde?: string
  data_ultima_compra?: string
  faturamento_estimado_anual?: number
  frequencia_pedidos_mensal?: number
  ativo?: boolean | string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function ClientesVendasResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'cliente', header: 'Cliente' },
    { accessorKey: 'nome_fantasia_ou_razao', header: 'Nome Fantasia/Razão' },
    { accessorKey: 'cpf_cnpj', header: 'CPF/CNPJ' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'telefone', header: 'Telefone' },
    { accessorKey: 'vendedor_responsavel', header: 'Vendedor Responsável' },
    { accessorKey: 'territorio', header: 'Território' },
    { accessorKey: 'status_cliente', header: 'Status' },
    { accessorKey: 'cliente_desde', header: 'Cliente Desde', cell: ({ row }) => {
      const d = row.original.cliente_desde as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'data_ultima_compra', header: 'Última Compra', cell: ({ row }) => {
      const d = row.original.data_ultima_compra as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'faturamento_estimado_anual', header: 'Faturamento Estimado', cell: ({ row }) => {
      const v = row.original.faturamento_estimado_anual as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
    { accessorKey: 'frequencia_pedidos_mensal', header: 'Freq. Mensal' },
    { accessorKey: 'ativo', header: 'Ativo' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Clientes"
      icon={Users2}
      iconColor="text-teal-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="clientes-vendas"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

