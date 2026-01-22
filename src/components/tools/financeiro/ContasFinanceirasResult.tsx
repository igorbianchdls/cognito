'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Banknote } from 'lucide-react'
import { useMemo } from 'react'

type Row = {
  conta_id?: string | number
  nome_conta?: string
  tipo_conta?: string
  agencia?: string
  numero_conta?: string
  pix_chave?: string
  saldo_inicial?: number
  saldo_atual?: number
  data_abertura?: string
  ativo?: boolean
  criado_em?: string
  atualizado_em?: string
  [k: string]: unknown
}

type Result = { success: boolean; rows: Row[]; count?: number; message: string; title?: string; sql_query?: string; error?: string }

export default function ContasFinanceirasResult({ result }: { result: Result }) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'nome_conta', header: 'Conta' },
    { accessorKey: 'tipo_conta', header: 'Tipo' },
    { accessorKey: 'agencia', header: 'Agência' },
    { accessorKey: 'numero_conta', header: 'Número' },
    { accessorKey: 'pix_chave', header: 'Pix' },
    { accessorKey: 'saldo_atual', header: 'Saldo', cell: ({ row }) => {
      const v = Number(row.original.saldo_atual ?? 0)
      return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    } },
    { accessorKey: 'ativo', header: 'Ativo' },
    { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ row }) => row.original.criado_em ? new Date(String(row.original.criado_em)).toLocaleDateString('pt-BR') : '-' },
  ], [])

  return (
    <ArtifactDataTable
      data={Array.isArray(result.rows) ? result.rows : []}
      columns={columns}
      title={result.title ?? 'Contas Financeiras'}
      icon={Banknote}
      iconColor="text-emerald-700"
      message={result.message}
      success={!!result.success}
      count={typeof result.count === 'number' ? result.count : (result.rows?.length ?? 0)}
      exportFileName="contas_financeiras"
      sqlQuery={result.sql_query}
    />
  )
}

