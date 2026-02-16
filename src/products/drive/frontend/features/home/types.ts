import type { DriveItem } from "@/products/drive/shared/types"

export type WorkspaceOption = {
  id: string
  name: string
}

export type FolderItem = {
  id: string
  name: string
  filesCount: number
  size?: string
}

export type DriveApiResponse = {
  success: boolean
  message?: string
  workspaces?: WorkspaceOption[]
  activeWorkspaceId?: string | null
  folders?: FolderItem[]
  recentFiles?: DriveItem[]
}
