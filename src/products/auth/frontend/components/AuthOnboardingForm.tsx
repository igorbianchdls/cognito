"use client"

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  defaultCompanyName?: string
  email: string
}

function getErrorMessage(value: unknown) {
  if (value instanceof Error) return value.message
  return String(value || 'Nao foi possivel concluir o onboarding.')
}

export function AuthOnboardingForm({ defaultCompanyName = '', email }: Props) {
  const router = useRouter()
  const [companyName, setCompanyName] = useState(defaultCompanyName)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        throw new Error(String(payload?.error || `HTTP ${response.status}`))
      }

      router.replace('/integracoes')
      router.refresh()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
        <Building2 className="h-5 w-5" />
      </div>
      <div className="mt-5 space-y-1">
        <h1 className="text-xl font-semibold tracking-normal text-slate-950">Criar workspace</h1>
        <p className="text-sm text-slate-600">{email}</p>
      </div>

      <label className="mt-6 block space-y-2">
        <span className="text-sm font-medium text-slate-800">Nome da empresa</span>
        <Input
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          autoComplete="organization"
          minLength={2}
          maxLength={120}
          required
          placeholder="Ex: Minha Empresa"
          className="border border-slate-300 bg-white"
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Continuar
      </Button>
    </form>
  )
}
