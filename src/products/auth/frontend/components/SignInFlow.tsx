'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useAuth, useSignIn } from '@clerk/nextjs'

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

const submitClassName = 'h-[54px] text-base'
/** The last email that signed in on this device, so returning users only type the password. */
const LAST_EMAIL_KEY = 'otto:last-email'
const readLastEmail = () => { try { return window.localStorage.getItem(LAST_EMAIL_KEY) || '' } catch { return '' } }
const saveLastEmail = (value: string) => { try { window.localStorage.setItem(LAST_EMAIL_KEY, value) } catch { /* private mode */ } }
const inviteTicket = () => { try { return new URLSearchParams(window.location.search).get('__clerk_ticket') || '' } catch { return '' } }

type SignInStep = 'start' | 'recovery-code' | 'new-password' | 'mfa'
type MfaStrategy = 'email_code' | 'phone_code' | 'totp' | 'backup_code'

export function SignInFlow() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { signIn, errors, fetchStatus } = useSignIn()
  const [step, setStep] = useState<SignInStep>('start')
  const [email, setEmail] = useState(readLastEmail)
  const [rememberedEmail] = useState(() => Boolean(readLastEmail()))
  const [redirecting, setRedirecting] = useState(false)
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

  // Arriving from an invitation link, or back from Google with a second factor to confirm: continue right away.
  const resumed = useRef(false)
  useEffect(() => {
    if (resumed.current) return
    resumed.current = true
    const ticket = inviteTicket()
    const run = async () => {
      try {
        if (ticket) {
          setRedirecting(true)
          const result = await signIn.ticket({ ticket })
          if (result.error) throw result.error
          await continueFromStatus()
        } else if (signIn.status === 'needs_second_factor') {
          await prepareMfa()
        }
      } catch (error) {
        setRedirecting(false)
        setGeneralError(getAuthErrorMessage(error, 'Não foi possível abrir o convite. Entre com seu e-mail e senha.'))
      }
    }
    void run()
    // Runs once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [resendIn])

  async function finishSignIn() {
    const result = await signIn.finalize()
    if (result.error) throw result.error
    if (email.trim()) saveLastEmail(email.trim())
    setRedirecting(true)
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
      setRedirecting(true)
      const result = await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectCallbackUrl: '/onboarding',
      })
      if (result.error) throw result.error
    } catch (error) {
      setRedirecting(false)
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
        <AuthHeading title="Confira seu e-mail" description={<>Enviamos um código de 6 dígitos para <b className="font-semibold text-[#111832]">{email}</b>.</>} />
        <AuthAlert message={generalError} />
        <form onSubmit={handleVerifyRecoveryCode} className="grid gap-5">
          <OtpInput label="Código de recuperação" value={code} onChange={setCode} error={fieldErrors.code} autoFocus />
          <AuthSubmitButton loading={loading} disabled={code.length < 6} className={submitClassName}>Validar código</AuthSubmitButton>
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
          <PasswordField id="new-password" label="Nova senha" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required autoFocus visible={newPasswordVisible} onToggleVisibility={() => setNewPasswordVisible((value) => !value)} error={fieldErrors.password} hint={<PasswordStrength password={newPassword} />} />
          <AuthSubmitButton loading={loading} className={submitClassName}>Salvar nova senha</AuthSubmitButton>
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
          {mfaStrategy === 'backup_code'
            ? <AuthField id="mfa-code" label="Código de recuperação" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" required autoFocus error={fieldErrors.code} className="text-center text-base" />
            : <OtpInput label="Código de segurança" value={code} onChange={setCode} error={fieldErrors.code} autoFocus />}
          <AuthSubmitButton loading={loading} className={submitClassName}>Confirmar e entrar</AuthSubmitButton>
        </form>
        {mfaStrategy === 'email_code' || mfaStrategy === 'phone_code' ? <CodeResend countdown={resendIn} onResend={handleResendCode} /> : null}
      </div>
    )
  }

  if (redirecting && !generalError) return <AuthTransition />

  return (
    <div>
      <AuthHeading title={rememberedEmail ? 'Bem-vindo de volta' : 'Entrar na Otto'} description="Acesse sua conta para continuar." />
      <AuthAlert message={generalError} />

      <AuthGoogleButton onClick={() => void handleGoogleSignIn()} disabled={loading} />
      <AuthDivider>ou entre com e-mail</AuthDivider>

      <form onSubmit={handlePasswordSignIn} className={styles.form}>
        <AuthField id="email" label="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="voce@empresa.com.br" required autoFocus={!rememberedEmail} error={fieldErrors.email} />
        <PasswordField
          id="password"
          label="Senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          autoFocus={rememberedEmail}
          visible={passwordVisible}
          onToggleVisibility={() => setPasswordVisible((value) => !value)}
          error={fieldErrors.password}
          labelAction={<button type="button" className={styles.inlineLink} onClick={() => void handleStartRecovery()} disabled={loading}>Esqueceu a senha?</button>}
        />
        <AuthSubmitButton loading={loading} className={submitClassName}>Entrar</AuthSubmitButton>
      </form>
    </div>
  )
}
