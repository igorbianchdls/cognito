import { SiMercadopago, SiNubank } from '@icons-pack/react-simple-icons'
import { Copy, MoreHorizontal, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

import {
  OttoAiEmployeesSyncCard,
  type OttoAiEmployeesResultRow,
} from './ChatGptClaudeOttoAiEmployeesVideo'
import AmazonIcon from '@/components/icons/AmazonIcon'
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon'
import HotmartIcon from '@/components/icons/HotmartIcon'
import MetaIcon from '@/components/icons/MetaIcon'
import NuvemshopIcon from '@/components/icons/NuvemshopIcon'
import ShopifyIcon from '@/components/icons/ShopifyIcon'

export const CHATGPT_PLUS_SYNC_PROMPT = 'Concilie as movimentações bancárias, classifique as despesas e atualize as contas a pagar e receber.'

function p(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function row(value: OttoAiEmployeesResultRow): OttoAiEmployeesResultRow {
  return value
}

function bankAssetIcon(src: string, cropSymbol = false) {
  return function BankAssetIcon({ className }: { className?: string }) {
    return (
      <span className={className} style={{ alignItems: 'center', display: 'flex', justifyContent: cropSymbol ? 'flex-start' : 'center', overflow: 'hidden' }}>
        <Img
          src={staticFile(src)}
          style={{ display: 'block', flex: 'none', height: '100%', maxWidth: 'none', objectFit: 'contain', width: cropSymbol ? 'auto' : '100%' }}
        />
      </span>
    )
  }
}

function NubankBrandIcon({ className }: { className?: string }) {
  return <SiNubank className={className} color="#820ad1" />
}

function MercadoPagoBrandIcon({ className }: { className?: string }) {
  return <SiMercadopago className={className} color="#009ee3" />
}

const ItauBrandIcon = bankAssetIcon('brand-logos/banks/itau.svg')
const SantanderBrandIcon = bankAssetIcon('brand-logos/banks/santander.svg', true)

const reconciliationRows = [
  row({ description: 'PIX recebido · 03 ago', erp: 'Venda #1842', icon: ItauBrandIcon, initials: 'IT', name: 'Itaú Empresas', status: 'Conciliado', tone: '#ff7900', value: 'R$ 4.800' }),
  row({ description: 'Cartão corporativo · 03 ago', erp: 'Software', icon: NubankBrandIcon, initials: 'NU', name: 'Nubank PJ', status: 'Conciliado', tone: '#820ad1', value: 'R$ 920' }),
  row({ description: 'TED recebida · 04 ago', erp: 'Cliente Aurora', icon: SantanderBrandIcon, initials: 'ST', name: 'Santander Empresas', status: 'Conciliado', tone: '#e60000', value: 'R$ 7.250' }),
  row({ description: 'Tarifa da conta · 05 ago', erp: 'Despesas bancárias', icon: MercadoPagoBrandIcon, initials: 'MP', name: 'Mercado Pago', status: 'Conciliado', tone: '#00b1ea', value: 'R$ 89' }),
]

const expenseRows = [
  row({ description: 'Campanha de mídia paga', icon: MetaIcon, initials: 'MA', name: 'Meta Ads', status: 'Classificada', tone: '#1877f2', value: 'Marketing · R$ 3.460' }),
  row({ description: 'Campanhas de pesquisa', icon: GoogleAdsIcon, initials: 'GA', name: 'Google Ads', status: 'Classificada', tone: '#f4b400', value: 'Marketing · R$ 2.180' }),
  row({ description: 'Mensalidade da loja virtual', icon: ShopifyIcon, initials: 'SH', name: 'Shopify', status: 'Classificada', tone: '#95bf47', value: 'E-commerce · R$ 540' }),
  row({ description: 'Compra de materiais', icon: AmazonIcon, initials: 'AZ', name: 'Amazon', status: 'Classificada', tone: '#ff9900', value: 'Materiais · R$ 860' }),
]

const accountsRows = [
  row({ description: 'Repasse de vendas · 12 ago', icon: HotmartIcon, initials: 'HM', name: 'Hotmart', status: 'A receber', tone: '#f04e23', value: 'R$ 6.420' }),
  row({ description: 'Aplicativos da loja · 15 ago', icon: NuvemshopIcon, initials: 'NS', name: 'Nuvemshop', status: 'Agendado', tone: '#006bc8', value: 'R$ 410' }),
  row({ description: 'Repasse da loja · 18 ago', icon: ShopifyIcon, initials: 'SH', name: 'Shopify', status: 'A receber', tone: '#95bf47', value: 'R$ 8.760' }),
  row({ description: 'Materiais · 20 ago', icon: AmazonIcon, initials: 'AZ', name: 'Amazon', status: 'Agendado', tone: '#ff9900', value: 'R$ 860' }),
]

function AssistantLine({ end, start, text, top }: { end: number; start: number; text: string; top: number }) {
  const frame = useCurrentFrame()
  const visibleCharacters = Math.floor(p(frame, start, end, [0, text.length]))
  if (frame < start) return null
  const complete = visibleCharacters >= text.length

  return (
    <div style={{ color: '#0d0d0d', fontSize: 16, lineHeight: 1.55, position: 'absolute', top, width: '100%' }}>
      {text.slice(0, visibleCharacters)}
      {!complete ? <span style={{ background: '#111111', display: 'inline-block', height: 16, marginLeft: 2, opacity: Math.floor(frame / 5) % 2 ? 0.25 : 0.9, verticalAlign: '-2px', width: 2 }} /> : null}
    </div>
  )
}

function SyncBlock({
  kind = 'list',
  rows,
  start,
  subtitle,
  title,
  top,
}: {
  kind?: 'list' | 'reconciliation'
  rows: OttoAiEmployeesResultRow[]
  start: number
  subtitle: string
  title: string
  top: number
}) {
  const frame = useCurrentFrame()
  if (frame < start) return null

  return (
    <div style={{ position: 'absolute', top, width: '100%' }}>
      <OttoAiEmployeesSyncCard frame={(frame - start) * 1.55} kind={kind} rows={rows} subtitle={subtitle} title={title} />
    </div>
  )
}

function FinalActions({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const enter = p(frame, start, start + 18)
  return (
    <div style={{ alignItems: 'center', color: '#5d5d5d', display: 'flex', gap: 11, marginTop: 13, opacity: enter, transform: `translateY(${(1 - enter) * 5}px)` }}>
      <Copy size={18} strokeWidth={1.6} />
      <ThumbsUp size={17} strokeWidth={1.6} />
      <ThumbsDown size={17} strokeWidth={1.6} />
      <MoreHorizontal size={18} strokeWidth={1.8} />
    </div>
  )
}

export function ChatGptPlusSyncConversation() {
  const frame = useCurrentFrame()
  const userMessageIn = p(frame, 54, 70)
  const scroll = interpolate(frame, [0, 210, 250, 340, 380, 490, 525], [0, 0, -500, -500, -1000, -1000, -1120], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const summary = 'Tudo certo. As movimentações foram conciliadas, as despesas classificadas e os próximos vencimentos atualizados.'
  const summaryCharacters = Math.floor(p(frame, 500, 536, [0, summary.length]))

  return (
    <div style={{ height: 1740, left: '50%', position: 'absolute', top: 30, transform: `translate(-50%, ${scroll}px)`, width: 770 }}>
      <div style={{ background: '#f4f4f4', borderRadius: 22, fontSize: 15, lineHeight: 1.4, maxWidth: 650, minHeight: 44, opacity: userMessageIn, padding: '12px 17px', position: 'absolute', right: 0, top: 26, transform: `translateY(${(1 - userMessageIn) * 8}px) scale(${0.98 + userMessageIn * 0.02})`, transformOrigin: 'right center' }}>
        {CHATGPT_PLUS_SYNC_PROMPT}
      </div>

      <AssistantLine end={104} start={76} text="Vou começar cruzando as movimentações bancárias com os lançamentos registrados." top={118} />
      <SyncBlock kind="reconciliation" rows={reconciliationRows} start={108} subtitle="Bancos, valores e lançamentos encontrados" title="Conciliação bancária" top={165} />

      <AssistantLine end={238} start={216} text="Conciliação concluída. Agora vou classificar cada despesa por categoria." top={620} />
      <SyncBlock rows={expenseRows} start={242} subtitle="Fornecedores, categorias, valores e status" title="Classificação de despesas" top={665} />

      <AssistantLine end={369} start={347} text="Despesas classificadas. Por fim, vou atualizar as contas a pagar e receber." top={1120} />
      <SyncBlock rows={accountsRows} start={373} subtitle="Vencimentos, cobranças e repasses" title="Contas a pagar e receber" top={1165} />

      {frame >= 500 ? (
        <div style={{ fontSize: 16, lineHeight: 1.55, position: 'absolute', top: 1620, width: '100%' }}>
          {summary.slice(0, summaryCharacters)}
          {summaryCharacters < summary.length ? <span style={{ background: '#111111', display: 'inline-block', height: 16, marginLeft: 2, verticalAlign: '-2px', width: 2 }} /> : null}
          {summaryCharacters >= summary.length ? <FinalActions start={538} /> : null}
        </div>
      ) : null}
    </div>
  )
}
