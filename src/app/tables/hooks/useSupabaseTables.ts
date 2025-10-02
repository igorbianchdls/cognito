import { useState, useEffect, useCallback } from 'react';
import { fetchSupabaseTable } from '@/data/supabaseDatasets';

export interface UseSupabaseTablesReturn {
  data: Array<Record<string, unknown>>;
  loading: boolean;
  error: string | null;
  rowCount: number;
  refetch: () => void;
}

export function useSupabaseTables(tableName: string): UseSupabaseTablesReturn {
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!tableName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchSupabaseTable(tableName)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        setLoading(false);
      });
  }, [tableName, refetchTrigger]);

  return {
    data,
    loading,
    error,
    rowCount: data.length,
    refetch
  };
}
