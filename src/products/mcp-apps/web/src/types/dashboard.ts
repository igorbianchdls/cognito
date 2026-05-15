export type DashboardListItem = {
  id?: string
  title?: string
  slug?: string | null
  status?: string | null
  workspace_id?: string | null
  current_draft_version?: number | null
  current_published_version?: number | null
  created_at?: string | null
  updated_at?: string | null
  has_thumbnail?: boolean
  thumbnail_data_url?: string | null
  url?: string | null
  embed_url?: string | null
}

export type DashboardPreview = DashboardListItem & {
  artifact_id?: string
  version?: number | null
  kind?: 'draft' | 'published' | string
  source?: string | null
  metadata?: Record<string, unknown> | null
}
