import { IconDownload, IconPlus, IconRefresh } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

export function ErpActionBar({
  primaryActionLabel,
  onPrimaryAction,
}: {
  primaryActionLabel: string
  onPrimaryAction: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Atualizar">
        <IconRefresh className="size-4" stroke={1.8} />
      </Button>
      <Button variant="outline" size="icon" aria-label="Exportar">
        <IconDownload className="size-4" stroke={1.8} />
      </Button>
      <Button size="sm" onClick={onPrimaryAction}>
        <IconPlus className="size-4" stroke={1.8} />
        {primaryActionLabel}
      </Button>
    </div>
  )
}

