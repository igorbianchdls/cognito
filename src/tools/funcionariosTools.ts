import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getFuncionariosData = tool({
  description: 'Busca dados de gestão de funcionários (funcionários, departamentos, cargos, ponto, ausências, folha de pagamento, benefícios, treinamentos, avaliações, desligamentos)',
  inputSchema: z.object({
    table: z.enum([
      'funcionarios',
      'departamentos',
      'cargos',
      'historico_cargos',
      'ponto',
      'ausencias',
      'folha_pagamento',
      'beneficios',
      'funcionarios_beneficios',
      'treinamentos',
      'funcionarios_treinamentos',
      'avaliacoes_desempenho',
      'desligamentos'
    ]).describe('Tabela a consultar'),
    limit: z.number().default(20).describe('Número máximo de resultados'),

    // Filtros específicos
    id_funcionario: z.number().optional()
      .describe('Filtrar por ID do funcionário'),
    id_departamento: z.number().optional()
      .describe('Filtrar por ID do departamento'),
    id_cargo: z.number().optional()
      .describe('Filtrar por ID do cargo'),
    status: z.string().optional()
      .describe('Filtrar por status (para funcionários, ausências, treinamentos)'),
    status_aprovacao: z.string().optional()
      .describe('Filtrar por status de aprovação (para ausências)'),
    tipo: z.string().optional()
      .describe('Filtrar por tipo (para ausências, desligamentos)'),
    mes_referencia: z.number().optional()
      .describe('Filtrar por mês de referência (para folha_pagamento)'),
    ano_referencia: z.number().optional()
      .describe('Filtrar por ano de referência (para folha_pagamento)'),

    // Filtros de data
    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),
  }),

  execute: async ({
    table,
    limit,
    id_funcionario,
    id_departamento,
    id_cargo,
    status,
    status_aprovacao,
    tipo,
    mes_referencia,
    ano_referencia,
    data_de,
    data_ate
  }) => {
    try {
      let query = supabase
        .schema('gestaofuncionarios')
        .from(table)
        .select('*');

      // FILTRO 1: ID Funcionário
      if (id_funcionario) {
        if (table === 'funcionarios') {
          query = query.eq('id_funcionario', id_funcionario);
        } else if (['historico_cargos', 'ponto', 'ausencias', 'folha_pagamento', 'funcionarios_beneficios', 'funcionarios_treinamentos', 'avaliacoes_desempenho', 'desligamentos'].includes(table)) {
          query = query.eq('id_funcionario', id_funcionario);
        }
      }

      // FILTRO 2: ID Departamento
      if (id_departamento) {
        if (table === 'departamentos') {
          query = query.eq('id_departamento', id_departamento);
        } else if (table === 'historico_cargos') {
          query = query.eq('id_departamento', id_departamento);
        }
      }

      // FILTRO 3: ID Cargo
      if (id_cargo) {
        if (table === 'cargos') {
          query = query.eq('id_cargo', id_cargo);
        } else if (table === 'historico_cargos') {
          query = query.eq('id_cargo', id_cargo);
        }
      }

      // FILTRO 4: Status
      if (status) {
        if (table === 'funcionarios') {
          query = query.eq('status', status);
        } else if (table === 'funcionarios_treinamentos') {
          query = query.eq('status', status);
        }
      }

      // FILTRO 5: Status Aprovação (ausências)
      if (status_aprovacao && table === 'ausencias') {
        query = query.eq('status_aprovacao', status_aprovacao);
      }

      // FILTRO 6: Tipo
      if (tipo) {
        if (table === 'ausencias') {
          query = query.eq('tipo', tipo);
        } else if (table === 'desligamentos') {
          query = query.eq('tipo_desligamento', tipo);
        }
      }

      // FILTRO 7: Mês e Ano Referência (folha_pagamento)
      if (mes_referencia && table === 'folha_pagamento') {
        query = query.eq('mes_referencia', mes_referencia);
      }
      if (ano_referencia && table === 'folha_pagamento') {
        query = query.eq('ano_referencia', ano_referencia);
      }

      // FILTRO 8: Range de datas
      if (data_de) {
        let dateColumn = 'created_at';
        if (table === 'funcionarios') dateColumn = 'data_admissao';
        else if (table === 'historico_cargos') dateColumn = 'data_inicio';
        else if (table === 'ponto') dateColumn = 'data_hora_marcacao';
        else if (table === 'ausencias') dateColumn = 'data_inicio';
        else if (table === 'folha_pagamento') dateColumn = 'data_pagamento';
        else if (table === 'funcionarios_beneficios') dateColumn = 'data_adesao';
        else if (table === 'avaliacoes_desempenho') dateColumn = 'data_avaliacao';
        else if (table === 'desligamentos') dateColumn = 'data_desligamento';

        query = query.gte(dateColumn, data_de);
      }

      if (data_ate) {
        let dateColumn = 'created_at';
        if (table === 'funcionarios') dateColumn = 'data_admissao';
        else if (table === 'historico_cargos') dateColumn = 'data_inicio';
        else if (table === 'ponto') dateColumn = 'data_hora_marcacao';
        else if (table === 'ausencias') dateColumn = 'data_inicio';
        else if (table === 'folha_pagamento') dateColumn = 'data_pagamento';
        else if (table === 'funcionarios_beneficios') dateColumn = 'data_adesao';
        else if (table === 'avaliacoes_desempenho') dateColumn = 'data_avaliacao';
        else if (table === 'desligamentos') dateColumn = 'data_desligamento';

        query = query.lte(dateColumn, data_ate);
      }

      // Ordenação dinâmica por tabela
      let orderColumn = 'id';
      const ascending = false;

      if (table === 'funcionarios') {
        orderColumn = 'data_admissao';
      } else if (table === 'departamentos') {
        orderColumn = 'id_departamento';
      } else if (table === 'cargos') {
        orderColumn = 'id_cargo';
      } else if (table === 'historico_cargos') {
        orderColumn = 'data_inicio';
      } else if (table === 'ponto') {
        orderColumn = 'data_hora_marcacao';
      } else if (table === 'ausencias') {
        orderColumn = 'data_inicio';
      } else if (table === 'folha_pagamento') {
        orderColumn = 'data_pagamento';
      } else if (table === 'beneficios') {
        orderColumn = 'id_beneficio';
      } else if (table === 'funcionarios_beneficios') {
        orderColumn = 'data_adesao';
      } else if (table === 'treinamentos') {
        orderColumn = 'id_treinamento';
      } else if (table === 'funcionarios_treinamentos') {
        orderColumn = 'id_funcionario_treinamento';
      } else if (table === 'avaliacoes_desempenho') {
        orderColumn = 'data_avaliacao';
      } else if (table === 'desligamentos') {
        orderColumn = 'data_desligamento';
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
      console.error('ERRO getFuncionariosData:', error);
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
