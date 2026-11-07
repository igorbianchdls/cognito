'use client'

import { useRef, type ClipboardEvent, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { AlertCircle, ArrowLeft, CircleCheck, Eye, EyeOff, Loader2 } from 'lucide-react'
import { SiGoogle } from '@icons-pack/react-simple-icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Building blocks shared by every access screen (sign-in, sign-up, codes, onboarding). They use the Otto blue and
// are sized by AuthLogin.module.css inside the shared layout.

export const AUTH_BLUE = '#104dff'

export function AuthHeading({ title, description, eyebrow }: { title: string; description?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8" data-auth-heading>
      {eyebrow ? <div className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#104dff]">{eyebrow}</div> : null}
      <h2 className="text-[28px] font-medium leading-tight tracking-normal text-[#111832]">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-[#6b7389]">{description}</p> : null}
    </div>
  )
}

export function AuthAlert({ message, tone = 'error' }: { message: string; tone?: 'error' | 'success' }) {
  if (!message) return null
  const success = tone === 'success'
  return (
    <div role={success ? 'status' : 'alert'} aria-live="polite" className={cn('mb-5 flex gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-5',
      success ? 'border-[#bfe5cb] bg-[#f2fbf5] text-[#1f6b3a]' : 'border-[#f2c4c4] bg-[#fff7f7] text-[#a62e2e]')}>
      {success ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{message}</span>
    </div>
  )
}

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string
  hint?: ReactNode
  label: string
  labelAction?: ReactNode
}

export function AuthField({ className, error, hint, id, label, labelAction, ...props }: AuthFieldProps) {
  const errorId = error && id ? `${id}-error` : undefined
  const hintId = hint && id ? `${id}-hint` : undefined
  return (
    <div className="grid gap-2" data-auth-field>
      <div className="flex min-h-5 items-center justify-between gap-3">
        <Label htmlFor={id} className="text-[13px] font-medium text-[#151c35]">{label}</Label>
        {labelAction}
      </div>
      <Input
        id={id}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        aria-invalid={Boolean(error)}
        className={cn('h-11 rounded-md border border-[#d3d8e5] bg-white px-3 text-sm shadow-none placeholder:text-[#8d95a9] focus-visible:border-[#104dff] focus-visible:ring-2 focus-visible:ring-[#104dff]/15', className)}
        {...props}
      />
      {error ? <p id={errorId} className="text-xs leading-5 text-[#b42318]">{error}</p> : hint ? <div id={hintId} className="text-xs leading-5 text-[#6b7389]">{hint}</div> : null}
    </div>
  )
}

type PasswordFieldProps = Omit<AuthFieldProps, 'type'> & {
  visible: boolean
  onToggleVisibility: () => void
}

export function PasswordField({ visible, onToggleVisibility, className, ...props }: PasswordFieldProps) {
  return (
    <div className="relative" data-auth-password>
      <AuthField type={visible ? 'text' : 'password'} className={cn('pr-11', className)} {...props} />
      <button
        type="button"
        data-auth-password-toggle
        onClick={onToggleVisibility}
        className="absolute right-1.5 top-[29px] flex h-8 w-8 items-center justify-center rounded-md text-[#818aa0] transition-colors hover:bg-[#f1f3f8] hover:text-[#111832] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104dff]/30"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

/** How strong a password is, from 0 (empty) to 4, with the rules the user can see. */
export function passwordChecks(password: string) {
  const rules = [
    { label: '8 ou mais caracteres', ok: password.length >= 8 },
    { label: 'Letras e números', ok: /[a-zA-Z]/.test(password) && /\d/.test(password) },
    { label: 'Maiúscula e minúscula', ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Um símbolo (!@#…)', ok: /[^a-zA-Z0-9]/.test(password) },
  ]
  return { rules, score: password ? rules.filter((rule) => rule.ok).length : 0 }
}

export function PasswordStrength({ password }: { password: string }) {
  const { rules, score } = passwordChecks(password)
  const labels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']
  const colors = ['#d3d8e5', '#d64545', '#e8a33d', '#2f8f5b', '#1f7a4a']
  return (
    <div data-auth-strength className="grid gap-2">
      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((step) => <span key={step} className="h-1.5 rounded-full transition-colors" style={{ background: score >= step ? colors[score] : '#e6e9f1' }} />)}
        </div>
        <span className="w-16 text-right text-xs font-medium" style={{ color: colors[score] }} aria-live="polite">{labels[score]}</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {rules.map((rule) => (
          <li key={rule.label} className={cn('flex items-center gap-1.5 text-xs', rule.ok ? 'text-[#1f7a4a]' : 'text-[#8d95a9]')}>
            <CircleCheck className={cn('h-3.5 w-3.5 shrink-0', rule.ok ? 'opacity-100' : 'opacity-40')} aria-hidden="true" />
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A code typed in one box per digit. Pasting fills every box; Backspace walks back. */
export function OtpInput({ value, onChange, length = 6, label, error, autoFocus, onComplete }: {
  value: string
  onChange: (value: string) => void
  length?: number
  label: string
  error?: string
  autoFocus?: boolean
  onComplete?: (value: string) => void
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')
  const set = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
    return clean
  }
  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus()
  const onKey = (i: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[i] && i > 0) {
      event.preventDefault()
      set(value.slice(0, i - 1))
      focus(i - 1)
    } else if (event.key === 'ArrowLeft') focus(i - 1)
    else if (event.key === 'ArrowRight') focus(i + 1)
  }
  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const clean = set(event.clipboardData.getData('text'))
    focus(clean.length)
  }
  return (
    <fieldset className="grid gap-2" data-auth-otp>
      <legend className="mb-2 text-[13px] font-medium text-[#151c35]">{label}</legend>
      <div className="flex justify-between gap-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el }}
            value={digit}
            onChange={(event) => {
              const typed = event.target.value.replace(/\D/g, '')
              if (!typed) { set(value.slice(0, i) + value.slice(i + 1)); return }
              const clean = set(value.slice(0, i) + typed + value.slice(i + typed.length))
              focus(Math.min(clean.length, i + typed.length))
            }}
            onKeyDown={(event) => onKey(i, event)}
            onPaste={onPaste}
            onFocus={(event) => event.target.select()}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            autoFocus={autoFocus && i === 0}
            aria-label={`${label}, dígito ${i + 1} de ${length}`}
            aria-invalid={Boolean(error)}
            maxLength={length}
            className={cn('h-14 w-full min-w-0 rounded-lg border bg-white text-center text-2xl font-semibold text-[#111832] outline-none transition-shadow',
              error ? 'border-[#b42318]' : 'border-[#d3d8e5] focus:border-[#104dff] focus:shadow-[0_0_0_3px_rgb(16_77_255_/_0.14)]')}
          />
        ))}
      </div>
      {error ? <p className="text-xs leading-5 text-[#b42318]">{error}</p> : null}
    </fieldset>
  )
}

export function AuthSubmitButton({ children, loading, className, disabled }: { children: ReactNode; loading: boolean; className?: string; disabled?: boolean }) {
  return (
    <Button type="submit" disabled={loading || disabled} className={cn('h-11 w-full rounded-md bg-[#104dff] text-sm font-semibold text-white shadow-none hover:bg-[#0b3ee0] focus-visible:ring-[#104dff]/30', className)}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      <span className="inline-flex items-center gap-2">{children}</span>
    </Button>
  )
}

export function AuthGoogleButton({ onClick, disabled, children = 'Continuar com Google' }: { onClick: () => void; disabled?: boolean; children?: ReactNode }) {
  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={disabled} data-auth-google
      className="h-11 w-full rounded-md border-[#d3d8e5] bg-white text-sm font-semibold text-[#151c35] shadow-none hover:border-[#b9c0d3] hover:bg-[#f7f8fc]">
      <SiGoogle size={16} color="default" title="Google" />
      {children}
    </Button>
  )
}

export function AuthBackButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mb-6 inline-flex items-center gap-2 rounded-md text-sm font-medium text-[#6b7389] transition-colors hover:text-[#111832] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104dff]/30">
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
  )
}

export function AuthDivider({ children = 'ou' }: { children?: ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-3" aria-hidden="true" data-auth-divider>
      <span className="h-px flex-1 bg-[#e6e9f1]" />
      <span className="text-xs text-[#8d95a9]">{children}</span>
      <span className="h-px flex-1 bg-[#e6e9f1]" />
    </div>
  )
}

/** "Didn't get it? Resend in 30s" under a code field. */
export function CodeResend({ countdown, onResend, extra }: { countdown: number; onResend: () => Promise<void> | void; extra?: ReactNode }) {
  return (
    <p className="mt-6 text-center text-sm text-[#6b7389]">
      Não recebeu?{' '}
      <button type="button" onClick={() => void onResend()} disabled={countdown > 0} className="font-semibold text-[#104dff] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[#9aa1b4] disabled:no-underline">
        {countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar código'}
      </button>
      {extra}
    </p>
  )
}

/** Shown while Clerk finishes a step (Google return, loading the session) so the screen is never blank. */
export function AuthTransition({ title = 'Entrando na sua conta…', description = 'Só um instante.' }: { title?: string; description?: string }) {
  return (
    <div className="grid min-h-[360px] place-content-center justify-items-center gap-5 text-center" role="status" aria-live="polite">
      <span className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#104dff]/15 motion-reduce:animate-none" />
        <Loader2 className="h-8 w-8 animate-spin text-[#104dff] motion-reduce:animate-none" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xl font-medium text-[#111832]">{title}</p>
        <p className="mt-1.5 text-sm text-[#6b7389]">{description}</p>
      </div>
    </div>
  )
}
