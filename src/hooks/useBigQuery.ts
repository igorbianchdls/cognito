'use client';

import { useState, useCallback } from 'react';

interface BigQueryResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

interface UseBigQueryResult<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for BigQuery data fetching - similar to CUBE.js hooks
 * 
 * @example
 * // Basic connection test
 * const { data, loading, error, execute } = useBigQuery('/api/bigquery-simple');
 * 
 * // List datasets
 * const datasets = useBigQuery('/api/bigquery-simple?action=datasets', { immediate: true });
 * 
 * // Custom query
 * const queryResult = useBigQuery('/api/bigquery-simple', {
 *   method: 'POST',
 *   body: { action: 'execute', query: 'SELECT * FROM `project.dataset.table` LIMIT 10' }
 * });
 */
export function useBigQuery<T = unknown>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST';
    body?: Record<string, unknown> | null;
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  } = {}
): UseBigQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const requestOptions: RequestInit = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (options.body && options.method === 'POST') {
        requestOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(endpoint, requestOptions);
      const result: BigQueryResponse<T> = await response.json();
      
      if (result.success) {
        setData(result.data || result as T);
        options.onSuccess?.(result.data || result as T);
      } else {
        const errorMsg = result.error || result.message || 'Unknown error occurred';
        setError(errorMsg);
        options.onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMsg);
      options.onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  // Execute immediately if requested
  useState(() => {
    if (options.immediate) {
      execute();
    }
  });

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
  };
}

/**
 * Hook specifically for BigQuery datasets
 */
export function useBigQueryDatasets() {
  return useBigQuery<Array<{
    id: string;
    friendlyName?: string;
    description?: string;
    location?: string;
    creationTime?: string;
  }>>('/api/bigquery?action=datasets');
}

/**
 * Hook for BigQuery connection test
 */
export function useBigQueryConnection() {
  return useBigQuery<{
    query_executed?: string;
    results?: Record<string, unknown>[];
  }>('/api/bigquery/test');
}

/**
 * Hook for custom BigQuery queries
 */
export function useBigQueryQuery(query: string, parameters?: Record<string, unknown>) {
  return useBigQuery('/api/bigquery', {
    method: 'POST',
    body: {
      action: 'execute',
      query,
      parameters,
    },
  });
}

/**
 * Utility functions for common BigQuery operations
 */
export const bigQueryUtils = {
  /**
   * Build table reference string
   */
  buildTableRef(projectId: string, datasetId: string, tableId: string): string {
    return `\`${projectId}.${datasetId}.${tableId}\``;
  },

  /**
   * Build simple SELECT query
   */
  buildSelectQuery(
    table: string,
    options: {
      columns?: string[];
      where?: string;
      orderBy?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): string {
    const {
      columns = ['*'],
      where,
      orderBy,
      limit,
      offset
    } = options;

    let query = `SELECT ${columns.join(', ')} FROM ${table}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    if (offset) {
      query += ` OFFSET ${offset}`;
    }

    return query;
  },

  /**
   * Build aggregation query
   */
  buildAggregationQuery(
    table: string,
    options: {
      groupBy: string[];
      aggregations: { column: string; func: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'; alias?: string }[];
      where?: string;
      having?: string;
      orderBy?: string;
      limit?: number;
    }
  ): string {
    const { groupBy, aggregations, where, having, orderBy, limit } = options;

    const selectColumns = [
      ...groupBy,
      ...aggregations.map(agg => 
        `${agg.func}(${agg.column})${agg.alias ? ` AS ${agg.alias}` : ''}`
      )
    ];

    let query = `SELECT ${selectColumns.join(', ')} FROM ${table}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    query += ` GROUP BY ${groupBy.join(', ')}`;
    
    if (having) {
      query += ` HAVING ${having}`;
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    return query;
  }
};