export type AnalysisStatus = 'completed' | 'running' | 'pending';

export interface MockAnalysis {
  id: string;
  title: string;
  status: AnalysisStatus;
  description: string;
  progress?: number;
  rows?: number;
  duration?: string;
  estimation?: string;
}

export const mockAnalyses: MockAnalysis[] = [
  {
    id: '1',
    title: 'Análise de Receita',
    status: 'completed',
    description: 'Identificar padrões sazonais e tendências',
    rows: 2347,
    duration: '2:34'
  },
  {
    id: '2',
    title: 'Performance de Produtos',
    status: 'completed',
    description: 'Top sellers e ROI por categoria',
    rows: 1456,
    duration: '1:45'
  },
  {
    id: '3',
    title: 'Segmentação de Clientes',
    status: 'running',
    description: 'RFM analysis e persona mapping',
    progress: 67,
    estimation: '1:23'
  },
  {
    id: '4',
    title: 'Métricas de Retenção',
    status: 'pending',
    description: 'Churn rate e customer lifetime value',
    estimation: '2:15'
  },
  {
    id: '5',
    title: 'Dashboard Executivo',
    status: 'pending',
    description: 'Consolidação de KPIs principais',
    estimation: '1:30'
  }
];

export const getStatusIcon = (status: AnalysisStatus): string => {
  switch (status) {
    case 'completed': return '✅';
    case 'running': return '⏳';
    case 'pending': return '📋';
    default: return '○';
  }
};

export const getStatusColor = (status: AnalysisStatus): string => {
  switch (status) {
    case 'completed': return 'green';
    case 'running': return 'orange';
    case 'pending': return 'gray';
    default: return 'gray';
  }
};