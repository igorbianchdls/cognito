'use client'

import { createContext, useContext, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Building2, Check, CircleCheck, LayoutGrid, Package, Plus, ReceiptText, ShoppingBag, Wallet, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { AuthAlert, AuthBackButton, AuthField, AuthHeading, AuthSubmitButton } from '@/products/auth/frontend/components/AuthFormParts'
import loginStyles from '@/products/auth/frontend/components/AuthLogin.module.css'
import {
  ONBOARDING_SEGMENTS,
  ONBOARDING_START_AREAS,
  TEAM_INVITE_LIMIT,
  type OnboardingSegment,
  type OnboardingStartArea,
  type TeamInviteResult,
  type TeamInviteRole,
} from '@/products/auth/shared/onboarding'

// Onboarding in three steps: the company (name and segment), where to start (sets the first page) and, optionally,
// inviting the team. The company is created at the end of step 2, so step 3 can send real invitations.

type Step = 1 | 2 | 3
const STEP_LABELS = ['Sua empresa', 'Por onde começar', 'Sua equipe']

const OnboardingStep = createContext<{ step: Step; setStep: (step: Step) => void } | null>(null)

export function OnboardingProvider({ initialStep, children }: { initialStep: Step; children: ReactNode }) {
  const [step, setStep] = useState<Step>(initialStep)
  return <OnboardingStep.Provider value={{ step, setStep }}>{children}</OnboardingStep.Provider>
}

function useStep() {
  const value = useContext(OnboardingStep)
  if (!value) throw new Error('OnboardingProvider ausente.')
  return value
}

/** The three steps on the blue panel, with the current one lit and finished ones checked. */
export function OnboardingSteps() {
  const { step } = useStep()
  return (
    <ol className={loginStyles.steps}>
      {STEP_LABELS.map((label, i) => {
        const n = (i + 1) as Step
        const state = n < step ? 'done' : n === step ? 'current' : 'next'
        return <li key={label} data-state={state} aria-current={state === 'current' ? 'step' : undefined}><span>{state === 'done' ? <Check size={16} strokeWidth={3} /> : n}</span>{label}</li>
      })}
    </ol>
  )
}

function Progress({ step }: { step: Step }) {
  return (
    <div className="mb-8" aria-hidden="true">
      <div className="mb-2 flex justify-between text-xs font-medium text-[#6b7389]"><span>Passo {step} de 3</span><span>{STEP_LABELS[step - 1]}</span></div>
      <div className="grid grid-cols-3 gap-1.5">{[1, 2, 3].map((n) => <span key={n} className={cn('h-1.5 rounded-full transition-colors', n <= step ? 'bg-[#104dff]' : 'bg-[#e6e9f1]')} />)}</div>
    </div>
  )
}

const areaIcons: Record<OnboardingStartArea, typeof ShoppingBag> = { vendas: ShoppingBag, financeiro: Wallet, notas: ReceiptText, estoque: Package, geral: LayoutGrid }

export function OnboardingWizard({ email, defaultCompanyName = '', companyName: existingCompany, startHref: initialStartHref = '/erp' }: {
  email: string
  defaultCompanyName?: string
  /** Set when the company already exists and only the team step is left. */
  companyName?: string
  startHref?: string
}) {
  const router = useRouter()
  const { step, setStep } = useStep()
  const [companyName, setCompanyName] = useState(existingCompany ?? defaultCompanyName)
  const [segment, setSegment] = useState<OnboardingSegment | ''>('')
  const [startArea, setStartArea] = useState<OnboardingStartArea>('vendas')
  const [startHref, setStartHref] = useState(initialStartHref)
  const [invites, setInvites] = useState<Array<{ email: string; role: TeamInviteRole }>>([{ email: '', role: 'member' }])
  const [results, setResults] = useState<TeamInviteResult[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const goToApp = (href = startHref) => {
    setLeaving(true)
    router.replace(href)
    router.refresh()
  }

  function submitCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (companyName.trim().length < 2) return setError('Informe o nome da empresa.')
    if (!segment) return setError('Escolha o segmento que mais combina com sua empresa.')
    setStep(2)
  }

  async function createCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, segment, startArea }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) throw new Error(String(payload?.error || 'Não foi possível criar sua empresa. Tente novamente.'))
      setStartHref(String(payload.startHref || '/erp'))
      // Keeps the team step if the page is reloaded.
      window.history.replaceState(null, '', '/onboarding?etapa=equipe')
      setStep(3)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível criar sua empresa.')
    } finally {
      setBusy(false)
    }
  }

  async function sendInvites(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const list = invites.filter((invite) => invite.email.trim())
    if (!list.length) return setError('Informe pelo menos um e-mail, ou pule esta etapa.')
    setBusy(true)
    try {
      const response = await fetch('/api/auth/convites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invites: list }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) throw new Error(String(payload?.error || 'Não foi possível enviar os convites.'))
      setResults(payload.results as TeamInviteResult[])
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível enviar os convites.')
    } finally {
      setBusy(false)
    }
  }

  if (step === 1) {
    return (
      <form onSubmit={submitCompany}>
        <Progress step={1} />
        <AuthHeading title="Conte sobre sua empresa" description="O nome aparece para sua equipe dentro da Otto. Você pode mudar depois." />
        <AuthAlert message={error} />
        <div className="grid gap-7">
          <AuthField id="company" label="Nome da empresa" value={companyName} onChange={(event) => setCompanyName(event.target.value)} autoComplete="organization" minLength={2} maxLength={120} required autoFocus placeholder="Ex.: Padaria Bom Dia" hint={<>Conta vinculada a <b className="font-semibold text-[#111832]">{email}</b></>} />
          <fieldset>
            <legend className="mb-3 text-[13px] font-medium text-[#151c35]">Qual é o segmento?</legend>
            <div className="grid grid-cols-2 gap-2.5" role="radiogroup">
              {ONBOARDING_SEGMENTS.map((item) => {
                const on = segment === item.id
                return (
                  <button key={item.id} type="button" role="radio" aria-checked={on} onClick={() => setSegment(item.id)}
                    className={cn('flex min-h-12 items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104dff]/30',
                      on ? 'border-[#104dff] bg-[#f2f5ff] text-[#0f2a99]' : 'border-[#d3d8e5] bg-white text-[#151c35] hover:border-[#aab2c5]')}>
                    {item.label}
                    {on ? <CircleCheck className="h-4 w-4 shrink-0 text-[#104dff]" aria-hidden="true" /> : null}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <AuthSubmitButton loading={false} className="h-[54px] text-base">Continuar <ArrowRight className="h-4 w-4" aria-hidden="true" /></AuthSubmitButton>
        </div>
      </form>
    )
  }

  if (step === 2) {
    return (
      <form onSubmit={createCompany}>
        <AuthBackButton onClick={() => { setError(''); setStep(1) }}>Voltar</AuthBackButton>
        <Progress step={2} />
        <AuthHeading title="Por onde quer começar?" description="Abrimos a Otto direto nessa área. Todas as outras continuam a um clique." />
        <AuthAlert message={error} />
        <div className="grid gap-2.5" role="radiogroup" aria-label="Área inicial">
          {ONBOARDING_START_AREAS.map((area) => {
            const Icon = areaIcons[area.id]
            const on = startArea === area.id
            return (
              <button key={area.id} type="button" role="radio" aria-checked={on} onClick={() => setStartArea(area.id)}
                className={cn('flex items-center gap-3.5 rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104dff]/30',
                  on ? 'border-[#104dff] bg-[#f2f5ff]' : 'border-[#d3d8e5] bg-white hover:border-[#aab2c5]')}>
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', on ? 'bg-[#104dff] text-white' : 'bg-[#f1f3f8] text-[#4a5470]')}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-[#111832]">{area.label}</span>
                  <span className="block text-[13px] text-[#6b7389]">{area.description}</span>
                </span>
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', on ? 'border-[#104dff] bg-[#104dff]' : 'border-[#c5cbd9]')}>{on ? <span className="h-2 w-2 rounded-full bg-white" /> : null}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-7"><AuthSubmitButton loading={busy} className="h-[54px] text-base"><Building2 className="h-4 w-4" aria-hidden="true" />Criar minha empresa</AuthSubmitButton></div>
      </form>
    )
  }

  // Step 3: invite the team (optional).
  const sent = results?.filter((r) => r.ok).length ?? 0
  if (results) {
    return (
      <div>
        <Progress step={3} />
        <AuthHeading title={sent ? 'Convites enviados' : 'Nenhum convite enviado'} description={sent ? 'Cada pessoa recebe um e-mail para criar a senha e entrar na equipe.' : 'Confira os e-mails abaixo. Você também pode convidar depois, em Configurações → Membros.'} />
        <ul className="mb-7 grid gap-2">
          {results.map((r) => (
            <li key={r.email} className="flex items-center justify-between gap-3 rounded-lg border border-[#e6e9f1] px-3.5 py-2.5 text-sm">
              <span className="min-w-0 truncate text-[#111832]">{r.email}</span>
              {r.ok ? <span className="flex shrink-0 items-center gap-1.5 font-medium text-[#1f7a4a]"><CircleCheck className="h-4 w-4" aria-hidden="true" />Enviado</span> : <span className="shrink-0 text-[#b42318]">{r.error}</span>}
            </li>
          ))}
        </ul>
        <AuthSubmitButtonLink loading={leaving} onClick={() => goToApp()}>Ir para a Otto</AuthSubmitButtonLink>
      </div>
    )
  }

  return (
    <form onSubmit={sendInvites}>
      <Progress step={3} />
      <AuthHeading eyebrow={existingCompany ?? companyName} title="Convide sua equipe" description="Quem você convidar recebe um e-mail para entrar. Esta etapa é opcional." />
      <AuthAlert message={error} />
      <div className="grid gap-2.5">
        {invites.map((invite, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="email" value={invite.email} placeholder="nome@empresa.com.br" aria-label={`E-mail da pessoa ${i + 1}`} autoFocus={i === 0}
              onChange={(event) => setInvites((list) => list.map((item, j) => (j === i ? { ...item, email: event.target.value } : item)))}
              className="h-12 min-w-0 flex-1 rounded-md border border-[#d3d8e5] bg-white px-3.5 text-[15px] text-[#111832] outline-none placeholder:text-[#8d95a9] focus:border-[#104dff] focus:shadow-[0_0_0_3px_rgb(16_77_255_/_0.14)]" />
            <select value={invite.role} aria-label={`Permissão da pessoa ${i + 1}`}
              onChange={(event) => setInvites((list) => list.map((item, j) => (j === i ? { ...item, role: event.target.value as TeamInviteRole } : item)))}
              className="h-12 w-[124px] rounded-md border border-[#d3d8e5] bg-white px-2.5 text-sm text-[#111832] outline-none focus:border-[#104dff]">
              <option value="member">Membro</option>
              <option value="admin">Administrador</option>
            </select>
            {invites.length > 1 ? (
              <button type="button" aria-label={`Remover pessoa ${i + 1}`} onClick={() => setInvites((list) => list.filter((_, j) => j !== i))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[#818aa0] hover:bg-[#f1f3f8] hover:text-[#111832]"><X className="h-4 w-4" /></button>
            ) : null}
          </div>
        ))}
      </div>
      {invites.length < TEAM_INVITE_LIMIT ? (
        <button type="button" onClick={() => setInvites((list) => [...list, { email: '', role: 'member' }])}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-[#104dff] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104dff]/30">
          <Plus className="h-4 w-4" aria-hidden="true" />Adicionar pessoa
        </button>
      ) : null}
      <p className="mt-4 text-xs leading-5 text-[#6b7389]"><b className="font-semibold text-[#111832]">Administrador</b> pode convidar pessoas e mudar configurações. <b className="font-semibold text-[#111832]">Membro</b> usa o dia a dia da Otto.</p>
      <div className="mt-7 grid gap-3">
        <AuthSubmitButton loading={busy} className="h-[54px] text-base">Enviar convites</AuthSubmitButton>
        <button type="button" onClick={() => goToApp()} disabled={leaving}
          className="h-11 rounded-md text-sm font-semibold text-[#4a5470] hover:bg-[#f1f3f8] hover:text-[#111832] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104dff]/30">
          {leaving ? 'Abrindo a Otto…' : 'Pular por agora'}
        </button>
      </div>
    </form>
  )
}

function AuthSubmitButtonLink({ children, loading, onClick }: { children: ReactNode; loading: boolean; onClick: () => void }) {
  return <form onSubmit={(event) => { event.preventDefault(); onClick() }}><AuthSubmitButton loading={loading} className="h-[54px] text-base">{children}<ArrowRight className="h-4 w-4" aria-hidden="true" /></AuthSubmitButton></form>
}
