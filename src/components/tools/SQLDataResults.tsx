'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/widgets/Table';

interface SQLDataResultsProps {
  sqlQuery?: string;
  explicacao?: string;
  queryType?: string;
  data?: Record<string, unknown>[];
  rowsReturned?: number;
  executionTime?: number;
  success?: boolean;
  error?: string;
}

function formatExecutionTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}

// Generate dynamic columns based on data keys
function generateColumns(data: Record<string, unknown>[]): ColumnDef<Record<string, unknown>>[] {
  if (!data || data.length === 0) return [];

  const firstRow = data[0];
  const keys = Object.keys(firstRow);

  return keys.map((key) => ({
    accessorKey: key,
    header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    cell: ({ row }) => {
      const value = row.getValue(key);

      // Handle different data types
      if (value === null || value === undefined) return '-';
      if (typeof value === 'number') return formatNumber(value);
      if (typeof value === 'boolean') return value ? 'Sim' : 'Não';

      // For strings, truncate if too long
      const stringValue = String(value);
      return stringValue.length > 50
        ? <span title={stringValue}>{stringValue.substring(0, 47)}...</span>
        : stringValue;
    },
  }));
}

export default function SQLDataResults({
  sqlQuery,
  explicacao,
  queryType,
  data = [],
  rowsReturned,
  executionTime,
  success = true,
  error
}: SQLDataResultsProps) {

  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro na execução da query</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
        {sqlQuery && (
          <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-800 font-mono">
            {sqlQuery}
          </div>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-yellow-800">Nenhum resultado encontrado</h3>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          A query foi executada com sucesso, mas não retornou dados.
        </p>
        {sqlQuery && (
          <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800 font-mono">
            {sqlQuery}
          </div>
        )}
      </div>
    );
  }

  const columns = generateColumns(data);

  // Retorna apenas a tabela (header será renderizado fora do artifact)
  return (
    <DataTable
      columns={columns as never}
      data={data as never}
      searchPlaceholder="Filtrar resultados..."
      pageSize={10}
    />
  );
}