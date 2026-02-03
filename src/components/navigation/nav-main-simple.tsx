"use client"

import { useRouter } from "next/navigation"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMainSimple({
  items,
  groupLabelStyle,
  itemTextStyle,
  iconSizePx = 12,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
  }[]
  groupLabelStyle?: React.CSSProperties
  itemTextStyle?: React.CSSProperties
  iconSizePx?: number
}) {
  const router = useRouter()

  const handleNavigation = (url: string) => {
    router.push(url)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel style={groupLabelStyle}>Navigation</SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              onClick={() => handleNavigation(item.url)}
              isActive={item.isActive}
            >
              {item.icon && <item.icon style={{ width: iconSizePx, height: iconSizePx }} />}
              <span style={itemTextStyle}>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
