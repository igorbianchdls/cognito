import { redirect,notFound } from 'next/navigation'
import { getClerkTenantBootstrapState } from '@/products/auth/server/authTenantResolver'
import SensitiveStep from '@/products/mcpcore/domains/whatsapp/ui/SensitiveStep'
export const dynamic='force-dynamic'
export default async function WhatsAppStep({params}:{params:Promise<{operationId:string}>}){const session=await getClerkTenantBootstrapState();if(!session)redirect('/sign-in');if(!session.activeTenant)redirect('/onboarding');const {operationId}=await params;if(!/^[0-9a-f-]{36}$/i.test(operationId))notFound();return <main className="min-h-screen bg-slate-100 px-4 py-10"><SensitiveStep operationId={operationId}/></main>}
