import type { CSSProperties } from 'react'
import {
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Mail,
  MessageCircle,
  MessageSquareText,
  ReceiptText,
  TrendingUp,
} from 'lucide-react'

import styles from '@/assets/landingpages/otto/components/FinancialBenefitsSection.module.css'

const reminderChannels = [
  { icon: MessageCircle, label: 'WhatsApp', detail: 'Entregue', delay: '0s' },
  { icon: Mail, label: 'E-mail', detail: 'Aberto', delay: '1.1s' },
  { icon: MessageSquareText, label: 'SMS', detail: 'Enviado', delay: '2.2s' },
]

const reportBars = [38, 54, 46, 68, 61, 82, 74, 92]

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

export function FinancialBenefitsSection() {
  return (
    <section id="controle-financeiro" className="border-y border-[#e4e7e3] bg-[#f7f8f6] px-5 py-20 sm:px-8 sm:py-28" aria-label="Automação e controle financeiro">
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
              <p className="mt-6 text-base font-semibold text-[#303630]" style={{ lineHeight: 1.5 }}>Juros e multas por atraso <strong>NUNCA MAIS!</strong></p>
              <p className="mt-3 max-w-[480px] text-[15px] text-[#626862]" style={{ lineHeight: 1.5 }}>
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
      </div>
    </section>
  )
}
