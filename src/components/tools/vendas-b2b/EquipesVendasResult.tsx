'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Users } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  equipe?: string
  descricao?: string
  qtd_vendedores?: number
  territorios_atendidos?: string
  ativo?: string | boolean
  created_at?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function EquipesVendasResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'equipe', header: 'Equipe' },
    { accessorKey: 'descricao', header: 'Descrição' },
    { accessorKey: 'qtd_vendedores', header: 'Qtd Vendedores' },
    { accessorKey: 'territorios_atendidos', header: 'Territórios Atendidos' },
    { accessorKey: 'ativo', header: 'Ativa' },
    { accessorKey: 'created_at', header: 'Criada em', cell: ({ row }) => {
      const d = row.original.created_at as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Equipes"
      icon={Users}
      iconColor="text-violet-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="equipes-vendas"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

