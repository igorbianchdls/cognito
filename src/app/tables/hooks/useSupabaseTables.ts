import { useState, useEffect } from 'react';
import { fetchSupabaseTable } from '@/data/supabaseDatasets';

export interface UseSupabaseTablesReturn {
  data: Array<Record<string, unknown>>;
  loading: boolean;
  error: string | null;
  rowCount: number;
}

export function useSupabaseTables(tableName: string): UseSupabaseTablesReturn {
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [tableName]);

  return {
    data,
    loading,
    error,
    rowCount: data.length
  };
}
