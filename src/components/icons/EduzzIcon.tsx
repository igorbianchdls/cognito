interface EduzzIconProps {
  className?: string
}

export default function EduzzIcon({ className = "w-4 h-4" }: EduzzIconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" role="img" aria-label="Eduzz">
      <rect width="32" height="32" rx="8" fill="#2257e6" />
      <path d="M9 8h14v4H13v3h8.5v4H13v3h10v4H9V8Z" fill="#fff" />
      <path d="M18.4 15 24 8h-4.7l-3.2 4.2L18.4 15Z" fill="#8fd4ff" />
    </svg>
  )
}
