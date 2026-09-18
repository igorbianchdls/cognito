import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion'

import {
  accountsStatusRows,
  CenteredCtaScene,
  collectionStatusRows,
  ConversationScene,
  expenseStatusRows,
  invoiceProgressRows,
  PromptScene,
  reconciliationStatusRows,
} from './JulyBodyIllustrativeVideos'
import {OttoFinancialDashboard} from './OttoFinancialDashboard'
import {OttoLogoRevealHorizontal} from './OttoLogoRevealHorizontal'
import {SyncScene} from './OttoFinanceAi50sVideo'
import {TypedStatement} from './OttoInvoiceAi60sNarratedVideo'

export const PATY_BODY_GIO_DURATION = 887
export const PATY_BODY_2_DURATION = 541

function PatyBodyGioIllustrativeContent() {
  return (
    <AbsoluteFill style={{background: '#ffffff'}}>
      <Audio src={staticFile('remotion/body-paty-audio/GioAntoVideoAcelerado.mp4')} />

      <Sequence durationInFrames={60}>
        <OttoLogoRevealHorizontal centerX={45} centerY="50%" />
      </Sequence>
      <Sequence from={60} durationInFrames={60}>
        <PromptScene duration={60} prompt="Organize todo o financeiro e a contabilidade da minha empresa." />
      </Sequence>
      <Sequence from={120} durationInFrames={90}>
        <OttoFinancialDashboard animationSpeed={2.1} showExtendedKpis />
      </Sequence>

      <Sequence from={210} durationInFrames={45}>
        <PromptScene duration={45} prompt="Sincronize minhas contas e concilie as movimentações bancárias." />
      </Sequence>
      <Sequence from={255} durationInFrames={90}>
        <ConversationScene>
          <SyncScene assistantText="Vou comparar os lançamentos do banco com o financeiro e conciliar cada movimentação." duration={90} kind="reconciliation" paceToDuration rows={reconciliationStatusRows} subtitle="Contas bancárias sincronizadas" title="Conciliação bancária" />
        </ConversationScene>
      </Sequence>

      <Sequence from={345} durationInFrames={60}>
        <PromptScene duration={60} prompt="Registre as vendas de hoje e emita as notas fiscais." />
      </Sequence>
      <Sequence from={405} durationInFrames={120}>
        <ConversationScene>
          <SyncScene assistantText="Vou registrar as vendas, validar os dados e acompanhar a autorização de cada nota fiscal." duration={120} paceToDuration rows={invoiceProgressRows} subtitle="Etapas fiscais atualizadas em tempo real" title="Vendas e notas fiscais" />
        </ConversationScene>
      </Sequence>
      <Sequence from={525} durationInFrames={75}>
        <ConversationScene>
          <SyncScene assistantText="Agora vou organizar as contas a pagar e a receber." duration={75} paceToDuration rows={accountsStatusRows} subtitle="Vencimentos e recebimentos sob controle" title="Contas da empresa" />
        </ConversationScene>
      </Sequence>
      <Sequence from={600} durationInFrames={75}>
        <ConversationScene>
          <SyncScene assistantText="Também vou entrar em contato com os clientes que têm pagamentos pendentes." duration={75} paceToDuration rows={collectionStatusRows} subtitle="Cobranças enviadas automaticamente" title="Cobranças aos clientes" />
        </ConversationScene>
      </Sequence>
      <Sequence from={675} durationInFrames={60}>
        <ConversationScene>
          <SyncScene assistantText="Por fim, vou classificar cada despesa na categoria correta." duration={60} paceToDuration rows={expenseStatusRows} subtitle="Categorias financeiras organizadas" title="Classificação de despesas" />
        </ConversationScene>
      </Sequence>
      <Sequence from={735} durationInFrames={152}>
        <CenteredCtaScene />
      </Sequence>
    </AbsoluteFill>
  )
}

function PatyBody2IllustrativeContent() {
  return (
    <AbsoluteFill style={{background: '#ffffff'}}>
      <Audio src={staticFile('remotion/body-paty-audio/Paty2Video.mp4')} />

      <Sequence durationInFrames={45}>
        <TypedStatement duration={45} speed={0.6} text="O Otto transforma o ChatGPT no financeiro da sua empresa." />
      </Sequence>
      <Sequence from={45} durationInFrames={45}>
        <PromptScene duration={45} prompt="Registre as vendas, organize as contas e emita as notas fiscais." />
      </Sequence>
      <Sequence from={90} durationInFrames={70}>
        <ConversationScene>
          <SyncScene assistantText="Vou registrar as vendas e acompanhar a emissão de todas as notas fiscais." duration={70} paceToDuration rows={invoiceProgressRows} subtitle="Vendas registradas e notas processadas" title="Vendas e notas fiscais" />
        </ConversationScene>
      </Sequence>
      <Sequence from={160} durationInFrames={65}>
        <ConversationScene>
          <SyncScene assistantText="Agora vou atualizar e organizar as contas a pagar." duration={65} paceToDuration rows={accountsStatusRows} subtitle="Vencimentos organizados" title="Contas a pagar" />
        </ConversationScene>
      </Sequence>
      <Sequence from={225} durationInFrames={65}>
        <ConversationScene>
          <SyncScene assistantText="Vou classificar automaticamente as despesas." duration={65} paceToDuration rows={expenseStatusRows} subtitle="Categorias financeiras atualizadas" title="Classificação de despesas" />
        </ConversationScene>
      </Sequence>
      <Sequence from={290} durationInFrames={55}>
        <ConversationScene>
          <SyncScene assistantText="E vou conciliar as movimentações com os lançamentos bancários." duration={55} kind="reconciliation" paceToDuration rows={reconciliationStatusRows} subtitle="Movimentações conferidas" title="Conciliação bancária" />
        </ConversationScene>
      </Sequence>
      <Sequence from={345} durationInFrames={196}>
        <CenteredCtaScene />
      </Sequence>
    </AbsoluteFill>
  )
}

export function PatyBodyGioIllustrativeVideo() {
  return <PatyBodyGioIllustrativeContent />
}

export function PatyBody2IllustrativeVideo() {
  return <PatyBody2IllustrativeContent />
}
