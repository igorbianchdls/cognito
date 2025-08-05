'use client';

import { useRef, useState } from 'react';
import { processFile, getFileTypeFromExtension } from '@/lib/fileProcessors';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  content?: string;
  summary?: string;
  fileType?: 'csv' | 'text' | 'unknown';
  rowCount?: number;
  columnCount?: number;
}

interface UploadFilesProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in bytes
  acceptedTypes?: string[];
  disabled?: boolean;
}

export default function UploadFiles({
  onFilesUploaded,
  maxFiles = 5,
  maxSizePerFile = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'application/pdf', '.txt', '.doc', '.docx', '.csv', '.md'],
  disabled = false
}: UploadFilesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check file count limit
    if (uploadedFiles.length + files.length > maxFiles) {
      alert(`Máximo de ${maxFiles} arquivos permitidos`);
      return;
    }

    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > maxSizePerFile) {
        alert(`Arquivo ${file.name} é muito grande. Máximo: ${formatFileSize(maxSizePerFile)}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Create file objects with URLs for preview
      const newFiles: UploadedFile[] = [];
      
      for (const file of validFiles) {
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const baseFile: UploadedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          fileType: 'unknown'
        };
        
        newFiles.push(baseFile);
        setProcessingFiles(prev => new Set([...prev, fileId]));
        
        // Process file content asynchronously
        processFile(file).then(processedContent => {
          if (processedContent) {
            setUploadedFiles(currentFiles => {
              const updatedFiles = currentFiles.map(f => 
                f.id === fileId 
                  ? {
                      ...f,
                      content: processedContent.content,
                      summary: processedContent.summary,
                      fileType: processedContent.type,
                      rowCount: processedContent.rowCount,
                      columnCount: processedContent.columnCount
                    }
                  : f
              );
              onFilesUploaded(updatedFiles);
              return updatedFiles;
            });
          }
          
          setProcessingFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(fileId);
            return newSet;
          });
        }).catch(error => {
          console.error('Erro ao processar arquivo:', error);
          setProcessingFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(fileId);
            return newSet;
          });
        });
      }

      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      onFilesUploaded(updatedFiles);

    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload dos arquivos');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(file => {
      if (file.id === fileId) {
        // Cleanup object URL
        URL.revokeObjectURL(file.url);
        return false;
      }
      return true;
    });
    setUploadedFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
  };

  const triggerFileSelect = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={triggerFileSelect}
        disabled={disabled || isUploading}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
          disabled || isUploading
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
        }`}
        title="Anexar arquivos"
      >
        {isUploading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        )}
      </button>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-64 max-w-80">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
            Arquivos anexados ({uploadedFiles.length})
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded group">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                  {file.type.startsWith('image/') ? (
                    <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                    {processingFiles.has(file.id) && (
                      <span className="ml-1 text-blue-500">processando...</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)} • {getFileTypeFromExtension(file.name)}
                    {file.summary && !processingFiles.has(file.id) && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ {file.summary}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 w-4 h-4 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}