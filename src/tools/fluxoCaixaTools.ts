import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const formatSqlParams = (params: unknown[]) =>
  params.length ? JSON.stringify(params) : '[]';

const normalizePeriodo = (dias: number) => {
  const allowed = [7, 30, 90];
  if (allowed.includes(dias)) return dias;
  if (dias < 7) return 7;
  if (dias > 90) return 90;
  // fallback para o mais próximo
  return allowed.reduce((prev, curr) =>
    Math.abs(curr - dias) < Math.abs(prev - dias) ? curr : prev,
  30);
};

export const calcularFluxoCaixa = tool({
  description: 'Calcula projeções de fluxo de caixa (entradas, saídas e saldo projetado) para 7, 30 ou 90 dias.',
  inputSchema: z.object({
    dias: z.number().describe('Período de projeção em dias (recomendado: 7, 30 ou 90)'),
    saldo_inicial: z.number().optional().describe('Saldo inicial em caixa'),
  }),
  execute: async ({ dias, saldo_inicial = 0 }) => {
    try {
      const periodo = normalizePeriodo(dias);

      const fluxoSql = `
        WITH periodo AS (
          SELECT
            CURRENT_DATE AS hoje,
            CURRENT_DATE + ($1::int) * INTERVAL '1 day' AS limite
        ),
        receber AS (
          SELECT
            SUM(CASE WHEN COALESCE(cr.data_vencimento, CURRENT_DATE) <= periodo.limite THEN COALESCE(cr.valor, 0) ELSE 0 END) AS previstas,
            SUM(CASE WHEN COALESCE(cr.data_vencimento, CURRENT_DATE) < periodo.hoje THEN COALESCE(cr.valor, 0) ELSE 0 END) AS vencidas,
            COUNT(*) FILTER (WHERE cr.status IN ('pendente', 'vencido')) AS total
          FROM gestaofinanceira.contas_a_receber cr, periodo
          WHERE cr.status IN ('pendente', 'vencido')
        ),
        pagar AS (
          SELECT
            SUM(CASE WHEN COALESCE(cp.data_vencimento, CURRENT_DATE) <= periodo.limite THEN COALESCE(cp.valor, 0) ELSE 0 END) AS previstas,
            SUM(CASE WHEN COALESCE(cp.data_vencimento, CURRENT_DATE) < periodo.hoje THEN COALESCE(cp.valor, 0) ELSE 0 END) AS vencidas,
            COUNT(*) FILTER (WHERE cp.status IN ('pendente', 'vencido')) AS total
          FROM gestaofinanceira.contas_a_pagar cp, periodo
          WHERE cp.status IN ('pendente', 'vencido')
        )
        SELECT
          COALESCE(receber.previstas, 0) AS entradas_previstas,
          COALESCE(receber.vencidas, 0) AS entradas_vencidas,
          COALESCE(receber.total, 0) AS total_receber,
          COALESCE(pagar.previstas, 0) AS saidas_previstas,
          COALESCE(pagar.vencidas, 0) AS saidas_vencidas,
          COALESCE(pagar.total, 0) AS total_pagar
        FROM receber, pagar;
      `.trim();

      const [fluxo] = await runQuery<{
        entradas_previstas: number | null;
        entradas_vencidas: number | null;
        total_receber: number | null;
        saidas_previstas: number | null;
        saidas_vencidas: number | null;
        total_pagar: number | null;
      }>(fluxoSql, [periodo]);

      const entradasPrevistas = Number(fluxo?.entradas_previstas ?? 0);
      const entradasVencidas = Number(fluxo?.entradas_vencidas ?? 0);
      const totalReceber = Number(fluxo?.total_receber ?? 0);

      const saidasPrevistas = Number(fluxo?.saidas_previstas ?? 0);
      const saidasVencidas = Number(fluxo?.saidas_vencidas ?? 0);
      const totalPagar = Number(fluxo?.total_pagar ?? 0);

      const saldoProjetado = saldo_inicial + entradasPrevistas - saidasPrevistas;

      const rows = [
        {
          categoria: 'Entradas previstas',
          origem: 'contas_a_receber',
          valor: entradasPrevistas,
          valor_vencido: entradasVencidas,
          quantidade: totalReceber,
        },
        {
          categoria: 'Saídas previstas',
          origem: 'contas_a_pagar',
          valor: saidasPrevistas,
          valor_vencido: saidasVencidas,
          quantidade: totalPagar,
        },
        {
          categoria: 'Saldo projetado',
          origem: 'projecao',
          valor: saldoProjetado,
          valor_vencido: null,
          quantidade: null,
        },
      ];

      return {
        success: true,
        periodo_dias: periodo,
        saldo_inicial,
        rows,
        summary: {
          entradas_previstas: entradasPrevistas,
          saidas_previstas: saidasPrevistas,
          saldo_projetado: saldoProjetado,
          entradas_vencidas: entradasVencidas,
          saidas_vencidas: saidasVencidas,
        },
        sql_query: fluxoSql,
        sql_params: formatSqlParams([periodo]),
      };
    } catch (error) {
      console.error('ERRO calcularFluxoCaixa:', error);
      return {
        success: false,
        message: `Erro ao calcular fluxo de caixa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  },
});
