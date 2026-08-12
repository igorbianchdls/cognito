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
import { InvoiceConfirmationScene, TypedStatement } from './OttoInvoiceAi60sNarratedVideo'
import { ExactPromptInputScene } from './PromptToChartExactVideo'

export const OTTO_INVOICE_DIRECT_53S_NARRATED_DURATION = 1590

export function OttoInvoiceDirect53sNarratedVideo() {
  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      <Sequence durationInFrames={120}>
        <TypedStatement duration={120} speed={0.62} text="Agora você pode emitir nota fiscal diretamente pelo ChatGPT ou Claude." />
      </Sequence>

      <Sequence from={120} durationInFrames={120}>
        <ExactPromptInputScene duration={120} label="Por onde começamos?" prompt="Emita a nota fiscal da venda para a Aurora Tecnologia." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={240} durationInFrames={120}><InvoiceConfirmationScene duration={120} /></Sequence>
      <Sequence from={360} durationInFrames={240}>
        <SyncScene assistantText="Valor confirmado. Vou emitir a nota, enviá-la ao cliente e atualizar o financeiro automaticamente." duration={240} invoicePreview invoicePreviewStart={55} rows={invoiceEmissionRows} speed={2.4} subtitle="Nota autorizada, enviada e vinculada ao financeiro" title="Emissão de nota fiscal" />
      </Sequence>

      <Sequence from={600} durationInFrames={60}>
        <TypedStatement duration={60} speed={0.62} text="Mas não faz só isso." />
      </Sequence>

      <Sequence from={660} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Concilie as movimentações bancárias e classifique as despesas." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={750} durationInFrames={75}>
        <SyncScene assistantText="Vou cruzar cada movimentação com o lançamento correspondente." duration={75} kind="reconciliation" rows={reconciliationRows} speed={2.7} subtitle="Bancos, cartões e lançamentos do Otto" title="Conciliação bancária" />
      </Sequence>
      <Sequence from={825} durationInFrames={75}>
        <SyncScene assistantText="Agora vou atualizar as categorias contábeis de cada despesa." duration={75} rows={expenseRows} speed={2.7} subtitle="Fornecedores, categorias, valores e status" title="Classificação de despesas" />
      </Sequence>

      <Sequence from={900} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Organize as contas, cobre os atrasados e verifique as obrigações fiscais." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={990} durationInFrames={60}>
        <SyncScene assistantText="Vou organizar pagamentos e recebimentos." duration={60} rows={accountsRows} speed={3} subtitle="Vencimentos e recebimentos programados" title="Contas a pagar e a receber" />
      </Sequence>
      <Sequence from={1050} durationInFrames={60}>
        <SyncScene assistantText="Agora vou enviar as cobranças e acompanhar os atrasos." duration={60} rows={collectionRows} speed={3} subtitle="Cobranças e acompanhamentos automáticos" title="Clientes em atraso" />
      </Sequence>
      <Sequence from={1110} durationInFrames={60}>
        <SyncScene assistantText="Também vou verificar oportunidades fiscais permitidas pela lei." duration={60} rows={fiscalRows} speed={3} subtitle="Obrigações e economia tributária legal" title="Análise fiscal" />
      </Sequence>

      <Sequence from={1170} durationInFrames={120}><CompatibilityScene duration={120} /></Sequence>
      <Sequence from={1290} durationInFrames={90}>
        <ExactPromptInputScene duration={90} label="Por onde começamos?" prompt="Crie um dashboard com vendas, financeiro, contabilidade e notas fiscais." typingDurationScale={1.15} />
      </Sequence>
      <Sequence from={1380} durationInFrames={150}><OttoFinancialDashboard /></Sequence>
      <Sequence from={1530} durationInFrames={60}><OutroScene duration={60} /></Sequence>
    </AbsoluteFill>
  )
}
