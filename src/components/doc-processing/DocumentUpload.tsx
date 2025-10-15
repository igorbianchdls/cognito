'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Import PDFViewer dinamicamente para evitar erro de SSR
const PDFViewer = dynamic(() => import('./PDFViewer'), { ssr: false });

interface DocumentUploadProps {
  onFileUpload: (file: File) => void;
  uploadedFile: File | null;
  isProcessing: boolean;
  documentType: string;
  onDocumentTypeChange: (value: string) => void;
}

export default function DocumentUpload({
  onFileUpload,
  uploadedFile,
  isProcessing,
  documentType,
  onDocumentTypeChange
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
      {/* Tipo de Documento - obrigatório antes do upload */}
      <div className="mb-3 px-1">
        <div className="text-sm font-medium text-gray-700 mb-1">Tipo de documento</div>
        <Select value={documentType} onValueChange={onDocumentTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione: Fatura, Extrato ou Nota Fiscal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Fatura">Fatura</SelectItem>
            <SelectItem value="Extrato Bancário">Extrato Bancário</SelectItem>
            <SelectItem value="Nota Fiscal (NF-e)">Nota Fiscal (NF-e)</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
          className="flex-1 rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-50 transition-all bg-transparent"
        >
          <Upload className="w-16 h-16 text-gray-400" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">
              Upload Document
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Selecione o tipo acima e arraste um PDF aqui, ou clique para escolher
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
            <PDFViewer file={uploadedFile} />
          )}
        </div>
      )}
    </div>
  );
}
