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
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  FileText,
  Landmark,
  Mail,
  MessageCircle,
  MessageSquareText,
  MousePointer2,
  ReceiptText,
  Send,
  Smartphone,
  Tags,
} from 'lucide-react'

import styles from '@/assets/landingpages/otto/components/FinancialBenefitsSection.module.css'

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
    <div className={`${styles.demo} ${styles.assistantDemo}`} role="img" aria-label="ChatGPT e Claude conectados ao financeiro da empresa pela Otto">
      <div className="flex min-h-[68px] items-center gap-3 border-b border-[#e3e7e4] bg-[#fbfcfb] px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-[#eceeed] text-[#171918]"><MessageSquareText className="h-4 w-4" /></span>
        <div>
          <p className="text-[13px] font-semibold text-[#282e29]">Otto conectada</p>
          <p className="mt-0.5 text-[11px] text-[#7b837c]">Escolha onde conversar</p>
        </div>
        <div className="ml-auto flex gap-1.5">
          <span className={`${styles.assistantProvider} ${styles.chatGptProvider}`}><SiOpenai className="h-3.5 w-3.5" color="#111111" /> ChatGPT</span>
          <span className={`${styles.assistantProvider} ${styles.claudeProvider}`}><SiClaude className="h-3.5 w-3.5" color="#D97757" /> Claude</span>
        </div>
      </div>

      <div className="bg-[#f8f9f7] px-4 py-5 sm:px-5">
        <div className={`${styles.assistantPrompt} ml-auto max-w-[82%] rounded-lg bg-[#e7eae7] px-4 py-3 text-[12px] leading-5 text-[#343a35]`}>
          <span>Quais contas vencem esta semana?</span>
        </div>
        <div className={`${styles.assistantResponse} mt-5 max-w-[92%]`}>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#303630]"><BadgeCheck className="h-4 w-4 text-[#317543]" /> A Otto consultou o financeiro</div>
          <p className="mt-2 text-[12px] leading-5 text-[#626862]">Há quatro contas a pagar nos próximos sete dias, totalizando R$ 8.426,40.</p>
          <div className="mt-3 divide-y divide-[#e3e6e3] rounded-md border border-[#dfe3df] bg-white px-3">
            {[
              ['Energia da unidade', 'R$ 1.286,40'],
              ['Fornecedor Alfa', 'R$ 3.240,00'],
              ['Aluguel', 'R$ 3.900,00'],
            ].map(([label, value], index) => (
              <div className={`${styles.assistantRow} flex items-center justify-between gap-4 py-2.5 text-[11px]`} key={label} style={{ '--row-delay': `${index * 0.32}s` } as CSSProperties}>
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
      <MousePointer2 aria-hidden="true" className={styles.assistantCursor} />
    </div>
  )
}

function ReconciliationDemo() {
  return (
    <div className={`${styles.demo} ${styles.reconciliationDemo} min-h-[430px]`} role="img" aria-label="Seis movimentações bancárias conciliadas e despesas classificadas pela Otto">
      <div className="flex min-h-[68px] items-center gap-3 border-b border-[#e3e7e4] bg-[#fbfcfb] px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-[#e7f0f7] text-[#2d6591]"><Landmark className="h-4 w-4" /></span>
        <div>
          <p className="text-[13px] font-semibold text-[#282e29]">Conciliação bancária</p>
          <p className="mt-0.5 text-[11px] text-[#7b837c]">Conta principal · agosto</p>
        </div>
        <span className="ml-auto rounded-md bg-[#e8f3eb] px-2.5 py-1.5 text-[10px] font-semibold text-[#28743d]">6 conciliadas</span>
      </div>

      <div className={`${styles.reconcileSummary} grid grid-cols-2 border-b border-[#e5e8e5]`}>
        <div className="px-4 py-3"><p className="text-[9px] uppercase text-[#858c86]">Movimentações</p><strong className="mt-1 block text-sm">6</strong></div>
        <div className="border-l border-[#e5e8e5] px-4 py-3"><p className="text-[9px] uppercase text-[#858c86]">Classificadas</p><strong className="mt-1 block text-sm text-[#28743d]">100%</strong></div>
      </div>

      <div className="divide-y divide-[#e7eae7] px-4 pb-12">
        {expenseRows.map((expense, index) => {
          const Icon = expense.icon
          return (
            <div className={`${styles.expenseRow} grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 py-1.5`} key={expense.merchant} style={{ '--row-delay': `${index * 0.38}s` } as CSSProperties}>
              <span className="grid h-7 w-7 place-items-center rounded-md border border-[#e4e7e4] bg-white"><Icon className="h-3.5 w-3.5" color={expense.color} /></span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-[#303630]">{expense.merchant}</p>
                <p className={`${styles.expenseCategory} mt-0.5 flex items-center gap-1 text-[9px] text-[#737a74]`}><Tags className="h-2.5 w-2.5" />{expense.category}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-[#303630]">{expense.amount}</p>
                <p className={`${styles.expenseStatus} mt-0.5 inline-flex items-center gap-1 text-[9px] text-[#28743d]`}><Check className="h-2.5 w-2.5" />Conciliada</p>
              </div>
            </div>
          )
        })}
      </div>
      <MousePointer2 aria-hidden="true" className={styles.reconciliationCursor} />
      <div className={styles.reconciliationSuccess}><CheckCircle2 aria-hidden="true" /> Movimentações conciliadas e classificadas</div>
    </div>
  )
}

function InvoiceDemo() {
  return (
    <div className={`${styles.demo} ${styles.invoiceDemo}`} role="img" aria-label="Nota fiscal preparada pela Otto a partir de um pedido no ChatGPT ou Claude">
      <div className="flex min-h-[68px] items-center gap-3 border-b border-[#e3e7e4] bg-[#fbfcfb] px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-[#f4eee3] text-[#805d1f]"><FileText className="h-4 w-4" /></span>
        <div>
          <p className="text-[13px] font-semibold text-[#282e29]">Nota fiscal de serviço</p>
          <p className="mt-0.5 text-[11px] text-[#7b837c]">Preparada pela Otto</p>
        </div>
        <span className="ml-auto rounded-md bg-[#fff2dc] px-2.5 py-1.5 text-[10px] font-semibold text-[#91601b]">Aguardando confirmação</span>
      </div>

      <div className="bg-[#f8f9f7] px-4 py-4">
        <div className={`${styles.invoicePrompt} ml-auto max-w-[84%] rounded-lg bg-[#e7eae7] px-4 py-2.5 text-[11px] leading-5 text-[#343a35]`}>
          <span>Emita a nota fiscal da venda 317.</span>
        </div>
      </div>

      <div className={`${styles.invoiceDetails} px-4 pb-16`}>
        <p className="flex items-center gap-2 py-3 text-[11px] font-semibold text-[#303630]"><ReceiptText className="h-4 w-4 text-[#805d1f]" /> Dados encontrados pela Otto</p>
        <dl className="divide-y divide-[#e5e8e5] border-y border-[#e3e7e4]">
          {[
            ['Cliente', 'Bruna Schmitz'],
            ['Serviço', 'Consultoria financeira'],
            ['Município', 'Recife, PE'],
            ['Valor', 'R$ 375,00'],
          ].map(([label, value], index) => (
            <div className={`${styles.invoiceRow} flex items-center justify-between gap-4 py-2.5 text-[10px]`} key={label} style={{ '--row-delay': `${index * 0.28}s` } as CSSProperties}>
              <dt className="text-[#7b837c]">{label}</dt>
              <dd className="font-semibold text-[#303630]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex min-h-14 items-center gap-3 border-t border-[#e3e7e4] bg-white px-4">
        <span className="text-[9px] leading-4 text-[#737a74]">Revise antes de transmitir</span>
        <button className={`${styles.invoiceButton} ml-auto inline-flex h-9 items-center gap-2 rounded-md bg-[#181818] px-3 text-[10px] font-semibold text-white`} type="button">
          <Send className="h-3.5 w-3.5" /> Confirmar emissão
        </button>
      </div>
      <MousePointer2 aria-hidden="true" className={styles.invoiceCursor} />
      <div className={styles.invoiceSuccess}>
        <span><CheckCircle2 aria-hidden="true" /></span>
        <strong>Nota emitida</strong>
        <small>Documento enviado e financeiro atualizado</small>
      </div>
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
