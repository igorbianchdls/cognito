'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Sidebar from '../navigation/Sidebar';

// Simple Excel-like spreadsheet implementation
export default function UniverSheet() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<string[][]>(() => {
    // Initialize with sample data
    const initialData = Array(20).fill(null).map((_, row) => 
      Array(10).fill(null).map((_, col) => {
        if (row === 0 && col < 4) {
          return ['Nome', 'Idade', 'Cidade', 'Salário'][col];
        }
        if (row === 1 && col < 4) {
          return ['João Silva', '30', 'São Paulo', '5000'][col];
        }
        if (row === 2 && col < 4) {
          return ['Maria Santos', '25', 'Rio de Janeiro', '4500'][col];
        }
        return '';
      })
    );
    return initialData;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoaded(true);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const updateCell = (row: number, col: number, value: string) => {
    const newData = [...data];
    newData[row][col] = value;
    setData(newData);
  };

  const getColumnLabel = (index: number): string => {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

  const handleNewSheet = () => {
    // Clear all data except headers
    const newData = Array(20).fill(null).map(() => 
      Array(10).fill(null).map(() => '')
    );
    setData(newData);
  };

  const handleImportFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const csvData = lines.map(line => line.split(',').map(cell => cell.trim()));
        
        // Pad or trim to fit our grid
        const newData = Array(20).fill(null).map((_, row) => 
          Array(10).fill(null).map((_, col) => {
            return csvData[row]?.[col] || '';
          })
        );
        setData(newData);
      };
      reader.readAsText(file);
    }
  };

  const handleExport = () => {
    // Convert data to CSV
    const csvContent = data
      .filter(row => row.some(cell => cell.trim() !== ''))
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'planilha.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Planilhas</h1>
              <p className="text-muted-foreground">
                Editor de planilhas com Univer.ai
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleNewSheet}
              variant="default"
              disabled={!isLoaded}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Planilha
            </Button>
            
            <Button 
              onClick={handleImportFile}
              variant="outline"
              disabled={!isLoaded}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Importar
            </Button>
            
            <Button 
              onClick={handleExport}
              variant="outline"
              disabled={!isLoaded}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Exportar
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Spreadsheet Container */}
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a73e8] mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Carregando planilha...</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full overflow-auto bg-white">
                  {/* Column headers */}
                  <div className="sticky top-0 z-10 bg-gray-50 border-b">
                    <div className="flex">
                      <div className="w-12 h-8 bg-gray-100 border-r border-gray-300 flex items-center justify-center text-xs font-medium"></div>
                      {Array(10).fill(null).map((_, col) => (
                        <div
                          key={col}
                          className="w-24 h-8 border-r border-gray-300 flex items-center justify-center text-xs font-medium bg-gray-50"
                        >
                          {getColumnLabel(col)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Data rows */}
                  <div>
                    {data.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex border-b border-gray-200">
                        {/* Row number */}
                        <div className="w-12 h-8 bg-gray-50 border-r border-gray-300 flex items-center justify-center text-xs font-medium">
                          {rowIndex + 1}
                        </div>
                        
                        {/* Data cells */}
                        {row.map((cell, colIndex) => (
                          <input
                            key={`${rowIndex}-${colIndex}`}
                            type="text"
                            value={cell}
                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                            className={`w-24 h-8 border-r border-gray-200 px-2 text-xs focus:outline-none focus:bg-blue-50 focus:border-blue-300 ${
                              rowIndex === 0 ? 'font-semibold bg-blue-50' : 'bg-white'
                            }`}
                            style={{ fontSize: '11px' }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}