'use client';

import { useState } from 'react';
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import TablesHeader from '@/app/tables/components/TablesHeader';
import TablesDataTable from '@/app/tables/components/TablesDataTable';
import { FilterState, SortState } from '@/components/sheets/core/TableHeader';

export default function CargosPage() {
  const [filters, setFilters] = useState<FilterState[]>([]);
  const [sorting, setSorting] = useState<SortState[]>([]);

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col overflow-hidden">
        <TablesHeader
          onFiltersChange={setFilters}
          onSortChange={setSorting}
          onViewChange={() => {}}
          onShowCoverChange={() => {}}
        />
        <div className="flex-1 overflow-hidden">
          <TablesDataTable tableName="gestaofuncionarios.cargos" filters={filters} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
