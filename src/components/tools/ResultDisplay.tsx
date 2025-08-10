'use client';

import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/source';

interface SourceDocument {
  id: string;
  title: string;
  url?: string;
  snippet: string;
  relevanceScore: number;
}

interface ResultDisplayProps {
  resultId?: string;
  resultType?: string;
  result?: {
    type?: string;
    data?: Record<string, unknown>;
    message?: string;
    query?: string;
    response?: string;
  };
  sources?: SourceDocument[];
  retrievedAt?: string;
  success?: boolean;
  error?: string;
}

export default function ResultDisplay({
  resultId,
  resultType,
  result,
  sources,
  retrievedAt,
  success,
  error
}: ResultDisplayProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao recuperar resultado</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Resultado não encontrado'}</p>
      </div>
    );
  }

  const getResultIcon = () => {
    switch (resultType) {
      case 'analysis':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />;
      case 'chart':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />;
      case 'dashboard':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />;
      case 'query':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />;
      case 'rag':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />;
      default:
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
    }
  };

  const getResultTypeColor = () => {
    switch (resultType) {
      case 'analysis': return 'from-purple-50 to-indigo-50 text-purple-600';
      case 'chart': return 'from-blue-50 to-cyan-50 text-blue-600';
      case 'dashboard': return 'from-green-50 to-emerald-50 text-green-600';
      case 'query': return 'from-orange-50 to-yellow-50 text-orange-600';
      case 'rag': return 'from-teal-50 to-cyan-50 text-teal-600';
      default: return 'from-gray-50 to-slate-50 text-gray-600';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getResultTypeColor().split(' ').slice(0, 2).join(' ')} px-4 py-3 border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg className={`w-5 h-5 ${getResultTypeColor().split(' ')[2]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {getResultIcon()}
            </svg>
            Resultado Recuperado
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="capitalize">{resultType}</span>
            <span>• ID: {resultId}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Result Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">ID do Resultado:</span>
              <span className="ml-2 text-gray-900 font-mono">{resultId}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Tipo:</span>
              <span className="ml-2 text-gray-900 capitalize">{resultType}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Recuperado em:</span>
              <span className="ml-2 text-gray-900">
                {retrievedAt ? new Date(retrievedAt).toLocaleString('pt-BR') : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Status:</span>
              <span className="ml-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Sucesso
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Result Data */}
        {result?.data && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
              </svg>
              Dados do Resultado
            </h4>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {Object.entries(result.data).map(([key, value]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-medium text-gray-600 min-w-0 sm:w-32 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </span>
                  <div className="flex-1 min-w-0">
                    {Array.isArray(value) ? (
                      <div className="space-y-1">
                        {value.map((item, index) => (
                          <div key={index} className="text-sm text-gray-700 bg-white px-2 py-1 rounded border">
                            {String(item)}
                          </div>
                        ))}
                      </div>
                    ) : typeof value === 'object' && value !== null ? (
                      <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-gray-900 break-words">{String(value)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message if no data */}
        {result?.message && !result.data && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>{result.message}</p>
          </div>
        )}

        {/* RAG Response */}
        {result?.response && resultType === 'rag' && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Resposta baseada nos documentos
            </h4>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <p className="text-gray-800">{result.response}</p>
              {result.query && (
                <div className="mt-3 pt-3 border-t border-teal-200">
                  <span className="text-sm text-teal-700">
                    <strong>Consulta:</strong> "{result.query}"
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sources */}
        {sources && sources.length > 0 && (
          <div className="mt-6">
            <Sources>
              <SourcesTrigger count={sources.length} />
              <SourcesContent>
                <div className="space-y-3">
                  {sources.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <Source 
                        href={doc.url} 
                        title={doc.title}
                      />
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {doc.snippet}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          ID: {doc.id}
                        </span>
                        <span className="text-xs text-gray-500">
                          Relevância: {(doc.relevanceScore * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </SourcesContent>
            </Sources>
          </div>
        )}
      </div>
    </div>
  );
}