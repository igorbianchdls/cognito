import { ArrowLeftRight, Copy, FileText, Landmark, QrCode, Tags } from 'lucide-react'
import type { ReactNode } from 'react'
import { Easing, Img, spring, staticFile, useCurrentFrame } from 'remotion'

import {
  brl,
  Card,
  DISPLAY,
  ExpensesScene,
  GRAY,
  Headline,
  INK,
  INK_MUTED,
  InvoiceScene,
  OttoIcon,
  OttoNotification,
  p,
  PhoneFrame,
  ReconciliationScene,
  ReelRoot,
  type ReelScene,
  Scene,
  sceneDuration,
  TERRA,
  useSpring,
  WA,
  WaBubble,
  WaChatHeader,
  WaInputBar,
  WaTyping,
  WhatsAppScene,
  WHITE,
} from './OttoContadoresReel'
import {
  ChatGptWindow,
  CheckBadge,
  makeChatListScene,
  makeClaudeAlsoScene,
  makeCta,
  makeHookScene,
  makeMoreScenes,
  makePromptScene,
  makeRevealScene,
  money,
  WhatsAppDeliveryScene,
} from './OttoNotaFiscalChatGptVideos'

const OVERDUE_RED = { background: '#fbe9e4', color: '#c4452b' }
const OPEN_AMBER = { background: '#fcf0d6', color: '#c98a0c' }
const PAID_GREEN = { background: '#ddf2ec', color: '#14946b' }

function DateChip({ label }: { label: string }) {
  return <span style={{ alignSelf: 'center', background: WA.incoming, borderRadius: 12, boxShadow: '0 1px 1px rgba(11,20,26,0.1)', color: WA.meta, fontSize: 19, fontWeight: 500, padding: '7px 16px' }}>{label}</span>
}

function Pill({ children, tone }: { children: ReactNode; tone: { background: string; color: string } }) {
  return <span style={{ alignItems: 'center', background: tone.background, borderRadius: 99, color: tone.color, display: 'inline-flex', flex: 'none', fontSize: 22, fontWeight: 700, gap: 6, padding: '8px 16px' }}>{children}</span>
}

function StatementScene({ duration, marks, text }: { duration: number; marks: { at: number; kind: 'strike' | 'underline'; word: string }[]; text: string }) {
  return (
    <Scene duration={duration}>
      <Headline marks={marks} size={104} start={0} text={text} style={{ top: 760 }} />
    </Scene>
  )
}

// ═══ Vídeo: Cobrança ═════════════════════════════════════════════════════════

const DEBTORS = [
  { days: 12, initials: 'LC', invoice: '2210', name: 'Lume Comércio', value: 2480 },
  { days: 8, initials: 'BV', invoice: '2214', name: 'Boa Vista Engenharia', value: 3150 },
  { days: 21, initials: 'CS', invoice: '2197', name: 'Café Serra Azul', value: 1290 },
  { days: 5, initials: 'SP', invoice: '2219', name: 'Studio Prisma', value: 4600 },
  { days: 15, initials: 'NL', invoice: '2205', name: 'Norte Logística', value: 5210 },
  { days: 3, initials: 'MP', invoice: '2223', name: 'Mundo Pet', value: 1700 },
]
const OVERDUE_TOTAL = DEBTORS.reduce((sum, debtor) => sum + debtor.value, 0)

function OverdueScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const total = OVERDUE_TOTAL * p(frame, 30, 70, [0, 1], Easing.out(Easing.quad))

  return (
    <Scene duration={duration}>
      <Headline highlight={['dias']} size={76} stagger={2} start={0} text="Ele encontra quem deve, quanto e há quantos dias." style={{ top: 170 }} />
      <div style={{ left: 0, opacity: p(frame, 24, 34), position: 'absolute', right: 0, textAlign: 'center', top: 480 }}>
        <span style={{ color: TERRA, display: 'block', fontFamily: DISPLAY, fontSize: 150, fontStyle: 'italic', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{money(total)}</span>
        <span style={{ color: INK_MUTED, display: 'block', fontSize: 30, fontWeight: 600, marginTop: 8 }}>parados com {DEBTORS.length} clientes</span>
      </div>
      <Card style={{ left: 70, opacity: p(frame, 6, 16), padding: '6px 34px', right: 70, top: 750 }}>
        {DEBTORS.map((debtor, i) => {
          const o = p(frame, 10 + i * 5, 22 + i * 5)
          const days = Math.round(debtor.days * p(frame, 14 + i * 5, 34 + i * 5))
          return (
            <div key={debtor.invoice} style={{ alignItems: 'center', borderTop: i === 0 ? 'none' : `2px solid ${GRAY}33`, display: 'flex', gap: 20, height: 104, opacity: o, transform: `translateX(${(1 - o) * 30}px)` }}>
              <span style={{ alignItems: 'center', background: '#efeee8', borderRadius: 16, color: INK_MUTED, display: 'flex', flex: 'none', fontSize: 21, fontWeight: 700, height: 60, justifyContent: 'center', width: 60 }}>{debtor.initials}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 29, fontWeight: 600 }}>{debtor.name}</span>
                <span style={{ color: INK_MUTED, display: 'block', fontSize: 21 }}>Fatura #{debtor.invoice} · {money(debtor.value)}</span>
              </div>
              <Pill tone={OVERDUE_RED}>{days} dias</Pill>
            </div>
          )
        })}
      </Card>
    </Scene>
  )
}

const BulkCollectScene = makeChatListScene({
  badge: (count) => `${count} cobranças`,
  highlight: ['educada'],
  icon: <QrCode size={22} strokeWidth={2.2} style={{ flex: 'none' }} />,
  notification: `${DEBTORS.length} cobranças enviadas. Te aviso quando cada uma for paga.`,
  rows: DEBTORS.map((debtor) => ({ initials: debtor.initials, line: `Pix e boleto · ${money(debtor.value)}`, name: debtor.name })),
  title: 'Uma mensagem educada pra cada cliente, com Pix e boleto.',
})

function PaidScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const bank = useSpring(8, { damping: 15, stiffness: 150 })
  const draw = p(frame, 24, 40, [0, 1], Easing.inOut(Easing.cubic))
  const paid = frame >= 44
  const stamp = spring({ config: { damping: 10, stiffness: 170 }, fps: 30, frame: frame - 52 })
  const received = 9860 * p(frame, 62, 92, [0, 1], Easing.out(Easing.quad))
  const count = Math.round(3 * p(frame, 62, 92))

  return (
    <Scene duration={duration}>
      <Headline highlight={['sozinho']} size={76} stagger={2} start={0} text="Cliente pagou? Ele identifica o Pix e dá baixa sozinho." style={{ top: 170 }} />
      <Card style={{ alignItems: 'center', display: 'flex', gap: 24, left: 90, opacity: bank, padding: '30px 34px', right: 90, top: 540, transform: `translateX(${(1 - bank) * 120}px)` }}>
        <Img src={staticFile('brand-logos/banks/itau.svg')} style={{ flex: 'none', height: 72, width: 72 }} />
        <div style={{ flex: 1 }}>
          <span style={{ color: INK_MUTED, display: 'block', fontSize: 23, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Extrato · PIX recebido</span>
          <span style={{ display: 'block', fontSize: 30, fontWeight: 600, marginTop: 4 }}>LUME COMERCIO LTDA</span>
        </div>
        <span style={{ color: PAID_GREEN.color, fontSize: 36, fontWeight: 700 }}>+ R$ 2.480</span>
      </Card>
      <svg height={1920} style={{ left: 0, position: 'absolute', top: 0 }} width={1080}>
        <line pathLength={1} stroke={draw >= 1 ? TERRA : GRAY} strokeDasharray={1} strokeDashoffset={1 - draw} strokeLinecap="round" strokeWidth={5} x1={540} x2={540} y1={720} y2={860} />
        {frame > 40 && frame < 60 ? <circle cx={540} cy={720 + 140 * (((frame - 40) % 12) / 12)} fill={TERRA} r={10} /> : null}
      </svg>
      <Card style={{ border: `2px solid ${paid ? TERRA : `${GRAY}66`}`, left: 90, opacity: p(frame, 16, 26), padding: '30px 34px', right: 90, top: 860 }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: INK_MUTED, fontSize: 23, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Contas a receber</span>
          <Pill tone={paid ? PAID_GREEN : OPEN_AMBER}>{paid ? 'Paga' : 'Em aberto'}</Pill>
        </div>
        <span style={{ display: 'block', fontSize: 32, fontWeight: 600, marginTop: 14 }}>Fatura #2210 · Lume Comércio</span>
        <span style={{ display: 'block', fontSize: 44, fontWeight: 700, marginTop: 6 }}>R$ 2.480,00</span>
      </Card>
      {frame >= 52 ? (
        <div style={{ border: `6px solid ${TERRA}`, borderRadius: 18, color: TERRA, fontSize: 52, fontWeight: 800, left: 560, letterSpacing: '0.05em', opacity: Math.min(1, stamp * 1.4), padding: '6px 24px', position: 'absolute', top: 1020, transform: `rotate(-8deg) scale(${2.2 - stamp * 1.2})` }}>
          BAIXA FEITA
        </div>
      ) : null}
      <div style={{ alignItems: 'baseline', display: 'flex', gap: 20, justifyContent: 'center', left: 0, opacity: p(frame, 58, 68), position: 'absolute', right: 0, top: 1250 }}>
        <span style={{ color: INK_MUTED, fontSize: 30, fontWeight: 600 }}>Recebido hoje</span>
        <span style={{ color: TERRA, fontFamily: DISPLAY, fontSize: 96, fontStyle: 'italic', fontVariantNumeric: 'tabular-nums' }}>{money(received)}</span>
      </div>
      <span style={{ color: INK_MUTED, fontSize: 28, fontWeight: 600, left: 0, opacity: p(frame, 62, 72), position: 'absolute', right: 0, textAlign: 'center', top: 1380 }}>
        {count} de {DEBTORS.length} clientes já pagaram
      </span>
    </Scene>
  )
}

function ReminderScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const read = frame >= 56
  const typing = frame >= 60 && frame < 74

  return (
    <Scene duration={duration}>
      <Headline highlight={['vergonha']} size={72} stagger={2} start={0} text="Quem não pagou, ele lembra de novo. Sem você passar vergonha." style={{ top: 140 }} />
      <PhoneFrame style={{ opacity: p(frame, 4, 16), top: 480, transform: `translateY(${p(frame, 4, 20, [60, 0])}px)` }}>
        <WaChatHeader initials="BV" name="Boa Vista Engenharia" status={typing ? 'digitando…' : 'visto por último hoje às 08:12'} />
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 8, justifyContent: 'flex-end', padding: '18px 30px' }}>
          <DateChip label="Segunda" />
          <WaBubble at={4} buttons={[{ icon: <Copy size={26} strokeWidth={2.2} />, label: 'Copiar código Pix' }]} out read tail time="09:00">
            Olá! A fatura de <strong>R$ 3.150,00</strong> vence hoje. Segue o Pix:
          </WaBubble>
          {frame >= 24 ? <div style={{ height: 6 }} /> : null}
          {frame >= 24 ? <DateChip label="Hoje" /> : null}
          <WaBubble
            at={34}
            buttons={[
              { icon: <Copy size={26} strokeWidth={2.2} />, label: 'Copiar código Pix' },
              { icon: <FileText size={26} strokeWidth={2.2} />, label: 'Ver boleto' },
            ]}
            out
            read={read}
            tail
            time="09:00"
          >
            Oi! Passando pra lembrar da fatura de <strong>R$ 3.150,00</strong>, vencida há 3 dias. Se precisar, o Pix tá aqui:
          </WaBubble>
          {typing ? <WaTyping /> : null}
          {frame >= 74 ? <div style={{ height: 8 }} /> : null}
          <WaBubble at={74} tail time="09:07">
            Desculpa a demora! Pagando agora.
          </WaBubble>
        </div>
        <WaInputBar />
        <OttoNotification at={90} text="Pagamento recebido: R$ 3.150,00 de Boa Vista Engenharia. Baixa feita." />
      </PhoneFrame>
    </Scene>
  )
}

const COLLECT_MORE_TASKS = ['Notas fiscais', 'Conciliação bancária', 'Despesas']

const COBRANCA_SCENES: ReelScene[] = [
  { Component: makeHookScene('O ChatGPT agora cobra os clientes que te devem.', ['devem'], 96, 'Direto no WhatsApp.'), duration: 105 },
  { Component: makePromptScene('Você pergunta:', 'Quem tá me devendo?', `Encontrei ${DEBTORS.length} clientes em atraso`), duration: 95 },
  { Component: OverdueScene, duration: 115 },
  { Component: makePromptScene('Aí você só fala:', 'Cobra todo mundo', 'Cobranças enviadas pelo WhatsApp'), duration: 85 },
  { Component: BulkCollectScene, duration: 100 },
  { Component: PaidScene, duration: 110 },
  { Component: ReminderScene, duration: 120 },
  ...makeMoreScenes('E não para na cobrança.', ['cobrança'], [
    { Component: ({ duration }) => <InvoiceScene duration={duration} index={0} tasks={COLLECT_MORE_TASKS} title="Emite suas notas fiscais." />, duration: 100 },
    { Component: ({ duration }) => <ReconciliationScene duration={duration} index={1} tasks={COLLECT_MORE_TASKS} title="Concilia seu banco." />, duration: 100 },
    { Component: ({ duration }) => <ExpensesScene duration={duration} index={2} tasks={COLLECT_MORE_TASKS} title="Classifica suas despesas." />, duration: 95 },
  ]),
  { Component: makeRevealScene(['Sem planilha', 'Sem constrangimento', 'Sem dinheiro parado']), duration: 140 },
  { Component: makeClaudeAlsoScene(), duration: 75 },
  { Component: makeCta('Quer parar de correr atrás de cliente?', { comment: 'Cobrança', highlight: ['cliente'], keyword: 'COBRANÇA' }), duration: 120 },
]

// ═══ Vídeo: Funcionário de R$ 0 ══════════════════════════════════════════════

function BadgeHookScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const drop = useSpring(14, { damping: 12, stiffness: 110 })
  const swing = frame > 14 ? Math.sin((frame - 14) / 6) * 7 * Math.exp(-(frame - 14) / 30) : 0
  const salary = spring({ config: { damping: 10, stiffness: 180 }, fps: 30, frame: frame - 62 })

  return (
    <Scene duration={duration}>
      <Headline highlight={['ia']} size={84} start={0} text="Contratei uma IA pra cuidar do meu financeiro." style={{ top: 190 }} />
      <div style={{ height: 760, left: 230, position: 'absolute', top: 580, transform: `translateY(${(1 - drop) * -700}px) rotate(${swing}deg)`, transformOrigin: '50% -40px', width: 620 }}>
        <div style={{ background: GRAY, borderRadius: 10, height: 50, left: 250, position: 'absolute', top: -40, width: 120 }} />
        <div style={{ background: WHITE, border: `2px solid ${GRAY}66`, borderRadius: 40, boxShadow: '0 40px 80px rgba(20,20,19,0.14)', height: '100%', overflow: 'hidden', position: 'relative' }}>
          <div style={{ alignItems: 'flex-end', background: TERRA, color: WHITE, display: 'flex', fontSize: 26, fontWeight: 700, height: 150, justifyContent: 'center', letterSpacing: '0.2em', paddingBottom: 22 }}>
            OTTO · FINANCEIRO
          </div>
          <div style={{ background: TERRA, borderRadius: 99, height: 26, left: 250, position: 'absolute', top: 26, width: 120 }}>
            <div style={{ background: '#f5f4ef', borderRadius: 99, inset: 4, position: 'absolute' }} />
          </div>
          <div style={{ alignItems: 'center', background: '#f5f4ef', border: `6px solid ${WHITE}`, borderRadius: 99, display: 'flex', height: 170, justifyContent: 'center', left: 225, position: 'absolute', top: 100, width: 170 }}>
            <OttoIcon size={96} />
          </div>
          <div style={{ marginTop: 130, textAlign: 'center' }}>
            <span style={{ display: 'block', fontFamily: DISPLAY, fontSize: 96, lineHeight: 1 }}>Otto</span>
            <span style={{ color: INK_MUTED, display: 'block', fontSize: 28, fontWeight: 600, marginTop: 8 }}>Analista financeira · IA</span>
          </div>
          <div style={{ borderTop: `2px dashed ${GRAY}66`, margin: '34px 50px 0', paddingTop: 26 }}>
            <div style={{ alignItems: 'baseline', display: 'flex', justifyContent: 'space-between', opacity: p(frame, 40, 50) }}>
              <span style={{ color: INK_MUTED, fontSize: 24, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Horário</span>
              <span style={{ fontSize: 34, fontWeight: 700 }}>24h, todos os dias</span>
            </div>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 22, opacity: p(frame, 54, 62) }}>
              <span style={{ color: INK_MUTED, fontSize: 24, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Salário</span>
              <span style={{ color: TERRA, display: 'inline-block', fontFamily: DISPLAY, fontSize: 86, fontStyle: 'italic', lineHeight: 1, transform: `scale(${frame >= 62 ? 2 - salary : 1})` }}>R$ 0</span>
            </div>
          </div>
        </div>
      </div>
      <span style={{ color: INK_MUTED, fontFamily: DISPLAY, fontSize: 66, fontStyle: 'italic', left: 0, opacity: p(frame, 78, 92), position: 'absolute', right: 0, textAlign: 'center', top: 1420 }}>
        Trabalha 24h e não cobra salário.
      </span>
    </Scene>
  )
}

const MORNING_TASKS = [
  { bg: '#e3ecfb', color: '#2f6bd8', detail: '6 bancos · saldo atualizado', icon: <Landmark size={36} strokeWidth={2} />, time: '06:02', title: 'Contas sincronizadas' },
  { bg: '#ddf2ec', color: '#14946b', detail: '42 lançamentos conferidos', icon: <ArrowLeftRight size={36} strokeWidth={2} />, time: '06:15', title: 'Banco conciliado' },
  { bg: '#fcf0d6', color: '#c98a0c', detail: '18 despesas novas', icon: <Tags size={36} strokeWidth={2} />, time: '06:31', title: 'Despesas classificadas' },
]

function MorningScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const minutes = Math.round(57 + 3 * p(frame, 0, 18, [0, 1], Easing.linear))
  const clock = minutes >= 60 ? '07:00' : `06:${String(minutes).padStart(2, '0')}`

  return (
    <Scene duration={duration}>
      <Headline highlight={['tudo']} size={84} start={0} text="Toda manhã, ela já fez tudo." style={{ top: 200 }} />
      <div style={{ left: 0, opacity: p(frame, 4, 14), position: 'absolute', right: 0, textAlign: 'center', top: 440 }}>
        <span style={{ display: 'block', fontSize: 140, fontVariantNumeric: 'tabular-nums', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{clock}</span>
        <span style={{ color: INK_MUTED, display: 'block', fontSize: 30, fontWeight: 600, marginTop: 12 }}>Bom dia! Seu financeiro já está em dia.</span>
      </div>
      <Card style={{ left: 80, opacity: p(frame, 16, 26), padding: '10px 36px', right: 80, top: 720 }}>
        {MORNING_TASKS.map((task, i) => {
          const o = p(frame, 22 + i * 12, 34 + i * 12)
          const check = spring({ config: { damping: 11, stiffness: 200 }, fps: 30, frame: frame - 36 - i * 12 })
          return (
            <div key={task.title} style={{ alignItems: 'center', borderTop: i === 0 ? 'none' : `2px solid ${GRAY}44`, display: 'flex', gap: 24, opacity: o, padding: '30px 0', transform: `translateX(${(1 - o) * 30}px)` }}>
              <span style={{ alignItems: 'center', background: task.bg, borderRadius: 20, color: task.color, display: 'flex', flex: 'none', height: 80, justifyContent: 'center', width: 80 }}>{task.icon}</span>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 34, fontWeight: 650 }}>{task.title}</span>
                <span style={{ color: INK_MUTED, display: 'block', fontSize: 25, marginTop: 4 }}>{task.detail} · {task.time}</span>
              </div>
              <span style={{ transform: `scale(${frame >= 36 + i * 12 ? check : 0})` }}>
                <CheckBadge size={52} />
              </span>
            </div>
          )
        })}
      </Card>
      <span style={{ color: INK_MUTED, fontFamily: DISPLAY, fontSize: 62, fontStyle: 'italic', left: 0, opacity: p(frame, 76, 90), position: 'absolute', right: 0, textAlign: 'center', top: 1340 }}>
        Enquanto você dormia.
      </span>
    </Scene>
  )
}

const PROFIT = { expenses: 61230, revenue: 96480 }

function ProfitAnswer({ sendAt }: { sendAt: number }) {
  const frame = useCurrentFrame()
  const t = p(frame, sendAt + 14, sendAt + 44, [0, 1], Easing.out(Easing.quad))
  const profit = PROFIT.revenue - PROFIT.expenses
  const rows = [
    { color: INK, label: 'Faturamento', value: PROFIT.revenue },
    { color: GRAY, label: 'Despesas', value: PROFIT.expenses },
    { color: TERRA, label: 'Lucro', value: profit },
  ]

  return (
    <div style={{ opacity: p(frame, sendAt + 8, sendAt + 16) }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 14, marginBottom: 18 }}>
        <span style={{ alignItems: 'center', background: WHITE, border: `2px solid ${GRAY}88`, borderRadius: 99, display: 'flex', height: 54, justifyContent: 'center', width: 54 }}>
          <OttoIcon size={32} />
        </span>
        <span style={{ fontSize: 28, fontWeight: 600 }}>Resumo de outubro</span>
      </div>
      <div style={{ background: '#fafaf7', border: `2px solid ${GRAY}55`, borderRadius: 28, padding: '26px 30px' }}>
        {rows.map((row) => (
          <div key={row.label} style={{ marginBottom: 18 }}>
            <div style={{ alignItems: 'baseline', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: INK_MUTED, fontSize: 25, fontWeight: 600 }}>{row.label}</span>
              <span style={{ color: row.label === 'Lucro' ? TERRA : INK, fontSize: row.label === 'Lucro' ? 44 : 32, fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{brl(row.value * t)}</span>
            </div>
            <div style={{ background: `${GRAY}33`, borderRadius: 99, height: 12, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ background: row.color, borderRadius: 99, height: '100%', width: `${(row.value / PROFIT.revenue) * 100 * t}%` }} />
            </div>
          </div>
        ))}
        <span style={{ background: '#fbe9e4', borderRadius: 99, color: TERRA, display: 'inline-block', fontSize: 24, fontWeight: 700, opacity: p(frame, sendAt + 40, sendAt + 50), padding: '8px 18px' }}>
          Margem de {((profit / PROFIT.revenue) * 100).toFixed(1).replace('.', ',')}%
        </span>
      </div>
    </div>
  )
}

function ProfitScene({ duration }: { duration: number }) {
  return (
    <Scene duration={duration}>
      <Headline highlight={['perguntar']} size={76} stagger={2} start={0} text="Quer saber como tá a empresa? É só perguntar." style={{ top: 180 }} />
      <ChatGptWindow prompt="Quanto eu lucrei esse mês?" response={(sendAt) => <ProfitAnswer sendAt={sendAt} />} />
    </Scene>
  )
}

const FUNCIONARIO_SCENES: ReelScene[] = [
  { Component: BadgeHookScene, duration: 135 },
  { Component: MorningScene, duration: 115 },
  { Component: ({ duration }) => <InvoiceScene duration={duration} tasks={[]} title="Vendeu? Ela emite a nota fiscal." />, duration: 100 },
  { Component: WhatsAppDeliveryScene, duration: 100 },
  { Component: ({ duration }) => <WhatsAppScene duration={duration} tasks={[]} title="Cliente atrasou? Ela cobra e te avisa." />, duration: 105 },
  { Component: ProfitScene, duration: 130 },
  { Component: ({ duration }) => <StatementScene duration={duration} marks={[{ at: 26, kind: 'strike', word: 'planilha' }]} text="Sem planilha e sem esquecer nada." />, duration: 80 },
  { Component: makeRevealScene([], 'O nome dela é'), duration: 110 },
  { Component: makeClaudeAlsoScene('E no Claude também.'), duration: 70 },
  { Component: makeCta('Quer uma dessas trabalhando pra você?', { comment: 'IA', highlight: ['você'], keyword: 'IA' }), duration: 120 },
]

export const OTTO_COBRANCA_REEL_DURATION = sceneDuration(COBRANCA_SCENES)
export const OTTO_FUNCIONARIO_REEL_DURATION = sceneDuration(FUNCIONARIO_SCENES)

export function OttoCobrancaReel() {
  return <ReelRoot scenes={COBRANCA_SCENES} />
}

export function OttoFuncionarioReel() {
  return <ReelRoot scenes={FUNCIONARIO_SCENES} />
}
