'use client'

type IdeaCardProps = {
  emoji: string
  title: string
}

export default function IdeaCard({ emoji, title }: IdeaCardProps) {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white/80 transition-shadow p-5 flex gap-3 items-start"
      style={{ boxShadow: 'var(--shadow-3)' }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-base">
        <span aria-hidden>{emoji}</span>
      </div>
      <div className="text-sm leading-5 text-gray-700">{title}</div>
    </div>
  )
}
