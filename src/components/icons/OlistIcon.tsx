interface OlistIconProps {
  className?: string
}

export default function OlistIcon({ className = "w-4 h-4" }: OlistIconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" role="img" aria-label="Olist">
      <rect width="32" height="32" rx="8" fill="#00a859" />
      <circle cx="16" cy="16" r="9" fill="#fff" />
      <circle cx="16" cy="16" r="5.2" fill="#00a859" />
      <circle cx="16" cy="16" r="2.3" fill="#fff" />
    </svg>
  )
}
