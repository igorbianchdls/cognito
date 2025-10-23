'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Building2 } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  nome_fantasia?: string
  razao_social?: string
  cnpj?: string
  cidade_uf?: string
  telefone?: string
  email?: string
  pais?: string
  status?: string
  cadastrado_em?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function FornecedoresCompraResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'nome_fantasia', header: 'Nome Fantasia' },
    { accessorKey: 'razao_social', header: 'Razão Social' },
    { accessorKey: 'cnpj', header: 'CNPJ' },
    { accessorKey: 'cidade_uf', header: 'Cidade/UF' },
    { accessorKey: 'telefone', header: 'Telefone' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'pais', header: 'País' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'cadastrado_em', header: 'Cadastrado em', cell: ({ row }) => {
      const d = row.original.cadastrado_em as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Fornecedores"
      icon={Building2}
      iconColor="text-slate-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="fornecedores"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

