"use client"

import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

import PageHeader from '@/components/modulos/PageHeader'
import TabsNav, { type Opcao } from '@/components/modulos/TabsNav'
import DataToolbar from '@/components/modulos/DataToolbar'
import DataTable, { type TableData } from '@/components/widgets/Table'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { List } from 'lucide-react'

type Row = TableData

export default function ModulosContabilidadePage() {
  const [selected, setSelected] = useState<string>('lancamentos')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)

  const iconFor = (v: string) => <List className="h-4 w-4" />
  const tabs: Opcao[] = useMemo(() => ([
    { value: 'lancamentos', label: 'Lançamentos', icon: iconFor('lancamentos') },
    { value: 'plano-contas', label: 'Plano de Contas', icon: iconFor('plano-contas') },
    { value: 'balancete', label: 'Balancete', icon: iconFor('balancete') },
    { value: 'dre', label: 'DRE', icon: iconFor('dre') },
    { value: 'balanco', label: 'Balanço Patrimonial', icon: iconFor('balanco') },
    { value: 'obrigacoes', label: 'Obrigações/Impostos', icon: iconFor('obrigacoes') },
  ]), [])

  const formatDate = (value?: unknown) => {
    if (!value) return ''
    try {
      const d = new Date(String(value))
      if (isNaN(d.getTime())) return String(value)
      return d.toLocaleDateString('pt-BR')
    } catch { return String(value) }
  }
  const formatBRL = (value?: unknown) => {
    const n = Number(value ?? 0)
    return isNaN(n) ? String(value ?? '') : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (selected) {
      case 'lancamentos':
        return [
          { accessorKey: 'data', header: 'Data', cell: ({ row }) => formatDate(row.original['data']) },
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'historico', header: 'Histórico' },
          { accessorKey: 'valor', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor']) },
        ]
      case 'plano-contas':
        return [
          { accessorKey: 'codigo', header: 'Código' },
          { accessorKey: 'nome', header: 'Nome' },
          { accessorKey: 'tipo', header: 'Tipo' },
        ]
      case 'balancete':
        return [
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'debito', header: 'Débito', cell: ({ row }) => formatBRL(row.original['debito']) },
          { accessorKey: 'credito', header: 'Crédito', cell: ({ row }) => formatBRL(row.original['credito']) },
          { accessorKey: 'saldo', header: 'Saldo', cell: ({ row }) => formatBRL(row.original['saldo']) },
        ]
      case 'dre':
        return [
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'valor', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor']) },
        ]
      case 'balanco':
        return [
          { accessorKey: 'grupo', header: 'Grupo' },
          { accessorKey: 'conta', header: 'Conta' },
          { accessorKey: 'valor', header: 'Valor', cell: ({ row }) => formatBRL(row.original['valor']) },
        ]
      case 'obrigacoes':
      default:
        return [
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'periodo', header: 'Período' },
          { accessorKey: 'status', header: 'Status' },
        ]
    }
  }, [selected])

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-y-auto" style={{ background: 'rgb(253, 253, 253)' }}>
        <div style={{ background: 'white' }}>
          <div style={{ marginBottom: 16 }}>
            <PageHeader title="Contabilidade" subtitle="Em breve: dados contábeis" />
          </div>
          <TabsNav options={tabs} value={selected} onValueChange={setSelected} />
        </div>
        <div className="px-4 md:px-6" style={{ marginTop: 8 }}>
          <DataToolbar
            from={0}
            to={0}
            total={0}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
        <div className="px-4 md:px-6 pb-6">
          <DataTable columns={columns} data={[]} showPagination={false} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

