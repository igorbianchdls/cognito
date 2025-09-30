import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getContasAReceber = tool({
  description: 'Busca contas a receber do banco de dados com informações de pagamento e status',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Número máximo de resultados'),
    status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional().describe('Filtrar por status da conta'),
    cliente_nome: z.string().optional().describe('Filtrar por nome do cliente')
  }),
  execute: async ({ limit, status, cliente_nome }) => {
    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .order('data_emissao', { ascending: false })
        .limit(limit ?? 10);

      if (status) {
        query = query.eq('status', status);
      }

      if (cliente_nome) {
        query = query.ilike('cliente_nome', `%${cliente_nome}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: data?.length || 0,
        data: data,
        message: `✅ ${data?.length || 0} conta${data?.length !== 1 ? 's' : ''} a receber encontrada${data?.length !== 1 ? 's' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: '❌ Erro ao buscar contas a receber'
      };
    }
  }
});
