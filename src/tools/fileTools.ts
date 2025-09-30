import { readFile, readdir, stat } from 'fs/promises';
import { z } from 'zod';
import { tool } from 'ai';
import path from 'path';

export const readFileTool = tool({
  description: 'Lê o conteúdo de um arquivo do sistema de arquivos',
  parameters: z.object({
    filePath: z.string().describe('Caminho do arquivo para ler (absoluto ou relativo)'),
    encoding: z.enum(['utf8', 'base64']).default('utf8').describe('Codificação do arquivo')
  }),
  execute: async ({ filePath, encoding }) => {
    try {
      const content = await readFile(filePath, encoding);
      return {
        success: true,
        content,
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
  parameters: z.object({
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

export const getFileInfoTool = tool({
  description: 'Obtém informações detalhadas sobre um arquivo ou diretório',
  parameters: z.object({
    filePath: z.string().describe('Caminho do arquivo ou diretório')
  }),
  execute: async ({ filePath }) => {
    try {
      const stats = await stat(filePath);
      const parsed = path.parse(filePath);

      return {
        success: true,
        info: {
          path: filePath,
          name: parsed.name,
          extension: parsed.ext,
          directory: parsed.dir,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          accessed: stats.atime.toISOString()
        },
        message: `✅ Informações obtidas para: ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: `❌ Erro ao obter informações: ${filePath}`
      };
    }
  }
});