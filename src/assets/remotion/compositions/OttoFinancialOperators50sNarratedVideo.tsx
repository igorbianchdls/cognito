import { AbsoluteFill, Sequence } from 'remotion'

import {
  collectionRows,
  CompatibilityScene,
  expenseRows,
  fiscalRows,
  invoiceEmissionRows,
  OutroScene,
  reconciliationRows,
  SyncScene,
} from './OttoFinanceAi50sVideo'
import { accountsRows } from './OttoFinanceAi53sNarratedVideo'
import { OttoFinancialDashboard } from './OttoFinancialDashboard'
import { TypedStatement } from './OttoInvoiceAi60sNarratedVideo'
import { OttoLogoRevealHorizontal } from './OttoLogoRevealHorizontal'
import { ExactPromptInputScene } from './PromptToChartExactVideo'

export const OTTO_FINANCIAL_OPERATORS_50S_NARRATED_DURATION = 1500

export function OttoFinancialOperators50sNarratedVideo() {
  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      <Sequence durationInFrames={120}>
        <TypedStatement duration={120} speed={0.75} text="Agora o ChatGPT e o Claude podem operar o financeiro da sua empresa por você." />
      </Sequence>

      <Sequence from={120} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Emita as notas fiscais das minhas vendas recentes." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={210} durationInFrames={150}>
        <SyncScene assistantText="Vou preencher, emitir e enviar as notas, atualizando o financeiro automaticamente." duration={150} invoicePreview invoicePreviewStart={55} rows={invoiceEmissionRows} speed={2.5} subtitle="Notas enviadas e vinculadas ao financeiro" title="Emissão de notas fiscais" />
      </Sequence>

      <Sequence from={360} durationInFrames={90}><OttoLogoRevealHorizontal /></Sequence>
      <Sequence from={450} durationInFrames={60}>
        <TypedStatement duration={60} speed={0.62} text="Mas não faz só isso." />
      </Sequence>

      <Sequence from={510} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Concilie as movimentações bancárias e classifique as despesas." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={600} durationInFrames={75}>
        <SyncScene assistantText="Vou cruzar cada movimentação com o lançamento correspondente." duration={75} kind="reconciliation" rows={reconciliationRows} speed={2.7} subtitle="Bancos, cartões e lançamentos do Otto" title="Conciliação bancária" />
      </Sequence>
      <Sequence from={675} durationInFrames={75}>
        <SyncScene assistantText="Agora vou atualizar as categorias contábeis de cada despesa." duration={75} rows={expenseRows} speed={2.7} subtitle="Fornecedores, categorias, valores e status" title="Classificação de despesas" />
      </Sequence>

      <Sequence from={750} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Organize as contas, cobre os atrasados e verifique as obrigações fiscais." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={840} durationInFrames={60}>
        <SyncScene assistantText="Vou organizar pagamentos e recebimentos." duration={60} rows={accountsRows} speed={3} subtitle="Vencimentos e recebimentos programados" title="Contas a pagar e a receber" />
      </Sequence>
      <Sequence from={900} durationInFrames={60}>
        <SyncScene assistantText="Agora vou enviar as cobranças e acompanhar os atrasos." duration={60} rows={collectionRows} speed={3} subtitle="Cobranças e acompanhamentos automáticos" title="Clientes em atraso" />
      </Sequence>
      <Sequence from={960} durationInFrames={60}>
        <SyncScene assistantText="Também vou verificar oportunidades fiscais permitidas pela lei." duration={60} rows={fiscalRows} speed={3} subtitle="Obrigações e economia tributária legal" title="Análise fiscal" />
      </Sequence>

      <Sequence from={1020} durationInFrames={120}><CompatibilityScene duration={120} /></Sequence>
      <Sequence from={1140} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Crie um dashboard com vendas, financeiro, contabilidade e notas fiscais." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={1230} durationInFrames={210}><OttoFinancialDashboard /></Sequence>
      <Sequence from={1440} durationInFrames={60}><OutroScene duration={60} /></Sequence>
    </AbsoluteFill>
  )
}
