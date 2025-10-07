import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getContasAReceber = tool({
  description: 'Busca contas a receber do banco de dados focado em datas de vencimento e status',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Número máximo de resultados'),
    status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional()
      .describe('Filtrar por status da conta'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo da conta (em reais)'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo da conta (em reais)'),
    vence_em_dias: z.number().optional()
      .describe('Vence nos próximos X dias'),
    vencimento_ate: z.string().optional()
      .describe('Vence até esta data (formato: YYYY-MM-DD)'),
    vencimento_de: z.string().optional()
      .describe('Vence a partir desta data (formato: YYYY-MM-DD)'),
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
      // Buscar dados via RPC
      const { data, error } = await supabase.rpc('fetch_table_data', {
        p_schema: 'gestaofinanceira',
        p_table: 'contas_a_receber',
        p_order_column: 'criado_em',
        p_limit: 1000
      });

      if (error) throw error;

      let dataFiltrada = data || [];

      // FILTROS BÁSICOS
      if (status) {
        dataFiltrada = dataFiltrada.filter(c => c.status === status);
      }

      // FILTROS DE VALOR
      if (valor_minimo !== undefined) {
        dataFiltrada = dataFiltrada.filter(c => c.valor >= valor_minimo);
      }

      if (valor_maximo !== undefined) {
        dataFiltrada = dataFiltrada.filter(c => c.valor <= valor_maximo);
      }

      // FILTROS DE DATA
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (vence_em_dias !== undefined) {
        const dataLimite = new Date(hoje);
        dataLimite.setDate(hoje.getDate() + vence_em_dias);

        dataFiltrada = dataFiltrada.filter(c => {
          const venc = new Date(c.data_vencimento);
          return venc >= hoje && venc <= dataLimite;
        });
      }

      if (vencimento_ate) {
        const dataLimite = new Date(vencimento_ate);
        dataFiltrada = dataFiltrada.filter(c => {
          const venc = new Date(c.data_vencimento);
          return venc <= dataLimite;
        });
      }

      if (vencimento_de) {
        const dataInicio = new Date(vencimento_de);
        dataFiltrada = dataFiltrada.filter(c => {
          const venc = new Date(c.data_vencimento);
          return venc >= dataInicio;
        });
      }

      if (venceu_ha_dias !== undefined) {
        const dataInicio = new Date(hoje);
        dataInicio.setDate(hoje.getDate() - venceu_ha_dias);

        dataFiltrada = dataFiltrada.filter(c => {
          const venc = new Date(c.data_vencimento);
          return venc >= dataInicio && venc < hoje;
        });
      }

      // PROCESSAR RESULTADOS
      let totalValor = 0;

      const dataProcessada = dataFiltrada.map(conta => {
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

      // Ordenar por data de vencimento
      dataProcessada.sort((a, b) => {
        const dateA = new Date(a.data_vencimento).getTime();
        const dateB = new Date(b.data_vencimento).getTime();
        return dateA - dateB;
      });

      // Limitar resultados
      const resultados = dataProcessada.slice(0, limit ?? 10);

      return {
        success: true,
        count: resultados.length,
        total_valor: totalValor,
        message: `✅ ${resultados.length} conta${resultados.length !== 1 ? 's' : ''} a receber encontrada${resultados.length !== 1 ? 's' : ''} (Total: R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
        data: resultados
      };

    } catch (error) {
      console.error('ERRO getContasAReceber:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '❌ Erro ao buscar contas a receber',
        data: []
      };
    }
  }
});
