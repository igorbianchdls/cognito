'use client';

interface TableCreationProps {
  datasetId?: string;
  tableName?: string;
  tableId?: string;
  schema?: Array<{
    name: string;
    type: string;
    mode: string;
  }>;
  description?: string;
  location?: string;
  creationTime?: string;
  lastModifiedTime?: string;
  numRows?: number;
  numBytes?: number;
  expirationTime?: string | null;
  labels?: Record<string, string>;
  metadata?: {
    tableType?: string;
    createdBy?: string;
    version?: string;
  };
  success?: boolean;
  error?: string;
}

export default function TableCreation({
  datasetId,
  tableName,
  tableId,
  schema,
  description,
  location,
  creationTime,
  numRows,
  numBytes,
  expirationTime,
  labels,
  metadata,
  success,
  error
}: TableCreationProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao criar tabela</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'string': return 'bg-blue-100 text-blue-800';
      case 'integer': return 'bg-green-100 text-green-800';
      case 'float': return 'bg-purple-100 text-purple-800';
      case 'boolean': return 'bg-orange-100 text-orange-800';
      case 'date': return 'bg-pink-100 text-pink-800';
      case 'timestamp': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'required': return 'bg-red-100 text-red-800';
      case 'nullable': return 'bg-gray-100 text-gray-800';
      case 'repeated': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Tabela Criada com Sucesso
          </h3>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {metadata?.tableType || 'TABLE'}
            </span>
          </div>
        </div>
        <div className="mt-1 text-sm text-gray-600">
          {datasetId}.{tableName} → {tableId}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Table Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Nome da Tabela</div>
            <div className="font-semibold text-gray-900">{tableName}</div>
            <div className="text-xs text-gray-500 mt-1">ID: {tableId}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Dataset</div>
            <div className="font-semibold text-gray-900">{datasetId}</div>
            <div className="text-xs text-gray-500 mt-1">Localização: {location}</div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Descrição
            </h4>
            <p className="text-blue-700 text-sm">{description}</p>
          </div>
        )}

        {/* Schema */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Schema da Tabela ({schema?.length || 0} colunas)
          </h4>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome da Coluna
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schema?.map((column, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium text-gray-900">{column.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(column.type)}`}>
                          {column.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getModeColor(column.mode)}`}>
                          {column.mode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Linhas</div>
            <div className="text-lg font-semibold text-gray-900">{numRows?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Tamanho</div>
            <div className="text-lg font-semibold text-gray-900">
              {numBytes ? `${(numBytes / 1024).toFixed(1)} KB` : '0 B'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Colunas</div>
            <div className="text-lg font-semibold text-gray-900">{schema?.length || 0}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Status</div>
            <div className="text-lg font-semibold text-green-600">Ativa</div>
          </div>
        </div>

        {/* Labels */}
        {labels && Object.keys(labels).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Labels</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(labels).map(([key, value], index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {metadata?.createdBy && <span>Criado por: {metadata.createdBy}</span>}
            {metadata?.version && <span>Versão: {metadata.version}</span>}
          </div>
          <div className="flex items-center gap-4">
            {creationTime && (
              <span>Criado: {new Date(creationTime).toLocaleString('pt-BR')}</span>
            )}
            {expirationTime && (
              <span>Expira: {new Date(expirationTime).toLocaleString('pt-BR')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}