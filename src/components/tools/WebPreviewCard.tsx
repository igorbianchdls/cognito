'use client';

import { 
  WebPreview, 
  WebPreviewNavigation, 
  WebPreviewUrl, 
  WebPreviewBody 
} from '@/components/ai-elements/web-preview';

interface WebPreviewCardProps {
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
  screenshot?: string;
  isValidUrl?: boolean;
  previewAvailable?: boolean;
  generatedAt?: string;
  success?: boolean;
  error?: string;
}

export default function WebPreviewCard({
  url,
  title,
  description,
  favicon,
  screenshot,
  isValidUrl = true,
  previewAvailable = true,
  generatedAt,
  success = true,
  error
}: WebPreviewCardProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro no preview</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Falha ao carregar preview'}</p>
      </div>
    );
  }

  if (!isValidUrl) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 14.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="font-semibold text-yellow-800">URL inválida</h3>
        </div>
        <p className="text-yellow-700 text-sm mt-1">Por favor, forneça uma URL válida que comece com http:// ou https://</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Website Info */}
      {(title || description) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            {favicon && (
              <img 
                src={favicon} 
                alt="Favicon" 
                className="w-6 h-6 mt-1 flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
            <div className="flex-1">
              {title && (
                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-gray-600 text-sm leading-relaxed">
                  {description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span>{url}</span>
                {generatedAt && (
                  <>
                    <span>•</span>
                    <span>{new Date(generatedAt).toLocaleString('pt-BR')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Web Preview */}
      {previewAvailable && (
        <WebPreview defaultUrl={url} style={{ height: '400px' }}>
          <WebPreviewNavigation>
            <WebPreviewUrl />
          </WebPreviewNavigation>
          <WebPreviewBody src={url} />
        </WebPreview>
      )}
    </div>
  );
}