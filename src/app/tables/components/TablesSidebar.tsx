'use client';

import { Database } from 'lucide-react';
import { SUPABASE_DATASETS } from '@/data/supabaseDatasets';

interface TablesSidebarProps {
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
}

export default function TablesSidebar({ selectedTable, onSelectTable }: TablesSidebarProps) {
  // Group datasets by category
  const groupedDatasets = SUPABASE_DATASETS.reduce((acc, dataset) => {
    const category = dataset.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(dataset);
    return acc;
  }, {} as Record<string, typeof SUPABASE_DATASETS>);

  return (
    <aside className="w-64 border-l bg-sidebar flex-shrink-0 overflow-y-auto">
      <div className="p-4">
        <div className="space-y-4">
          {Object.entries(groupedDatasets).map(([category, datasets]) => (
            <div key={category}>
              {/* Category label */}
              <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-2 px-2">
                {category}
              </h3>

              {/* Datasets in category */}
              <div className="space-y-0.5">
                {datasets.map((dataset) => {
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
          ))}
        </div>
      </div>
    </aside>
  );
}
