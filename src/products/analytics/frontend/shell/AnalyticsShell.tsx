import { AppShell } from '@/products/plataforma/frontend/shell/AppShell'

/** The Analytics screens inside Otto: the Otto menu on the left, a light page on the right. */
export function AnalyticsShell({ children }: { children: React.ReactNode }) {
  return <AppShell insetClassName="bg-[#fafafa]">{children}</AppShell>
}
