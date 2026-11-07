'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useAuth, useSignUp } from '@clerk/nextjs'
import { ChevronDown } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  AuthAlert,
  AuthBackButton,
  AuthDivider,
  AuthField,
  AuthGoogleButton,
  AuthHeading,
  AuthSubmitButton,
  AuthTransition,
  CodeResend,
  OtpInput,
  PasswordField,
  PasswordStrength,
} from '@/products/auth/frontend/components/AuthFormParts'
import { getAuthErrorMessage } from '@/products/auth/frontend/components/authErrors'
import styles from './AuthLogin.module.css'

type SignUpStep = 'start' | 'verify-email' | 'invite' | 'complete'

const ACQUISITION_SOURCES = [
  'Pesquisa no Google',
  'Instagram ou outra rede social',
  'Indicação de alguém',
  'ChatGPT ou Claude',
  'Meu contador',
  'Outro',
]

const submitClassName = 'h-[54px] text-base'
const inviteTicket = () => { try { return new URLSearchParams(window.location.search).get('__clerk_ticket') || '' } catch { return '' } }

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return { firstName: parts[0] || undefined, lastName: parts.length > 1 ? parts.slice(1).join(' ') : undefined }
}

function TermsCheckbox({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 px-0.5 text-[13px] leading-5 text-[#6b7389]">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} className="mt-0.5 border-[#aab2c5] data-[state=checked]:border-[#104dff] data-[state=checked]:bg-[#104dff]" />
      <span>Li e concordo com os <b className="font-semibold text-[#111832]">Termos de uso</b> e a <b className="font-semibold text-[#111832]">Política de privacidade</b> da Otto.</span>
    </label>
  )
}

export function SignUpFlow() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { signUp, errors, fetchStatus } = useSignUp()
  const [ticket] = useState(inviteTicket)
  const [step, setStep] = useState<SignUpStep>(() => (ticket ? 'invite' : 'start'))
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
  const [redirecting, setRedirecting] = useState(false)

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

  // Back from Google with something still missing (name, terms): ask only for that, here.
  const checked = useRef(false)
  useEffect(() => {
    if (checked.current) return
    checked.current = true
    if (!ticket && signUp.id && signUp.status === 'missing_requirements') setStep('complete')
  }, [signUp.id, signUp.status, ticket])

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [resendIn])

  async function finishSignUp() {
    const result = await signUp.finalize()
    if (result.error) throw result.error
    setRedirecting(true)
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
      setStep('complete')
      return
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

    const { firstName, lastName } = splitName(name)
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

  async function handleGoogle() {
    setGeneralError('')
    try {
      setRedirecting(true)
      const result = await signUp.sso({ strategy: 'oauth_google', redirectUrl: '/sso-callback', redirectCallbackUrl: '/onboarding' })
      if (result.error) throw result.error
    } catch (error) {
      setRedirecting(false)
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível continuar com o Google.'))
    }
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError('')
    if (!legalAccepted) {
      setGeneralError('Você precisa aceitar os termos para entrar na equipe.')
      return
    }
    const { firstName, lastName } = splitName(name)
    try {
      const result = await signUp.create({ strategy: 'ticket', ticket, password, firstName, lastName, legalAccepted: true, locale: 'pt-BR' })
      if (result.error) throw result.error
      await continueFromStatus()
    } catch (error) {
      // The invited email already has an account: accept the invitation by signing in instead.
      const code = (error as { errors?: Array<{ code?: string }> })?.errors?.[0]?.code
      if (code === 'form_identifier_exists') {
        router.replace(`/sign-in?__clerk_ticket=${encodeURIComponent(ticket)}`)
        return
      }
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível aceitar o convite. Peça um novo convite a quem convidou você.'))
    }
  }

  async function handleComplete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError('')
    if (signUp.missingFields.includes('legal_accepted') && !legalAccepted) {
      setGeneralError('Você precisa aceitar os termos para continuar.')
      return
    }
    const { firstName, lastName } = splitName(name)
    try {
      const result = await signUp.update({
        ...(signUp.missingFields.includes('first_name') ? { firstName } : {}),
        ...(signUp.missingFields.includes('last_name') ? { lastName } : {}),
        ...(signUp.missingFields.includes('legal_accepted') ? { legalAccepted: true } : {}),
      })
      if (result.error) throw result.error
      await continueFromStatus()
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível concluir o cadastro.'))
    }
  }

  async function handleVerifyEmail(value = code) {
    setGeneralError('')
    try {
      const result = await signUp.verifications.verifyEmailCode({ code: value.trim() })
      if (result.error) throw result.error
      await continueFromStatus()
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível validar seu e-mail.'))
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

  if (redirecting && !generalError) return <AuthTransition title="Preparando sua conta…" />

  if (step === 'verify-email') {
    return (
      <div>
        <AuthBackButton onClick={() => void goBackToStart()}>Trocar e-mail</AuthBackButton>
        <AuthHeading eyebrow="Último passo" title="Confirme seu e-mail" description={<>Enviamos um código de 6 dígitos para <b className="font-semibold text-[#111832]">{email}</b>.</>} />
        <AuthAlert message={generalError} />
        <form onSubmit={(event) => { event.preventDefault(); void handleVerifyEmail() }} className="grid gap-6">
          <OtpInput label="Código de verificação" value={code} onChange={setCode} error={fieldErrors.code} autoFocus onComplete={(value) => void handleVerifyEmail(value)} />
          <AuthSubmitButton loading={loading} disabled={code.length < 6} className={submitClassName}>Confirmar e continuar</AuthSubmitButton>
        </form>
        <CodeResend countdown={resendIn} onResend={handleResendCode} />
        <p className="mt-2 text-center text-xs text-[#8d95a9]">Confira também a caixa de spam.</p>
      </div>
    )
  }

  if (step === 'invite') {
    return (
      <div>
        <AuthHeading eyebrow="Convite" title="Entre na equipe" description="Você foi convidado para usar a Otto. Crie sua senha para aceitar o convite." />
        <AuthAlert message={generalError} />
        <form onSubmit={handleInvite} className={styles.form}>
          <AuthField id="name" label="Seu nome completo" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Nome e sobrenome" required autoFocus error={fieldErrors.name} />
          <PasswordField id="password" label="Crie uma senha" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required visible={passwordVisible} onToggleVisibility={() => setPasswordVisible((value) => !value)} error={fieldErrors.password} hint={<PasswordStrength password={password} />} />
          <TermsCheckbox checked={legalAccepted} onChange={setLegalAccepted} />
          <div id="clerk-captcha" />
          <AuthSubmitButton loading={loading} className={submitClassName}>Aceitar convite</AuthSubmitButton>
        </form>
      </div>
    )
  }

  if (step === 'complete') {
    const needsName = signUp.missingFields.includes('first_name') || signUp.missingFields.includes('last_name')
    const needsLegal = signUp.missingFields.includes('legal_accepted')
    return (
      <div>
        <AuthHeading eyebrow="Quase lá" title="Complete seu cadastro" description="Só precisamos de mais um detalhe para criar sua conta." />
        <AuthAlert message={generalError} />
        <form onSubmit={handleComplete} className={styles.form}>
          {needsName ? <AuthField id="name" label="Seu nome completo" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Nome e sobrenome" required autoFocus error={fieldErrors.name} /> : null}
          {needsLegal ? <TermsCheckbox checked={legalAccepted} onChange={setLegalAccepted} /> : null}
          <AuthSubmitButton loading={loading} className={submitClassName}>Criar minha conta</AuthSubmitButton>
        </form>
      </div>
    )
  }

  return (
    <div>
      <AuthHeading title="Crie sua conta" description="Comece a organizar sua empresa em poucos minutos." />
      <AuthAlert message={generalError} />

      <AuthGoogleButton onClick={() => void handleGoogle()} disabled={loading}>Criar conta com Google</AuthGoogleButton>
      <AuthDivider>ou com e-mail</AuthDivider>

      <form onSubmit={handleSignUp} className={styles.formCompact}>
        <AuthField id="name" label="Nome completo" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Nome e sobrenome" required autoFocus error={fieldErrors.name} />
        <AuthField id="email" label="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="voce@empresa.com.br" required error={fieldErrors.email} />
        <div className={styles.fieldRow}>
          <AuthField id="phone" label="Celular" type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} autoComplete="tel-national" placeholder="(00) 00000-0000" required />
          <div className="grid gap-2" data-auth-field>
            <Label htmlFor="acquisition-source" className="text-[13px] font-medium text-[#151c35]">Como conheceu a Otto?</Label>
            <div className="relative">
              <select id="acquisition-source" value={acquisitionSource} onChange={(event) => setAcquisitionSource(event.target.value)} required data-auth-select
                className="h-11 w-full appearance-none rounded-md border border-[#d3d8e5] bg-white px-3 pr-9 text-sm text-[#111832] outline-none invalid:text-[#8d95a9] focus-visible:border-[#104dff] focus-visible:ring-2 focus-visible:ring-[#104dff]/15">
                <option value="" disabled>Selecione</option>
                {ACQUISITION_SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#818aa0]" aria-hidden="true" />
            </div>
          </div>
        </div>
        <PasswordField id="password" label="Senha" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" minLength={8} required visible={passwordVisible} onToggleVisibility={() => setPasswordVisible((value) => !value)} error={fieldErrors.password} hint={password ? <PasswordStrength password={password} /> : undefined} />
        <TermsCheckbox checked={legalAccepted} onChange={setLegalAccepted} />
        <div id="clerk-captcha" />
        <AuthSubmitButton loading={loading} className={submitClassName}>Criar conta</AuthSubmitButton>
      </form>
    </div>
  )
}
