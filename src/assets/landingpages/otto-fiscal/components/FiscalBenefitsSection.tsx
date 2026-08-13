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
  Check,
  FileCheck2,
  FileText,
  Mail,
  MessageSquareText,
  MousePointer2,
  ReceiptText,
  RefreshCw,
  Send,
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

function SalesRuleDemo() {
  return (
    <div className={`${styles.demo} ${styles.refDemo} ${styles.refSalesDemo}`} role="img" aria-label="Venda registrada e nota fiscal emitida conforme a regra escolhida">
      <div className={styles.refTitle}><i /></div>
      <div className={styles.refRuleCards}>
        {['Cobrança', 'Pagamento', 'Garantia'].map((label, index) => <div key={label} className={styles.refRuleCard} style={{ '--item-delay': `${index * 0.45}s` } as CSSProperties}><span><i /></span><strong>{label}</strong><b /></div>)}
      </div>
      <div className={styles.refSaleToInvoice}>
        <div><ReceiptText aria-hidden="true" /><span><i /><b /></span></div><em><i /></em><div><FileCheck2 aria-hidden="true" /><span><i /><b /></span></div>
      </div>
      <div className={styles.refBottomAction}><i /><button type="button">Ativar regra</button></div>
      <MousePointer2 aria-hidden="true" className={styles.refSalesPointer} />
      <div className={styles.refSuccess}><Check aria-hidden="true" /></div>
    </div>
  )
}

function DeliveryDemo() {
  return (
    <div className={`${styles.demo} ${styles.refDemo} ${styles.refDeliveryDemo}`} role="img" aria-label="Nota fiscal autorizada e enviada automaticamente ao cliente">
      <div className={styles.refTitle}><i /></div>
      <div className={styles.refFiscalDocument}><span><FileText aria-hidden="true" /></span><div><i /><i /><i /></div><b>XML</b></div>
      <div className={styles.refRecipient}><Mail aria-hidden="true" /><div><i /><i /></div><Check aria-hidden="true" /></div>
      <span className={styles.refFlyingMail}><Mail aria-hidden="true" /></span>
      <div className={styles.refBottomAction}><i /><button type="button">Enviar</button></div>
      <MousePointer2 aria-hidden="true" className={styles.refDeliveryPointer} />
      <div className={styles.refSuccess}><Check aria-hidden="true" /></div>
    </div>
  )
}

function IntegrationsDemo() {
  return (
    <div className={`${styles.demo} ${styles.refDemo} ${styles.refIntegrationsDemo}`} role="img" aria-label="Plataformas de pagamento conectadas à Otto">
      <div className={styles.refTitle}><i /></div>
      <div className={styles.refIntegrationGrid}>
        {paymentIntegrations.map((integration, index) => {
          const Icon = integration.icon
          return <div className={styles.refIntegrationItem} key={integration.label} style={{ '--item-delay': `${index * 0.24}s`, '--brand-color': integration.color } as CSSProperties}><Icon /><i><Check aria-hidden="true" /></i></div>
        })}
      </div>
      <span className={styles.refSyncCore}><RefreshCw aria-hidden="true" /></span>
      <div className={styles.refSyncProgress}><i /></div>
      <MousePointer2 aria-hidden="true" className={styles.refIntegrationPointer} />
      <div className={styles.refSuccess}><Check aria-hidden="true" /></div>
    </div>
  )
}

function AssistantsDemo() {
  return (
    <div className={`${styles.demo} ${styles.refDemo} ${styles.refAssistantDemo}`} role="img" aria-label="Nota fiscal preparada por uma conversa no ChatGPT ou Claude">
      <div className={styles.refAssistantCards}><div><span><SiOpenai /></span><i /><i /></div><div><span><SiClaude /></span><i /><i /></div></div>
      <div className={styles.refPromptBar}><MessageSquareText aria-hidden="true" /><i /><button type="button"><Send aria-hidden="true" /></button></div>
      <span className={styles.refAssistantBridge}><FileText aria-hidden="true" /></span>
      <div className={styles.refAssistantInvoice}><div><FileCheck2 aria-hidden="true" /><i /></div>{[74, 58, 83].map((width, index) => <span key={width} style={{ '--item-delay': `${index * .25}s` } as CSSProperties}><i style={{ width: `${width}%` }} /><b /></span>)}</div>
      <MousePointer2 aria-hidden="true" className={styles.refAssistantPointer} />
    </div>
  )
}

function ValidationDemo() {
  return (
    <div className={`${styles.demo} ${styles.refDemo} ${styles.refValidationDemo}`} role="img" aria-label="Dados fiscais verificados e corrigidos antes da emissão">
      <div className={styles.refTitle}><i /></div>
      <div className={styles.refValidationForm}>{[72, 42, 84, 61].map((width, index) => <div className={index === 1 ? styles.refInvalidField : undefined} key={width} style={{ '--item-delay': `${index * .25}s` } as CSSProperties}><span /><i style={{ width: `${width}%` }} /><b>{index === 1 ? '!' : <Check aria-hidden="true" />}</b></div>)}</div>
      <div className={styles.refSuggestion}><RefreshCw aria-hidden="true" /><div><i /><i /></div><button type="button">Aplicar</button></div>
      <MousePointer2 aria-hidden="true" className={styles.refValidationPointer} />
      <div className={styles.refSuccess}><Check aria-hidden="true" /></div>
    </div>
  )
}

function ConnectedFlowDemo() {
  return (
    <div className={`${styles.demo} ${styles.refDemo} ${styles.refConnectedDemo}`} role="img" aria-label="Nota fiscal vinculada à venda, ao cliente e ao financeiro">
      <div className={styles.refTitle}><i /></div>
      <div className={styles.refConnectedFlow}>
        {[ReceiptText, FileCheck2, Mail, WalletCards].map((Icon, index) => <div key={index} style={{ '--item-delay': `${index * .55}s` } as CSSProperties}><span><Icon aria-hidden="true" /></span><i /><i /><b><Check aria-hidden="true" /></b></div>)}
      </div>
      <div className={styles.refConnectedLine}><i /></div>
      <span className={styles.refConnectedCore}><RefreshCw aria-hidden="true" /></span>
      <div className={styles.refSuccess}><Check aria-hidden="true" /></div>
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
