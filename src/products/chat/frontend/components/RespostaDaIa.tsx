"use client"

import type { UIMessage } from 'ai'

type Props = { message: UIMessage; isPending?: boolean }

function pretty(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export default function RespostaDaIa({ message, isPending = false }: Props) {
  const parts = Array.isArray(message.parts) ? message.parts : []
  const hasParts = parts.length > 0

  if (!hasParts && !isPending) return null

  return (
    <div className="w-full min-w-0 flex justify-start py-3">
      <div className="w-full min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-blue-500 text-white text-[10px] leading-none shadow-sm ml-0.5">OT</span>
          <span className="font-semibold text-gray-900 text-[16px]">Otto</span>
        </div>

        {!hasParts && isPending && (
          <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:300ms]" />
          </div>
        )}

        {parts.map((part: any, index: number) => {
          if (part?.type === 'text') {
            return (
              <div key={`txt-${index}`} className="whitespace-pre-wrap text-sm leading-6 text-gray-900">
                {String(part?.text || '')}
              </div>
            )
          }

          if (part?.type === 'reasoning') {
            const txt = String(part?.content ?? part?.text ?? '').trim()
            if (!txt) return null
            return (
              <details key={`rs-${index}`} className="rounded-md border border-gray-200 bg-gray-50 p-2 text-xs">
                <summary className="cursor-pointer font-medium text-gray-700">Raciocínio</summary>
                <pre className="mt-2 whitespace-pre-wrap text-gray-600">{txt}</pre>
              </details>
            )
          }

          if (typeof part?.type === 'string' && part.type.startsWith('tool-')) {
            return (
              <div key={`tool-${index}`} className="rounded-md border border-gray-200 bg-white p-3 space-y-2">
                <div className="text-xs font-semibold text-gray-700">{String(part.type).replace(/^tool-/, '')} · {String(part?.state || 'output-available')}</div>
                {part?.input !== undefined && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">input</div>
                    <pre className="text-xs whitespace-pre-wrap text-gray-700">{pretty(part.input)}</pre>
                  </div>
                )}
                {part?.errorText ? (
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-red-500">erro</div>
                    <pre className="text-xs whitespace-pre-wrap text-red-600">{String(part.errorText)}</pre>
                  </div>
                ) : (
                  part?.output !== undefined && (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-gray-500">output</div>
                      <pre className="text-xs whitespace-pre-wrap text-gray-700">{pretty(part.output)}</pre>
                    </div>
                  )
                )}
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
