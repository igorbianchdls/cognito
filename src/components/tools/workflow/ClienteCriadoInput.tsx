'use client'

import { CodeBlock } from '@/components/ai-elements/code-block'

type Props = {
  input: unknown
}

export default function ClienteCriadoInput({ input }: Props) {
  let pretty = ''
  try {
    pretty = JSON.stringify(input, null, 2)
  } catch {
    pretty = String(input ?? '')
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="px-3 py-2 border-b text-sm font-semibold text-slate-800">Entrada · Criar Cliente</div>
      <div className="p-3">
        <CodeBlock code={pretty} language="json" />
      </div>
    </div>
  )
}

