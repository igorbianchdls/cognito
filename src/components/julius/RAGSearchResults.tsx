'use client';

interface RAGSource {
  content?: string;
  text?: string;
  metadata?: {
    title?: string;
    filename?: string;
    page?: number;
    source?: string;
    [key: string]: unknown;
  };
  score?: number;
}

interface RAGSearchResultsProps {
  answer?: string;
  sources?: RAGSource[];
  query?: string;
  topK?: number;
  sourcesCount?: number;
  success?: boolean;
  error?: string;
}

export default function RAGSearchResults({
  answer,
  sources = [],
  query = '',
  topK = 10,
  sourcesCount = 0,
  success,
  error
}: RAGSearchResultsProps) {
  console.log('🎨 RAGSearchResults component received:', {
    hasAnswer: !!answer,
    sourcesCount,
    success,
    error,
    query
  });

  if (error || !success) {
    return (
      <div className="my-4 p-4 border-2 border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 13.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro na busca RAG</h3>
        </div>
        <p className="text-sm text-red-700 mb-2">{error || 'Falha na busca na base de conhecimento'}</p>
        {query && (
          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
            <div className="text-xs text-red-600 font-medium mb-1">Query executada:</div>
            <code className="text-xs text-red-800 font-mono break-all">{query}</code>
          </div>
        )}
      </div>
    );
  }

  if (!answer && sourcesCount === 0) {
    return (
      <div className="my-4 p-4 border-2 border-gray-200 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="font-semibold text-gray-700">Nenhum documento encontrado</h3>
        </div>
        <p className="text-sm text-gray-600">Não encontrei informações relevantes na base de conhecimento para sua consulta.</p>
        {query && (
          <div className="mt-3 p-2 bg-gray-100 border border-gray-300 rounded">
            <div className="text-xs text-gray-600 font-medium mb-1">Consulta:</div>
            <code className="text-xs text-gray-700 font-mono break-all">{query}</code>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="my-4 p-4 border-2 border-purple-200 bg-purple-50 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z" />
        </svg>
        <div>
          <h3 className="text-lg font-semibold text-purple-800">Resposta da Base de Conhecimento</h3>
          <div className="flex flex-wrap gap-4 text-sm text-purple-600 mt-1">
            <span>🔍 {sourcesCount} fonte{sourcesCount !== 1 ? 's' : ''} consultada{sourcesCount !== 1 ? 's' : ''}</span>
            <span>📊 Top {topK} resultados</span>
          </div>
        </div>
      </div>

      {/* Answer Section */}
      {answer && (
        <div className="mb-6 p-4 bg-white border border-purple-300 rounded-lg">
          <h4 className="text-md font-medium text-purple-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Resposta:
          </h4>
          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {answer}
          </div>
        </div>
      )}

      {/* Sources Section */}
      {sources.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-medium text-purple-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Fontes consultadas:
          </h4>
          
          <div className="space-y-3">
            {sources.slice(0, 5).map((source, index) => {
              const content = source.content || source.text || '';
              const metadata = source.metadata || {};
              const title = metadata.title || metadata.filename || `Documento ${index + 1}`;
              const score = source.score;
              
              return (
                <div key={index} className="p-3 bg-white border border-purple-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
                        #{index + 1}
                      </span>
                      <h5 className="font-medium text-purple-800 truncate max-w-xs" title={title}>
                        {title}
                      </h5>
                    </div>
                    {score && (
                      <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                        {(score * 100).toFixed(1)}% relevante
                      </span>
                    )}
                  </div>
                  
                  {/* Metadata */}
                  {Object.keys(metadata).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 text-xs text-gray-600">
                      {metadata.page && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          📄 Página {metadata.page}
                        </span>
                      )}
                      {metadata.source && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          🔗 {metadata.source}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Content Preview */}
                  {content && (
                    <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border-l-2 border-purple-300">
                      <div className="line-clamp-3">
                        {content.length > 200 
                          ? `${content.substring(0, 200)}...` 
                          : content
                        }
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {sources.length > 5 && (
              <div className="text-center text-sm text-purple-600 bg-purple-100 py-2 rounded">
                + {sources.length - 5} fonte{sources.length - 5 !== 1 ? 's' : ''} adicional{sources.length - 5 !== 1 ? 'is' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Query Info */}
      {query && (
        <div className="mt-4 p-3 bg-purple-100 border border-purple-300 rounded-lg">
          <div className="text-sm font-medium text-purple-700 mb-1">🔍 Consulta processada:</div>
          <code className="text-sm text-purple-800 font-mono">
            {query}
          </code>
        </div>
      )}
    </div>
  );
}