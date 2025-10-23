import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { CalendarClock } from 'lucide-react'
import type { CrmAtividadeRow, GetCrmAtividadesOutput } from '@/tools/crmTools'

export default function AtividadesResult({ result }: { result: GetCrmAtividadesOutput }) {
  const columns: ColumnDef<CrmAtividadeRow>[] = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    {
      accessorKey: 'assunto',
      header: 'Assunto',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const assunto = row.original.assunto || 'Sem assunto';
        const tipo = row.original.tipo || 'Atividade';
        return <EntityDisplay name={String(assunto)} subtitle={String(tipo)} />;
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge value={row.original.status} type="status" />
    },
    { accessorKey: 'data_vencimento', header: 'Data Vencimento' },
    {
      accessorKey: 'conta',
      header: 'Conta',
      size: 200,
      minSize: 150,
      cell: ({ row }) => {
        const conta = row.original.conta;
        if (!conta) return '-';
        const rowData = row.original as Record<string, unknown>;
        const segmento = rowData.segmento_conta || 'Conta';
        return <EntityDisplay name={String(conta)} subtitle={String(segmento)} />;
      }
    },
    {
      accessorKey: 'contato',
      header: 'Contato',
      size: 200,
      minSize: 150,
      cell: ({ row }) => {
        const contato = row.original.contato;
        if (!contato) return '-';
        const rowData = row.original as Record<string, unknown>;
        const cargo = rowData.cargo_contato || rowData.email_contato || 'Contato';
        return <EntityDisplay name={String(contato)} subtitle={String(cargo)} />;
      }
    },
    { accessorKey: 'lead', header: 'Lead' },
    { accessorKey: 'oportunidade', header: 'Oportunidade' },
    {
      accessorKey: 'responsavel',
      header: 'Responsável',
      size: 200,
      minSize: 150,
      cell: ({ row }) => {
        const responsavel = row.original.responsavel;
        if (!responsavel) return '-';
        const rowData = row.original as Record<string, unknown>;
        const departamento = rowData.departamento_responsavel || 'Responsável';
        return <EntityDisplay name={String(responsavel)} subtitle={String(departamento)} />;
      }
    },
    { accessorKey: 'anotacoes', header: 'Anotações' },
  ], [])

  return (
    <ArtifactDataTable
      data={result.rows || []}
      columns={columns}
      title="Atividades"
      icon={CalendarClock}
      message={result.message}
      success={result.success}
      count={result.count}
      exportFileName="atividades"
      sqlQuery={result.sql_query}
      pageSize={10}
      enableAutoChart={false}
    />
  )
}
