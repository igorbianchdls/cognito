'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import TablesHeader from '@/app/tables/components/TablesHeader';
import TablesDataTable from '@/app/tables/components/TablesDataTable';
import { FilterState, SortState } from '@/components/sheets/core/TableHeader';

function GestaoContent() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table');

  const [selectedTable, setSelectedTable] = useState<string | null>(tableParam);
  const [filters, setFilters] = useState<FilterState[]>([]);
  const [sorting, setSorting] = useState<SortState[]>([]);

  // Sincronizar selectedTable com query param
  useEffect(() => {
    if (tableParam) {
      setSelectedTable(tableParam);
    }
  }, [tableParam]);

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col overflow-hidden">
        {/* Header com toolbar */}
        <TablesHeader
          onFiltersChange={setFilters}
          onSortChange={setSorting}
          onViewChange={() => {}} // View change não usado aqui
          onShowCoverChange={() => {}} // Show cover não usado aqui
        />

        {/* Conteúdo: Tabela */}
        <div className="flex-1 overflow-hidden">
          <TablesDataTable tableName={selectedTable} filters={filters} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function GestaoPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    }>
      <GestaoContent />
    </Suspense>
  );
}
