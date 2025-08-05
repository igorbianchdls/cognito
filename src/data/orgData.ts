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
  name: 'AI Coordinator',
  description: 'Central orchestrator managing all AI agents and workflow optimization',
  category: 'All Teams',
  icon: '🤖',
  iconColor: 'from-purple-500 to-indigo-600',
  isFeatured: true,
  capabilities: ['Workflow orchestration', 'Agent coordination', 'Performance optimization'],
  subordinates: [
    {
      id: '2',
      name: 'Sales AI Director',
      description: 'Manages sales automation and customer engagement AI agents',
      category: 'Sales',
      icon: '💼',
      iconColor: 'from-blue-500 to-cyan-600',
      isFeatured: true,
      subordinates: [
        {
          id: '3',
          name: 'Personalize sales outreach',
          description: 'Help with making great sales outreach emails',
          category: 'Sales',
          icon: '📧',
          iconColor: 'from-blue-400 to-blue-600'
        },
        {
          id: '4',
          name: 'Lead qualifier',
          description: 'Analyze and score potential customers for sales priority',
          category: 'Sales',
          icon: '🎯',
          iconColor: 'from-green-400 to-green-600'
        }
      ]
    },
    {
      id: '5',
      name: 'Engineering AI Lead',
      description: 'Coordinates technical AI agents and development support',
      category: 'Engineering',
      icon: '⚙️',
      iconColor: 'from-purple-500 to-purple-700',
      isFeatured: true,
      subordinates: [
        {
          id: '6',
          name: 'Code buddy',
          description: 'Provides coding help and debugging support',
          category: 'Engineering',
          icon: '💻',
          iconColor: 'from-yellow-400 to-orange-500',
          isFeatured: true
        },
        {
          id: '7',
          name: 'Pull request reviewer',
          description: 'Automated code review and quality assurance',
          category: 'Engineering',
          icon: '🔍',
          iconColor: 'from-pink-400 to-pink-600'
        }
      ]
    },
    {
      id: '8',
      name: 'Support AI Manager',
      description: 'Oversees customer support and assistance AI systems',
      category: 'Support',
      icon: '🆘',
      iconColor: 'from-orange-500 to-red-500',
      subordinates: [
        {
          id: '9',
          name: 'Data Helper',
          description: 'Assists with data analysis and management',
          category: 'Support',
          icon: '📊',
          iconColor: 'from-green-400 to-emerald-500',
          isFeatured: true
        }
      ]
    },
    {
      id: '10',
      name: 'Content AI Lead',
      description: 'Manages content creation and documentation AI agents',
      category: 'Marketing',
      icon: '✍️',
      iconColor: 'from-green-500 to-teal-600',
      subordinates: [
        {
          id: '11',
          name: 'Document buddy',
          description: 'Understand and engage with a long document',
          category: 'Marketing',
          icon: '📄',
          iconColor: 'from-blue-400 to-indigo-500',
          isFeatured: true
        },
        {
          id: '12',
          name: 'Brand voice writer',
          description: 'Creates consistent and engaging brand messaging',
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
    name: 'HR agent',
    description: 'Streamlines HR processes and enhances efficiency',
    category: 'G&A',
    icon: '👥',
    iconColor: 'from-purple-400 to-purple-600',
    isFeatured: true
  },
  {
    id: '14',
    name: 'Industry news',
    description: 'Identifies and summarizes relevant industry news',
    category: 'Marketing',
    icon: '📰',
    iconColor: 'from-green-400 to-green-600'
  },
  {
    id: '15',
    name: 'Prep for a meeting',
    description: 'Research attendees, agenda, and past conversations',
    category: 'Engineering',
    icon: '📋',
    iconColor: 'from-yellow-400 to-yellow-600',
    isFeatured: true
  },
  {
    id: '16',
    name: 'Perf review bot',
    description: 'Automates performance reviews with objective feedback',
    category: 'G&A',
    icon: '📈',
    iconColor: 'from-blue-400 to-blue-600'
  },
  {
    id: '17',
    name: 'Daily summary',
    description: 'Prep for your day by catching up on mentions and meetings',
    category: 'Finance',
    icon: '☕',
    iconColor: 'from-orange-400 to-orange-600'
  },
  {
    id: '18',
    name: 'Email composer',
    description: 'Craft professional emails with appropriate tone and context',
    category: 'Sales',
    icon: '✉️',
    iconColor: 'from-indigo-400 to-indigo-600'
  },
  {
    id: '19',
    name: 'Meeting scheduler',
    description: 'Intelligent scheduling with conflict resolution',
    category: 'Support',
    icon: '🗓️',
    iconColor: 'from-teal-400 to-teal-600'
  },
  {
    id: '20',
    name: 'Research assistant',
    description: 'Deep dive research on topics with source compilation',
    category: 'Engineering',
    icon: '🔬',
    iconColor: 'from-cyan-400 to-cyan-600'
  }
];

// Category color mapping
export const categoryColors: Record<string, string> = {
  'Sales': 'bg-blue-100 text-blue-800 border-blue-200',
  'Engineering': 'bg-purple-100 text-purple-800 border-purple-200',
  'Support': 'bg-orange-100 text-orange-800 border-orange-200',
  'Marketing': 'bg-green-100 text-green-800 border-green-200',
  'Finance': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'G&A': 'bg-pink-100 text-pink-800 border-pink-200',
  'All Teams': 'bg-gray-100 text-gray-800 border-gray-200'
};