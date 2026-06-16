interface NuvemshopIconProps {
  className?: string
}

export default function NuvemshopIcon({ className = "w-4 h-4" }: NuvemshopIconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" role="img" aria-label="Nuvemshop">
      <rect width="32" height="32" rx="8" fill="#2f5bff" />
      <path d="M8.8 20.7h14.4a4.7 4.7 0 0 0 .3-9.4 6.8 6.8 0 0 0-12.9-2 5.8 5.8 0 0 0-1.8 11.4Z" fill="#fff" />
      <path d="M11 13.4h3.1l4.1 5.4v-5.4H21v8.8h-3.1l-4.1-5.4v5.4H11v-8.8Z" fill="#2f5bff" />
    </svg>
  )
}
