'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import TableHeader, { FilterState, SortState } from '@/components/sheets/core/TableHeader';

interface TablesHeaderProps {
  onFiltersChange?: (filters: FilterState[]) => void;
  onSortChange?: (sorting: SortState[]) => void;
  onViewChange?: (view: 'grid' | 'list') => void;
}

export default function TablesHeader({
  onFiltersChange,
  onSortChange,
  onViewChange
}: TablesHeaderProps) {
  return (
    <>
      {/* Top bar with sidebar trigger */}
      <div className="flex items-center gap-2 px-4 border-b bg-white h-16 shrink-0">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>

      {/* Toolbar with filters, sort, etc */}
      <TableHeader
        onFiltersChange={onFiltersChange}
        onSortChange={onSortChange}
        onViewChange={onViewChange}
      />
    </>
  );
}
