import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { Briefcase } from 'lucide-react'
import type { CrmOportunidadeRow, GetCrmOportunidadesOutput } from '@/tools/crmTools'
import StatusBadge from '@/components/modulos/StatusBadge'

export default function OportunidadesResult({ result }: { result: GetCrmOportunidadesOutput }) {
  const columns: ColumnDef<CrmOportunidadeRow>[] = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'oportunidade', header: 'Oportunidade' },
    { accessorKey: 'conta', header: 'Conta' },
    { accessorKey: 'responsavel', header: 'Responsável' },
    {
      accessorKey: 'estagio', header: 'Estágio',
      cell: ({ row }) => <StatusBadge value={row.original.estagio} type="estagio" />
    },
    {
      accessorKey: 'valor', header: 'Valor (R$)',
      cell: ({ row }) => {
        const v = row.original.valor || 0
        return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }
    },
    { accessorKey: 'probabilidade', header: '% Probabilidade' },
    { accessorKey: 'data_fechamento', header: 'Data Fechamento' },
    {
      accessorKey: 'prioridade', header: 'Prioridade',
      cell: ({ row }) => <StatusBadge value={row.original.prioridade} type="prioridade" />
    },
  ], [])

  return (
    <ArtifactDataTable
      data={result.rows || []}
      columns={columns}
      title="Oportunidades"
      icon={Briefcase}
      message={result.message}
      success={result.success}
      count={result.count}
      exportFileName="oportunidades"
      sqlQuery={result.sql_query}
      pageSize={10}
      enableAutoChart={true}
      chartOptions={{ xKey: 'estagio', valueKeys: ['valor'] }}
    />
  )
}
