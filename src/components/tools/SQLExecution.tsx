'use client';

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
  error
}: SQLExecutionProps) {
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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getQueryTypeColor().split(' ').slice(0, 2).join(' ')} px-4 py-3 border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg className={`w-5 h-5 ${getQueryTypeColor().split(' ')[2]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Execução SQL {dryRun && '(Dry Run)'}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="uppercase font-mono">{queryType}</span>
            {executionTime && <span>• {executionTime}ms</span>}
          </div>
        </div>
        <div className="mt-1 text-sm text-gray-600">
          Dataset: {datasetId}
        </div>
      </div>

      <div className="p-4 space-y-4">
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

        {/* Results Table */}
        {data && data.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              Resultados ({data.length} de {totalRows?.toLocaleString()})
            </h4>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {schema?.map((column, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          <div className="flex flex-col">
                            <span>{column.name}</span>
                            <span className="text-xs text-gray-400 normal-case">
                              {column.type} {column.mode !== 'NULLABLE' && `(${column.mode})`}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {schema?.map((column, colIndex) => (
                          <td key={colIndex} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {row[column.name] !== null && row[column.name] !== undefined
                              ? String(row[column.name])
                              : <span className="text-gray-400">NULL</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {(!data || data.length === 0) && queryType === 'SELECT' && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Nenhum resultado retornado</p>
          </div>
        )}
      </div>
    </div>
  );
}