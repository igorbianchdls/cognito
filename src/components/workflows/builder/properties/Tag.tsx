"use client"

export default function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700"
      style={{ fontFamily: 'var(--font-inter)', letterSpacing: '-0.28px' }}
    >
      {children}
    </span>
  )
}

