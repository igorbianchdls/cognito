'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { ColDef, ICellRendererParams, ValueFormatterParams, CellClassParams } from 'ag-grid-community';
import { 
  availableDatasetsStore, 
  activeDatasetIdStore, 
  sheetDataStore, 
  isSheetLoadingStore,
  switchToDataset,
  initializeDefaultDataset,
  addDataset,
  removeDataset
} from '@/stores/sheetsStore';
import { DatasetInfo } from '@/data/mockDatasets';
import { CSVImportPlugin } from './CSVImportPlugin';
import { useBigQueryTables, useBigQueryTableData } from '@/hooks/useBigQuery';

interface DatasetsSidebarProps {
  className?: string;
}

export default function DatasetsSidebar({ className = '' }: DatasetsSidebarProps) {
  const datasets = useStore(availableDatasetsStore);
  const activeDatasetId = useStore(activeDatasetIdStore);
  const sheetData = useStore(sheetDataStore);
  const isLoading = useStore(isSheetLoadingStore);
  
  // Initialize CSV import plugin
  const [csvPlugin, setCsvPlugin] = useState<CSVImportPlugin | null>(null);
  const [systemSectionCollapsed, setSystemSectionCollapsed] = useState(false);
  const [importedSectionCollapsed, setImportedSectionCollapsed] = useState(false);
  const [bigquerySectionCollapsed, setBigquerySectionCollapsed] = useState(false);
  const [selectedBigQueryTable, setSelectedBigQueryTable] = useState<string>('');
  
  // BigQuery hooks
  const tablesHook = useBigQueryTables('biquery_data');
  const tableDataHook = useBigQueryTableData('biquery_data', selectedBigQueryTable, 1000) as {
    data: { data?: Record<string, unknown>[] } | null;
    loading: boolean;
    error: string | null;
    execute: () => Promise<void>;
    refetch: () => Promise<void>;
  };

  // Initialize default dataset on component mount
  useEffect(() => {
    initializeDefaultDataset();
    
    // Initialize CSV plugin
    const plugin = new CSVImportPlugin(null);
    setCsvPlugin(plugin);
  }, []);

  // Categorize datasets
  const systemDatasets = datasets.filter(ds => !ds.id.startsWith('imported-'));
  const importedDatasets = datasets.filter(ds => ds.id.startsWith('imported-'));

  // Handle dataset selection
  const handleSelectDataset = (datasetId: string) => {
    if (datasetId !== activeDatasetId && !isLoading) {
      switchToDataset(datasetId);
    }
  };

  // Detect column type from data samples
  const detectColumnType = (key: string, data: Record<string, unknown>[]) => {
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

  // Create intelligent column definitions
  const createBigQueryColumnDefs = (data: Record<string, unknown>[]): ColDef[] => {
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

  // Create BigQuery dataset from table data
  const createBigQueryDataset = (tableId: string, tableData: Record<string, unknown>[]): DatasetInfo => {
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

  // Add dataset to store and activate it
  const addAndActivateBigQueryDataset = (dataset: DatasetInfo) => {
    const currentDatasets = datasets;
    const updatedDatasets = [...currentDatasets, dataset];
    
    availableDatasetsStore.set(updatedDatasets);
    switchToDataset(dataset.id);
    
    console.log(`BigQuery table loaded: ${dataset.name} (${dataset.rows} rows, ${dataset.columns} columns)`);
  };

  // Handle BigQuery table selection
  const handleBigQueryTableSelect = async (tableId: string) => {
    setSelectedBigQueryTable(tableId);
    
    try {
      // Execute the hook to get table data
      await tableDataHook.execute();
      
      // Process data immediately when available
      if (tableDataHook.data?.data && Array.isArray(tableDataHook.data.data)) {
        const tableData = tableDataHook.data.data;
        
        // Create and activate the new dataset
        const newDataset = createBigQueryDataset(tableId, tableData);
        addAndActivateBigQueryDataset(newDataset);
      }
    } catch (error) {
      console.error('Error loading BigQuery table:', error);
    }
  };

  // Handle dataset removal
  const handleRemoveDataset = (datasetId: string) => {
    const dataset = datasets.find(ds => ds.id === datasetId);
    if (dataset && confirm(`Remove "${dataset.name}"?`)) {
      removeDataset(datasetId);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!csvPlugin) return;

    try {
      const csvData = await csvPlugin.triggerFileSelect();
      if (csvData) {
        addDataset({
          headers: csvData.headers,
          rows: csvData.rows,
          fileName: csvData.fileName,
          fileSize: csvData.fileSize,
          rowCount: csvData.rowCount,
          columnCount: csvData.columnCount
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle export (future implementation)
  const _handleExport = () => {
    if (sheetData.rows.length === 0) {
      alert('No data to export');
      return;
    }

    const csvContent = [
      sheetData.headers.join(','),
      ...sheetData.rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data.csv';
    link.click();
  };

  // Get dataset icon
  const getDatasetIcon = (_dataset: DatasetInfo) => {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    );
  };

  // Format numbers (future use)
  const _formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return num.toString();
  };

  return (
    <div className={`flex flex-col h-full bg-[#fafbfc] border-r border-[#dfe1e6] ${className}`}>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* System Datasets Section */}
        {systemDatasets.length > 0 && (
          <div className="px-2 py-2">
            <button
              onClick={() => setSystemSectionCollapsed(!systemSectionCollapsed)}
              className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-[#5e6c84] hover:text-[#172b4d] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[#8993a4]">SYSTEM</span>
                <span className="text-[#8993a4] bg-[#f4f5f7] px-1.5 py-0.5 rounded text-xs">
                  {systemDatasets.length}
                </span>
              </div>
              <svg 
                className={`w-3 h-3 transition-transform ${systemSectionCollapsed ? '-rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {!systemSectionCollapsed && (
              <div className="mt-1 space-y-1">
                {systemDatasets.map((dataset) => {
                  const isActive = dataset.id === activeDatasetId;
                  const isLoadingThis = isLoading && dataset.id === activeDatasetId;
                  
                  return (
                    <div
                      key={dataset.id}
                      onClick={() => handleSelectDataset(dataset.id)}
                      className={`
                        group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all
                        ${isActive 
                          ? 'bg-[#f4f5f7]' 
                          : 'text-[#172b4d] hover:bg-[#f4f5f7]'
                        }
                        ${isLoadingThis ? 'opacity-50' : ''}
                      `}
                    >
                      <span className="text-[#8993a4]">{getDatasetIcon(dataset)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate text-[#172b4d]">
                          {dataset.name}
                        </div>
                      </div>
                      
                      {/* Loading indicator */}
                      {isLoadingThis && (
                        <div className="w-3 h-3 border border-[#0052cc] border-t-transparent rounded-full animate-spin"></div>
                      )}
                      
                      {/* Active indicator */}
                      {isActive && !isLoadingThis && (
                        <div className="w-2 h-2 bg-[#0052cc] rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Imported Datasets Section */}
        <div className="px-2 py-2">
          <button
            onClick={() => setImportedSectionCollapsed(!importedSectionCollapsed)}
            className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-[#5e6c84] hover:text-[#172b4d] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[#8993a4]">IMPORTED</span>
              <span className="text-[#8993a4] bg-[#f4f5f7] px-1.5 py-0.5 rounded text-xs">
                {importedDatasets.length}
              </span>
            </div>
            <svg 
              className={`w-3 h-3 transition-transform ${importedSectionCollapsed ? '-rotate-90' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {!importedSectionCollapsed && (
            <div className="mt-1 space-y-1">
              {importedDatasets.length === 0 ? (
                <div className="px-2 py-3 text-center text-xs text-[#8993a4]">
                  No imported datasets
                </div>
              ) : (
                importedDatasets.map((dataset) => {
                  const isActive = dataset.id === activeDatasetId;
                  const isLoadingThis = isLoading && dataset.id === activeDatasetId;
                  
                  return (
                    <div
                      key={dataset.id}
                      className="group relative"
                    >
                      <div
                        onClick={() => handleSelectDataset(dataset.id)}
                        className={`
                          flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all
                          ${isActive 
                            ? 'bg-[#f4f5f7]' 
                            : 'text-[#172b4d] hover:bg-[#f4f5f7]'
                          }
                          ${isLoadingThis ? 'opacity-50' : ''}
                        `}
                      >
                        <span className="text-[#8993a4]">{getDatasetIcon(dataset)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-[#172b4d]">
                            {dataset.name}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          {!isActive && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDataset(dataset.id);
                              }}
                              className="p-1 hover:bg-red-100 rounded text-xs text-red-500"
                              title="Remove dataset"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                        
                        {/* Loading/Active indicator */}
                        {isLoadingThis ? (
                          <div className="w-3 h-3 border border-[#0052cc] border-t-transparent rounded-full animate-spin"></div>
                        ) : isActive ? (
                          <div className="w-2 h-2 bg-[#0052cc] rounded-full"></div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* BigQuery Section */}
        <div className="px-2 py-2">
          <button
            onClick={() => setBigquerySectionCollapsed(!bigquerySectionCollapsed)}
            className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-[#5e6c84] hover:text-[#172b4d] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[#8993a4]">BIGQUERY</span>
              <span className="text-[#8993a4] bg-[#f4f5f7] px-1.5 py-0.5 rounded text-xs">
                {tablesHook.data?.length || 0}
              </span>
            </div>
            <svg 
              className={`w-3 h-3 transition-transform ${bigquerySectionCollapsed ? '-rotate-90' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {!bigquerySectionCollapsed && (
            <div className="mt-1 space-y-1">
              {/* Load tables button */}
              <button
                onClick={() => tablesHook.execute()}
                disabled={tablesHook.loading}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#8993a4] hover:text-[#172b4d] hover:bg-[#f4f5f7] rounded transition-colors disabled:opacity-50"
              >
                {tablesHook.loading ? (
                  <>
                    <div className="w-3 h-3 border border-[#0052cc] border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading tables...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Load biquery_data tables</span>
                  </>
                )}
              </button>

              {/* Error message */}
              {tablesHook.error && (
                <div className="px-2 py-1.5 text-xs text-red-500">
                  Error: {tablesHook.error}
                </div>
              )}

              {/* Tables list */}
              {tablesHook.data && Array.isArray(tablesHook.data) && tablesHook.data.length > 0 ? (
                tablesHook.data.map((table: {
                  datasetId: string;
                  tableId: string;
                  projectId?: string;
                  description?: string;
                  numRows?: number;
                  numBytes?: number;
                  creationTime?: Date;
                  lastModifiedTime?: Date;
                }) => {
                  const isLoadingThis = tableDataHook.loading && selectedBigQueryTable === table.tableId;
                  
                  return (
                    <div
                      key={table.tableId}
                      onClick={() => handleBigQueryTableSelect(table.tableId)}
                      className={`
                        group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all
                        text-[#172b4d] hover:bg-[#e3f2fd]
                        ${isLoadingThis ? 'opacity-50 bg-[#f0f8ff]' : ''}
                      `}
                    >
                      <span className="text-[#1976d2]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate text-[#1565c0]">
                          {table.tableId}
                        </div>
                        {table.numRows && (
                          <div className="text-xs text-[#8993a4]">
                            {table.numRows.toLocaleString()} rows
                          </div>
                        )}
                      </div>
                      
                      {/* Loading indicator */}
                      {isLoadingThis && (
                        <div className="w-3 h-3 border border-[#1976d2] border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                  );
                })
              ) : tablesHook.data && tablesHook.data.length === 0 ? (
                <div className="px-2 py-3 text-center text-xs text-[#8993a4]">
                  No tables found in biquery_data
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-[#dfe1e6] p-2 bg-[#fafbfc]">
        <button
          onClick={handleImport}
          disabled={isLoading || !csvPlugin}
          className="w-full flex items-center gap-2 px-2 py-2 text-[#8993a4] text-sm font-medium rounded hover:bg-[#f4f5f7] hover:text-[#172b4d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border border-[#8993a4] border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add new...</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}