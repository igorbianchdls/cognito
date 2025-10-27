"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Undo2, Redo2, ZoomIn, ZoomOut, Save } from "lucide-react"

export default function BuilderHeader({ name, onRename }: { name: string; onRename: (v: string) => void }) {
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
          <Button variant="ghost" size="sm" title="Desfazer" disabled>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Refazer" disabled>
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
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

