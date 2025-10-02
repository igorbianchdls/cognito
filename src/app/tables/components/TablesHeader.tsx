'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import TableHeader, { FilterState, SortState } from '@/components/sheets/core/TableHeader';

interface TablesHeaderProps {
  onFiltersChange?: (filters: FilterState[]) => void;
  onSortChange?: (sorting: SortState[]) => void;
  onViewChange?: (view: 'grid' | 'gallery') => void;
  onShowCoverChange?: (show: boolean) => void;
}

export default function TablesHeader({
  onFiltersChange,
  onSortChange,
  onViewChange,
  onShowCoverChange
}: TablesHeaderProps) {
  return (
    <div className="flex items-center bg-white border-b border-gray-200 h-12 shrink-0">
      {/* Sidebar trigger + separator */}
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
      </div>

      {/* TableHeader content inline */}
      <div className="flex-1">
        <TableHeader
          className="border-0 [&>div]:pl-2"
          onFiltersChange={onFiltersChange}
          onSortChange={onSortChange}
          onViewChange={onViewChange}
          onShowCoverChange={onShowCoverChange}
        />
      </div>
    </div>
  );
}
