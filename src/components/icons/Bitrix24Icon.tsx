interface Bitrix24IconProps {
  className?: string
}

export default function Bitrix24Icon({ className = "w-4 h-4" }: Bitrix24IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" role="img" aria-label="Bitrix24">
      <rect width="32" height="32" rx="8" fill="#1f8bff" />
      <path d="M8 8h9.1c3 0 5 1.8 5 4.3 0 1.5-.7 2.7-2 3.3 1.8.6 2.9 1.9 2.9 3.9 0 2.8-2.1 4.5-5.5 4.5H8V8Zm4.3 3.5v2.8h4.1c.9 0 1.4-.5 1.4-1.4s-.5-1.4-1.4-1.4h-4.1Zm0 6.1v2.9h4.8c1 0 1.5-.5 1.5-1.5s-.5-1.4-1.5-1.4h-4.8Z" fill="#fff" />
      <path d="M23.1 8h2.4v2.4h-2.4V8Zm0 4h2.4v12h-2.4V12Z" fill="#b9e3ff" />
    </svg>
  )
}
