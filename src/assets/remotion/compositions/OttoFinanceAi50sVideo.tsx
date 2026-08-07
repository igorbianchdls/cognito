import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion'
import {
  ArrowUp,
  Check,
  FileCheck2,
  Landmark,
  MailCheck,
  ReceiptText,
  Scale,
  Sparkles,
  WalletCards,
} from 'lucide-react'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'
import { TypingText } from '@/assets/remotion/saas/motionComponents'
import type { SaaSTheme } from '@/assets/remotion/saas/types'
import { OttoLogoRevealHorizontal } from './OttoLogoRevealHorizontal'

loadSfProFonts()

export const OTTO_FINANCE_AI_50S_DURATION = 1500

const FONT = IOS_REMOTION_FONT_STACK
const INK = '#181818'
const MUTED = '#737373'
const BORDER = '#e5e5e5'
const GREEN = '#16845b'
const ORANGE = '#d97757'

const typingTheme: SaaSTheme = {
  accent: INK,
  accent2: '#737373',
  background: '#ffffff',
  border: BORDER,
  fontFamily: FONT,
  muted: MUTED,
  panel: '#ffffff',
  positive: GREEN,
  text: INK,
}

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function Scene({ children, duration }: { children: React.ReactNode; duration: number }) {
  const frame = useCurrentFrame()
  const opacity = p(frame, 0, 12) * p(frame, duration - 12, duration, [1, 0])
  const y = interpolate(p(frame, 0, 18), [0, 1], [18, 0])

  return (
    <AbsoluteFill
      style={{
        background: '#ffffff',
        color: INK,
        fontFamily: FONT,
        opacity,
        overflow: 'hidden',
        transform: `translateY(${y}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: MUTED, fontSize: 24, fontWeight: 650, letterSpacing: 0, textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}

function SceneTitle({ children, subtitle }: { children: React.ReactNode; subtitle: string }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <h2 style={{ fontSize: 58, fontWeight: 720, letterSpacing: 0, lineHeight: 1.04, margin: 0 }}>{children}</h2>
      <p style={{ color: MUTED, fontSize: 27, fontWeight: 450, letterSpacing: 0, lineHeight: 1.3, margin: 0 }}>{subtitle}</p>
    </div>
  )
}

function Status({ complete, label = 'Concluido' }: { complete: boolean; label?: string }) {
  const frame = useCurrentFrame()
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <span style={{ color: complete ? GREEN : MUTED, fontSize: 20, fontWeight: 650, letterSpacing: 0 }}>
        {complete ? label : 'Processando'}
      </span>
      {complete ? (
        <span style={{ alignItems: 'center', background: '#eaf7f1', borderRadius: 999, display: 'flex', height: 30, justifyContent: 'center', width: 30 }}>
          <Check color={GREEN} size={19} strokeWidth={3} />
        </span>
      ) : (
        <span style={{ border: '3px solid #dddddd', borderRadius: 999, borderRightColor: INK, height: 22, transform: `rotate(${frame * 18}deg)`, width: 22 }} />
      )}
    </div>
  )
}

function IntroScene() {
  return (
    <AbsoluteFill style={{ alignItems: 'center', background: '#ffffff', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ height: 720, position: 'relative', transform: 'scale(0.82)', width: 1280 }}>
        <OttoLogoRevealHorizontal />
      </div>
    </AbsoluteFill>
  )
}

function PromptScene({ duration, prompt }: { duration: number; prompt: string }) {
  const frame = useCurrentFrame()
  const visibleChars = Math.min(prompt.length, Math.floor(Math.max(0, frame - 18) * 1.35))
  const sent = frame > duration - 44
  const buttonScale = interpolate(p(frame, duration - 48, duration - 34), [0, 1], [1, 0.9])

  return (
    <Scene duration={duration}>
      <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', inset: 0, justifyContent: 'center', padding: '0 68px', position: 'absolute' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 18, marginBottom: 68 }}>
          <span style={{ alignItems: 'center', background: ORANGE, borderRadius: 999, color: '#ffffff', display: 'flex', height: 54, justifyContent: 'center', width: 54 }}>
            <Sparkles size={28} />
          </span>
          <strong style={{ fontSize: 38, fontWeight: 650, letterSpacing: 0 }}>Converse com a Otto</strong>
        </div>
        <div style={{ background: '#fafafa', border: `2px solid ${sent ? '#b8dcca' : '#cecece'}`, borderRadius: 42, boxShadow: '0 24px 64px rgba(0,0,0,0.08)', minHeight: 270, padding: '44px 42px 34px', position: 'relative', width: '100%' }}>
          <div style={{ fontSize: 42, fontWeight: 470, letterSpacing: 0, lineHeight: 1.24, minHeight: 118 }}>
            {prompt.slice(0, visibleChars)}
            {!sent && <span style={{ opacity: Math.floor(frame / 10) % 2 ? 0 : 1 }}>|</span>}
          </div>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
            <span style={{ color: MUTED, fontSize: 22, fontWeight: 550 }}>Otto Finance</span>
            <span style={{ alignItems: 'center', background: sent ? GREEN : INK, borderRadius: 999, display: 'flex', height: 70, justifyContent: 'center', transform: `scale(${buttonScale})`, width: 70 }}>
              {sent ? <Check color="#ffffff" size={34} /> : <ArrowUp color="#ffffff" size={34} />}
            </span>
          </div>
        </div>
      </div>
    </Scene>
  )
}

const reconciliationRows = [
  ['03 ago', 'PIX recebido', 'Venda #1842', 'R$ 4.800'],
  ['03 ago', 'Cartao corporativo', 'Software', 'R$ 920'],
  ['04 ago', 'TED recebida', 'Cliente Aurora', 'R$ 7.250'],
  ['04 ago', 'Debito automatico', 'Energia', 'R$ 1.460'],
]

function ReconciliationScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  return (
    <Scene duration={duration}>
      <div style={{ padding: '170px 64px 0' }}>
        <Eyebrow>Conciliação bancária</Eyebrow>
        <div style={{ marginTop: 20 }}><SceneTitle subtitle="Movimentações vinculadas aos lançamentos certos.">Tudo bate. Automaticamente.</SceneTitle></div>
        <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: 8, marginTop: 72, overflow: 'hidden' }}>
          <div style={{ background: '#f7f7f7', display: 'grid', fontSize: 20, fontWeight: 680, gridTemplateColumns: '130px 1.15fr 1fr 160px', letterSpacing: 0, padding: '24px 26px' }}>
            <span>Data</span><span>Banco</span><span>Correspondência</span><span style={{ textAlign: 'right' }}>Valor</span>
          </div>
          {reconciliationRows.map((row, index) => {
            const rowIn = p(frame, 28 + index * 15, 44 + index * 15)
            const complete = frame > 66 + index * 18
            return (
              <div key={row[1]} style={{ alignItems: 'center', borderTop: `1px solid ${BORDER}`, display: 'grid', gridTemplateColumns: '130px 1.15fr 1fr 160px', minHeight: 112, opacity: rowIn, padding: '0 26px', transform: `translateX(${(1 - rowIn) * 24}px)` }}>
                <span style={{ color: MUTED, fontSize: 20 }}>{row[0]}</span>
                <strong style={{ fontSize: 22, fontWeight: 620 }}>{row[1]}</strong>
                <span style={{ color: complete ? INK : MUTED, fontSize: 21 }}>{complete ? row[2] : 'Buscando...'}</span>
                <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}><strong style={{ fontSize: 22 }}>{row[3]}</strong><Status complete={complete} label="Conciliado" /></div>
              </div>
            )
          })}
        </div>
      </div>
    </Scene>
  )
}

const expenseRows = [
  { category: 'Software', name: 'Notion Labs', value: 'R$ 410' },
  { category: 'Marketing', name: 'Meta Ads', value: 'R$ 3.460' },
  { category: 'Logística', name: 'Frete Sul', value: 'R$ 1.280' },
]

function ExpensesScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  return (
    <Scene duration={duration}>
      <div style={{ padding: '170px 64px 0' }}>
        <Eyebrow>Rotina financeira</Eyebrow>
        <div style={{ marginTop: 20 }}><SceneTitle subtitle="Classificação, vencimentos e caixa no mesmo fluxo.">Despesas e contas organizadas.</SceneTitle></div>
        <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: 8, marginTop: 66, overflow: 'hidden' }}>
          <div style={{ alignItems: 'center', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', padding: '26px 28px' }}>
            <strong style={{ fontSize: 25 }}>Classificação inteligente</strong>
            <WalletCards color={ORANGE} size={30} />
          </div>
          {expenseRows.map((item, index) => {
            const rowIn = p(frame, 20 + index * 16, 36 + index * 16)
            return (
              <div key={item.name} style={{ alignItems: 'center', borderBottom: `1px solid ${BORDER}`, display: 'grid', gridTemplateColumns: '1fr 190px 150px', minHeight: 108, opacity: rowIn, padding: '0 28px' }}>
                <div><strong style={{ display: 'block', fontSize: 23 }}>{item.name}</strong><span style={{ color: MUTED, fontSize: 19 }}>Despesa reconhecida</span></div>
                <span style={{ background: '#f4f4f4', borderRadius: 6, fontSize: 19, fontWeight: 620, padding: '11px 14px', textAlign: 'center' }}>{item.category}</span>
                <strong style={{ fontSize: 22, textAlign: 'right' }}>{item.value}</strong>
              </div>
            )
          })}
          <div style={{ alignItems: 'center', background: '#f7fbf9', display: 'flex', justifyContent: 'space-between', minHeight: 126, padding: '0 28px' }}>
            <div><strong style={{ display: 'block', fontSize: 25 }}>Contas atualizadas</strong><span style={{ color: MUTED, fontSize: 20 }}>6 a pagar · 9 a receber</span></div>
            <Status complete={frame > 98} />
          </div>
        </div>
      </div>
    </Scene>
  )
}

function InvoiceScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const fields = [
    ['Cliente', 'Aurora Tecnologia Ltda.'],
    ['Serviço', 'Consultoria mensal'],
    ['Valor', 'R$ 12.400,00'],
    ['Impostos', 'Calculados automaticamente'],
  ]
  return (
    <Scene duration={duration}>
      <div style={{ padding: '150px 64px 0' }}>
        <Eyebrow>Nota fiscal</Eyebrow>
        <div style={{ marginTop: 20 }}><SceneTitle subtitle="Da venda ao financeiro, sem preencher formulário.">Nota emitida e enviada.</SceneTitle></div>
        <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: 8, marginTop: 58, overflow: 'hidden' }}>
          <div style={{ alignItems: 'center', background: '#f7f7f7', display: 'flex', justifyContent: 'space-between', padding: '26px 28px' }}>
            <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}><ReceiptText size={30} /><strong style={{ fontSize: 24 }}>NFS-e #01942</strong></div>
            <Status complete={frame > 76} label="Emitida" />
          </div>
          {fields.map((field, index) => {
            const filled = frame > 18 + index * 14
            return (
              <div key={field[0]} style={{ borderTop: `1px solid ${BORDER}`, display: 'grid', gap: 12, minHeight: 108, padding: '22px 28px' }}>
                <span style={{ color: MUTED, fontSize: 18, fontWeight: 600 }}>{field[0]}</span>
                <strong style={{ fontSize: 23, fontWeight: 590, opacity: filled ? 1 : 0.25 }}>{filled ? field[1] : 'Preenchendo...'}</strong>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr', marginTop: 24 }}>
          {[
            { icon: MailCheck, label: 'Enviada ao cliente', at: 92 },
            { icon: FileCheck2, label: 'Financeiro atualizado', at: 106 },
          ].map(({ at, icon: Icon, label }) => {
            const done = frame > at
            return <div key={label} style={{ alignItems: 'center', border: `1.5px solid ${done ? '#b8dcca' : BORDER}`, borderRadius: 8, display: 'flex', gap: 16, minHeight: 112, opacity: p(frame, at - 18, at), padding: '0 22px' }}><Icon color={done ? GREEN : MUTED} size={30} /><strong style={{ fontSize: 20 }}>{label}</strong></div>
          })}
        </div>
      </div>
    </Scene>
  )
}

const collectionRows = [
  ['Lume Comércio', '04 ago', 'R$ 8.900'],
  ['Nova Oficina', '01 ago', 'R$ 3.280'],
  ['Studio Norte', '29 jul', 'R$ 5.440'],
  ['Vitta Serviços', '26 jul', 'R$ 2.170'],
]

function CollectionsScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  return (
    <Scene duration={duration}>
      <div style={{ padding: '170px 64px 0' }}>
        <Eyebrow>Cobranças</Eyebrow>
        <div style={{ marginTop: 20 }}><SceneTitle subtitle="Atrasos identificados e acompanhados pela Otto.">Nenhum recebimento esquecido.</SceneTitle></div>
        <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: 8, marginTop: 70, overflow: 'hidden' }}>
          <div style={{ background: '#f7f7f7', display: 'grid', fontSize: 20, fontWeight: 680, gridTemplateColumns: '1fr 150px 155px 220px', padding: '24px 26px' }}><span>Cliente</span><span>Vencimento</span><span>Valor</span><span style={{ textAlign: 'right' }}>Ação</span></div>
          {collectionRows.map((row, index) => {
            const sent = frame > 48 + index * 18
            return (
              <div key={row[0]} style={{ alignItems: 'center', borderTop: `1px solid ${BORDER}`, display: 'grid', gridTemplateColumns: '1fr 150px 155px 220px', minHeight: 122, opacity: p(frame, 18 + index * 14, 32 + index * 14), padding: '0 26px' }}>
                <strong style={{ fontSize: 22 }}>{row[0]}</strong><span style={{ color: MUTED, fontSize: 20 }}>{row[1]}</span><strong style={{ fontSize: 21 }}>{row[2]}</strong>
                <div style={{ alignItems: 'center', display: 'flex', gap: 10, justifyContent: 'flex-end' }}><MailCheck color={sent ? GREEN : MUTED} size={25} /><span style={{ color: sent ? GREEN : MUTED, fontSize: 19, fontWeight: 650 }}>{sent ? 'Cobrança enviada' : 'Preparando'}</span></div>
              </div>
            )
          })}
        </div>
      </div>
    </Scene>
  )
}

function FiscalScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const checks = ['Obrigações fiscais revisadas', 'Regime tributário analisado', 'Créditos permitidos verificados']
  return (
    <Scene duration={duration}>
      <div style={{ padding: '170px 64px 0' }}>
        <Eyebrow>Fiscal e impostos</Eyebrow>
        <div style={{ marginTop: 20 }}><SceneTitle subtitle="A Otto verifica obrigações e oportunidades dentro da lei.">Mais controle. Menos imposto.</SceneTitle></div>
        <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: 8, marginTop: 72, overflow: 'hidden' }}>
          <div style={{ alignItems: 'center', background: '#f7f7f7', display: 'flex', justifyContent: 'space-between', padding: '28px' }}><div style={{ alignItems: 'center', display: 'flex', gap: 14 }}><Scale size={30} /><strong style={{ fontSize: 25 }}>Análise tributária</strong></div><span style={{ color: MUTED, fontSize: 20 }}>Empresa exemplo</span></div>
          {checks.map((label, index) => {
            const complete = frame > 34 + index * 20
            return <div key={label} style={{ alignItems: 'center', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', minHeight: 116, opacity: p(frame, 14 + index * 14, 30 + index * 14), padding: '0 28px' }}><strong style={{ fontSize: 23, fontWeight: 590 }}>{label}</strong><Status complete={complete} label="Verificado" /></div>
          })}
          <div style={{ background: '#f0faf5', borderTop: '1px solid #b8dcca', display: 'grid', gap: 10, minHeight: 190, opacity: p(frame, 92, 116), padding: '30px 28px' }}>
            <span style={{ color: GREEN, fontSize: 20, fontWeight: 700 }}>OPORTUNIDADE IDENTIFICADA</span>
            <strong style={{ fontSize: 32, fontWeight: 700 }}>Economia tributária possível</strong>
            <span style={{ color: MUTED, fontSize: 21 }}>Alternativa validada dentro da legislação.</span>
          </div>
        </div>
      </div>
    </Scene>
  )
}

function CompatibilityScene({ duration }: { duration: number }) {
  return (
    <Scene duration={duration}>
      <div style={{ alignItems: 'center', display: 'flex', inset: 0, justifyContent: 'center', padding: '0 80px', position: 'absolute' }}>
        <TypingText
          delay={16}
          speed={0.55}
          style={{ display: 'block', fontSize: 76, fontWeight: 720, letterSpacing: 0, lineHeight: 1.18, maxWidth: 890, textAlign: 'center' }}
          text="O Otto funciona diretamente no seu ChatGPT ou Claude."
          theme={typingTheme}
        />
      </div>
    </Scene>
  )
}

function OutroScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const logoIn = p(frame, 4, 30)
  const lineIn = p(frame, 34, 62)
  return (
    <Scene duration={duration}>
      <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', inset: 0, justifyContent: 'center', padding: '0 70px', position: 'absolute' }}>
        <Img src={staticFile('logoOtto.svg')} style={{ height: 270, opacity: logoIn, transform: `translateY(${(1 - logoIn) * 18}px)`, width: 700 }} />
        <div style={{ background: BORDER, height: 2, margin: '24px 0 38px', opacity: lineIn, width: 150 }} />
        <div style={{ fontSize: 43, fontWeight: 580, letterSpacing: 0, lineHeight: 1.22, maxWidth: 820, opacity: lineIn, textAlign: 'center', transform: `translateY(${(1 - lineIn) * 14}px)` }}>
          Administre sua empresa conversando com a IA.
        </div>
        <div style={{ alignItems: 'center', color: MUTED, display: 'flex', fontSize: 21, gap: 28, marginTop: 44, opacity: p(frame, 58, 82) }}>
          <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}><Landmark size={22} />Financeiro</span>
          <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}><ReceiptText size={22} />Fiscal</span>
          <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}><Scale size={22} />Contabilidade</span>
        </div>
      </div>
    </Scene>
  )
}

export function OttoFinanceAi50sVideo() {
  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      <Sequence durationInFrames={120}><IntroScene /></Sequence>
      <Sequence from={120} durationInFrames={150}><PromptScene duration={150} prompt="Otto, organize o financeiro da minha empresa." /></Sequence>
      <Sequence from={270} durationInFrames={180}><ReconciliationScene duration={180} /></Sequence>
      <Sequence from={450} durationInFrames={150}><ExpensesScene duration={150} /></Sequence>
      <Sequence from={600} durationInFrames={150}><PromptScene duration={150} prompt="Emita a nota desta venda e envie ao cliente." /></Sequence>
      <Sequence from={750} durationInFrames={120}><InvoiceScene duration={120} /></Sequence>
      <Sequence from={870} durationInFrames={150}><CollectionsScene duration={150} /></Sequence>
      <Sequence from={1020} durationInFrames={150}><FiscalScene duration={150} /></Sequence>
      <Sequence from={1170} durationInFrames={180}><CompatibilityScene duration={180} /></Sequence>
      <Sequence from={1350} durationInFrames={150}><OutroScene duration={150} /></Sequence>
    </AbsoluteFill>
  )
}
