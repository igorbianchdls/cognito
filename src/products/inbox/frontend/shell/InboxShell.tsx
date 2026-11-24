'use client'

import { usePathname } from 'next/navigation'
import { AppShell } from '@/products/plataforma/frontend/shell/AppShell'

/**
 * The Inbox inside Otto. The inbox itself has its own column of views and boxes, so the Otto menu starts as icons
 * there (it opens again with its button); the other Inbox pages start with it open.
 */
export function InboxShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <AppShell defaultOpen={pathname !== '/inbox'} insetClassName="bg-[#fafafa]">{children}</AppShell>
}
