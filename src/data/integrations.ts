export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  category: 'advertising' | 'analytics' | 'ecommerce' | 'financial';
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
  }
];

export const getCategoryTitle = (category: 'advertising' | 'analytics' | 'ecommerce' | 'financial'): string => {
  switch (category) {
    case 'advertising':
      return 'Advertising & Marketing';
    case 'analytics':
      return 'Analytics & Tracking';
    case 'ecommerce':
      return 'E-commerce Platforms';
    case 'financial':
      return 'Financial & Accounting';
    default:
      return '';
  }
};

export const getCategoryDescription = (category: 'advertising' | 'analytics' | 'ecommerce' | 'financial'): string => {
  switch (category) {
    case 'advertising':
      return 'Connect your advertising platforms to analyze campaign performance and ROI';
    case 'analytics':
      return 'Integrate analytics tools to track user behavior and website performance';
    case 'ecommerce':
      return 'Sync your online store data for comprehensive sales and inventory analysis';
    case 'financial':
      return 'Import financial data to track revenue, expenses, and business performance';
    default:
      return '';
  }
};