// The Explainer components with sample content, as shown in /remotion-preview. Figures marked as illustrative are examples, not data.
import { BarsCount } from './BarsCount'
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
