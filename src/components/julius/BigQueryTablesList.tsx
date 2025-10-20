'use client';

interface Table {
  DATASETID?: string;
  TABLEID?: string;
  PROJECTID?: string;
  NUMROWS?: number;
  NUMBYTES?: number;
  CREATIONTIME?: string;
  // Legacy format support
  datasetId?: string;
  tableId?: string;
  projectId?: string;
  description?: string;
  numRows?: number;
  numBytes?: number;
  creationTime?: Date;
  lastModifiedTime?: Date;
}

interface BigQueryTablesListProps {
  tables?: Table[];
  datasetId: string;
  success?: boolean;
  error?: string;
}

export default function BigQueryTablesList({ tables, datasetId, success, error }: BigQueryTablesListProps) {
  if (error || !success) {
    return (
      <div className="my-4 p-4 border-2 border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 13.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao carregar tabelas</h3>
        </div>
        <p className="text-sm text-red-700 mb-2">{error || 'Falha desconhecida'}</p>
        <p className="text-xs text-red-600">Dataset: <code>{datasetId}</code></p>
      </div>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <div className="my-4 p-4 border-2 border-gray-200 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="font-semibold text-gray-700">Nenhuma tabela encontrada</h3>
        </div>
        <p className="text-sm text-gray-600">
          O dataset <code className="bg-gray-200 px-1 rounded">{datasetId}</code> não contém tabelas ou está vazio.
        </p>
      </div>
    );
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A';
    return num.toLocaleString('pt-BR');
  };

  return (
    <div className="my-4 p-4 border-2 border-purple-200 bg-purple-50 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div>
          <h3 className="text-lg font-semibold text-purple-800">
            Tabelas do Dataset ({tables.length})
          </h3>
          <p className="text-sm text-purple-600">
            Dataset: <code className="bg-purple-100 px-1 rounded">{datasetId}</code>
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {tables.map((table, index) => {
          // Support both API response formats
          const tableId = table.TABLEID || table.tableId || '';
          const numRows = table.NUMROWS || table.numRows;
          const numBytes = table.NUMBYTES || table.numBytes;
          const creationTime = table.CREATIONTIME || table.creationTime;

          return (
            <div
              key={tableId || index}
              className="bg-white p-4 border border-purple-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-mono bg-purple-100 px-2 py-1 rounded text-purple-800 font-semibold">
                      {tableId}
                    </code>
                    <div className="flex items-center gap-2">
                      {numRows !== undefined && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          {formatNumber(numRows)} linhas
                        </span>
                      )}
                      {numBytes !== undefined && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z" />
                          </svg>
                          {formatBytes(numBytes)}
                        </span>
                      )}
                    </div>
                  </div>

                  {table.description && (
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                      {table.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    {creationTime && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                        Criado: {
                          typeof creationTime === 'string' 
                            ? new Date(creationTime).toLocaleString('pt-BR')
                            : creationTime instanceof Date 
                              ? creationTime.toLocaleString('pt-BR')
                              : 'N/A'
                        }
                      </div>
                    )}
                    {table.lastModifiedTime && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Modificado: {table.lastModifiedTime.toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-4">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-purple-100 border border-purple-300 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-purple-700">
            <strong>💡 Dica:</strong> Essas são as tabelas disponíveis no dataset 
            <code className="bg-purple-200 px-1 rounded mx-1">{datasetId}</code>. 
            Você pode fazer queries SQL nelas ou pedir para analisar dados específicos.
          </div>
        </div>
      </div>
    </div>
  );
}