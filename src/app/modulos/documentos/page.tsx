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

export default function ModulosDocumentosPage() {
  const [selected, setSelected] = useState<string>('inbox')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)

  const iconFor = (v: string) => <List className="h-4 w-4" />
  const tabs: Opcao[] = useMemo(() => ([
    { value: 'inbox', label: 'Inbox', icon: iconFor('inbox') },
    { value: 'processados', label: 'Processados', icon: iconFor('processados') },
    { value: 'tipos', label: 'Tipos', icon: iconFor('tipos') },
    { value: 'ocr', label: 'OCR/Extração', icon: iconFor('ocr') },
    { value: 'modelos', label: 'Modelos', icon: iconFor('modelos') },
    { value: 'uploads', label: 'Uploads', icon: iconFor('uploads') },
  ]), [])

  const formatDate = (value?: unknown) => {
    if (!value) return ''
    try {
      const d = new Date(String(value))
      if (isNaN(d.getTime())) return String(value)
      return d.toLocaleDateString('pt-BR')
    } catch { return String(value) }
  }

  const columns: ColumnDef<Row>[] = useMemo(() => {
    switch (selected) {
      case 'inbox':
        return [
          { accessorKey: 'data', header: 'Recebido em', cell: ({ row }) => formatDate(row.original['data']) },
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'origem', header: 'Origem' },
          { accessorKey: 'status', header: 'Status' },
        ]
      case 'processados':
        return [
          { accessorKey: 'data', header: 'Processado em', cell: ({ row }) => formatDate(row.original['data']) },
          { accessorKey: 'tipo', header: 'Tipo' },
          { accessorKey: 'descricao', header: 'Descrição' },
          { accessorKey: 'status', header: 'Status' },
        ]
      case 'tipos':
        return [
          { accessorKey: 'nome', header: 'Nome' },
          { accessorKey: 'descricao', header: 'Descrição' },
        ]
      case 'ocr':
        return [
          { accessorKey: 'documento', header: 'Documento' },
          { accessorKey: 'campos', header: 'Campos' },
          { accessorKey: 'confianca', header: 'Confiança' },
        ]
      case 'modelos':
        return [
          { accessorKey: 'nome', header: 'Nome' },
          { accessorKey: 'versao', header: 'Versão' },
          { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => formatDate(row.original['atualizado_em']) },
        ]
      case 'uploads':
      default:
        return [
          { accessorKey: 'arquivo', header: 'Arquivo' },
          { accessorKey: 'tamanho', header: 'Tamanho' },
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
            <PageHeader title="Documentos" subtitle="Em breve: gestão de documentos" />
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

