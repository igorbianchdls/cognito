import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { authFonts } from './authFonts'
import loginStyles from './AuthLogin.module.css'

// One layout for every access screen: sign-in, sign-up, codes, onboarding and the Google return. The gray panel on
// the left carries the serif headline and changes its message by step; the form sits on white on the right.
// On phones only the form shows.

export type AuthLayoutMode = 'onboarding' | 'sign-in' | 'sign-up' | 'callback'

type AuthLayoutProps = {
  children: ReactNode
  mode: AuthLayoutMode
  /** Replaces the default text under the headline (used by onboarding to show its steps). */
  aside?: ReactNode
}

const copy: Record<AuthLayoutMode, { lines: ReactNode[]; text: ReactNode }> = {
  'sign-in': { lines: ['Sua empresa', <>no <em>automático.</em></>], text: 'A Otto cuida das tarefas repetitivas para você focar no que faz a empresa crescer.' },
  callback: { lines: ['Sua empresa', <>no <em>automático.</em></>], text: 'A Otto cuida das tarefas repetitivas para você focar no que faz a empresa crescer.' },
  'sign-up': { lines: ['Sua empresa', <>no <em>automático.</em></>], text: 'Crie sua conta em poucos minutos e deixe a Otto cuidar das tarefas repetitivas.' },
  onboarding: { lines: ['Vamos deixar', <>tudo <em>pronto.</em></>], text: 'Três passos rápidos para a Otto ficar com a cara da sua empresa.' },
}

const assurances = ['Seus dados protegidos', 'Feito para pequenas empresas brasileiras', 'Funciona também no ChatGPT e no Claude']

export function AuthLayout({ children, mode, aside }: AuthLayoutProps) {
  const { lines, text } = copy[mode]
  const year = new Date().getFullYear()
  return (
    <main className={`${loginStyles.layout} otto-auth ${authFonts}`}>
      <aside className={loginStyles.brandPanel}>
        <Link href="/lp" aria-label="Otto, página inicial" className={loginStyles.brand}>
          <Image src="/logoOttoIcon.svg" alt="" width={22} height={22} priority />
          <span>otto</span>
        </Link>
        <div className={loginStyles.brandCopy}>
          <h1>{lines.map((line, i) => <span key={i}>{line}</span>)}</h1>
          {aside ?? <p>{text}</p>}
          {mode !== 'onboarding' ? (
            <ul className={loginStyles.assurances}>
              {assurances.map((label) => <li key={label}>{label}</li>)}
            </ul>
          ) : null}
        </div>
        <p className={loginStyles.brandFooter}>© {year} Otto</p>
      </aside>
      <section className={loginStyles.formPanel} aria-label={mode === 'onboarding' ? 'Configuração da sua empresa' : 'Acesse sua conta Otto'}>
        <div className={loginStyles.topBar}>
          <Link href="/lp" aria-label="Otto, página inicial" className={loginStyles.formBrand}><Image src="/logoOttoIcon.svg" alt="" width={20} height={20} /><span>otto</span></Link>
          {mode === 'sign-in' ? <p className={loginStyles.topLink}>Novo por aqui? <Link href="/sign-up">Criar conta</Link></p> : null}
          {mode === 'sign-up' ? <p className={loginStyles.topLink}>Já tem conta? <Link href="/sign-in">Entrar</Link></p> : null}
        </div>
        <div className={loginStyles.formContent}>{children}</div>
        <p className={loginStyles.mobileFooter}>© {year} Otto. Todos os direitos reservados.</p>
      </section>
    </main>
  )
}
