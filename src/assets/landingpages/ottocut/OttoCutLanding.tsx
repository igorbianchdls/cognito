import { Plus_Jakarta_Sans } from 'next/font/google'
import type { ReactNode } from 'react'
import {
  IconBadgeCc, IconBrandFacebook, IconBrandInstagram, IconBrandLinkedin, IconBrandOpenai, IconBrandPinterest,
  IconBrandSnapchat, IconBrandTelegram, IconBrandThreads, IconBrandTiktok, IconBrandVimeo, IconBrandWhatsapp, IconBrandX,
  IconBrandYoutube, IconChevronsRight, IconDownload, IconMessageChatbot, IconMusic, IconPalette, IconScissors,
  IconShieldCheck, IconUpload, IconZoomIn,
} from '@tabler/icons-react'
import { OTTOCUT_OFFER } from './offer'
import { TypedAssistant } from './TypedAssistant'
import { OttoLogo } from './OttoLogo'
import { CircledWord } from './DrawOnView'
import styles from './OttoCutLanding.module.css'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const ctaHref = OTTOCUT_OFFER.checkoutUrl || '#oferta'

function Logo() {
  return <OttoLogo />
}

function Cta({ children, small }: { children: ReactNode; small?: boolean }) {
  return <a className={small ? styles.ctaSmall : styles.cta} href={ctaHref}>{children}{!small && <IconChevronsRight size={22} stroke={2} />}</a>
}

function Laurel({ flip }: { flip?: boolean }) {
  // A laurel branch: a curved stem with leaves along it.
  const leaves = [0.12, 0.3, 0.48, 0.66, 0.84].map(t => {
    const y = 44 - t * 38, x = 13 - Math.sin(t * Math.PI) * 6 - t * 2
    return { x, y, a: -40 + t * 60 }
  })
  return <svg className={styles.laurel} style={flip ? { transform: 'scaleX(-1)' } : undefined} width="20" height="46" viewBox="0 0 20 46" fill="none">
    <path d="M14 45 C5 36 4 20 9 5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    {leaves.map((l, i) => <g key={i}>
      <ellipse cx={l.x - 3.2} cy={l.y} rx="3.6" ry="1.5" fill="#fff" transform={`rotate(${l.a} ${l.x - 3.2} ${l.y})`} />
      <ellipse cx={l.x + 2.6} cy={l.y - 2.4} rx="3.2" ry="1.3" fill="#fff" transform={`rotate(${-l.a - 30} ${l.x + 2.6} ${l.y - 2.4})`} />
    </g>)}
  </svg>
}

function Badge({ top, bottom }: { top: string; bottom: string }) {
  return <div className={styles.badge}><Laurel /><span><small>{top}</small><b>{bottom}</b></span><Laurel flip /></div>
}

const NETWORKS = [
  { Icon: IconBrandInstagram, bg: 'linear-gradient(45deg,#f9ce34,#ee2a7b 50%,#6228d7)', label: 'Instagram' },
  { Icon: IconBrandTiktok, bg: '#111', label: 'TikTok' },
  { Icon: IconBrandYoutube, bg: '#ff0033', label: 'YouTube' },
  { Icon: IconBrandFacebook, bg: '#1877f2', label: 'Facebook' },
  { Icon: IconBrandLinkedin, bg: '#0a66c2', label: 'LinkedIn' },
  { Icon: IconBrandPinterest, bg: '#e60023', label: 'Pinterest' },
  { Icon: IconBrandX, bg: '#000', label: 'X' },
  { Icon: IconBrandThreads, bg: '#000', label: 'Threads' },
  { Icon: IconBrandSnapchat, bg: '#fffc00', label: 'Snapchat', dark: true },
  { Icon: IconBrandWhatsapp, bg: '#25d366', label: 'WhatsApp' },
  { Icon: IconBrandTelegram, bg: '#29a9eb', label: 'Telegram' },
  { Icon: IconBrandVimeo, bg: '#1ab7ea', label: 'Vimeo' },
]

const VIA = [
  {
    title: 'Via ChatGPT', video: '/ottocut/chat-demo.mp4', poster: '/ottocut/chat-demo-poster.jpg',
    bg: 'linear-gradient(160deg, #8b2cf5 0%, #6a16d8 55%, #4c0fa3 100%)',
    icon: <IconBrandOpenai size={44} stroke={1.5} />,
    text: 'Mande o vídeo no seu ChatGPT, peça em português e receba o Reel cortado, legendado e pronto para postar.',
  },
  {
    title: 'Via Claude', video: '/ottocut/claude-demo.mp4', poster: '/ottocut/claude-demo-poster.jpg',
    bg: 'linear-gradient(160deg, #b62aa8 0%, #8c1a84 55%, #5e0f5a 100%)',
    // eslint-disable-next-line @next/next/no-img-element
    icon: <span className={styles.viaClaude}><img src="/claudeLogo.svg" alt="" /></span>,
    text: 'Conecte o OttoCut ao Claude e edite seus Reels na conversa: cortes, legendas, zoom, cor e música.',
  },
]

const WHO = [
  {
    title: 'Criadores de conteúdo',
    text: 'Grave e poste todo dia sem passar horas editando. Você fala o que quer e o Reel sai pronto.',
    doodle: <svg className={styles.doodle} viewBox="0 0 120 120" fill="none" stroke="#f472d0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M60 8 C 30 6, 8 30, 10 62 C 12 92, 38 114, 66 110 C 96 106, 114 82, 110 52 C 106 24, 84 8, 58 10" />
      <path d="M42 46 C 42 52, 46 54, 46 48" /><path d="M76 44 C 74 52, 80 54, 80 46" />
      <path d="M36 70 C 50 76, 72 76, 86 68 C 84 84, 70 92, 58 90 C 46 88, 40 80, 36 70 Z" />
    </svg>,
  },
  {
    title: 'Social medias e agências',
    text: 'Entregue mais Reels para mais clientes, no mesmo tempo. Ajustes de legenda e gancho saem num pedido.',
    doodle: <svg className={styles.doodle} viewBox="0 0 120 120" fill="none" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 44 C 20 66, 22 90, 26 108 C 50 110, 76 109, 102 106 C 100 84, 100 64, 98 42 C 72 41, 46 42, 22 44 Z" />
      <path d="M44 42 C 42 26, 48 14, 60 14 C 72 14, 78 26, 76 42" />
    </svg>,
  },
  {
    title: 'Empresários e profissionais',
    text: 'Grave o seu próprio conteúdo e publique com cara profissional, sem contratar um editor.',
    doodle: <svg className={styles.doodle} viewBox="0 0 120 120" fill="none" stroke="#6b8cff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 58 C 30 40, 46 24, 62 10 C 78 26, 94 42, 110 56" />
      <path d="M24 50 C 24 70, 26 90, 26 110 C 50 112, 74 111, 98 110 C 98 90, 97 70, 98 50" />
      <path d="M50 110 C 50 96, 50 86, 52 78 C 60 76, 66 77, 72 78 C 72 90, 72 100, 72 110" />
    </svg>,
  },
]

const FACTS = [
  ['6 etapas', 'de edição numa única conversa'],
  ['9:16 e 4:5', 'prontos para Reels, Stories e Feed'],
  ['Palavra por palavra', 'legendas animadas que prendem'],
  ['Zero', 'programas de edição para aprender'],
  ['100%', 'em português, do pedido ao vídeo'],
  ['1 pedido', 'e o Reel sai cortado, legendado e com música'],
]

const FEATURES = [
  { Icon: IconScissors, title: 'Cortes automáticos', text: 'Pausas, gaguejadas e erros saem sozinhos. O vídeo fica no ritmo que segura a atenção até o fim.', visual: 'cuts' },
  { Icon: IconBadgeCc, title: 'Legendas que prendem', text: 'Legenda palavra por palavra, no estilo dos Reels que viralizam. Você escolhe cor, fonte e destaque só pedindo.', visual: 'captions' },
  { Icon: IconZoomIn, title: 'Zoom, cor e música', text: 'Zoom nos momentos fortes, cor e luz corrigidas e uma trilha leve com a sua voz em primeiro plano.', visual: 'chips' },
  { Icon: IconDownload, title: 'Pronto para postar', text: 'Baixe em 9:16 para Reels, TikTok e Shorts, ou em 4:5 para o Feed. Quer outro gancho? É só pedir.', visual: 'formats' },
] as const

function FeatureVisual({ kind }: { kind: (typeof FEATURES)[number]['visual'] }) {
  if (kind === 'cuts') return <div className={styles.vCuts}>
    {[18, 6, 22, 5, 14, 7, 20, 4, 12].map((w, i) => <i key={i} style={{ flexGrow: w }} className={i % 2 ? styles.cutOut : styles.cutIn} />)}
    <span>1:12 → 0:38</span>
  </div>
  if (kind === 'captions') return <div className={styles.vCaptions}><b>VOCÊ AINDA</b> <b className={styles.hl}>EDITA</b> <b>NA MÃO?</b></div>
  if (kind === 'chips') return <div className={styles.vChips}>
    <span><IconZoomIn size={16} /> zoom 112%</span><span><IconPalette size={16} /> cor +12%</span><span><IconMusic size={16} /> trilha leve</span>
  </div>
  return <div className={styles.vFormats}><span className={styles.f916}>9:16</span><span className={styles.f45}>4:5</span></div>
}

const STEPS = [
  { Icon: IconMessageChatbot, title: 'Ative o OttoCut no seu ChatGPT ou Claude', text: 'Você recebe o software e a skill, e conecta tudo na sua conta do ChatGPT ou do Claude com o passo a passo.' },
  { Icon: IconUpload, title: 'Mande o vídeo e diga o que quer', text: '“Corta as pausas, legenda amarela e zoom nos destaques.” Do jeito que você falaria com um editor.' },
  { Icon: IconDownload, title: 'Baixe o Reel pronto', text: 'Em 9:16 ou 4:5. Não gostou de algo? Peça o ajuste na mesma conversa.' },
]

const FAQ = [
  ['Preciso saber editar vídeo?', 'Não. Você descreve em português o que quer e o OttoCut faz a edição dentro do ChatGPT ou do Claude: cortes, legendas, zoom, cor e música.'],
  ['O que eu recebo na compra?', 'O software OttoCut e a skill que coloca o OttoCut dentro do seu ChatGPT ou Claude, com o passo a passo para ativar.'],
  ['Em quais formatos o vídeo sai?', 'Em 9:16, para Reels, Stories, TikTok e Shorts, e em 4:5, para o Feed do Instagram e do Facebook.'],
  ['Posso pedir ajustes depois?', 'Sim. Na mesma conversa você pede outra cor de legenda, outro gancho no começo ou uma versão mais curta.'],
  ['O OttoCut é da OpenAI ou da Anthropic?', 'Não. O OttoCut é um produto independente que funciona dentro do ChatGPT e do Claude. ChatGPT é marca da OpenAI e Claude é marca da Anthropic.'],
  ['E se eu não gostar?', `Você tem ${OTTOCUT_OFFER.guaranteeDays} dias de garantia: se não gostar, é só pedir o reembolso dentro do prazo.`],
]

function Price() {
  const { price, fromPrice, installments } = OTTOCUT_OFFER
  if (price == null) return <div className={styles.priceSoon}><b>Valor de lançamento em breve</b><span>As vagas do lançamento abrem nos próximos dias.</span></div>
  return <div className={styles.price}>
    {fromPrice != null && <s>de {brl(fromPrice)}</s>}
    {installments ? <><span>por {installments.count}x de</span><b>{brl(installments.value)}</b><small>ou {brl(price)} à vista</small></> : <b>{brl(price)}</b>}
  </div>
}

export function OttoCutLanding() {
  const g = OTTOCUT_OFFER.guaranteeDays
  return <div className={`${styles.page} ${jakarta.className}`}>
    <header className={styles.header}>
      <Logo />
      <Cta small>{OTTOCUT_OFFER.checkoutUrl ? 'Comprar' : 'Quero o OttoCut'}</Cta>
    </header>

    <section className={styles.hero}>
      <div className={styles.badges}>
        <Badge top="Funciona no" bottom="ChatGPT e Claude" />
        <Badge top="Feito em" bottom="português" />
        <Badge top="Sem saber" bottom="editar" />
      </div>
      <h1>Crie e edite seus Reels dentro do <TypedAssistant /></h1>
      <p className={styles.lead}>O OttoCut transforma o seu ChatGPT ou Claude num editor de vídeo: mande a gravação, peça em português e receba o Reel cortado, legendado, com zoom e música.</p>
      <Cta>Quero o OttoCut</Cta>
      <div className={styles.networks} aria-label="Onde você pode postar">
        {NETWORKS.map(({ Icon, bg, label, ...n }) => <span key={label} title={label} style={{ background: bg }}><Icon size={26} stroke={1.8} color={'dark' in n ? '#000' : '#fff'} /></span>)}
      </div>
      <p className={styles.networksNote}>Exporte pronto para onde você posta</p>
    </section>

    <section className={styles.via}>
      <h2 className={styles.sectionTitle}>Edite seus vídeos com <span className={styles.nowrap}><CircledWord>IA</CircledWord>,</span> só conversando</h2>
      <div className={styles.viaList}>
        {VIA.map(v => <article key={v.title} className={styles.viaCard} style={{ background: v.bg }}>
          <div className={styles.viaFrame}>
            <div className={styles.viaWindow}>
              <video autoPlay muted loop playsInline preload="metadata" poster={v.poster} aria-label={`Demonstração: o OttoCut editando um Reel ${v.title.toLowerCase().replace('via', 'pelo')}`}>
                <source src={v.video} type="video/mp4" />
              </video>
            </div>
          </div>
          <h3 className={styles.viaTitle}>{v.icon}{v.title}</h3>
          <p className={styles.viaText}>{v.text}</p>
        </article>)}
      </div>
    </section>

    <section className={styles.who}>
      <h2 className={styles.sectionTitle}>Para quem é o OttoCut?</h2>
      <div className={styles.whoList}>
        {WHO.map(w => <article key={w.title} className={styles.whoItem}>
          {w.doodle}
          <h3>{w.title}</h3>
          <p>{w.text}</p>
        </article>)}
      </div>
    </section>

    <section className={styles.facts}>
      <h2 className={styles.sectionTitle}>Tudo o que um editor faz, num pedido só</h2>
      {[FACTS.slice(0, 3), FACTS.slice(3)].map((row, r) => <div key={r} className={styles.marquee}>
        <div className={r ? styles.trackReverse : styles.track}>
          {[...row, ...row, ...row].map(([big, small], i) => <div key={i} className={r ? styles.factPink : styles.factViolet}><b>{big}</b><span>{small}</span></div>)}
        </div>
      </div>)}
    </section>

    <section className={styles.features}>
      <h2 className={styles.sectionTitle}>O que o OttoCut faz no seu vídeo</h2>
      <div className={styles.featureGrid}>
        {FEATURES.map(({ Icon, title, text, visual }) => <article key={title} className={styles.feature}>
          <span className={styles.featureIcon}><Icon size={22} stroke={1.8} /></span>
          <h3>{title}</h3>
          <p>{text}</p>
          <FeatureVisual kind={visual} />
        </article>)}
      </div>
    </section>

    <section className={styles.steps}>
      <h2 className={styles.sectionTitle}>Como funciona</h2>
      <div className={styles.stepGrid}>
        {STEPS.map(({ Icon, title, text }, i) => <article key={title} className={styles.step}>
          <span className={styles.stepNum}>{i + 1}</span>
          <Icon size={26} stroke={1.7} />
          <h3>{title}</h3>
          <p>{text}</p>
        </article>)}
      </div>
    </section>

    <section id="oferta" className={styles.offer}>
      <div className={styles.offerCard}>
        <span className={styles.offerTag}>Acesso ao OttoCut</span>
        <h2>Tudo para editar seus Reels dentro do ChatGPT ou do Claude</h2>
        <ul>
          <li><IconShieldCheck size={20} /> <span><b>Software OttoCut</b> — o motor que corta, legenda, aplica zoom, cor e música e exporta seus vídeos</span></li>
          <li><IconShieldCheck size={20} /> <span><b>Skill do OttoCut para o ChatGPT e o Claude</b> — é ela que faz o seu assistente editar vídeo quando você pede</span></li>
        </ul>
        <Price />
        {OTTOCUT_OFFER.checkoutUrl ? <Cta>Quero o OttoCut</Cta> : <span className={styles.ctaDisabled}>Em breve</span>}
        <p className={styles.guarantee}><IconShieldCheck size={18} /> Garantia de {g} dias: se não gostar, devolvemos seu dinheiro.</p>
      </div>
    </section>

    <section className={styles.faq}>
      <h2 className={styles.sectionTitle}>Perguntas frequentes</h2>
      {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </section>

    <section className={styles.final}>
      <h2>Seu próximo Reel começa numa conversa.</h2>
      <Cta>Quero o OttoCut</Cta>
    </section>

    <footer className={styles.footer}>
      <Logo />
      <p>© {new Date().getFullYear()} Otto. Todos os direitos reservados.</p>
      <p className={styles.disclaimer}>ChatGPT é marca registrada da OpenAI e Claude é marca registrada da Anthropic. O OttoCut é um produto independente e não é afiliado, patrocinado nem endossado pela OpenAI ou pela Anthropic.</p>
    </footer>
  </div>
}
