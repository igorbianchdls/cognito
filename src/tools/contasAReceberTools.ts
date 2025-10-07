import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getContasAReceber = tool({
  description: 'Busca contas a receber do banco de dados focado em datas de vencimento e status',
  inputSchema: z.object({
    // Paginação
    limit: z.number().default(10).describe('Número máximo de resultados'),

    // Filtros básicos
    status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional()
      .describe('Filtrar por status da conta'),

    // Filtros de valor
    valor_minimo: z.number().optional()
      .describe('Valor mínimo da conta (em reais)'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo da conta (em reais)'),

    // Filtros de data - vencimento futuro
    vence_em_dias: z.number().optional()
      .describe('Vence nos próximos X dias'),
    vencimento_ate: z.string().optional()
      .describe('Vence até esta data (formato: YYYY-MM-DD)'),
    vencimento_de: z.string().optional()
      .describe('Vence a partir desta data (formato: YYYY-MM-DD)'),

    // Filtros de data - vencimento passado
    venceu_ha_dias: z.number().optional()
      .describe('Venceu nos últimos X dias'),
  }),

  execute: async ({
    limit,
    status,
    valor_minimo,
    valor_maximo,
    vence_em_dias,
    vencimento_ate,
    vencimento_de,
    venceu_ha_dias
  }) => {
    try {
      // Query base simples - SEM JOINs
      let query = supabase
        .schema('gestaofinanceira')
        .from('contas_a_receber')
        .select('*')
        .order('data_vencimento', { ascending: true })
        .limit(limit ?? 10);

      // FILTROS BÁSICOS
      if (status) {
        query = query.eq('status', status);
      }

      // FILTROS DE VALOR
      if (valor_minimo !== undefined) {
        query = query.gte('valor', valor_minimo);
      }

      if (valor_maximo !== undefined) {
        query = query.lte('valor', valor_maximo);
      }

      // FILTROS DE DATA
      // Vence nos próximos X dias
      if (vence_em_dias !== undefined) {
        const hoje = new Date();
        const dataLimite = new Date();
        dataLimite.setDate(hoje.getDate() + vence_em_dias);

        query = query
          .gte('data_vencimento', hoje.toISOString().split('T')[0])
          .lte('data_vencimento', dataLimite.toISOString().split('T')[0]);
      }

      // Vence até uma data
      if (vencimento_ate) {
        query = query.lte('data_vencimento', vencimento_ate);
      }

      // Vence a partir de uma data
      if (vencimento_de) {
        query = query.gte('data_vencimento', vencimento_de);
      }

      // Venceu nos últimos X dias
      if (venceu_ha_dias !== undefined) {
        const hoje = new Date();
        const dataInicio = new Date();
        dataInicio.setDate(hoje.getDate() - venceu_ha_dias);

        query = query
          .gte('data_vencimento', dataInicio.toISOString().split('T')[0])
          .lt('data_vencimento', hoje.toISOString().split('T')[0]);
      }

      // EXECUTAR QUERY
      const { data, error } = await query;

      if (error) throw error;

      // PROCESSAR RESULTADOS
      const hoje = new Date();
      let totalValor = 0;

      const dataProcessada = (data || []).map(conta => {
        const vencimento = new Date(conta.data_vencimento);
        const diffTime = vencimento.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        totalValor += conta.valor || 0;

        return {
          ...conta,
          dias_ate_vencimento: diffDays,
          status_vencimento: diffDays < 0 ? 'vencido' :
                           diffDays === 0 ? 'vence_hoje' :
                           diffDays <= 7 ? 'vence_em_breve' : 'normal'
        };
      });

      // RETORNAR RESULTADO
      return {
        success: true,
        count: dataProcessada.length,
        total_valor: totalValor,
        message: `✅ ${dataProcessada.length} conta${dataProcessada.length !== 1 ? 's' : ''} a receber encontrada${dataProcessada.length !== 1 ? 's' : ''} (Total: R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
        data: dataProcessada
      };

    } catch (error) {
      console.error('ERRO COMPLETO getContasAReceber:', error);
      console.error('ERRO STACK:', error instanceof Error ? error.stack : 'sem stack');
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao buscar contas a receber',
        data: []
      };
    }
  }
});
