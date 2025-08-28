'use client';

import { useMemo, useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader, TableData } from '@/components/widgets/Table';
import { Button } from '@/components/ui/button';
import SQLEditor from '../sql-editor/SQLEditor';

interface SQLExecutionProps {
  sqlQuery?: string;
  datasetId?: string;
  queryType?: string;
  dryRun?: boolean;
  data?: Array<Record<string, unknown>>;
  schema?: Array<{
    name: string;
    type: string;
    mode: string;
  }>;
  rowsReturned?: number;
  rowsAffected?: number;
  totalRows?: number;
  executionTime?: number;
  bytesProcessed?: number;
  success?: boolean;
  validationErrors?: string[];
  error?: string;
  onAnalyzeWithAI?: (data: Array<Record<string, unknown>>, query: string) => void;
}

export default function SQLExecution({
  sqlQuery,
  datasetId,
  queryType,
  dryRun,
  data,
  schema,
  rowsReturned,
  rowsAffected,
  totalRows,
  executionTime,
  bytesProcessed,
  success,
  validationErrors,
  error,
  onAnalyzeWithAI
}: SQLExecutionProps) {
  
  // Local state to store analysis data
  const [analysisData, setAnalysisData] = useState<{
    data: Array<Record<string, unknown>>;
    sqlQuery: string;
    timestamp: string;
  } | null>(null);

  // Save data to local state when component renders with data
  useEffect(() => {
    console.log('🔧 SQLExecution: useEffect triggered with data:', data?.length, 'rows');
    
    if (data && data.length > 0) {
      const newAnalysisData = {
        data,
        sqlQuery: sqlQuery || 'Query executada',
        timestamp: new Date().toISOString(),
      };
      
      console.log('🔧 SQLExecution: Saving data to LOCAL STATE:', data.length, 'rows');
      console.log('🔧 SQLExecution: Analysis data being saved:', {
        rowCount: newAnalysisData.data.length,
        query: newAnalysisData.sqlQuery,
        timestamp: newAnalysisData.timestamp
      });
      
      setAnalysisData(newAnalysisData);
      console.log('🔧 SQLExecution: Data successfully saved to local state');
    } else {
      console.log('🔧 SQLExecution: No data to save (data is empty or null)');
    }
  }, [data, sqlQuery]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('🔧 SQLExecution: analysisData state changed:', analysisData ? analysisData.data.length : 'null', 'rows');
  }, [analysisData]);

  // Handle analyze button click
  const handleAnalyzeData = () => {
    console.log('📊 SQLExecution: Analyze button clicked');
    console.log('📊 SQLExecution: Checking local state - analysisData:', analysisData);
    
    if (analysisData) {
      console.log('📊 SQLExecution: Found data in local state:', analysisData.data.length, 'rows');
      console.log('📊 SQLExecution: Sending data via postMessage...');
      
      // Send data to parent window via postMessage
      window.postMessage({
        type: 'ANALYZE_DATA',
        data: analysisData.data,
        query: analysisData.sqlQuery,
        timestamp: analysisData.timestamp
      }, '*');
      
      console.log('📊 SQLExecution: PostMessage sent successfully');
    } else {
      console.warn('⚠️ SQLExecution: No analysis data found in local state');
    }
  };

  // Generate columns dynamically based on schema
  const columns: ColumnDef<TableData>[] = useMemo(() => {
    if (schema && schema.length > 0) {
      return schema.map((col) => ({
        accessorKey: col.name,
        header: createSortableHeader(col.name),
        cell: ({ row }) => {
          const value = row.getValue(col.name);
          return (
            <span className="whitespace-nowrap text-sm">
              {value !== null && value !== undefined
                ? String(value)
                : <span className="text-gray-400">NULL</span>
              }
            </span>
          );
        },
      }));
    }
    return [];
  }, [schema]);
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro na execução SQL</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getQueryTypeColor = () => {
    switch (queryType?.toLowerCase()) {
      case 'select': return 'from-blue-50 to-cyan-50 text-blue-600';
      case 'insert': return 'from-green-50 to-emerald-50 text-green-600';
      case 'update': return 'from-orange-50 to-yellow-50 text-orange-600';
      case 'delete': return 'from-red-50 to-pink-50 text-red-600';
      default: return 'from-gray-50 to-slate-50 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* SQL Query */}
      <div>
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Query SQL
        </h4>
        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono">
          {sqlQuery}
        </pre>
      </div>

      {/* Validation Errors */}
      {validationErrors && validationErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Avisos de Validação
          </h4>
          <ul className="space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                <span>•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Execution Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Linhas Retornadas</div>
          <div className="text-lg font-semibold text-gray-900">{rowsReturned?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Linhas Afetadas</div>
          <div className="text-lg font-semibold text-gray-900">{rowsAffected?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Tempo de Execução</div>
          <div className="text-lg font-semibold text-gray-900">{executionTime}ms</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Bytes Processados</div>
          <div className="text-lg font-semibold text-gray-900">{bytesProcessed ? formatBytes(bytesProcessed) : '0 B'}</div>
        </div>
      </div>

      {/* Hide original results table when data is empty - SQLEditor will handle execution */}
      {data && data.length > 0 && (
        <div>
          {/* Schema info display */}
          {schema && schema.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {schema.map((col, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {col.name}
                    <span className="ml-1 opacity-75">
                      ({col.type} {col.mode !== 'NULLABLE' && `- ${col.mode}`})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <DataTable
            columns={columns}
            data={(data || []) as TableData[]}
            searchPlaceholder="Filtrar resultados..."
            pageSize={15}
          />
          
          {/* Análise com IA button - sempre visível para debug */}
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleAnalyzeData}
              disabled={!data || data.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              📊 Analisar com IA
            </Button>
          </div>
        </div>
      )}

      {/* SQLEditor - Main execution */}
      <div className="mt-4">
        <div className="text-sm font-medium mb-2">📊 Executar Query:</div>
        <SQLEditor 
          initialSQL={sqlQuery || ''}
          height="200px"
          immediateExecute={true}
          readOnly={false}
          onAnalyzeWithAI={onAnalyzeWithAI}
        />
      </div>
    </div>
  );
}