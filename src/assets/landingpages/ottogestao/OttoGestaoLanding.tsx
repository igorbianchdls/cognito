import { Plus_Jakarta_Sans } from 'next/font/google'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  IconArrowsExchange, IconBellRinging, IconBrandOpenai, IconBuildingBank, IconCash, IconChartBar, IconCheck,
  IconChevronsRight, IconFileImport, IconFileInvoice, IconHistory, IconLock, IconPlugConnected, IconReceipt,
  IconReportMoney, IconShieldLock, IconShoppingCart, IconTags, IconTruck, IconUserPlus, IconUsers,
} from '@tabler/icons-react'
import { CircledWord } from '../ottocut/DrawOnView'
import { TypedAssistant } from '../ottocut/TypedAssistant'
import { OttoLogo } from '../ottocut/OttoLogo'
import base from '../ottocut/OttoCutLanding.module.css'
import styles from './OttoGestaoLanding.module.css'

// OttoGestão: sales page for the ERP that automates a small company's finances, run from the web app or from
// ChatGPT and Claude. Same visual language as the OttoCut page. Plans, prices and FAQ come from the Otto product.

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const SIGN_UP = '/sign-up'
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function Logo() {
  return <OttoLogo />
}

function Cta({ children, small, href = SIGN_UP }: { children: ReactNode; small?: boolean; href?: string }) {
  return <Link className={small ? base.ctaSmall : base.cta} href={href}>{children}{!small && <IconChevronsRight size={22} stroke={2} />}</Link>
}

function Laurel({ flip }: { flip?: boolean }) {
  const leaves = [0.12, 0.3, 0.48, 0.66, 0.84].map(t => ({ x: 13 - Math.sin(t * Math.PI) * 6 - t * 2, y: 44 - t * 38, a: -40 + t * 60 }))
  return <svg className={base.laurel} style={flip ? { transform: 'scaleX(-1)' } : undefined} width="20" height="46" viewBox="0 0 20 46" fill="none">
    <path d="M14 45 C5 36 4 20 9 5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    {leaves.map((l, i) => <g key={i}>
      <ellipse cx={l.x - 3.2} cy={l.y} rx="3.6" ry="1.5" fill="#fff" transform={`rotate(${l.a} ${l.x - 3.2} ${l.y})`} />
      <ellipse cx={l.x + 2.6} cy={l.y - 2.4} rx="3.2" ry="1.3" fill="#fff" transform={`rotate(${-l.a - 30} ${l.x + 2.6} ${l.y - 2.4})`} />
    </g>)}
  </svg>
}

function Badge({ top, bottom }: { top: string; bottom: string }) {
  return <div className={base.badge}><Laurel /><span><small>{top}</small><b>{bottom}</b></span><Laurel flip /></div>
}

const MODULES = [
  { Icon: IconReceipt, label: 'Contas a pagar', bg: '#6a35ff' },
  { Icon: IconCash, label: 'Contas a receber', bg: '#3ddc84' },
  { Icon: IconArrowsExchange, label: 'Conciliação', bg: '#4f8cff' },
  { Icon: IconTags, label: 'Classificação de despesas', bg: '#e23aa7' },
  { Icon: IconChartBar, label: 'DRE e relatórios', bg: '#ff8a3d' },
  { Icon: IconBuildingBank, label: 'Contas financeiras', bg: '#0ea5e9' },
  { Icon: IconShoppingCart, label: 'Vendas', bg: '#8f5bff' },
  { Icon: IconTruck, label: 'Compras', bg: '#14b8a6' },
  { Icon: IconFileInvoice, label: 'Documentos fiscais', bg: '#f59e0b' },
  { Icon: IconUsers, label: 'Cadastros', bg: '#64748b' },
  { Icon: IconBellRinging, label: 'Cobranças e lembretes', bg: '#ef4444' },
  { Icon: IconLock, label: 'Permissões', bg: '#111' },
]

const VIA = [
  {
    title: 'Via ChatGPT', video: '/ottogestao/chatgpt-demo.mp4', poster: '/ottogestao/chatgpt-demo-poster.jpg',
    bg: 'linear-gradient(160deg, #8b2cf5 0%, #6a16d8 55%, #4c0fa3 100%)',
    icon: <IconBrandOpenai size={44} stroke={1.5} />,
    text: 'Peça no seu ChatGPT: “classifica as despesas de novembro” ou “quanto tenho a receber esta semana?”. A Otto responde com os dados da sua empresa.',
  },
  {
    title: 'Via Claude', video: '/ottogestao/claude-demo.mp4', poster: '/ottogestao/claude-demo-poster.jpg',
    bg: 'linear-gradient(160deg, #b62aa8 0%, #8c1a84 55%, #5e0f5a 100%)',
    // eslint-disable-next-line @next/next/no-img-element
    icon: <span className={base.viaClaude}><img src="/claudeLogo.svg" alt="" /></span>,
    text: 'Conecte a Otto ao Claude e faça o fechamento do mês conversando: contas, conciliação, classificação e DRE.',
  },
]

const WHO = [
  {
    title: 'Pequenas empresas',
    text: 'Organize vendas, compras e financeiro sem implantar um sistema complexo e sem depender de planilhas.',
    doodle: <svg className={base.doodle} viewBox="0 0 120 120" fill="none" stroke="#f472d0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 50 C 16 74, 18 94, 20 110 C 48 112, 74 111, 102 109 C 102 90, 101 70, 102 50" />
      <path d="M10 52 C 22 40, 30 30, 36 18 C 56 17, 76 17, 92 18 C 98 30, 104 40, 112 52 C 92 54, 34 54, 10 52 Z" />
      <path d="M48 110 C 48 96, 48 86, 50 76 C 58 74, 64 75, 72 76 C 72 88, 72 100, 72 110" />
    </svg>,
  },
  {
    title: 'Prestadores de serviço',
    text: 'Contratos, cobranças e contas a receber no lugar certo, com lembretes automáticos para ninguém esquecer de pagar.',
    doodle: <svg className={base.doodle} viewBox="0 0 120 120" fill="none" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 44 C 14 64, 16 86, 18 104 C 48 106, 76 105, 106 103 C 106 84, 105 64, 106 44 C 76 42, 44 42, 14 44 Z" />
      <path d="M42 42 C 42 30, 46 22, 60 22 C 74 22, 78 30, 78 42" />
      <path d="M16 66 C 46 72, 76 72, 104 64" />
    </svg>,
  },
  {
    title: 'Contadores e BPO financeiro',
    text: 'Acompanhe as empresas dos seus clientes com dados organizados, despesas classificadas e histórico de cada alteração.',
    doodle: <svg className={base.doodle} viewBox="0 0 120 120" fill="none" stroke="#6b8cff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M24 10 C 22 44, 22 78, 24 112 C 50 113, 74 112, 98 110 C 98 76, 97 42, 98 10 C 74 8, 48 8, 24 10 Z" />
      <path d="M38 28 C 52 27, 68 27, 84 28 C 84 36, 84 40, 84 46 C 68 47, 52 47, 38 46 Z" />
      <path d="M40 64 L 44 64 M 58 64 L 62 64 M 76 64 L 80 64 M 40 80 L 44 80 M 58 80 L 62 80 M 76 80 L 80 80 M 40 96 L 44 96 M 58 96 L 62 96 M 76 96 L 80 96" />
    </svg>,
  },
]

const FACTS = [
  ['Contas a pagar e receber', 'com vencimentos, baixas e estornos'],
  ['Conciliação', 'do extrato com o que foi lançado'],
  ['Classificação automática', 'de despesas por categoria e grupo do DRE'],
  ['DRE no automático', 'montado a partir dos lançamentos'],
  ['Cobranças e lembretes', 'enviados sem você lembrar'],
  ['Adesão grátis', 'em todos os planos'],
]

const FEATURES = [
  { Icon: IconReceipt, title: 'Contas a pagar e a receber', text: 'Títulos gerados direto das vendas e compras, com vencimentos, baixas parciais e totais, estornos e contas financeiras.' },
  { Icon: IconArrowsExchange, title: 'Conciliação e classificação', text: 'Compare o extrato com os lançamentos e deixe as despesas classificadas por categoria, com o grupo do DRE certo.' },
  { Icon: IconReportMoney, title: 'DRE e relatórios', text: 'Resultado do mês, fluxo de caixa e relatórios financeiros completos, prontos sem montar planilha.' },
  { Icon: IconShieldLock, title: 'Seguro e com histórico', text: 'Dados isolados por empresa, permissões por usuário, confirmação antes de qualquer alteração importante e histórico de quem fez o quê.' },
]

const STEPS = [
  { Icon: IconUserPlus, title: 'Crie sua conta', text: 'Cadastre a empresa em poucos minutos. A adesão é grátis em todos os planos.' },
  { Icon: IconFileImport, title: 'Traga seus dados', text: 'Cadastre ou importe clientes, fornecedores, produtos e as primeiras contas. Comece pelo financeiro.' },
  { Icon: IconPlugConnected, title: 'Conecte o ChatGPT ou o Claude', text: 'E passe a cuidar do financeiro conversando, com as permissões de cada usuário.' },
]

const PLANS = [
  { name: 'Essencial', monthly: 69, annual: 58, users: '1 usuário', note: 'Para organizar os primeiros processos da empresa', featured: false, features: ['Taxa de adesão grátis', 'Clientes, fornecedores, produtos e serviços', 'Vendas e compras', 'Contas a pagar e a receber', 'ChatGPT e Claude conectados à Otto', 'Conciliação e classificação de despesas', 'Suporte por e-mail'] },
  { name: 'Gestão', monthly: 129, annual: 108, users: 'Até 3 usuários', note: 'Mais controle para a rotina financeira', featured: true, features: ['Taxa de adesão grátis', 'Tudo do plano Essencial', 'Contas financeiras e centros de custo', 'Baixas parciais, totais e estornos', 'Operações pelo ChatGPT ou Claude', 'Cobranças e lembretes automáticos', 'Relatórios financeiros completos', 'Suporte prioritário'] },
  { name: 'Profissional', monthly: 199, annual: 166, users: 'Até 10 usuários', note: 'Para equipes e operações estruturadas', featured: false, features: ['Taxa de adesão grátis', 'Tudo do plano Gestão', 'Histórico completo de alterações', 'ChatGPT e Claude com permissões', 'Compras e pagamentos recorrentes', 'Dashboards e relatórios avançados', 'Implantação guiada', 'Atendimento prioritário'] },
]

const FAQ = [
  ['Para quais empresas a OttoGestão é indicada?', 'Para pequenas empresas que precisam organizar vendas, compras e financeiro sem implantar um sistema complexo.'],
  ['Preciso substituir todos os sistemas que já uso?', 'Não. Você pode começar pela operação financeira e conectar ou importar dados das ferramentas que já fazem parte da rotina da empresa.'],
  ['Como a OttoGestão funciona com o ChatGPT e o Claude?', 'Você faz o pedido no ChatGPT ou no Claude. A Otto consulta os dados autorizados da empresa, prepara a operação e mantém permissões, confirmações e histórico no sistema de gestão.'],
  ['O ChatGPT ou o Claude podem alterar dados sem minha autorização?', 'Não nas ações sensíveis. A Otto aplica as permissões do usuário e pede confirmação antes de concluir operações que alteram dados importantes da empresa.'],
  ['Posso usar sem ChatGPT ou Claude?', 'Sim. O sistema funciona integralmente pela aplicação web. ChatGPT e Claude são interfaces conectadas para consultas e preparação de rotinas.'],
  ['A OttoGestão já emite notas fiscais?', 'Hoje a Otto organiza e valida documentos fiscais de entrada. A emissão por API está sendo preparada para uma próxima etapa do produto.'],
  ['Como meus dados são protegidos?', 'O acesso é autenticado, os dados são isolados por empresa e as operações importantes mantêm histórico de autoria e alteração.'],
  ['Como funciona a implantação?', 'A configuração inicial organiza a empresa, os cadastros e as primeiras rotinas. Depois, a Otto conecta o contexto autorizado ao ChatGPT e ao Claude, e novas integrações podem ser adicionadas aos poucos.'],
]

export function OttoGestaoLanding() {
  return <div className={`${base.page} ${jakarta.className}`}>
    <header className={base.header}>
      <Logo />
      <span className={styles.headerActions}>
        <Link href="/sign-in" className={styles.signIn}>Entrar</Link>
        <Cta small>Começar agora</Cta>
      </span>
    </header>

    <section className={base.hero}>
      <div className={`${base.badges} ${styles.badgesWrap}`}>
        <Badge top="Funciona no" bottom="ChatGPT e Claude" />
        <Badge top="Feito para" bottom="pequenas empresas" />
        <Badge top="Taxa de" bottom="adesão grátis" />
      </div>
      <h1>O financeiro da sua empresa no automático, dentro do <TypedAssistant /></h1>
      <p className={base.lead}>A OttoGestão é o ERP que junta vendas, compras e financeiro e deixa a rotina por conta da IA: contas a pagar e a receber, conciliação, classificação de despesas e DRE.</p>
      <Cta>Começar agora</Cta>
      <div className={styles.modules} aria-label="O que a OttoGestão organiza">
        {MODULES.map(({ Icon, label, bg }) => <span key={label} title={label} style={{ background: bg }}><Icon size={26} stroke={1.8} color="#fff" /></span>)}
      </div>
      <p className={base.networksNote}>Tudo o que o financeiro precisa, num só lugar</p>
    </section>

    <section className={base.via}>
      <h2 className={base.sectionTitle}>Cuide do financeiro com <span className={base.nowrap}><CircledWord>IA</CircledWord>,</span> só conversando</h2>
      <div className={base.viaList}>
        {VIA.map(v => <article key={v.title} className={base.viaCard} style={{ background: v.bg }}>
          <div className={base.viaFrame}>
            <div className={base.viaWindow}>
              <video autoPlay muted loop playsInline preload="metadata" poster={v.poster} aria-label={`Demonstração: a Otto classificando despesas ${v.title.toLowerCase().replace('via', 'pelo')}`}>
                <source src={v.video} type="video/mp4" />
              </video>
            </div>
          </div>
          <h3 className={base.viaTitle}>{v.icon}{v.title}</h3>
          <p className={base.viaText}>{v.text}</p>
        </article>)}
      </div>
    </section>

    <section className={base.who}>
      <h2 className={base.sectionTitle}>Para quem é a OttoGestão?</h2>
      <div className={base.whoList}>
        {WHO.map(w => <article key={w.title} className={base.whoItem}>{w.doodle}<h3>{w.title}</h3><p>{w.text}</p></article>)}
      </div>
    </section>

    <section className={base.facts}>
      <h2 className={base.sectionTitle}>Menos planilha, mais controle do caixa</h2>
      {[FACTS.slice(0, 3), FACTS.slice(3)].map((row, r) => <div key={r} className={base.marquee}>
        <div className={r ? base.trackReverse : base.track}>
          {[...row, ...row, ...row].map(([big, small], i) => <div key={i} className={r ? base.factPink : base.factViolet}><b>{big}</b><span>{small}</span></div>)}
        </div>
      </div>)}
    </section>

    <section className={base.features}>
      <h2 className={base.sectionTitle}>O que a OttoGestão faz pela sua empresa</h2>
      <div className={base.featureGrid}>
        {FEATURES.map(({ Icon, title, text }) => <article key={title} className={base.feature}>
          <span className={base.featureIcon}><Icon size={22} stroke={1.8} /></span>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>)}
      </div>
    </section>

    <section className={base.steps}>
      <h2 className={base.sectionTitle}>Como começar</h2>
      <div className={base.stepGrid}>
        {STEPS.map(({ Icon, title, text }, i) => <article key={title} className={base.step}>
          <span className={base.stepNum}>{i + 1}</span>
          <Icon size={26} stroke={1.7} />
          <h3>{title}</h3>
          <p>{text}</p>
        </article>)}
      </div>
    </section>

    <section id="planos" className={styles.pricing}>
      <h2 className={base.sectionTitle}>Planos que crescem com a sua empresa</h2>
      <p className={styles.pricingNote}>Preços por mês. No plano anual o valor mensal fica menor.</p>
      <div className={styles.planGrid}>
        {PLANS.map(p => <article key={p.name} className={p.featured ? styles.planFeatured : styles.plan}>
          {p.featured && <span className={styles.planTag}>Mais escolhido</span>}
          <h3>{p.name}</h3>
          <p className={styles.planNote}>{p.note}</p>
          <div className={styles.planPrice}><b>{brl(p.monthly)}</b><span>/mês</span></div>
          <p className={styles.planAnnual}>ou {brl(p.annual)}/mês no plano anual · {p.users}</p>
          <Cta href={SIGN_UP}>Começar com o {p.name}</Cta>
          <ul>{p.features.map(f => <li key={f}><IconCheck size={18} stroke={2.2} />{f}</li>)}</ul>
        </article>)}
      </div>
      <p className={styles.enterprise}><IconHistory size={18} /> Precisa de mais usuários, várias empresas ou permissões personalizadas? Temos o plano <b>Enterprise</b>, sob medida.</p>
    </section>

    <section className={base.faq}>
      <h2 className={base.sectionTitle}>Perguntas frequentes</h2>
      {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </section>

    <section className={base.final}>
      <h2>Feche o mês sem planilha. Comece hoje.</h2>
      <Cta>Começar agora</Cta>
    </section>

    <footer className={base.footer}>
      <Logo />
      <p>© {new Date().getFullYear()} Otto. Todos os direitos reservados.</p>
      <p className={base.disclaimer}>ChatGPT é marca registrada da OpenAI e Claude é marca registrada da Anthropic. A OttoGestão é um produto independente e não é afiliada, patrocinada nem endossada pela OpenAI ou pela Anthropic.</p>
    </footer>
  </div>
}
