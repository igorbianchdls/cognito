"use client"

import { useRouter } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type SidebarIconComponent = React.ComponentType<{
  className?: string
  style?: React.CSSProperties
}>

const verticalSidebarItemClassName =
  "mx-auto h-14 w-auto min-w-9 flex-col items-center justify-center gap-1 px-0.5 py-2 text-center group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-2"
const verticalSidebarTitleClassName =
  "max-w-full truncate text-center leading-tight group-data-[collapsible=icon]:hidden"

export function NavMainSimple({
  items,
  groupLabel = "Navigation",
  groupLabelStyle,
  itemTextStyle,
  iconSizePx = 12,
}: {
  items: {
    title: string
    url?: string
    icon?: SidebarIconComponent
    isActive?: boolean
  }[]
  groupLabel?: string
  groupLabelStyle?: React.CSSProperties
  itemTextStyle?: React.CSSProperties
  iconSizePx?: number
}) {
  const router = useRouter()

  const handleNavigation = (url?: string) => {
    if (!url) return
    router.push(url)
  }

  return (
    <SidebarGroup className="px-1 py-2">
      <SidebarGroupLabel style={groupLabelStyle}>{groupLabel}</SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              onClick={() => handleNavigation(item.url)}
              isActive={item.isActive}
              className={verticalSidebarItemClassName}
            >
              {item.icon && <item.icon className="shrink-0" style={{ width: iconSizePx, height: iconSizePx }} />}
              <span className={verticalSidebarTitleClassName} style={itemTextStyle}>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
