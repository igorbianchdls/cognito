'use client';

interface Schema {
  name: string;
  type: string;
  mode: string;
}

interface TableDataProps {
  data?: Record<string, any>[];
  schema?: Schema[];
  totalRows?: number;
  executionTime?: number;
  datasetId?: string;
  tableId?: string;
  success?: boolean;
  error?: string;
}

function formatValue(value: any, type: string): string {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'FLOAT':
    case 'NUMERIC':
      return typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : value;
    case 'INTEGER':
      return typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
    case 'DATE':
      return new Date(value).toLocaleDateString('pt-BR');
    case 'TIMESTAMP':
      return new Date(value).toLocaleString('pt-BR');
    default:
      return String(value);
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'STRING':
      return 'bg-blue-100 text-blue-800';
    case 'INTEGER':
      return 'bg-green-100 text-green-800';
    case 'FLOAT':
    case 'NUMERIC':
      return 'bg-purple-100 text-purple-800';
    case 'DATE':
    case 'TIMESTAMP':
      return 'bg-orange-100 text-orange-800';
    case 'BOOLEAN':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function TableData({ 
  data, 
  schema, 
  totalRows, 
  executionTime, 
  datasetId, 
  tableId, 
  success, 
  error 
}: TableDataProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao carregar dados</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
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
          <h3 className="font-semibold text-yellow-800">Nenhum dado encontrado</h3>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          A tabela {tableId} no dataset {datasetId} não possui dados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header com informações */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Dados: {datasetId}.{tableId}
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {totalRows && (
              <span>Total: {totalRows.toLocaleString('pt-BR')} linhas</span>
            )}
            {executionTime && (
              <span>Tempo: {executionTime}ms</span>
            )}
          </div>
        </div>
      </div>

      {/* Schema info */}
      {schema && schema.length > 0 && (
        <div className="bg-gray-25 px-4 py-2 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {schema.map((col, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(col.type)}`}
              >
                {col.name}
                <span className="ml-1 opacity-75">({col.type})</span>
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Data table */}
      <div className="overflow-x-auto max-h-96">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
            <tr>
              {schema && schema.map((col) => (
                <th
                  key={col.name}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.name}
                </th>
              ))}
              {!schema && data.length > 0 && Object.keys(data[0]).map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {schema && schema.map((col) => (
                  <td key={col.name} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatValue(row[col.name], col.type)}
                  </td>
                ))}
                {!schema && Object.entries(row).map(([key, value]) => (
                  <td key={key} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatValue(value, 'STRING')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Mostrando {data.length} de {totalRows || data.length} linhas
          {data.length < (totalRows || 0) && " (resultados limitados)"}
        </p>
      </div>
    </div>
  );
}