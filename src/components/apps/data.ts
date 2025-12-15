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

export const categories = ['All'] as const

export const mockApps: AppData[] = []

export function searchApps(_query: string): AppData[] {
  return []
}

export function getAppById(_id: string): AppData | null {
  return null
}

