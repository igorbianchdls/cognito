import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getMovimentos = tool({
  description: 'Busca movimentos financeiros (entradas e saídas) registrados no sistema. Use para ver extrato interno, calcular saldos e preparar conciliação bancária.',
  inputSchema: z.object({
    limit: z.number().default(50).describe('Número máximo de resultados'),
    conta_id: z.string().optional()
      .describe('Filtrar por ID da conta bancária'),
    tipo: z.enum(['entrada', 'saída']).optional()
      .describe('Filtrar por tipo de movimento'),
    data_inicial: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_final: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),
    categoria_id: z.string().optional()
      .describe('Filtrar por ID da categoria'),
    valor_minimo: z.number().optional()
      .describe('Valor mínimo em reais'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo em reais'),
  }),

  execute: async ({
    limit,
    conta_id,
    tipo,
    data_inicial,
    data_final,
    categoria_id,
    valor_minimo,
    valor_maximo
  }) => {
    try {
      let query = supabase
        .schema('gestaofinanceira')
        .from('movimentos')
        .select('*');

      // FILTRO 1: Conta bancária
      if (conta_id) {
        query = query.eq('conta_id', conta_id);
      }

      // FILTRO 2: Tipo de movimento
      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      // FILTRO 3: Data inicial
      if (data_inicial) {
        query = query.gte('data', data_inicial);
      }

      // FILTRO 4: Data final
      if (data_final) {
        query = query.lte('data', data_final);
      }

      // FILTRO 5: Categoria
      if (categoria_id) {
        query = query.eq('categoria_id', categoria_id);
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

      // Calcular totais
      const movimentos = data || [];
      const totalEntradas = movimentos
        .filter(m => m.tipo === 'entrada')
        .reduce((sum, m) => sum + (m.valor || 0), 0);

      const totalSaidas = movimentos
        .filter(m => m.tipo === 'saída')
        .reduce((sum, m) => sum + (m.valor || 0), 0);

      const saldoLiquido = totalEntradas - totalSaidas;

      return {
        success: true,
        count: movimentos.length,
        total_entradas: totalEntradas,
        total_saidas: totalSaidas,
        saldo_liquido: saldoLiquido,
        message: `✅ ${movimentos.length} movimentos encontrados (Entradas: R$ ${totalEntradas.toFixed(2)} | Saídas: R$ ${totalSaidas.toFixed(2)} | Saldo: R$ ${saldoLiquido.toFixed(2)})`,
        data: movimentos
      };

    } catch (error) {
      console.error('ERRO getMovimentos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao buscar movimentos`,
        data: []
      };
    }
  }
});

export const createMovimento = tool({
  description: 'Cria um novo movimento financeiro no sistema (entrada ou saída). Use para registrar taxas bancárias, IOF, transferências, rendimentos ou qualquer movimento avulso que não está vinculado a contas a pagar/receber.',
  inputSchema: z.object({
    conta_id: z.string()
      .describe('ID da conta bancária (obrigatório)'),
    tipo: z.enum(['entrada', 'saída'])
      .describe('Tipo de movimento: entrada (recebimento) ou saída (pagamento)'),
    valor: z.number().positive()
      .describe('Valor em reais (sempre positivo, o tipo define se é entrada ou saída)'),
    data: z.string()
      .describe('Data do movimento (formato YYYY-MM-DD)'),
    categoria_id: z.string().optional()
      .describe('ID da categoria (ex: taxas-bancarias, rendimentos, impostos)'),
    descricao: z.string().optional()
      .describe('Descrição do movimento'),
    conta_a_pagar_id: z.string().optional()
      .describe('ID da conta a pagar (se vinculado a pagamento)'),
    conta_a_receber_id: z.string().optional()
      .describe('ID da conta a receber (se vinculado a recebimento)'),
  }),

  execute: async ({
    conta_id,
    tipo,
    valor,
    data,
    categoria_id,
    descricao,
    conta_a_pagar_id,
    conta_a_receber_id
  }) => {
    try {
      // Validação: não pode ter ambos vinculados
      if (conta_a_pagar_id && conta_a_receber_id) {
        throw new Error('Movimento não pode estar vinculado a conta a pagar E conta a receber ao mesmo tempo');
      }

      const movimento = {
        conta_id,
        tipo,
        valor,
        data,
        categoria_id: categoria_id || null,
        descricao: descricao || null,
        conta_a_pagar_id: conta_a_pagar_id || null,
        conta_a_receber_id: conta_a_receber_id || null,
      };

      const { data: novoMovimento, error } = await supabase
        .schema('gestaofinanceira')
        .from('movimentos')
        .insert(movimento)
        .select()
        .single();

      if (error) throw error;

      const tipoFormatado = tipo === 'entrada' ? 'Entrada' : 'Saída';
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);

      return {
        success: true,
        message: `✅ Movimento criado com sucesso: ${tipoFormatado} de ${valorFormatado} em ${data}`,
        data: novoMovimento
      };

    } catch (error) {
      console.error('ERRO createMovimento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao criar movimento`,
        data: null
      };
    }
  }
});
