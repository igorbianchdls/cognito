import type { Integration } from '@/components/navigation/integrations/IntegrationCard'

export type FilterTab = 'all' | 'connected' | 'disconnected'

export type IntegrationCategory = Integration['category']

export type ToolkitDefinition = {
  slug: string
  name: string
  description: string
}

export type ToolkitStatusMap = Record<string, boolean>
