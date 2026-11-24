import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { AppSidebar } from "../nav/Sidebar"
import { AppHeader } from "./AppHeader"

/**
 * The frame of every Otto screen: the menu on the left and, on the right, the top bar over the screen's content.
 * insetClassName styles the right side (background, full height…); defaultOpen starts the menu open or as icons.
 */
export function AppShell({ children, insetClassName, defaultOpen }: { children: React.ReactNode; insetClassName?: string; defaultOpen?: boolean }) {
  return <SidebarProvider defaultOpen={defaultOpen}>
    <AppSidebar />
    <SidebarInset className={cn("min-w-0", insetClassName)}>
      <AppHeader />
      {children}
    </SidebarInset>
  </SidebarProvider>
}
