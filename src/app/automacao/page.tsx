"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"

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
  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-auto">
        <div className="max-w-5xl mx-auto px-6 pt-14 pb-10">
          <div className="flex flex-col items-center text-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">☁️</div>
            <h1 className="text-3xl font-semibold tracking-tight">Let’s automate</h1>
            <p className="text-gray-500">Automate work by setting up scheduled tasks</p>
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
      </SidebarInset>
    </SidebarProvider>
  )
}

