'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Wallet } from 'lucide-react'

type LookupRow = {
  tipo: 'metodo_pagamento' | 'conta_financeira' | string
  id: string
  nome: string
}

type FinanceiroLookupsOutput = {
  success: boolean
  title?: string
  message: string
  rows: LookupRow[]
  counts?: { contas?: number; metodos?: number }
  error?: string
}

export default function FinanceiroLookupsResult({ result }: { result: FinanceiroLookupsOutput }) {
  const columns: ColumnDef<LookupRow>[] = [
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => {
        const tipo = row.original.tipo
        const label = tipo === 'conta_financeira' ? 'Conta Financeira' : (tipo === 'metodo_pagamento' ? 'Método de Pagamento' : tipo)
        const color = tipo === 'conta_financeira' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        return <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{label}</span>
      }
    },
    { accessorKey: 'nome', header: 'Nome' },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="text-xs font-mono text-muted-foreground">{row.original.id}</span>
    }
  ]

  return (
    <ArtifactDataTable
      data={result.rows || []}
      columns={columns}
      title={result.title || 'Contas e Métodos'}
      icon={Wallet}
      iconColor="text-blue-600"
      message={result.message}
      success={result.success}
      count={result.rows?.length || 0}
      error={result.error}
      exportFileName="financeiro_lookups"
      pageSize={20}
    />
  )
}
