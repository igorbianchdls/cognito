import { AnalyticsShell } from '@/products/analytics/frontend/shell/AnalyticsShell'

export const metadata = { title: 'Video Hosting · Otto' }

/** Videohosting product: sales videos with the Otto player. Same light shell as Analytics. */
export default function VideohostingLayout({ children }: { children: React.ReactNode }) {
  return <AnalyticsShell>{children}</AnalyticsShell>
}
