'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { Building2 } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  nome_fantasia?: string
  razao_social?: string
  cnpj?: string
  cidade_uf?: string
  telefone?: string
  email?: string
  pais?: string
  status?: string
  cadastrado_em?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function FornecedoresCompraResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    {
      accessorKey: 'nome_fantasia',
      header: 'Fornecedor',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const nome = row.original.nome_fantasia || row.original.razao_social || 'Sem nome';
        const subtitle = row.original.cidade_uf || row.original.razao_social || 'Sem localização';
        return <EntityDisplay name={String(nome)} subtitle={String(subtitle)} />;
      }
    },
    { accessorKey: 'cnpj', header: 'CNPJ' },
    { accessorKey: 'telefone', header: 'Telefone' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'pais', header: 'País' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge value={row.original.status} type="status" />
    },
    { accessorKey: 'cadastrado_em', header: 'Cadastrado em', cell: ({ row }) => {
      const d = row.original.cadastrado_em as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Fornecedores"
      icon={Building2}
      iconColor="text-slate-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="fornecedores"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

