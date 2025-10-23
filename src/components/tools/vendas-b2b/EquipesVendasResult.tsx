'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
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
    {
      accessorKey: 'equipe',
      header: 'Equipe',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const equipe = row.original.equipe || 'Sem nome';
        const descricao = row.original.descricao || 'Sem descrição';
        return <EntityDisplay name={String(equipe)} subtitle={String(descricao)} />;
      }
    },
    { accessorKey: 'qtd_vendedores', header: 'Qtd Vendedores' },
    { accessorKey: 'territorios_atendidos', header: 'Territórios Atendidos' },
    {
      accessorKey: 'ativo',
      header: 'Ativa',
      cell: ({ row }) => {
        const ativo = row.original.ativo;
        const value = ativo === true || ativo === 'true' || ativo === 'sim' ? 'Ativa' : 'Inativa';
        return <StatusBadge value={value} type="status" />;
      }
    },
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

