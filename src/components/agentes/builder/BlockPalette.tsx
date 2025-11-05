"use client"

import type { BlockKind } from "@/types/agentes/builder"
import PaletteSection from "./palette/PaletteSection"
import PaletteItem from "./palette/PaletteItem"
import { Bot, CircleStop, FileText, FileSearch, ShieldCheck, Settings2, GitBranch, RefreshCw, UserCheck, Wand2, ToggleLeft } from "lucide-react"

export default function BlockPalette({ onAdd }: { onAdd: (type: BlockKind) => void }) {
  return (
    <div className="m-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <PaletteSection title="Core" />
      <div className="px-2">
        <PaletteItem icon={<Bot className="w-4 h-4" />} label="Agent" badgeBg="#EEF2FF" badgeColor="#1D4ED8" kind="agente" onAdd={onAdd} />
        <PaletteItem icon={<CircleStop className="w-4 h-4" />} label="End" badgeBg="#EAF7EC" badgeColor="#059669" kind="resposta" onAdd={onAdd} />
        <PaletteItem icon={<FileText className="w-4 h-4" />} label="Note" badgeBg="#F3F4F6" badgeColor="#6B7280" kind="nota" onAdd={onAdd} />
      </div>

      <PaletteSection title="Tools" />
      <div className="px-2">
        <PaletteItem icon={<FileSearch className="w-4 h-4" />} label="File search" badgeBg="#FEF3C7" badgeColor="#B45309" kind="ferramenta" onAdd={onAdd} />
        <PaletteItem icon={<ShieldCheck className="w-4 h-4" />} label="Guardrails" badgeBg="#FEF3C7" badgeColor="#B45309" kind="ferramenta" onAdd={onAdd} />
        <PaletteItem icon={<Settings2 className="w-4 h-4" />} label="MCP" badgeBg="#FEF3C7" badgeColor="#B45309" kind="ferramenta" onAdd={onAdd} />
      </div>

      <PaletteSection title="Logic" />
      <div className="px-2">
        <PaletteItem icon={<GitBranch className="w-4 h-4" />} label="If / else" badgeBg="#FFEDD5" badgeColor="#C2410C" kind="condicao" onAdd={onAdd} />
        <PaletteItem icon={<RefreshCw className="w-4 h-4" />} label="While" badgeBg="#FFEDD5" badgeColor="#C2410C" kind="loop" onAdd={onAdd} />
        <PaletteItem icon={<UserCheck className="w-4 h-4" />} label="User approval" badgeBg="#FFEDD5" badgeColor="#C2410C" kind="aprovacao" onAdd={onAdd} />
      </div>

      <PaletteSection title="Data" />
      <div className="px-2 pb-3">
        <PaletteItem icon={<Wand2 className="w-4 h-4" />} label="Transform" badgeBg="#F3E8FF" badgeColor="#7E22CE" kind="transform" onAdd={onAdd} />
        <PaletteItem icon={<ToggleLeft className="w-4 h-4" />} label="Set state" badgeBg="#F3E8FF" badgeColor="#7E22CE" kind="setstate" onAdd={onAdd} />
      </div>
    </div>
  )
}
