import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getContasAPagar = tool({
  description: 'Busca contas a pagar do banco de dados',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Número máximo de resultados'),
  }),

  execute: async ({ limit }) => {
    try {
      const { data, error } = await supabase.rpc('fetch_table_data', {
        p_schema: 'gestaofinanceira',
        p_table: 'contas_a_pagar',
        p_order_column: 'criado_em',
        p_limit: limit ?? 10
      });

      if (error) throw error;

      return {
        success: true,
        count: (data || []).length,
        message: `✅ ${(data || []).length} contas a pagar encontradas`,
        data: data || []
      };

    } catch (error) {
      console.error('ERRO getContasAPagar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao buscar contas a pagar',
        data: []
      };
    }
  }
});
