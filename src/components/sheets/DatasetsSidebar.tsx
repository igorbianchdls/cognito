'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
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

  // Handle export
  const handleExport = () => {
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
  const getDatasetIcon = (dataset: DatasetInfo) => {
    switch (dataset.type) {
      case 'csv': return '📄';
      case 'json': return '🔗';
      case 'excel': return '📊';
      case 'grid': return '🔢';
      default: return '📁';
    }
  };

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return num.toString();
  };

  return (
    <div className={`flex flex-col h-full bg-[#fafbfc] border-r border-[#dfe1e6] ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#dfe1e6] bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h3 className="text-sm font-medium text-[#172b4d]">Datasets</h3>
            <span className="text-xs text-[#8993a4] bg-[#f4f5f7] px-2 py-0.5 rounded-full">
              {datasets.length}
            </span>
          </div>
          <button className="text-[#8993a4] hover:text-[#172b4d] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        
        {/* Current Dataset Info */}
        {sheetData.totalRows > 0 && (
          <div className="mt-2 p-2 bg-[#e3f2fd] rounded-md">
            <div className="text-xs font-medium text-[#0052cc] mb-1">
              Active: {datasets.find(ds => ds.id === activeDatasetId)?.name}
            </div>
            <div className="flex items-center gap-3 text-xs text-[#172b4d]">
              <span>{formatNumber(sheetData.totalRows)} rows</span>
              <span>•</span>
              <span>{sheetData.totalCols} cols</span>
              <button
                onClick={handleExport}
                className="ml-auto text-[#0052cc] hover:text-[#172b4d] transition-colors"
                title="Export CSV"
              >
                📥
              </button>
            </div>
          </div>
        )}
      </div>

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
                          ? 'bg-[#e3f2fd] border-l-2 border-[#0052cc] text-[#0052cc]' 
                          : 'text-[#172b4d] hover:bg-[#f4f5f7]'
                        }
                        ${isLoadingThis ? 'opacity-50' : ''}
                      `}
                    >
                      <span className="text-sm">{getDatasetIcon(dataset)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {dataset.name}
                        </div>
                        <div className="text-xs text-[#8993a4]">
                          {formatNumber(dataset.rows)} rows • {dataset.columns} cols
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
                            ? 'bg-[#e3f2fd] border-l-2 border-[#0052cc] text-[#0052cc]' 
                            : 'text-[#172b4d] hover:bg-[#f4f5f7]'
                          }
                          ${isLoadingThis ? 'opacity-50' : ''}
                        `}
                      >
                        <span className="text-sm">{getDatasetIcon(dataset)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {dataset.name}
                          </div>
                          <div className="text-xs text-[#8993a4]">
                            {formatNumber(dataset.rows)} rows • {dataset.columns} cols • {dataset.size}
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
      </div>

      {/* Footer Actions */}
      <div className="border-t border-[#dfe1e6] p-3 bg-white">
        <button
          onClick={handleImport}
          disabled={isLoading || !csvPlugin}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#0052cc] text-white text-sm font-medium rounded hover:bg-[#0065ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add new...
            </>
          )}
        </button>
        
        {/* Stats */}
        <div className="mt-2 text-xs text-[#8993a4] text-center">
          Total: {datasets.length} datasets • {datasets.reduce((acc, ds) => acc + ds.rows, 0).toLocaleString()} rows
        </div>
      </div>
    </div>
  );
}