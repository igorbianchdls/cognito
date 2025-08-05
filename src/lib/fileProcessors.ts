import Papa from 'papaparse';

export interface ProcessedFileContent {
  content: string;
  summary: string;
  type: 'csv' | 'text' | 'unknown';
  rowCount?: number;
  columnCount?: number;
}

export async function processFile(file: File): Promise<ProcessedFileContent | null> {
  try {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    switch (fileExtension) {
      case 'csv':
        return await processCSV(file);
      case 'txt':
      case 'md':
        return await processText(file);
      default:
        // Tentar processar como texto para outros tipos
        return await processText(file);
    }
  } catch (error) {
    console.error('Erro ao processar arquivo:', error);
    return null;
  }
}

async function processCSV(file: File): Promise<ProcessedFileContent> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string | number>[];
        const headers = Object.keys(data[0] || {});
        
        // Criar um resumo do CSV
        let content = `=== ARQUIVO CSV: ${file.name} ===\n\n`;
        content += `Colunas (${headers.length}): ${headers.join(', ')}\n`;
        content += `Total de linhas: ${data.length}\n\n`;
        
        // Adicionar algumas linhas de exemplo
        content += `=== PRIMEIRAS 5 LINHAS ===\n`;
        const sampleRows = data.slice(0, 5);
        sampleRows.forEach((row, index) => {
          content += `Linha ${index + 1}:\n`;
          headers.forEach(header => {
            content += `  ${header}: ${row[header]}\n`;
          });
          content += '\n';
        });
        
        // Se houver muitos dados, adicionar informações estatísticas básicas
        if (data.length > 10) {
          content += `=== DADOS COMPLETOS ===\n`;
          content += JSON.stringify(data, null, 2);
        }
        
        const summary = `CSV com ${data.length} linhas e ${headers.length} colunas. Colunas: ${headers.join(', ')}`;
        
        resolve({
          content,
          summary,
          type: 'csv',
          rowCount: data.length,
          columnCount: headers.length
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

async function processText(file: File): Promise<ProcessedFileContent> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').length;
      const words = text.split(/\s+/).length;
      const chars = text.length;
      
      let content = `=== ARQUIVO DE TEXTO: ${file.name} ===\n\n`;
      content += `Estatísticas: ${lines} linhas, ${words} palavras, ${chars} caracteres\n\n`;
      content += `=== CONTEÚDO ===\n`;
      content += text;
      
      const summary = `Arquivo de texto com ${lines} linhas e ${words} palavras`;
      
      resolve({
        content,
        summary,
        type: 'text'
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo de texto'));
    };
    
    reader.readAsText(file, 'utf-8');
  });
}

export function getFileTypeFromExtension(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop();
  
  const typeMap: Record<string, string> = {
    'csv': 'CSV',
    'txt': 'Texto',
    'md': 'Markdown',
    'json': 'JSON',
    'xml': 'XML',
    'pdf': 'PDF',
    'doc': 'Word',
    'docx': 'Word',
    'xls': 'Excel',
    'xlsx': 'Excel'
  };
  
  return typeMap[extension || ''] || 'Documento';
}