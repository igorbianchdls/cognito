import type { ReactNode } from 'react'

const colors = [
  'bg-[#e7eefc] text-[#315fa2]',
  'bg-[#e5f4ec] text-[#28734b]',
  'bg-[#fff0db] text-[#94601c]',
  'bg-[#f0e8fb] text-[#7855a3]',
  'bg-[#fbe7eb] text-[#a64c66]',
  'bg-[#e1f3f4] text-[#287c82]',
  'bg-[#faeade] text-[#a35e35]',
  'bg-[#e9ecf3] text-[#58647f]',
]

export function ErpRecordIdentity({ name, category, identityKey, icon }: {
  name: string
  category?: string | null
  identityKey?: string
  icon?: ReactNode
}) {
  const label = name.trim() || 'Sem descrição'
  const secondary = category?.trim() || 'Sem categoria'
  let hash = 0
  for (const character of identityKey || label) hash = (Math.imul(hash, 31) + character.codePointAt(0)!) >>> 0
  const initial = Array.from(label)[0].toLocaleUpperCase('pt-BR')

  return <div className="flex min-w-[220px] items-center gap-3" data-erp-record-identity>
    <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-[16px] font-medium ${colors[hash % colors.length]}`}>
      {icon || initial}
    </span>
    <div className="min-w-0">
      <span className="block max-w-[360px] truncate font-medium text-[#252525]" title={label}>{label}</span>
      <span className="mt-0.5 block max-w-[360px] truncate text-[12px] text-[#7a7a7a]" title={secondary}>{secondary}</span>
    </div>
  </div>
}
