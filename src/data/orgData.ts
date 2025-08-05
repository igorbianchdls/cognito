export interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  iconColor: string;
  isFeatured?: boolean;
  subordinates?: AIAgent[];
  capabilities?: string[];
}

export type Employee = AIAgent; // Backward compatibility

export const orgData: Employee = {
  id: '1',
  name: 'Coordenador de IA',
  description: 'Orquestrador central gerenciando todos os agentes de IA e otimização de fluxo',
  category: 'Todas as Equipes',
  icon: '🤖',
  iconColor: 'from-purple-500 to-indigo-600',
  isFeatured: true,
  capabilities: ['Orquestração de fluxos', 'Coordenação de agentes', 'Otimização de performance'],
  subordinates: [
    {
      id: '2',
      name: 'Diretor de IA de Vendas',
      description: 'Gerencia automação de vendas e agentes de engajamento com clientes',
      category: 'Vendas',
      icon: '💼',
      iconColor: 'from-blue-500 to-cyan-600',
      isFeatured: true,
      subordinates: [
        {
          id: '3',
          name: 'Personalização de vendas',
          description: 'Ajuda a criar ótimos e-mails de prospecção de vendas',
          category: 'Vendas',
          icon: '📧',
          iconColor: 'from-blue-400 to-blue-600'
        },
        {
          id: '4',
          name: 'Qualificador de leads',
          description: 'Analisa e pontua clientes potenciais para prioridade de vendas',
          category: 'Vendas',
          icon: '🎯',
          iconColor: 'from-green-400 to-green-600'
        }
      ]
    },
    {
      id: '5',
      name: 'Líder de IA de Engenharia',
      description: 'Coordena agentes técnicos de IA e suporte ao desenvolvimento',
      category: 'Engenharia',
      icon: '⚙️',
      iconColor: 'from-purple-500 to-purple-700',
      isFeatured: true,
      subordinates: [
        {
          id: '6',
          name: 'Assistente de código',
          description: 'Fornece ajuda com codificação e suporte para debugging',
          category: 'Engenharia',
          icon: '💻',
          iconColor: 'from-yellow-400 to-orange-500',
          isFeatured: true
        },
        {
          id: '7',
          name: 'Revisor de pull request',
          description: 'Revisão automatizada de código e garantia de qualidade',
          category: 'Engenharia',
          icon: '🔍',
          iconColor: 'from-pink-400 to-pink-600'
        }
      ]
    },
    {
      id: '8',
      name: 'Gerente de IA de Suporte',
      description: 'Supervisiona sistemas de IA de suporte ao cliente e assistência',
      category: 'Suporte',
      icon: '🆘',
      iconColor: 'from-orange-500 to-red-500',
      subordinates: [
        {
          id: '9',
          name: 'Assistente de dados',
          description: 'Auxilia com análise e gerenciamento de dados',
          category: 'Suporte',
          icon: '📊',
          iconColor: 'from-green-400 to-emerald-500',
          isFeatured: true
        }
      ]
    },
    {
      id: '10',
      name: 'Líder de IA de Conteúdo',
      description: 'Gerencia agentes de IA de criação de conteúdo e documentação',
      category: 'Marketing',
      icon: '✍️',
      iconColor: 'from-green-500 to-teal-600',
      subordinates: [
        {
          id: '11',
          name: 'Assistente de documentos',
          description: 'Entende e interage com documentos extensos',
          category: 'Marketing',
          icon: '📄',
          iconColor: 'from-blue-400 to-indigo-500',
          isFeatured: true
        },
        {
          id: '12',
          name: 'Redator de voz da marca',
          description: 'Cria mensagens de marca consistentes e envolventes',
          category: 'Marketing',
          icon: '🎨',
          iconColor: 'from-red-400 to-pink-500'
        }
      ]
    }
  ]
};

// Additional AI agents for specialized tasks
export const additionalEmployees: Employee[] = [
  {
    id: '13',
    name: 'Agente de RH',
    description: 'Otimiza processos de RH e aumenta a eficiência',
    category: 'Administrativo',
    icon: '👥',
    iconColor: 'from-purple-400 to-purple-600',
    isFeatured: true
  },
  {
    id: '14',
    name: 'Notícias do setor',
    description: 'Identifica e resume notícias relevantes do setor',
    category: 'Marketing',
    icon: '📰',
    iconColor: 'from-green-400 to-green-600'
  },
  {
    id: '15',
    name: 'Preparação de reunião',
    description: 'Pesquisa participantes, agenda e conversas anteriores',
    category: 'Engenharia',
    icon: '📋',
    iconColor: 'from-yellow-400 to-yellow-600',
    isFeatured: true
  },
  {
    id: '16',
    name: 'Bot de avaliação de desempenho',
    description: 'Automatiza avaliações de desempenho com feedback objetivo',
    category: 'Administrativo',
    icon: '📈',
    iconColor: 'from-blue-400 to-blue-600'
  },
  {
    id: '17',
    name: 'Resumo diário',
    description: 'Prepara seu dia com atualizações de menções e reuniões',
    category: 'Financeiro',
    icon: '☕',
    iconColor: 'from-orange-400 to-orange-600'
  },
  {
    id: '18',
    name: 'Compositor de e-mail',
    description: 'Cria e-mails profissionais com tom e contexto apropriados',
    category: 'Vendas',
    icon: '✉️',
    iconColor: 'from-indigo-400 to-indigo-600'
  },
  {
    id: '19',
    name: 'Agendador de reuniões',
    description: 'Agendamento inteligente com resolução de conflitos',
    category: 'Suporte',
    icon: '🗓️',
    iconColor: 'from-teal-400 to-teal-600'
  },
  {
    id: '20',
    name: 'Assistente de pesquisa',
    description: 'Pesquisa aprofundada sobre tópicos com compilação de fontes',
    category: 'Engenharia',
    icon: '🔬',
    iconColor: 'from-cyan-400 to-cyan-600'
  }
];

// Category color mapping
export const categoryColors: Record<string, string> = {
  'Vendas': 'bg-blue-100 text-blue-800 border-blue-200',
  'Engenharia': 'bg-purple-100 text-purple-800 border-purple-200',
  'Suporte': 'bg-orange-100 text-orange-800 border-orange-200',
  'Marketing': 'bg-green-100 text-green-800 border-green-200',
  'Financeiro': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Administrativo': 'bg-pink-100 text-pink-800 border-pink-200',
  'Todas as Equipes': 'bg-gray-100 text-gray-800 border-gray-200'
};