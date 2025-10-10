'use client';

import { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PDFViewer from './PDFViewer';

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
          className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-gray-400 hover:bg-white transition-all bg-white"
        >
          <Upload className="w-16 h-16 text-gray-400" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">
              Upload Document
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop a PDF file here, or click to browse
            </p>
          </div>
          <Button>
            Select File
          </Button>
        </div>
      ) : (
        // PDF Viewer
        <div className="flex-1 flex flex-col">
          {isProcessing ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-lg">
              <Loader2 className="w-16 h-16 text-gray-400 animate-spin" />
              <p className="text-lg font-medium text-gray-900 mt-4">Processing document...</p>
              <p className="text-sm text-gray-600 mt-2">{uploadedFile.name}</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <PDFViewer file={uploadedFile} />
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={triggerFileSelect}
                  variant="outline"
                >
                  Upload Different File
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
