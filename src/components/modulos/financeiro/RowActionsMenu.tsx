"use client"

import * as React from 'react'
import { MoreVertical, Eye, Pencil, Paperclip, CheckCircle2, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

type Tipo = 'contas-a-pagar' | 'contas-a-receber' | string

export type RowActionsMenuProps = {
  type: Tipo
  row: Record<string, unknown>
  onViewDetails?: () => void
  onEdit?: () => void
  onOpenDocs?: () => void
  onMark?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}

export default function RowActionsMenu({ type, row, onViewDetails, onEdit, onOpenDocs, onMark, onDuplicate, onDelete }: RowActionsMenuProps) {
  const markLabel = React.useMemo(() => (type === 'contas-a-pagar' ? 'Marcar como Pago' : type === 'contas-a-receber' ? 'Marcar como Recebido' : 'Marcar'), [type])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Ações da linha">
          <MoreVertical className="h-4 w-4 text-gray-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-48 p-1">
        <DropdownMenuItem onClick={onViewDetails} className="gap-2">
          <Eye className="h-4 w-4" />
          Ver detalhes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit} className="gap-2">
          <Pencil className="h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenDocs} className="gap-2">
          <Paperclip className="h-4 w-4" />
          Anexos / Documento
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onMark} className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {markLabel}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate} className="gap-2">
          <Copy className="h-4 w-4" />
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-600 focus:text-red-700">
          <Trash2 className="h-4 w-4" />
          Excluir…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

