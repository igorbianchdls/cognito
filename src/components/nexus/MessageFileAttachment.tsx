import { FileText, Image as ImageIcon } from 'lucide-react';

interface MessageFileAttachmentProps {
  mediaType: string;
  url: string;
  name?: string;
}

export default function MessageFileAttachment({ mediaType, url, name }: MessageFileAttachmentProps) {
  const isImage = mediaType.startsWith('image/');
  const isPDF = mediaType === 'application/pdf';

  // Extrair nome do arquivo da URL se não for fornecido
  const fileName = name || (isPDF ? 'documento.pdf' : 'imagem');

  return (
    <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg p-2 my-1 max-w-xs">
      {/* Thumbnail ou Ícone */}
      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-white flex items-center justify-center">
        {isImage ? (
          <img
            src={url}
            alt={fileName}
            className="w-full h-full object-cover"
          />
        ) : isPDF ? (
          <FileText className="w-6 h-6 text-red-500" />
        ) : (
          <ImageIcon className="w-6 h-6 text-gray-400" />
        )}
      </div>

      {/* Info do arquivo */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">
          {fileName}
        </p>
        <p className="text-xs text-gray-500">
          {isPDF ? 'PDF' : isImage ? 'Imagem' : mediaType}
        </p>
      </div>
    </div>
  );
}
