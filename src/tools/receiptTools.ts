import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getReceipts = tool({
  description: 'Busca recibos e solicitações de reembolso do banco de dados',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Número máximo de resultados'),
    status: z.enum(['pendente', 'aprovado', 'reprovado', 'reembolsado']).optional().describe('Filtrar por status do recibo'),
    tipo: z.enum(['reembolso', 'compra', 'servico', 'doacao', 'outros']).optional().describe('Filtrar por tipo de recibo'),
    solicitante_nome: z.string().optional().describe('Filtrar por nome do solicitante')
  }),
  execute: async ({ limit, status, tipo, solicitante_nome }) => {
    try {
      let query = supabase
        .from('receipts')
        .select('*')
        .order('data_envio', { ascending: false })
        .limit(limit ?? 10);

      if (status) {
        query = query.eq('status', status);
      }

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      if (solicitante_nome) {
        query = query.ilike('solicitante_nome', `%${solicitante_nome}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: data?.length || 0,
        data: data,
        message: `✅ ${data?.length || 0} recibo${data?.length !== 1 ? 's' : ''} encontrado${data?.length !== 1 ? 's' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: '❌ Erro ao buscar recibos'
      };
    }
  }
});
