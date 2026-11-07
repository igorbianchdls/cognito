import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { BadgeCheck, LockKeyhole, Sparkles } from 'lucide-react'
import loginStyles from './AuthLogin.module.css'

// One layout for every access screen: sign-in, sign-up, codes, onboarding and the Google return. The Otto blue
// panel on the left changes its message by step; the form sits on the right. On phones only the form shows.

export type AuthLayoutMode = 'onboarding' | 'sign-in' | 'sign-up' | 'callback'

type AuthLayoutProps = {
  children: ReactNode
  mode: AuthLayoutMode
  /** Replaces the default text under the headline (used by onboarding to show its steps). */
  aside?: ReactNode
}

const copy: Record<AuthLayoutMode, { lines: string[]; text: ReactNode }> = {
  'sign-in': { lines: ['Sua empresa.', 'Mais simples.', 'Com Otto.'], text: <>Vendas, estoque e financeiro em um só lugar.<br />Mais controle para você. Mais tempo para crescer.</> },
  callback: { lines: ['Sua empresa.', 'Mais simples.', 'Com Otto.'], text: <>Vendas, estoque e financeiro em um só lugar.<br />Mais controle para você. Mais tempo para crescer.</> },
  'sign-up': { lines: ['Comece hoje.', 'Organize tudo.', 'Com Otto.'], text: 'Crie sua conta em poucos minutos e tenha vendas, financeiro, notas e estoque trabalhando juntos.' },
  onboarding: { lines: ['Vamos deixar', 'tudo pronto.'], text: 'Três passos rápidos para a Otto ficar com a cara da sua empresa.' },
}

const assurances = [
  { icon: LockKeyhole, text: 'Seus dados protegidos e criptografados' },
  { icon: BadgeCheck, text: 'Feito para pequenas empresas brasileiras' },
  { icon: Sparkles, text: 'Assistente de IA incluso' },
]

export function AuthLayout({ children, mode, aside }: AuthLayoutProps) {
  const { lines, text } = copy[mode]
  const year = new Date().getFullYear()
  return (
    <main className={loginStyles.layout}>
      <aside className={loginStyles.brandPanel}>
        <svg className={loginStyles.pattern} viewBox="0 0 900 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          <defs>
            <filter id="otto-login-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          <g fill="none" stroke="#10176c" strokeWidth="1.5" opacity="0.32">
            {[0, 1, 2, 3, 4, 5].map((line) => (
              <path key={line} d={`M -160 ${470 + line * 108} Q 150 ${235 + line * 85} ${510 + line * 56} ${70 + line * 65} Q ${740 + line * 55} ${650 + line * 85} ${40 + line * 78} 1120`} />
            ))}
          </g>
          <rect width="900" height="1000" filter="url(#otto-login-grain)" opacity="0.055" />
        </svg>
        <Link href="/lp" aria-label="Otto, página inicial" className={loginStyles.brand}>
          <Image src="/logoOttoIcon.svg" alt="" width={46} height={46} priority />
          <span>otto</span>
        </Link>
        <div className={loginStyles.brandCopy}>
          <h1>{lines.map((line) => <span key={line}>{line}</span>)}</h1>
          {aside ?? <p>{text}</p>}
          {mode !== 'onboarding' ? (
            <ul className={loginStyles.assurances}>
              {assurances.map(({ icon: Icon, text: label }) => <li key={label}><Icon aria-hidden="true" />{label}</li>)}
            </ul>
          ) : null}
        </div>
        <p className={loginStyles.brandFooter}>© {year} Otto. Todos os direitos reservados.</p>
      </aside>
      <section className={loginStyles.formPanel} aria-label={mode === 'onboarding' ? 'Configuração da sua empresa' : 'Acesse sua conta Otto'}>
        <div className={loginStyles.topBar}>
          <Link href="/lp" aria-label="Otto, página inicial" className={loginStyles.formBrand}>otto</Link>
          {mode === 'sign-in' ? <p className={loginStyles.topLink}>Novo por aqui? <Link href="/sign-up">Criar conta</Link></p> : null}
          {mode === 'sign-up' ? <p className={loginStyles.topLink}>Já tem conta? <Link href="/sign-in">Entrar</Link></p> : null}
        </div>
        <div className={loginStyles.formContent}>{children}</div>
        <p className={loginStyles.mobileFooter}>© {year} Otto. Todos os direitos reservados.</p>
      </section>
    </main>
  )
}
