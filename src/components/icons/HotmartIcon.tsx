interface HotmartIconProps {
  className?: string
}

export default function HotmartIcon({ className = "w-4 h-4" }: HotmartIconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" role="img" aria-label="Hotmart">
      <rect width="32" height="32" rx="8" fill="#ff5a1f" />
      <path
        d="M18.2 5.2c.8 4.5-3.6 5.9-2.3 9.6.8-1.4 2-2.3 3.8-2.9-.1 2.4 2.6 3.6 2.6 6.8 0 4.3-3.2 7.3-7.1 7.3-4.1 0-7.4-3.1-7.4-7.4 0-3.7 2.1-5.7 4.2-7.6 1.9-1.8 3.8-3.5 3.7-6.8 1 .2 1.9.5 2.5 1Z"
        fill="#fff"
      />
      <path d="M16.2 23.1c1.5-.8 2.1-2.1 1.7-3.8-1.2.6-2.1 1.4-2.5 2.6-.8-1.8.7-2.8.8-4.8-1.9 1.3-3.2 2.8-3.2 5 0 1.8 1.3 3 3.2 3Z" fill="#ffcf5a" />
    </svg>
  )
}
