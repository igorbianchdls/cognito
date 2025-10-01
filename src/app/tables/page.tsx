'use client';

import { useState } from 'react';
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import TablesHeader from './components/TablesHeader';
import TablesDataTable from './components/TablesDataTable';
import TablesSidebar from './components/TablesSidebar';
import { FilterState, SortState } from '@/components/sheets/core/TableHeader';

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState[]>([]);
  const [sorting, setSorting] = useState<SortState[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col overflow-hidden">
        {/* Header com toolbar */}
        <TablesHeader
          onFiltersChange={setFilters}
          onSortChange={setSorting}
          onViewChange={setView}
        />

        {/* Área principal: Table + Sidebar */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Table com scroll horizontal */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <TablesDataTable tableName={selectedTable} />
          </div>

          {/* Sidebar fixo - sem scroll horizontal */}
          <TablesSidebar
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
