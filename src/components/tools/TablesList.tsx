'use client';

interface Table {
  tableId: string;
  description?: string;
  numRows?: number;
  numBytes?: number;
  creationTime?: string;
}

interface TablesListProps {
  tables?: Table[];
  datasetId?: string;
  success?: boolean;
  error?: string;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}

function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export default function TablesList({ tables, datasetId, success, error }: TablesListProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao carregar tabelas</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-yellow-800">Nenhuma tabela encontrada</h3>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          Não há tabelas no dataset {datasetId || 'especificado'}.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Tabelas no Dataset: {datasetId} ({tables.length})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome da Tabela
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Linhas
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tamanho
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Criado em
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tables.map((table, index) => (
              <tr key={table.tableId || index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {table.tableId}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={table.description}>
                  {table.description || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {table.numRows ? formatNumber(table.numRows) : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {table.numBytes ? formatBytes(table.numBytes) : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {table.creationTime ? new Date(table.creationTime).toLocaleDateString('pt-BR') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}