"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

type NewRecordButtonProps = {
  disabled?: boolean
  onCreateRecord: () => Promise<void>
}

export default function NewRecordButton({ disabled, onCreateRecord }: NewRecordButtonProps) {
  return (
    <Button size="sm" onClick={() => void onCreateRecord()} disabled={disabled}>
      <Plus className="h-4 w-4 mr-2" />
      Novo registro
    </Button>
  )
}
