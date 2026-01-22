'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { FileMinus } from 'lucide-react'
import { useMemo } from 'react'

type Row = {
  id?: string | number
  codigo?: string
  nome?: string
  descricao?: string
  tipo?: string
  natureza?: string
  categoria_pai_id?: string | number | null
  plano_conta_id?: string | number | null
  criado_em?: string
  atualizado_em?: string
  [k: string]: unknown
}

type Result = { success: boolean; rows: Row[]; count?: number; message: string; title?: string; sql_query?: string; error?: string }

export default function CategoriasDespesaResult({ result }: { result: Result }) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'codigo', header: 'Código' },
    { accessorKey: 'nome', header: 'Nome' },
    { accessorKey: 'descricao', header: 'Descrição' },
    { accessorKey: 'tipo', header: 'Tipo' },
    { accessorKey: 'natureza', header: 'Natureza' },
    { accessorKey: 'plano_conta_id', header: 'Plano Contábil' },
    { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ row }) => row.original.criado_em ? new Date(String(row.original.criado_em)).toLocaleDateString('pt-BR') : '-' },
  ], [])

  return (
    <ArtifactDataTable
      data={Array.isArray(result.rows) ? result.rows : []}
      columns={columns}
      title={result.title ?? 'Categorias de Despesa'}
      icon={FileMinus}
      iconColor="text-rose-700"
      message={result.message}
      success={!!result.success}
      count={typeof result.count === 'number' ? result.count : (result.rows?.length ?? 0)}
      exportFileName="categorias_despesa"
      sqlQuery={result.sql_query}
    />
  )
}

