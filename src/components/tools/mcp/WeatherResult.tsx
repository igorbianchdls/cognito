'use client'

import React, { useMemo } from 'react'
import { Thermometer, MapPin, CloudSun } from 'lucide-react'

type McpToolContent = { type: string; text?: string; content?: string; [k: string]: unknown }

type WeatherOutput = {
  // Typical MCP return from our mock: { content: [{ type: 'text', text: 'Temperatura em <city>: 25°C' }] }
  content?: McpToolContent[]
  [k: string]: unknown
}

export default function WeatherResult({ output, input }: { output: WeatherOutput | string | unknown; input?: unknown }) {
  const { city, temperatureText, rawText } = useMemo(() => {
    const res: { city?: string; temperatureText?: string; rawText: string } = { rawText: '' }
    // Try to extract city from tool input
    try {
      if (input && typeof input === 'object' && input !== null && 'city' in (input as any)) {
        const c = (input as any).city
        if (typeof c === 'string' && c.trim()) res.city = c.trim()
      }
    } catch {}

    // Unwrap output to text
    const asObj = (typeof output === 'object' && output !== null) ? output as any : undefined
    if (typeof output === 'string') {
      res.rawText = output
    } else if (asObj && Array.isArray(asObj.content)) {
      // Concatenate any text-like entries
      const txt = asObj.content.map((c: McpToolContent) => (c.text || (c as any).content || '')).filter(Boolean).join('\n')
      res.rawText = txt
    } else {
      // Fallback: stringify
      try { res.rawText = JSON.stringify(output) } catch { res.rawText = String(output ?? '') }
    }

    // Try to parse "Temperatura em <city>: <temp>"
    const m = /Temperatura em\s+([^:]+):\s*([^\n]+)/i.exec(res.rawText)
    if (m) {
      if (!res.city) res.city = m[1].trim()
      res.temperatureText = m[2].trim()
    } else {
      // Alternative: extract something that looks like a temperature
      const t = /(\-?\d+(?:[\.,]\d+)?)\s*°?\s*C/ig.exec(res.rawText)
      if (t) res.temperatureText = t[0].replace(/\s+/g, ' ').replace(',', '.')
    }
    return res
  }, [output, input])

  return (
    <div className="w-full rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-2 text-gray-800">
        <CloudSun className="w-5 h-5" />
        <span className="font-semibold">Previsão do Tempo</span>
      </div>
      <div className="flex items-baseline gap-6">
        <div className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
          <Thermometer className="w-6 h-6 text-red-500" />
          <span>{temperatureText || '—'}</span>
        </div>
        {city && (
          <div className="flex items-center gap-1 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{city}</span>
          </div>
        )}
      </div>
      {/* Fallback raw text for transparency */}
      {rawText && (
        <div className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">
          {rawText}
        </div>
      )}
    </div>
  )
}

