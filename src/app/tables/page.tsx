'use client';

import { useState } from 'react';
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import TablesHeader from './components/TablesHeader';
import TablesDataTable from './components/TablesDataTable';
import TablesGalleryView from './components/TablesGalleryView';
import TablesSidebar from './components/TablesSidebar';
import { FilterState, SortState } from '@/components/sheets/core/TableHeader';

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState[]>([]);
  const [sorting, setSorting] = useState<SortState[]>([]);
  const [view, setView] = useState<'grid' | 'gallery'>('grid');
  const [showCover, setShowCover] = useState<boolean>(true);

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-row overflow-hidden">
        {/* Coluna principal: Header + Table */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header com toolbar */}
          <TablesHeader
            onFiltersChange={setFilters}
            onSortChange={setSorting}
            onViewChange={setView}
            onShowCoverChange={setShowCover}
          />

          {/* Conteúdo: Table ou Gallery */}
          <div className="flex-1 overflow-hidden">
            {view === 'grid' ? (
              <TablesDataTable tableName={selectedTable} filters={filters} />
            ) : (
              <TablesGalleryView tableName={selectedTable} showCover={showCover} />
            )}
          </div>
        </div>

        {/* Sidebar direito - altura completa */}
        <TablesSidebar
          selectedTable={selectedTable}
          onSelectTable={setSelectedTable}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
