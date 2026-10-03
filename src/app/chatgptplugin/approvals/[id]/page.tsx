import { notFound } from 'next/navigation'
import { z } from 'zod'
import ApprovalPage from '@/products/chatgptplugin/approvals/ApprovalPage'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params
  if (!z.string().uuid().safeParse(id).success) notFound()
  return <ApprovalPage id={id}/>
}
