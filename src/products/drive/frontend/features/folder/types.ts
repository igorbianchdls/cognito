import type { DriveItem } from "@/products/drive/shared/types"

export type FolderApiResponse = {
  success: boolean
  message?: string
  folder?: {
    id: string
    name: string
    workspaceId: string
  }
  files?: DriveItem[]
}
