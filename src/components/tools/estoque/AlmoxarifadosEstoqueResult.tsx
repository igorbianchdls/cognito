'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Building2 } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  almoxarifado?: string
  tipo?: string
  endereco?: string
  responsavel?: string
  status?: string
  criado_em?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function AlmoxarifadosEstoqueResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'almoxarifado', header: 'Almoxarifado' },
    { accessorKey: 'tipo', header: 'Tipo' },
    { accessorKey: 'endereco', header: 'Endereço' },
    { accessorKey: 'responsavel', header: 'Responsável' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => {
      const d = row.original.criado_em as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Almoxarifados"
      icon={Building2}
      iconColor="text-slate-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="almoxarifados"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

