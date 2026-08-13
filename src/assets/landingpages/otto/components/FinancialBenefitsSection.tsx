import type { CSSProperties } from 'react'
import {
  SiClaude,
  SiDropbox,
  SiGoogleads,
  SiIfood,
  SiMeta,
  SiOpenai,
  SiSlack,
  SiUber,
} from '@icons-pack/react-simple-icons'
import {
  BarChart3,
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Landmark,
  Mail,
  MessageCircle,
  MessageSquareText,
  ReceiptText,
  Send,
  Tags,
  TrendingUp,
} from 'lucide-react'

import styles from '@/assets/landingpages/otto/components/FinancialBenefitsSection.module.css'

const reminderChannels = [
  { icon: MessageCircle, label: 'WhatsApp', detail: 'Entregue', delay: '0s' },
  { icon: Mail, label: 'E-mail', detail: 'Aberto', delay: '1.1s' },
  { icon: MessageSquareText, label: 'SMS', detail: 'Enviado', delay: '2.2s' },
]

const reportBars = [38, 54, 46, 68, 61, 82, 74, 92]

const expenseRows = [
  { amount: 'R$ 2.480,00', category: 'Marketing', color: '#4285F4', icon: SiGoogleads, merchant: 'Google Ads' },
  { amount: 'R$ 1.890,00', category: 'Marketing', color: '#0866FF', icon: SiMeta, merchant: 'Meta Ads' },
  { amount: 'R$ 84,90', category: 'Transporte', color: '#000000', icon: SiUber, merchant: 'Uber' },
  { amount: 'R$ 126,40', category: 'Alimentação', color: '#EA1D2C', icon: SiIfood, merchant: 'iFood' },
  { amount: 'R$ 99,00', category: 'Software', color: '#0061FF', icon: SiDropbox, merchant: 'Dropbox' },
  { amount: 'R$ 64,90', category: 'Software', color: '#4A154B', icon: SiSlack, merchant: 'Slack' },
]

function CollectionAnimation() {
  return (
    <div className={`${styles.demo} ${styles.collectionDemo}`} role="img" aria-label="Cobrança automática enviada por WhatsApp, e-mail e SMS até a confirmação do pagamento">
      <div className={styles.demoHeader}>
        <span className={styles.iconBox}><ReceiptText aria-hidden="true" /></span>
        <div>
          <p className={styles.demoTitle}>Cobrança #2841</p>
          <p className={styles.demoMeta}>Mercado Horizonte</p>
        </div>
        <span className={styles.openStatus}>A receber</span>
      </div>

      <div className={styles.amountRow}>
        <div><span>Valor</span><strong>R$ 2.480,00</strong></div>
        <div><span>Vencimento</span><strong>Hoje</strong></div>
      </div>

      <div className={styles.reminderTimeline}>
        <p className={styles.timelineLabel}>Régua automática</p>
        {reminderChannels.map((channel) => {
          const Icon = channel.icon
          return (
            <div
              key={channel.label}
              className={styles.channelRow}
              style={{ '--animation-delay': channel.delay } as CSSProperties}
            >
              <span className={styles.channelIcon}><Icon aria-hidden="true" /></span>
              <span><strong>{channel.label}</strong><small>Lembrete automático</small></span>
              <span className={styles.channelResult}><Check aria-hidden="true" />{channel.detail}</span>
            </div>
          )
        })}
      </div>

      <div className={styles.paymentConfirmed}>
        <CheckCircle2 aria-hidden="true" />
        <span><strong>Pagamento recebido</strong><small>Baixa registrada automaticamente</small></span>
      </div>
    </div>
  )
}

function PayablesAnimation() {
  return (
    <div className={`${styles.demo} ${styles.payablesDemo}`} role="img" aria-label="Conta agendada e paga automaticamente antes do vencimento">
      <div className={styles.demoHeader}>
        <span className={`${styles.iconBox} ${styles.amberIcon}`}><CalendarClock aria-hidden="true" /></span>
        <div>
          <p className={styles.demoTitle}>Agenda de pagamentos</p>
          <p className={styles.demoMeta}>Próximos vencimentos</p>
        </div>
        <span className={styles.secureStatus}>Programado</span>
      </div>

      <div className={styles.calendarTrack}>
        <span><small>SEG</small><strong>12</strong></span>
        <span className={styles.activeDay}><small>TER</small><strong>13</strong></span>
        <span><small>QUA</small><strong>14</strong></span>
        <i className={styles.calendarMarker} aria-hidden="true" />
      </div>

      <div className={styles.payableItem}>
        <span className={styles.payableLogo}>EN</span>
        <span><strong>Energia da unidade</strong><small>Conta operacional · vence dia 13</small></span>
        <strong>R$ 1.286,40</strong>
      </div>

      <div className={styles.scheduleProgress}>
        <div className={styles.progressHeader}><span>Pagamento automático</span><span>Agendado para 08:00</span></div>
        <div className={styles.progressTrack}><i aria-hidden="true" /></div>
        <div className={styles.progressSteps}>
          <span><i />Agendado</span>
          <span><i />Processando</span>
          <span><i />Pago</span>
        </div>
      </div>

      <div className={styles.paidStamp}><CheckCircle2 aria-hidden="true" />Pago no prazo</div>
    </div>
  )
}

function ReportsAnimation() {
  return (
    <div className={`${styles.demo} ${styles.reportsDemo}`} role="img" aria-label="Relatório financeiro em tempo real com receita, margem e evolução mensal">
      <div className={styles.demoHeader}>
        <span className={`${styles.iconBox} ${styles.blueIcon}`}><BarChart3 aria-hidden="true" /></span>
        <div>
          <p className={styles.demoTitle}>Visão financeira</p>
          <p className={styles.demoMeta}>Atualizado agora</p>
        </div>
        <span className={styles.liveStatus}><i />Ao vivo</span>
      </div>

      <div className={styles.metricsGrid}>
        <div><span>Receita</span><strong>R$ 184.620</strong><small><TrendingUp aria-hidden="true" /> 12,8%</small></div>
        <div><span>Margem</span><strong>31,4%</strong><small><TrendingUp aria-hidden="true" /> 4,2%</small></div>
        <div><span>Resultado</span><strong>R$ 57.971</strong><small><TrendingUp aria-hidden="true" /> 9,6%</small></div>
      </div>

      <div className={styles.chartArea}>
        <div className={styles.chartHeader}><span>Resultado nos últimos 8 meses</span><strong>+27,6%</strong></div>
        <div className={styles.chart}>
          {reportBars.map((height, index) => (
            <span key={`${height}-${index}`} className={index === reportBars.length - 1 ? styles.currentBar : undefined} style={{ height: `${height}%`, '--bar-delay': `${index * 0.11}s` } as CSSProperties} />
          ))}
        </div>
        <div className={styles.chartLabels}><span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span></div>
      </div>

      <div className={styles.reportFooter}><Clock3 aria-hidden="true" /> Dados consolidados em tempo real <span>Mais de 100 relatórios</span></div>
    </div>
  )
}

function AssistantConversationDemo() {
  return (
    <div className={styles.demo} role="img" aria-label="ChatGPT e Claude conectados ao financeiro da empresa pela Otto">
      <div className="flex min-h-[68px] items-center gap-3 border-b border-[#e3e7e4] bg-[#fbfcfb] px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-[#eceeed] text-[#171918]"><MessageSquareText className="h-4 w-4" /></span>
        <div>
          <p className="text-[13px] font-semibold text-[#282e29]">Otto conectada</p>
          <p className="mt-0.5 text-[11px] text-[#7b837c]">Escolha onde conversar</p>
        </div>
        <div className="ml-auto flex gap-1.5">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#dfe3df] bg-white px-2 text-[10px] font-medium"><SiOpenai className="h-3.5 w-3.5" color="#111111" /> ChatGPT</span>
          <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#eaded9] bg-[#fffaf8] px-2 text-[10px] font-medium"><SiClaude className="h-3.5 w-3.5" color="#D97757" /> Claude</span>
        </div>
      </div>

      <div className="bg-[#f8f9f7] px-4 py-5 sm:px-5">
        <div className="ml-auto max-w-[82%] rounded-lg bg-[#e7eae7] px-4 py-3 text-[12px] leading-5 text-[#343a35]">
          Quais contas vencem esta semana?
        </div>
        <div className="mt-5 max-w-[92%]">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#303630]"><BadgeCheck className="h-4 w-4 text-[#317543]" /> A Otto consultou o financeiro</div>
          <p className="mt-2 text-[12px] leading-5 text-[#626862]">Há quatro contas a pagar nos próximos sete dias, totalizando R$ 8.426,40.</p>
          <div className="mt-3 divide-y divide-[#e3e6e3] rounded-md border border-[#dfe3df] bg-white px-3">
            {[
              ['Energia da unidade', 'R$ 1.286,40'],
              ['Fornecedor Alfa', 'R$ 3.240,00'],
              ['Aluguel', 'R$ 3.900,00'],
            ].map(([label, value]) => (
              <div className="flex items-center justify-between gap-4 py-2.5 text-[11px]" key={label}>
                <span className="text-[#555c56]">{label}</span>
                <strong className="font-semibold text-[#282e29]">{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex min-h-12 items-center border-t border-[#e3e7e4] bg-white px-4 text-[10px] text-[#7c837d]">
        A mesma Otto funciona nos dois assistentes
        <span className="ml-auto inline-flex items-center gap-1 font-semibold text-[#317543]">Dados autorizados <CheckCircle2 className="h-3 w-3" /></span>
      </div>
    </div>
  )
}

function ReconciliationDemo() {
  return (
    <div className={`${styles.demo} min-h-[430px]`} role="img" aria-label="Seis movimentações bancárias conciliadas e despesas classificadas pela Otto">
      <div className="flex min-h-[68px] items-center gap-3 border-b border-[#e3e7e4] bg-[#fbfcfb] px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-[#e7f0f7] text-[#2d6591]"><Landmark className="h-4 w-4" /></span>
        <div>
          <p className="text-[13px] font-semibold text-[#282e29]">Conciliação bancária</p>
          <p className="mt-0.5 text-[11px] text-[#7b837c]">Conta principal · agosto</p>
        </div>
        <span className="ml-auto rounded-md bg-[#e8f3eb] px-2.5 py-1.5 text-[10px] font-semibold text-[#28743d]">6 conciliadas</span>
      </div>

      <div className="grid grid-cols-2 border-b border-[#e5e8e5]">
        <div className="px-4 py-3"><p className="text-[9px] uppercase text-[#858c86]">Movimentações</p><strong className="mt-1 block text-sm">6</strong></div>
        <div className="border-l border-[#e5e8e5] px-4 py-3"><p className="text-[9px] uppercase text-[#858c86]">Classificadas</p><strong className="mt-1 block text-sm text-[#28743d]">100%</strong></div>
      </div>

      <div className="divide-y divide-[#e7eae7] px-4 pb-12">
        {expenseRows.map((expense) => {
          const Icon = expense.icon
          return (
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2.5" key={expense.merchant}>
              <span className="grid h-8 w-8 place-items-center rounded-md border border-[#e4e7e4] bg-white"><Icon className="h-4 w-4" color={expense.color} /></span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-[#303630]">{expense.merchant}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[9px] text-[#737a74]"><Tags className="h-2.5 w-2.5" />{expense.category}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-[#303630]">{expense.amount}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[9px] text-[#28743d]"><Check className="h-2.5 w-2.5" />Conciliada</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InvoiceDemo() {
  return (
    <div className={styles.demo} role="img" aria-label="Nota fiscal preparada pela Otto a partir de um pedido no ChatGPT ou Claude">
      <div className="flex min-h-[68px] items-center gap-3 border-b border-[#e3e7e4] bg-[#fbfcfb] px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-[#f4eee3] text-[#805d1f]"><FileText className="h-4 w-4" /></span>
        <div>
          <p className="text-[13px] font-semibold text-[#282e29]">Nota fiscal de serviço</p>
          <p className="mt-0.5 text-[11px] text-[#7b837c]">Preparada pela Otto</p>
        </div>
        <span className="ml-auto rounded-md bg-[#fff2dc] px-2.5 py-1.5 text-[10px] font-semibold text-[#91601b]">Aguardando confirmação</span>
      </div>

      <div className="bg-[#f8f9f7] px-4 py-4">
        <div className="ml-auto max-w-[84%] rounded-lg bg-[#e7eae7] px-4 py-2.5 text-[11px] leading-5 text-[#343a35]">
          Emita a nota fiscal da venda 317.
        </div>
      </div>

      <div className="px-4 pb-16">
        <p className="flex items-center gap-2 py-3 text-[11px] font-semibold text-[#303630]"><ReceiptText className="h-4 w-4 text-[#805d1f]" /> Dados encontrados pela Otto</p>
        <dl className="divide-y divide-[#e5e8e5] border-y border-[#e3e7e4]">
          {[
            ['Cliente', 'Bruna Schmitz'],
            ['Serviço', 'Consultoria financeira'],
            ['Município', 'Recife, PE'],
            ['Valor', 'R$ 375,00'],
          ].map(([label, value]) => (
            <div className="flex items-center justify-between gap-4 py-2.5 text-[10px]" key={label}>
              <dt className="text-[#7b837c]">{label}</dt>
              <dd className="font-semibold text-[#303630]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex min-h-14 items-center gap-3 border-t border-[#e3e7e4] bg-white px-4">
        <span className="text-[9px] leading-4 text-[#737a74]">Revise antes de transmitir</span>
        <button className="ml-auto inline-flex h-9 items-center gap-2 rounded-md bg-[#181818] px-3 text-[10px] font-semibold text-white" type="button">
          <Send className="h-3.5 w-3.5" /> Confirmar emissão
        </button>
      </div>
    </div>
  )
}

export function FinancialBenefitsSection() {
  return (
    <section id="beneficios" className="scroll-mt-24 border-y border-[#e4e7e3] bg-[#f7f8f6] px-5 py-20 sm:px-8 sm:py-28" aria-label="Recursos financeiros disponíveis pelo ChatGPT e Claude">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-14 border-b border-[#dfe3de] pb-20 lg:grid-cols-2 lg:items-center lg:gap-20 sm:pb-28">
          <div className="max-w-[520px]">
            <span className="text-xs font-medium uppercase text-[#317543]">Cobrança automática</span>
            <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181818] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>
              Receba no Prazo e Reduza a Inadimplência
            </h2>
            <p className="mt-6 text-base font-semibold text-[#303630]" style={{ lineHeight: 1.5 }}>Seus clientes nunca mais vão esquecer um pagamento!</p>
            <p className="mt-3 max-w-[480px] text-[15px] text-[#626862]" style={{ lineHeight: 1.5 }}>
              Envie lembretes automáticos por <strong className="font-semibold text-[#303630]">WhatsApp, e-mail, SMS e receba mais rápido.</strong>
            </p>
          </div>
          <CollectionAnimation />
        </div>

        <div className="grid gap-14 border-b border-[#dfe3de] py-20 lg:grid-cols-2 lg:items-center lg:gap-20 sm:py-28">
          <div className="lg:order-2 lg:justify-self-end">
            <div className="max-w-[520px]">
              <span className="text-xs font-medium uppercase text-[#9a6418]">Contas a pagar</span>
              <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181818] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>
                Pague suas Contas no Prazo e Evite Multas
              </h2>
              <p className="mt-6 max-w-[480px] text-[15px] text-[#626862]" style={{ lineHeight: 1.5 }}>
                Agende pagamentos automaticamente e tenha total controle das suas contas.
              </p>
            </div>
          </div>
          <div className="lg:order-1"><PayablesAnimation /></div>
        </div>

        <div className="grid gap-14 pt-20 lg:grid-cols-2 lg:items-center lg:gap-20 sm:pt-28">
          <div className="max-w-[520px]">
            <span className="text-xs font-medium uppercase text-[#2d6591]">Inteligência de negócio</span>
            <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181818] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>
              Relatórios Claros e em Tempo Real
            </h2>
            <p className="mt-6 text-base font-semibold text-[#303630]" style={{ lineHeight: 1.5 }}>Tenha total controle do seu negócio!</p>
            <p className="mt-3 max-w-[500px] text-[15px] text-[#626862]" style={{ lineHeight: 1.5 }}>
              O sistema conta com mais de 100 relatórios inteligentes que oferecem informações precisas para facilitar suas decisões e aumentar seus lucros.
            </p>
          </div>
          <ReportsAnimation />
        </div>

        <div id="chatgpt-claude" className="scroll-mt-24 grid gap-14 border-t border-[#dfe3de] py-20 lg:grid-cols-2 lg:items-center lg:gap-20 sm:py-28">
          <div className="lg:order-2 lg:justify-self-end">
            <div className="max-w-[520px]">
              <span className="text-xs font-medium uppercase text-[#317543]">ChatGPT e Claude</span>
              <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181818] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>
                Administre sua Empresa pelo ChatGPT ou Claude
              </h2>
              <p className="mt-6 max-w-[500px] text-[15px] text-[#626862]" style={{ lineHeight: 1.5 }}>
                Consulte informações, acompanhe o financeiro e prepare operações conversando com o ChatGPT ou Claude. A Otto encontra os dados e executa tudo com segurança.
              </p>
            </div>
          </div>
          <div className="lg:order-1"><AssistantConversationDemo /></div>
        </div>

        <div className="grid gap-14 border-t border-[#dfe3de] py-20 lg:grid-cols-2 lg:items-center lg:gap-20 sm:py-28">
          <div className="max-w-[520px]">
            <span className="text-xs font-medium uppercase text-[#2d6591]">Automação financeira</span>
            <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181818] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>
              Concilie Movimentações e Classifique Despesas
            </h2>
            <p className="mt-6 max-w-[500px] text-[15px] text-[#626862]" style={{ lineHeight: 1.5 }}>
              A Otto compara as movimentações bancárias com os lançamentos financeiros e classifica cada despesa automaticamente.
            </p>
          </div>
          <ReconciliationDemo />
        </div>

        <div className="grid gap-14 border-t border-[#dfe3de] pt-20 lg:grid-cols-2 lg:items-center lg:gap-20 sm:pt-28">
          <div className="lg:order-2 lg:justify-self-end">
            <div className="max-w-[520px]">
              <span className="text-xs font-medium uppercase text-[#805d1f]">Nota fiscal</span>
              <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181818] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>
                Emita Notas Fiscais sem Complicação
              </h2>
              <p className="mt-6 max-w-[500px] text-[15px] text-[#626862]" style={{ lineHeight: 1.5 }}>
                Peça pelo ChatGPT ou Claude. A Otto identifica a venda e o cliente, preenche os dados e deixa a nota pronta para sua confirmação.
              </p>
            </div>
          </div>
          <div className="lg:order-1"><InvoiceDemo /></div>
        </div>
      </div>
    </section>
  )
}
