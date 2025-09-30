import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getSalesCalls = tool({
  description: 'Busca calls de vendas gravadas do banco de dados com suas transcrições e análises',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Número máximo de resultados'),
    status: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost']).optional().describe('Filtrar por status da oportunidade'),
    sales_rep: z.string().optional().describe('Filtrar por vendedor específico')
  }),
  execute: async ({ limit, status, sales_rep }) => {
    try {
      let query = supabase
        .from('sales_calls')
        .select('*')
        .order('call_date', { ascending: false })
        .limit(limit ?? 10);

      if (status) {
        query = query.eq('status', status);
      }

      if (sales_rep) {
        query = query.eq('sales_rep', sales_rep);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: data?.length || 0,
        data: data,
        message: `✅ ${data?.length || 0} call${data?.length !== 1 ? 's' : ''} de vendas encontrada${data?.length !== 1 ? 's' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: '❌ Erro ao buscar calls de vendas'
      };
    }
  }
});
