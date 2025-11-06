"use client"

import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ToolFilterBar({ categories, activeCategory }: { categories: string[]; activeCategory: string }) {
  return (
    <div className="space-y-3">
      <Input placeholder="Buscar ferramentas" className="h-8" />
      <Tabs defaultValue={activeCategory}>
        <TabsList variant="underline">
          {categories.map(c => (
            <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="text-xs text-gray-500">Mostrando várias ferramentas</div>
    </div>
  )
}
