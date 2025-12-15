import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { Briefcase } from 'lucide-react'
import type { CrmOportunidadeRow, GetCrmOportunidadesOutput } from '@/tools/crmTools'

export default function OportunidadesResult({ result }: { result: GetCrmOportunidadesOutput }) {
  const columns: ColumnDef<CrmOportunidadeRow>[] = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    {
      accessorKey: 'oportunidade',
      header: 'Oportunidade',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const oportunidade = row.original.oportunidade || 'Sem nome';
        const id = row.original.id ? `ID: ${row.original.id}` : 'Oportunidade';
        return <EntityDisplay name={String(oportunidade)} subtitle={String(id)} />;
      }
    },
    {
      accessorKey: 'conta',
      header: 'Conta',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const conta = row.original.conta || 'Sem conta';
        const rowData = row.original as Record<string, unknown>;
        const segmento = rowData.segmento_conta || rowData.segmento || 'Sem segmento';
        return <EntityDisplay name={String(conta)} subtitle={String(segmento)} />;
      }
    },
    {
      accessorKey: 'responsavel',
      header: 'Responsável',
      size: 200,
      minSize: 150,
      cell: ({ row }) => {
        const responsavel = row.original.responsavel;
        if (!responsavel) return '-';
        const rowData = row.original as Record<string, unknown>;
        const cargo = rowData.cargo_responsavel || 'Responsável';
        return <EntityDisplay name={String(responsavel)} subtitle={String(cargo)} />;
      }
    },
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
