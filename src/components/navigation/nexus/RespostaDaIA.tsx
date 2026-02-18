import type { UIMessage } from 'ai'

interface RespostaDaIAProps {
  message: UIMessage
  selectedAgent: string | null
}

function pretty(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export default function RespostaDaIA({ message, selectedAgent: _selectedAgent }: RespostaDaIAProps) {
  const parts = Array.isArray(message.parts) ? message.parts : []

  const textParts = parts.filter((p: any) => p?.type === 'text' && typeof p?.text === 'string')
  const reasoningParts = parts.filter((p: any) => p?.type === 'reasoning')
  const toolParts = parts.filter((p: any) => typeof p?.type === 'string' && p.type.startsWith('tool-'))

  return (
    <div className="w-full min-w-0 flex justify-start py-3">
      <div className="w-full min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-blue-500 text-white text-[10px] leading-none shadow-sm ml-0.5">OT</span>
          <span className="font-semibold text-gray-900 text-[16px]">Otto</span>
        </div>

        {textParts.map((part: any, idx: number) => (
          <div key={`txt-${idx}`} className="whitespace-pre-wrap text-sm leading-6 text-gray-900">
            {part.text}
          </div>
        ))}

        {reasoningParts.map((part: any, idx: number) => {
          const txt = String(part?.content ?? part?.text ?? '').trim()
          if (!txt) return null
          return (
            <details key={`rs-${idx}`} className="rounded-md border border-gray-200 bg-gray-50 p-2 text-xs">
              <summary className="cursor-pointer font-medium text-gray-700">Raciocínio</summary>
              <pre className="mt-2 whitespace-pre-wrap text-gray-600">{txt}</pre>
            </details>
          )
        })}

        {toolParts.map((part: any, idx: number) => {
          const state = String(part?.state || 'output-available')
          const input = part?.input
          const output = part?.output
          const errorText = part?.errorText
          return (
            <div key={`tool-${idx}`} className="rounded-md border border-gray-200 bg-white p-3 space-y-2">
              <div className="text-xs font-semibold text-gray-700">{String(part.type).replace(/^tool-/, '')} · {state}</div>
              {input !== undefined && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">input</div>
                  <pre className="text-xs whitespace-pre-wrap text-gray-700">{pretty(input)}</pre>
                </div>
              )}
              {errorText ? (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-red-500">erro</div>
                  <pre className="text-xs whitespace-pre-wrap text-red-600">{String(errorText)}</pre>
                </div>
              ) : (
                output !== undefined && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">output</div>
                    <pre className="text-xs whitespace-pre-wrap text-gray-700">{pretty(output)}</pre>
                  </div>
                )
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
