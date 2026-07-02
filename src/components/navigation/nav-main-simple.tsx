"use client"

import { useRouter } from "next/navigation"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type SidebarIconComponent = React.ComponentType<{
  className?: string
  style?: React.CSSProperties
}>

const verticalSidebarItemClassName =
  "mx-auto h-16 w-auto min-w-9 flex-col items-center justify-center gap-1 overflow-visible px-0.5 py-2 text-center group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-2"
const verticalSidebarTitleClassName =
  "max-w-full overflow-visible whitespace-nowrap text-center leading-[1.2] group-data-[collapsible=icon]:hidden"

export function NavMainSimple({
  items,
  itemTextStyle,
  iconSizePx = 12,
}: {
  items: {
    title: string
    url?: string
    icon?: SidebarIconComponent
    isActive?: boolean
  }[]
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
      <SidebarMenu className="gap-0.5">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              onClick={() => handleNavigation(item.url)}
              isActive={item.isActive}
              className={verticalSidebarItemClassName}
            >
              {item.icon && <item.icon className="shrink-0 text-[#808080]" style={{ width: iconSizePx, height: iconSizePx }} />}
              <span className={verticalSidebarTitleClassName} style={itemTextStyle}>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
