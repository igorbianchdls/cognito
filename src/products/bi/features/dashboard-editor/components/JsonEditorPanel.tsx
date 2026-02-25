'use client'

import type { ReactNode } from 'react'

type JsonEditorPanelProps = {
  jsonText: string
  parseError: string | null
  onChangeText: (text: string) => void
  onFormat: () => void
  onReset: () => void
  extra?: ReactNode
  dataPreview?: unknown
}

export default function JsonEditorPanel({
  jsonText,
  parseError,
  onChangeText,
  onFormat,
  onReset,
  extra,
  dataPreview,
}: JsonEditorPanelProps) {
  return (
    <div className="md:col-span-1">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">JSON</h2>
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="text-xs rounded-md border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50">
            Reset
          </button>
          <button onClick={onFormat} className="text-xs rounded-md border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50">
            Formatar
          </button>
        </div>
      </div>
      <textarea
        value={jsonText}
        onChange={(event) => onChangeText(event.target.value)}
        spellCheck={false}
        className="w-full min-h-[420px] rounded-md border border-gray-300 bg-white p-0 font-mono text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {parseError && (
        <div className="mt-2 rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">{parseError}</div>
      )}
      {extra}
      {dataPreview !== undefined && (
        <div className="mt-4 rounded-md bg-white p-3 border border-gray-200">
          <h3 className="text-xs font-medium text-gray-900 mb-1">Dados atuais</h3>
          <pre className="text-[11px] text-gray-700 whitespace-pre-wrap">{JSON.stringify(dataPreview, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
