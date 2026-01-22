'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { FilePlus } from 'lucide-react'
import { useMemo } from 'react'

type Row = {
  id?: string | number
  codigo?: string
  nome?: string
  descricao?: string
  tipo?: string
  natureza?: string
  plano_conta_id?: string | number | null
  ativo?: boolean
  criado_em?: string
  atualizado_em?: string
  [k: string]: unknown
}

type Result = { success: boolean; rows: Row[]; count?: number; message: string; title?: string; sql_query?: string; error?: string }

export default function CategoriasReceitaResult({ result }: { result: Result }) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'codigo', header: 'Código' },
    { accessorKey: 'nome', header: 'Nome' },
    { accessorKey: 'descricao', header: 'Descrição' },
    { accessorKey: 'tipo', header: 'Tipo' },
    { accessorKey: 'natureza', header: 'Natureza' },
    { accessorKey: 'plano_conta_id', header: 'Plano Contábil' },
    { accessorKey: 'ativo', header: 'Ativo' },
    { accessorKey: 'criado_em', header: 'Criado Em', cell: ({ row }) => row.original.criado_em ? new Date(String(row.original.criado_em)).toLocaleDateString('pt-BR') : '-' },
  ], [])

  return (
    <ArtifactDataTable
      data={Array.isArray(result.rows) ? result.rows : []}
      columns={columns}
      title={result.title ?? 'Categorias de Receita'}
      icon={FilePlus}
      iconColor="text-emerald-700"
      message={result.message}
      success={!!result.success}
      count={typeof result.count === 'number' ? result.count : (result.rows?.length ?? 0)}
      exportFileName="categorias_receita"
      sqlQuery={result.sql_query}
    />
  )
}

