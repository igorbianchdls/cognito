'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/navigation/Sidebar';
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  AreaChart,
  FunnelChart,
  TreeMapChart,
  HeatmapChart,
  RadarChart,
  StreamChart,
  ChartContainer,
} from '@/components/charts';
import type { ChartData } from '@/components/charts';
import { DataTable, createSortableHeader, createSelectionColumn, createActionsColumn } from '@/components/widgets/Table';
import type { ColumnDef } from '@tanstack/react-table';
import { KPICard } from '@/components/widgets/KPICard';

// All chart components use ChartData[] interface consistently

// Mock data for different chart types
const mockData = {
  bar: [
    { label: 'Janeiro', value: 245, color: '#8B5CF6' },
    { label: 'Fevereiro', value: 182, color: '#06B6D4' },
    { label: 'Março', value: 398, color: '#10B981' },
    { label: 'Abril', value: 312, color: '#F59E0B' },
    { label: 'Maio', value: 428, color: '#EF4444' },
    { label: 'Junho', value: 256, color: '#8B5CF6' }
  ] as ChartData[],

  line: [
    { x: 'Jan', y: 245, color: '#8B5CF6' },
    { x: 'Fev', y: 182, color: '#06B6D4' },
    { x: 'Mar', y: 398, color: '#10B981' },
    { x: 'Abr', y: 312, color: '#F59E0B' },
    { x: 'Mai', y: 428, color: '#EF4444' },
    { x: 'Jun', y: 256, color: '#8B5CF6' }
  ] as ChartData[],

  pie: [
    { label: 'Desktop', value: 45, color: '#8B5CF6' },
    { label: 'Mobile', value: 35, color: '#06B6D4' },
    { label: 'Tablet', value: 20, color: '#10B981' }
  ] as ChartData[],

  scatter: [
    { x: '10', y: 20, color: '#8B5CF6' },
    { x: '15', y: 25, color: '#06B6D4' },
    { x: '20', y: 18, color: '#10B981' },
    { x: '25', y: 30, color: '#F59E0B' },
    { x: '30', y: 22, color: '#EF4444' },
    { x: '12', y: 35, color: '#8B5CF6' },
    { x: '18', y: 40, color: '#06B6D4' },
    { x: '22', y: 32, color: '#10B981' },
    { x: '28', y: 45, color: '#F59E0B' },
    { x: '32', y: 38, color: '#EF4444' }
  ] as ChartData[],

  area: [
    { x: 'Q1', y: 1000, color: '#8B5CF6' },
    { x: 'Q2', y: 1200, color: '#06B6D4' },
    { x: 'Q3', y: 1500, color: '#10B981' },
    { x: 'Q4', y: 1800, color: '#F59E0B' }
  ] as ChartData[],

  funnel: [
    { label: 'Visitantes', value: 10000, color: '#8B5CF6' },
    { label: 'Interessados', value: 5000, color: '#06B6D4' },
    { label: 'Leads', value: 2000, color: '#10B981' },
    { label: 'Clientes', value: 500, color: '#F59E0B' }
  ] as ChartData[],

  treemap: [
    { label: 'Produto A', value: 45, color: '#8B5CF6' },
    { label: 'Produto B', value: 30, color: '#06B6D4' },
    { label: 'Produto C', value: 25, color: '#10B981' }
  ] as ChartData[],

  heatmap: [
    { x: 'Segunda-9h', y: 8, color: '#8B5CF6' },
    { x: 'Segunda-12h', y: 12, color: '#06B6D4' },
    { x: 'Terça-9h', y: 10, color: '#10B981' },
    { x: 'Terça-12h', y: 14, color: '#F59E0B' },
    { x: 'Quarta-9h', y: 6, color: '#EF4444' },
    { x: 'Quarta-12h', y: 16, color: '#8B5CF6' }
  ] as ChartData[],

  radar: [
    { x: 'React', y: 85, color: '#8B5CF6' },
    { x: 'TypeScript', y: 75, color: '#06B6D4' },
    { x: 'Node.js', y: 60, color: '#10B981' },
    { x: 'Design', y: 40, color: '#F59E0B' },
    { x: 'Analytics', y: 70, color: '#EF4444' }
  ] as ChartData[],

  stream: [
    { x: 'Jan', y: 10, color: '#8B5CF6' },
    { x: 'Fev', y: 12, color: '#06B6D4' },
    { x: 'Mar', y: 15, color: '#10B981' },
    { x: 'Abr', y: 18, color: '#F59E0B' },
    { x: 'Mai', y: 20, color: '#EF4444' },
    { x: 'Jun', y: 16, color: '#8B5CF6' }
  ] as ChartData[]
};

// Mock data for table
const tableData = [
  { id: '1', name: 'Janeiro', value: 245, category: 'Vendas', status: 'Ativo', date: '2024-01-15' },
  { id: '2', name: 'Fevereiro', value: 182, category: 'Marketing', status: 'Inativo', date: '2024-02-10' },
  { id: '3', name: 'Março', value: 398, category: 'Vendas', status: 'Ativo', date: '2024-03-20' },
  { id: '4', name: 'Abril', value: 312, category: 'Suporte', status: 'Ativo', date: '2024-04-05' },
  { id: '5', name: 'Maio', value: 428, category: 'Vendas', status: 'Ativo', date: '2024-05-12' },
  { id: '6', name: 'Junho', value: 256, category: 'Marketing', status: 'Inativo', date: '2024-06-08' },
  { id: '7', name: 'Julho', value: 380, category: 'Vendas', status: 'Ativo', date: '2024-07-22' },
  { id: '8', name: 'Agosto', value: 295, category: 'Suporte', status: 'Ativo', date: '2024-08-15' },
];

// Table columns definition
const tableColumns: ColumnDef<typeof tableData[0]>[] = [
  createSelectionColumn(),
  {
    accessorKey: "name",
    header: createSortableHeader("Nome"),
  },
  {
    accessorKey: "value",
    header: createSortableHeader("Valor"),
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("value"))
      const formatted = new Intl.NumberFormat("pt-BR").format(value)
      return <div className="font-medium text-muted-foreground">{formatted}</div>
    },
  },
  {
    accessorKey: "category",
    header: createSortableHeader("Categoria"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'Ativo' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {status}
        </div>
      )
    },
  },
  {
    accessorKey: "date",
    header: createSortableHeader("Data"),
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"))
      return <div className="text-muted-foreground">{date.toLocaleDateString('pt-BR')}</div>
    },
  },
  createActionsColumn([
    { 
      label: "Ver detalhes", 
      onClick: (row) => console.log("Detalhes:", row) 
    },
    { 
      label: "Editar", 
      onClick: (row) => console.log("Editar:", row) 
    },
    { 
      label: "Excluir", 
      onClick: (row) => console.log("Excluir:", row) 
    },
  ])
];

export default function NivoChartsShowcase() {
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  const charts = [
    {
      id: 'bar',
      title: 'Bar Chart',
      description: 'Gráfico de barras com dados categóricos',
      component: <BarChart data={mockData.bar} />
    },
    {
      id: 'line',
      title: 'Line Chart', 
      description: 'Gráfico de linhas para tendências temporais',
      component: <LineChart data={mockData.line} />
    },
    {
      id: 'pie',
      title: 'Pie Chart',
      description: 'Gráfico de pizza para distribuições',
      component: <PieChart data={mockData.pie} />
    },
    {
      id: 'scatter',
      title: 'Scatter Chart',
      description: 'Gráfico de dispersão para correlações',
      component: <ScatterChart data={mockData.scatter} />
    },
    {
      id: 'area',
      title: 'Area Chart',
      description: 'Gráfico de área para volumes cumulativos',
      component: <AreaChart data={mockData.area} />
    },
    {
      id: 'funnel',
      title: 'Funnel Chart',
      description: 'Gráfico de funil para conversões',
      component: <FunnelChart data={mockData.funnel} />
    },
    {
      id: 'treemap',
      title: 'TreeMap Chart',
      description: 'Mapa de árvore para hierarquias',
      component: <TreeMapChart data={mockData.treemap} />
    },
    {
      id: 'heatmap',
      title: 'Heatmap Chart',
      description: 'Mapa de calor para intensidades',
      component: <HeatmapChart data={mockData.heatmap} />
    },
    {
      id: 'radar',
      title: 'Radar Chart',
      description: 'Gráfico radar para múltiplas dimensões',
      component: <RadarChart data={mockData.radar} />
    },
    {
      id: 'stream',
      title: 'Stream Chart',
      description: 'Gráfico de fluxo para dados temporais empilhados',
      component: <StreamChart data={mockData.stream} />
    },
    {
      id: 'table',
      title: 'Data Table',
      description: 'Tabela de dados com ordenação, filtros e paginação',
      component: (
        <DataTable 
          columns={tableColumns} 
          data={tableData} 
          searchPlaceholder="Buscar registros..."
          pageSize={5}
        />
      )
    },
    {
      id: 'kpi',
      title: 'KPI Cards',
      description: 'Cards de métricas com indicadores de performance',
      component: <KPICard />
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Showcase Gráficos & Tabelas</h1>
                <p className="text-gray-600 mt-2">
                  Todos os {charts.length} componentes de visualização implementados no projeto
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                ← Voltar para BigQuery Test
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-2xl font-bold text-blue-600">{charts.length}</div>
                <div className="text-sm text-gray-600">Componentes</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">@nivo + shadcn</div>
                <div className="text-sm text-gray-600">Bibliotecas</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-purple-600">React</div>
                <div className="text-sm text-gray-600">Framework</div>
              </Card>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {charts.map((chart) => (
              <Card 
                key={chart.id} 
                className={`transition-all duration-200 hover:shadow-lg ${
                  selectedChart === chart.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{chart.title}</CardTitle>
                    <Button
                      size="sm"
                      variant={selectedChart === chart.id ? "default" : "outline"}
                      onClick={() => setSelectedChart(selectedChart === chart.id ? null : chart.id)}
                    >
                      {selectedChart === chart.id ? 'Minimizar' : 'Expandir'}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">{chart.description}</p>
                </CardHeader>
                <CardContent>
                  <ChartContainer 
                    className="w-full"
                    height={selectedChart === chart.id ? 600 : 300}
                  >
                    {chart.component}
                  </ChartContainer>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">ℹ️ Sobre os Gráficos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p><strong>Dados:</strong> Todos os gráficos utilizam dados mock para demonstração</p>
                <p><strong>Responsivo:</strong> Layouts adaptáveis para desktop e mobile</p>
                <p><strong>Tema:</strong> Design system consistente aplicado</p>
              </div>
              <div>
                <p><strong>Interatividade:</strong> Hover, tooltips e animações incluídas</p>
                <p><strong>Performance:</strong> Renderização otimizada com SVG</p>
                <p><strong>Customização:</strong> Cores e estilos configuráveis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}