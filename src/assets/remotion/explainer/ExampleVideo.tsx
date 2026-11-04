import { AbsoluteFill, Sequence } from 'remotion'
import { BigNumber } from './BigNumber'
import { Checklist } from './Checklist'
import { ClockCompare } from './ClockCompare'
import { DonutChart } from './DonutChart'
import { FlowDiagram } from './FlowDiagram'
import { HighlightHeadline } from './HighlightHeadline'
import { IconGrid } from './IconGrid'
import { PaperTear } from './PaperTear'
import { EX } from './theme'
import { WordCaptions, timeWords, type TimedWord } from './WordCaptions'

/*
 * A complete explainer built only from the Explainer components: seven scenes cut on the narration,
 * a torn-paper transition and word-by-word captions on a strip at the bottom (no voice yet: the
 * captions are timed with timeWords; swap in the voice's word timings when there is one).
 * Figures are illustrative.
 */

// [start frame, narration] — each line starts with its scene.
const script: [number, string][] = [
  [12, 'Por que a pequena empresa ainda [[perde tempo]] com o financeiro?'],
  [150, 'De cada cem empresas, [[37]] ainda controlam o caixa na planilha.'],
  [340, 'E quase [[40%]] do tempo vai só para conferir pagamentos.'],
  [520, 'Fechar o mês leva [[três horas]] na planilha. Com o Otto, [[cinco minutos.]]'],
  [740, 'Você pede, o Otto [[emite a nota,]] cobra o cliente e concilia.'],
  [980, 'No fim do dia, [[tudo resolvido.]]'],
  [1190, 'Otto: a sua gestão, [[conversando.]]'],
]
const words: TimedWord[] = script.flatMap(([start, text]) => timeWords(text, start, 1.5))

export const EXPLAINER_EXAMPLE_DURATION = 1340
const STRIP = 150 // caption strip height (the composition is 1920×1080)

export function ExplainerExampleVideo() {
  return (
    <AbsoluteFill style={{ background: EX.paper }}>
      {/* Scenes play in the area above the caption strip. */}
      <AbsoluteFill style={{ bottom: STRIP, height: 'auto', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, width: 1920, height: 1080, transform: `translateX(-50%) scale(${(1080 - STRIP) / 1080})`, transformOrigin: 'top center' }}>
          <Sequence durationInFrames={330}>
            <PaperTear at={130}
              from={<HighlightHeadline kicker="Explicando" text="Por que a pequena empresa ainda [[perde tempo]] com o financeiro?" />}
              to={<Sequence from={130}><IconGrid title="Ainda na planilha" value={37} label="de cada 100 pequenas empresas controlam o caixa em planilha" /></Sequence>} />
          </Sequence>
          <Sequence from={330} durationInFrames={180}>
            <DonutChart title="Onde vai o tempo do financeiro" items={[{ label: 'Conferir pagamentos', value: 38 }, { label: 'Emitir notas', value: 24 }, { label: 'Cobrar clientes', value: 22 }, { label: 'Relatórios', value: 16 }]} highlight={0} />
          </Sequence>
          <Sequence from={510} durationInFrames={220}>
            <ClockCompare title="Fechar o mês" before={{ label: 'Planilha', minutes: 180 }} after={{ label: 'Otto', minutes: 5 }} savingsLabel="a menos" />
          </Sequence>
          <Sequence from={730} durationInFrames={240}>
            <FlowDiagram title="Como o Otto resolve" steps={[{ label: 'Pedido', detail: 'você pede no chat' }, { label: 'Nota fiscal', detail: 'emitida na hora' }, { label: 'Cobrança', detail: 'boleto ou Pix' }, { label: 'Conciliado', detail: 'extrato conferido' }]} />
          </Sequence>
          <Sequence from={970} durationInFrames={210}>
            <Checklist title="Hoje" items={['Nota fiscal emitida', 'Boleto enviado', 'Pagamento recebido', 'Caixa conciliado']} stamp="Resolvido" />
          </Sequence>
          <Sequence from={1180}>
            <BigNumber kicker="Otto" value={5} suffix=" min" label="para fechar o mês, só conversando" />
          </Sequence>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ top: 'auto', height: STRIP, background: EX.card, borderTop: `3px solid ${EX.ink}` }} />
      <WordCaptions words={words} variant="paper" size={64} bottom={38} maxWords={7} />
    </AbsoluteFill>
  )
}
