"use client"

import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

export default function NodeHeader({ icon, title, subtitle }: { icon?: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 text-gray-700">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>{title}</div>
          {subtitle ? <div className="text-[11px] text-gray-500 truncate" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}>{subtitle}</div> : null}
        </div>
      </div>
      <Button size="sm">
        <Play className="w-4 h-4 mr-2" /> Run
      </Button>
    </div>
  )
}

