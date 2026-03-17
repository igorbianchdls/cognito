'use client'

import type { DashboardCodeFile } from '@/products/dashboard/code-files'

export function DashboardCodeEditorPane({ file }: { file: DashboardCodeFile | undefined }) {
  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#F7F7F6]">
      <div className="border-b-[0.5px] border-[#DDDDD8] px-4 py-3 text-[13px] font-medium text-[#2C2C29]">
        {file?.path ?? 'Sem arquivo'}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <pre className="min-h-full w-full bg-[#F7F7F6] p-6 text-[13px] leading-6 text-[#2C2C29]">
          <code>{file?.content ?? ''}</code>
        </pre>
      </div>
    </section>
  )
}
