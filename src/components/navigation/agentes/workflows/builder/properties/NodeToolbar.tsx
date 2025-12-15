"use client"

import { FileText, Settings, Link as LinkIcon } from "lucide-react"

export default function NodeToolbar() {
  const Item = ({ children }: { children: React.ReactNode }) => (
    <div className="w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 cursor-default">
      {children}
    </div>
  )
  return (
    <div className="flex items-center gap-1 px-4 pb-2 text-gray-600">
      <Item><FileText className="w-4 h-4" /></Item>
      <Item><Settings className="w-4 h-4" /></Item>
      <Item><LinkIcon className="w-4 h-4" /></Item>
    </div>
  )
}

