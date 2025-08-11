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

// All chart components use ChartData[] interface consistently

// Mock data for different chart types
const mockData = {
  bar: [
    { x: 'Janeiro', value: 245, color: '#8B5CF6' },
    { x: 'Fevereiro', value: 182, color: '#06B6D4' },
    { x: 'Março', value: 398, color: '#10B981' },
    { x: 'Abril', value: 312, color: '#F59E0B' },
    { x: 'Maio', value: 428, color: '#EF4444' },
    { x: 'Junho', value: 256, color: '#8B5CF6' }
  ] as ChartData[],

  line: [
    { x: 'Jan', y: 245 },
    { x: 'Fev', y: 182 },
    { x: 'Mar', y: 398 },
    { x: 'Abr', y: 312 },
    { x: 'Mai', y: 428 },
    { x: 'Jun', y: 256 }
  ] as ChartData[],

  pie: [
    { label: 'Desktop', value: 45, color: '#8B5CF6' },
    { label: 'Mobile', value: 35, color: '#06B6D4' },
    { label: 'Tablet', value: 20, color: '#10B981' }
  ] as ChartData[],

  scatter: [
    { x: '10', y: 20 },
    { x: '15', y: 25 },
    { x: '20', y: 18 },
    { x: '25', y: 30 },
    { x: '30', y: 22 },
    { x: '12', y: 35 },
    { x: '18', y: 40 },
    { x: '22', y: 32 },
    { x: '28', y: 45 },
    { x: '32', y: 38 }
  ] as ChartData[],

  area: [
    { x: 'Q1', y: 1000 },
    { x: 'Q2', y: 1200 },
    { x: 'Q3', y: 1500 },
    { x: 'Q4', y: 1800 }
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
    { x: 'Segunda-9h', y: 8 },
    { x: 'Segunda-12h', y: 12 },
    { x: 'Terça-9h', y: 10 },
    { x: 'Terça-12h', y: 14 },
    { x: 'Quarta-9h', y: 6 },
    { x: 'Quarta-12h', y: 16 }
  ] as ChartData[],

  radar: [
    { x: 'React', y: 85 },
    { x: 'TypeScript', y: 75 },
    { x: 'Node.js', y: 60 },
    { x: 'Design', y: 40 },
    { x: 'Analytics', y: 70 }
  ] as ChartData[],

  stream: [
    { x: 'Jan', y: 10 },
    { x: 'Fev', y: 12 },
    { x: 'Mar', y: 15 },
    { x: 'Abr', y: 18 },
    { x: 'Mai', y: 20 },
    { x: 'Jun', y: 16 }
  ] as ChartData[]
};

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
                <h1 className="text-3xl font-bold text-gray-900">Showcase Gráficos Nivo</h1>
                <p className="text-gray-600 mt-2">
                  Todos os {charts.length} tipos de gráficos Nivo implementados no projeto
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
                <div className="text-sm text-gray-600">Tipos de Gráficos</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">@nivo</div>
                <div className="text-sm text-gray-600">Biblioteca</div>
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
                    height={selectedChart === chart.id ? 400 : 300}
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