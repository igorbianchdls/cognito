import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getContasAReceber = tool({
  description: `Busca contas a receber do banco de dados com informações completas de cliente, categoria e conta bancária.
  Suporta filtros avançados de data, valor e status.`,

  inputSchema: z.object({
    // Paginação
    limit: z.number().default(10).describe('Número máximo de resultados'),

    // Filtros básicos
    status: z.enum(['pendente', 'pago', 'vencido', 'cancelado']).optional()
      .describe('Filtrar por status da conta'),

    // Filtros de relacionamento
    cliente_nome: z.string().optional()
      .describe('Filtrar por nome do cliente (busca parcial)'),
    categoria_nome: z.string().optional()
      .describe('Filtrar por nome da categoria'),

    // Filtros de valor
    valor_minimo: z.number().optional()
      .describe('Valor mínimo da conta (em reais)'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo da conta (em reais)'),

    // Filtros de data - vencimento futuro
    data_vencimento: z.string().optional()
      .describe('Data específica de vencimento (formato: YYYY-MM-DD)'),
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
    cliente_nome,
    categoria_nome,
    valor_minimo,
    valor_maximo,
    data_vencimento,
    vence_em_dias,
    vencimento_ate,
    vencimento_de,
    venceu_ha_dias
  }) => {
    try {
      // Detectar se precisa de INNER JOIN
      const hasClienteFilter = !!cliente_nome;

      // Construir SELECT dinamicamente baseado nos filtros (single-line para evitar ParserError)
      const selectQuery = hasClienteFilter
        ? `*, cliente:clientes!inner(id,nome,email,telefone), categoria:categorias(id,nome,tipo), conta:contas(id,nome,banco)`
        : `*, cliente:clientes(id,nome,email,telefone), categoria:categorias(id,nome,tipo), conta:contas(id,nome,banco)`;

      // Construir query base com JOINs (UMA VEZ)
      let query = supabase
        .from('gestaofinanceira.contas_a_receber')
        .select(selectQuery)
        .order('data_vencimento', { ascending: true })
        .limit(limit ?? 10);

      // FILTROS BÁSICOS
      if (status) {
        query = query.eq('status', status);
      }

      // FILTROS DE RELACIONAMENTO
      if (cliente_nome) {
        query = query.ilike('cliente.nome', `%${cliente_nome}%`);
      }

      if (categoria_nome) {
        query = query.ilike('categoria.nome', `%${categoria_nome}%`);
      }

      // FILTROS DE VALOR
      if (valor_minimo !== undefined) {
        query = query.gte('valor', valor_minimo);
      }

      if (valor_maximo !== undefined) {
        query = query.lte('valor', valor_maximo);
      }

      // FILTROS DE DATA
      // Data específica
      if (data_vencimento) {
        query = query.eq('data_vencimento', data_vencimento);
      }

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
      // Calcular dias até vencimento e total
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: '❌ Erro ao buscar contas a receber',
        data: []
      };
    }
  }
});
