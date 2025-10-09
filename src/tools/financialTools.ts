import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getContasAReceber = tool({
  description: 'Busca contas a receber (clientes, receitas) com filtros avançados',
  inputSchema: z.object({
    limit: z.number().default(20).describe('Número máximo de resultados'),
    status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional()
      .describe('Filtrar por status do recebimento'),
    cliente_id: z.string().optional()
      .describe('Filtrar por ID do cliente'),
    categoria_id: z.string().optional()
      .describe('Filtrar por ID da categoria'),
    vence_em_dias: z.number().optional()
      .describe('Contas que vencem nos próximos X dias'),
    venceu_ha_dias: z.number().optional()
      .describe('Contas vencidas nos últimos X dias'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo em reais'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo em reais'),
    data_emissao_de: z.string().optional()
      .describe('Data inicial de emissão (formato YYYY-MM-DD)'),
    data_emissao_ate: z.string().optional()
      .describe('Data final de emissão (formato YYYY-MM-DD)'),
  }),

  execute: async ({
    limit,
    status,
    cliente_id,
    categoria_id,
    vence_em_dias,
    venceu_ha_dias,
    valor_minimo,
    valor_maximo,
    data_emissao_de,
    data_emissao_ate
  }) => {
    try {
      let query = supabase
        .schema('gestaofinanceira')
        .from('contas_a_receber')
        .select('*');

      // FILTRO 1: Status
      if (status) {
        query = query.eq('status', status);
      }

      // FILTRO 2: Cliente
      if (cliente_id) {
        query = query.eq('cliente_id', cliente_id);
      }

      // FILTRO 3: Categoria
      if (categoria_id) {
        query = query.eq('categoria_id', categoria_id);
      }

      // FILTRO 4: Valor mínimo
      if (valor_minimo !== undefined) {
        query = query.gte('valor', valor_minimo);
      }

      // FILTRO 5: Valor máximo
      if (valor_maximo !== undefined) {
        query = query.lte('valor', valor_maximo);
      }

      // FILTRO 6: Vencimento futuro (próximos X dias)
      if (vence_em_dias !== undefined) {
        const hoje = new Date();
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() + vence_em_dias);
        query = query
          .gte('data_vencimento', hoje.toISOString().split('T')[0])
          .lte('data_vencimento', dataLimite.toISOString().split('T')[0]);
      }

      // FILTRO 7: Vencido nos últimos X dias
      if (venceu_ha_dias !== undefined) {
        const hoje = new Date();
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - venceu_ha_dias);
        query = query
          .gte('data_vencimento', dataLimite.toISOString().split('T')[0])
          .lt('data_vencimento', hoje.toISOString().split('T')[0]);
      }

      // FILTRO 8: Data de emissão inicial
      if (data_emissao_de) {
        query = query.gte('created_at', data_emissao_de);
      }

      // FILTRO 9: Data de emissão final
      if (data_emissao_ate) {
        query = query.lte('created_at', data_emissao_ate);
      }

      // Ordenação padrão por data de vencimento (mais urgente primeiro)
      query = query
        .order('data_vencimento', { ascending: true })
        .limit(limit ?? 20);

      const { data, error } = await query;

      if (error) throw error;

      // Calcular totais
      const totalValor = (data || []).reduce((sum, item) => sum + (item.valor || 0), 0);

      return {
        success: true,
        count: (data || []).length,
        total_valor: totalValor,
        message: `✅ ${(data || []).length} contas a receber encontradas (Total: R$ ${totalValor.toFixed(2)})`,
        data: data || []
      };

    } catch (error) {
      console.error('ERRO getContasAReceber:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao buscar contas a receber`,
        data: []
      };
    }
  }
});

export const getContasAPagar = tool({
  description: 'Busca contas a pagar (fornecedores, despesas) com filtros avançados',
  inputSchema: z.object({
    limit: z.number().default(20).describe('Número máximo de resultados'),
    status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional()
      .describe('Filtrar por status do pagamento'),
    fornecedor_id: z.string().optional()
      .describe('Filtrar por ID do fornecedor'),
    categoria_id: z.string().optional()
      .describe('Filtrar por ID da categoria'),
    vence_em_dias: z.number().optional()
      .describe('Contas que vencem nos próximos X dias'),
    venceu_ha_dias: z.number().optional()
      .describe('Contas vencidas nos últimos X dias'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo em reais'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo em reais'),
    data_emissao_de: z.string().optional()
      .describe('Data inicial de emissão (formato YYYY-MM-DD)'),
    data_emissao_ate: z.string().optional()
      .describe('Data final de emissão (formato YYYY-MM-DD)'),
  }),

  execute: async ({
    limit,
    status,
    fornecedor_id,
    categoria_id,
    vence_em_dias,
    venceu_ha_dias,
    valor_minimo,
    valor_maximo,
    data_emissao_de,
    data_emissao_ate
  }) => {
    try {
      let query = supabase
        .schema('gestaofinanceira')
        .from('contas_a_pagar')
        .select('*');

      // FILTRO 1: Status
      if (status) {
        query = query.eq('status', status);
      }

      // FILTRO 2: Fornecedor
      if (fornecedor_id) {
        query = query.eq('fornecedor_id', fornecedor_id);
      }

      // FILTRO 3: Categoria
      if (categoria_id) {
        query = query.eq('categoria_id', categoria_id);
      }

      // FILTRO 4: Valor mínimo
      if (valor_minimo !== undefined) {
        query = query.gte('valor', valor_minimo);
      }

      // FILTRO 5: Valor máximo
      if (valor_maximo !== undefined) {
        query = query.lte('valor', valor_maximo);
      }

      // FILTRO 6: Vencimento futuro (próximos X dias)
      if (vence_em_dias !== undefined) {
        const hoje = new Date();
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() + vence_em_dias);
        query = query
          .gte('data_vencimento', hoje.toISOString().split('T')[0])
          .lte('data_vencimento', dataLimite.toISOString().split('T')[0]);
      }

      // FILTRO 7: Vencido nos últimos X dias
      if (venceu_ha_dias !== undefined) {
        const hoje = new Date();
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - venceu_ha_dias);
        query = query
          .gte('data_vencimento', dataLimite.toISOString().split('T')[0])
          .lt('data_vencimento', hoje.toISOString().split('T')[0]);
      }

      // FILTRO 8: Data de emissão inicial
      if (data_emissao_de) {
        query = query.gte('created_at', data_emissao_de);
      }

      // FILTRO 9: Data de emissão final
      if (data_emissao_ate) {
        query = query.lte('created_at', data_emissao_ate);
      }

      // Ordenação padrão por data de vencimento (mais urgente primeiro)
      query = query
        .order('data_vencimento', { ascending: true })
        .limit(limit ?? 20);

      const { data, error } = await query;

      if (error) throw error;

      // Calcular totais
      const totalValor = (data || []).reduce((sum, item) => sum + (item.valor || 0), 0);

      return {
        success: true,
        count: (data || []).length,
        total_valor: totalValor,
        message: `✅ ${(data || []).length} contas a pagar encontradas (Total: R$ ${totalValor.toFixed(2)})`,
        data: data || []
      };

    } catch (error) {
      console.error('ERRO getContasAPagar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao buscar contas a pagar`,
        data: []
      };
    }
  }
});
