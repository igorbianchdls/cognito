'use client';

import { useState } from 'react';
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import TablesHeader from './components/TablesHeader';
import TablesDataTable from './components/TablesDataTable';
import TablesSidebar from './components/TablesSidebar';

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col">
        {/* Header fixo com trigger */}
        <header className="h-16 border-b bg-white flex items-center gap-2 px-4 shrink-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <TablesHeader />
        </header>

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
