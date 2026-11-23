import { InboxShell } from '@/products/inbox/frontend/shell/InboxShell'

/** Automação (automações, disparos, segmentos) and CRM (negócios, relatórios): same data as the Inbox, own menu sections. */
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <InboxShell>{children}</InboxShell>
}
