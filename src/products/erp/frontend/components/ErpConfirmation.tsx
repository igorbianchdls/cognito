'use client'

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Confirmation = {
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
  details?: string
}
type ConfirmAction = (request: Confirmation | string) => Promise<boolean>
type PromptRequest = Confirmation & { inputLabel: string; defaultValue: string; maximum?: number; type?: 'number' | 'text'; minimumLength?: number }
type PromptAction = (request: PromptRequest) => Promise<string | null>
const ConfirmationContext = createContext<{ confirm: ConfirmAction; prompt: PromptAction } | null>(null)

export function ErpConfirmationProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<(Confirmation & { input?: PromptRequest }) | null>(null)
  const pending = useRef<((result: boolean | string | null) => void) | null>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const finish = useCallback((confirmed: boolean) => {
    if (confirmed && request?.input?.type === 'text' && input.current) {
      const minimum = request.input.minimumLength ?? 1
      input.current.setCustomValidity(input.current.value.trim().length < minimum ? `Informe pelo menos ${minimum} caracteres.` : '')
    }
    if (confirmed && request?.input && !input.current?.reportValidity()) return
    const resolve = pending.current
    const result = request?.input ? (confirmed ? input.current?.value ?? request.input.defaultValue : null) : confirmed
    pending.current = null
    setRequest(null)
    resolve?.(result)
  }, [request])
  const confirm = useCallback<ConfirmAction>((next) => {
    // Only one decision can be pending; repeated clicks must not queue operations.
    if (pending.current) return Promise.resolve(false)
    return new Promise<boolean>((resolve) => {
      pending.current = result => resolve(result === true)
      setRequest(typeof next === 'string' ? { title: 'Confirmar ação', description: next } : next)
    })
  }, [])
  const prompt = useCallback<PromptAction>((next) => {
    if (pending.current) return Promise.resolve(null)
    return new Promise<string | null>((resolve) => {
      pending.current = result => resolve(typeof result === 'string' ? result : null)
      setRequest({ ...next, input: next })
    })
  }, [])
  useEffect(() => () => {
    pending.current?.(false)
    pending.current = null
  }, [])

  return <ConfirmationContext.Provider value={{ confirm, prompt }}>
    {children}
    <Dialog open={request !== null} onOpenChange={(open) => { if (!open) finish(false) }}>
      <DialogContent className="max-w-md rounded-xl" onOpenAutoFocus={(event) => {
        event.preventDefault()
        if (request?.input) input.current?.focus()
        else cancelButton.current?.focus()
      }}>
        <DialogHeader>
          <DialogTitle>{request?.title}</DialogTitle>
          <DialogDescription className="pt-2 leading-relaxed">{request?.description}</DialogDescription>
        </DialogHeader>
        {request?.details && <p className="rounded-lg border bg-muted/40 p-3 text-sm font-medium">{request.details}</p>}
        {request?.input && <div className="grid gap-2">
          <Label htmlFor={inputId}>{request.input.inputLabel}</Label>
          <Input ref={input} id={inputId} type={request.input.type ?? 'number'}
            min={request.input.type === 'text' ? undefined : '0.01'} step={request.input.type === 'text' ? undefined : '0.01'}
            max={request.input.type === 'text' ? undefined : request.input.maximum}
            minLength={request.input.type === 'text' ? request.input.minimumLength : undefined}
            maxLength={request.input.type === 'text' ? request.input.maximum : undefined}
            defaultValue={request.input.defaultValue} required onKeyDown={(event) => {
              if (event.key === 'Enter') { event.preventDefault(); finish(true) }
            }} />
        </div>}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button ref={cancelButton} type="button" variant="outline" onClick={() => finish(false)}>Cancelar</Button>
          <Button type="button" variant={request?.destructive ? 'destructive' : 'default'} onClick={() => finish(true)}>
            {request?.confirmLabel || 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </ConfirmationContext.Provider>
}

export function useErpConfirmation() {
  const context = useContext(ConfirmationContext)
  if (!context) throw new Error('Confirmações do ERP exigem ErpConfirmationProvider.')
  return context.confirm
}

export function useErpPrompt() {
  const context = useContext(ConfirmationContext)
  if (!context) throw new Error('Formulários de confirmação exigem ErpConfirmationProvider.')
  return context.prompt
}
