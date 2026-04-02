'use client'

export function ArtifactSourceCodePanel({ source }: { source: string }) {
  return (
    <div className="mx-auto flex min-h-full max-w-[1280px] p-8">
      <pre className="w-full overflow-auto rounded-[16px] border-[0.5px] border-[#DDDDD8] bg-[#F7F7F6] p-6 text-[13px] leading-6 text-[#2C2C29] shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
        <code>{source}</code>
      </pre>
    </div>
  )
}

