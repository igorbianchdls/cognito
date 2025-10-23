'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { ClipboardList } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  almoxarifado?: string
  responsavel?: string
  status?: string
  inicio?: string
  fim?: string
  produto?: string
  qtde_sistema?: number
  qtde_contada?: number
  diferenca?: number
  ajuste_gerado?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function InventariosEstoqueResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'almoxarifado', header: 'Almoxarifado' },
    { accessorKey: 'responsavel', header: 'Responsável' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'inicio', header: 'Início', cell: ({ row }) => {
      const d = row.original.inicio as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'fim', header: 'Fim', cell: ({ row }) => {
      const d = row.original.fim as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'produto', header: 'Produto' },
    { accessorKey: 'qtde_sistema', header: 'Qtde Sistema' },
    { accessorKey: 'qtde_contada', header: 'Qtde Contada' },
    { accessorKey: 'diferenca', header: 'Diferença' },
    { accessorKey: 'ajuste_gerado', header: 'Ajuste Gerado' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Inventários de Estoque"
      icon={ClipboardList}
      iconColor="text-indigo-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="inventarios-estoque"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

