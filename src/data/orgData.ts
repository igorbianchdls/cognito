export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  location: string;
  avatar: string;
  subordinates?: Employee[];
  connectionScore?: number;
}

export const orgData: Employee = {
  id: '1',
  name: 'Hanna Booth',
  position: 'CEO',
  department: 'Executive Management',
  location: 'San Francisco',
  avatar: '/api/placeholder/80/80',
  connectionScore: 892,
  subordinates: [
    {
      id: '2',
      name: 'Darryl Rich',
      position: 'VP - Business Systems',
      department: 'Phoenix',
      location: 'Phoenix',
      avatar: '/api/placeholder/80/80',
      connectionScore: 170,
      subordinates: [
        {
          id: '3',
          name: 'Fiona Nash',
          position: 'Personal Assistant',
          department: 'Manufacturing',
          location: 'Manufacturing',
          avatar: '/api/placeholder/80/80',
          connectionScore: 43
        },
        {
          id: '4',
          name: 'Oleg Joseph',
          position: 'Manager - Business Systems',
          department: 'Business Systems',
          location: 'Business Systems',
          avatar: '/api/placeholder/80/80',
          connectionScore: 43
        }
      ]
    },
    {
      id: '5',
      name: 'April Larson',
      position: 'VP - Technology',
      department: 'Phoenix',
      location: 'Phoenix',
      avatar: '/api/placeholder/80/80',
      connectionScore: 444,
      subordinates: [
        {
          id: '6',
          name: 'Bradley Chambers',
          position: 'Recruitment Manager',
          department: 'Technical',
          location: 'Technical',
          avatar: '/api/placeholder/80/80',
          connectionScore: 41
        },
        {
          id: '7',
          name: 'Cherokee Garrison',
          position: 'Manager - Delivery',
          department: 'Manufacturing',
          location: 'Manufacturing',
          avatar: '/api/placeholder/80/80',
          connectionScore: 43
        }
      ]
    },
    {
      id: '8',
      name: 'Adrienne Decker',
      position: 'VP - Research',
      department: 'Chicago',
      location: 'Chicago',
      avatar: '/api/placeholder/80/80',
      connectionScore: 39,
      subordinates: [
        {
          id: '9',
          name: 'Harwill Bricksey',
          position: 'VP - Marketing and Sales',
          department: 'Phoenix',
          location: 'Executive Management',
          avatar: '/api/placeholder/80/80',
          connectionScore: 37
        }
      ]
    },
    {
      id: '10',
      name: 'Francis Jefferson',
      position: 'Senior Manager',
      department: 'San Francisco',
      location: 'Executive Management',
      avatar: '/api/placeholder/80/80',
      connectionScore: 348,
      subordinates: [
        {
          id: '11',
          name: 'Levi Bates',
          position: 'Personal Assistant',
          department: 'New York',
          location: 'Technical',
          avatar: '/api/placeholder/80/80',
          connectionScore: 41
        }
      ]
    }
  ]
};

// Additional employees for lower levels
export const additionalEmployees: Employee[] = [
  {
    id: '12',
    name: 'Bell Michael',
    position: 'Manager - Business Systems',
    department: 'Business Systems',
    location: 'Phoenix',
    avatar: '/api/placeholder/80/80',
    connectionScore: 45
  },
  {
    id: '13',
    name: 'Dolan Clements',
    position: 'Personal Assistant',
    department: 'New York',
    location: 'Manufacturing',
    avatar: '/api/placeholder/80/80',
    connectionScore: 42
  },
  {
    id: '14',
    name: 'Francine Iglesia',
    position: 'Manager - Delivery',
    department: 'Phoenix',
    location: 'Manufacturing',
    avatar: '/api/placeholder/80/80',
    connectionScore: 42
  },
  {
    id: '15',
    name: 'Zenaida Cervantes',
    position: 'Manager - Business Systems',
    department: 'San Francisco',
    location: 'Business Systems',
    avatar: '/api/placeholder/80/80',
    connectionScore: 43
  },
  {
    id: '16',
    name: 'Georgia Farmer',
    position: 'Manager - Delivery',
    department: 'Boston',
    location: 'Technical',
    avatar: '/api/placeholder/80/80',
    connectionScore: 42
  },
  {
    id: '17',
    name: 'Gretchen Walsh',
    position: 'Manager - Testing',
    department: 'Detroit',
    location: 'Technical',
    avatar: '/api/placeholder/80/80',
    connectionScore: 28
  },
  {
    id: '18',
    name: 'Aiko Tran',
    position: 'System Analyst',
    department: 'Sales',
    location: 'Sales',
    avatar: '/api/placeholder/80/80'
  },
  {
    id: '19',
    name: 'Alex Robinson',
    position: 'System Analyst',
    department: 'Manufacturing',
    location: 'Manufacturing',
    avatar: '/api/placeholder/80/80'
  },
  {
    id: '20',
    name: 'Allegra Gentry',
    position: 'System Analyst',
    department: 'Phoenix',
    location: 'Business Systems',
    avatar: '/api/placeholder/80/80'
  },
  {
    id: '21',
    name: 'Alyssa McFarland',
    position: 'System Analyst',
    department: 'Phoenix',
    location: 'Manufacturing',
    avatar: '/api/placeholder/80/80'
  }
];