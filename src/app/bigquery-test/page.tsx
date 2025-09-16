'use client';

import Sidebar from '@/components/navigation/Sidebar';
import { Card } from '@/components/ui/card';
import { SQLEditor } from '@/components/sql-editor';
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger
} from '@/components/ai-elements/task';

export default function BigQueryTestPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">SQL Editor Test</h1>
          
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Teste do SQLEditor</h2>
            <p className="text-gray-600 mb-4">
              Editor SQL com Monaco Editor, execução automática e renderização de resultados em tabela.
            </p>
          </Card>

          <SQLEditor
            initialSQL="SELECT * FROM `creatto-463117.biquery_data.campanhas` LIMIT 10"
            onSQLChange={(sql) => console.log('SQL changed:', sql)}
            height="300px"
          />

          {/* Task Component Examples */}
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Task Component Examples</h2>

            {/* Example 1: Basic Task */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">1. Task Básica</h3>
              <Task>
                <TaskTrigger title="Exemplo Básico de Task" />
                <TaskContent>
                  <TaskItem>Este é um item de task simples</TaskItem>
                  <TaskItem>Este é outro item de task</TaskItem>
                  <TaskItem>Tasks podem conter múltiplos itens</TaskItem>
                </TaskContent>
              </Task>
            </Card>

            {/* Example 2: Task with Files */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">2. Task com Arquivos</h3>
              <Task>
                <TaskTrigger title="Processamento de Arquivos" />
                <TaskContent>
                  <TaskItem>
                    Processando <TaskItemFile>dados.csv</TaskItemFile>
                  </TaskItem>
                  <TaskItem>
                    Validando <TaskItemFile>schema.json</TaskItemFile>
                  </TaskItem>
                  <TaskItem>
                    Gerando relatório em <TaskItemFile>output.pdf</TaskItemFile>
                  </TaskItem>
                </TaskContent>
              </Task>
            </Card>

            {/* Example 3: Collapsed by Default */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">3. Task Colapsada (Fechada por Padrão)</h3>
              <Task defaultOpen={false}>
                <TaskTrigger title="Clique para Expandir" />
                <TaskContent>
                  <TaskItem>Este conteúdo estava oculto</TaskItem>
                  <TaskItem>Tasks podem começar fechadas</TaskItem>
                  <TaskItem>Útil para organização de informações</TaskItem>
                </TaskContent>
              </Task>
            </Card>

            {/* Example 4: Complex Workflow */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">4. Workflow Complexo</h3>
              <Task>
                <TaskTrigger title="Análise de Dados BigQuery" />
                <TaskContent>
                  <TaskItem>Conectando ao dataset</TaskItem>
                  <TaskItem>
                    Executando query em <TaskItemFile>campanhas.sql</TaskItemFile>
                  </TaskItem>
                  <TaskItem>Processando 1,234 registros</TaskItem>
                  <TaskItem>Aplicando transformações de dados</TaskItem>
                  <TaskItem>
                    Salvando resultados em <TaskItemFile>resultado_final.json</TaskItemFile>
                  </TaskItem>
                </TaskContent>
              </Task>
            </Card>

            {/* Example 5: Multiple Tasks */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">5. Múltiplas Tasks</h3>
              <div className="space-y-4">
                <Task>
                  <TaskTrigger title="Etapa 1: Preparação" />
                  <TaskContent>
                    <TaskItem>Configurando ambiente</TaskItem>
                    <TaskItem>Carregando dependências</TaskItem>
                  </TaskContent>
                </Task>

                <Task defaultOpen={false}>
                  <TaskTrigger title="Etapa 2: Execução" />
                  <TaskContent>
                    <TaskItem>Executando algoritmo principal</TaskItem>
                    <TaskItem>Monitorando progresso</TaskItem>
                  </TaskContent>
                </Task>

                <Task defaultOpen={false}>
                  <TaskTrigger title="Etapa 3: Finalização" />
                  <TaskContent>
                    <TaskItem>Limpeza de arquivos temporários</TaskItem>
                    <TaskItem>Gerando relatório final</TaskItem>
                  </TaskContent>
                </Task>
              </div>
            </Card>

            {/* Example 6: Dashboard Planning */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">6. Dashboard Planning - IA Sugerindo Widgets</h3>

              {/* Overview Task */}
              <Task>
                <TaskTrigger title="IA Analisando Dados de Vendas e Sugerindo Widgets" />
                <TaskContent>
                  <TaskItem>Analisando tabela vendas_2024: 15 colunas, 1.2M registros</TaskItem>
                  <TaskItem>Campos identificados: receita (numérico), produto (categórico), data_venda (temporal)</TaskItem>
                  <TaskItem>Sugerindo 6 widgets baseados na estrutura de dados</TaskItem>
                  <TaskItem>Queries otimizadas para performance</TaskItem>
                </TaskContent>
              </Task>

              {/* Individual Widget Tasks - Question Style */}
              <div className="mt-4 space-y-2">
                <Task defaultOpen={false}>
                  <TaskTrigger title="KPI: Receita Total para Monitorar Performance Geral" />
                  <TaskContent>
                    <TaskItem><strong>Métrica:</strong> SUM de receita</TaskItem>
                    <TaskItem>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                        SELECT SUM(receita) as total_faturamento FROM vendas_2024
                      </code>
                    </TaskItem>
                  </TaskContent>
                </Task>

                <Task defaultOpen={false}>
                  <TaskTrigger title="Bar Chart: Receita por Produto para Entender Qual Gera Mais Valor" />
                  <TaskContent>
                    <TaskItem><strong>Eixos:</strong> x = produto, y = receita (SUM)</TaskItem>
                    <TaskItem>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                        SELECT produto, SUM(receita) as receita_total
                        FROM vendas_2024
                        GROUP BY produto
                        ORDER BY receita_total DESC
                        LIMIT 10
                      </code>
                    </TaskItem>
                  </TaskContent>
                </Task>

                <Task defaultOpen={false}>
                  <TaskTrigger title="Line Chart: Analisar Evolução Temporal para Detectar Tendências e Sazonalidade" />
                  <TaskContent>
                    <TaskItem><strong>Eixos:</strong> x = data_venda (por mês), y = receita (SUM)</TaskItem>
                    <TaskItem>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                        SELECT
                        &nbsp;&nbsp;DATE_TRUNC(data_venda, MONTH) as mes,
                        &nbsp;&nbsp;SUM(receita) as receita_mensal
                        FROM vendas_2024
                        GROUP BY mes
                        ORDER BY mes
                      </code>
                    </TaskItem>
                  </TaskContent>
                </Task>

                <Task defaultOpen={false}>
                  <TaskTrigger title="KPI: Ticket Médio de Vendas para Acompanhar Meta de Valor por Transação" />
                  <TaskContent>
                    <TaskItem><strong>Métrica:</strong> AVG de receita</TaskItem>
                    <TaskItem>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                        SELECT AVG(receita) as ticket_medio FROM vendas_2024
                      </code>
                    </TaskItem>
                  </TaskContent>
                </Task>

                <Task defaultOpen={false}>
                  <TaskTrigger title="Pie Chart: Como se Distribui a Receita por Categoria?" />
                  <TaskContent>
                    <TaskItem><strong>Distribuição:</strong> categoria vs receita (percentual)</TaskItem>
                    <TaskItem>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                        SELECT
                        &nbsp;&nbsp;categoria,
                        &nbsp;&nbsp;SUM(receita) as receita_categoria,
                        &nbsp;&nbsp;ROUND(SUM(receita) * 100.0 / (SELECT SUM(receita) FROM vendas_2024), 2) as percentual
                        FROM vendas_2024
                        GROUP BY categoria
                      </code>
                    </TaskItem>
                  </TaskContent>
                </Task>

                <Task defaultOpen={false}>
                  <TaskTrigger title="Table: Quais São as Maiores Transações?" />
                  <TaskContent>
                    <TaskItem><strong>Colunas:</strong> produto, receita, data_venda, categoria</TaskItem>
                    <TaskItem>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                        SELECT produto, receita, data_venda, categoria
                        FROM vendas_2024
                        ORDER BY receita DESC
                        LIMIT 50
                      </code>
                    </TaskItem>
                  </TaskContent>
                </Task>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}