"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type SidebarIconComponent = React.ComponentType<{
  className?: string
  style?: React.CSSProperties
}>

export type SimpleNavigationItem = {
  title: string
  url?: string
  icon?: SidebarIconComponent
  isActive?: boolean
  children?: SimpleNavigationItem[]
}

const itemClassName =
  "h-10 w-full justify-start gap-3 rounded-lg px-3 text-left text-[14px] font-normal text-[#565656] hover:bg-black/[0.035] hover:text-[#161616] data-[active=true]:border-transparent data-[active=true]:bg-black/[0.055] data-[active=true]:font-medium data-[active=true]:text-[#151515] group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"

function NavigationRow({ item, iconSizePx }: { item: SimpleNavigationItem; iconSizePx: number }) {
  const router = useRouter()
  const hasChildren = Boolean(item.children?.length)
  const [open, setOpen] = useState(Boolean(item.isActive))

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.title}
          onClick={() => item.url && router.push(item.url)}
          isActive={item.isActive}
          className={itemClassName}
        >
          {item.icon ? <item.icon className="shrink-0 text-[#6b6b6b]" style={{ width: iconSizePx, height: iconSizePx }} /> : null}
          <span className="min-w-0 truncate leading-none group-data-[collapsible=icon]:hidden">{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible open={open || item.isActive} onOpenChange={setOpen} asChild>
      <SidebarMenuItem className="group/collapsible">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={item.isActive} className={itemClassName}>
            {item.icon ? <item.icon className="shrink-0 text-[#6b6b6b]" style={{ width: iconSizePx, height: iconSizePx }} /> : null}
            <span className="min-w-0 flex-1 truncate leading-none group-data-[collapsible=icon]:hidden">{item.title}</span>
            <ChevronDown className="size-3.5 text-[#777] transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mx-0 gap-0 border-0 px-0 py-1">
            {item.children?.map((child) => (
              <SidebarMenuSubItem key={child.title}>
                <SidebarMenuSubButton
                  isActive={child.isActive}
                  onClick={() => child.url && router.push(child.url)}
                  className="h-9 cursor-pointer rounded-lg border-0 pl-11 pr-3 text-[14px] text-[#666] hover:bg-black/[0.035] hover:text-[#161616] data-[active=true]:bg-black/[0.055] data-[active=true]:font-medium data-[active=true]:text-[#151515]"
                >
                  <span>{child.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMainSimple({
  items,
  label,
  iconSizePx = 18,
}: {
  items: SimpleNavigationItem[]
  label?: string
  itemTextStyle?: React.CSSProperties
  iconSizePx?: number
}) {
  return (
    <SidebarGroup className="px-2 py-1.5">
      {label ? (
        <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b8b8b]">
          {label}
        </SidebarGroupLabel>
      ) : null}
      <SidebarMenu className="gap-0.5">
        {items.map((item) => <NavigationRow key={item.title} item={item} iconSizePx={iconSizePx} />)}
      </SidebarMenu>
    </SidebarGroup>
  )
}
