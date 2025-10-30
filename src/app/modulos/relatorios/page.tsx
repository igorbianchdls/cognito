"use client"

import { useMemo, useState } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import DataTable, { type TableData } from '@/components/widgets/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { BarChart3, DollarSign, ShoppingCart, Megaphone } from 'lucide-react'

export default function ModulosRelatoriosPage() {
  const [tab, setTab] = useState<string>('executivo')

  const tabs: Opcao[] = [
    { value: 'executivo', label: 'Executivo', icon: <BarChart3 className="h-4 w-4" /> },
    { value: 'financeiro', label: 'Financeiro', icon: <DollarSign className="h-4 w-4" /> },
    { value: 'vendas', label: 'Vendas', icon: <ShoppingCart className="h-4 w-4" /> },
    { value: 'marketing', label: 'Marketing', icon: <Megaphone className="h-4 w-4" /> },
  ]

  type Row = TableData

  const { columns, data }: { columns: ColumnDef<Row>[]; data: Row[] } = useMemo(() => {
    switch (tab) {
      case 'financeiro':
        return {
          columns: [
            { accessorKey: 'conta', header: 'Conta' },
            { accessorKey: 'periodo', header: 'Período' },
            { accessorKey: 'valor', header: 'Valor' },
            { accessorKey: 'status', header: 'Status' },
          ],
          data: [
            { conta: 'Receita', periodo: 'Mês atual', valor: 125000, status: 'OK' },
            { conta: 'Despesa', periodo: 'Mês atual', valor: 83000, status: 'OK' },
            { conta: 'Margem', periodo: 'Mês atual', valor: 42000, status: 'OK' },
          ],
        }
      case 'vendas':
        return {
          columns: [
            { accessorKey: 'produto', header: 'Produto' },
            { accessorKey: 'quantidade', header: 'Qtd' },
            { accessorKey: 'faturamento', header: 'Faturamento' },
            { accessorKey: 'canal', header: 'Canal' },
          ],
          data: [
            { produto: 'SKU-1001', quantidade: 120, faturamento: 36000, canal: 'E-commerce' },
            { produto: 'SKU-2040', quantidade: 75, faturamento: 22500, canal: 'Marketplace' },
            { produto: 'SKU-3344', quantidade: 58, faturamento: 17400, canal: 'E-commerce' },
          ],
        }
      case 'marketing':
        return {
          columns: [
            { accessorKey: 'campanha', header: 'Campanha' },
            { accessorKey: 'impressoes', header: 'Impressões' },
            { accessorKey: 'cliques', header: 'Cliques' },
            { accessorKey: 'ctr', header: 'CTR (%)' },
          ],
          data: [
            { campanha: 'Awareness Q4', impressoes: 120000, cliques: 7200, ctr: 6.0 },
            { campanha: 'Promo Black', impressoes: 85000, cliques: 5950, ctr: 7.0 },
            { campanha: 'Retargeting', impressoes: 56000, cliques: 3920, ctr: 7.0 },
          ],
        }
      case 'executivo':
      default:
        return {
          columns: [
            { accessorKey: 'indicador', header: 'Indicador' },
            { accessorKey: 'valor', header: 'Valor' },
            { accessorKey: 'variacao', header: 'Variação' },
          ],
          data: [
            { indicador: 'Receita', valor: 125000, variacao: '+8.2%' },
            { indicador: 'CAC', valor: 47.3, variacao: '-3.1%' },
            { indicador: 'Conversão', valor: '2.4%', variacao: '+0.2pp' },
          ],
        }
    }
  }, [tab])

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto bg-gray-50">
        <div className="bg-white">
          <div>
            <PageHeader title="Relatórios" subtitle="Central de relatórios gerenciais" />
          </div>
          <div>
            <TabsNav
              options={tabs}
              value={tab}
              onValueChange={setTab}
              activeBorderColor="#111827"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="px-4 md:px-6" style={{ marginTop: 12 }}>
            <div className="border-y bg-background">
              <DataTable columns={columns} data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

