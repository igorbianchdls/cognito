'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { useAuth, useSignUp } from '@clerk/nextjs'
import { ChevronDown, Eye, EyeOff, KeyRound, Mail, Megaphone, Phone, UserRound } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  AuthAlert,
  AuthBackButton,
  AuthField,
  AuthSubmitButton,
} from '@/products/auth/frontend/components/AuthFormParts'
import { getAuthErrorMessage } from '@/products/auth/frontend/components/authErrors'

type SignUpStep = 'start' | 'verify-email'

const ACQUISITION_SOURCES = [
  'Pesquisa no Google',
  'Instagram ou outra rede social',
  'Indicação de alguém',
  'ChatGPT ou Claude',
  'Meu contador',
  'Outro',
]

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

type GroupedFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string
  icon: ReactNode
  label: string
  trailing?: ReactNode
}

function GroupedField({ error, icon, id, label, trailing, className, ...props }: GroupedFieldProps) {
  const errorId = error && id ? `${id}-error` : undefined

  return (
    <div className="border-b border-[#e5e8e4] last:border-b-0">
      <div className="flex min-h-[61px] items-center gap-3 px-4">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#7a817b]" aria-hidden="true">{icon}</span>
        <label htmlFor={id} className="min-w-0 flex-1 cursor-text py-2.5">
          <span className="block text-[11px] leading-4 text-[#899089]">{label}</span>
          <input
            id={id}
            aria-describedby={errorId}
            aria-invalid={Boolean(error)}
            style={{ outline: 'none' }}
            className={cn('mt-0.5 h-6 w-full border-0 bg-transparent p-0 text-sm text-[#181818] outline-none placeholder:text-[#b0b5b0] focus:outline-none focus-visible:outline-none', className)}
            {...props}
          />
        </label>
        {trailing}
      </div>
      {error ? <p id={errorId} className="px-12 pb-2 text-xs leading-4 text-[#b42318]">{error}</p> : null}
    </div>
  )
}

export function SignUpFlow() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { signUp, errors, fetchStatus } = useSignUp()
  const [step, setStep] = useState<SignUpStep>('start')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [acquisitionSource, setAcquisitionSource] = useState('')
  const [code, setCode] = useState('')
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  const loading = fetchStatus === 'fetching'
  const requiresName = signUp.requiredFields.includes('first_name') || signUp.requiredFields.includes('last_name')
  const requiresLegal = signUp.requiredFields.includes('legal_accepted')
  const fieldErrors = useMemo(() => ({
    code: errors.fields.code ? getAuthErrorMessage(errors.fields.code, '') : '',
    email: errors.fields.emailAddress ? getAuthErrorMessage(errors.fields.emailAddress, '') : '',
    name: errors.fields.firstName
      ? getAuthErrorMessage(errors.fields.firstName, '')
      : errors.fields.lastName
        ? getAuthErrorMessage(errors.fields.lastName, '')
        : '',
    password: errors.fields.password ? getAuthErrorMessage(errors.fields.password, '') : '',
  }), [errors.fields.code, errors.fields.emailAddress, errors.fields.firstName, errors.fields.lastName, errors.fields.password])

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/onboarding')
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [resendIn])

  async function finishSignUp() {
    const result = await signUp.finalize()
    if (result.error) throw result.error
    router.replace('/onboarding')
    router.refresh()
  }

  async function continueFromStatus() {
    if (signUp.status === 'complete') return finishSignUp()
    if (signUp.unverifiedFields.includes('email_address')) {
      const result = await signUp.verifications.sendEmailCode()
      if (result.error) throw result.error
      setCode('')
      setStep('verify-email')
      setResendIn(30)
      return
    }
    if (signUp.missingFields.length) {
      throw new Error(`Ainda precisamos destes dados: ${signUp.missingFields.join(', ')}.`)
    }
    throw new Error('O cadastro precisa de uma etapa adicional que ainda não está disponível.')
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError('')

    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      setGeneralError('Informe um celular válido com DDD.')
      return
    }
    if (!acquisitionSource) {
      setGeneralError('Conte para a gente como você conheceu a Otto.')
      return
    }
    if (!legalAccepted) {
      setGeneralError('Você precisa aceitar os termos para criar a conta.')
      return
    }

    const cleanName = name.trim().split(/\s+/)
    const firstName = cleanName[0] || undefined
    const lastName = cleanName.length > 1 ? cleanName.slice(1).join(' ') : undefined

    try {
      const result = await signUp.password({
        emailAddress: email.trim(),
        password,
        ...(requiresName ? { firstName, lastName } : {}),
        ...(requiresLegal ? { legalAccepted: true } : {}),
        unsafeMetadata: {
          acquisitionSource,
          fullName: name.trim(),
          phone: `+55${phoneDigits}`,
          termsAccepted: true,
        },
        locale: 'pt-BR',
      })
      if (result.error) throw result.error
      await continueFromStatus()
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível criar sua conta. Confira os dados e tente novamente.'))
    }
  }

  async function handleVerifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError('')
    try {
      const result = await signUp.verifications.verifyEmailCode({ code: code.trim() })
      if (result.error) throw result.error
      await continueFromStatus()
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível validar seu email.'))
    }
  }

  async function handleResendCode() {
    if (resendIn > 0) return
    setGeneralError('')
    try {
      const result = await signUp.verifications.sendEmailCode()
      if (result.error) throw result.error
      setResendIn(30)
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível reenviar o código.'))
    }
  }

  async function goBackToStart() {
    await signUp.reset()
    setStep('start')
    setCode('')
    setGeneralError('')
  }

  if (step === 'verify-email') {
    return (
      <div>
        <AuthBackButton onClick={() => void goBackToStart()}>Alterar dados do cadastro</AuthBackButton>
        <div className="mb-7 text-center">
          <h1 className="text-[28px] font-medium leading-tight tracking-normal text-[#181818]">Confirme seu email</h1>
          <p className="mt-2 text-sm leading-6 text-[#6c726d]">Digite o código que enviamos para {email}.</p>
        </div>
        <AuthAlert message={generalError} />
        <form onSubmit={handleVerifyEmail} className="grid gap-5">
          <AuthField id="verification-code" label="Código de verificação" value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={8} required error={fieldErrors.code} className="text-center text-base" />
          <AuthSubmitButton loading={loading}>Confirmar e continuar</AuthSubmitButton>
        </form>
        <p className="mt-6 text-center text-sm text-[#777]">
          Não recebeu?{' '}
          <button type="button" onClick={() => void handleResendCode()} disabled={resendIn > 0} className="font-medium text-[#31553b] underline decoration-[#b9c8bc] underline-offset-4 disabled:cursor-not-allowed disabled:text-[#9a9a9a] disabled:no-underline">
            {resendIn > 0 ? `Reenviar em ${resendIn}s` : 'Reenviar código'}
          </button>
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-7 text-center">
        <h1 className="text-[28px] font-medium leading-tight tracking-normal text-[#181818]">Criar conta</h1>
        <p className="mt-2 text-sm leading-6 text-[#6c726d]">Informe seus dados para começar a usar a Otto.</p>
      </div>
      <AuthAlert message={generalError} />

      <form onSubmit={handleSignUp} className="grid gap-5">
        <div className="overflow-hidden rounded-md border border-[#dfe3de] bg-white transition-shadow focus-within:shadow-[0_0_0_3px_rgba(45,138,72,0.1)]">
          <GroupedField id="name" label="Seu nome completo" icon={<UserRound className="h-[17px] w-[17px]" />} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Nome e sobrenome" required autoFocus error={fieldErrors.name} />
          <GroupedField id="email" label="Seu endereço de email" icon={<Mail className="h-[17px] w-[17px]" />} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="voce@empresa.com.br" required error={fieldErrors.email} />
          <GroupedField id="phone" label="Celular" icon={<Phone className="h-[17px] w-[17px]" />} type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} autoComplete="tel-national" placeholder="(00) 00000-0000" required />
          <GroupedField
            id="password"
            label="Sua senha"
            icon={<KeyRound className="h-[17px] w-[17px]" />}
            type={passwordVisible ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            minLength={8}
            required
            error={fieldErrors.password}
            trailing={(
              <button
                type="button"
                onClick={() => setPasswordVisible((value) => !value)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#7a817b] transition-colors hover:bg-[#f0f3ef] hover:text-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d8a48]/25"
                aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          />
          <div className="flex min-h-[61px] items-center gap-3 px-4">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#7a817b]" aria-hidden="true"><Megaphone className="h-[17px] w-[17px]" /></span>
            <label htmlFor="acquisition-source" className="min-w-0 flex-1 py-2.5">
              <span className="block text-[11px] leading-4 text-[#899089]">Como conheceu a Otto?</span>
              <select
                id="acquisition-source"
                value={acquisitionSource}
                onChange={(event) => setAcquisitionSource(event.target.value)}
                required
                className="mt-0.5 h-6 w-full appearance-none border-0 bg-transparent p-0 pr-7 text-sm text-[#181818] outline-none invalid:text-[#b0b5b0]"
              >
                <option value="" disabled>Selecione uma opção</option>
                {ACQUISITION_SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
              </select>
            </label>
            <ChevronDown className="h-4 w-4 shrink-0 text-[#7a817b]" aria-hidden="true" />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 px-0.5 text-xs leading-5 text-[#6c726d]">
          <Checkbox checked={legalAccepted} onCheckedChange={(value) => setLegalAccepted(value === true)} className="mt-0.5 border-[#aeb5af] data-[state=checked]:border-[#2d8a48] data-[state=checked]:bg-[#2d8a48]" />
          <span>Li e concordo com os <span className="font-medium text-[#31553b] underline decoration-[#b9c8bc] underline-offset-2">Termos de uso</span> e a <span className="font-medium text-[#31553b] underline decoration-[#b9c8bc] underline-offset-2">Política de privacidade</span> da Otto.</span>
        </label>

        <div id="clerk-captcha" />
        <AuthSubmitButton loading={loading}>Continuar</AuthSubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-[#777d78]">
        Já tem uma conta?{' '}
        <Link href="/sign-in" className="font-medium text-[#31553b] underline decoration-[#b9c8bc] underline-offset-4 transition-colors hover:decoration-[#31553b]">Acesse</Link>
      </p>
    </div>
  )
}
