// The Explainer components with sample content, as shown in /remotion-preview. Figures marked as illustrative are examples, not data.
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { BarsCount } from './BarsCount'
import { BigNumber } from './BigNumber'
import { BrazilStatesMap } from './BrazilStatesMap'
import { ChatPaper, chatPaperDuration, type ChatMessage } from './ChatPaper'
import { Checklist } from './Checklist'
import { ClockCompare } from './ClockCompare'
import { FlowDiagram } from './FlowDiagram'
import { GlobeSpin } from './GlobeSpin'
import { HeadlineStack } from './HeadlineStack'
import { DonutChart } from './DonutChart'
import { EvidenceBoard } from './EvidenceBoard'
import { IconGrid } from './IconGrid'
import { ScreenshotSpotlight } from './ScreenshotSpotlight'
import { SpinningNewspaper } from './SpinningNewspaper'
import { WordCaptions, timeWords } from './WordCaptions'
import { ExplainerExampleVideo } from './ExampleVideo'
import { LowerThird } from './LowerThird'
import { PaperTear } from './PaperTear'
import { QuoteCard } from './QuoteCard'
import { SplitCompare } from './SplitCompare'
import { TimelineRuler } from './TimelineRuler'
import { CutoutCollage } from './CutoutCollage'
import { DocumentZoom } from './DocumentZoom'
import { HighlightHeadline } from './HighlightHeadline'
import { LineChartDraw } from './LineChartDraw'
import { MapZoom } from './MapZoom'

export const ExplainerHeadlineDemo = () => (
  <HighlightHeadline kicker="Gestão" text="O ChatGPT agora [[emite nota fiscal]] pra sua empresa" dek="E faz isso em menos de um minuto, só conversando." />
)

export const ExplainerHeadlineCircleDemo = () => (
  <HighlightHeadline kicker="O problema" text="Planilha [[não escala]] quando a empresa [[cresce]]" mark="circulo" dek="Cada cliente novo é mais uma aba, mais uma fórmula e mais um erro." />
)

export const ExplainerDocumentDemo = () => (
  <DocumentZoom
    source="Diário do Comércio"
    date="3 nov 2026"
    title="Pequenas empresas ainda gastam horas com burocracia"
    paragraphs={[
      'Donos de pequenos negócios dizem que a rotina administrativa toma boa parte da semana, entre notas, boletos e conciliação bancária.',
      'Em média, os entrevistados relataram perder 12 horas por semana com tarefas que poderiam ser automatizadas por um sistema de gestão.',
      'A maior parte desse tempo vai para lançar despesas e conferir pagamentos, tarefas feitas à mão em planilhas.',
      'Ferramentas com inteligência artificial começam a mudar esse cenário, segundo especialistas ouvidos pela reportagem.',
    ]}
    highlight={{ paragraph: 1, text: '12 horas por semana' }}
    note="isso é 1 dia e meio de trabalho!"
  />
)

export const ExplainerLineChartDemo = () => (
  <LineChartDraw
    title="Quem usa IA na gestão só cresce"
    titleMark="só cresce"
    subtitle="Empresas que usam IA no financeiro (%, dados ilustrativos)"
    data={[{ label: '2021', value: 4 }, { label: '2022', value: 7 }, { label: '2023', value: 12 }, { label: '2024', value: 21 }, { label: '2025', value: 33 }, { label: '2026', value: 48 }]}
    format={(v) => `${v}%`}
    note="+15 pontos em um ano"
    source="exemplo ilustrativo"
  />
)

export const ExplainerBarsDemo = () => (
  <BarsCount
    title="Horas por mês fechando o financeiro"
    subtitle="Estimativa ilustrativa para uma empresa pequena"
    items={[{ label: 'Planilha', value: 42 }, { label: 'ERP tradicional', value: 26 }, { label: 'Otto + ChatGPT', value: 3 }]}
    highlight={2}
    suffix=" h"
    note="14 vezes mais rápido"
    source="exemplo ilustrativo"
  />
)

export const ExplainerMapDemo = () => (
  <MapZoom
    kicker="Onde o Otto já está"
    title="Clientes em 5 capitais"
    titleMark="5 capitais"
    from={{ center: [-30, 5], zoom: 1 }}
    to={{ center: [-51, -15], zoom: 4.4 }}
    highlight={['Brazil']}
    points={[
      { name: 'Manaus', coords: [-60.02, -3.12] },
      { name: 'Salvador', coords: [-38.5, -12.97] },
      { name: 'Brasília', coords: [-47.88, -15.79] },
      { name: 'São Paulo', coords: [-46.63, -23.55], detail: 'primeiro cliente' },
      { name: 'Porto Alegre', coords: [-51.23, -30.03] },
    ]}
    route
  />
)

export const ExplainerCollageDemo = () => (
  <CutoutCollage
    title="Feito pra quem toca o negócio"
    titleMark="toca o negócio"
    items={[
      { src: 'oficina-media/hero.jpg', caption: 'Oficina' },
      { src: 'roupas-media/hero.jpg', caption: 'Loja de roupas' },
      { src: 'marcenaria-media/hero.jpg', caption: 'Marcenaria' },
      { src: 'limpeza-media/portrait.jpg', caption: 'Limpeza' },
    ]}
  />
)

export const ExplainerTimelineDemo = () => (
  <TimelineRuler
    title="Como a gestão saiu da planilha"
    events={[
      { year: '1985', title: 'Planilha no computador', text: 'O financeiro sai do papel e vai para a tela.' },
      { year: '2005', title: 'ERP para todo mundo', text: 'Sistemas completos, mas difíceis de aprender.' },
      { year: '2015', title: 'Gestão na nuvem', text: 'Acesso de qualquer lugar, ainda cheio de telas.' },
      { year: '2026', title: 'Gestão conversando', text: 'Você pede ao ChatGPT e o sistema faz.' },
    ]}
  />
)

export const ExplainerQuoteDemo = () => (
  <QuoteCard
    quote="Eu passava a sexta-feira inteira conferindo planilha. Hoje [[peço pro ChatGPT]] e vou pra casa mais cedo."
    author="Carla Mendes"
    role="dona de uma empresa de limpeza (personagem ilustrativa)"
    photo="limpeza-media/portrait.jpg"
  />
)

export const ExplainerSplitDemo = () => (
  <SplitCompare
    title="Fechar o mês"
    left={{ label: 'Planilha', items: ['Copiar extrato à mão', 'Fórmulas que quebram', 'Uma pessoa trava tudo'] }}
    right={{ label: 'Otto + ChatGPT', items: ['Extrato conciliado sozinho', 'Relatório pronto em minutos', 'A equipe toda acompanha'] }}
    winner="right"
  />
)

export const ExplainerLowerThirdDemo = () => (
  <LowerThird name="Rafael Souza" role="Dono da Oficina Souza, em Campinas (personagem ilustrativo)" src="oficina-media/hero.jpg" place="Campinas, SP" />
)

export const ExplainerBigNumberDemo = () => (
  <BigNumber kicker="Em um ano" value={12} suffix=" mil" label="notas fiscais emitidas por conversa no ChatGPT (número ilustrativo)" note="sem abrir nenhum sistema!" />
)

export const ExplainerPaperTearDemo = () => (
  <PaperTear
    at={70}
    from={<HighlightHeadline kicker="A pergunta" text="Quanto tempo você [[perde com burocracia]]?" />}
    to={<Sequence from={70}><BigNumber value={12} suffix=" h" label="por semana, em média, numa empresa pequena (número ilustrativo)" colors={{ paper: '#D9C8A5' }} /></Sequence>}
  />
)

const captionWords = timeWords('Toda sexta-feira a Carla passava o dia [[conferindo planilha.]] Agora ela pede pro [[ChatGPT]] e o sistema faz o resto. A conciliação sai [[em minutos.]]')
/** A photo drifting slowly behind the captions. */
function CaptionBackdrop() {
  const frame = useCurrentFrame()
  return <AbsoluteFill style={{ background: '#111', overflow: 'hidden' }}>
    <Img src={staticFile('limpeza-media/hero.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(frame, [0, 330], [1.05, 1.18])})`, filter: 'brightness(.8) saturate(.9)' }} />
    <AbsoluteFill style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.6) 0%, transparent 45%)' }} />
  </AbsoluteFill>
}
export const ExplainerCaptionsDemo = () => (
  <WordCaptions words={captionWords}><CaptionBackdrop /></WordCaptions>
)

export const ExplainerScreenshotDemo = () => (
  <ScreenshotSpotlight src="dash1.png" imageWidth={1672} imageHeight={941} focus={{ x: 42.6, y: 10.4, w: 25.6, h: 13.6 }} label="Otto — Forecast" note="R$ 284 mi acima do plano!" />
)

export const ExplainerDonutDemo = () => (
  <DonutChart
    title="Onde vai o tempo do financeiro"
    subtitle="Horas por semana numa empresa pequena (exemplo ilustrativo)"
    items={[{ label: 'Conferir pagamentos', value: 38 }, { label: 'Emitir notas', value: 24 }, { label: 'Cobrar clientes', value: 22 }, { label: 'Relatórios', value: 16 }]}
    highlight={0}
    note="quase 40% só conferindo!"
  />
)

export const ExplainerIconGridDemo = () => (
  <IconGrid title="Ainda na planilha" value={37} label="de cada 100 pequenas empresas controlam o caixa em planilha (número ilustrativo)" note="e você?" />
)

export const ExplainerEvidenceDemo = () => (
  <EvidenceBoard
    title="Onde o dinheiro some"
    items={[
      { src: 'nfse.jpg', title: 'nota esquecida', x: 0.22, y: 0.34 },
      { title: 'Boleto vencido', caption: 'R$ 1.200 de multa', x: 0.5, y: 0.26 },
      { src: 'oficina-media/hero.jpg', title: 'cliente que não pagou', x: 0.78, y: 0.38 },
      { title: 'Planilha com erro', caption: 'fórmula quebrada desde março', x: 0.34, y: 0.72 },
      { src: 'dashboard.jpeg', title: 'relatório atrasado', x: 0.68, y: 0.74 },
    ]}
    links={[[0, 1], [1, 2], [2, 3], [3, 4], [0, 3]]}
  />
)

export const ExplainerNewspaperDemo = () => (
  <SpinningNewspaper
    masthead="Gazeta do Comércio"
    date="Terça, 3 de novembro de 2026"
    headline="ChatGPT agora [[emite nota fiscal]] para pequenas empresas"
    dek="Sistema de gestão por conversa promete acabar com a planilha (manchete ilustrativa)"
    photo="oficina-media/hero.jpg"
  />
)

export const ExplainerFlowDemo = () => (
  <FlowDiagram title="Do pedido ao dinheiro na conta" steps={[{ label: 'Pedido', detail: 'você pede no chat' }, { label: 'Nota fiscal', detail: 'emitida na hora' }, { label: 'Cobrança', detail: 'boleto ou Pix' }, { label: 'Conciliado', detail: 'extrato conferido' }]} active={1} />
)

const chatMessages: ChatMessage[] = [
  { from: 'pessoa', text: 'Emite a nota do cliente Souza, serviço de R$ 1.200.' },
  { from: 'assistente', text: 'Pronto: [[nota emitida]] e enviada por e-mail ao cliente.' },
  { from: 'pessoa', text: 'E cobra em 10 dias, por Pix.' },
  { from: 'assistente', text: 'Cobrança criada com [[vencimento em 14/11]]. Aviso quando pagar.' },
]
export const CHAT_PAPER_DEMO_DURATION = chatPaperDuration(chatMessages)
export const ExplainerChatDemo = () => (
  <ChatPaper title="Gestão conversando" messages={chatMessages} assistantName="Otto no ChatGPT" />
)

export const ExplainerClockDemo = () => (
  <ClockCompare title="Fechar o mês" before={{ label: 'Planilha', minutes: 180 }} after={{ label: 'Otto', minutes: 5 }} savingsLabel="a menos (exemplo ilustrativo)" />
)

export const ExplainerChecklistDemo = () => (
  <Checklist title="Sexta-feira" items={['Nota fiscal emitida', 'Boleto enviado', 'Pagamento recebido', 'Caixa conciliado']} stamp="Resolvido" />
)

export const ExplainerHeadlinesDemo = () => (
  <HeadlineStack
    title="Todo mundo está falando disso"
    clippings={[
      { source: 'Folha do Lojista', headline: 'IA chega ao balcão das pequenas empresas', date: 'out. 2026' },
      { source: 'Notícia Já!', headline: 'Fim da planilha? Gestores testam sistemas por conversa', date: 'out. 2026' },
      { source: 'Jornal da Indústria', headline: 'Assistentes de IA já emitem notas e cobram clientes', date: 'nov. 2026' },
      { source: 'Revista Negócio', headline: 'Contadores se adaptam à gestão por chat', date: 'nov. 2026' },
      { source: 'Gazeta Empresarial', headline: 'Pequenas empresas [[trocam o ERP pelo ChatGPT]]', date: 'nov. 2026' },
    ]}
  />
)

export const ExplainerStatesDemo = () => (
  <BrazilStatesMap
    title="Onde a gestão por conversa mais cresce"
    titleMark="mais cresce"
    subtitle="Empresas usando IA no financeiro, por estado (dados ilustrativos)"
    values={{ sp: 48, rj: 39, mg: 35, pr: 37, sc: 41, rs: 33, df: 44, go: 29, ba: 24, pe: 26, ce: 25, es: 30, mt: 27, ms: 28, am: 18, pa: 17, ma: 14, pi: 13, rn: 19, pb: 18, al: 15, se: 16, to: 15, ro: 16, ac: 11, ap: 12, rr: 10 }}
    format={(v) => `${v}%`}
    legend="Empresas com IA (%)"
    source="exemplo ilustrativo"
  />
)

export const ExplainerGlobeDemo = () => (
  <GlobeSpin
    kicker="Do Brasil para o mundo"
    title="Clientes em 4 países"
    titleMark="4 países"
    from={[20, 25]}
    to={[-45, -12]}
    highlight={['Brazil']}
    arcs={[
      { from: [-46.63, -23.55], to: [-9.14, 38.72] },
      { from: [-46.63, -23.55], to: [-58.38, -34.6] },
      { from: [-46.63, -23.55], to: [-70.65, -33.45] },
      { from: [-46.63, -23.55], to: [-99.13, 19.43] },
    ]}
  />
)

export const ExplainerExampleDemo = () => <ExplainerExampleVideo />
