import { InboxShell } from '@/products/inbox/frontend/shell/InboxShell'

export const metadata = { title: 'Inbox · Otto' }

/** Inbox product: WhatsApp, Instagram and Messenger conversations in one place. */
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return <InboxShell>{children}</InboxShell>
}
