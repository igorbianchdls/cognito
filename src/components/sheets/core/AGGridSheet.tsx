'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { ColumnDef } from '@tanstack/react-table';
import { TableSheets, createSortableHeader, type TableData } from './TableSheets';
import { 
  activeDatasetStore, 
  initializeDefaultDataset
} from '@/stores/sheets/sheetsStore';

// Helper function to format values based on column type
const formatValue = (value: unknown, colDef?: { field?: string; enableValue?: boolean; filter?: string }): string => {
  if (value === null || value === undefined) return '';
  
  // Check if it's a number column based on field name or type
  if (colDef?.enableValue && typeof value === 'number') {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  
  // Check if it's a currency column
  if (colDef?.field?.toLowerCase().includes('price') || colDef?.field?.toLowerCase().includes('valor')) {
    const num = Number(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    }
  }
  
  // Check if it's a date column
  if (colDef?.filter === 'agDateColumnFilter') {
    const date = new Date(String(value));
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
  }
  
  // Boolean formatting
  if (typeof value === 'boolean') {
    return value ? '✓' : '✗';
  }
  
  return String(value);
};

interface AGGridSheetProps {
  filters?: { column: string; operator: string; value: string }[];
  sorting?: { column: string; direction: 'asc' | 'desc' }[];
}

export default function AGGridSheet({ filters = [], sorting = [] }: AGGridSheetProps) {
  const [isClient, setIsClient] = useState(false);
  
  // Store subscriptions
  const activeDataset = useStore(activeDatasetStore);
  
  useEffect(() => {
    setIsClient(true);
    // Initialize default dataset if not already loaded
    initializeDefaultDataset();
  }, []);
  
  // Convert AG Grid column definitions to Tanstack React Table format
  const columns: ColumnDef<TableData>[] = useMemo(() => {
    if (!activeDataset?.columnDefs) return [];
    
    return activeDataset.columnDefs.map((colDef) => ({
      accessorKey: colDef.field || '',
      header: createSortableHeader(colDef.headerName || colDef.field || ''),
      cell: ({ row }) => {
        const value = row.getValue(colDef.field || '');
        const isNumberField = colDef.enableValue || 
                             colDef.field?.toLowerCase().includes('price') || 
                             colDef.field?.toLowerCase().includes('valor');
        
        return (
          <span className={isNumberField ? 'text-right' : ''}>
            {formatValue(value, colDef)}
          </span>
        );
      }
    }));
  }, [activeDataset?.columnDefs]);

  // Dynamic row data from store
  const rowData = (activeDataset?.data || []) as TableData[];

  return (
    <div className="w-full h-full">
      {isClient ? (
        <div className="w-full h-full p-0">
          {activeDataset ? (
            <div className="h-full flex flex-col">
              {/* Data Table */}
              <div className="flex-1 min-h-0">
                <TableSheets
                  columns={columns}
                  data={rowData}
                  editable={false}
                  pageSize={50}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dataset selecionado</h3>
                <p className="text-gray-600">Selecione um dataset no painel lateral para visualizar os dados</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando planilha...</p>
          </div>
        </div>
      )}
    </div>
  );
}