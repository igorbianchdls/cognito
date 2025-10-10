'use client';

import { useRef } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface DocumentUploadProps {
  onFileUpload: (file: File) => void;
  uploadedFile: File | null;
  isProcessing: boolean;
}

export default function DocumentUpload({
  onFileUpload,
  uploadedFile,
  isProcessing
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileUpload(file);
    } else {
      alert('Por favor, selecione um arquivo PDF');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileUpload(file);
    } else {
      alert('Por favor, selecione um arquivo PDF');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-full flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!uploadedFile ? (
        // Upload Area
        <div
          onClick={triggerFileSelect}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex-1 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-purple-500 hover:bg-gray-800/30 transition-all"
        >
          <Upload className="w-16 h-16 text-gray-500" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-300">
              Upload Document
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop a PDF file here, or click to browse
            </p>
          </div>
          <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors">
            Select File
          </button>
        </div>
      ) : (
        // File Preview
        <div className="flex-1 bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center gap-4">
          {isProcessing ? (
            <>
              <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
              <p className="text-lg font-medium">Processing document...</p>
              <p className="text-sm text-gray-400">{uploadedFile.name}</p>
            </>
          ) : (
            <>
              <FileText className="w-16 h-16 text-green-500" />
              <p className="text-lg font-medium">Document Uploaded</p>
              <p className="text-sm text-gray-400">{uploadedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={triggerFileSelect}
                className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                Upload Different File
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
