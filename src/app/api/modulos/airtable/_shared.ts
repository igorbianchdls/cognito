import { NextRequest } from "next/server"
import { resolveTenantId } from "@/lib/tenant"

export const maxDuration = 300
export const dynamic = "force-dynamic"
export const revalidate = 0

export function getTenantId(req: NextRequest) {
  return resolveTenantId(req.headers)
}

export function toSlug(input: string) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || "untitled"
}

