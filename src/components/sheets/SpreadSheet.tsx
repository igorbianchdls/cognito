'use client';

import { useState, useRef } from 'react';
import { SpreadSheets } from '@mescius/spread-sheets-react';
import * as GC from '@mescius/spread-sheets';
import '@mescius/spread-sheets/styles/gc.spread.sheets.excel2013white.css';
import '@mescius/spread-sheets-io';
import '@mescius/spread-sheets-charts';
import '@mescius/spread-sheets-shapes';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Sidebar from '../navigation/Sidebar';

export default function SpreadSheet() {
  const [hostStyle] = useState({ 
    width: '100%', 
    height: '700px' 
  });
  
  const spreadRef = useRef<GC.Spread.Sheets.Workbook | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initSpread = (spread: GC.Spread.Sheets.Workbook) => {
    try {
      spreadRef.current = spread;
      
      // Aguardar a inicialização completa
      setTimeout(() => {
        if (spreadRef.current) {
          const sheet = spreadRef.current.getActiveSheet();
          if (sheet) {
            // Adicionar alguns dados de exemplo
            sheet.getCell(0, 0).value('Planilha de Exemplo').font('14px Arial').foreColor('#1a73e8');
            sheet.getCell(1, 0).value('Nome');
            sheet.getCell(1, 1).value('Idade');
            sheet.getCell(1, 2).value('Cidade');
            sheet.getCell(1, 3).value('Salário');
            
            // Dados de exemplo
            const data = [
              ['João Silva', 30, 'São Paulo', 5000],
              ['Maria Santos', 25, 'Rio de Janeiro', 4500],
              ['Pedro Oliveira', 35, 'Belo Horizonte', 5500],
              ['Ana Costa', 28, 'Salvador', 4800]
            ];
            
            data.forEach((row, rowIndex) => {
              row.forEach((value, colIndex) => {
                sheet.getCell(rowIndex + 2, colIndex).value(value);
              });
            });
            
            // Formatação do cabeçalho
            try {
              sheet.getRange(1, 0, 1, 4).font('bold 12px Arial').backColor('#f0f8ff');
            } catch (formatError) {
              console.warn('Erro na formatação:', formatError);
            }
            
            // Ajustar largura das colunas
            sheet.setColumnWidth(0, 150);
            sheet.setColumnWidth(1, 80);
            sheet.setColumnWidth(2, 150);
            sheet.setColumnWidth(3, 100);
          }
        }
      }, 100);
    } catch (error) {
      console.error('Erro na inicialização do SpreadJS:', error);
    }
  };

  const handleImportExcel = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && spreadRef.current) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          spreadRef.current?.import(
            file,
            () => {
              console.log('Arquivo importado com sucesso');
            },
            (error: Error | string) => {
              console.error('Erro ao importar arquivo:', error);
            },
            { fileType: GC.Spread.Sheets.FileType.excel }
          );
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleExportExcel = () => {
    if (spreadRef.current) {
      spreadRef.current.export(
        (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'planilha.xlsx';
          a.click();
          URL.revokeObjectURL(url);
        },
        (error: Error | string) => {
          console.error('Erro ao exportar arquivo:', error);
        },
        { fileType: GC.Spread.Sheets.FileType.excel }
      );
    }
  };

  const handleNewSheet = () => {
    if (spreadRef.current) {
      try {
        const sheetName = `Planilha ${spreadRef.current.getSheetCount() + 1}`;
        const newSheet = new GC.Spread.Sheets.Worksheet(sheetName);
        spreadRef.current.addSheet(spreadRef.current.getSheetCount(), newSheet);
        const sheetCount = spreadRef.current.getSheetCount();
        if (sheetCount > 0) {
          spreadRef.current.setActiveSheetIndex(sheetCount - 1);
        }
      } catch (error) {
        console.error('Erro ao criar nova planilha:', error);
      }
    }
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
                Editor de planilhas com funcionalidade Excel completa
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleNewSheet} variant="default">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Planilha
            </Button>
            
            <Button onClick={handleImportExcel} variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Importar Excel
            </Button>
            
            <Button onClick={handleExportExcel} variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Exportar Excel
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* SpreadSheet Container */}
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <div className="h-full rounded-lg overflow-hidden">
                <SpreadSheets 
                  hostStyle={hostStyle} 
                  workbookInitialized={initSpread}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}