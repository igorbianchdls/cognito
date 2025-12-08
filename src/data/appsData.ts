export interface Author {
  id: string
  name: string
  avatar: string
  username: string
}

export interface AppData {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  previewImage: string
  author: Author
  forks: number
  likes: number
  views: number
  createdAt: string
  updatedAt: string
  demoUrl?: string
  sourceUrl?: string
  featured: boolean
  trending: boolean
}

export const categories = [
  'All',
  'Fors',
  's', 
  's',
  'ed',
  'Comts',
  'Logi & gn Up',
  'Blog & orolio',
  'E-commerce',
  'AI'
] as const

export const authors: Author[] = [
  {
    id: '1',
    name: 'Alex aChen',
    avatar: '🧑‍💻',
    username: 'alexchen'
  },
  {
    id: '2', 
    name: 'Maria Silva',
    avatar: '👩‍🎨',
    username: 'mariasilva'
  },
  {
    id: '3',
    name: 'John Smith', 
    avatar: '👨‍💼',
    username: 'johnsmith'
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    avatar: '👩‍💻',
    username: 'sarahwilson'
  }
]

export const mockApps: AppData[] = [
  {
    id: '1',
    title: 'Cyberpunk a Dashoard Design',
    description: 'A futuristic dashboard with dark theme and neon accents, featuring real-time data visualization and interactive charts.',
    category: 'Dashboards',
    tags: ['dashboard', 'dark-theme', 'charts', 'cyberpunk', 'analytics'],
    previewImage: '/api/placeholder/400/300',
    author: authors[0],
    forks: 10400,
    likes: 2500,
    views: 15000,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    demoUrl: 'https://example.com/cyberpunk-demo',
    sourceUrl: 'https://github.com/example/cyberpunk-dashboard',
    featured: true,
    trending: true
  },
  {
    id: '2',
    title: 'Marketing Website',
    description: 'Streamlined Communication for Quick Shipping - Modern marketing site with clean design and conversion-focused landing pages.',
    category: 'Landing Pages',
    tags: ['marketing', 'landing-page', 'conversion', 'saas', 'modern'],
    previewImage: '/api/placeholder/400/300',
    author: authors[1],
    forks: 8000,
    likes: 1800,
    views: 12000,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
    demoUrl: 'https://example.com/marketing-demo',
    featured: true,
    trending: false
  },
  {
    id: '3',
    title: 'Pointer AI Landing Page',
    description: 'Unleash the Power of AI Agents - Cutting-edge AI landing page with interactive elements and modern gradients.',
    category: 'AI',
    tags: ['ai', 'landing-page', 'agents', 'modern', 'gradients'],
    previewImage: '/api/placeholder/400/300',
    author: authors[2],
    forks: 4100,
    likes: 950,
    views: 8500,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-15',
    demoUrl: 'https://example.com/pointer-ai-demo',
    featured: true,
    trending: true
  },
  {
    id: '4',
    title: 'E-commerce Storefront',
    description: 'Complete e-commerce solution with product catalog, shopping cart, and checkout process.',
    category: 'E-commerce',
    tags: ['ecommerce', 'shopping', 'cart', 'checkout', 'products'],
    previewImage: '/api/placeholder/400/300',
    author: authors[3],
    forks: 6200,
    likes: 1400,
    views: 9800,
    createdAt: '2024-01-12',
    updatedAt: '2024-01-22',
    demoUrl: 'https://example.com/store-demo',
    featured: false,
    trending: false
  },
  {
    id: '5',
    title: 'Authentication Forms',
    description: 'Beautiful login and signup forms with validation and multiple authentication options.',
    category: 'Login & Sign Up',
    tags: ['auth', 'forms', 'login', 'signup', 'validation'],
    previewImage: '/api/placeholder/400/300',
    author: authors[0],
    forks: 3800,
    likes: 890,
    views: 7200,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-16',
    demoUrl: 'https://example.com/auth-demo',
    featured: false,
    trending: true
  },
  {
    id: '6',
    title: 'Portfolio Template',
    description: 'Clean and modern portfolio template for developers and designers with project showcase.',
    category: 'Blog & Portfolio',
    tags: ['portfolio', 'developer', 'designer', 'projects', 'showcase'],
    previewImage: '/api/placeholder/400/300',
    author: authors[1],
    forks: 2900,
    likes: 650,
    views: 5400,
    createdAt: '2024-01-03',
    updatedAt: '2024-01-14',
    demoUrl: 'https://example.com/portfolio-demo',
    featured: false,
    trending: false
  },
  {
    id: '7',
    title: 'Data Visualization Components',
    description: 'Reusable chart and graph components built with D3.js and React for data visualization.',
    category: 'Components',
    tags: ['components', 'charts', 'd3', 'visualization', 'react'],
    previewImage: '/api/placeholder/400/300',
    author: authors[2],
    forks: 5600,
    likes: 1250,
    views: 8900,
    createdAt: '2024-01-07',
    updatedAt: '2024-01-19',
    demoUrl: 'https://example.com/charts-demo',
    sourceUrl: 'https://github.com/example/data-viz-components',
    featured: true,
    trending: false
  },
  {
    id: '8',
    title: 'Task Management App',
    description: 'Full-featured task management application with drag-and-drop, team collaboration, and real-time updates.',
    category: 'Apps & Games',
    tags: ['productivity', 'tasks', 'collaboration', 'drag-drop', 'real-time'],
    previewImage: '/api/placeholder/400/300',
    author: authors[3],
    forks: 7300,
    likes: 1680,
    views: 11200,
    createdAt: '2024-01-11',
    updatedAt: '2024-01-21',
    demoUrl: 'https://example.com/tasks-demo',
    featured: false,
    trending: true
  }
]

export function getAppsByCategory(category: string): AppData[] {
  if (category === 'All') {
    return mockApps
  }
  return mockApps.filter(app => app.category === category)
}

export function searchApps(query: string): AppData[] {
  const lowercaseQuery = query.toLowerCase()
  return mockApps.filter(app => 
    app.title.toLowerCase().includes(lowercaseQuery) ||
    app.description.toLowerCase().includes(lowercaseQuery) ||
    app.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

export function getTrendingApps(): AppData[] {
  return mockApps.filter(app => app.trending).sort((a, b) => b.likes - a.likes)
}

export function getFeaturedApps(): AppData[] {
  return mockApps.filter(app => app.featured)
}

export function getAppById(id: string): AppData | undefined {
  return mockApps.find(app => app.id === id)
}