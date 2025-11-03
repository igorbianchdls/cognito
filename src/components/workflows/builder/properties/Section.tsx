"use client"

import { Separator } from "@/components/ui/separator"

export default function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="text-[11px] uppercase tracking-wider text-gray-500" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.5px' }}>{title}</div>
      <div className="space-y-2">{children}</div>
      <Separator className="mt-3" />
    </section>
  )
}

