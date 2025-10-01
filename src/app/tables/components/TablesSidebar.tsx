'use client';

import { SUPABASE_DATASETS } from '@/data/supabaseDatasets';

interface TablesSidebarProps {
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
}

export default function TablesSidebar({ selectedTable, onSelectTable }: TablesSidebarProps) {
  return (
    <aside className="w-80 border-l bg-gray-50 flex-shrink-0 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Tabelas Disponíveis</h2>

        <div className="space-y-1">
          {SUPABASE_DATASETS.map((dataset) => {
            const isSelected = selectedTable === dataset.tableName;

            return (
              <button
                key={dataset.id}
                onClick={() => onSelectTable(dataset.tableName)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{dataset.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {dataset.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {dataset.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
