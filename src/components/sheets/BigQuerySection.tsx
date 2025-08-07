'use client';

import { useState } from 'react';
import { useBigQuerySidebar } from '@/hooks/useBigQuerySidebar';
import { createBigQueryDataset, formatRowCount, getTableIconPath } from '@/utils/bigQueryUtils';

interface BigQuerySectionProps {
  onDatasetLoad?: (dataset: ReturnType<typeof createBigQueryDataset>) => void;
  className?: string;
}

interface BigQueryTable {
  datasetId: string;
  tableId: string;
  projectId?: string;
  description?: string;
  numRows?: number;
  numBytes?: number;
  creationTime?: Date;
  lastModifiedTime?: Date;
  // Support for different API response formats
  DATASETID?: string;
  TABLEID?: string;
  NUMROWS?: number;
  NUMBYTES?: number;
}

export default function BigQuerySection({ onDatasetLoad, className = '' }: BigQuerySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const bigQuery = useBigQuerySidebar('biquery_data');

  // Handle table selection and dataset creation
  const handleTableSelect = async (table: BigQueryTable) => {
    // Support both API response formats
    const tableId = table.TABLEID || table.tableId || '';
    
    if (!tableId) {
      console.error('No table ID found');
      return;
    }

    try {
      console.log(`🔄 Loading BigQuery table: ${tableId}`);
      
      // Load table data using the specialized hook
      const tableData = await bigQuery.selectTable(tableId);
      
      if (tableData && tableData.length > 0) {
        // Create dataset for AG Grid
        const newDataset = createBigQueryDataset(tableId, tableData);
        
        // Notify parent component (DatasetsSidebar)
        if (onDatasetLoad) {
          onDatasetLoad(newDataset);
        }
        
        console.log(`✅ BigQuery table loaded: ${newDataset.name} (${newDataset.rows} rows, ${newDataset.columns} columns)`);
      }
    } catch (error) {
      console.error('Error loading BigQuery table:', error);
    }
  };

  return (
    <div className={`px-2 py-2 ${className}`}>
      {/* Section Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-[#5e6c84] hover:text-[#172b4d] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[#8993a4]">BIGQUERY</span>
          <span className="text-[#8993a4] bg-[#f4f5f7] px-1.5 py-0.5 rounded text-xs">
            {bigQuery.tablesData?.length || 0}
          </span>
          {bigQuery.datasetLocation && (
            <span className="text-[#1976d2] bg-[#e3f2fd] px-1.5 py-0.5 rounded text-xs font-mono">
              {bigQuery.datasetLocation}
            </span>
          )}
        </div>
        <svg 
          className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="mt-1 space-y-1">
          {/* Load Tables Button */}
          <button
            onClick={() => bigQuery.loadTables()}
            disabled={bigQuery.tablesLoading || bigQuery.isLoadingLocation}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#8993a4] hover:text-[#172b4d] hover:bg-[#f4f5f7] rounded transition-colors disabled:opacity-50"
          >
            {bigQuery.tablesLoading || bigQuery.isLoadingLocation ? (
              <>
                <div className="w-3 h-3 border border-[#0052cc] border-t-transparent rounded-full animate-spin"></div>
                <span>
                  {bigQuery.isLoadingLocation ? 'Detecting location...' : 'Loading tables...'}
                </span>
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

          {/* Location Detection Status */}
          {bigQuery.datasetLocation && (
            <div className="px-2 py-1 text-xs text-[#1976d2] bg-[#e3f2fd] rounded">
              📍 Location: {bigQuery.datasetLocation}
            </div>
          )}

          {/* Error Messages */}
          {(bigQuery.error || bigQuery.tablesError) && (
            <div className="px-2 py-1.5 text-xs text-red-500 bg-red-50 rounded border border-red-200">
              ❌ {bigQuery.error || bigQuery.tablesError}
            </div>
          )}

          {/* Tables List */}
          {bigQuery.tablesData && Array.isArray(bigQuery.tablesData) && bigQuery.tablesData.length > 0 ? (
            bigQuery.tablesData.map((tableData) => {
              const table = tableData as unknown as BigQueryTable;
              // Support both API response formats
              const tableId = table.TABLEID || table.tableId || '';
              const numRows = table.NUMROWS || table.numRows;
              const isLoadingThis = bigQuery.isLoadingTableData && bigQuery.selectedTable === tableId;
              
              return (
                <div
                  key={tableId}
                  onClick={() => handleTableSelect(table)}
                  className={`
                    group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all
                    text-[#172b4d] hover:bg-[#e3f2fd]
                    ${isLoadingThis ? 'opacity-50 bg-[#f0f8ff]' : ''}
                  `}
                >
                  <span className="text-[#1976d2]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getTableIconPath()} />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-[#1565c0]">
                      {tableId}
                    </div>
                    {numRows && (
                      <div className="text-xs text-[#8993a4]">
                        {formatRowCount(numRows)} rows
                      </div>
                    )}
                    {table.description && (
                      <div className="text-xs text-[#6c757d] truncate">
                        {table.description}
                      </div>
                    )}
                  </div>
                  
                  {/* Loading Indicator */}
                  {isLoadingThis && (
                    <div className="w-3 h-3 border border-[#1976d2] border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              );
            })
          ) : bigQuery.tablesData && bigQuery.tablesData.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-[#8993a4]">
              No tables found in biquery_data
            </div>
          ) : null}

          {/* Debug Information */}
          {process.env.NODE_ENV === 'development' && bigQuery.datasetLocation && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-[#8993a4] px-2 py-1 hover:text-[#172b4d]">
                🔧 Debug Info
              </summary>
              <div className="mt-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                <div>Location: {bigQuery.datasetLocation}</div>
                <div>Location Detected: {bigQuery.locationDetected ? '✅' : '❌'}</div>
                <div>Selected Table: {bigQuery.selectedTable || 'None'}</div>
                <div>Tables Count: {bigQuery.tablesData?.length || 0}</div>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}