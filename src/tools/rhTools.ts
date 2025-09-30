import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getRHCandidates = tool({
  description: 'Busca candidatos e entrevistas de RH do banco de dados com transcrições e análises',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Número máximo de resultados'),
    status: z.enum(['em_analise', 'aprovado', 'reprovado']).optional().describe('Filtrar por status do candidato'),
    vaga: z.string().optional().describe('Filtrar por vaga específica')
  }),
  execute: async ({ limit, status, vaga }) => {
    try {
      let query = supabase
        .from('rh_candidates')
        .select('*')
        .order('data_entrevista', { ascending: false })
        .limit(limit ?? 10);

      if (status) {
        query = query.eq('status', status);
      }

      if (vaga) {
        query = query.ilike('vaga', `%${vaga}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: data?.length || 0,
        data: data,
        message: `✅ ${data?.length || 0} candidato${data?.length !== 1 ? 's' : ''} encontrado${data?.length !== 1 ? 's' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: '❌ Erro ao buscar candidatos'
      };
    }
  }
});
