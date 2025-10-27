"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Undo2, Redo2, ZoomIn, ZoomOut, Save, PanelRightOpen } from "lucide-react"

export default function BuilderHeader({
  name,
  onRename,
  isPanelOpen,
  onTogglePanel,
  autoOpen,
  onToggleAutoOpen,
}: {
  name: string
  onRename: (v: string) => void
  isPanelOpen?: boolean
  onTogglePanel?: () => void
  autoOpen?: boolean
  onToggleAutoOpen?: () => void
}) {
  return (
    <header className="flex items-center justify-between border-b px-6 md:px-10 py-3">
      <div className="flex items-center gap-3">
        <input
          value={name}
          onChange={(e) => onRename(e.target.value)}
          className="bg-transparent text-lg font-semibold outline-none border-none"
        />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onTogglePanel}>
            <PanelRightOpen className="h-4 w-4 mr-2" /> {isPanelOpen ? 'Ocultar' : 'Propriedades'}
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Auto-abrir</span>
            <Switch checked={!!autoOpen} onCheckedChange={() => onToggleAutoOpen && onToggleAutoOpen()} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" title="Desfazer" disabled>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" title="Refazer" disabled>
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" title="Zoom out" disabled>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" title="Zoom in" disabled>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm">
          <Save className="h-4 w-4 mr-2" /> Salvar (mock)
        </Button>
      </div>
    </header>
  )
}
