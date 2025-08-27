export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  category: 'advertising' | 'analytics' | 'ecommerce' | 'financial' | 'crm' | 'database';
}

export const integrations: Integration[] = [
  // Advertising & Marketing
  {
    id: 'meta-ads',
    name: 'Meta Ads',
    description: 'Connect your Facebook and Instagram advertising data for comprehensive campaign analysis.',
    icon: 'meta',
    connected: true,
    category: 'advertising'
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Import Google Ads campaign performance data and keyword insights.',
    icon: 'google-ads',
    connected: false,
    category: 'advertising'
  },
  {
    id: 'amazon-ads',
    name: 'Amazon Ads',
    description: 'Analyze your Amazon advertising campaigns and product performance.',
    icon: 'amazon',
    connected: false,
    category: 'advertising'
  },
  
  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Connect your website analytics data for comprehensive user behavior insights.',
    icon: 'google-analytics',
    connected: true,
    category: 'analytics'
  },
  
  // E-commerce
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Sync your Shopify store data including orders, products, and customer information.',
    icon: 'shopify',
    connected: false,
    category: 'ecommerce'
  },
  {
    id: 'shopee',
    name: 'Shopee',
    description: 'Connect your Shopee marketplace data for sales and inventory analysis.',
    icon: 'shopee',
    connected: false,
    category: 'ecommerce'
  },
  {
    id: 'amazon',
    name: 'Amazon',
    description: 'Sincronize dados da sua loja Amazon para análise de vendas e inventário.',
    icon: 'amazon',
    connected: false,
    category: 'ecommerce'
  },
  {
    id: 'mercado-livre',
    name: 'Mercado Livre',
    description: 'Conecte sua loja do Mercado Livre para análise de vendas e gestão de produtos.',
    icon: 'mercado-livre',
    connected: false,
    category: 'ecommerce'
  },
  {
    id: 'magalu',
    name: 'Magazine Luiza',
    description: 'Integre sua loja do Magalu para análise de vendas e controle de inventário.',
    icon: 'magalu',
    connected: false,
    category: 'ecommerce'
  },
  
  // Financial
  {
    id: 'conta-azul',
    name: 'ContaAzul',
    description: 'Import financial data and accounting information from ContaAzul.',
    icon: 'conta-azul',
    connected: false,
    category: 'financial'
  },
  {
    id: 'totvs',
    name: 'TOTVS',
    description: 'Connect with TOTVS ERP system for comprehensive business management data.',
    icon: 'totvs',
    connected: false,
    category: 'financial'
  },
  {
    id: 'sap',
    name: 'SAP',
    description: 'Integrate SAP ERP data for enterprise resource planning insights.',
    icon: 'sap',
    connected: false,
    category: 'financial'
  },
  {
    id: 'omie',
    name: 'Omie',
    description: 'Sync Omie ERP data for small and medium business financial management.',
    icon: 'omie',
    connected: false,
    category: 'financial'
  },
  {
    id: 'bling',
    name: 'Bling',
    description: 'Connect Bling ERP for e-commerce and retail business data integration.',
    icon: 'bling',
    connected: false,
    category: 'financial'
  },
  {
    id: 'tiny',
    name: 'Tiny ERP',
    description: 'Integrate Tiny ERP for complete business management and financial control.',
    icon: 'tiny',
    connected: false,
    category: 'financial'
  },
  
  // CRM & Marketing
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Connect HubSpot CRM for customer relationship management and marketing automation.',
    icon: 'hubspot',
    connected: false,
    category: 'crm'
  },
  {
    id: 'rd-station',
    name: 'RD Station',
    description: 'Integrate RD Station for marketing automation and lead management.',
    icon: 'rd-station',
    connected: false,
    category: 'crm'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Connect Salesforce CRM for comprehensive customer data and sales insights.',
    icon: 'salesforce',
    connected: false,
    category: 'crm'
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sync Pipedrive CRM for sales pipeline management and customer tracking.',
    icon: 'pipedrive',
    connected: false,
    category: 'crm'
  },
  
  // Databases & Storage
  {
    id: 'mysql',
    name: 'MySQL',
    description: 'Connect MySQL database for relational data analysis and reporting.',
    icon: 'mysql',
    connected: false,
    category: 'database'
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'Integrate PostgreSQL database for advanced relational data processing.',
    icon: 'postgresql',
    connected: false,
    category: 'database'
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'Connect MongoDB for NoSQL document database analysis.',
    icon: 'mongodb',
    connected: false,
    category: 'database'
  },
  {
    id: 'bigquery-integration',
    name: 'BigQuery',
    description: 'Integrate Google BigQuery data warehouse for large-scale analytics.',
    icon: 'bigquery',
    connected: true,
    category: 'database'
  }
];

export const getCategoryTitle = (category: 'advertising' | 'analytics' | 'ecommerce' | 'financial' | 'crm' | 'database'): string => {
  switch (category) {
    case 'advertising':
      return 'Publicidade e Marketing';
    case 'analytics':
      return 'Analytics e Rastreamento';
    case 'ecommerce':
      return 'Plataformas de E-commerce';
    case 'financial':
      return 'Financeiro e Contabilidade';
    case 'crm':
      return 'CRM e Marketing';
    case 'database':
      return 'Bancos de Dados e Armazenamento';
    default:
      return '';
  }
};

export const getCategoryDescription = (category: 'advertising' | 'analytics' | 'ecommerce' | 'financial' | 'crm' | 'database'): string => {
  switch (category) {
    case 'advertising':
      return 'Conecte suas plataformas de publicidade para analisar performance de campanhas e ROI';
    case 'analytics':
      return 'Integre ferramentas de analytics para rastrear comportamento do usuário e performance do site';
    case 'ecommerce':
      return 'Sincronize dados da sua loja online para análise abrangente de vendas e estoque';
    case 'financial':
      return 'Importe dados financeiros para rastrear receita, gastos e performance do negócio';
    case 'crm':
      return 'Conecte sistemas de CRM para gestão de relacionamento com clientes e automação de marketing';
    case 'database':
      return 'Integre bancos de dados e data warehouses para análise abrangente de dados';
    default:
      return '';
  }
};