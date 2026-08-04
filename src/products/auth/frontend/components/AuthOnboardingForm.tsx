"use client"

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Building2, Loader2 } from 'lucide-react'

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
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#eef2ec] text-[#31553b]">
        <Building2 className="h-5 w-5" />
      </div>
      <div className="mt-6">
        <h1 className="text-[28px] font-medium leading-tight tracking-normal text-[#181818]">Configure sua empresa</h1>
        <p className="mt-2 text-sm leading-6 text-[#6c6c6c]">Este será o nome exibido para sua equipe dentro da Otto.</p>
      </div>

      <label className="mt-8 block space-y-2">
        <span className="text-[13px] font-medium text-[#353535]">Nome da empresa</span>
        <Input
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          autoComplete="organization"
          minLength={2}
          maxLength={120}
          required
          placeholder="Ex: Minha Empresa"
          className="h-11 rounded-md border border-[#d9d9d9] bg-white px-3 text-sm shadow-none placeholder:text-[#a0a0a0] focus-visible:border-[#181818] focus-visible:ring-2 focus-visible:ring-black/10"
        />
      </label>

      <p className="mt-2 text-xs text-[#777]">Conta vinculada a {email}</p>

      {error ? (
        <p role="alert" className="mt-5 flex gap-2.5 rounded-md border border-[#f2c4c4] bg-[#fff7f7] px-3.5 py-3 text-sm text-[#a62e2e]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="mt-6 h-11 w-full rounded-md bg-[#181818] text-sm font-medium text-white shadow-none hover:bg-[#303030] focus-visible:ring-black/20">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Acessar a Otto
      </Button>
    </form>
  )
}
