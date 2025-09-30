import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getServiceOrders = tool({
  description: 'Busca ordens de serviço (OS) do banco de dados com detalhes técnicos e status',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Número máximo de resultados'),
    status: z.enum(['aberta', 'em_andamento', 'aguardando_pecas', 'concluida', 'cancelada']).optional().describe('Filtrar por status da OS'),
    tecnico_responsavel: z.string().optional().describe('Filtrar por técnico responsável')
  }),
  execute: async ({ limit, status, tecnico_responsavel }) => {
    try {
      let query = supabase
        .from('service_orders')
        .select('*')
        .order('data_abertura', { ascending: false })
        .limit(limit ?? 10);

      if (status) {
        query = query.eq('status', status);
      }

      if (tecnico_responsavel) {
        query = query.ilike('tecnico_responsavel', `%${tecnico_responsavel}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: data?.length || 0,
        data: data,
        message: `✅ ${data?.length || 0} ordem${data?.length !== 1 ? 'ns' : ''} de serviço encontrada${data?.length !== 1 ? 's' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: '❌ Erro ao buscar ordens de serviço'
      };
    }
  }
});
