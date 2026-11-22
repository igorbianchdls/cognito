'use client'

import { usePathname } from 'next/navigation'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

/**
 * The Inbox inside Otto. The inbox itself has its own column of views and boxes, so the Otto menu starts as icons
 * there (it opens again with its button); the other Inbox pages start with it open.
 */
export function InboxShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <SidebarProvider defaultOpen={pathname !== '/inbox'}>
    <SidebarShadcn />
    <SidebarInset className="min-w-0 bg-[#fafafa]">
      <SidebarTrigger className="m-2 md:hidden" />
      {children}
    </SidebarInset>
  </SidebarProvider>
}
