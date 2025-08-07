'use client';

import { useState, useCallback, useEffect } from 'react';
import { useBigQueryTables } from './useBigQuery';

interface BigQuerySidebarState {
  selectedTable: string;
  datasetLocation: string | null;
  locationDetected: boolean;
  isLoadingLocation: boolean;
  isLoadingTableData: boolean;
  tableData: Record<string, unknown>[] | null;
  error: string | null;
}

interface UseBigQuerySidebarResult extends BigQuerySidebarState {
  // Table management
  loadTables: () => Promise<void>;
  selectTable: (tableId: string) => Promise<Record<string, unknown>[] | null>;
  
  // Location detection
  detectLocation: () => Promise<string | null>;
  
  // Tables data  
  tablesData: Array<Record<string, unknown>> | null;
  tablesLoading: boolean;
  tablesError: string | null;
}

/**
 * Specialized hook for BigQuery integration in sidebar
 * Handles location detection and table data loading
 */
export function useBigQuerySidebar(datasetId: string = 'biquery_data'): UseBigQuerySidebarResult {
  const [state, setState] = useState<BigQuerySidebarState>({
    selectedTable: '',
    datasetLocation: null,
    locationDetected: false,
    isLoadingLocation: false,
    isLoadingTableData: false,
    tableData: null,
    error: null
  });

  // Use tables hook for listing tables
  const tablesHook = useBigQueryTables(datasetId);

  // Detect dataset location
  const detectLocation = useCallback(async (): Promise<string | null> => {
    setState(prev => ({ ...prev, isLoadingLocation: true, error: null }));
    
    try {
      console.log(`🔍 Detecting location for dataset: ${datasetId}`);
      const response = await fetch(`/api/bigquery?action=dataset-info&dataset=${datasetId}`);
      const result = await response.json();
      
      if (result.success && result.data?.location) {
        const location = String(result.data.location);
        console.log(`📍 Dataset location detected: ${location}`);
        
        setState(prev => ({ 
          ...prev, 
          datasetLocation: location,
          locationDetected: true,
          isLoadingLocation: false 
        }));
        
        return location;
      } else {
        throw new Error(result.error || 'Failed to detect location');
      }
    } catch (error) {
      console.error('❌ Error detecting dataset location:', error);
      const errorMsg = error instanceof Error ? error.message : 'Location detection failed';
      
      setState(prev => ({ 
        ...prev, 
        error: errorMsg,
        isLoadingLocation: false 
      }));
      
      return null;
    }
  }, [datasetId]);

  // Load tables with automatic location detection
  const loadTables = useCallback(async () => {
    try {
      // Detect location first if not already detected
      if (!state.locationDetected) {
        const location = await detectLocation();
        if (!location) {
          throw new Error('Could not detect dataset location');
        }
      }
      
      // Load tables
      await tablesHook.execute();
    } catch (error) {
      console.error('❌ Error loading tables:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load tables' 
      }));
    }
  }, [state.locationDetected, detectLocation, tablesHook]);

  // Select table and load data
  const selectTable = useCallback(async (tableId: string): Promise<Record<string, unknown>[] | null> => {
    if (!tableId || tableId.trim() === '') {
      return null;
    }

    setState(prev => ({ 
      ...prev, 
      selectedTable: tableId,
      isLoadingTableData: true,
      error: null,
      tableData: null 
    }));

    try {
      // Ensure location is detected
      let location = state.datasetLocation;
      if (!location) {
        location = await detectLocation();
        if (!location) {
          throw new Error('Could not detect dataset location');
        }
      }

      console.log(`🚗 Loading data for table: ${tableId} in location: ${location}`);
      
      // Execute query with detected location
      const query = `SELECT * FROM \`creatto-463117.${datasetId}.${tableId}\` LIMIT 1000`;
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          query: query,
          location: location // Use detected location
        })
      });

      const result = await response.json();
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const tableData = result.data.data;
        console.log(`✅ Table data loaded: ${tableData.length} rows`);
        
        setState(prev => ({ 
          ...prev, 
          tableData,
          isLoadingTableData: false 
        }));
        
        return tableData;
      } else {
        throw new Error(result.error || 'No data returned from query');
      }
    } catch (error) {
      console.error('❌ Error loading table data:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to load table data';
      
      setState(prev => ({ 
        ...prev, 
        error: errorMsg,
        isLoadingTableData: false 
      }));
      
      return null;
    }
  }, [datasetId, state.datasetLocation, detectLocation]);

  // Auto-detect location on mount
  useEffect(() => {
    if (!state.locationDetected && !state.isLoadingLocation) {
      detectLocation();
    }
  }, [detectLocation, state.locationDetected, state.isLoadingLocation]);

  return {
    // State
    selectedTable: state.selectedTable,
    datasetLocation: state.datasetLocation,
    locationDetected: state.locationDetected,
    isLoadingLocation: state.isLoadingLocation,
    isLoadingTableData: state.isLoadingTableData,
    tableData: state.tableData,
    error: state.error,
    
    // Actions
    loadTables,
    selectTable,
    detectLocation,
    
    // Tables hook data
    tablesData: tablesHook.data,
    tablesLoading: tablesHook.loading,
    tablesError: tablesHook.error
  };
}