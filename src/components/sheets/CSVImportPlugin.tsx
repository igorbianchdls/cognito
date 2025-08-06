export interface CSVData {
  headers: string[];
  rows: string[][];
}

export class CSVImportPlugin {
  private univerAPI: unknown;

  constructor(univerAPI: unknown) {
    this.univerAPI = univerAPI;
  }

  triggerFileSelect(): Promise<CSVData | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.txt';
      input.style.display = 'none';
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const csvData = await this.processCSVFile(file);
            resolve(csvData);
          } catch (error) {
            console.error('Erro ao processar arquivo CSV:', error);
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

  private processCSVFile(file: File): Promise<CSVData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          const parsedData = this.parseCSV(csvText);
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  private parseCSV(csvText: string): CSVData {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) {
      throw new Error('Arquivo CSV vazio');
    }

    const allRows = lines.map(line => this.parseCSVLine(line));
    
    const headers = allRows[0] || [];
    const rows = allRows.slice(1);

    return {
      headers,
      rows
    };
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current.trim());
    return result.map(field => field.replace(/^"|"$/g, ''));
  }

  importToNewWorkbook(csvData: CSVData): void {
    try {
      const workbookData = this.convertToUniverFormat(csvData);
      
      (this.univerAPI as { createWorkbook: (data: unknown) => void }).createWorkbook({
        name: 'Imported CSV',
        sheets: {
          'Sheet1': {
            name: 'Dados CSV',
            cellData: workbookData,
            rowCount: Math.max(csvData.rows.length + 1, 50),
            columnCount: Math.max(csvData.headers.length, 26)
          }
        }
      });
    } catch (error) {
      console.error('Erro ao criar workbook:', error);
      throw new Error('Erro ao importar dados para planilha');
    }
  }

  insertAtCurrentPosition(csvData: CSVData): void {
    try {
      const allRows = [csvData.headers, ...csvData.rows];
      
      allRows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const value = this.parseValue(cell);
          
          (this.univerAPI as { getActiveWorkbook: () => { getActiveSheet: () => { getRange: (row: number, col: number) => { setValue: (value: unknown) => void } } } }).getActiveWorkbook()?.getActiveSheet()?.getRange(rowIndex, colIndex)?.setValue(value);
        });
      });

      (this.univerAPI as { refresh?: () => void }).refresh?.();
    } catch (error) {
      console.error('Erro ao inserir na posição atual:', error);
      throw new Error('Erro ao inserir dados na planilha');
    }
  }

  private convertToUniverFormat(csvData: CSVData): Record<number, Record<number, unknown>> {
    const cellData: Record<number, Record<number, unknown>> = {};
    const allRows = [csvData.headers, ...csvData.rows];
    
    allRows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (!cellData[rowIndex]) {
          cellData[rowIndex] = {};
        }
        
        const value = this.parseValue(cell);
        
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

  previewCSV(csvData: CSVData, maxRows: number = 5): { headers: string[]; preview: string[][]; totalRows: number } {
    return {
      headers: csvData.headers,
      preview: csvData.rows.slice(0, maxRows),
      totalRows: csvData.rows.length
    };
  }
}