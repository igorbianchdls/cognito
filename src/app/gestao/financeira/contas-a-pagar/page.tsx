'use client';

import { useState } from 'react';
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import TablesHeader from '@/app/tables/components/TablesHeader';
import TablesDataTable from '@/app/tables/components/TablesDataTable';
import { FilterState, SortState } from '@/components/sheets/core/TableHeader';

export default function ContasAPagarPage() {
  const [filters, setFilters] = useState<FilterState[]>([]);
  const [sorting, setSorting] = useState<SortState[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRecordCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col overflow-hidden">
        <TablesHeader
          onFiltersChange={setFilters}
          onSortChange={setSorting}
          onViewChange={() => {}}
          onShowCoverChange={() => {}}
          tableName="gestaofinanceira.contas_a_pagar"
          onRecordCreated={handleRecordCreated}
        />
        <div className="flex-1 overflow-hidden">
          <TablesDataTable
            tableName="gestaofinanceira.contas_a_pagar"
            filters={filters}
            key={refreshTrigger}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
