import type { ReactNode } from 'react'
import { ArrowRight, BadgeCheck, LockKeyhole, Sparkles } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

type ClerkAuthShellProps = {
  children: ReactNode
  mode: 'sign-in' | 'sign-up'
}

export const clerkAuthAppearance = {
  variables: {
    borderRadius: '0.5rem',
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
    alert: 'rounded-md border border-red-200 bg-red-50 text-red-700',
    card: 'w-full border-0 bg-transparent p-0 shadow-none',
    cardBox: 'w-full border-0 bg-transparent shadow-none',
    dividerLine: 'bg-slate-200',
    dividerText: 'text-slate-500 text-xs font-medium',
    footer: 'bg-transparent p-0',
    footerActionLink: 'font-semibold text-slate-950 hover:text-slate-700',
    footerActionText: 'text-slate-500',
    formButtonPrimary: 'h-10 rounded-md bg-slate-950 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
    formFieldInput: 'h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200',
    formFieldLabel: 'text-sm font-medium text-slate-800',
    formFieldRow: 'gap-2',
    formFieldSuccessText: 'text-emerald-700',
    formFieldWarningText: 'text-amber-700',
    formHeader: 'hidden',
    formFieldErrorText: 'text-xs font-medium text-red-600',
    header: 'hidden',
    headerSubtitle: 'hidden',
    headerTitle: 'hidden',
    identityPreview: 'rounded-md border border-slate-200 bg-slate-50',
    identityPreviewText: 'text-slate-700',
    main: 'gap-5',
    otpCodeFieldInput: 'rounded-md border border-slate-300 text-slate-950',
    rootBox: 'w-full',
    socialButtonsBlockButton: 'h-10 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50',
    socialButtonsBlockButtonText: 'text-sm font-medium text-slate-900',
  },
}

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

  return (
    <main className="min-h-dvh bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
        <section className="hidden max-w-xl lg:grid lg:gap-8">
          <div className="grid gap-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm">
              <Sparkles className="h-5 w-5 text-slate-950" />
            </div>
            <div className="grid gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Cognito</p>
              <h1 className="max-w-lg text-4xl font-semibold leading-[1.05] tracking-tight text-slate-950">
                {isSignUp ? 'Crie seu workspace operacional.' : 'Entre no seu workspace Cognito.'}
              </h1>
              <p className="max-w-md text-base leading-7 text-slate-600">
                {isSignUp
                  ? 'Conecte dados, ferramentas e fluxos de trabalho em um ambiente seguro para sua equipe.'
                  : 'Acesse dashboards, integrações e automações com a mesma conta usada no seu workspace.'}
              </p>
            </div>
          </div>

          <div className="grid max-w-md gap-3">
            {[
              'Autenticação e sessão gerenciadas pelo Clerk',
              'Onboarding preservado após login ou cadastro',
              'Acesso protegido por tenant e permissões',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-[460px] rounded-lg border-slate-200 bg-white py-0 shadow-xl shadow-slate-200/70">
          <CardContent className="grid gap-6 px-6 py-7 sm:px-8 sm:py-8">
            <div className="grid gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                <LockKeyhole className="h-5 w-5 text-slate-800" />
              </div>
              <div className="grid gap-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {isSignUp ? 'Criar conta' : 'Entrar'}
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  {isSignUp ? 'Cadastre-se para continuar para o onboarding.' : 'Use sua conta para continuar para o workspace.'}
                </p>
              </div>
            </div>

            {children}

            <div className="flex items-center gap-2 border-t border-slate-200 pt-5 text-xs font-medium text-slate-500">
              <ArrowRight className="h-3.5 w-3.5" />
              Redirecionamento mantido para onboarding.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
