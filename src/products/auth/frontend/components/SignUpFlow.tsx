'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth, useSignUp } from '@clerk/nextjs'
import { SiGoogle } from '@icons-pack/react-simple-icons'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AuthAlert,
  AuthBackButton,
  AuthDivider,
  AuthField,
  AuthHeading,
  AuthSubmitButton,
  PasswordField,
} from '@/products/auth/frontend/components/AuthFormParts'
import { getAuthErrorMessage } from '@/products/auth/frontend/components/authErrors'

type SignUpStep = 'start' | 'verify-email'

export function SignUpFlow() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { signUp, errors, fetchStatus } = useSignUp()
  const [step, setStep] = useState<SignUpStep>('start')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
    if (password !== confirmPassword) {
      setGeneralError('As senhas informadas não são iguais.')
      return
    }
    if (requiresLegal && !legalAccepted) {
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
        locale: 'pt-BR',
      })
      if (result.error) throw result.error
      await continueFromStatus()
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível criar sua conta. Confira os dados e tente novamente.'))
    }
  }

  async function handleGoogleSignUp() {
    setGeneralError('')
    try {
      const result = await signUp.sso({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectCallbackUrl: '/onboarding',
        locale: 'pt-BR',
      })
      if (result.error) throw result.error
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível continuar com o Google.'))
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
        <AuthHeading title="Confirme seu email" description={`Digite o código que enviamos para ${email}.`} />
        <AuthAlert message={generalError} />
        <form onSubmit={handleVerifyEmail} className="grid gap-5">
          <AuthField id="verification-code" label="Código de verificação" value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={8} required error={fieldErrors.code} className="text-center text-base" />
          <AuthSubmitButton loading={loading}>Confirmar e continuar</AuthSubmitButton>
        </form>
        <p className="mt-6 text-center text-sm text-[#777]">
          Não recebeu?{' '}
          <button type="button" onClick={() => void handleResendCode()} disabled={resendIn > 0} className="font-medium text-[#181818] underline decoration-[#b9b9b9] underline-offset-4 disabled:cursor-not-allowed disabled:text-[#9a9a9a] disabled:no-underline">
            {resendIn > 0 ? `Reenviar em ${resendIn}s` : 'Reenviar código'}
          </button>
        </p>
      </div>
    )
  }

  return (
    <div>
      <AuthHeading title="Crie sua conta" description="Comece organizando a rotina financeira da sua empresa." />
      <AuthAlert message={generalError} />

      <form onSubmit={handleSignUp} className="grid gap-5">
        {requiresName ? <AuthField id="name" label="Seu nome" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Nome e sobrenome" required error={fieldErrors.name} /> : null}
        <AuthField id="email" label="Email profissional" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="voce@empresa.com.br" required autoFocus error={fieldErrors.email} />
        <PasswordField id="password" label="Senha" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required visible={passwordVisible} onToggleVisibility={() => setPasswordVisible((value) => !value)} error={fieldErrors.password} />
        <AuthField id="confirm-password" label="Confirmar senha" type={passwordVisible ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
        <p className="-mt-2 text-xs leading-5 text-[#777]">Use pelo menos 8 caracteres.</p>

        {requiresLegal ? (
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-[#666]">
            <Checkbox checked={legalAccepted} onCheckedChange={(value) => setLegalAccepted(value === true)} className="mt-0.5" />
            <span>Li e concordo com os termos aplicáveis ao uso da Otto.</span>
          </label>
        ) : null}

        <div id="clerk-captcha" />
        <AuthSubmitButton loading={loading}>Criar minha conta</AuthSubmitButton>
      </form>

      <AuthDivider />
      <Button type="button" variant="outline" onClick={() => void handleGoogleSignUp()} disabled={loading} className="h-11 w-full rounded-md border-[#d9d9d9] bg-white text-sm font-medium text-[#292929] shadow-none hover:bg-[#f7f7f7]">
        <SiGoogle size={16} color="default" title="Google" />
        Continuar com Google
      </Button>
    </div>
  )
}
