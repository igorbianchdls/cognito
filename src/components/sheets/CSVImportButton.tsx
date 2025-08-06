'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CSVImportPlugin, CSVData } from './CSVImportPlugin';

interface CSVImportButtonProps {
  csvPlugin: CSVImportPlugin | null;
  disabled?: boolean;
}

export default function CSVImportButton({ csvPlugin, disabled = false }: CSVImportButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<CSVData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleImportClick = async () => {
    if (!csvPlugin || isUploading) return;

    setIsUploading(true);
    try {
      console.log('Iniciando seleção de arquivo CSV...');
      const csvData = await csvPlugin.triggerFileSelect();
      
      if (csvData) {
        console.log('Arquivo CSV processado:', { 
          headers: csvData.headers.length, 
          rows: csvData.rows.length 
        });
        setPreviewData(csvData);
        setShowPreview(true);
      } else {
        console.log('Nenhum arquivo selecionado ou processamento cancelado');
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao processar arquivo CSV: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async (asNewWorkbook: boolean = true) => {
    if (!csvPlugin || !previewData) return;

    try {
      console.log('Confirmando importação:', { asNewWorkbook, dataRows: previewData.rows.length });
      
      if (asNewWorkbook) {
        await csvPlugin.importToNewWorkbook(previewData);
        console.log('Importação como nova planilha concluída');
      } else {
        await csvPlugin.insertAtCurrentPosition(previewData);
        console.log('Inserção na posição atual concluída');
      }
      
      setShowPreview(false);
      setPreviewData(null);
      
    } catch (error) {
      console.error('Erro detalhado na importação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao importar dados: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };

  if (showPreview && previewData) {
    const preview = csvPlugin?.previewCSV(previewData);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
          <h3 className="text-lg font-semibold mb-4">Preview dos Dados CSV</h3>
          
          <div className="mb-4 text-sm text-gray-600">
            <p>Encontradas {preview?.totalRows} linhas de dados</p>
          </div>
          
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {preview?.headers.map((header, index) => (
                    <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                      {header || `Coluna ${index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview?.preview.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-gray-200">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(preview?.totalRows || 0) > 5 && (
            <p className="text-xs text-gray-500 mb-4">
              Mostrando apenas as primeiras 5 linhas...
            </p>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={() => handleConfirmImport(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Nova Planilha
            </Button>
            
            <Button
              onClick={() => handleConfirmImport(false)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Inserir na Posição Atual
            </Button>
            
            <Button
              onClick={handleCancelPreview}
              variant="outline"
              className="text-gray-600"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={handleImportClick}
        disabled={disabled || isUploading || !csvPlugin}
        variant="outline"
        size="sm"
        className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Carregando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Importar CSV
          </>
        )}
      </Button>
      
      {!csvPlugin && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-500">
          Plugin não inicializado
        </div>
      )}
    </div>
  );
}