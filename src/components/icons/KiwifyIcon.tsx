interface KiwifyIconProps {
  className?: string
}

export default function KiwifyIcon({ className = "w-4 h-4" }: KiwifyIconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" role="img" aria-label="Kiwify">
      <rect width="32" height="32" rx="8" fill="#18b957" />
      <path d="M9 7.5h4.4v8l6.7-8h5.1l-7.1 8.2L25.7 24h-5.5l-6.8-7.6V24H9V7.5Z" fill="#fff" />
      <circle cx="22.7" cy="9.4" r="1.6" fill="#d9ff5a" />
    </svg>
  )
}
