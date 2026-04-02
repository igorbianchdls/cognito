'use client'

export function ArtifactWorkspaceStatusScreen({
  message,
  tone = 'muted',
}: {
  message: string
  tone?: 'muted' | 'error'
}) {
  return (
    <div
      className={`flex h-screen items-center justify-center bg-[#F7F7F6] p-8 text-sm ${
        tone === 'error' ? 'text-red-700' : 'text-[#5F5F5A]'
      }`}
    >
      {message}
    </div>
  )
}

