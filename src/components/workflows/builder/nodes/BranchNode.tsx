"use client"

import { GitBranch, CheckCircle2 } from "lucide-react"
import NodeCard from "./NodeCard"

export default function BranchNode({ index }: { index: number }) {
  return (
    <div className="w-full">
      <NodeCard>
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 border border-orange-200 text-orange-700">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500">{index}. Paths</div>
            <div className="text-sm font-medium">Split into paths</div>
          </div>
        </div>
        <div className="text-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      </NodeCard>

      {/* Visual das ramificações (estático básico) */}
      <div className="relative mt-2">
        <div className="flex items-center justify-between px-6">
          <div className="inline-flex items-center gap-2 text-xs text-white bg-purple-600 rounded-full px-2.5 py-1">Path A</div>
          <div className="inline-flex items-center gap-2 text-xs text-white bg-purple-600 rounded-full px-2.5 py-1">Path B</div>
        </div>
        <div className="h-6" />
        <div className="grid grid-cols-2 gap-6">
          <div className="flex justify-start">
            <div className="w-[360px]">
              <NodeCard variant="dashed" className="opacity-70">
                <div className="text-sm text-gray-500">Adicionar passo no Path A…</div>
              </NodeCard>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="w-[360px]">
              <NodeCard variant="dashed" className="opacity-70">
                <div className="text-sm text-gray-500">Adicionar passo no Path B…</div>
              </NodeCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

