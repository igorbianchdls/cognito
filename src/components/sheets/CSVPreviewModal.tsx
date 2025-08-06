'use client';

import { Button } from '@/components/ui/button';
import { CSVImportPlugin, CSVData } from './CSVImportPlugin';

interface CSVPreviewModalProps {
  isOpen: boolean;
  csvData: CSVData | null;
  csvPlugin: CSVImportPlugin | null;
  onConfirm: (asNewWorkbook: boolean) => Promise<void>;
  onCancel: () => void;
}

export default function CSVPreviewModal({ 
  isOpen, 
  csvData, 
  csvPlugin, 
  onConfirm, 
  onCancel 
}: CSVPreviewModalProps) {
  if (!isOpen || !csvData || !csvPlugin) {
    return null;
  }

  const preview = csvPlugin.previewCSV(csvData);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-[9999]"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-5xl max-h-[85vh] overflow-auto m-4 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Preview dos Dados CSV</h3>
            <p className="text-sm text-gray-600 mt-1">
              Encontradas {preview.totalRows} linhas de dados
            </p>
          </div>
          
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Fechar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-x-auto mb-6 border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {preview.headers.map((header, index) => (
                  <th 
                    key={index} 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                  >
                    {header || `Coluna ${index + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preview.preview.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {row.map((cell, cellIndex) => (
                    <td 
                      key={cellIndex} 
                      className="px-6 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 max-w-xs truncate"
                      title={cell}
                    >
                      {cell || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {preview.totalRows > 5 && (
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mostrando apenas as primeiras 5 linhas. Total: {preview.totalRows} linhas
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            onClick={() => onConfirm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nova Planilha
          </Button>
          
          <Button
            onClick={() => onConfirm(false)}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 px-6"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Inserir na Posição Atual
          </Button>
          
          <Button
            onClick={onCancel}
            variant="outline"
            className="text-gray-600 hover:bg-gray-50 px-6"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}