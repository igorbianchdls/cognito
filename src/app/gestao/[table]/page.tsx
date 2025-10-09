'use client';

import { useState } from 'react';
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import TablesHeader from '@/app/tables/components/TablesHeader';
import TablesDataTable from '@/app/tables/components/TablesDataTable';
import { FilterState, SortState } from '@/components/sheets/core/TableHeader';

// Mapeamento de rotas para nomes de tabelas
const TABLE_MAP: Record<string, string> = {
  'categorias': 'gestaofinanceira.categorias',
  'contas': 'gestaofinanceira.contas',
  'contas-a-pagar': 'gestaofinanceira.contas_a_pagar',
  'contas-a-receber': 'gestaofinanceira.contas_a_receber',
  'transacoes': 'gestaofinanceira.transacoes',
};

export default function GestaoTablePage({ params }: { params: { table: string } }) {
  const [filters, setFilters] = useState<FilterState[]>([]);
  const [sorting, setSorting] = useState<SortState[]>([]);

  const tableName = TABLE_MAP[params.table];

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col overflow-hidden">
        {/* Header com toolbar */}
        <TablesHeader
          onFiltersChange={setFilters}
          onSortChange={setSorting}
          onViewChange={() => {}}
          onShowCoverChange={() => {}}
        />

        {/* Conteúdo: Tabela */}
        <div className="flex-1 overflow-hidden">
          <TablesDataTable tableName={tableName} filters={filters} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
