import { X, FileText, Image as ImageIcon } from 'lucide-react';

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

interface FileAttachmentPreviewProps {
  files: AttachedFile[];
  onRemove: (fileId: string) => void;
}

export default function FileAttachmentPreview({ files, onRemove }: FileAttachmentPreviewProps) {
  console.log('🖼️ [FileAttachmentPreview] Renderizando com', files.length, 'arquivos');

  if (files.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const isImage = (type: string) => type.startsWith('image/');
  const isPDF = (type: string) => type === 'application/pdf';

  return (
    <div className="flex flex-wrap gap-2 mb-3 px-1">
      {files.map((file) => (
        <div
          key={file.id}
          className="relative group flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2 pr-8 hover:bg-gray-100 transition-colors max-w-[200px]"
        >
          {/* Thumbnail ou Ícone */}
          <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
            {isImage(file.type) ? (
              <img
                src={file.dataUrl}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : isPDF(file.type) ? (
              <FileText className="w-5 h-5 text-red-500" />
            ) : (
              <ImageIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Info do arquivo */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </p>
          </div>

          {/* Botão de remover */}
          <button
            onClick={() => onRemove(file.id)}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-gray-200 hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Remover ${file.name}`}
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      ))}
    </div>
  );
}
