"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Clock } from "lucide-react"

function IdeaCard({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/80 shadow-sm hover:shadow transition-shadow p-5 flex gap-3 items-start">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-base">
        <span aria-hidden>{emoji}</span>
      </div>
      <div className="text-sm leading-5 text-gray-700">
        {title}
      </div>
    </div>
  )
}

export default function AutomacaoPage() {
  const [open, setOpen] = useState(false)
  const [scheduleType, setScheduleType] = useState<'daily' | 'interval'>("daily")
  const [time, setTime] = useState<string>("09:30")
  const [days, setDays] = useState<Record<string, boolean>>({ Mo: true, Tu: true, We: true, Th: true, Fr: true, Sa: false, Su: false })

  const toggleDay = (d: string) => setDays(prev => ({ ...prev, [d]: !prev[d] }))

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-auto">
        <div className="max-w-5xl mx-auto px-6 pt-14 pb-10">
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">☁️</div>
            <h1 className="text-3xl font-semibold tracking-tight">Let’s automate</h1>
            <p className="text-gray-500">Automate work by setting up scheduled tasks</p>
          </div>
          <div className="flex items-center justify-center sm:justify-end mb-6">
            <Button onClick={() => setOpen(true)}>Criar automação</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <IdeaCard emoji="🔵" title="Find and fix a bug every morning with a short summary" />
            <IdeaCard emoji="🌈" title="Every evening, look through my recent threads and create new skills" />
            <IdeaCard emoji="🧪" title="Add tests every evening for today’s code changes" />
            <IdeaCard emoji="💬" title="Review PR comments every hour and share next steps" />
            <IdeaCard emoji="✏️" title="Draft release notes every week from recent changes in this repo" />
            <IdeaCard emoji="📖" title="Summarize my team’s PRs from last week every Monday morning" />
            <IdeaCard emoji="📘" title="Update AGENTS.md every week with new project details" />
            <IdeaCard emoji="🚀" title="Look through recent Linear tickets and start a few PRs for simple tasks" />
            <IdeaCard emoji="🧾" title="Write release notes every week for the latest build" />
          </div>

          <div className="text-center mt-8">
            <button className="text-gray-500 text-sm hover:text-gray-700">Explore more</button>
          </div>
        </div>

        {/* Modal: Create automation */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl p-0">
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="text-xl">Create automation</DialogTitle>
              </DialogHeader>

              <div className="mt-4 grid gap-4">
                {/* Name */}
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Issue triage" />
                </div>

                {/* Workspaces */}
                <div className="grid gap-2">
                  <Label>Workspaces</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Prompt */}
                <div className="grid gap-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Every morning, triage new issues, suggest owners, and label priority and area."
                  />
                </div>

                {/* Schedule */}
                <div className="grid gap-2">
                  <Label>Schedule</Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleType('daily')}
                      className={`h-8 rounded-md border px-3 text-sm ${scheduleType==='daily' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType('interval')}
                      className={`h-8 rounded-md border px-3 text-sm ${scheduleType==='interval' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}
                    >
                      Interval
                    </button>
                  </div>

                  {/* Time + Days */}
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-60">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="pr-9"
                      />
                      <Clock className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      {Object.keys(days).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(d)}
                          className={`h-8 w-8 rounded-full text-xs font-medium ${days[d] ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
                          title={d}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t bg-gray-50/60">
              <div className="flex w-full items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => setOpen(false)}>Create</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
