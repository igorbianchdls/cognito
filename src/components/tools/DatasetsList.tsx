'use client';

interface Dataset {
  id: string;
  friendlyName?: string;
  description?: string;
  location?: string;
  creationTime?: string;
  lastModifiedTime?: string;
}

interface DatasetsListProps {
  datasets?: Dataset[];
  success?: boolean;
  error?: string;
}

export default function DatasetsList({ datasets, success, error }: DatasetsListProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao carregar datasets</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  if (!datasets || datasets.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-yellow-800">Nenhum dataset encontrado</h3>
        </div>
        <p className="text-yellow-700 text-sm mt-1">Não há datasets disponíveis no projeto.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
          </svg>
          Datasets BigQuery ({datasets.length})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID do Dataset
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Localização
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Criado em
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datasets.map((dataset, index) => (
              <tr key={dataset.id || index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {dataset.id}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {dataset.friendlyName || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={dataset.description}>
                  {dataset.description || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {dataset.location || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {dataset.creationTime ? new Date(dataset.creationTime).toLocaleDateString('pt-BR') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}