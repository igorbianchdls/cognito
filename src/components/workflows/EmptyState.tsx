"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

export function EmptyState({ onCreate }: { onCreate?: () => void }) {
  const [imgError, setImgError] = useState(false)
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed rounded-xl bg-background">
      {!imgError && (
        // Se existir public/workflows.png, exibimos; senão, ocultamos
        // A imagem servirá como referência visual do layout
        <img
          src="/workflows.png"
          alt="Workflows"
          className="w-full max-w-md mb-6 rounded-lg shadow-sm"
          onError={() => setImgError(true)}
        />
      )}
      <h3 className="text-xl font-semibold">Nenhum workflow ainda</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-lg">
        Crie seu primeiro workflow para automatizar processos e acelerar sua operação.
      </p>
      <Button className="mt-6" onClick={onCreate}>Criar workflow</Button>
    </div>
  )
}

export default EmptyState

