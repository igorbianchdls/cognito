import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { CalendarClock } from 'lucide-react'
import type { CrmAtividadeRow, GetCrmAtividadesOutput } from '@/tools/crmTools'

export default function AtividadesResult({ result }: { result: GetCrmAtividadesOutput }) {
  const columns: ColumnDef<CrmAtividadeRow>[] = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'assunto', header: 'Assunto' },
    { accessorKey: 'tipo', header: 'Tipo' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'data_vencimento', header: 'Data Vencimento' },
    { accessorKey: 'conta', header: 'Conta' },
    { accessorKey: 'contato', header: 'Contato' },
    { accessorKey: 'lead', header: 'Lead' },
    { accessorKey: 'oportunidade', header: 'Oportunidade' },
    { accessorKey: 'responsavel', header: 'Responsável' },
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
      enableAutoChart={true}
      chartOptions={{ xKey: 'status', yKey: undefined, disableSwitcherUI: false }}
    />
  )
}

