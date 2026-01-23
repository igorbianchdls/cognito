'use client'

import { CodeBlock } from '@/components/ai-elements/code-block'
import { Button } from '@/components/ui/button'
import { Trash2, ClipboardCopy } from 'lucide-react'
import { useState } from 'react'

export default function ToolDeleteInputCard({ title, input }: { title: string; input: unknown }) {
  const [copied, setCopied] = useState(false)
  let pretty = ''
  try { pretty = JSON.stringify(input, null, 2) } catch { pretty = String(input ?? '') }

  return (
    <div className="rounded-md border border-rose-200 bg-rose-50">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-600" />
          <div className="text-sm font-semibold text-rose-800">Entrada · Deletar {title}</div>
        </div>
        <Button variant="ghost" size="icon" title="Copiar JSON" onClick={async () => {
          try { await navigator.clipboard.writeText(pretty); setCopied(true); setTimeout(()=>setCopied(false), 1200) } catch {}
        }}>
          <ClipboardCopy className={`w-4 h-4 ${copied ? 'text-emerald-600' : 'text-rose-600'}`} />
        </Button>
      </div>
      <div className="p-3">
        <CodeBlock code={pretty} language="json" />
      </div>
    </div>
  )}

