'use client'

import type { InputHTMLAttributes, ReactNode } from 'react'
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-[28px] font-medium leading-tight tracking-normal text-[#181818]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#6c6c6c]">{description}</p>
    </div>
  )
}

export function AuthAlert({ message }: { message: string }) {
  if (!message) return null
  return (
    <div role="alert" aria-live="polite" className="mb-5 flex gap-2.5 rounded-md border border-[#f2c4c4] bg-[#fff7f7] px-3.5 py-3 text-sm leading-5 text-[#a62e2e]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string
  label: string
  labelAction?: ReactNode
}

export function AuthField({ className, error, id, label, labelAction, ...props }: AuthFieldProps) {
  const errorId = error && id ? `${id}-error` : undefined
  return (
    <div className="grid gap-2">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <Label htmlFor={id} className="text-[13px] font-medium text-[#353535]">{label}</Label>
        {labelAction}
      </div>
      <Input
        id={id}
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        className={cn('h-11 rounded-md border border-[#d9d9d9] bg-white px-3 text-sm shadow-none placeholder:text-[#a0a0a0] focus-visible:border-[#181818] focus-visible:ring-2 focus-visible:ring-black/10', className)}
        {...props}
      />
      {error ? <p id={errorId} className="text-xs leading-5 text-[#b42318]">{error}</p> : null}
    </div>
  )
}

type PasswordFieldProps = Omit<AuthFieldProps, 'type'> & {
  visible: boolean
  onToggleVisibility: () => void
}

export function PasswordField({ visible, onToggleVisibility, className, ...props }: PasswordFieldProps) {
  return (
    <div className="relative">
      <AuthField type={visible ? 'text' : 'password'} className={cn('pr-11', className)} {...props} />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute right-1.5 top-[29px] flex h-8 w-8 items-center justify-center rounded-md text-[#777] transition-colors hover:bg-[#f1f1f1] hover:text-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function AuthSubmitButton({ children, loading }: { children: ReactNode; loading: boolean }) {
  return (
    <Button type="submit" disabled={loading} className="h-11 w-full rounded-md bg-[#181818] text-sm font-medium text-white shadow-none hover:bg-[#303030] focus-visible:ring-black/20">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      <span>{children}</span>
    </Button>
  )
}

export function AuthBackButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#666] transition-colors hover:text-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20">
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
  )
}

export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-[#e6e6e6]" />
      <span className="text-[11px] font-medium uppercase text-[#969696]">ou</span>
      <span className="h-px flex-1 bg-[#e6e6e6]" />
    </div>
  )
}
