import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { TrendingUp } from 'lucide-react'
import type { GetDesempenhoOutput, DesempenhoRow } from '@/tools/analistaVendasTools'

export default function DesempenhoResult({ result }: { result: GetDesempenhoOutput }) {
  const columns: ColumnDef<DesempenhoRow>[] = useMemo(() => [
    { accessorKey: 'vendedor', header: 'Vendedor' },
    { accessorKey: 'ano', header: 'Ano' },
    { accessorKey: 'mes', header: 'Mês' },
    { accessorKey: 'tipo_meta', header: 'Tipo Meta' },
    { accessorKey: 'valor_meta', header: 'Meta' },
    { accessorKey: 'realizado', header: 'Realizado' },
    { accessorKey: 'diferenca', header: 'Diferença' },
    { accessorKey: 'atingimento_percentual', header: 'Atingimento (%)' },
  ], [])

  return (
    <ArtifactDataTable<DesempenhoRow>
      data={result.rows || []}
      columns={columns}
      title="Desempenho Comercial"
      icon={TrendingUp}
      message={result.message}
      success={result.success}
      count={result.count}
      exportFileName="desempenho_comercial"
      sqlQuery={result.sql_query}
      pageSize={10}
      enableAutoChart={true}
      chartOptions={{ xKey: 'tipo_meta', valueKeys: ['realizado'] }}
    />
  )
}

