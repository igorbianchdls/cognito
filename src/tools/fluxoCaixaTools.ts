import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Tool 1: Calcular Fluxo de Caixa por periodo
export const calcularFluxoCaixa = tool({
  description: 'Calcula projecoes de fluxo de caixa com precisao matematica para um periodo especifico (7, 30 ou 90 dias)',
  inputSchema: z.object({
    dias: z.number().describe('Periodo de projecao em dias (7, 30, 90)'),
    saldo_inicial: z.number().optional().describe('Saldo inicial em caixa (opcional)')
  }),
  execute: async ({ dias, saldo_inicial = 0 }) => {
    try {
      const hoje = new Date();
      const dataLimite = new Date(hoje);
      dataLimite.setDate(dataLimite.getDate() + dias);

      // Buscar contas a receber pendentes
      const { data: entradas, error: errorEntradas } = await supabase
        .from('accounts_receivable')
        .select('*')
        .in('status', ['pendente', 'vencido']);

      if (errorEntradas) throw errorEntradas;

      // Buscar contas a pagar pendentes
      const { data: saidas, error: errorSaidas } = await supabase
        .from('accounts_payable')
        .select('*')
        .in('status', ['pendente', 'vencido']);

      if (errorSaidas) throw errorSaidas;

      // CALCULOS MATEMATICOS PRECISOS (TypeScript, nao IA)
      const entradasNoPeriodo = (entradas || [])
        .filter(c => {
          if (!c.data_vencimento) return false;
          const vencimento = new Date(c.data_vencimento);
          return vencimento <= dataLimite;
        })
        .reduce((sum, c) => sum + (c.valor_pendente || 0), 0);

      const saidasNoPeriodo = (saidas || [])
        .filter(c => {
          if (!c.data_vencimento) return false;
          const vencimento = new Date(c.data_vencimento);
          return vencimento <= dataLimite;
        })
        .reduce((sum, c) => sum + (c.valor_pendente || 0), 0);

      const saldoProjetado = saldo_inicial + entradasNoPeriodo - saidasNoPeriodo;

      // Contar contas vencidas
      const entradasVencidas = (entradas || [])
        .filter(c => c.status === 'vencido')
        .reduce((sum, c) => sum + (c.valor_pendente || 0), 0);

      const saidasVencidas = (saidas || [])
        .filter(c => c.status === 'vencido')
        .reduce((sum, c) => sum + (c.valor_pendente || 0), 0);

      return {
        success: true,
        periodo_dias: dias,
        saldo_inicial,
        entradas_previstas: entradasNoPeriodo,
        saidas_previstas: saidasNoPeriodo,
        saldo_projetado: saldoProjetado,
        status_fluxo: saldoProjetado >= 0 ? 'positivo' : 'deficit',
        entradas_vencidas: entradasVencidas,
        saidas_vencidas: saidasVencidas,
        total_contas_receber: entradas?.length || 0,
        total_contas_pagar: saidas?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao calcular fluxo de caixa'
      };
    }
  }
});

// Tool 2: Calcular Burn Rate (taxa de queima de caixa)
export const calcularBurnRate = tool({
  description: 'Calcula o burn rate (gasto medio diario e mensal) baseado nas contas pagas nos ultimos 30 dias',
  inputSchema: z.object({
    dias_analise: z.number().default(30).describe('Periodo de analise em dias (padrao: 30)')
  }),
  execute: async ({ dias_analise = 30 }) => {
    try {
      const hoje = new Date();
      const dataInicio = new Date(hoje);
      dataInicio.setDate(dataInicio.getDate() - dias_analise);

      // Buscar contas a pagar pagas no periodo
      const { data: contasPagas, error } = await supabase
        .from('accounts_payable')
        .select('*')
        .eq('status', 'pago')
        .gte('updated_at', dataInicio.toISOString());

      if (error) throw error;

      // CALCULOS MATEMATICOS PRECISOS
      const totalGasto = (contasPagas || [])
        .reduce((sum, c) => sum + (c.valor_total || 0), 0);

      const burnRateDiario = totalGasto / dias_analise;
      const burnRateMensal = burnRateDiario * 30;
      const burnRateAnual = burnRateMensal * 12;

      // Calcular por categoria
      const gastoPorCategoria: Record<string, number> = {};
      (contasPagas || []).forEach(conta => {
        const categoria = conta.categoria || 'Sem Categoria';
        gastoPorCategoria[categoria] = (gastoPorCategoria[categoria] || 0) + (conta.valor_total || 0);
      });

      return {
        success: true,
        periodo_dias: dias_analise,
        total_gasto: totalGasto,
        burn_rate_diario: burnRateDiario,
        burn_rate_mensal: burnRateMensal,
        burn_rate_anual: burnRateAnual,
        gasto_por_categoria: gastoPorCategoria,
        total_contas_pagas: contasPagas?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao calcular burn rate'
      };
    }
  }
});

// Tool 3: Calcular Runway (quantos meses de caixa restam)
export const calcularRunway = tool({
  description: 'Calcula o runway (quantos meses de caixa restam) baseado no saldo atual e burn rate',
  inputSchema: z.object({
    saldo_atual: z.number().describe('Saldo atual em caixa'),
    considerar_receitas: z.boolean().default(false).describe('Considerar receitas previstas no calculo')
  }),
  execute: async ({ saldo_atual, considerar_receitas = false }) => {
    try {
      // Calcular burn rate dos ultimos 30 dias
      const hoje = new Date();
      const dataInicio = new Date(hoje);
      dataInicio.setDate(dataInicio.getDate() - 30);

      const { data: contasPagas } = await supabase
        .from('accounts_payable')
        .select('*')
        .eq('status', 'pago')
        .gte('updated_at', dataInicio.toISOString());

      const totalGasto = (contasPagas || [])
        .reduce((sum, c) => sum + (c.valor_total || 0), 0);

      const burnRateMensal = (totalGasto / 30) * 30;

      let receitasMensais = 0;
      if (considerar_receitas) {
        const { data: contasRecebidas } = await supabase
          .from('accounts_receivable')
          .select('*')
          .eq('status', 'pago')
          .gte('updated_at', dataInicio.toISOString());

        const totalRecebido = (contasRecebidas || [])
          .reduce((sum, c) => sum + (c.valor_total || 0), 0);

        receitasMensais = (totalRecebido / 30) * 30;
      }

      // CALCULOS MATEMATICOS PRECISOS
      const queimaMensal = burnRateMensal - receitasMensais;
      const runwayMeses = queimaMensal > 0 ? saldo_atual / queimaMensal : Infinity;
      const runwayDias = queimaMensal > 0 ? (saldo_atual / (queimaMensal / 30)) : Infinity;

      // Calcular data estimada de esgotamento
      let dataEsgotamento = null;
      if (runwayDias !== Infinity) {
        const dataEsgot = new Date(hoje);
        dataEsgot.setDate(dataEsgot.getDate() + Math.floor(runwayDias));
        dataEsgotamento = dataEsgot.toISOString().split('T')[0];
      }

      return {
        success: true,
        saldo_atual,
        burn_rate_mensal: burnRateMensal,
        receitas_mensais: receitasMensais,
        queima_liquida_mensal: queimaMensal,
        runway_meses: runwayMeses === Infinity ? 'Indefinido' : runwayMeses,
        runway_dias: runwayDias === Infinity ? 'Indefinido' : Math.floor(runwayDias),
        data_esgotamento: dataEsgotamento,
        status_saude: runwayMeses === Infinity ? 'excelente' :
                      runwayMeses > 12 ? 'excelente' :
                      runwayMeses > 6 ? 'bom' :
                      runwayMeses > 3 ? 'alerta' : 'critico'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao calcular runway'
      };
    }
  }
});
