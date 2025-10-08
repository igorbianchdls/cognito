import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getEcommerceSalesData = tool({
  description: 'Busca dados de vendas e-commerce (canais, cupons, clientes, pedidos, produtos, devoluções)',
  inputSchema: z.object({
    table: z.enum([
      'channels',
      'coupons',
      'customers',
      'loyalty_points',
      'loyalty_rewards',
      'order_items',
      'orders',
      'payments',
      'products',
      'returns'
    ]).describe('Tabela a consultar'),
    limit: z.number().default(20).describe('Número máximo de resultados'),

    // Filtros específicos
    is_active: z.boolean().optional()
      .describe('Filtrar por status ativo (para channels)'),
    status: z.string().optional()
      .describe('Filtrar por status (para orders, returns, payments)'),
    customer_id: z.string().optional()
      .describe('Filtrar por ID do cliente (para orders, payments, loyalty_points)'),
    channel_id: z.string().optional()
      .describe('Filtrar por ID do canal (para orders)'),
    product_id: z.string().optional()
      .describe('Filtrar por ID do produto (para order_items)'),
    order_id: z.string().optional()
      .describe('Filtrar por ID do pedido (para order_items, payments, returns)'),

    // Filtros de valor
    valor_minimo: z.number().optional()
      .describe('Valor mínimo (para orders, payments)'),
    valor_maximo: z.number().optional()
      .describe('Valor máximo (para orders, payments)'),

    // Filtros de data
    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),
  }),

  execute: async ({
    table,
    limit,
    is_active,
    status,
    customer_id,
    channel_id,
    product_id,
    order_id,
    valor_minimo,
    valor_maximo,
    data_de,
    data_ate
  }) => {
    try {
      let query = supabase
        .schema('vendasecommerce')
        .from(table)
        .select('*');

      // FILTRO 1: Status ativo (para channels)
      if (is_active !== undefined && table === 'channels') {
        query = query.eq('is_active', is_active);
      }

      // FILTRO 2: Status (para orders, returns, payments)
      if (status && (table === 'orders' || table === 'returns' || table === 'payments')) {
        query = query.eq('status', status);
      }

      // FILTRO 3: Customer ID
      if (customer_id && (table === 'orders' || table === 'payments' || table === 'loyalty_points')) {
        query = query.eq('customer_id', customer_id);
      }

      // FILTRO 4: Channel ID
      if (channel_id && table === 'orders') {
        query = query.eq('channel_id', channel_id);
      }

      // FILTRO 5: Product ID
      if (product_id && table === 'order_items') {
        query = query.eq('product_id', product_id);
      }

      // FILTRO 6: Order ID
      if (order_id && (table === 'order_items' || table === 'payments' || table === 'returns')) {
        query = query.eq('order_id', order_id);
      }

      // FILTRO 7: Valor mínimo
      if (valor_minimo !== undefined && (table === 'orders' || table === 'payments')) {
        const valueColumn = table === 'orders' ? 'total_value' : 'amount';
        query = query.gte(valueColumn, valor_minimo);
      }

      // FILTRO 8: Valor máximo
      if (valor_maximo !== undefined && (table === 'orders' || table === 'payments')) {
        const valueColumn = table === 'orders' ? 'total_value' : 'amount';
        query = query.lte(valueColumn, valor_maximo);
      }

      // FILTRO 9: Range de datas
      if (data_de) {
        let dateColumn = 'criado_em';
        if (table === 'orders') dateColumn = 'order_date';
        else if (table === 'payments') dateColumn = 'payment_date';
        else if (table === 'returns') dateColumn = 'return_date';
        else if (table === 'loyalty_points') dateColumn = 'earned_date';

        query = query.gte(dateColumn, data_de);
      }

      if (data_ate) {
        let dateColumn = 'criado_em';
        if (table === 'orders') dateColumn = 'order_date';
        else if (table === 'payments') dateColumn = 'payment_date';
        else if (table === 'returns') dateColumn = 'return_date';
        else if (table === 'loyalty_points') dateColumn = 'earned_date';

        query = query.lte(dateColumn, data_ate);
      }

      // Ordenação dinâmica por tabela
      let orderColumn = 'criado_em';
      const ascending = false;

      if (table === 'orders') {
        orderColumn = 'order_date';
      } else if (table === 'payments') {
        orderColumn = 'payment_date';
      } else if (table === 'returns') {
        orderColumn = 'return_date';
      } else if (table === 'loyalty_points') {
        orderColumn = 'earned_date';
      } else if (table === 'order_items') {
        orderColumn = 'id';
      }

      query = query
        .order(orderColumn, { ascending })
        .limit(limit ?? 20);

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        count: (data || []).length,
        table: table,
        message: `✅ ${(data || []).length} registros encontrados em ${table}`,
        data: data || []
      };

    } catch (error) {
      console.error('ERRO getEcommerceSalesData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: `❌ Erro ao buscar dados de ${table}`,
        table: table,
        data: []
      };
    }
  }
});
