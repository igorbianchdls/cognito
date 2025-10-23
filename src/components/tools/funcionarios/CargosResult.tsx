'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Briefcase } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  cargo?: string
  descricao?: string
  qtd_funcionarios?: number
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function CargosResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'cargo', header: 'Cargo' },
    { accessorKey: 'descricao', header: 'Descrição' },
    { accessorKey: 'qtd_funcionarios', header: 'Qtd. Funcionários' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Cargos"
      icon={Briefcase}
      iconColor="text-amber-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="cargos"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

