"use client"

import { useParams, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { getMailById } from '../data.mock'
import { ArrowLeft, Reply, Forward, Trash2 } from 'lucide-react'

export default function EmailReadPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const mail = getMailById(params?.id)

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="h-full grid grid-rows-[auto_1fr]">
          <div className="border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="px-2 md:px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => router.push('/email')} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><ArrowLeft className="mr-1 inline size-3.5" /> Inbox</button>
                  <h1 className="truncate text-lg font-semibold text-gray-900">{mail?.subject || 'Email'}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><Reply className="mr-1 inline size-3.5" /> Reply</button>
                  <button className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><Forward className="mr-1 inline size-3.5" /> Forward</button>
                  <button className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-red-600 hover:bg-gray-50"><Trash2 className="mr-1 inline size-3.5" /> Delete</button>
                </div>
              </div>
            </div>
          </div>
          <div className="min-h-0 overflow-auto">
            <div className="px-3 md:px-4 py-4">
              {mail ? (
                <article className="prose prose-sm max-w-none">
                  <div className="mb-4 text-xs text-gray-500">From: <span className="font-medium text-gray-800">{mail.from.name}</span> &lt;{mail.from.email}&gt;</div>
                  {mail.body?.split('\n').map((p, i) => (<p key={i}>{p}</p>))}
                </article>
              ) : (
                <div className="text-sm text-gray-500">Mensagem não encontrada.</div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
