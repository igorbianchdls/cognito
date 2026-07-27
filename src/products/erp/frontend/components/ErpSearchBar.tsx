import { IconSearch } from '@tabler/icons-react'

import { Input } from '@/components/ui/input'

export function ErpSearchBar({
  value,
  placeholder,
  onChange,
}: {
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" stroke={1.8} />
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 bg-white pl-9 text-sm ring-1 ring-gray-200"
      />
    </div>
  )
}

