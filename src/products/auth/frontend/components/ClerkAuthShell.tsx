import type { ReactNode } from 'react'
import { BadgeCheck, Building2, LockKeyhole, Sparkles } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

type ClerkAuthShellProps = {
  children: ReactNode
  mode: 'sign-in' | 'sign-up'
}

export const clerkAuthAppearance = {
  variables: {
    borderRadius: '0.75rem',
    colorBackground: '#ffffff',
    colorDanger: '#dc2626',
    colorInputBackground: '#ffffff',
    colorInputText: '#0f172a',
    colorPrimary: '#0f172a',
    colorText: '#0f172a',
    colorTextSecondary: '#64748b',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    fontSize: '14px',
  },
  elements: {
    alert: 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700',
    badge: 'rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500',
    card: 'w-full border-0 bg-transparent p-0 shadow-none',
    cardBox: 'w-full border-0 bg-transparent p-0 shadow-none',
    dividerLine: 'bg-slate-200',
    dividerText: 'px-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400',
    footer: 'bg-transparent px-0 pb-0 pt-2',
    footerAction: 'justify-center gap-1 text-sm',
    footerActionLink: 'font-semibold text-slate-950 underline-offset-4 hover:text-slate-700 hover:underline',
    footerActionText: 'text-slate-500',
    form: 'grid gap-4',
    formButtonPrimary:
      'h-11 rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-sm shadow-slate-900/10 transition hover:bg-slate-800 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
    formFieldInput:
      'h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm shadow-slate-100 outline-none placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200/80',
    formFieldLabel: 'text-sm font-semibold text-slate-800',
    formFieldRow: 'gap-2.5',
    formFieldSuccessText: 'text-emerald-700',
    formFieldWarningText: 'text-amber-700',
    formHeader: 'hidden',
    formFieldErrorText: 'text-xs font-medium text-red-600',
    header: 'hidden',
    headerSubtitle: 'hidden',
    headerTitle: 'hidden',
    identityPreview: 'rounded-xl border border-slate-200 bg-slate-50 shadow-none',
    identityPreviewText: 'text-slate-700',
    main: 'gap-5 p-0',
    otpCodeFieldInput: 'rounded-lg border border-slate-300 text-slate-950',
    rootBox: 'w-full',
    socialButtons: 'grid gap-2',
    socialButtonsBlockButton:
      'h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-sm shadow-slate-100 transition hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-slate-200/80',
    socialButtonsBlockButtonText: 'text-sm font-semibold text-slate-900',
    socialButtonsProviderIcon: 'h-4 w-4',
  },
}

export const clerkPtBrLocalization = {
  formButtonPrimary: 'Continuar',
  dividerText: 'ou',
  footerActionLink__signIn: 'Entrar',
  footerActionLink__signUp: 'Criar conta',
  footerActionText__signIn: 'Já tem uma conta?',
  footerActionText__signUp: 'Ainda não tem conta?',
  formFieldLabel__emailAddress: 'Email',
  formFieldLabel__identifier: 'Email',
  formFieldLabel__password: 'Senha',
  formFieldLabel__username: 'Usuário',
  formFieldInputPlaceholder__emailAddress: 'Digite seu email',
  formFieldInputPlaceholder__identifier: 'Digite seu email',
  formFieldInputPlaceholder__password: 'Digite sua senha',
  formFieldInputPlaceholder__username: 'Digite seu usuário',
  signIn: {
    start: {
      actionLink: 'Criar conta',
      actionText: 'Ainda não tem conta?',
      subtitle: 'Acesse sua empresa para continuar.',
      title: 'Entrar no Cognito',
    },
  },
  signUp: {
    start: {
      actionLink: 'Entrar',
      actionText: 'Já tem uma conta?',
      subtitle: 'Crie seu acesso e depois cadastre sua empresa.',
      title: 'Criar conta',
    },
  },
  socialButtonsBlockButton: 'Continuar com {{provider|titleize}}',
} as const

export const clerkUserProfileAppearance = {
  variables: {
    ...clerkAuthAppearance.variables,
    borderRadius: '0.375rem',
    colorNeutral: '#64748b',
    colorPrimary: '#0f172a',
  },
  elements: {
    ...clerkAuthAppearance.elements,
    accordionTriggerButton: 'rounded-md px-0 py-3 text-sm font-medium text-slate-950 hover:bg-transparent',
    badge: 'rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600',
    breadcrumbLink: 'text-sm font-medium text-slate-500 hover:text-slate-950',
    breadcrumbLinkText: 'text-sm font-medium',
    card: 'w-full border-0 bg-transparent p-0 shadow-none',
    cardBox: 'w-full border-0 bg-transparent p-0 shadow-none',
    form: 'grid gap-4',
    formButtonPrimary: 'h-9 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white shadow-none hover:bg-slate-800 focus:ring-2 focus:ring-slate-300 focus:ring-offset-2',
    formButtonReset: 'h-9 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100',
    formFieldInput: 'h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-none outline-none placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200',
    formFieldLabel: 'text-sm font-medium text-slate-900',
    formFieldRow: 'gap-2',
    formFieldSuccessText: 'text-xs font-medium text-emerald-700',
    formFieldWarningText: 'text-xs font-medium text-amber-700',
    formHeader: 'hidden',
    header: 'hidden',
    headerSubtitle: 'hidden',
    headerTitle: 'hidden',
    main: 'gap-0',
    navbar: 'hidden',
    navbarMobileMenuButton: 'hidden',
    page: 'w-full p-0',
    pageScrollBox: 'p-0',
    profileSection: 'border-b border-slate-200 py-5 first:pt-0 last:border-b-0 last:pb-0',
    profileSectionContent: 'grid gap-3',
    profileSectionItem: 'rounded-md border-0 px-0 py-2',
    profileSectionItemList: 'grid gap-1',
    profileSectionPrimaryButton: 'h-9 rounded-md px-3 text-sm font-medium text-slate-950 hover:bg-slate-100',
    profileSectionTitle: 'text-sm font-semibold text-slate-950',
    profileSectionTitleText: 'text-sm font-semibold text-slate-950',
    profileSectionContent__activeDevices: 'grid gap-2',
    rootBox: 'w-full',
    scrollBox: 'p-0',
    userPreview: 'rounded-md border border-slate-200 bg-slate-50 px-3 py-2',
    userPreviewMainIdentifier: 'text-sm font-medium text-slate-950',
    userPreviewSecondaryIdentifier: 'text-xs text-slate-500',
  },
}

export function ClerkAuthShell({ children, mode }: ClerkAuthShellProps) {
  const isSignUp = mode === 'sign-up'
  const benefits = [
    'Dashboards automáticos com dados reais',
    'Integrações com ERP, CRM e marketing',
    'Ambiente seguro para sua empresa',
  ]

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,#f8fafc_0,#eef2f7_44%,#e8eef6_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
        <section className="hidden max-w-xl lg:grid lg:gap-8">
          <div className="grid gap-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
              <Sparkles className="h-5 w-5 text-slate-950" />
            </div>
            <div className="grid gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Cognito</p>
              <h1 className="max-w-lg text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950">
                {isSignUp ? 'Crie sua conta e organize os dados da empresa.' : 'Entre no Cognito e acompanhe sua operação.'}
              </h1>
              <p className="max-w-md text-base leading-7 text-slate-600">
                {isSignUp
                  ? 'Depois do cadastro, você informa os dados da empresa e conecta as primeiras integrações.'
                  : 'Conecte suas ferramentas e acompanhe os dados da sua empresa em um só lugar.'}
              </p>
            </div>
          </div>

          <div className="grid max-w-md gap-3">
            {benefits.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/70 backdrop-blur">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-[460px] rounded-2xl border border-white/80 bg-white/95 py-0 shadow-2xl shadow-slate-300/50 backdrop-blur">
          <CardContent className="grid gap-6 px-6 py-7 sm:px-8 sm:py-8">
            <div className="grid gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                {isSignUp ? <Building2 className="h-5 w-5 text-slate-800" /> : <LockKeyhole className="h-5 w-5 text-slate-800" />}
              </div>
              <div className="grid gap-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {isSignUp ? 'Criar conta' : 'Entrar no Cognito'}
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  {isSignUp ? 'Crie seu acesso e depois cadastre sua empresa.' : 'Acesse sua empresa para continuar.'}
                </p>
              </div>
            </div>

            <div className="[&_.cl-card]:!bg-transparent [&_.cl-card]:!shadow-none [&_.cl-card]:!border-0 [&_.cl-cardBox]:!bg-transparent [&_.cl-cardBox]:!shadow-none [&_.cl-cardBox]:!border-0 [&_.cl-footer]:!bg-transparent [&_.cl-footer]:!p-0 [&_.cl-main]:!p-0">
              {children}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
