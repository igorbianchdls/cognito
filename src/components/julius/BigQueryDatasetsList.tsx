'use client';

interface Dataset {
  id: string;
  friendlyName?: string;
  description?: string;
  location?: string;
  creationTime?: string;
  lastModifiedTime?: string;
}

interface BigQueryDatasetsListProps {
  datasets?: Dataset[];
  success?: boolean;
  error?: string;
}

export default function BigQueryDatasetsList({ datasets, success, error }: BigQueryDatasetsListProps) {
  if (error || !success) {
    return (
      <div className="my-4 p-4 border-2 border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 13.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao carregar datasets</h3>
        </div>
        <p className="text-sm text-red-700">{error || 'Falha desconhecida'}</p>
      </div>
    );
  }

  if (!datasets || datasets.length === 0) {
    return (
      <div className="my-4 p-4 border-2 border-gray-200 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="font-semibold text-gray-700">Nenhum dataset encontrado</h3>
        </div>
        <p className="text-sm text-gray-600">Não foram encontrados datasets no seu projeto BigQuery.</p>
      </div>
    );
  }

  return (
    <div className="my-4 p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
        <h3 className="text-lg font-semibold text-blue-800">
          BigQuery Datasets ({datasets.length})
        </h3>
      </div>

      <div className="grid gap-3">
        {datasets.map((dataset) => (
          <div
            key={dataset.id}
            className="bg-white p-4 border border-blue-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
                    {dataset.id}
                  </code>
                  {dataset.location && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {dataset.location}
                    </span>
                  )}
                </div>

                {dataset.friendlyName && (
                  <h4 className="font-medium text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                    {dataset.friendlyName}
                  </h4>
                )}

                {dataset.description && (
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    {dataset.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  {dataset.creationTime && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      Criado: {new Date(dataset.creationTime).toLocaleString('pt-BR')}
                    </div>
                  )}
                  {dataset.lastModifiedTime && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Modificado: {new Date(dataset.lastModifiedTime).toLocaleString('pt-BR')}
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
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <strong>💡 Dica:</strong> Para listar as tabelas de um dataset específico, pergunte: 
            <em>&quot;Mostre as tabelas do dataset [nome_do_dataset]&quot;</em>
          </div>
        </div>
      </div>
    </div>
  );
}