import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { z } from 'zod';
import { tool } from 'ai';
import path from 'path';

export const readFiles = tool({
  description: 'Lê o conteúdo de um arquivo do sistema de arquivos',
  inputSchema: z.object({
    filePath: z.string().describe('Caminho do arquivo para ler (absoluto ou relativo)'),
    encoding: z.string().default('utf8').describe('Codificação do arquivo (utf8, base64, etc.)')
  }),
  execute: async ({ filePath, encoding }) => {
    try {
      const content = await readFile(filePath, encoding as BufferEncoding);
      return {
        success: true,
        content: content.toString(),
        message: `✅ Arquivo lido com sucesso: ${filePath}`,
        size: content.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: `❌ Erro ao ler arquivo: ${filePath}`
      };
    }
  }
});

export const listDirectoryTool = tool({
  description: 'Lista arquivos e pastas em um diretório',
  inputSchema: z.object({
    dirPath: z.string().describe('Caminho do diretório para listar'),
    showHidden: z.boolean().default(false).describe('Mostrar arquivos ocultos (que começam com .)')
  }),
  execute: async ({ dirPath, showHidden }) => {
    try {
      const items = await readdir(dirPath);
      const filteredItems = showHidden ? items : items.filter(item => !item.startsWith('.'));

      // Obter informações detalhadas de cada item
      const itemDetails = await Promise.all(
        filteredItems.map(async (item) => {
          try {
            const itemPath = path.join(dirPath, item);
            const stats = await stat(itemPath);
            return {
              name: item,
              type: stats.isDirectory() ? 'directory' : 'file',
              size: stats.size,
              modified: stats.mtime.toISOString()
            };
          } catch {
            return {
              name: item,
              type: 'unknown',
              size: 0,
              modified: null
            };
          }
        })
      );

      return {
        success: true,
        items: itemDetails,
        count: itemDetails.length,
        message: `✅ Listado ${itemDetails.length} itens em: ${dirPath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: `❌ Erro ao listar diretório: ${dirPath}`
      };
    }
  }
});

export const writeFiles = tool({
  description: 'Cria ou sobrescreve um arquivo com o conteúdo especificado',
  inputSchema: z.object({
    filePath: z.string().describe('Caminho do arquivo para criar/sobrescrever'),
    content: z.string().describe('Conteúdo do arquivo'),
    encoding: z.string().default('utf8').describe('Codificação do arquivo (utf8, base64, etc.)')
  }),
  execute: async ({ filePath, content, encoding }) => {
    try {
      await writeFile(filePath, content, encoding as BufferEncoding);
      return {
        success: true,
        message: `✅ Arquivo criado/atualizado com sucesso: ${filePath}`,
        size: content.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: `❌ Erro ao escrever arquivo: ${filePath}`
      };
    }
  }
});

export const editFiles = tool({
  description: 'Edita um arquivo existente usando operações de find & replace',
  inputSchema: z.object({
    filePath: z.string().describe('Caminho do arquivo para editar'),
    operation: z.enum(['replace', 'replaceAll', 'insertAfter', 'insertBefore']).describe('Tipo de operação'),
    oldText: z.string().describe('Texto a ser encontrado (para replace) ou texto de referência (para insert)'),
    newText: z.string().describe('Novo texto para substituir ou inserir'),
    encoding: z.string().default('utf8').describe('Codificação do arquivo')
  }),
  execute: async ({ filePath, operation, oldText, newText, encoding }) => {
    try {
      // Ler arquivo atual
      const currentContent = await readFile(filePath, encoding as BufferEncoding);
      let content = currentContent.toString();

      // Aplicar operação
      switch (operation) {
        case 'replace':
          if (!content.includes(oldText)) {
            return {
              success: false,
              error: 'Texto não encontrado no arquivo',
              message: `❌ Texto "${oldText}" não encontrado em: ${filePath}`
            };
          }
          content = content.replace(oldText, newText);
          break;

        case 'replaceAll':
          content = content.replaceAll(oldText, newText);
          break;

        case 'insertAfter':
          if (!content.includes(oldText)) {
            return {
              success: false,
              error: 'Texto de referência não encontrado',
              message: `❌ Texto de referência "${oldText}" não encontrado em: ${filePath}`
            };
          }
          content = content.replace(oldText, oldText + newText);
          break;

        case 'insertBefore':
          if (!content.includes(oldText)) {
            return {
              success: false,
              error: 'Texto de referência não encontrado',
              message: `❌ Texto de referência "${oldText}" não encontrado em: ${filePath}`
            };
          }
          content = content.replace(oldText, newText + oldText);
          break;
      }

      // Salvar arquivo editado
      await writeFile(filePath, content, encoding as BufferEncoding);

      return {
        success: true,
        message: `✅ Arquivo editado com sucesso: ${filePath}`,
        operation,
        size: content.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: `❌ Erro ao editar arquivo: ${filePath}`
      };
    }
  }
});