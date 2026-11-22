import { Suspense } from 'react'
import { ContactsView } from '@/products/inbox/frontend/ContactsView'

export const metadata = { title: 'Contatos · Inbox · Otto' }

export default function ContactsPage() {
  return <Suspense><ContactsView /></Suspense>
}
