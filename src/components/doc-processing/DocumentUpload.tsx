'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { Upload, Loader2, FileText, Receipt, Landmark } from 'lucide-react';
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
      {/* Header branco com seletor de tipo (obrigatório) */}
      <div className="mb-3 px-1">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-gray-900">Tipo de documento</div>
            <div className="text-xs text-gray-500">Selecione antes de enviar o PDF</div>
          </div>
          <div className="ml-3">
            <Select value={documentType} onValueChange={onDocumentTypeChange}>
              <SelectTrigger className="md:w-64 w-full">
                <SelectValue placeholder="Fatura, Extrato ou NF-e" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fatura">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-gray-600" />
                    <span>Fatura</span>
                  </div>
                </SelectItem>
                <SelectItem value="Extrato Bancário">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-gray-600" />
                    <span>Extrato Bancário</span>
                  </div>
                </SelectItem>
                <SelectItem value="Nota Fiscal (NF-e)">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span>Nota Fiscal (NF-e)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {!documentType && (
          <div className="text-xs text-red-600 mt-2 px-1">Seleção obrigatória para habilitar o upload.</div>
        )}
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
            <p className="text-sm text-gray-500 mt-1">Selecione o tipo acima e arraste um PDF aqui, ou clique para escolher</p>
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
