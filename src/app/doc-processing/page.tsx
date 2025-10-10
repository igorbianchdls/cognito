'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import DocumentUpload from '@/components/doc-processing/DocumentUpload';
import FieldsPanel from '@/components/doc-processing/FieldsPanel';

export default function DocProcessingPage() {
  const router = useRouter();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);

    // Simular processamento
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center px-6 gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>

        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold">Processing</h1>
        </div>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <span className="text-sm font-medium">U</span>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Document Upload/Viewer */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full p-6 overflow-auto">
              <DocumentUpload
                onFileUpload={handleFileUpload}
                uploadedFile={uploadedFile}
                isProcessing={isProcessing}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-purple-600 transition-colors" />

          {/* Right Panel - Extracted Fields */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-gray-800/50">
              <FieldsPanel
                hasDocument={!!uploadedFile}
                isProcessing={isProcessing}
              />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
