import type { LucideIcon } from "lucide-react"
import { File, FileText, Image as ImageIcon, Music2, Video } from "lucide-react"

import type { DriveItem } from "@/products/drive/shared/types"

const FALLBACK_OWNERS = [
  "kevin@mail.com",
  "antowe@gmail.com",
  "igor@creatto.ai",
  "dani@workspace.com",
  "ops@team.io",
]

export function getTypeIcon(item: DriveItem): LucideIcon {
  const mime = item.mime || ""
  if (mime.startsWith("image/")) return ImageIcon
  if (mime.startsWith("video/")) return Video
  if (mime.startsWith("audio/")) return Music2
  if (mime === "application/pdf") return FileText
  return File
}

export function getTypeLabel(item: DriveItem): string {
  const mime = item.mime || ""
  if (mime.startsWith("image/")) return "Image"
  if (mime.startsWith("video/")) return "Video"
  if (mime.startsWith("audio/")) return "Audio"
  if (mime === "application/pdf") return "PDF"
  return "File"
}

export function inferSize(item: DriveItem, index: number): string {
  if (item.size) return item.size
  const mime = item.mime || ""
  if (mime.startsWith("video/")) return `${(120 + index * 13).toFixed(0)} MB`
  if (mime.startsWith("audio/")) return `${(12 + index * 2).toFixed(0)} MB`
  if (mime.startsWith("image/")) return `${(3.1 + index * 0.4).toFixed(1)} MB`
  if (mime === "application/pdf") return `${(8.2 + index * 0.9).toFixed(1)} MB`
  return `${(5.5 + index * 0.7).toFixed(1)} MB`
}

export function inferAddedAt(item: DriveItem, index: number): string {
  if (item.addedAt) return item.addedAt
  const date = new Date()
  date.setDate(date.getDate() - (index * 2 + 1))
  return date.toISOString()
}

export function formatAddedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

export function inferAddedBy(item: DriveItem, index: number): string {
  return item.addedBy || FALLBACK_OWNERS[index % FALLBACK_OWNERS.length]
}

export function avatarInitial(email: string): string {
  return (email.trim()[0] || "U").toUpperCase()
}
