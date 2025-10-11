'use client';

import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import DocumentUpload from '@/components/doc-processing/DocumentUpload';
import FieldsPanel from '@/components/doc-processing/FieldsPanel';

interface ExtractedField {
  key: string;
  value: string;
  confidence?: number;
}

export default function DocProcessingPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [summary, setSummary] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);
    setExtractedFields([]); // Limpar campos anteriores
    setSummary(''); // Limpar resumo anterior

    try {
      console.log('📄 Enviando arquivo para extração...');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/doc-processing/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract document data');
      }

      const data = await response.json();
      console.log('📄 Resumo:', data.summary);
      console.log('📄 Campos extraídos:', data.fields?.length);

      setSummary(data.summary || '');
      setExtractedFields(data.fields || []);
    } catch (error) {
      console.error('📄 Erro ao extrair dados:', error);
      alert('Erro ao processar documento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden bg-white">
          <div className="flex flex-col h-full w-full">
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b border-gray-200">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Creatto
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Doc Processing</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>

            {/* Main Content - Split Layout */}
            <div className="flex-1 overflow-hidden">
              <PanelGroup direction="horizontal">
                {/* Left Panel - Document Upload/Viewer */}
                <Panel defaultSize={50} minSize={30}>
                  <div className="h-full overflow-hidden bg-gray-50">
                    <DocumentUpload
                      onFileUpload={handleFileUpload}
                      uploadedFile={uploadedFile}
                      isProcessing={isProcessing}
                    />
                  </div>
                </Panel>

                <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors" />

                {/* Right Panel - Extracted Fields */}
                <Panel defaultSize={50} minSize={30}>
                  <div className="h-full bg-white">
                    <FieldsPanel
                      hasDocument={!!uploadedFile}
                      isProcessing={isProcessing}
                      extractedFields={extractedFields}
                      summary={summary}
                    />
                  </div>
                </Panel>
              </PanelGroup>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
