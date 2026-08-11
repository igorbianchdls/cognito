import { SiMercadopago, SiNubank } from '@icons-pack/react-simple-icons'
import { Copy, MoreHorizontal, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

import { ChatGptConversationChart, type ChatGptConversationChartKind } from './ChatGptConversationCharts'
import {
  OttoAiEmployeesSyncCard,
  type OttoAiEmployeesResultRow,
} from './ChatGptClaudeOttoAiEmployeesVideo'
import AmazonIcon from '@/components/icons/AmazonIcon'
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon'
import HotmartIcon from '@/components/icons/HotmartIcon'
import KiwifyIcon from '@/components/icons/KiwifyIcon'
import MetaIcon from '@/components/icons/MetaIcon'
import NuvemshopIcon from '@/components/icons/NuvemshopIcon'
import ShopifyIcon from '@/components/icons/ShopifyIcon'

export const CHATGPT_PLUS_PROMPT_SCHEDULE = [
  { send: 52, start: 0, text: 'Concilie as movimentações bancárias, classifique as despesas e mostre o impacto no caixa.', typingEnd: 45 },
  { send: 472, start: 420, text: 'Emita as notas fiscais das vendas recentes e atualize as contas a receber.', typingEnd: 465 },
  { send: 892, start: 840, text: 'Quais clientes estão atrasados e onde está o maior risco financeiro?', typingEnd: 885 },
  { send: 1192, start: 1140, text: 'Verifique as obrigações fiscais e identifique oportunidades legais de economia.', typingEnd: 1185 },
] as const

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
        <Img src={staticFile(src)} style={{ display: 'block', flex: 'none', height: '100%', maxWidth: 'none', objectFit: 'contain', width: cropSymbol ? 'auto' : '100%' }} />
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
const BancoDoBrasilBrandIcon = bankAssetIcon('brand-logos/banks/banco-do-brasil.svg', true)
const BradescoBrandIcon = bankAssetIcon('brand-logos/banks/bradesco.svg', true)

const reconciliationRows = [
  row({ description: 'PIX recebido · 03 ago', erp: 'Venda #1842', icon: ItauBrandIcon, initials: 'IT', name: 'Itaú Empresas', status: 'Conciliado', tone: '#ff7900', value: 'R$ 4.800' }),
  row({ description: 'Cartão corporativo · 03 ago', erp: 'Software', icon: NubankBrandIcon, initials: 'NU', name: 'Nubank PJ', status: 'Conciliado', tone: '#820ad1', value: 'R$ 920' }),
  row({ description: 'TED recebida · 04 ago', erp: 'Cliente Aurora', icon: SantanderBrandIcon, initials: 'ST', name: 'Santander Empresas', status: 'Conciliado', tone: '#e60000', value: 'R$ 7.250' }),
  row({ description: 'Débito automático · 04 ago', erp: 'Energia', icon: BancoDoBrasilBrandIcon, initials: 'BB', name: 'Banco do Brasil', status: 'Conciliado', tone: '#0038a8', value: 'R$ 1.460' }),
  row({ description: 'Boleto compensado · 05 ago', erp: 'Fornecedor Delta', icon: BradescoBrandIcon, initials: 'BR', name: 'Bradesco Empresas', status: 'Conciliado', tone: '#cc092f', value: 'R$ 2.640' }),
  row({ description: 'Tarifa da conta · 05 ago', erp: 'Despesas bancárias', icon: MercadoPagoBrandIcon, initials: 'MP', name: 'Mercado Pago', status: 'Conciliado', tone: '#00b1ea', value: 'R$ 89' }),
]

const expenseRows = [
  row({ description: 'Campanha de mídia paga', icon: MetaIcon, initials: 'MA', name: 'Meta Ads', status: 'Classificada', tone: '#1877f2', value: 'Marketing · R$ 3.460' }),
  row({ description: 'Campanhas de pesquisa', icon: GoogleAdsIcon, initials: 'GA', name: 'Google Ads', status: 'Classificada', tone: '#f4b400', value: 'Marketing · R$ 2.180' }),
  row({ description: 'Taxas sobre vendas digitais', icon: HotmartIcon, initials: 'HM', name: 'Hotmart', status: 'Classificada', tone: '#f04e23', value: 'Taxas · R$ 1.290' }),
  row({ description: 'Mensalidade da loja virtual', icon: ShopifyIcon, initials: 'SH', name: 'Shopify', status: 'Classificada', tone: '#95bf47', value: 'E-commerce · R$ 540' }),
  row({ description: 'Aplicativos e serviços da loja', icon: NuvemshopIcon, initials: 'NS', name: 'Nuvemshop', status: 'Classificada', tone: '#006bc8', value: 'Software · R$ 410' }),
  row({ description: 'Compra de materiais', icon: AmazonIcon, initials: 'AZ', name: 'Amazon', status: 'Classificada', tone: '#ff9900', value: 'Materiais · R$ 860' }),
]

const recentSalesRows = [
  row({ description: 'Aurora Tecnologia · Shopify', icon: ShopifyIcon, initials: '42', name: 'Venda #01942', status: 'Confirmada', tone: '#95bf47', value: 'R$ 12.400' }),
  row({ description: 'Lume Comércio · Nuvemshop', icon: NuvemshopIcon, initials: '41', name: 'Venda #01941', status: 'Confirmada', tone: '#006bc8', value: 'R$ 8.900' }),
  row({ description: 'Studio Norte · Hotmart', icon: HotmartIcon, initials: '40', name: 'Venda #01940', status: 'Confirmada', tone: '#f04e23', value: 'R$ 5.440' }),
  row({ description: 'Prisma Tech · Amazon', icon: AmazonIcon, initials: '39', name: 'Venda #01939', status: 'Confirmada', tone: '#ff9900', value: 'R$ 4.200' }),
  row({ description: 'Nova Oficina · Instagram', icon: MetaIcon, initials: '38', name: 'Venda #01938', status: 'Confirmada', tone: '#1877f2', value: 'R$ 3.280' }),
  row({ description: 'Vitta Serviços · Kiwify', icon: KiwifyIcon, initials: '37', name: 'Venda #01937', status: 'Confirmada', tone: '#16a34a', value: 'R$ 2.170' }),
]

const invoiceRows = [
  row({ description: 'Venda #01942 · Aurora Tecnologia', icon: ShopifyIcon, initials: 'NF', name: 'NFS-e #02841', status: 'Emitida', tone: '#95bf47', value: 'R$ 12.400' }),
  row({ description: 'Venda #01941 · Lume Comércio', icon: NuvemshopIcon, initials: 'NF', name: 'NFS-e #02842', status: 'Emitida', tone: '#006bc8', value: 'R$ 8.900' }),
  row({ description: 'Venda #01940 · Studio Norte', icon: HotmartIcon, initials: 'NF', name: 'NFS-e #02843', status: 'Emitida', tone: '#f04e23', value: 'R$ 5.440' }),
  row({ description: 'Venda #01939 · Prisma Tech', icon: AmazonIcon, initials: 'NF', name: 'NFS-e #02844', status: 'Emitida', tone: '#ff9900', value: 'R$ 4.200' }),
  row({ description: 'Venda #01938 · Nova Oficina', icon: MetaIcon, initials: 'NF', name: 'NFS-e #02845', status: 'Emitida', tone: '#1877f2', value: 'R$ 3.280' }),
  row({ description: 'Venda #01937 · Vitta Serviços', icon: KiwifyIcon, initials: 'NF', name: 'NFS-e #02846', status: 'Emitida', tone: '#16a34a', value: 'R$ 2.170' }),
]

const collectionRows = [
  row({ description: 'Vencimento em 04 ago · Shopify', icon: ShopifyIcon, initials: 'AT', name: 'Aurora Tecnologia', status: 'Cobrança enviada', tone: '#95bf47', value: 'R$ 21.500' }),
  row({ description: 'Vencimento em 01 ago · Nuvemshop', icon: NuvemshopIcon, initials: 'LC', name: 'Lume Comércio', status: 'Cobrança enviada', tone: '#006bc8', value: 'R$ 15.800' }),
  row({ description: 'Vencimento em 29 jul · Hotmart', icon: HotmartIcon, initials: 'SN', name: 'Studio Norte', status: 'Monitorando', tone: '#f04e23', value: 'R$ 12.400' }),
  row({ description: 'Vencimento em 27 jul · Amazon', icon: AmazonIcon, initials: 'PT', name: 'Prisma Tech', status: 'Cobrança enviada', tone: '#ff9900', value: 'R$ 8.900' }),
  row({ description: 'Vencimento em 25 jul · Instagram', icon: MetaIcon, initials: 'NO', name: 'Nova Oficina', status: 'Monitorando', tone: '#1877f2', value: 'R$ 6.200' }),
  row({ description: 'Vencimento em 23 jul · Kiwify', icon: KiwifyIcon, initials: 'VS', name: 'Vitta Serviços', status: 'Cobrança enviada', tone: '#16a34a', value: 'R$ 4.100' }),
]

const fiscalRows = [
  row({ description: 'Calendário e vencimentos', initials: 'OF', name: 'Obrigações fiscais', status: 'Verificado', tone: '#2563eb', value: 'Em dia' }),
  row({ description: 'Enquadramento atual da empresa', initials: 'RT', name: 'Regime tributário', status: 'Analisado', tone: '#7c3aed', value: 'Validado' }),
  row({ description: 'Créditos previstos na legislação', initials: 'CR', name: 'Créditos permitidos', status: 'Verificado', tone: '#16845b', value: 'Disponíveis' }),
  row({ description: 'Datas e entregas dos próximos meses', initials: 'CT', name: 'Calendário tributário', status: 'Atualizado', tone: '#0891b2', value: '12 obrigações' }),
  row({ description: 'Regime atual e alternativas legais', initials: 'SC', name: 'Simulação comparativa', status: 'Concluída', tone: '#475569', value: '3 cenários' }),
  row({ description: 'Alternativa dentro da legislação', initials: 'EC', name: 'Economia tributária', status: 'Identificada', tone: '#d97757', value: 'Oportunidade' }),
]

function AssistantLine({ end, start, text, top }: { end: number; start: number; text: string; top: number }) {
  const frame = useCurrentFrame()
  const visibleCharacters = Math.floor(p(frame, start, end, [0, text.length]))
  if (frame < start) return null
  const complete = visibleCharacters >= text.length
  return <div style={{ color: '#0d0d0d', fontSize: 16, lineHeight: 1.55, position: 'absolute', top, width: '100%' }}>{text.slice(0, visibleCharacters)}{!complete ? <span style={{ background: '#111111', display: 'inline-block', height: 16, marginLeft: 2, opacity: Math.floor(frame / 5) % 2 ? 0.25 : 0.9, verticalAlign: '-2px', width: 2 }} /> : null}</div>
}

function UserBubble({ promptIndex, top }: { promptIndex: number; top: number }) {
  const frame = useCurrentFrame()
  const prompt = CHATGPT_PLUS_PROMPT_SCHEDULE[promptIndex]
  const enter = p(frame, prompt.send + 2, prompt.send + 18)
  if (frame < prompt.send + 2) return null
  return <div style={{ background: '#f4f4f4', borderRadius: 22, fontSize: 15, lineHeight: 1.4, maxWidth: 650, minHeight: 44, opacity: enter, padding: '12px 17px', position: 'absolute', right: 0, top, transform: `translateY(${(1 - enter) * 8}px) scale(${0.98 + enter * 0.02})`, transformOrigin: 'right center' }}>{prompt.text}</div>
}

function SyncBlock({ kind = 'list', rows, start, subtitle, title, top }: { kind?: 'list' | 'reconciliation'; rows: OttoAiEmployeesResultRow[]; start: number; subtitle: string; title: string; top: number }) {
  const frame = useCurrentFrame()
  if (frame < start) return null
  return <div style={{ position: 'absolute', top, width: '100%' }}><OttoAiEmployeesSyncCard frame={(frame - start) * 1.8} kind={kind} rows={rows} subtitle={subtitle} title={title} /></div>
}

function ChartBlock({ kind, start, top }: { kind: ChatGptConversationChartKind; start: number; top: number }) {
  const frame = useCurrentFrame()
  if (frame < start) return null
  return <div style={{ position: 'absolute', top, width: '100%' }}><ChatGptConversationChart frame={(frame - start) * 1.2} kind={kind} /></div>
}

function FinalActions({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const enter = p(frame, start, start + 18)
  return <div style={{ alignItems: 'center', color: '#5d5d5d', display: 'flex', gap: 11, marginTop: 13, opacity: enter, transform: `translateY(${(1 - enter) * 5}px)` }}><Copy size={18} strokeWidth={1.6} /><ThumbsUp size={17} strokeWidth={1.6} /><ThumbsDown size={17} strokeWidth={1.6} /><MoreHorizontal size={18} strokeWidth={1.8} /></div>
}

export function ChatGptPlusSyncConversation() {
  const frame = useCurrentFrame()
  const scroll = interpolate(
    frame,
    [0, 165, 194, 278, 307, 470, 490, 500, 585, 614, 697, 726, 890, 910, 920, 1010, 1039, 1190, 1210, 1220, 1310, 1339, 1440, 1460],
    [0, 0, -640, -640, -1280, -1280, -1730, -1860, -1860, -2500, -2500, -3150, -3150, -3600, -3740, -3740, -4210, -4210, -4830, -4960, -4960, -5600, -5600, -6040],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
  const summary = 'Tudo certo. Conciliação, despesas, notas, cobranças e obrigações fiscais foram atualizadas. Também deixei os quatro diagnósticos financeiros prontos.'
  const summaryCharacters = Math.floor(p(frame, 1450, 1490, [0, summary.length]))

  return (
    <div style={{ height: 6400, left: '50%', position: 'absolute', top: 30, transform: `translate(-50%, ${scroll}px)`, width: 770 }}>
      <UserBubble promptIndex={0} top={24} />
      <AssistantLine end={80} start={62} text="Vou começar conciliando bancos e lançamentos para encontrar correspondências e divergências." top={120} />
      <SyncBlock kind="reconciliation" rows={reconciliationRows} start={84} subtitle="Bancos, valores e lançamentos encontrados" title="Conciliação bancária" top={165} />
      <AssistantLine end={190} start={172} text="Conciliação concluída. Agora vou classificar cada despesa por categoria." top={760} />
      <SyncBlock rows={expenseRows} start={194} subtitle="Fornecedores, categorias, valores e status" title="Classificação de despesas" top={805} />
      <AssistantLine end={303} start={285} text="Com as despesas organizadas, vou calcular o impacto no caixa dos próximos meses." top={1400} />
      <ChartBlock kind="cashflow" start={307} top={1445} />

      <UserBubble promptIndex={1} top={1880} />
      <AssistantLine end={498} start={480} text="Primeiro vou localizar as vendas confirmadas que ainda precisam ser processadas." top={1970} />
      <SyncBlock rows={recentSalesRows} start={502} subtitle="Clientes, canais, serviços e valores confirmados" title="Vendas recentes" top={2015} />
      <AssistantLine end={610} start={592} text="Encontrei as vendas. Agora vou emitir as notas e atualizar os registros financeiros." top={2610} />
      <SyncBlock rows={invoiceRows} start={614} subtitle="Notas, vendas vinculadas, valores e envio" title="Emissão de notas fiscais" top={2655} />
      <AssistantLine end={722} start={704} text="Notas emitidas. Vou resumir como o faturamento está distribuído por origem." top={3260} />
      <ChartBlock kind="revenue" start={726} top={3305} />

      <UserBubble promptIndex={2} top={3750} />
      <AssistantLine end={918} start={900} text="Vou ordenar os valores vencidos para mostrar onde está a maior exposição financeira." top={3840} />
      <ChartBlock kind="overdue" start={922} top={3885} />
      <AssistantLine end={1035} start={1017} text="Agora vou enviar as cobranças e programar o acompanhamento de cada cliente." top={4320} />
      <SyncBlock rows={collectionRows} start={1039} subtitle="Clientes, vencimentos, valores e ações realizadas" title="Cobranças e acompanhamento" top={4365} />

      <UserBubble promptIndex={3} top={4980} />
      <AssistantLine end={1218} start={1200} text="Vou conferir o calendário, o regime tributário e todas as obrigações aplicáveis." top={5070} />
      <SyncBlock rows={fiscalRows} start={1222} subtitle="Calendário, regime, créditos e oportunidades" title="Obrigações fiscais" top={5115} />
      <AssistantLine end={1335} start={1317} text="Verificação concluída. Vou comparar o cenário atual com uma alternativa permitida pela legislação." top={5710} />
      <ChartBlock kind="tax" start={1339} top={5755} />

      {frame >= 1450 ? <div style={{ fontSize: 16, lineHeight: 1.55, position: 'absolute', top: 6200, width: '100%' }}>{summary.slice(0, summaryCharacters)}{summaryCharacters < summary.length ? <span style={{ background: '#111111', display: 'inline-block', height: 16, marginLeft: 2, verticalAlign: '-2px', width: 2 }} /> : null}{summaryCharacters >= summary.length ? <FinalActions start={1492} /> : null}</div> : null}
    </div>
  )
}
