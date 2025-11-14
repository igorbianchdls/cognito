'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Globe, TrendingUp, Package } from 'lucide-react'
import { useMemo } from 'react'

type SummaryRow = {
  territorio: string
  total_pedidos: number
  receita_total: number
  ticket_medio: number
  total_clientes: number
  total_vendedores: number
}

type VendedorRow = {
  vendedor_nome: string
  total_pedidos: number
  receita_total: number
}

type ProdutoRow = {
  produto_nome: string
  quantidade_vendida: number
  receita_total: number
}

interface AnalisTerritorioData {
  summary: SummaryRow[]
  topVendedores: VendedorRow[]
  topProdutos: ProdutoRow[]
}

interface Props {
  success: boolean
  message: string
  data?: AnalisTerritorioData
  filters?: {
    territorio_nome?: string
    data_de?: string
    data_ate?: string
  }
  sql_query?: string
}

export default function AnalisTerritorioResult({ success, message, data, filters }: Props) {
  // Hooks must be at the top level
  const vendedoresColumns: ColumnDef<VendedorRow>[] = useMemo(() => [
    {
      accessorKey: 'vendedor_nome',
      header: 'Vendedor',
      size: 250,
    },
    {
      accessorKey: 'total_pedidos',
      header: 'Pedidos',
      cell: ({ row }) => row.original.total_pedidos.toLocaleString('pt-BR'),
    },
    {
      accessorKey: 'receita_total',
      header: 'Receita Total',
      cell: ({ row }) => row.original.receita_total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    },
  ], [])

  const produtosColumns: ColumnDef<ProdutoRow>[] = useMemo(() => [
    {
      accessorKey: 'produto_nome',
      header: 'Produto',
      size: 250,
    },
    {
      accessorKey: 'quantidade_vendida',
      header: 'Quantidade',
      cell: ({ row }) => row.original.quantidade_vendida.toLocaleString('pt-BR'),
    },
    {
      accessorKey: 'receita_total',
      header: 'Receita Total',
      cell: ({ row }) => row.original.receita_total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    },
  ], [])

  // Early return after hooks
  if (!success || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-600" />
            Análise de Território
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{message}</p>
        </CardContent>
      </Card>
    )
  }

  const { summary, topVendedores, topProdutos } = data
  const summaryData = summary[0]

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-600" />
            {filters?.territorio_nome
              ? `Análise do Território: ${filters.territorio_nome}`
              : 'Análise de Territórios'}
          </CardTitle>
          {filters && (filters.data_de || filters.data_ate) && (
            <p className="text-sm text-gray-500">
              Período: {filters.data_de ? new Date(filters.data_de).toLocaleDateString('pt-BR') : '...'} até {filters.data_ate ? new Date(filters.data_ate).toLocaleDateString('pt-BR') : '...'}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{message}</p>
        </CardContent>
      </Card>

      {/* KPIs Summary */}
      {summaryData && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {summaryData.receita_total.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {summaryData.total_pedidos.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {summaryData.ticket_medio.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Clientes Únicos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {summaryData.total_clientes.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Vendedores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-indigo-600">
                {summaryData.total_vendedores.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Sellers Table */}
      <ArtifactDataTable
        data={topVendedores}
        columns={vendedoresColumns}
        title="Top 10 Vendedores"
        icon={TrendingUp}
        iconColor="text-blue-600"
        message={`${topVendedores.length} vendedores encontrados`}
        success={true}
        count={topVendedores.length}
        exportFileName={`top-vendedores-${filters?.territorio_nome || 'todos'}`}
        pageSize={10}
      />

      {/* Top Products Table */}
      <ArtifactDataTable
        data={topProdutos}
        columns={produtosColumns}
        title="Top 10 Produtos"
        icon={Package}
        iconColor="text-green-600"
        message={`${topProdutos.length} produtos encontrados`}
        success={true}
        count={topProdutos.length}
        exportFileName={`top-produtos-${filters?.territorio_nome || 'todos'}`}
        pageSize={10}
      />
    </div>
  )
}
