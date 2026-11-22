import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

/** The Analytics screens inside Otto: the Otto menu on the left, a light page on the right. */
export function AnalyticsShell({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>
    <SidebarShadcn />
    <SidebarInset className="min-w-0 bg-[#fafafa]">
      <SidebarTrigger className="m-2 md:hidden" />
      {children}
    </SidebarInset>
  </SidebarProvider>
}
