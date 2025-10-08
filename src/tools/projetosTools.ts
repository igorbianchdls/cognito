import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getProjetosData = tool({
  description: 'Busca dados de gestão de projetos (projects, status_types, tasks)',
  inputSchema: z.object({
    table: z.enum([
      'projects',
      'status_types',
      'tasks'
    ]).describe('Tabela a consultar'),
    limit: z.number().default(20).describe('Número máximo de resultados'),

    // Filtros específicos
    project_id: z.string().optional()
      .describe('Filtrar tarefas por ID do projeto'),
    owner_id: z.string().optional()
      .describe('Filtrar projetos por ID do responsável'),
    team_id: z.string().optional()
      .describe('Filtrar projetos por ID da equipe'),
    assignee_id: z.string().optional()
      .describe('Filtrar tarefas por ID do responsável'),
    status_id: z.number().optional()
      .describe('Filtrar tarefas por ID do status (1=To Do, 2=In Progress, 3=Done, 4=Blocked)'),
    overdue: z.boolean().optional()
      .describe('Filtrar apenas tarefas atrasadas (due_date < hoje)'),

    // Filtros de data
    data_de: z.string().optional()
      .describe('Data inicial (formato YYYY-MM-DD)'),
    data_ate: z.string().optional()
      .describe('Data final (formato YYYY-MM-DD)'),
  }),

  execute: async ({
    table,
    limit,
    project_id,
    owner_id,
    team_id,
    assignee_id,
    status_id,
    overdue,
    data_de,
    data_ate
  }) => {
    try {
      let query = supabase
        .schema('gestaodeprojetos')
        .from(table)
        .select('*');

      // FILTRO 1: Project ID (para tasks)
      if (project_id && table === 'tasks') {
        query = query.eq('project_id', project_id);
      }

      // FILTRO 2: Owner ID (para projects)
      if (owner_id && table === 'projects') {
        query = query.eq('owner_id', owner_id);
      }

      // FILTRO 3: Team ID (para projects)
      if (team_id && table === 'projects') {
        query = query.eq('team_id', team_id);
      }

      // FILTRO 4: Assignee ID (para tasks)
      if (assignee_id && table === 'tasks') {
        query = query.eq('assignee_id', assignee_id);
      }

      // FILTRO 5: Status ID (para tasks)
      if (status_id !== undefined && table === 'tasks') {
        query = query.eq('status_id', status_id);
      }

      // FILTRO 6: Overdue (tarefas atrasadas)
      if (overdue && table === 'tasks') {
        const today = new Date().toISOString().split('T')[0];
        query = query.lt('due_date', today).neq('status_id', 3); // Não incluir tarefas concluídas
      }

      // FILTRO 7: Range de datas
      if (data_de) {
        let dateColumn = 'created_at';
        if (table === 'projects') dateColumn = 'start_date';
        else if (table === 'tasks') dateColumn = 'due_date';

        query = query.gte(dateColumn, data_de);
      }

      if (data_ate) {
        let dateColumn = 'created_at';
        if (table === 'projects') dateColumn = 'end_date';
        else if (table === 'tasks') dateColumn = 'due_date';

        query = query.lte(dateColumn, data_ate);
      }

      // Ordenação dinâmica por tabela
      let orderColumn = 'id';
      let ascending = true;

      if (table === 'projects') {
        orderColumn = 'start_date';
        ascending = false;
      } else if (table === 'tasks') {
        orderColumn = 'due_date';
        ascending = true;
      } else if (table === 'status_types') {
        orderColumn = 'id';
        ascending = true;
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
      console.error('ERRO getProjetosData:', error);
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
