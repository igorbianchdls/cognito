import { Composition, registerRoot } from 'remotion'

import {
  ChatGptClaudeOttoAiEmployeesVideo,
  CLAUDE_FINANCIAL_OPERATION_SCENE_DURATION,
  OTTO_AI_EMPLOYEES_CHATGPT_CLAUDE_DURATION,
  OTTO_AI_EMPLOYEES_CLAUDE_DURATION,
  OTTO_FINANCIAL_OPERATION_SCENE_DURATION,
  ClaudeFinancialOperationSceneVideo,
  ClaudeOttoAiEmployeesVideo,
  OttoFinancialOperationSceneVideo,
} from './compositions/ChatGptClaudeOttoAiEmployeesVideo'
import {
  OTTO_LOGO_REVEAL_HORIZONTAL_DURATION,
  OttoLogoRevealHorizontal,
  OTTO_LOGO_REVEAL_REELS_DURATION,
  OttoLogoRevealReels,
} from './compositions/OttoLogoRevealHorizontal'
import {
  OTTO_ERP_ACCOUNTS_DRAWER_ACTION_DURATION,
  OttoErpAccountsDrawerAction,
} from './compositions/OttoErpAccountsDrawerAction'
import {
  OTTO_ERP_HOME_DASHBOARD_DURATION,
  OttoErpHomeDashboard,
} from './compositions/OttoErpHomeDashboard'
import {
  OTTO_ASSISTANT_CONNECTIONS_DURATION,
  OttoAssistantConnections,
} from './compositions/OttoAssistantConnections'
import {
  OTTO_SYNC_ONLY_SCENE_DURATION,
  OttoSyncOnlyScene,
} from './compositions/OttoSyncOnlyScene'
import {
  OTTO_INVOICE_ONLY_SCENE_DURATION,
  OttoInvoiceOnlyScene,
} from './compositions/OttoInvoiceOnlyScene'
import {
  OTTO_FINANCE_AUTOMATION_ONLY_SCENE_DURATION,
  OttoFinanceAutomationOnlyScene,
} from './compositions/OttoFinanceAutomationOnlyScene'
import {
  OTTO_FINANCE_AI_50S_DURATION,
  OttoFinanceAi50sVideo,
} from './compositions/OttoFinanceAi50sVideo'
import {
  OTTO_FINANCIAL_DASHBOARD_DURATION,
  OttoFinancialDashboard,
} from './compositions/OttoFinancialDashboard'
import {
  CHATGPT_PLUS_STATIC_UI_DURATION,
  ChatGptPlusStaticUi,
} from './compositions/ChatGptPlusStaticUi'
import {
  PROMPT_TO_CHART_EXACT_DURATION,
  PromptToChartExactVideo,
} from './compositions/PromptToChartExactVideo'

function RemotionDownloadRoot() {
  return (
    <>
      <Composition
        component={ChatGptClaudeOttoAiEmployeesVideo}
        durationInFrames={OTTO_AI_EMPLOYEES_CHATGPT_CLAUDE_DURATION}
        fps={30}
        height={1920}
        id="video-otto-ai-employees-chatgpt-claude"
        width={1080}
      />
      <Composition
        component={ClaudeOttoAiEmployeesVideo}
        durationInFrames={OTTO_AI_EMPLOYEES_CLAUDE_DURATION}
        fps={30}
        height={1920}
        id="video-otto-ai-employees-claude"
        width={1080}
      />
      <Composition
        component={OttoFinancialOperationSceneVideo}
        durationInFrames={OTTO_FINANCIAL_OPERATION_SCENE_DURATION}
        fps={30}
        height={1920}
        id="video-otto-financial-operation-scene"
        width={1080}
      />
      <Composition
        component={ClaudeFinancialOperationSceneVideo}
        durationInFrames={CLAUDE_FINANCIAL_OPERATION_SCENE_DURATION}
        fps={30}
        height={1920}
        id="video-claude-financial-operation-scene"
        width={1080}
      />
      <Composition
        component={OttoSyncOnlyScene}
        durationInFrames={OTTO_SYNC_ONLY_SCENE_DURATION}
        fps={30}
        height={1920}
        id="video-otto-sync-only-scene"
        width={1080}
      />
      <Composition
        component={OttoInvoiceOnlyScene}
        durationInFrames={OTTO_INVOICE_ONLY_SCENE_DURATION}
        fps={30}
        height={1920}
        id="video-otto-invoice-only-scene"
        width={1080}
      />
      <Composition
        component={OttoFinanceAutomationOnlyScene}
        durationInFrames={OTTO_FINANCE_AUTOMATION_ONLY_SCENE_DURATION}
        fps={30}
        height={1920}
        id="video-otto-finance-automation-only-scene"
        width={1080}
      />
      <Composition
        component={OttoFinanceAi50sVideo}
        durationInFrames={OTTO_FINANCE_AI_50S_DURATION}
        fps={30}
        height={720}
        id="video-otto-finance-ai-50s"
        width={1280}
      />
      <Composition
        component={OttoFinancialDashboard}
        durationInFrames={OTTO_FINANCIAL_DASHBOARD_DURATION}
        fps={30}
        height={720}
        id="actions-otto-financial-dashboard"
        width={1280}
      />
      <Composition
        component={ChatGptPlusStaticUi}
        durationInFrames={CHATGPT_PLUS_STATIC_UI_DURATION}
        fps={30}
        height={960}
        id="component-chatgpt-plus-static-ui"
        width={1920}
      />
      <Composition
        component={PromptToChartExactVideo}
        durationInFrames={PROMPT_TO_CHART_EXACT_DURATION}
        fps={30}
        height={720}
        id="video-prompt-to-chart-exact"
        width={1280}
      />
      <Composition
        component={OttoLogoRevealHorizontal}
        durationInFrames={OTTO_LOGO_REVEAL_HORIZONTAL_DURATION}
        fps={30}
        height={720}
        id="otto-logo-reveal-horizontal"
        width={1280}
      />
      <Composition
        component={OttoLogoRevealReels}
        durationInFrames={OTTO_LOGO_REVEAL_REELS_DURATION}
        fps={30}
        height={1920}
        id="otto-logo-reveal-reels"
        width={1080}
      />
      <Composition
        component={OttoErpAccountsDrawerAction}
        durationInFrames={OTTO_ERP_ACCOUNTS_DRAWER_ACTION_DURATION}
        fps={30}
        height={720}
        id="actions-otto-erp-accounts-drawer"
        width={1280}
      />
      <Composition
        component={OttoErpHomeDashboard}
        durationInFrames={OTTO_ERP_HOME_DASHBOARD_DURATION}
        fps={30}
        height={720}
        id="actions-otto-erp-home-dashboard"
        width={1280}
      />
      <Composition
        component={OttoAssistantConnections}
        durationInFrames={OTTO_ASSISTANT_CONNECTIONS_DURATION}
        fps={30}
        height={720}
        id="actions-otto-assistant-connections"
        width={1280}
      />
    </>
  )
}

registerRoot(RemotionDownloadRoot)
