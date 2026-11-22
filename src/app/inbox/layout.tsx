import { AnalyticsShell } from '@/products/analytics/frontend/shell/AnalyticsShell'

export const metadata = { title: 'Inbox · Otto' }

/** Inbox product: WhatsApp, Instagram and Messenger conversations in one place. Same light shell as Analytics. */
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return <AnalyticsShell>{children}</AnalyticsShell>
}
