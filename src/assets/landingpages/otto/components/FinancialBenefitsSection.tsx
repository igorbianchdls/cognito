import type { CSSProperties } from 'react'
import { SiClaude, SiOpenai } from '@icons-pack/react-simple-icons'
import {
  Check,
  ChevronDown,
  CircleDollarSign,
  FileText,
  Landmark,
  Mail,
  MessageCircle,
  MessageSquareText,
  MousePointer2,
  Send,
  Smartphone,
  Tags,
} from 'lucide-react'

import styles from '@/assets/landingpages/otto/components/FinancialBenefitsSection.module.css'

function CollectionAnimation() {
  return (
    <div className={`${styles.demo} ${styles.caReferenceDemo} ${styles.caCollectionDemo}`} role="img" aria-label="Canais de cobrança automática por WhatsApp, SMS e e-mail">
      <div className={styles.caTopLine}><i /></div>
      <div className={styles.caChannelCards}>
        <div className={`${styles.caChannelCard} ${styles.caCardOne}`}>
          <span className={styles.caCardHeader}><i /><b /></span>
          <span className={styles.caIllustration}><MessageCircle aria-hidden="true" /></span>
          <i className={styles.caCardFooter} />
        </div>
        <div className={`${styles.caChannelCard} ${styles.caCardTwo}`}>
          <span className={styles.caCardHeader}><i /><b /></span>
          <span className={styles.caIllustration}><Smartphone aria-hidden="true" /><em>SMS</em></span>
          <i className={styles.caCardFooter} />
        </div>
        <div className={`${styles.caChannelCard} ${styles.caCardThree}`}>
          <span className={styles.caCardHeader}><i /><b /></span>
          <span className={styles.caIllustration}><CircleDollarSign aria-hidden="true" /><em>PIX</em></span>
          <i className={styles.caCardFooter} />
        </div>
      </div>
      <span className={`${styles.caFloatingChannel} ${styles.caChatChannel}`}><MessageSquareText aria-hidden="true" /></span>
      <span className={`${styles.caFloatingChannel} ${styles.caWhatsappChannel}`}><MessageCircle aria-hidden="true" /></span>
      <span className={`${styles.caFloatingChannel} ${styles.caEmailChannel}`}><Mail aria-hidden="true" /></span>
      <div className={styles.caBottomBar}><i /><button type="button">Enviar</button></div>
      <MousePointer2 aria-hidden="true" className={styles.caCollectionPointer} />
    </div>
  )
}

function PayablesAnimation() {
  return (
    <div className={`${styles.demo} ${styles.caReferenceDemo} ${styles.caPayablesDemo}`} role="img" aria-label="Formulário de pagamento preenchido e agendado automaticamente">
      <div className={styles.caPaymentForm}>
        <div className={styles.caFormTitle}><i /></div>
        <div className={styles.caFormRule} />
        <div className={styles.caFormGrid}>
          <span className={`${styles.caField} ${styles.caDateField}`}><i /><b /></span>
          <span className={styles.caField}><i /><ChevronDown aria-hidden="true" /></span>
          <span className={`${styles.caField} ${styles.caWideField}`}><i /></span>
          <span className={`${styles.caField} ${styles.caMoneyField}`}><b>R$</b><i /></span>
          <span className={styles.caToggle}><i /><b /></span>
          <span className={styles.caField}><i /><ChevronDown aria-hidden="true" /></span>
          <span className={styles.caField}><i /><ChevronDown aria-hidden="true" /></span>
          <span className={styles.caField}><i /></span>
        </div>
        <div className={styles.caFormDivider} />
        <div className={styles.caFormSubtitle}><i /><span><b /></span></div>
        <div className={styles.caFormGridBottom}>
          <span className={styles.caField}><i /><ChevronDown aria-hidden="true" /></span>
          <span className={`${styles.caField} ${styles.caDateField}`}><i /><b /></span>
          <span className={styles.caField}><i /><ChevronDown aria-hidden="true" /></span>
          <span className={styles.caField}><i /><ChevronDown aria-hidden="true" /></span>
          <span className={styles.caCheckbox}><b /></span><i className={styles.caMiniLine} />
          <span className={styles.caCheckbox}><b /></span><i className={styles.caMiniLine} />
        </div>
        <div className={styles.caFormAction}><i /><button type="button">Agendar</button></div>
      </div>
      <MousePointer2 aria-hidden="true" className={styles.caPaymentPointer} />
      <div className={styles.caPaymentSuccess}><Check aria-hidden="true" /></div>
    </div>
  )
}

function ReportsAnimation() {
  return (
    <div className={`${styles.demo} ${styles.caReferenceDemo} ${styles.caReportsDemo}`} role="img" aria-label="Dois relatórios financeiros animados em tempo real">
      <div className={`${styles.caChartCard} ${styles.caChartCardPrimary}`}>
        <div className={styles.caChartCardHeader}><i /><span><b /><b /><b /></span></div>
        <div className={styles.caChartPlot}>
          <span style={{ '--chart-height': '58%' } as CSSProperties} /><span style={{ '--chart-height': '78%' } as CSSProperties} /><span style={{ '--chart-height': '44%' } as CSSProperties} /><span style={{ '--chart-height': '64%' } as CSSProperties} /><span style={{ '--chart-height': '73%' } as CSSProperties} />
          <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 200 80"><polyline points="8,49 50,31 92,56 134,39 184,22" /><circle cx="8" cy="49" r="3" /><circle cx="50" cy="31" r="3" /><circle cx="92" cy="56" r="3" /><circle cx="134" cy="39" r="3" /><circle cx="184" cy="22" r="3" /></svg>
        </div>
        <div className={styles.caChartLegend}><span /><i /><span /><i /><span /></div>
      </div>
      <div className={`${styles.caChartCard} ${styles.caChartCardSecondary}`}>
        <div className={styles.caChartCardHeader}><i /><span><b /><b /><b /></span></div>
        <div className={`${styles.caChartPlot} ${styles.caSimpleChart}`}>
          <span style={{ '--chart-height': '78%' } as CSSProperties} /><span style={{ '--chart-height': '39%' } as CSSProperties} /><span style={{ '--chart-height': '64%' } as CSSProperties} /><span style={{ '--chart-height': '72%' } as CSSProperties} />
        </div>
        <div className={styles.caChartLegend}><span /><i /><span /><i /><span /></div>
      </div>
    </div>
  )
}

function AssistantConversationDemo() {
  return (
    <div className={`${styles.demo} ${styles.caReferenceDemo} ${styles.caAssistantDemo}`} role="img" aria-label="ChatGPT e Claude conectados ao financeiro da empresa pela Otto">
      <div className={styles.caAssistantTop}><i /></div>
      <div className={styles.caProviderCards}>
        <div className={`${styles.caProviderCard} ${styles.caOpenAiCard}`}><span><SiOpenai aria-hidden="true" /></span><div><strong>ChatGPT</strong><i /><i /></div></div>
        <div className={`${styles.caProviderCard} ${styles.caClaudeCard}`}><span><SiClaude aria-hidden="true" /></span><div><strong>Claude</strong><i /><i /></div></div>
      </div>
      <div className={styles.caAssistantPrompt}><MessageSquareText aria-hidden="true" /><i /><button type="button"><Send aria-hidden="true" /></button></div>
      <div className={styles.caAssistantResult}>
        <div className={styles.caResultHeader}><span><Check aria-hidden="true" /></span><i /></div>
        {[68, 84, 57].map((width, index) => <div className={styles.caResultRow} key={width} style={{ '--result-delay': `${index * 0.22}s` } as CSSProperties}><i style={{ width: `${width}%` }} /><b /></div>)}
      </div>
      <span className={styles.caOttoBridge}><MessageSquareText aria-hidden="true" /></span>
      <MousePointer2 aria-hidden="true" className={styles.caAssistantPointer} />
    </div>
  )
}

function ReconciliationDemo() {
  return (
    <div className={`${styles.demo} ${styles.caReferenceDemo} ${styles.caReconciliationDemo}`} role="img" aria-label="Seis movimentações bancárias conciliadas e despesas classificadas pela Otto">
      <div className={styles.caReconciliationTitle}><i /></div>
      <div className={styles.caLedgerPair}>
        <div className={`${styles.caLedger} ${styles.caBankLedger}`}>
          <div className={styles.caLedgerHeader}><Landmark aria-hidden="true" /><i /></div>
          {[72, 58, 83, 64].map((width, index) => <div className={styles.caLedgerRow} key={width} style={{ '--match-delay': `${index * 0.35}s` } as CSSProperties}><span /><i style={{ width: `${width}%` }} /><b /></div>)}
        </div>
        <div className={`${styles.caLedger} ${styles.caOttoLedger}`}>
          <div className={styles.caLedgerHeader}><Tags aria-hidden="true" /><i /></div>
          {[66, 79, 54, 71].map((width, index) => <div className={styles.caLedgerRow} key={width} style={{ '--match-delay': `${index * 0.35 + 0.18}s` } as CSSProperties}><span /><i style={{ width: `${width}%` }} /><b><Check aria-hidden="true" /></b></div>)}
        </div>
      </div>
      <div className={styles.caMatchLines}>{[0, 1, 2, 3].map(index => <i key={index} style={{ '--match-delay': `${index * 0.35 + 0.3}s` } as CSSProperties} />)}</div>
      <div className={styles.caReconciliationAction}><i /><button type="button">Conciliar</button></div>
      <MousePointer2 aria-hidden="true" className={styles.caReconciliationPointer} />
      <div className={styles.caReconciliationSuccess}><Check aria-hidden="true" /></div>
    </div>
  )
}

function InvoiceDemo() {
  return (
    <div className={`${styles.demo} ${styles.caReferenceDemo} ${styles.caInvoiceDemo}`} role="img" aria-label="Nota fiscal preparada pela Otto a partir de um pedido no ChatGPT ou Claude">
      <div className={styles.caInvoicePrompt}><MessageSquareText aria-hidden="true" /><i /><button type="button"><Send aria-hidden="true" /></button></div>
      <div className={styles.caInvoiceSheet}>
        <div className={styles.caInvoiceSheetHeader}><span><FileText aria-hidden="true" /></span><div><i /><i /></div><b>NF</b></div>
        <div className={styles.caInvoiceFields}>
          {[72, 54, 84, 63].map((width, index) => <div key={width} style={{ '--invoice-delay': `${index * 0.28}s` } as CSSProperties}><span /><i style={{ width: `${width}%` }} /></div>)}
        </div>
        <div className={styles.caInvoiceTotal}><i /><strong>R$ 375,00</strong></div>
        <div className={styles.caInvoiceAction}><i /><button type="button">Emitir nota</button></div>
      </div>
      <MousePointer2 aria-hidden="true" className={styles.caInvoicePointer} />
      <div className={styles.caInvoiceSuccess}><Check aria-hidden="true" /></div>
    </div>
  )
}

export function FinancialBenefitsSection() {
  return (
    <section id="beneficios" className="scroll-mt-24 border-y border-[#e4e7e3] bg-[#fbfcfb] px-5 py-20 sm:px-8 sm:py-28" aria-label="Recursos financeiros disponíveis pelo ChatGPT e Claude">
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
