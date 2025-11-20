import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { Target } from 'lucide-react'
import type { GetMetasOutput, MetaRow } from '@/tools/analistaVendasTools'

export default function MetasResult({ result }: { result: GetMetasOutput }) {
  const columns: ColumnDef<MetaRow>[] = useMemo(() => [
    { accessorKey: 'vendedor', header: 'Vendedor' },
    { accessorKey: 'ano', header: 'Ano' },
    { accessorKey: 'mes', header: 'Mês' },
    { accessorKey: 'tipo_meta', header: 'Tipo Meta' },
    { accessorKey: 'tipo_valor', header: 'Tipo Valor' },
    { accessorKey: 'valor_meta', header: 'Valor Meta' },
    { accessorKey: 'meta_percentual', header: '% Meta' },
    { accessorKey: 'criado_em', header: 'Criado Em' },
    { accessorKey: 'atualizado_em', header: 'Atualizado Em' },
  ], [])

  return (
    <ArtifactDataTable<MetaRow>
      data={result.rows || []}
      columns={columns}
      title="Metas Comerciais"
      icon={Target}
      message={result.message}
      success={result.success}
      count={result.count}
      exportFileName="metas_comerciais"
      sqlQuery={result.sql_query}
      pageSize={10}
      enableAutoChart={true}
      chartOptions={{ xKey: 'vendedor', valueKeys: ['valor_meta'] }}
    />
  )
}

