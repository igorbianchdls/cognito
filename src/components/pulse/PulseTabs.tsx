"use client"

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Tab = 'following' | 'foryou' | 'allmetrics'

type PulseTabsProps = {
  value: Tab
  onChange: (v: Tab) => void
  activeBorderColor?: string
}

export function PulseTabs({ value, onChange, activeBorderColor = '#111827' }: PulseTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Tab)} className="w-full">
      <TabsList className="w-full h-12" variant="underline">
        <div className="w-full flex items-end gap-3">
          <TabsTrigger value="following" variant="underline" className="pb-2 px-2 md:px-3" activeBorderColor={activeBorderColor}>
            Following
          </TabsTrigger>
          <TabsTrigger value="foryou" variant="underline" className="pb-2 px-2 md:px-3" activeBorderColor={activeBorderColor}>
            For you
          </TabsTrigger>
          <TabsTrigger value="allmetrics" variant="underline" className="pb-2 px-2 md:px-3" activeBorderColor={activeBorderColor}>
            All metrics
          </TabsTrigger>
        </div>
      </TabsList>
    </Tabs>
  )
}

export default PulseTabs

