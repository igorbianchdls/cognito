'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { CalendarX2 } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  tipo_de_ausencia?: string
  desconta_saldo_ferias?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function TiposAusenciaResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'tipo_de_ausencia', header: 'Tipo de Ausência' },
    { accessorKey: 'desconta_saldo_ferias', header: 'Desconta Saldo de Férias?' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Tipos de Ausência"
      icon={CalendarX2}
      iconColor="text-rose-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="tipos-ausencia"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

