'use client';

import { useRef } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
        // File Preview
        <Card className="flex-1 flex flex-col items-center justify-center">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            {isProcessing ? (
              <>
                <Loader2 className="w-16 h-16 text-gray-400 animate-spin" />
                <p className="text-lg font-medium text-gray-900">Processing document...</p>
                <p className="text-sm text-gray-600">{uploadedFile.name}</p>
              </>
            ) : (
              <>
                <FileText className="w-16 h-16 text-green-600" />
                <p className="text-lg font-medium text-gray-900">Document Uploaded</p>
                <p className="text-sm text-gray-600">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  onClick={triggerFileSelect}
                  variant="outline"
                  className="mt-4"
                >
                  Upload Different File
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
