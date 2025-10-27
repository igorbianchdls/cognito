"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, GitBranch, Zap, Timer } from "lucide-react"

export type InsertType = 'action' | 'branch' | 'delay'

export default function InsertButton({ onInsert }: { onInsert: (type: InsertType) => void }) {
  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="w-0.5 bg-gray-300/80" style={{ height: 24 }} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="rounded-full h-8 w-8 p-0 border-gray-300 text-gray-700 hover:bg-gray-50">
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => onInsert('action')}>
            <Zap className="h-4 w-4 mr-2" /> Ação
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onInsert('branch')}>
            <GitBranch className="h-4 w-4 mr-2" /> Dividir em paths
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onInsert('delay')}>
            <Timer className="h-4 w-4 mr-2" /> Atraso
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="w-0.5 bg-gray-300/80" style={{ height: 24 }} />
    </div>
  )
}
