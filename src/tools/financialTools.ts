import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getFinancialData = tool({
  description: 'Busca dados financeiros (contas a pagar ou receber) com filtros básicos',
  inputSchema: z.object({
    table: z.enum(['contas_a_pagar', 'contas_a_receber']).describe('Tabela a consultar'),
    limit: z.number().default(10).describe('Número máximo de resultados'),
    status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional()
      .describe('Filtrar por status'),
    vence_em_dias: z.number().optional()
      .describe('Contas que vencem nos próximos X dias'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo em reais'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo em reais'),
    venceu_ha_dias: z.number().optional()
      .describe('Contas vencidas nos últimos X dias'),
    data_emissao_de: z.string().optional()
      .describe('Data inicial de emissão (formato YYYY-MM-DD)'),
    data_emissao_ate: z.string().optional()
      .describe('Data final de emissão (formato YYYY-MM-DD)'),
  }),

  execute: async ({ table, limit, status, vence_em_dias, valor_minimo, valor_maximo, venceu_ha_dias, data_emissao_de, data_emissao_ate }) => {
    try {
      let query = supabase
        .schema('gestaofinanceira')
        .from(table)
        .select('*');

      // FILTRO 1: Status
      if (status) {
        query = query.eq('status', status);
      }

      // FILTRO 2: Valor mínimo
      if (valor_minimo !== undefined) {
        query = query.gte('valor', valor_minimo);
      }

      // FILTRO 3: Valor máximo
      if (valor_maximo !== undefined) {
        query = query.lte('valor', valor_maximo);
      }

      // FILTRO 4: Vencimento futuro (próximos X dias)
      if (vence_em_dias !== undefined) {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() + vence_em_dias);
        query = query.lte('data_vencimento', dataLimite.toISOString().split('T')[0]);
      }

      // FILTRO 5: Vencido nos últimos X dias
      if (venceu_ha_dias !== undefined) {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - venceu_ha_dias);
        const hoje = new Date().toISOString().split('T')[0];
        query = query
          .gte('data_vencimento', dataLimite.toISOString().split('T')[0])
          .lt('data_vencimento', hoje);
      }

      // FILTRO 6: Data de emissão inicial
      if (data_emissao_de) {
        query = query.gte('data_emissao', data_emissao_de);
      }

      // FILTRO 7: Data de emissão final
      if (data_emissao_ate) {
        query = query.lte('data_emissao', data_emissao_ate);
      }

      // Ordenação padrão por data de vencimento (mais urgente primeiro)
      query = query
        .order('data_vencimento', { ascending: true })
        .limit(limit ?? 10);

      const { data, error } = await query;

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
