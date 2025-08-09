'use client';

import { useState } from 'react';

interface Schema {
  name: string;
  type: string;
  mode: string;
}

interface QueryResult {
  data: Record<string, unknown>[];
  totalRows: number;
  schema: Schema[];
  executionTime: number;
  bytesProcessed?: number;
}

interface BigQueryTableDataProps {
  data?: QueryResult;
  executionTime?: number;
  query?: string;
  success?: boolean;
  error?: string;
}

export default function BigQueryTableData({
  data,
  executionTime: toolExecutionTime,
  query,
  success,
  error
}: BigQueryTableDataProps) {
  const [activeTab, setActiveTab] = useState<'table' | 'sql'>('table');
  console.log('🎨 ===== BigQueryTableData COMPONENT CALLED =====');
  
  // 🔍 DEBUG: Log do que o componente recebeu
  console.log('🎨 BigQueryTableData component received:', {
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    success,
    error,
    query,
    toolExecutionTime,
    dataStructure: data ? {
      hasDataProperty: 'data' in data,
      dataType: typeof data.data,
      dataLength: Array.isArray(data.data) ? data.data.length : 'not array',
      hasTotalRows: 'totalRows' in data,
      totalRows: data.totalRows,
      hasSchema: 'schema' in data,
      schemaLength: Array.isArray(data.schema) ? data.schema.length : 'not array'
    } : null
  });
  
  // Log sample dos dados se existirem
  if (data && data.data) {
    console.log('🎨 data.data type:', typeof data.data);
    console.log('🎨 data.data isArray:', Array.isArray(data.data));
    console.log('🎨 data.data keys:', Object.keys(data.data).slice(0, 5));
    
    if (Array.isArray(data.data) && data.data.length > 0) {
      console.log('🎨 Sample data (first row):', data.data[0]);
    } else if (typeof data.data === 'object') {
      console.log('🎨 Sample data (first entry):', Object.entries(data.data)[0]);
    }
    console.log('🎨 Schema info:', data.schema?.slice(0, 3));
  }
  if (error || !success) {
    return (
      <div className="my-4 p-4 border-2 border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 13.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao executar query</h3>
        </div>
        <p className="text-sm text-red-700 mb-2">{error || 'Falha desconhecida'}</p>
        {query && (
          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
            <div className="text-xs text-red-600 font-medium mb-1">Query executada:</div>
            <code className="text-xs text-red-800 font-mono break-all">{query}</code>
          </div>
        )}
      </div>
    );
  }

  // Verificar se temos dados (pode ser array ou objeto)
  const hasValidData = data && data.data && (
    (Array.isArray(data.data) && data.data.length > 0) ||
    (typeof data.data === 'object' && Object.keys(data.data).length > 0)
  );

  if (!hasValidData) {
    return (
      <div className="my-4 p-4 border-2 border-gray-200 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="font-semibold text-gray-700">Nenhum resultado encontrado</h3>
        </div>
        <p className="text-sm text-gray-600">A query não retornou dados.</p>
        {query && (
          <div className="mt-3 p-2 bg-gray-100 border border-gray-300 rounded">
            <div className="text-xs text-gray-600 font-medium mb-1">Query executada:</div>
            <code className="text-xs text-gray-700 font-mono break-all">{query}</code>
          </div>
        )}
      </div>
    );
  }

  // Extract values from data structure and normalize to array
  let actualData: Record<string, unknown>[] = [];
  
  if (Array.isArray(data.data)) {
    actualData = data.data;
    console.log('🎨 Using data.data as array:', actualData.length, 'rows');
  } else if (typeof data.data === 'object' && data.data !== null) {
    // Convert object to array (assuming it's keyed by index or similar)
    actualData = Object.values(data.data) as Record<string, unknown>[];
    console.log('🎨 Converted object to array:', actualData.length, 'rows');
  }
  
  const totalRows = data.totalRows;
  const schema = data.schema;
  const executionTime = toolExecutionTime || data.executionTime;
  const bytesProcessed = data.bytesProcessed;
  
  console.log('🎨 Final actualData:', {
    isArray: Array.isArray(actualData),
    length: actualData.length,
    firstRowKeys: actualData[0] ? Object.keys(actualData[0]).slice(0, 5) : []
  });

  // Get column names from first row or schema
  const columns = (schema?.length > 0) 
    ? schema.map(s => s.name) 
    : Object.keys(actualData[0] || {});
  
  console.log('🎨 Columns extraction:', {
    hasSchema: !!schema,
    schemaLength: schema?.length,
    schemaColumns: schema?.map(s => s.name),
    firstRowKeys: Object.keys(actualData[0] || {}),
    finalColumns: columns,
    columnsCount: columns.length
  });

  // Format values for display
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'NULL';
    
    // Handle different data types
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') {
      // Format large numbers with commas
      return value.toLocaleString('pt-BR');
    }
    if (typeof value === 'string') {
      // Truncate very long strings
      if (value.length > 100) {
        return value.substring(0, 97) + '...';
      }
      return value;
    }
    if (value instanceof Date) {
      return value.toLocaleString('pt-BR');
    }
    
    // For objects/arrays, show JSON
    return JSON.stringify(value);
  };

  // Format bytes
  const formatBytes = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  console.log('🎨 About to render table:', {
    hasActualData: actualData.length > 0,
    columnsCount: columns.length,
    willRender: actualData.length > 0 && columns.length > 0,
    componentWillReturn: 'BigQueryTableData main component'
  });

  console.log('🎨 RENDERING TABLE NOW!');
  
  return (
    <div className="my-4 p-4 border-2 border-green-200 bg-green-50 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
        <div>
          <h3 className="text-lg font-semibold text-green-800">Resultados da Query</h3>
          <div className="flex flex-wrap gap-4 text-sm text-green-600 mt-1">
            <span>📊 {actualData.length} linha{actualData.length !== 1 ? 's' : ''} retornada{actualData.length !== 1 ? 's' : ''}</span>
            {totalRows && totalRows !== actualData.length && (
              <span>📈 {totalRows.toLocaleString('pt-BR')} linha{totalRows !== 1 ? 's' : ''} total</span>
            )}
            {executionTime && (
              <span>⏱️ {executionTime}ms</span>
            )}
            {bytesProcessed && (
              <span>💾 {formatBytes(bytesProcessed)} processados</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-green-300 mb-4">
        <button
          onClick={() => setActiveTab('table')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'table'
              ? 'text-green-700 border-b-2 border-green-500 bg-green-50'
              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
          }`}
        >
          📊 Tabela
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'sql'
              ? 'text-green-700 border-b-2 border-green-500 bg-green-50'
              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
          }`}
        >
          💾 SQL
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'table' && (
        <div className="bg-white border border-green-300 rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200">
                    #
                  </th>
                  {columns.map((column) => {
                    const schemaInfo = schema?.find(s => s.name === column);
                    return (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 last:border-r-0"
                      >
                        <div>
                          <div>{column.replace(/_/g, ' ')}</div>
                          {schemaInfo && (
                            <div className="text-xs text-gray-400 normal-case font-normal mt-1">
                              {schemaInfo.type}{schemaInfo.mode === 'REPEATED' ? '[]' : ''}
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {actualData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-3 text-xs text-gray-400 border-r border-gray-200 font-mono">
                      {rowIndex + 1}
                    </td>
                    {columns.map((column) => {
                      const value = row[column];
                      return (
                        <td
                          key={column}
                          className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 max-w-xs"
                        >
                          <div className="truncate" title={String(value || '')}>
                            {formatValue(value)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sql' && query && (
        <div className="bg-white border border-green-300 rounded-lg overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-sm font-medium text-green-700">🔍 Query SQL Executada</h4>
              <button
                onClick={() => navigator.clipboard.writeText(query)}
                className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                title="Copiar SQL"
              >
                📋 Copiar
              </button>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap leading-relaxed">
                {query}
              </pre>
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {executionTime && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">⏱️ Tempo:</span>
                  <span className="font-medium text-green-700">{executionTime}ms</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="text-gray-500">📊 Linhas:</span>
                <span className="font-medium text-green-700">{actualData.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">📋 Colunas:</span>
                <span className="font-medium text-green-700">{columns.length}</span>
              </div>
              {bytesProcessed && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">💾 Dados:</span>
                  <span className="font-medium text-green-700">{formatBytes(bytesProcessed)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-green-700">
            <div className="font-medium mb-1">💡 Informações dos dados:</div>
            <div className="space-y-1">
              <div>• <strong>Colunas:</strong> {columns.length}</div>
              <div>• <strong>Tipos:</strong> {schema?.map(s => `${s.name}(${s.type})`).join(', ') || 'Variados'}</div>
              {actualData.length >= 20 && (
                <div>• <strong>Limitado:</strong> Mostrando primeiros {actualData.length} resultados</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}