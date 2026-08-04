'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth, useSignIn } from '@clerk/nextjs'
import { SiGoogle } from '@icons-pack/react-simple-icons'

import { Button } from '@/components/ui/button'
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

type SignInStep = 'start' | 'recovery-code' | 'new-password' | 'mfa'
type MfaStrategy = 'email_code' | 'phone_code' | 'totp' | 'backup_code'

export function SignInFlow() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { signIn, errors, fetchStatus } = useSignIn()
  const [step, setStep] = useState<SignInStep>('start')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [code, setCode] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [newPasswordVisible, setNewPasswordVisible] = useState(false)
  const [mfaStrategy, setMfaStrategy] = useState<MfaStrategy>('totp')
  const [resendIn, setResendIn] = useState(0)

  const loading = fetchStatus === 'fetching'
  const fieldErrors = useMemo(() => ({
    code: errors.fields.code ? getAuthErrorMessage(errors.fields.code, '') : '',
    email: errors.fields.identifier ? getAuthErrorMessage(errors.fields.identifier, '') : '',
    password: errors.fields.password ? getAuthErrorMessage(errors.fields.password, '') : '',
  }), [errors.fields.code, errors.fields.identifier, errors.fields.password])

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/onboarding')
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [resendIn])

  async function finishSignIn() {
    const result = await signIn.finalize()
    if (result.error) throw result.error
    router.replace('/onboarding')
    router.refresh()
  }

  async function prepareMfa() {
    const preferred = signIn.supportedSecondFactors.find((factor) => factor.strategy === 'totp')
      || signIn.supportedSecondFactors.find((factor) => factor.strategy === 'email_code')
      || signIn.supportedSecondFactors.find((factor) => factor.strategy === 'phone_code')
      || signIn.supportedSecondFactors.find((factor) => factor.strategy === 'backup_code')

    if (!preferred || !['totp', 'email_code', 'phone_code', 'backup_code'].includes(preferred.strategy)) {
      throw new Error('Não encontramos um método de verificação compatível para esta conta.')
    }

    const strategy = preferred.strategy as MfaStrategy
    setMfaStrategy(strategy)
    setCode('')
    setStep('mfa')

    if (strategy === 'email_code') {
      const result = await signIn.mfa.sendEmailCode()
      if (result.error) throw result.error
      setResendIn(30)
    }
    if (strategy === 'phone_code') {
      const result = await signIn.mfa.sendPhoneCode()
      if (result.error) throw result.error
      setResendIn(30)
    }
  }

  async function continueFromStatus() {
    if (signIn.status === 'complete') return finishSignIn()
    if (signIn.status === 'needs_second_factor') return prepareMfa()
    if (signIn.status === 'needs_new_password') {
      setStep('new-password')
      return
    }
    throw new Error('A autenticação precisa de uma etapa adicional que ainda não está disponível.')
  }

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError('')
    try {
      const result = await signIn.password({ emailAddress: email.trim(), password })
      if (result.error) throw result.error
      await continueFromStatus()
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível entrar. Confira seus dados e tente novamente.'))
    }
  }

  async function handleGoogleSignIn() {
    setGeneralError('')
    try {
      const result = await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectCallbackUrl: '/onboarding',
      })
      if (result.error) throw result.error
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível continuar com o Google.'))
    }
  }

  async function handleStartRecovery() {
    if (!email.trim()) {
      setGeneralError('Informe seu email para recuperar a senha.')
      return
    }
    setGeneralError('')
    try {
      await signIn.reset()
      const created = await signIn.create({ identifier: email.trim() })
      if (created.error) throw created.error
      const supportsRecovery = signIn.supportedFirstFactors.some((factor) => factor.strategy === 'reset_password_email_code')
      if (!supportsRecovery) throw new Error('A recuperação por email não está disponível para esta conta.')
      const sent = await signIn.resetPasswordEmailCode.sendCode()
      if (sent.error) throw sent.error
      setCode('')
      setStep('recovery-code')
      setResendIn(30)
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível enviar o código de recuperação.'))
    }
  }

  async function handleVerifyRecoveryCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError('')
    try {
      const result = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() })
      if (result.error) throw result.error
      if (signIn.status !== 'needs_new_password') throw new Error('O código não pôde ser validado.')
      setNewPassword('')
      setStep('new-password')
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível validar o código.'))
    }
  }

  async function handleNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError('')
    try {
      const result = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
        signOutOfOtherSessions: true,
      })
      if (result.error) throw result.error
      await continueFromStatus()
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível definir a nova senha.'))
    }
  }

  async function handleVerifyMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGeneralError('')
    try {
      const value = { code: code.trim() }
      const result = mfaStrategy === 'email_code'
        ? await signIn.mfa.verifyEmailCode(value)
        : mfaStrategy === 'phone_code'
          ? await signIn.mfa.verifyPhoneCode(value)
          : mfaStrategy === 'backup_code'
            ? await signIn.mfa.verifyBackupCode(value)
            : await signIn.mfa.verifyTOTP(value)
      if (result.error) throw result.error
      await continueFromStatus()
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível validar o código de segurança.'))
    }
  }

  async function handleResendCode() {
    if (resendIn > 0) return
    setGeneralError('')
    try {
      const result = step === 'recovery-code'
        ? await signIn.resetPasswordEmailCode.sendCode()
        : mfaStrategy === 'email_code'
          ? await signIn.mfa.sendEmailCode()
          : await signIn.mfa.sendPhoneCode()
      if (result.error) throw result.error
      setResendIn(30)
    } catch (error) {
      setGeneralError(getAuthErrorMessage(error, 'Não foi possível reenviar o código.'))
    }
  }

  async function goBackToStart() {
    await signIn.reset()
    setStep('start')
    setCode('')
    setNewPassword('')
    setGeneralError('')
  }

  if (step === 'recovery-code') {
    return (
      <div>
        <AuthBackButton onClick={() => void goBackToStart()}>Voltar para o login</AuthBackButton>
        <AuthHeading title="Confira seu email" description={`Enviamos um código de recuperação para ${email}.`} />
        <AuthAlert message={generalError} />
        <form onSubmit={handleVerifyRecoveryCode} className="grid gap-5">
          <AuthField id="recovery-code" label="Código de recuperação" value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={8} required error={fieldErrors.code} className="text-center text-base" />
          <AuthSubmitButton loading={loading}>Validar código</AuthSubmitButton>
        </form>
        <CodeResend countdown={resendIn} onResend={handleResendCode} />
      </div>
    )
  }

  if (step === 'new-password') {
    return (
      <div>
        <AuthBackButton onClick={() => void goBackToStart()}>Cancelar recuperação</AuthBackButton>
        <AuthHeading title="Crie uma nova senha" description="Use uma senha forte e diferente das anteriores." />
        <AuthAlert message={generalError} />
        <form onSubmit={handleNewPassword} className="grid gap-5">
          <PasswordField id="new-password" label="Nova senha" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required visible={newPasswordVisible} onToggleVisibility={() => setNewPasswordVisible((value) => !value)} error={fieldErrors.password} />
          <p className="-mt-2 text-xs leading-5 text-[#777]">Use pelo menos 8 caracteres.</p>
          <AuthSubmitButton loading={loading}>Salvar nova senha</AuthSubmitButton>
        </form>
      </div>
    )
  }

  if (step === 'mfa') {
    const description = mfaStrategy === 'totp'
      ? 'Digite o código gerado no seu aplicativo autenticador.'
      : mfaStrategy === 'backup_code'
        ? 'Digite um dos seus códigos de recuperação.'
        : 'Digite o código que enviamos para confirmar que é você.'
    return (
      <div>
        <AuthBackButton onClick={() => void goBackToStart()}>Usar outra conta</AuthBackButton>
        <AuthHeading title="Verificação de segurança" description={description} />
        <AuthAlert message={generalError} />
        <form onSubmit={handleVerifyMfa} className="grid gap-5">
          <AuthField id="mfa-code" label={mfaStrategy === 'backup_code' ? 'Código de recuperação' : 'Código de segurança'} value={code} onChange={(event) => setCode(event.target.value)} inputMode={mfaStrategy === 'backup_code' ? 'text' : 'numeric'} autoComplete="one-time-code" required error={fieldErrors.code} className="text-center text-base" />
          <AuthSubmitButton loading={loading}>Confirmar e entrar</AuthSubmitButton>
        </form>
        {mfaStrategy === 'email_code' || mfaStrategy === 'phone_code' ? <CodeResend countdown={resendIn} onResend={handleResendCode} /> : null}
      </div>
    )
  }

  return (
    <div>
      <AuthHeading title="Bem-vindo de volta" description="Entre para acessar a gestão da sua empresa." />
      <AuthAlert message={generalError} />

      <form onSubmit={handlePasswordSignIn} className="grid gap-5">
        <AuthField id="email" label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="voce@empresa.com.br" required autoFocus error={fieldErrors.email} />
        <PasswordField
          id="password"
          label="Senha"
          labelAction={<button type="button" onClick={() => void handleStartRecovery()} className="text-xs font-medium text-[#555] underline decoration-[#c7c7c7] underline-offset-4 hover:text-[#181818] hover:decoration-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20">Esqueci minha senha</button>}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          visible={passwordVisible}
          onToggleVisibility={() => setPasswordVisible((value) => !value)}
          error={fieldErrors.password}
        />
        <AuthSubmitButton loading={loading}>Entrar</AuthSubmitButton>
      </form>

      <AuthDivider />
      <Button type="button" variant="outline" onClick={() => void handleGoogleSignIn()} disabled={loading} className="h-11 w-full rounded-md border-[#d9d9d9] bg-white text-sm font-medium text-[#292929] shadow-none hover:bg-[#f7f7f7]">
        <SiGoogle size={16} color="default" title="Google" />
        Continuar com Google
      </Button>
    </div>
  )
}

function CodeResend({ countdown, onResend }: { countdown: number; onResend: () => Promise<void> }) {
  return (
    <p className="mt-6 text-center text-sm text-[#777]">
      Não recebeu?{' '}
      <button type="button" onClick={() => void onResend()} disabled={countdown > 0} className="font-medium text-[#181818] underline decoration-[#b9b9b9] underline-offset-4 disabled:cursor-not-allowed disabled:text-[#9a9a9a] disabled:no-underline">
        {countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar código'}
      </button>
    </p>
  )
}
