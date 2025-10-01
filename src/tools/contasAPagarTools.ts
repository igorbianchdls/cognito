import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getContasAPagar = tool({
  description: 'Busca contas a pagar do banco de dados com informacoes de pagamento e status',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Numero maximo de resultados'),
    status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional().describe('Filtrar por status da conta'),
    fornecedor_nome: z.string().optional().describe('Filtrar por nome do fornecedor'),
    categoria: z.string().optional().describe('Filtrar por categoria (aluguel, salario, fornecedor, imposto, servicos)')
  }),
  execute: async ({ limit, status, fornecedor_nome, categoria }) => {
    try {
      let query = supabase
        .from('accounts_payable')
        .select('*')
        .order('data_emissao', { ascending: false })
        .limit(limit ?? 10);

      if (status) {
        query = query.eq('status', status);
      }

      if (fornecedor_nome) {
        query = query.ilike('fornecedor_nome', `%${fornecedor_nome}%`);
      }

      if (categoria) {
        query = query.ilike('categoria', `%${categoria}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: data?.length || 0,
        data: data,
        message: `${data?.length || 0} conta${data?.length !== 1 ? 's' : ''} a pagar encontrada${data?.length !== 1 ? 's' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao buscar contas a pagar'
      };
    }
  }
});
