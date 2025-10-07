import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getFinancialData = tool({
  description: 'Busca dados financeiros (contas a pagar ou receber) do banco de dados',
  inputSchema: z.object({
    table: z.enum(['contas_a_pagar', 'contas_a_receber']).describe('Tabela a consultar'),
    limit: z.number().default(10).describe('Número máximo de resultados'),
  }),

  execute: async ({ table, limit }) => {
    try {
      const { data, error } = await supabase
        .schema('gestaofinanceira')
        .from(table)
        .select('*')
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        count: (data || []).length,
        message: `✅ ${(data || []).length} registros encontrados em ${table}`,
        data: data || []
      };

    } catch (error) {
      console.error('ERRO getFinancialData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao buscar dados de ${table}`,
        data: []
      };
    }
  }
});
