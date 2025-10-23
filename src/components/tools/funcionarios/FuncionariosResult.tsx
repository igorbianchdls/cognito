'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Users } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'

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

const statusColor = (s?: string) => {
  const v = (s || '').toLowerCase()
  if (v.includes('ativo')) return 'bg-green-100 text-green-800 border-green-300'
  if (v.includes('inativo')) return 'bg-gray-100 text-gray-800 border-gray-300'
  return 'bg-blue-100 text-blue-800 border-blue-300'
}

export default function FuncionariosResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'funcionario', header: 'Funcionário' },
    { accessorKey: 'cargo', header: 'Cargo' },
    { accessorKey: 'departamento', header: 'Departamento' },
    { accessorKey: 'gestor_direto', header: 'Gestor Direto' },
    { accessorKey: 'email_corporativo', header: 'Email' },
    { accessorKey: 'telefone', header: 'Telefone' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const s = row.original.status as string | undefined
      return s ? <Badge className={statusColor(s)}>{s}</Badge> : '-'
    } },
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

