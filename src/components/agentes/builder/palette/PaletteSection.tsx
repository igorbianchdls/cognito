"use client"

export default function PaletteSection({ title }: { title: string }) {
  return (
    <div className="px-3 pt-3 pb-2 text-xs font-medium text-gray-400 select-none">
      {title}
    </div>
  )
}

