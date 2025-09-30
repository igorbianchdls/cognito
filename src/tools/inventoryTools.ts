import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getInventory = tool({
  description: 'Busca itens do inventario/estoque do banco de dados com informacoes de quantidade, localizacao e status',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Numero maximo de resultados'),
    status: z.enum(['disponivel', 'baixo_estoque', 'esgotado', 'descontinuado']).optional().describe('Filtrar por status do item'),
    categoria: z.string().optional().describe('Filtrar por categoria do produto'),
    nome_produto: z.string().optional().describe('Filtrar por nome do produto')
  }),
  execute: async ({ limit, status, categoria, nome_produto }) => {
    try {
      let query = supabase
        .from('inventory')
        .select('*')
        .order('nome_produto', { ascending: true })
        .limit(limit ?? 10);

      if (status) {
        query = query.eq('status', status);
      }

      if (categoria) {
        query = query.ilike('categoria', `%${categoria}%`);
      }

      if (nome_produto) {
        query = query.ilike('nome_produto', `%${nome_produto}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: data?.length || 0,
        data: data,
        message: `${data?.length || 0} ${data?.length !== 1 ? 'itens' : 'item'} encontrado${data?.length !== 1 ? 's' : ''} no estoque`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao buscar itens do estoque'
      };
    }
  }
});
