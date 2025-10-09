'use client';

import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import TableHeader, { FilterState, SortState } from '@/components/sheets/core/TableHeader';
import CreateRecordDialog from '@/components/tables/CreateRecordDialog';

interface TablesHeaderProps {
  onFiltersChange?: (filters: FilterState[]) => void;
  onSortChange?: (sorting: SortState[]) => void;
  onViewChange?: (view: 'grid' | 'gallery' | 'kanban') => void;
  onShowCoverChange?: (show: boolean) => void;
  tableName?: string;
  onRecordCreated?: () => void;
}

export default function TablesHeader({
  onFiltersChange,
  onSortChange,
  onViewChange,
  onShowCoverChange,
  tableName,
  onRecordCreated
}: TablesHeaderProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center bg-white border-b border-gray-200 h-12 shrink-0">
        {/* Sidebar trigger + separator */}
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
        </div>

        {/* TableHeader content inline */}
        <div className="flex-1 flex items-center gap-2">
          {/* Botão Criar - só aparece se tableName estiver definido */}
          {tableName && (
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded ml-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Criar
            </button>
          )}

          <TableHeader
            className="border-0 [&>div]:pl-2"
            onFiltersChange={onFiltersChange}
            onSortChange={onSortChange}
            onViewChange={onViewChange}
            onShowCoverChange={onShowCoverChange}
          />
        </div>
      </div>

      {/* Dialog de criação */}
      {tableName && (
        <CreateRecordDialog
          tableName={tableName}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => onRecordCreated?.()}
        />
      )}
    </>
  );
}
