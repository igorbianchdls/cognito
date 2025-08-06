'use client';

import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { 
  availableDatasetsStore, 
  activeDatasetIdStore, 
  sheetDataStore, 
  isSheetLoadingStore,
  switchToDataset,
  initializeDefaultDataset
} from '@/stores/sheetsStore';
import { DatasetInfo } from '@/data/mockDatasets';

export default function DatasetsPanel() {
  const datasets = useStore(availableDatasetsStore);
  const activeDatasetId = useStore(activeDatasetIdStore);
  const sheetData = useStore(sheetDataStore);
  const isLoading = useStore(isSheetLoadingStore);

  // Initialize default dataset on component mount
  useEffect(() => {
    initializeDefaultDataset();
  }, []);

  // Handle dataset selection
  const handleSelectDataset = (datasetId: string) => {
    if (datasetId !== activeDatasetId && !isLoading) {
      switchToDataset(datasetId);
    }
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Importing file:', file.name);
        // TODO: Implementar importação
      }
    };
    input.click();
  };

  const handleExportCSV = () => {
    if (sheetData.rows.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    // Criar CSV
    const csvContent = [
      sheetData.headers.join(','),
      ...sheetData.rows.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'dados.csv';
    link.click();
  };


  const getTypeIcon = (type: DatasetInfo['type']) => {
    switch (type) {
      case 'csv': return '📄';
      case 'json': return '🔗';
      case 'excel': return '📊';
      case 'grid': return '🔢';
      default: return '📁';
    }
  };

  const getTypeColor = (type: DatasetInfo['type']) => {
    switch (type) {
      case 'csv': return 'bg-green-100 text-green-800';
      case 'json': return 'bg-blue-100 text-blue-800';
      case 'excel': return 'bg-purple-100 text-purple-800';
      case 'grid': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get current active dataset name
  const getActiveDatasetName = () => {
    const activeDataset = datasets.find(ds => ds.id === activeDatasetId);
    return activeDataset?.name || 'Dataset Atual';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h3 className="text-sm font-medium text-gray-900">Datasets</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Gerenciar conjuntos de dados
        </p>
      </div>

      {/* Current Dataset Info */}
      {sheetData.totalRows > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="text-xs font-medium text-blue-900 mb-1">
            Dataset Ativo: {getActiveDatasetName()}
          </div>
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span>{sheetData.totalRows} linhas</span>
            <span>{sheetData.totalCols} colunas</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleExportCSV}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              📥 Exportar CSV
            </button>
          </div>
        </div>
      )}

      {/* Datasets List */}
      <div className="flex-1 overflow-y-auto">
        {datasets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Nenhum dataset carregado
            </h4>
            <p className="text-xs text-gray-600 mb-4">
              Importe arquivos CSV, Excel ou JSON
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {datasets.map((dataset) => {
              const isActive = dataset.id === activeDatasetId;
              const isLoadingThis = isLoading && dataset.id !== activeDatasetId;
              
              return (
                <div
                  key={dataset.id}
                  onClick={() => handleSelectDataset(dataset.id)}
                  className={`
                    p-3 border rounded-lg transition-all cursor-pointer
                    ${isActive 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }
                    ${isLoadingThis ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(dataset.type)}</span>
                      <div>
                        <h4 className={`text-sm font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                          {dataset.name}
                          {isActive && <span className="ml-2 text-blue-600">✓</span>}
                        </h4>
                        <p className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                          {dataset.rows.toLocaleString()} linhas • {dataset.columns} colunas
                        </p>
                        <p className={`text-xs ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                          {dataset.description}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(dataset.type)}`}>
                      {dataset.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      <span>{dataset.size}</span>
                      <span className="mx-1">•</span>
                      <span>{dataset.lastModified.toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="p-1 hover:bg-gray-200 rounded text-xs"
                        title="Visualizar dados"
                      >
                        👁️
                      </button>
                      <button 
                        className="p-1 hover:bg-gray-200 rounded text-xs"
                        title="Exportar dataset"
                      >
                        📥
                      </button>
                      {!isActive && (
                        <button 
                          className="p-1 hover:bg-red-200 rounded text-xs"
                          title="Remover dataset"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Loading indicator for this dataset */}
                  {isLoading && dataset.id === activeDatasetId && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                      <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Carregando...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 p-3">
        <div className="space-y-2">
          <button
            onClick={handleImportCSV}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isLoading ? 'Importando...' : 'Importar Dados'}
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors">
              🔄 Atualizar
            </button>
            <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors">
              🗑️ Limpar
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <span className="font-medium">{datasets.length}</span> dataset(s) • 
            <span className="font-medium ml-1">
              {datasets.reduce((acc, ds) => acc + ds.rows, 0).toLocaleString()}
            </span> linhas total
          </div>
        </div>
      </div>
    </div>
  );
}