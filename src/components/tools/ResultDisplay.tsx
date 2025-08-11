'use client';

import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/source';
import { Response } from '@/components/ai-elements/response';

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
  result,
  sources,
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

  return (
    <div className="space-y-4">
      {/* Response */}
      {result?.response && (
        <Response>{result.response}</Response>
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <Sources>
          <SourcesTrigger count={sources.length} />
          <SourcesContent>
            {sources.map((doc) => (
              <Source 
                key={doc.id}
                href={doc.url} 
                title={doc.title}
              />
            ))}
          </SourcesContent>
        </Sources>
      )}
    </div>
  );
}