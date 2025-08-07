import { ColDef, ICellRendererParams, ValueFormatterParams, CellClassParams } from 'ag-grid-community';
import { DatasetInfo } from '@/data/mockDatasets';

/**
 * BigQuery utilities for data processing and AG Grid integration
 */

// Detect column type from data samples
export const detectColumnType = (key: string, data: Record<string, unknown>[]) => {
  const samples = data.slice(0, 10).map(row => row[key]).filter(val => val != null);
  
  if (samples.length === 0) return 'string';
  
  // Check for boolean
  if (samples.every(val => typeof val === 'boolean' || val === 'true' || val === 'false' || val === 1 || val === 0)) {
    return 'boolean';
  }
  
  // Check for number
  if (samples.every(val => !isNaN(Number(val)) && isFinite(Number(val)))) {
    return 'number';
  }
  
  // Check for date
  if (samples.every(val => {
    const dateStr = String(val);
    return !isNaN(Date.parse(dateStr)) && 
           (dateStr.includes('-') || dateStr.includes('/')) &&
           dateStr.length >= 8;
  })) {
    return 'date';
  }
  
  return 'string';
};

// Create intelligent column definitions for AG Grid
export const createBigQueryColumnDefs = (data: Record<string, unknown>[]): ColDef[] => {
  if (!data || data.length === 0) return [];
  
  const keys = Object.keys(data[0] || {});
  
  return keys.map(key => {
    const type = detectColumnType(key, data);
    const headerName = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    
    const baseConfig: ColDef = {
      field: key,
      headerName,
      editable: true,
      sortable: true,
      resizable: true,
      enableRowGroup: type !== 'date',
      width: type === 'boolean' ? 100 : type === 'number' ? 120 : 150
    };
    
    switch (type) {
      case 'number':
        return {
          ...baseConfig,
          filter: 'agNumberColumnFilter',
          enableValue: true,
          aggFunc: key.toLowerCase().includes('id') ? 'count' : 'sum',
          valueFormatter: (params: ValueFormatterParams) => {
            if (params.value == null) return '';
            const num = Number(params.value);
            return key.toLowerCase().includes('price') || key.toLowerCase().includes('valor') 
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
              : new Intl.NumberFormat('pt-BR').format(num);
          },
          cellStyle: { textAlign: 'right' }
        } as ColDef;
        
      case 'boolean':
        return {
          ...baseConfig,
          filter: 'agSetColumnFilter',
          enablePivot: true,
          cellRenderer: (params: ICellRendererParams) => {
            const val = params.value;
            if (val === true || val === 'true' || val === 1) return '✓';
            if (val === false || val === 'false' || val === 0) return '✗';
            return String(val || '');
          },
          cellStyle: (params: CellClassParams) => {
            const val = params.value;
            const baseStyle = { textAlign: 'center' as const };
            if (val === true || val === 'true' || val === 1) {
              return { ...baseStyle, color: '#2e7d32', fontWeight: 'bold' };
            }
            if (val === false || val === 'false' || val === 0) {
              return { ...baseStyle, color: '#c62828', fontWeight: 'bold' };
            }
            return baseStyle;
          }
        } as ColDef;
        
      case 'date':
        return {
          ...baseConfig,
          filter: 'agDateColumnFilter',
          valueFormatter: (params: ValueFormatterParams) => {
            if (!params.value) return '';
            const date = new Date(String(params.value));
            return isNaN(date.getTime()) ? String(params.value) : date.toLocaleDateString('pt-BR');
          }
        } as ColDef;
        
      default: // string
        return {
          ...baseConfig,
          filter: 'agTextColumnFilter',
          enableRowGroup: true,
          enablePivot: true
        } as ColDef;
    }
  });
};

// Create BigQuery dataset for AG Grid integration
export const createBigQueryDataset = (tableId: string, tableData: Record<string, unknown>[]): DatasetInfo => {
  return {
    id: `bigquery-${tableId}`,
    name: `${tableId} (BigQuery)`,
    description: `Dados da tabela ${tableId} do BigQuery`,
    rows: tableData.length,
    columns: Object.keys(tableData[0] || {}).length,
    size: `${(JSON.stringify(tableData).length / 1024).toFixed(1)} KB`,
    type: 'json' as const,
    lastModified: new Date(),
    data: tableData,
    columnDefs: createBigQueryColumnDefs(tableData)
  };
};

// Format table row count for display
export const formatRowCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toLocaleString();
};

// Get table icon SVG path (for use in React components)
export const getTableIconPath = () => "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4";