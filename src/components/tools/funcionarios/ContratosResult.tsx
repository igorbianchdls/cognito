'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { FileCheck2 } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  funcionario?: string
  tipo_de_contrato?: string
  admissao?: string
  demissao?: string
  status?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function ContratosResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    {
      accessorKey: 'funcionario',
      header: 'Funcionário',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const funcionario = row.original.funcionario || 'Sem nome';
        const tipoContrato = row.original.tipo_de_contrato || 'Sem tipo';
        return <EntityDisplay name={String(funcionario)} subtitle={String(tipoContrato)} />;
      }
    },
    { accessorKey: 'admissao', header: 'Admissão', cell: ({ row }) => {
      const d = row.original.admissao as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'demissao', header: 'Demissão', cell: ({ row }) => {
      const d = row.original.demissao as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge value={row.original.status} type="status" />
    },
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

