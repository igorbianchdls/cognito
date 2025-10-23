'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { FileCheck2 } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'

type Row = Record<string, unknown> & {
  funcionario?: string
  tipo_de_contrato?: string
  admissao?: string
  demissao?: string
  status?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

const statusColor = (s?: string) => {
  const v = (s || '').toLowerCase()
  if (v.includes('ativo')) return 'bg-green-100 text-green-800 border-green-300'
  if (v.includes('inativo') || v.includes('encerr')) return 'bg-gray-100 text-gray-800 border-gray-300'
  return 'bg-blue-100 text-blue-800 border-blue-300'
}

export default function ContratosResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'funcionario', header: 'Funcionário' },
    { accessorKey: 'tipo_de_contrato', header: 'Tipo de Contrato' },
    { accessorKey: 'admissao', header: 'Admissão', cell: ({ row }) => {
      const d = row.original.admissao as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'demissao', header: 'Demissão', cell: ({ row }) => {
      const d = row.original.demissao as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const s = row.original.status as string | undefined
      return s ? <Badge className={statusColor(s)}>{s}</Badge> : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Contratos"
      icon={FileCheck2}
      iconColor="text-emerald-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="contratos"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

