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
  name: 'Nexus',
  description: 'CEO e orquestrador principal de todos os agentes especializados da empresa',
  category: 'Executivo',
  icon: '👑',
  iconColor: 'from-purple-600 to-indigo-700',
  isFeatured: true,
  subordinates: [
    {
      id: '2',
      name: 'Diretor de Vendas',
      description: 'Supervisiona todas as áreas relacionadas a geração de receita e vendas',
      category: 'Vendas',
      icon: '📈',
      iconColor: 'from-blue-600 to-blue-800',
      isFeatured: true,
      subordinates: [
        {
          id: '3',
          name: 'Diretor de Tráfego Pago',
          description: 'Gerencia todos os agentes de publicidade e campanhas pagas',
          category: 'Tráfego Pago',
          icon: '💸',
          iconColor: 'from-green-500 to-emerald-600',
          isFeatured: true,
          subordinates: [
            {
              id: '4',
              name: 'Meta Analyst',
              description: 'Analisa performance de campanhas do Meta (Facebook/Instagram)',
              category: 'Tráfego Pago',
              icon: 'meta-icon',
              iconColor: 'from-blue-500 to-blue-700'
            },
            {
              id: '5',
              name: 'Amazon Ads Analyst',
              description: 'Otimiza campanhas publicitárias na plataforma Amazon',
              category: 'Tráfego Pago',
              icon: 'amazon-icon',
              iconColor: 'from-orange-500 to-orange-700'
            },
            {
              id: '6',
              name: 'Google Campaign Analyst',
              description: 'Gerencia e otimiza campanhas do Google Ads',
              category: 'Tráfego Pago',
              icon: 'google-ads-icon',
              iconColor: 'from-red-500 to-red-700'
            },
            {
              id: '7',
              name: 'Meta Campaign Analyst',
              description: 'Especialista em otimização de campanhas Meta',
              category: 'Tráfego Pago',
              icon: 'meta-icon',
              iconColor: 'from-blue-400 to-blue-600'
            },
            {
              id: '8',
              name: 'Meta Creative Analyst',
              description: 'Analisa performance de criativos nas campanhas Meta',
              category: 'Tráfego Pago',
              icon: 'meta-icon',
              iconColor: 'from-purple-500 to-purple-700'
            },
            {
              id: '26',
              name: 'Analista GMN',
              description: 'Especialista em Google Merchant Network e Google Shopping',
              category: 'Tráfego Pago',
              icon: '🛍️',
              iconColor: 'from-yellow-500 to-orange-600'
            }
          ]
        },
        {
          id: '9',
          name: 'Diretor de Marketing',
          description: 'Coordena estratégias de marketing digital e analytics',
          category: 'Marketing',
          icon: '📊',
          iconColor: 'from-pink-500 to-rose-600',
          isFeatured: true,
          subordinates: [
            {
              id: '10',
              name: 'Google Analytics Analyst',
              description: 'Especialista em análise de dados do Google Analytics',
              category: 'Marketing',
              icon: 'google-analytics-icon',
              iconColor: 'from-orange-400 to-orange-600'
            },
            {
              id: '11',
              name: 'Keyword Analyst',
              description: 'Especialista em pesquisa e otimização de palavras-chave',
              category: 'Marketing',
              icon: '🔍',
              iconColor: 'from-teal-500 to-teal-700'
            },
            {
              id: '27',
              name: 'Estrategista SEO',
              description: 'Especialista em SEO e estratégias de otimização orgânica',
              category: 'Marketing',
              icon: '🎯',
              iconColor: 'from-green-500 to-green-700'
            }
          ]
        },
        {
          id: '12',
          name: 'Diretor Comercial',
          description: 'Supervisiona vendas e plataformas de e-commerce',
          category: 'Comercial',
          icon: '💼',
          iconColor: 'from-indigo-500 to-indigo-700',
          isFeatured: true,
          subordinates: [
            {
              id: '13',
              name: 'Shopify Analyst',
              description: 'Analisa performance e otimiza vendas na plataforma Shopify',
              category: 'Comercial',
              icon: 'shopify-icon',
              iconColor: 'from-green-400 to-green-600'
            },
            {
              id: '14',
              name: 'Shopee Analyst',
              description: 'Especialista em análise de vendas e otimização no Shopee',
              category: 'Comercial',
              icon: 'shopee-icon',
              iconColor: 'from-orange-400 to-red-500'
            }
          ]
        }
      ]
    },
    {
      id: '15',
      name: 'Diretor Operacional',
      description: 'Supervisiona todas as operações internas e suporte da empresa',
      category: 'Operacional',
      icon: '⚙️',
      iconColor: 'from-gray-600 to-slate-700',
      isFeatured: true,
      subordinates: [
        {
          id: '16',
          name: 'Diretor Financeiro',
          description: 'Gerencia análises financeiras e planejamento orçamentário',
          category: 'Financeiro',
          icon: '💰',
          iconColor: 'from-yellow-500 to-amber-600',
          isFeatured: true,
          subordinates: [
            {
              id: '17',
              name: 'Cash Flow Analyst',
              description: 'Especialista em análise e projeção de fluxo de caixa',
              category: 'Financeiro',
              icon: '💵',
              iconColor: 'from-green-500 to-green-700'
            },
            {
              id: '18',
              name: 'P&L Analyst',
              description: 'Analisa demonstrações de resultados e lucratividade',
              category: 'Financeiro',
              icon: '📊',
              iconColor: 'from-blue-500 to-blue-700'
            },
            {
              id: '19',
              name: 'Budget Planning Analyst',
              description: 'Especialista em planejamento e controle orçamentário',
              category: 'Financeiro',
              icon: '📋',
              iconColor: 'from-purple-500 to-purple-700'
            }
          ]
        },
        {
          id: '20',
          name: 'Diretor de Supply Chain',
          description: 'Gerencia análises de estoque e cadeia de suprimentos',
          category: 'Supply Chain',
          icon: '📦',
          iconColor: 'from-cyan-500 to-cyan-700',
          subordinates: [
            {
              id: '21',
              name: 'Inventory Analyst',
              description: 'Analisa níveis de estoque e otimiza cadeia de suprimentos',
              category: 'Supply Chain',
              icon: '📊',
              iconColor: 'from-teal-400 to-teal-600'
            }
          ]
        },
        {
          id: '22',
          name: 'Diretor Contábil',
          description: 'Supervisiona análises contábeis e compliance fiscal',
          category: 'Contábil',
          icon: '🧮',
          iconColor: 'from-slate-500 to-slate-700',
          subordinates: [
            {
              id: '23',
              name: 'ContaAzul Analyst',
              description: 'Especialista em análise de dados contábeis do sistema ContaAzul',
              category: 'Contábil',
              icon: 'conta-azul-icon',
              iconColor: 'from-blue-400 to-blue-600'
            }
          ]
        },
        {
          id: '24',
          name: 'Diretor Jurídico',
          description: 'Coordena análises jurídicas e compliance regulatório',
          category: 'Jurídico',
          icon: '⚖️',
          iconColor: 'from-gray-600 to-gray-800',
          subordinates: [
            {
              id: '25',
              name: 'Agente de Compliance',
              description: 'Monitora compliance regulatório e análise jurídica',
              category: 'Jurídico',
              icon: '📜',
              iconColor: 'from-gray-500 to-gray-700'
            }
          ]
        },
        {
          id: '28',
          name: 'Diretor de Business Intelligence',
          description: 'Gerencia análises de BI e criação de dashboards estratégicos',
          category: 'Business Intelligence',
          icon: '📊',
          iconColor: 'from-violet-500 to-violet-700',
          subordinates: [
            {
              id: '29',
              name: 'Criador de Dashboard',
              description: 'Especialista em criação de dashboards e visualização de dados',
              category: 'Business Intelligence',
              icon: '📈',
              iconColor: 'from-blue-400 to-indigo-600'
            }
          ]
        }
      ]
    }
  ]
};

// Additional AI agents for specialized tasks (empty since all agents are now in main hierarchy)
export const additionalEmployees: Employee[] = [];

// Category color mapping
export const categoryColors: Record<string, string> = {
  'Executivo': 'bg-purple-100 text-purple-800 border-purple-200',
  'Vendas': 'bg-blue-100 text-blue-800 border-blue-200',
  'Operacional': 'bg-gray-100 text-gray-800 border-gray-200',
  'Tráfego Pago': 'bg-green-100 text-green-800 border-green-200',
  'Marketing': 'bg-pink-100 text-pink-800 border-pink-200',
  'Comercial': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Financeiro': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Supply Chain': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Contábil': 'bg-slate-100 text-slate-800 border-slate-200',
  'Jurídico': 'bg-gray-100 text-gray-800 border-gray-200',
  'Business Intelligence': 'bg-violet-100 text-violet-800 border-violet-200',
  'Todas as Equipes': 'bg-gray-100 text-gray-800 border-gray-200'
};