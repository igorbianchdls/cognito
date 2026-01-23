'use client'

import { CodeBlock } from '@/components/ai-elements/code-block'
import { Button } from '@/components/ui/button'
import { ClipboardCopy } from 'lucide-react'
import { useState } from 'react'

export default function ToolCreateInputCard({ title, input }: { title: string; input: unknown }) {
  const [copied, setCopied] = useState(false)
  let pretty = ''
  try { pretty = JSON.stringify(input, null, 2) } catch { pretty = String(input ?? '') }

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">Entrada · {title}</div>
        <Button variant="ghost" size="icon" title="Copiar JSON" onClick={async () => {
          try { await navigator.clipboard.writeText(pretty); setCopied(true); setTimeout(()=>setCopied(false), 1200) } catch {}
        }}>
          <ClipboardCopy className={`w-4 h-4 ${copied ? 'text-emerald-600' : 'text-slate-500'}`} />
        </Button>
      </div>
      <div className="p-3">
        <CodeBlock code={pretty} language="json" />
      </div>
    </div>
  )
}

