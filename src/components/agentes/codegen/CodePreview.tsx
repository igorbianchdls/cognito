"use client"

import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Graph } from '@/types/agentes/builder'
import { generateCode } from '@/app/(navigation)/agentes/(internal)/codegen/generate'
import { slugify } from '@/app/(navigation)/agentes/(internal)/codegen/helpers'

export default function CodePreview({ graph, initialSlug }: { graph: Graph; initialSlug?: string }) {
  const [slug, setSlug] = useState<string>(initialSlug && initialSlug.trim() ? slugify(initialSlug) : 'agente-visual')
  useEffect(() => {
    setSlug(initialSlug && initialSlug.trim() ? slugify(initialSlug) : 'agente-visual')
  }, [initialSlug])
  const [active, setActive] = useState<string>('route.ts')

  const graphKey = useMemo(() => JSON.stringify(graph), [graph])
  const bundle = useMemo(() => generateCode(graph, { slug, includeRoute: true, includeJson: true }), [graphKey, slug])
  const files = bundle.files

  const current = files.find(f => f.path.endsWith(active)) || files[0]

  const handleCopy = async () => {
    if (!current) return
    try {
      await navigator.clipboard.writeText(current.contents)
    } catch (e) {
      console.error('copy failed', e)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Slug</span>
          <Input className="h-8 w-56" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-8" onClick={handleCopy}>Copiar</Button>
        </div>
      </div>
      {bundle.warnings.length > 0 && (
        <div className="mb-3 text-xs text-amber-600">
          {bundle.warnings.map((w, i) => (<div key={i}>⚠️ {w}</div>))}
        </div>
      )}
      <Tabs value={active} onValueChange={setActive} className="flex-1 flex flex-col overflow-hidden">
        <TabsList variant="underline">
          {files.map((f) => {
            const label = f.path.split('/').pop() || f.path
            return <TabsTrigger key={f.path} value={label}>{label}</TabsTrigger>
          })}
        </TabsList>
        <div className="mt-2 flex-1 overflow-hidden border rounded-md">
          {files.map((f) => {
            const label = f.path.split('/').pop() || f.path
            return (
              <TabsContent key={f.path} value={label} className="h-full">
                <div className="h-[60vh] overflow-auto p-3 bg-white">
                  <pre className="text-xs whitespace-pre-wrap leading-5">{f.contents}</pre>
                </div>
                <div className="px-3 py-2 text-[11px] text-gray-500">Destino: {f.path}</div>
              </TabsContent>
            )
          })}
        </div>
      </Tabs>
    </div>
  )
}
