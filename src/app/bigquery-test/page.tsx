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
          </div>
        </div>
      </div>
    </div>
  );
}