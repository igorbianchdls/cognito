export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  category: 'sales' | 'communication';
}

export const integrations: Integration[] = [
  // Sales & Marketing Tools
  {
    id: 'google-sales',
    name: 'Google',
    description: 'Offers tools for lead generation, email marketing, and customer service.',
    icon: 'globe',
    connected: true,
    category: 'sales'
  },
  {
    id: 'github-sales',
    name: 'Github',
    description: 'Provides comprehensive sales and customer relationship management.',
    icon: 'github',
    connected: false,
    category: 'sales'
  },
  {
    id: 'spotify-sales',
    name: 'Spotify',
    description: 'Focuses on sales pipeline management with a visual pipeline management tool.',
    icon: 'music',
    connected: false,
    category: 'sales'
  },
  
  // Communication & Collaboration
  {
    id: 'slack-comm',
    name: 'Slack',
    description: 'Enables real-time collaboration and updates on CRM activities.',
    icon: 'slack',
    connected: true,
    category: 'communication'
  },
  {
    id: 'google-comm',
    name: 'Google',
    description: 'Enhances communication and scheduling within the CRM.',
    icon: 'globe',
    connected: true,
    category: 'communication'
  },
  {
    id: 'github-comm-1',
    name: 'Github',
    description: 'Supports seamless integrated CRM inside Microsoft Teams.',
    icon: 'github',
    connected: false,
    category: 'communication'
  },
  {
    id: 'spotify-comm',
    name: 'Spotify',
    description: 'Provides a unified view of customer interactions and schedules.',
    icon: 'music',
    connected: false,
    category: 'communication'
  },
  {
    id: 'github-comm-2',
    name: 'Github',
    description: 'Tracks and manages customer support activities and performance.',
    icon: 'github',
    connected: false,
    category: 'communication'
  },
  {
    id: 'figma-comm',
    name: 'Figma',
    description: 'Streamlines customer support and ticketing within the CRM.',
    icon: 'figma',
    connected: false,
    category: 'communication'
  }
];

export const getCategoryTitle = (category: 'sales' | 'communication'): string => {
  switch (category) {
    case 'sales':
      return 'Sales & Marketing Tools';
    case 'communication':
      return 'Communication & Collaboration';
    default:
      return '';
  }
};

export const getCategoryDescription = (category: 'sales' | 'communication'): string => {
  switch (category) {
    case 'sales':
      return 'Enhancing the efficiency and effectiveness of your sales and marketing activities';
    case 'communication':
      return 'Enhancing the efficiency and effectiveness of team interactions and workflows';
    default:
      return '';
  }
};