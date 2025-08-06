export interface CSVData {
  headers: string[];
  rows: Array<Record<string, unknown>>;
  rawRows: string[][];
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
}

import Papa from 'papaparse';

export class CSVImportPlugin {
  private univerAPI: unknown;

  constructor(univerAPI: unknown) {
    this.univerAPI = univerAPI;
  }

  triggerFileSelect(): Promise<CSVData | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.tsv,.txt,.json';
      input.style.display = 'none';
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const fileData = await this.processFile(file);
            resolve(fileData);
          } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      
      input.oncancel = () => resolve(null);
      
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
  }

  private processFile(file: File): Promise<CSVData> {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'json') {
        this.processJSONFile(file).then(resolve).catch(reject);
      } else {
        this.processCSVFile(file).then(resolve).catch(reject);
      }
    });
  }

  private processCSVFile(file: File): Promise<CSVData> {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const delimiter = this.detectDelimiter(fileExtension);
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: delimiter,
        dynamicTyping: true,
        encoding: 'UTF-8',
        transformHeader: (header: string) => header.trim(),
        complete: (result) => {
          try {
            if (result.errors.length > 0) {
              console.warn('Papa parse warnings:', result.errors);
            }

            const headers = result.meta.fields || [];
            const rows = result.data as Array<Record<string, unknown>>;
            
            // Also get raw string data for legacy compatibility
            Papa.parse(file, {
              header: false,
              skipEmptyLines: true,
              delimiter: delimiter,
              encoding: 'UTF-8',
              complete: (rawResult) => {
                const rawRows = rawResult.data as string[][];
                
                const csvData: CSVData = {
                  headers,
                  rows,
                  rawRows: rawRows.slice(1), // Remove header row
                  fileName: file.name,
                  fileSize: file.size,
                  rowCount: rows.length,
                  columnCount: headers.length
                };
                
                resolve(csvData);
              },
              error: (error) => reject(new Error(`Erro ao processar CSV: ${error.message}`))
            });
          } catch (error) {
            reject(new Error(`Erro ao processar dados CSV: ${(error as Error).message}`));
          }
        },
        error: (error) => {
          reject(new Error(`Erro ao fazer parse do CSV: ${error.message}`));
        }
      });
    });
  }

  private processJSONFile(file: File): Promise<CSVData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const jsonText = e.target?.result as string;
          const jsonData = JSON.parse(jsonText);
          
          if (!Array.isArray(jsonData)) {
            throw new Error('JSON deve ser um array de objetos');
          }
          
          if (jsonData.length === 0) {
            throw new Error('Array JSON está vazio');
          }
          
          // Extract headers from first object
          const headers = Object.keys(jsonData[0]);
          const rows = jsonData as Array<Record<string, unknown>>;
          
          // Convert to raw rows for compatibility
          const rawRows = rows.map(row => 
            headers.map(header => String(row[header] || ''))
          );
          
          const csvData: CSVData = {
            headers,
            rows,
            rawRows,
            fileName: file.name,
            fileSize: file.size,
            rowCount: rows.length,
            columnCount: headers.length
          };
          
          resolve(csvData);
        } catch (error) {
          reject(new Error(`Erro ao processar JSON: ${(error as Error).message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo JSON'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  private detectDelimiter(fileExtension?: string): string {
    switch (fileExtension) {
      case 'tsv': return '\t';
      case 'csv': return ',';
      default: return ''; // Auto-detect
    }
  }


  importToNewWorkbook(csvData: CSVData): void {
    try {
      console.log('Iniciando importação CSV:', csvData);
      
      const cellData = this.convertToUniverFormat(csvData);
      const sheetId = 'sheet1';
      const workbookId = 'csv-import-' + Date.now();
      
      const workbookData = {
        id: workbookId,
        name: 'Dados CSV Importados',
        sheetOrder: [sheetId],
        sheets: {
          [sheetId]: {
            id: sheetId,
            name: 'Dados CSV',
            cellData: cellData,
            rowCount: Math.max(csvData.rows.length + 10, 100),
            columnCount: Math.max(csvData.headers.length + 5, 26)
          }
        }
      };
      
      console.log('Estrutura workbook criada:', workbookData);
      
      const result = (this.univerAPI as { createWorkbook: (data: unknown) => unknown }).createWorkbook(workbookData);
      
      console.log('Workbook criado com sucesso:', result);
      
    } catch (error) {
      console.error('Erro detalhado na importação:', error);
      console.error('Stack trace:', (error as Error).stack);
      throw new Error('Erro ao importar dados para planilha: ' + (error as Error).message);
    }
  }

  insertAtCurrentPosition(csvData: CSVData): void {
    try {
      console.log('Inserindo na posição atual:', csvData);
      
      // Por enquanto, usar o mesmo método de criar novo workbook
      // A API do Univer para inserção direta é mais complexa
      console.warn('Função insertAtCurrentPosition ainda não implementada - usando importToNewWorkbook');
      this.importToNewWorkbook(csvData);
      
    } catch (error) {
      console.error('Erro ao inserir na posição atual:', error);
      throw new Error('Erro ao inserir dados na planilha: ' + (error as Error).message);
    }
  }

  private convertToUniverFormat(csvData: CSVData): Record<number, Record<number, unknown>> {
    const cellData: Record<number, Record<number, unknown>> = {};
    const allRows = [csvData.headers, ...csvData.rows];
    
    allRows.forEach((row, rowIndex) => {
      (row as unknown[]).forEach((cell: unknown, colIndex: number) => {
        if (!cellData[rowIndex]) {
          cellData[rowIndex] = {};
        }
        
        const value = this.parseValue(String(cell || ''));
        
        cellData[rowIndex][colIndex] = {
          v: value,
          s: rowIndex === 0 ? { 
            bl: 1,
            fs: 11
          } : undefined
        };
      });
    });
    
    return cellData;
  }

  private parseValue(value: string): string | number {
    if (!value || value.trim() === '') {
      return '';
    }

    const cleaned = value.trim();
    
    if (cleaned.match(/^\d+$/)) {
      return parseInt(cleaned, 10);
    }
    
    if (cleaned.match(/^\d*\.\d+$/)) {
      return parseFloat(cleaned);
    }
    
    const currencies = cleaned.match(/^[R$€£¥₹]\s*([0-9,.]+)$/);
    if (currencies) {
      const numStr = currencies[1].replace(/,/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        return num;
      }
    }
    
    if (cleaned.toLowerCase() === 'true') return 'true';
    if (cleaned.toLowerCase() === 'false') return 'false';
    
    return cleaned;
  }

  previewCSV(csvData: CSVData, maxRows: number = 5): { headers: string[]; preview: Array<Record<string, unknown>>; rawPreview: string[][]; totalRows: number } {
    return {
      headers: csvData.headers,
      preview: csvData.rows.slice(0, maxRows),
      rawPreview: csvData.rawRows.slice(0, maxRows),
      totalRows: csvData.rowCount
    };
  }
}