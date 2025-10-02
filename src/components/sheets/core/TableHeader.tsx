'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { getActiveDatasetInfo } from '@/stores/sheets/sheetsStore';
import {
  $rowHeight,
  $headerRowHeight,
  $fontSize,
  $headerFontSize,
  $cellTextColor,
  $headerTextColor,
} from '@/stores/table/tablePreferences';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface FilterState {
  column: string;
  operator: string;
  value: string;
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

interface TableHeaderProps {
  className?: string;
  onFiltersChange?: (filters: FilterState[]) => void;
  onSortChange?: (sorting: SortState[]) => void;
  onViewChange?: (view: 'grid' | 'gallery' | 'kanban') => void;
  onShowCoverChange?: (show: boolean) => void;
}

export default function TableHeader({
  className = '',
  onFiltersChange,
  onSortChange,
  onViewChange,
  onShowCoverChange
}: TableHeaderProps) {
  const [activeView, setActiveView] = useState<'grid' | 'gallery' | 'kanban'>('grid');
  const [showCover, setShowCover] = useState<boolean>(true);
  const [filters, setFilters] = useState<FilterState[]>([]);
  const [sorting, setSorting] = useState<SortState[]>([]);
  const datasetInfo = getActiveDatasetInfo();

  // Table preferences from nanostores
  const rowHeight = useStore($rowHeight);
  const headerRowHeight = useStore($headerRowHeight);
  const fontSize = useStore($fontSize);
  const headerFontSize = useStore($headerFontSize);
  const cellTextColor = useStore($cellTextColor);
  const headerTextColor = useStore($headerTextColor);

  const handleAddFilter = () => {
    const newFilter: FilterState = {
      column: '',
      operator: 'contains',
      value: ''
    };
    const updatedFilters = [...filters, newFilter];
    setFilters(updatedFilters);
    onFiltersChange?.(updatedFilters);
  };

  const handleRemoveFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
    onFiltersChange?.(updatedFilters);
  };

  const handleUpdateFilter = (index: number, field: keyof FilterState, value: string) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    setFilters(updatedFilters);
    onFiltersChange?.(updatedFilters);
  };

  const handleViewChange = (view: 'grid' | 'gallery' | 'kanban') => {
    setActiveView(view);
    onViewChange?.(view);
  };

  const handleToggleCover = () => {
    const newShowCover = !showCover;
    setShowCover(newShowCover);
    onShowCoverChange?.(newShowCover);
  };

  const handleAddSort = () => {
    const newSort: SortState = {
      column: '',
      direction: 'asc'
    };
    const updatedSorting = [...sorting, newSort];
    setSorting(updatedSorting);
    onSortChange?.(updatedSorting);
  };

  const handleRemoveSort = (index: number) => {
    const updatedSorting = sorting.filter((_, i) => i !== index);
    setSorting(updatedSorting);
    onSortChange?.(updatedSorting);
  };
  
  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center h-12 px-6">
        {/* Left side - Toolbar (Baserow style) */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {activeView === 'grid' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  ) : activeView === 'gallery' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  )}
                </svg>
                {activeView === 'grid' ? 'Table' : activeView === 'gallery' ? 'Gallery' : 'Kanban'}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>View Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewChange('grid')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Table View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewChange('gallery')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Gallery View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewChange('kanban')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Kanban View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Toggle Cover Button - Only visible in Gallery view */}
          {activeView === 'gallery' && (
            <button
              onClick={handleToggleCover}
              className={`flex items-center gap-1 px-2 py-1 text-sm rounded ${
                showCover
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
              }`}
              title={showCover ? 'Hide covers' : 'Show covers'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {showCover ? 'Cover' : 'No Cover'}
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {filters.length > 0 ? `${filters.length} Filters` : 'Filters'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-96">
              <DropdownMenuLabel>Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filters.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No filters applied
                </div>
              ) : (
                <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                  {filters.map((filter, index) => (
                    <div key={index} className="flex flex-col gap-2 p-2 border rounded bg-gray-50">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Column name"
                          value={filter.column}
                          onChange={(e) => handleUpdateFilter(index, 'column', e.target.value)}
                          className="flex-1 px-2 py-1 text-xs border rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFilter(index);
                          }}
                          className="text-red-500 hover:text-red-700 px-2"
                        >
                          ×
                        </button>
                      </div>
                      <select
                        value={filter.operator}
                        onChange={(e) => handleUpdateFilter(index, 'operator', e.target.value)}
                        className="px-2 py-1 text-xs border rounded"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="contains">Contains</option>
                        <option value="equals">Equals</option>
                        <option value="startsWith">Starts with</option>
                        <option value="endsWith">Ends with</option>
                        <option value="greaterThan">Greater than</option>
                        <option value="lessThan">Less than</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Filter value"
                        value={filter.value}
                        onChange={(e) => handleUpdateFilter(index, 'value', e.target.value)}
                        className="px-2 py-1 text-xs border rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ))}
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAddFilter}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Filter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                {sorting.length > 0 ? `${sorting.length} Sorts` : 'Sort'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Sort Orders</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sorting.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No sorting applied
                </div>
              ) : (
                sorting.map((sort, index) => (
                  <DropdownMenuItem key={index} className="flex justify-between">
                    <span className="text-xs">{sort.column || 'Column'} {sort.direction === 'asc' ? '↑' : '↓'}</span>
                    <button 
                      onClick={() => handleRemoveSort(index)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ×
                    </button>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAddSort}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Sort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Group
          </button>
          
          <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Share view
          </button>
          
          <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h16M7 21v-4a2 2 0 012-2h14" />
            </svg>
            Color
          </button>
          
          <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
            Hide Fields
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Properties
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              {/* Heights Section */}
              <DropdownMenuLabel>Heights</DropdownMenuLabel>
              <div className="px-3 py-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Row Height</span>
                  <select
                    value={rowHeight}
                    onChange={(e) => $rowHeight.set(Number(e.target.value))}
                    className="px-2 py-1 text-sm border rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="24">24px</option>
                    <option value="32">32px</option>
                    <option value="40">40px</option>
                    <option value="48">48px</option>
                    <option value="56">56px</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Header Height</span>
                  <select
                    value={headerRowHeight}
                    onChange={(e) => $headerRowHeight.set(Number(e.target.value))}
                    className="px-2 py-1 text-sm border rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="24">24px</option>
                    <option value="32">32px</option>
                    <option value="40">40px</option>
                    <option value="48">48px</option>
                    <option value="56">56px</option>
                  </select>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Font Sizes Section */}
              <DropdownMenuLabel>Font Sizes</DropdownMenuLabel>
              <div className="px-3 py-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cell Font</span>
                  <select
                    value={fontSize}
                    onChange={(e) => $fontSize.set(Number(e.target.value))}
                    className="px-2 py-1 text-sm border rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="10">10px</option>
                    <option value="12">12px</option>
                    <option value="13">13px</option>
                    <option value="14">14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                    <option value="20">20px</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Header Font</span>
                  <select
                    value={headerFontSize}
                    onChange={(e) => $headerFontSize.set(Number(e.target.value))}
                    className="px-2 py-1 text-sm border rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="10">10px</option>
                    <option value="12">12px</option>
                    <option value="13">13px</option>
                    <option value="14">14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                    <option value="20">20px</option>
                  </select>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Text Colors Section */}
              <DropdownMenuLabel>Text Colors</DropdownMenuLabel>
              <div className="px-3 py-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cell Color</span>
                  <input
                    type="color"
                    value={cellTextColor}
                    onChange={(e) => $cellTextColor.set(e.target.value)}
                    className="w-10 h-8 cursor-pointer border rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Header Color</span>
                  <input
                    type="color"
                    value={headerTextColor}
                    onChange={(e) => $headerTextColor.set(e.target.value)}
                    className="w-10 h-8 cursor-pointer border rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
      </div>
    </div>
  );
}