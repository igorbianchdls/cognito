'use client';

import { useState } from 'react';
import TablesHeader from './components/TablesHeader';
import TablesDataTable from './components/TablesDataTable';
import TablesSidebar from './components/TablesSidebar';

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col">
      {/* Header fixo - sem scroll */}
      <TablesHeader />

      {/* Área principal: Table + Sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Table com scroll horizontal */}
        <div className="flex-1 min-w-0">
          <TablesDataTable tableName={selectedTable} />
        </div>

        {/* Sidebar fixo - sem scroll horizontal */}
        <TablesSidebar
          selectedTable={selectedTable}
          onSelectTable={setSelectedTable}
        />
      </div>
    </div>
  );
}
