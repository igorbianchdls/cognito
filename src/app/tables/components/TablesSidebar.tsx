'use client';

import { Database } from 'lucide-react';
import { SUPABASE_DATASETS } from '@/data/supabaseDatasets';

interface TablesSidebarProps {
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
}

export default function TablesSidebar({ selectedTable, onSelectTable }: TablesSidebarProps) {
  return (
    <aside className="w-64 border-l bg-background flex-shrink-0 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold mb-3 text-foreground/70">Tabelas</h2>

        <div className="space-y-0.5">
          {SUPABASE_DATASETS.map((dataset) => {
            const isSelected = selectedTable === dataset.tableName;

            return (
              <button
                key={dataset.id}
                onClick={() => onSelectTable(dataset.tableName)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isSelected
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground/80 hover:bg-accent/50 hover:text-accent-foreground'
                }`}
              >
                <Database className="h-4 w-4 shrink-0" />
                <span className="truncate text-left">{dataset.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
