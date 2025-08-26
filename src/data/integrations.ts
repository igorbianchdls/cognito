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
      return 'Advertising & Marketing';
    case 'analytics':
      return 'Analytics & Tracking';
    case 'ecommerce':
      return 'E-commerce Platforms';
    case 'financial':
      return 'Financial & Accounting';
    case 'crm':
      return 'CRM & Marketing';
    case 'database':
      return 'Databases & Storage';
    default:
      return '';
  }
};

export const getCategoryDescription = (category: 'advertising' | 'analytics' | 'ecommerce' | 'financial' | 'crm' | 'database'): string => {
  switch (category) {
    case 'advertising':
      return 'Connect your advertising platforms to analyze campaign performance and ROI';
    case 'analytics':
      return 'Integrate analytics tools to track user behavior and website performance';
    case 'ecommerce':
      return 'Sync your online store data for comprehensive sales and inventory analysis';
    case 'financial':
      return 'Import financial data to track revenue, expenses, and business performance';
    case 'crm':
      return 'Connect CRM systems for customer relationship management and marketing automation';
    case 'database':
      return 'Integrate databases and data warehouses for comprehensive data analysis';
    default:
      return '';
  }
};