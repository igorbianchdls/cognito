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

// Type definitions for complex chart data structures
interface LineSeriesData {
  id: string;
  data: Array<{ x: string; y: number }>;
}

interface ScatterSeriesData {
  id: string;
  data: Array<{ x: number; y: number }>;
}

interface AreaSeriesData {
  id: string;
  data: Array<{ x: string; y: number }>;
}

interface TreeMapData {
  id: string;
  children: Array<{ id: string; value: number; color: string }>;
}

interface HeatMapData {
  id: string;
  data: Array<{ x: string; y: number }>;
}

interface RadarData {
  skill: string;
  user1: number;
  user2: number;
  user3: number;
}

interface StreamData {
  [key: string]: number;
}

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
    {
      id: 'Vendas',
      data: [
        { x: 'Jan', y: 245 },
        { x: 'Fev', y: 182 },
        { x: 'Mar', y: 398 },
        { x: 'Abr', y: 312 },
        { x: 'Mai', y: 428 },
        { x: 'Jun', y: 256 }
      ]
    },
    {
      id: 'Lucro',
      data: [
        { x: 'Jan', y: 120 },
        { x: 'Fev', y: 95 },
        { x: 'Mar', y: 180 },
        { x: 'Abr', y: 140 },
        { x: 'Mai', y: 200 },
        { x: 'Jun', y: 110 }
      ]
    }
  ] as LineSeriesData[],

  pie: [
    { label: 'Desktop', value: 45, color: '#8B5CF6' },
    { label: 'Mobile', value: 35, color: '#06B6D4' },
    { label: 'Tablet', value: 20, color: '#10B981' }
  ] as ChartData[],

  scatter: [
    {
      id: 'Grupo A',
      data: [
        { x: 10, y: 20 },
        { x: 15, y: 25 },
        { x: 20, y: 18 },
        { x: 25, y: 30 },
        { x: 30, y: 22 }
      ]
    },
    {
      id: 'Grupo B',
      data: [
        { x: 12, y: 35 },
        { x: 18, y: 40 },
        { x: 22, y: 32 },
        { x: 28, y: 45 },
        { x: 32, y: 38 }
      ]
    }
  ] as ScatterSeriesData[],

  area: [
    {
      id: 'Receita',
      data: [
        { x: 'Q1', y: 1000 },
        { x: 'Q2', y: 1200 },
        { x: 'Q3', y: 1500 },
        { x: 'Q4', y: 1800 }
      ]
    },
    {
      id: 'Custo',
      data: [
        { x: 'Q1', y: 600 },
        { x: 'Q2', y: 720 },
        { x: 'Q3', y: 850 },
        { x: 'Q4', y: 980 }
      ]
    }
  ] as AreaSeriesData[],

  funnel: [
    { label: 'Visitantes', value: 10000, color: '#8B5CF6' },
    { label: 'Interessados', value: 5000, color: '#06B6D4' },
    { label: 'Leads', value: 2000, color: '#10B981' },
    { label: 'Clientes', value: 500, color: '#F59E0B' }
  ] as ChartData[],

  treemap: {
    id: 'root',
    children: [
      { id: 'Produto A', value: 45, color: '#8B5CF6' },
      { id: 'Produto B', value: 30, color: '#06B6D4' },
      { id: 'Produto C', value: 25, color: '#10B981' }
    ]
  } as TreeMapData,

  heatmap: [
    { id: 'Segunda', data: [{ x: '9h', y: 8 }, { x: '12h', y: 12 }, { x: '15h', y: 15 }, { x: '18h', y: 10 }] },
    { id: 'Terça', data: [{ x: '9h', y: 10 }, { x: '12h', y: 14 }, { x: '15h', y: 18 }, { x: '18h', y: 12 }] },
    { id: 'Quarta', data: [{ x: '9h', y: 6 }, { x: '12h', y: 16 }, { x: '15h', y: 20 }, { x: '18h', y: 14 }] },
    { id: 'Quinta', data: [{ x: '9h', y: 12 }, { x: '12h', y: 18 }, { x: '15h', y: 22 }, { x: '18h', y: 16 }] },
    { id: 'Sexta', data: [{ x: '9h', y: 14 }, { x: '12h', y: 20 }, { x: '15h', y: 25 }, { x: '18h', y: 18 }] }
  ] as HeatMapData[],

  radar: [
    {
      skill: 'React',
      user1: 85,
      user2: 70,
      user3: 90
    },
    {
      skill: 'TypeScript',
      user1: 75,
      user2: 80,
      user3: 85
    },
    {
      skill: 'Node.js',
      user1: 60,
      user2: 90,
      user3: 70
    },
    {
      skill: 'Design',
      user1: 40,
      user2: 60,
      user3: 95
    },
    {
      skill: 'Analytics',
      user1: 70,
      user2: 50,
      user3: 80
    }
  ] as RadarData[],

  stream: [
    {
      'Jan': 10,
      'Fev': 12,
      'Mar': 15,
      'Abr': 18,
      'Mai': 20,
      'Jun': 16
    },
    {
      'Jan': 8,
      'Fev': 14,
      'Mar': 12,
      'Abr': 16,
      'Mai': 18,
      'Jun': 14
    },
    {
      'Jan': 12,
      'Fev': 10,
      'Mar': 18,
      'Abr': 14,
      'Mai': 16,
      'Jun': 20
    }
  ] as StreamData[]
};

export default function NivoChartsShowcase() {
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  const charts = [
    {
      id: 'bar',
      title: 'Bar Chart',
      description: 'Gráfico de barras com dados categóricos',
      component: <BarChart data={mockData.bar} height={300} />
    },
    {
      id: 'line',
      title: 'Line Chart', 
      description: 'Gráfico de linhas para tendências temporais',
      component: <LineChart data={mockData.line} height={300} />
    },
    {
      id: 'pie',
      title: 'Pie Chart',
      description: 'Gráfico de pizza para distribuições',
      component: <PieChart data={mockData.pie} height={300} />
    },
    {
      id: 'scatter',
      title: 'Scatter Chart',
      description: 'Gráfico de dispersão para correlações',
      component: <ScatterChart data={mockData.scatter} height={300} />
    },
    {
      id: 'area',
      title: 'Area Chart',
      description: 'Gráfico de área para volumes cumulativos',
      component: <AreaChart data={mockData.area} height={300} />
    },
    {
      id: 'funnel',
      title: 'Funnel Chart',
      description: 'Gráfico de funil para conversões',
      component: <FunnelChart data={mockData.funnel} height={300} />
    },
    {
      id: 'treemap',
      title: 'TreeMap Chart',
      description: 'Mapa de árvore para hierarquias',
      component: <TreeMapChart data={mockData.treemap} height={300} />
    },
    {
      id: 'heatmap',
      title: 'Heatmap Chart',
      description: 'Mapa de calor para intensidades',
      component: <HeatmapChart data={mockData.heatmap} height={300} />
    },
    {
      id: 'radar',
      title: 'Radar Chart',
      description: 'Gráfico radar para múltiplas dimensões',
      component: <RadarChart data={mockData.radar} height={300} keys={['user1', 'user2', 'user3']} indexBy="skill" />
    },
    {
      id: 'stream',
      title: 'Stream Chart',
      description: 'Gráfico de fluxo para dados temporais empilhados',
      component: <StreamChart data={mockData.stream} height={300} keys={['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']} />
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
                    height={selectedChart === chart.id ? 400 : 300}
                    className="w-full"
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