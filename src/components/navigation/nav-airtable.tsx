"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Table } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavAirtable({
  groupLabelStyle,
  itemTextStyle,
}: {
  groupLabelStyle?: React.CSSProperties
  itemTextStyle?: React.CSSProperties
} = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const [schemas, setSchemas] = useState<Array<{ id: string; name: string }>>([])

  const loadSchemas = async () => {
    try {
      const res = await fetch("/api/airtable/nav", { cache: "no-store" })
      if (!res.ok) return
      const json = await res.json().catch(() => ({}))
      const list = (json?.schemas || []) as Array<{ id: string; name: string }>
      setSchemas(Array.isArray(list) ? list : [])
    } catch {
      // keep sidebar resilient
    }
  }

  useEffect(() => {
    loadSchemas()
    const onChanged = () => loadSchemas()
    window.addEventListener("airtable:schema-changed", onChanged)
    return () => window.removeEventListener("airtable:schema-changed", onChanged)
  }, [])

  return (
    <SidebarGroup>
      <SidebarGroupLabel style={groupLabelStyle}>Airtable</SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Airtable"
            onClick={() => router.push("/airtable")}
            isActive={pathname === "/airtable"}
          >
            <Table className="w-3 h-3" />
            <span style={itemTextStyle}>Airtable</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {schemas.map((schema) => (
          <SidebarMenuItem key={schema.id}>
            <SidebarMenuButton
              tooltip={schema.name}
              onClick={() => router.push(`/airtable/${schema.id}`)}
              isActive={pathname.startsWith(`/airtable/${schema.id}`)}
            >
              <Table className="w-3 h-3 opacity-50" />
              <span style={itemTextStyle}>{schema.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
