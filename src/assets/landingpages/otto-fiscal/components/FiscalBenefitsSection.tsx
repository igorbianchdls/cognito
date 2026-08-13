import type { CSSProperties } from 'react'
import {
  SiClaude,
  SiMercadopago,
  SiOpenai,
  SiPagseguro,
  SiPaypal,
  SiShopify,
  SiStripe,
  SiWoocommerce,
} from '@icons-pack/react-simple-icons'
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  FileText,
  FolderCheck,
  Mail,
  MessageSquareText,
  MousePointer2,
  ReceiptText,
  RefreshCw,
  Send,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'

import styles from '@/assets/landingpages/otto-fiscal/components/FiscalBenefitsSection.module.css'

const paymentIntegrations = [
  { color: '#635BFF', icon: SiStripe, label: 'Stripe' },
  { color: '#009EE3', icon: SiMercadopago, label: 'Mercado Pago' },
  { color: '#00AEEF', icon: SiPagseguro, label: 'PagBank' },
  { color: '#003087', icon: SiPaypal, label: 'PayPal' },
  { color: '#7AB55C', icon: SiShopify, label: 'Shopify' },
  { color: '#96588A', icon: SiWoocommerce, label: 'WooCommerce' },
]

const invoiceData = [
  ['Cliente', 'Bruna Schmitz'],
  ['Serviço', 'Consultoria financeira'],
  ['Município', 'Recife, PE'],
  ['Valor', 'R$ 375,00'],
]

function SalesRuleDemo() {
  return (
    <div className={`${styles.demo} ${styles.salesDemo}`} role="img" aria-label="Venda registrada e nota fiscal emitida conforme a regra escolhida">
      <div className={styles.demoHeader}>
        <span className={styles.greenIcon}><ReceiptText aria-hidden="true" /></span>
        <div><strong>Regra de emissão</strong><small>Venda → nota fiscal</small></div>
        <span className={styles.statusNeutral}>Automática</span>
      </div>

      <div className={styles.ruleOptions}>
        {['Na cobrança', 'Após o pagamento', 'Após a garantia'].map((label, index) => (
          <div className={styles.ruleOption} key={label} style={{ '--option-index': index } as CSSProperties}>
            <span><i />{label}</span>
            <small>{index === 0 ? 'Ao gerar a cobrança' : index === 1 ? 'Quando o valor entrar' : 'Depois do prazo definido'}</small>
          </div>
        ))}
      </div>

      <div className={styles.saleFlow}>
        <div className={styles.saleCard}><small>Venda #317</small><strong>R$ 375,00</strong><span>Bruna Schmitz</span></div>
        <span className={styles.flowConnector}><i /></span>
        <div className={styles.invoiceCard}><FileCheck2 /><span><small>NFS-e</small><strong>Nota emitida</strong></span></div>
      </div>
      <MousePointer2 aria-hidden="true" className={styles.salesCursor} />
    </div>
  )
}

function DeliveryDemo() {
  return (
    <div className={`${styles.demo} ${styles.deliveryDemo}`} role="img" aria-label="Nota fiscal autorizada e enviada automaticamente ao cliente">
      <div className={styles.demoHeader}>
        <span className={styles.blueIcon}><Send aria-hidden="true" /></span>
        <div><strong>Envio ao cliente</strong><small>NFS-e 000317</small></div>
        <span className={styles.statusSuccess}>Autorizada</span>
      </div>

      <div className={styles.deliveryDocument}>
        <span><FileText /></span>
        <div><small>Documento fiscal</small><strong>NFS-e 000317</strong><p>PDF e XML disponíveis</p></div>
        <CheckCircle2 />
      </div>

      <div className={styles.recipientBox}>
        <small>Enviar para</small>
        <strong>Bruna Schmitz</strong>
        <span><Mail />bruna@empresa.com.br</span>
      </div>

      <div className={styles.deliveryAction}><span>Documentos anexados</span><button type="button"><Send />Enviar agora</button></div>
      <MousePointer2 aria-hidden="true" className={styles.deliveryCursor} />
      <div className={styles.deliverySuccess}><CheckCircle2 /><span><strong>Enviado ao cliente</strong><small>PDF e XML entregues automaticamente</small></span></div>
    </div>
  )
}

function IntegrationsDemo() {
  return (
    <div className={`${styles.demo} ${styles.integrationsDemo}`} role="img" aria-label="Plataformas de pagamento conectadas à Otto">
      <div className={styles.demoHeader}>
        <span className={styles.violetIcon}><RefreshCw aria-hidden="true" /></span>
        <div><strong>Integrações</strong><small>Plataformas de pagamento</small></div>
        <span className={styles.statusNeutral}>+70 disponíveis</span>
      </div>

      <div className={styles.integrationGrid}>
        {paymentIntegrations.map((integration, index) => {
          const Icon = integration.icon
          return (
            <div className={styles.integrationItem} key={integration.label} style={{ '--integration-delay': `${index * 0.22}s` } as CSSProperties}>
              <Icon color={integration.color} />
              <span>{integration.label}</span>
              <i><Check /></i>
            </div>
          )
        })}
      </div>

      <div className={styles.importFlow}>
        <span>Importando vendas</span><strong>24 encontradas</strong>
        <div><i /></div>
      </div>
      <MousePointer2 aria-hidden="true" className={styles.integrationCursor} />
      <div className={styles.integrationSuccess}><CheckCircle2 />Plataforma conectada e vendas sincronizadas</div>
    </div>
  )
}

function AssistantsDemo() {
  return (
    <div className={`${styles.demo} ${styles.assistantDemo}`} role="img" aria-label="Nota fiscal preparada por uma conversa no ChatGPT ou Claude">
      <div className={styles.demoHeader}>
        <span className={styles.darkIcon}><MessageSquareText aria-hidden="true" /></span>
        <div><strong>Otto conectada</strong><small>Escolha onde conversar</small></div>
        <div className={styles.providers}>
          <span className={styles.chatgpt}><SiOpenai color="#111111" />ChatGPT</span>
          <span className={styles.claude}><SiClaude color="#D97757" />Claude</span>
        </div>
      </div>

      <div className={styles.chatArea}>
        <div className={styles.promptBubble}><span>Emita a nota fiscal da venda 317.</span></div>
        <div className={styles.assistantResponse}>
          <p><BadgeCheck />A Otto encontrou a venda e preparou a nota.</p>
          <div className={styles.invoiceSummary}>
            {invoiceData.slice(0, 3).map(([label, value], index) => (
              <span key={label} style={{ '--row-delay': `${index * 0.3}s` } as CSSProperties}><small>{label}</small><strong>{value}</strong></span>
            ))}
          </div>
          <button type="button">Revisar e confirmar</button>
        </div>
      </div>
      <MousePointer2 aria-hidden="true" className={styles.assistantCursor} />
    </div>
  )
}

function ValidationDemo() {
  return (
    <div className={`${styles.demo} ${styles.validationDemo}`} role="img" aria-label="Dados fiscais verificados e corrigidos antes da emissão">
      <div className={styles.demoHeader}>
        <span className={styles.amberIcon}><ShieldCheck aria-hidden="true" /></span>
        <div><strong>Validação fiscal</strong><small>Antes da transmissão</small></div>
        <span className={styles.statusWarning}>1 pendência</span>
      </div>

      <div className={styles.validationForm}>
        <div><small>Cliente</small><strong>Bruna Schmitz</strong><Check /></div>
        <div className={styles.invalidField}><small>Código do serviço</small><strong>—</strong><span>Obrigatório</span></div>
        <div><small>Município</small><strong>Recife, PE</strong><Check /></div>
        <div><small>Valor</small><strong>R$ 375,00</strong><Check /></div>
      </div>

      <div className={styles.correctionSuggestion}><RefreshCw /><span><small>Sugestão da Otto</small><strong>17.01 · Consultoria financeira</strong></span><button type="button">Aplicar</button></div>
      <MousePointer2 aria-hidden="true" className={styles.validationCursor} />
      <div className={styles.validationSuccess}><CheckCircle2 /><span><strong>Dados validados</strong><small>Nota pronta para transmissão</small></span></div>
    </div>
  )
}

function ConnectedFlowDemo() {
  const steps = [
    { icon: FileCheck2, label: 'Nota autorizada', detail: 'NFS-e 000317' },
    { icon: FolderCheck, label: 'Documentos organizados', detail: 'PDF e XML' },
    { icon: Send, label: 'Cliente notificado', detail: 'E-mail entregue' },
    { icon: WalletCards, label: 'Financeiro atualizado', detail: 'Venda 317' },
  ]

  return (
    <div className={`${styles.demo} ${styles.connectedDemo}`} role="img" aria-label="Nota fiscal vinculada à venda, ao cliente e ao financeiro">
      <div className={styles.demoHeader}>
        <span className={styles.greenIcon}><CircleDollarSign aria-hidden="true" /></span>
        <div><strong>Operação conectada</strong><small>Nota, cliente e financeiro</small></div>
        <span className={styles.statusSuccess}>Automático</span>
      </div>

      <div className={styles.connectedSummary}>
        <div><small>Venda</small><strong>#317</strong></div>
        <div><small>Nota fiscal</small><strong>000317</strong></div>
        <div><small>Financeiro</small><strong>R$ 375,00</strong></div>
      </div>

      <div className={styles.connectedSteps}>
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.label} style={{ '--step-delay': `${index * 0.55}s` } as CSSProperties}>
              <span><Icon /></span><p><strong>{step.label}</strong><small>{step.detail}</small></p><CheckCircle2 />
            </div>
          )
        })}
      </div>
      <div className={styles.connectedSuccess}><CheckCircle2 />Tudo atualizado pela Otto</div>
    </div>
  )
}

export function FiscalBenefitsSection() {
  return (
    <section id="beneficios-fiscais" className="scroll-mt-24 border-y border-[#e4e8e5] bg-[#fbfcfb] px-5 py-20 sm:px-8 sm:py-28" aria-label="Benefícios da emissão fiscal pela Otto">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-14 border-b border-[#dfe4e0] pb-20 lg:grid-cols-2 lg:items-center lg:gap-20 sm:pb-28">
          <div className="max-w-[520px]">
            <span className="text-xs font-medium uppercase text-[#17653a]">Emissão automática</span>
            <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181b19] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>A Otto registra as suas vendas e emite as notas.</h2>
            <p className="mt-6 max-w-[500px] text-[15px] text-[#626b64]" style={{ lineHeight: 1.5 }}>Você escolhe: na cobrança, após o pagamento ou após a garantia.</p>
          </div>
          <SalesRuleDemo />
        </div>

        <div className="grid gap-14 border-b border-[#dfe4e0] py-20 lg:grid-cols-2 lg:items-center lg:gap-20 sm:py-28">
          <div className="lg:order-2 lg:justify-self-end"><div className="max-w-[520px]">
            <span className="text-xs font-medium uppercase text-[#2d6591]">Envio automático</span>
            <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181b19] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>Enviamos a nota fiscal para seu cliente na hora!</h2>
            <p className="mt-6 max-w-[500px] text-[15px] text-[#626b64]" style={{ lineHeight: 1.5 }}>Automaticamente e poupando seu valioso tempo!</p>
          </div></div>
          <div className="lg:order-1"><DeliveryDemo /></div>
        </div>

        <div className="grid gap-14 border-b border-[#dfe4e0] py-20 lg:grid-cols-2 lg:items-center lg:gap-20 sm:py-28">
          <div className="max-w-[520px]">
            <span className="text-xs font-medium uppercase text-[#635bff]">Integrações</span>
            <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181b19] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>Conecte sua plataforma de pagamento.</h2>
            <p className="mt-6 max-w-[500px] text-[15px] text-[#626b64]" style={{ lineHeight: 1.5 }}>+ de 70 integrações disponíveis.</p>
          </div>
          <IntegrationsDemo />
        </div>

        <div id="chatgpt-claude-fiscal" className="scroll-mt-24 grid gap-14 border-b border-[#dfe4e0] py-20 lg:grid-cols-2 lg:items-center lg:gap-20 sm:py-28">
          <div className="lg:order-2 lg:justify-self-end"><div className="max-w-[520px]">
            <span className="text-xs font-medium uppercase text-[#17653a]">ChatGPT e Claude</span>
            <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181b19] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>Emita notas fiscais pelo ChatGPT ou Claude.</h2>
            <p className="mt-6 max-w-[500px] text-[15px] text-[#626b64]" style={{ lineHeight: 1.5 }}>Basta pedir. A Otto identifica a venda, encontra o cliente, preenche os dados e deixa tudo pronto para sua confirmação.</p>
          </div></div>
          <div className="lg:order-1"><AssistantsDemo /></div>
        </div>

        <div className="grid gap-14 border-b border-[#dfe4e0] py-20 lg:grid-cols-2 lg:items-center lg:gap-20 sm:py-28">
          <div className="max-w-[520px]">
            <span className="text-xs font-medium uppercase text-[#a36b18]">Validação fiscal</span>
            <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181b19] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>Evite erros antes de emitir.</h2>
            <p className="mt-6 max-w-[500px] text-[15px] text-[#626b64]" style={{ lineHeight: 1.5 }}>A Otto verifica os dados fiscais, identifica possíveis pendências e mostra o que precisa ser corrigido antes da transmissão.</p>
          </div>
          <ValidationDemo />
        </div>

        <div className="grid gap-14 pt-20 lg:grid-cols-2 lg:items-center lg:gap-20 sm:pt-28">
          <div className="lg:order-2 lg:justify-self-end"><div className="max-w-[520px]">
            <span className="text-xs font-medium uppercase text-[#17653a]">Tudo conectado</span>
            <h2 className="mt-4 [--ui-title-font-size:40px] font-medium text-[#181b19] sm:[--ui-title-font-size:48px]" style={{ lineHeight: 1.06 }}>Nota fiscal e financeiro sempre conectados.</h2>
            <p className="mt-6 max-w-[500px] text-[15px] text-[#626b64]" style={{ lineHeight: 1.5 }}>Após a emissão, a Otto organiza os documentos, atualiza o financeiro e mantém cada nota vinculada à venda e ao pagamento.</p>
          </div></div>
          <div className="lg:order-1"><ConnectedFlowDemo /></div>
        </div>
      </div>
    </section>
  )
}
