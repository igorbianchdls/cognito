import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getExtratosBancarios = tool({
  description: 'Busca extratos bancários importados do banco (CSV/OFX). Use para ver transações que realmente aconteceram no banco e preparar conciliação com movimentos do sistema.',
  inputSchema: z.object({
    limit: z.number().default(50).describe('Número máximo de resultados'),
    conta_id: z.string().optional()
      .describe('Filtrar por ID da conta bancária'),
    data_inicial: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_final: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),
    conciliado: z.boolean().optional()
      .describe('Filtrar por status de conciliação: true = conciliados, false = não conciliados, undefined = todos'),
    tipo: z.enum(['credito', 'debito', 'taxa', 'estorno']).optional()
      .describe('Filtrar por tipo de transação'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo em reais (use valores negativos para débitos)'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo em reais'),
  }),

  execute: async ({
    limit,
    conta_id,
    data_inicial,
    data_final,
    conciliado,
    tipo,
    valor_minimo,
    valor_maximo
  }) => {
    try {
      let query = supabase
        .schema('gestaofinanceira')
        .from('extratos_bancarios')
        .select('*');

      // FILTRO 1: Conta bancária
      if (conta_id) {
        query = query.eq('conta_id', conta_id);
      }

      // FILTRO 2: Data inicial
      if (data_inicial) {
        query = query.gte('data', data_inicial);
      }

      // FILTRO 3: Data final
      if (data_final) {
        query = query.lte('data', data_final);
      }

      // FILTRO 4: Status de conciliação
      if (conciliado !== undefined) {
        query = query.eq('conciliado', conciliado);
      }

      // FILTRO 5: Tipo de transação
      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      // FILTRO 6: Valor mínimo
      if (valor_minimo !== undefined) {
        query = query.gte('valor', valor_minimo);
      }

      // FILTRO 7: Valor máximo
      if (valor_maximo !== undefined) {
        query = query.lte('valor', valor_maximo);
      }

      // Ordenação padrão por data (mais recente primeiro)
      query = query
        .order('data', { ascending: false })
        .limit(limit ?? 50);

      const { data, error } = await query;

      if (error) throw error;

      // Calcular estatísticas
      const extratos = data || [];

      const totalCreditos = extratos
        .filter(e => e.valor > 0)
        .reduce((sum, e) => sum + (e.valor || 0), 0);

      const totalDebitos = extratos
        .filter(e => e.valor < 0)
        .reduce((sum, e) => sum + (e.valor || 0), 0);

      const saldoLiquido = totalCreditos + totalDebitos; // débitos já são negativos

      const qtdConciliados = extratos.filter(e => e.conciliado === true).length;
      const qtdNaoConciliados = extratos.filter(e => e.conciliado === false || e.conciliado === null).length;

      return {
        success: true,
        count: extratos.length,
        total_creditos: totalCreditos,
        total_debitos: totalDebitos,
        saldo_liquido: saldoLiquido,
        conciliados: qtdConciliados,
        nao_conciliados: qtdNaoConciliados,
        message: `✅ ${extratos.length} extratos encontrados (Créditos: R$ ${totalCreditos.toFixed(2)} | Débitos: R$ ${totalDebitos.toFixed(2)} | Saldo: R$ ${saldoLiquido.toFixed(2)} | Conciliados: ${qtdConciliados}/${extratos.length})`,
        data: extratos
      };

    } catch (error) {
      console.error('ERRO getExtratosBancarios:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao buscar extratos bancários`,
        data: []
      };
    }
  }
});
