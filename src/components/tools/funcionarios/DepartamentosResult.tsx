'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Building2 } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  departamento?: string
  departamento_pai?: string
  gestor?: string
  qtd_funcionarios?: number
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function DepartamentosResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'departamento', header: 'Departamento' },
    { accessorKey: 'departamento_pai', header: 'Departamento Pai' },
    { accessorKey: 'gestor', header: 'Gestor' },
    { accessorKey: 'qtd_funcionarios', header: 'Qtd. Funcionários' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Departamentos"
      icon={Building2}
      iconColor="text-slate-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="departamentos"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

