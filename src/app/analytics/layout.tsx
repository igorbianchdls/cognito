import { AnalyticsShell } from '@/products/analytics/frontend/shell/AnalyticsShell'

export const metadata = { title: 'Analytics · Otto' }

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <AnalyticsShell>{children}</AnalyticsShell>
}
