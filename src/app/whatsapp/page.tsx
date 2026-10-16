import { redirect } from 'next/navigation'
import { getClerkTenantBootstrapState } from '@/products/auth/server/authTenantResolver'
import ConnectionSettings from '@/products/mcpcore/domains/whatsapp/ui/ConnectionSettings'
export const dynamic='force-dynamic'
export default async function WhatsAppPage(){const session=await getClerkTenantBootstrapState();if(!session)redirect('/sign-in');if(!session.activeTenant)redirect('/onboarding');return <main className="min-h-screen bg-slate-100 px-4 py-10"><ConnectionSettings/></main>}
