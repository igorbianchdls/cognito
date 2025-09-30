import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getNotasFiscais = tool({
  description: 'Busca notas fiscais eletrônicas (NFe) do banco de dados',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Número máximo de resultados'),
    status: z.enum(['autorizada', 'cancelada', 'denegada', 'inutilizada']).optional().describe('Filtrar por status da NFe'),
    tipo: z.enum(['entrada', 'saida']).optional().describe('Filtrar por tipo de operação'),
    emitente_cnpj: z.string().optional().describe('Filtrar por CNPJ do emitente'),
    destinatario_cnpj: z.string().optional().describe('Filtrar por CNPJ do destinatário')
  }),
  execute: async ({ limit, status, tipo, emitente_cnpj, destinatario_cnpj }) => {
    try {
      let query = supabase
        .from('notas_fiscais')
        .select('*')
        .order('data_emissao', { ascending: false })
        .limit(limit ?? 10);

      if (status) {
        query = query.eq('status', status);
      }

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      if (emitente_cnpj) {
        query = query.eq('emitente_cnpj', emitente_cnpj);
      }

      if (destinatario_cnpj) {
        query = query.eq('destinatario_cnpj', destinatario_cnpj);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: data?.length || 0,
        data: data,
        message: `✅ ${data?.length || 0} nota${data?.length !== 1 ? 's' : ''} fiscal${data?.length !== 1 ? 'ais' : ''} encontrada${data?.length !== 1 ? 's' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: '❌ Erro ao buscar notas fiscais'
      };
    }
  }
});
