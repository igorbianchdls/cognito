"use client"

import { useMemo, useState } from 'react'
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import { Inbox, Star, Send, FileText, Trash2, Archive, Tag, Plus, Search, MoreHorizontal, Reply, Forward, Paperclip } from 'lucide-react'

type Mail = {
  id: string
  from: { name: string; email: string }
  subject: string
  snippet: string
  date: string
  starred?: boolean
  unread?: boolean
  attachments?: number
  labels?: string[]
  body?: string
}

const MAILBOX: Mail[] = [
  { id: 'm1', from: { name: 'Ana Paula', email: 'ana@example.com' }, subject: 'Apresentação do projeto', snippet: 'Oi! Segue em anexo a apresentação atualizada…', date: '09:42', unread: true, attachments: 1, labels: ['Work'], body: 'Olá, segue a apresentação do projeto com as últimas alterações. Fico à disposição para dúvidas.\n\n— Ana' },
  { id: 'm2', from: { name: 'Financeiro', email: 'billing@empresa.com' }, subject: 'Fatura 02/2026', snippet: 'Sua fatura está disponível. Vencimento 10/02…', date: 'Ontem', labels: ['Finance'], body: 'Sua fatura de Fevereiro/2026 está disponível no portal do cliente.' },
  { id: 'm3', from: { name: 'Caio', email: 'caio@exemplo.com' }, subject: 'Reunião reprogramada', snippet: 'Podemos mover a call para quinta às 11h?', date: 'Seg', starred: true, body: 'Podemos mover a call para quinta às 11h? Avise se tudo bem.' },
  { id: 'm4', from: { name: 'Notion', email: 'team@make.com' }, subject: 'Changelog 2026.02', snippet: 'Novidades: melhoria no editor, novos blocos…', date: '02 Fev', body: 'Confira as novidades desta release.' },
  { id: 'm5', from: { name: 'RH', email: 'rh@empresa.com' }, subject: 'Política de férias', snippet: 'Atualização da política a partir de Março…', date: '29 Jan', body: 'Olá! Segue a atualização da política de férias.' },
]

const FOLDERS = [
  { key: 'inbox', name: 'Inbox', icon: Inbox, count: 4 },
  { key: 'starred', name: 'Starred', icon: Star, count: 1 },
  { key: 'sent', name: 'Sent', icon: Send, count: 12 },
  { key: 'drafts', name: 'Drafts', icon: FileText, count: 3 },
  { key: 'archive', name: 'Archive', icon: Archive, count: 32 },
  { key: 'trash', name: 'Trash', icon: Trash2, count: 2 },
]

export default function EmailPage() {
  const [selected, setSelected] = useState<string>(MAILBOX[0]?.id || '')
  const [folder, setFolder] = useState('inbox')
  const mail = useMemo(() => MAILBOX.find(m => m.id === selected), [selected])

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="h-full grid grid-rows-[auto_1fr]">
          {/* Header */}
          <div className="border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto max-w-[1400px] px-6 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><Plus className="size-3.5" /> New</button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input className="h-9 w-80 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none ring-0 placeholder:text-gray-400 focus:border-gray-300" placeholder="Search emails" />
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><Tag className="mr-1 inline size-3.5" /> Label</button>
                  <button className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><MoreHorizontal className="size-4" /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Content: three columns */}
          <div className="min-h-0 overflow-hidden">
            <div className="mx-auto grid h-full max-w-[1400px] grid-cols-1 md:grid-cols-[230px_380px_1fr]">
              {/* Column 1: local folders */}
              <aside className="hidden min-h-0 border-r border-gray-200 bg-white/70 p-3 md:block">
                <div className="space-y-1">
                  {FOLDERS.map(f => (
                    <button key={f.key} onClick={() => setFolder(f.key)} className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 ${folder===f.key?'bg-gray-100 text-gray-900':'text-gray-700'}`}>
                      <span className="inline-flex items-center gap-2"><f.icon className="size-4" /> {f.name}</span>
                      <span className="text-xs text-gray-500">{f.count}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 border-t pt-3">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Labels</div>
                  <div className="space-y-1">
                    {['Work','Finance','Personal'].map(l => (
                      <button key={l} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"><span className="inline-flex items-center gap-2"><Tag className="size-4" /> {l}</span></button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Column 2: message list */}
              <section className="min-h-0 overflow-auto border-r border-gray-200 bg-white/60">
                <ul>
                  {MAILBOX.map(m => (
                    <li key={m.id}>
                      <button onClick={() => setSelected(m.id)} className={`grid w-full grid-cols-[18px_1fr_auto] items-center gap-3 px-4 py-3 text-left ${selected===m.id?'bg-gray-100':'hover:bg-gray-50'}`}>
                        <span className={`size-2 rounded-full ${m.unread?'bg-blue-500':'bg-transparent ring-1 ring-gray-300'}`} />
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-medium text-gray-900">{m.from.name} — {m.subject}</div>
                            <div className="shrink-0 text-xs text-gray-500">{m.date}</div>
                          </div>
                          <div className="truncate text-xs text-gray-500">{m.snippet}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            {m.starred && <Star className="size-3.5 text-amber-500" />}
                            {!!m.attachments && <span className="inline-flex items-center gap-1 text-gray-500"><Paperclip className="size-3.5" />{m.attachments}</span>}
                            {m.labels?.map(l => (
                              <span key={l} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">{l}</span>
                            ))}
                          </div>
                        </div>
                        <span />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Column 3: reading pane */}
              <section className="min-h-0 overflow-auto bg-white">
                {mail ? (
                  <div className="flex h-full flex-col">
                    <div className="border-b border-gray-200 bg-white/70 px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="truncate text-base font-semibold text-gray-900">{mail.subject}</h2>
                          <div className="text-xs text-gray-500">de {mail.from.name} • {mail.from.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><Reply className="mr-1 inline size-3.5" /> Reply</button>
                          <button className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><Forward className="mr-1 inline size-3.5" /> Forward</button>
                        </div>
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
                      <article className="prose prose-sm max-w-none text-gray-800">
                        {(mail.body || '').split('\n').map((line, i) => (<p key={i}>{line}</p>))}
                      </article>
                    </div>
                  </div>
                ) : (
                  <div className="grid h-full place-items-center text-gray-400">Selecione um email</div>
                )}
              </section>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

