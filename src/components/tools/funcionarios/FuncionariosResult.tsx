'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { Users } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  funcionario?: string
  cargo?: string
  departamento?: string
  gestor_direto?: string
  email_corporativo?: string
  telefone?: string
  status?: string
  data_nascimento?: string
  data_criacao?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function FuncionariosResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    {
      accessorKey: 'funcionario',
      header: 'Funcionário',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const funcionario = row.original.funcionario || 'Sem nome';
        const subtitle = row.original.cargo || row.original.departamento || 'Sem cargo';
        return <EntityDisplay name={String(funcionario)} subtitle={String(subtitle)} />;
      }
    },
    { accessorKey: 'departamento', header: 'Departamento' },
    {
      accessorKey: 'gestor_direto',
      header: 'Gestor Direto',
      size: 200,
      minSize: 150,
      cell: ({ row }) => {
        const gestor = row.original.gestor_direto;
        if (!gestor) return '-';
        return <EntityDisplay name={String(gestor)} subtitle="Gestor" />;
      }
    },
    { accessorKey: 'email_corporativo', header: 'Email' },
    { accessorKey: 'telefone', header: 'Telefone' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge value={row.original.status} type="status" />
    },
    { accessorKey: 'data_nascimento', header: 'Nascimento', cell: ({ row }) => {
      const d = row.original.data_nascimento as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'data_criacao', header: 'Criado em', cell: ({ row }) => {
      const d = row.original.data_criacao as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Funcionários"
      icon={Users}
      iconColor="text-purple-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="funcionarios"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

