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
  OTTO_FINANCE_AI_50S_SQUARE_DURATION,
  OttoFinanceAi50sSquareVideo,
} from './compositions/OttoFinanceAi50sSquareVideo'
import {
  OTTO_FINANCE_AI_53S_NARRATED_DURATION,
  OttoFinanceAi53sNarratedVideo,
} from './compositions/OttoFinanceAi53sNarratedVideo'
import {
  OTTO_INVOICE_AI_75S_NARRATED_880_DURATION,
  OTTO_INVOICE_AI_60S_NARRATED_DURATION,
  OttoInvoiceAi60sNarratedVideo,
} from './compositions/OttoInvoiceAi60sNarratedVideo'
import {
  OTTO_INVOICE_DIRECT_53S_NARRATED_DURATION,
  OttoInvoiceDirect53sNarratedVideo,
} from './compositions/OttoInvoiceDirect53sNarratedVideo'
import {
  OTTO_FINANCIAL_OPERATORS_50S_NARRATED_DURATION,
  OttoFinancialOperators50sNarratedVideo,
} from './compositions/OttoFinancialOperators50sNarratedVideo'
import {
  OTTO_FINANCIAL_DASHBOARD_DURATION,
  OttoFinancialDashboard,
} from './compositions/OttoFinancialDashboard'
import {
  CHATGPT_PLUS_STATIC_UI_DURATION,
  ChatGptPlusStaticUi,
} from './compositions/ChatGptPlusStaticUi'
import {
  OTTO_RAMP_PAYABLES_UI_DURATION,
  OttoRampPayablesUi,
} from './compositions/OttoRampPayablesUi'
import {
  CHATGPT_MOBILE_EXACT_REPLICA_DURATION,
  CHATGPT_MOBILE_PIX_WHATSAPP_DURATION,
  CHATGPT_MOBILE_FINANCIAL_OPERATIONS_DURATION,
  CHATGPT_MOBILE_STOCK_WHATSAPP_DURATION,
  CHATGPT_MOBILE_BOLETO_WHATSAPP_DURATION,
  CHATGPT_MOBILE_COMPLETE_SALE_DURATION,
  CHATGPT_MOBILE_RECONCILIATION_INVOICES_DURATION,
  CHATGPT_MOBILE_FINANCIAL_SCROLL_DURATION,
  CHATGPT_MOBILE_FINANCIAL_SCROLL_ITEMS_DURATION,
  ChatGptMobileExactReplica,
  ChatGptMobilePixWhatsappVideo,
  ChatGptMobileFinancialOperationsVideo,
  ChatGptMobileStockWhatsappVideo,
  ChatGptMobileBoletoWhatsappVideo,
  ChatGptMobileCompleteSaleVideo,
  ChatGptMobileReconciliationInvoicesVideo,
  ChatGptMobileFinancialScrollVideo,
  ChatGptMobileFinancialScrollItemsVideo,
} from './compositions/ChatGptMobileExactReplica'
import {
  PROMPT_TO_CHART_EXACT_DURATION,
  PromptToChartExactVideo,
} from './compositions/PromptToChartExactVideo'
import {
  OTTO_INVOICE_THREE_STEPS_DURATION,
  OttoInvoiceThreeSteps,
} from './compositions/OttoInvoiceThreeSteps'
import {
  OTTO_INVOICE_TWO_STEPS_DURATION,
  OttoInvoiceTwoSteps,
} from './compositions/OttoInvoiceTwoSteps'
import {
  OTTO_INVOICE_TWO_STEPS_LIST_DURATION,
  OttoInvoiceTwoStepsList,
} from './compositions/OttoInvoiceTwoStepsList'
import {
  OTTO_INVOICE_CHATGPT_DESKTOP_DURATION,
  OttoInvoiceChatGptDesktop,
} from './compositions/OttoInvoiceChatGptDesktop'
import {
  OTTO_INVOICE_CHATGPT_LAPTOP_DURATION,
  OttoInvoiceChatGptLaptop,
} from './compositions/OttoInvoiceChatGptLaptop'
import {
  OTTO_INVOICE_CHATGPT_NATIVE_DURATION,
  OttoInvoiceChatGptNative,
} from './compositions/OttoInvoiceChatGptNative'
import {
  OTTO_INVOICE_CHATGPT_TV_CONTENT_DURATION,
  OttoInvoiceChatGptTvContent,
} from './compositions/OttoInvoiceChatGptTvContent'
import {
  OTTO_INVOICE_CHATGPT_DUAL_SCREEN_DURATION,
  OttoInvoiceChatGptDualScreen,
} from './compositions/OttoInvoiceChatGptDualScreen'
import {
  OTTO_INVOICE_CHATGPT_TV_ZOOM_DURATION,
  OttoInvoiceChatGptTvZoom,
} from './compositions/OttoInvoiceChatGptTvZoom'
import {
  OTTO_INVOICE_CHATGPT_OFFICE_MONITOR_DURATION,
  OttoInvoiceChatGptOfficeMonitor,
} from './compositions/OttoInvoiceChatGptOfficeMonitor'
import {
  JULY_BODY_ILLUSTRATIVE_1_DURATION,
  JULY_BODY_ILLUSTRATIVE_2_DURATION,
  JulyBodyIllustrativeVideo1,
  JulyBodyIllustrativeVideo2,
} from './compositions/JulyBodyIllustrativeVideos'
import {
  PATY_BODY_2_DURATION,
  PATY_BODY_GIO_DURATION,
  PatyBody2IllustrativeVideo,
  PatyBodyGioIllustrativeVideo,
} from './compositions/PatyBodyIllustrativeVideos'
import {
  OTTO_BATCH_INVOICE_SCRIPT_DURATION,
  OTTO_SINGLE_INVOICE_SCRIPT_DURATION,
  OttoBatchInvoiceScriptIllustrativeVideo,
  OttoSingleInvoiceScriptIllustrativeVideo,
} from './compositions/OttoInvoiceScriptsIllustrativeVideos'
import {
  OTTO_COMPANY_BY_CONVERSATION_DURATION,
  OttoCompanyByConversationIllustrativeVideo,
} from './compositions/OttoCompanyByConversationIllustrativeVideo'
import {
  OTTO_HOOK_1_DURATION,
  OTTO_HOOK_2_DURATION,
  OTTO_HOOK_3_DURATION,
  OTTO_HOOK_4_DURATION,
  OTTO_HOOK_5_DURATION,
  OttoHookAutomatedFinanceVideo,
  OttoHookBatchInvoicesVideo,
  OttoHookBoletoPixVideo,
  OttoHookManageByChatVideo,
  OttoHookSingleInvoiceVideo,
} from './compositions/OttoFiveHooksIllustrativeVideos'
import {
  OTTO_BODY_1_DURATION,
  OTTO_BODY_2_DURATION,
  OttoBodyManageByConversationVideo,
  OttoBodySystemBehindVideo,
} from './compositions/OttoTwoBodiesIllustrativeVideos'

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
        component={OttoFinanceAi50sSquareVideo}
        durationInFrames={OTTO_FINANCE_AI_50S_SQUARE_DURATION}
        fps={30}
        height={1080}
        id="video-otto-finance-ai-50s-square"
        width={1080}
      />
      <Composition
        component={OttoFinanceAi53sNarratedVideo}
        durationInFrames={OTTO_FINANCE_AI_53S_NARRATED_DURATION}
        fps={30}
        height={960}
        id="video-otto-finance-ai-53s-narrated"
        width={1080}
      />
      <Composition
        component={OttoInvoiceAi60sNarratedVideo}
        durationInFrames={OTTO_INVOICE_AI_60S_NARRATED_DURATION}
        fps={30}
        height={800}
        id="video-otto-invoice-ai-60s-narrated"
        width={1080}
      />
      <Composition
        component={OttoInvoiceAi60sNarratedVideo}
        durationInFrames={OTTO_INVOICE_AI_75S_NARRATED_880_DURATION}
        fps={30}
        height={880}
        id="video-otto-invoice-ai-60s-narrated-1080x880"
        width={1080}
      />
      <Composition
        component={OttoInvoiceDirect53sNarratedVideo}
        durationInFrames={OTTO_INVOICE_DIRECT_53S_NARRATED_DURATION}
        fps={30}
        height={720}
        id="video-otto-invoice-direct-53s-narrated"
        width={1280}
      />
      <Composition
        component={OttoFinancialOperators50sNarratedVideo}
        durationInFrames={OTTO_FINANCIAL_OPERATORS_50S_NARRATED_DURATION}
        fps={30}
        height={720}
        id="video-otto-financial-operators-50s-narrated"
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
        component={OttoRampPayablesUi}
        durationInFrames={OTTO_RAMP_PAYABLES_UI_DURATION}
        fps={30}
        height={1080}
        id="component-otto-ramp-payables-ui"
        width={1456}
      />
      <Composition
        component={ChatGptMobileExactReplica}
        durationInFrames={CHATGPT_MOBILE_EXACT_REPLICA_DURATION}
        fps={30}
        height={1792}
        id="component-chatgpt-mobile-exact-replica"
        width={828}
      />
      <Composition
        component={ChatGptMobileFinancialOperationsVideo}
        durationInFrames={CHATGPT_MOBILE_FINANCIAL_OPERATIONS_DURATION}
        fps={60}
        height={1792}
        id="video-chatgpt-mobile-financial-operations"
        width={828}
      />
      <Composition
        component={ChatGptMobilePixWhatsappVideo}
        durationInFrames={CHATGPT_MOBILE_PIX_WHATSAPP_DURATION}
        fps={90}
        height={1792}
        id="video-chatgpt-mobile-pix-whatsapp"
        width={828}
      />
      <Composition
        component={ChatGptMobileStockWhatsappVideo}
        durationInFrames={CHATGPT_MOBILE_STOCK_WHATSAPP_DURATION}
        fps={90}
        height={1792}
        id="video-chatgpt-mobile-stock-whatsapp"
        width={828}
      />
      <Composition
        component={ChatGptMobileBoletoWhatsappVideo}
        durationInFrames={CHATGPT_MOBILE_BOLETO_WHATSAPP_DURATION}
        fps={90}
        height={1792}
        id="video-chatgpt-mobile-boleto-whatsapp"
        width={828}
      />
      <Composition
        component={ChatGptMobileCompleteSaleVideo}
        durationInFrames={CHATGPT_MOBILE_COMPLETE_SALE_DURATION}
        fps={90}
        height={1792}
        id="video-chatgpt-mobile-complete-sale"
        width={828}
      />
      <Composition
        component={ChatGptMobileReconciliationInvoicesVideo}
        durationInFrames={CHATGPT_MOBILE_RECONCILIATION_INVOICES_DURATION}
        fps={90}
        height={1792}
        id="video-chatgpt-mobile-reconciliation-invoices"
        width={828}
      />
      <Composition
        component={ChatGptMobileFinancialScrollVideo}
        durationInFrames={CHATGPT_MOBILE_FINANCIAL_SCROLL_DURATION}
        fps={75}
        height={1792}
        id="video-chatgpt-mobile-financial-scroll"
        width={828}
      />
      <Composition
        component={ChatGptMobileFinancialScrollItemsVideo}
        durationInFrames={CHATGPT_MOBILE_FINANCIAL_SCROLL_ITEMS_DURATION}
        fps={60}
        height={1792}
        id="video-chatgpt-mobile-financial-scroll-items"
        width={828}
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
        component={OttoInvoiceThreeSteps}
        durationInFrames={OTTO_INVOICE_THREE_STEPS_DURATION}
        fps={30}
        height={864}
        id="video-otto-invoice-three-steps"
        width={1536}
      />
      <Composition
        component={OttoInvoiceTwoSteps}
        durationInFrames={OTTO_INVOICE_TWO_STEPS_DURATION}
        fps={30}
        height={864}
        id="video-otto-invoice-two-steps"
        width={1536}
      />
      <Composition
        component={OttoInvoiceTwoStepsList}
        durationInFrames={OTTO_INVOICE_TWO_STEPS_LIST_DURATION}
        fps={30}
        height={864}
        id="video-otto-invoice-two-steps-list"
        width={1536}
      />
      <Composition
        component={OttoInvoiceChatGptDesktop}
        durationInFrames={OTTO_INVOICE_CHATGPT_DESKTOP_DURATION}
        fps={30}
        height={864}
        id="video-otto-invoice-chatgpt-desktop"
        width={1536}
      />
      <Composition
        component={OttoInvoiceChatGptLaptop}
        durationInFrames={OTTO_INVOICE_CHATGPT_LAPTOP_DURATION}
        fps={30}
        height={1920}
        id="video-otto-invoice-chatgpt-laptop"
        width={1080}
      />
      <Composition
        component={OttoInvoiceChatGptNative}
        durationInFrames={OTTO_INVOICE_CHATGPT_NATIVE_DURATION}
        fps={30}
        height={1024}
        id="video-otto-invoice-chatgpt-native"
        width={1536}
      />
      <Composition
        component={OttoInvoiceChatGptTvContent}
        durationInFrames={OTTO_INVOICE_CHATGPT_TV_CONTENT_DURATION}
        fps={30}
        height={547}
        id="video-otto-invoice-chatgpt-tv-content"
        width={986}
      />
      <Composition
        component={OttoInvoiceChatGptDualScreen}
        durationInFrames={OTTO_INVOICE_CHATGPT_DUAL_SCREEN_DURATION}
        fps={30}
        height={1920}
        id="video-otto-invoice-chatgpt-dual-screen"
        width={1080}
      />
      <Composition
        component={OttoInvoiceChatGptTvZoom}
        durationInFrames={OTTO_INVOICE_CHATGPT_TV_ZOOM_DURATION}
        fps={30}
        height={1920}
        id="video-otto-invoice-chatgpt-tv-zoom"
        width={1080}
      />
      <Composition
        component={OttoInvoiceChatGptOfficeMonitor}
        durationInFrames={OTTO_INVOICE_CHATGPT_OFFICE_MONITOR_DURATION}
        fps={30}
        height={1920}
        id="video-otto-invoice-chatgpt-office-monitor"
        width={1080}
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
      <Composition
        component={JulyBodyIllustrativeVideo1}
        durationInFrames={JULY_BODY_ILLUSTRATIVE_1_DURATION}
        fps={30}
        height={880}
        id="body-july-illustrative-1"
        width={1080}
      />
      <Composition
        component={JulyBodyIllustrativeVideo2}
        durationInFrames={JULY_BODY_ILLUSTRATIVE_2_DURATION}
        fps={30}
        height={880}
        id="body-july-illustrative-2"
        width={1080}
      />
      <Composition
        component={PatyBodyGioIllustrativeVideo}
        durationInFrames={PATY_BODY_GIO_DURATION}
        fps={30}
        height={880}
        id="body-paty-gio-illustrative"
        width={1080}
      />
      <Composition
        component={PatyBody2IllustrativeVideo}
        durationInFrames={PATY_BODY_2_DURATION}
        fps={30}
        height={880}
        id="body-paty-2-illustrative"
        width={1080}
      />
      <Composition
        component={OttoSingleInvoiceScriptIllustrativeVideo}
        durationInFrames={OTTO_SINGLE_INVOICE_SCRIPT_DURATION}
        fps={30}
        height={800}
        id="body-otto-single-invoice-script"
        width={1080}
      />
      <Composition
        component={OttoBatchInvoiceScriptIllustrativeVideo}
        durationInFrames={OTTO_BATCH_INVOICE_SCRIPT_DURATION}
        fps={30}
        height={800}
        id="body-otto-batch-invoice-script"
        width={1080}
      />
      <Composition
        component={OttoCompanyByConversationIllustrativeVideo}
        durationInFrames={OTTO_COMPANY_BY_CONVERSATION_DURATION}
        fps={30}
        height={880}
        id="body-otto-company-by-conversation"
        width={1080}
      />
      <Composition component={OttoHookSingleInvoiceVideo} durationInFrames={OTTO_HOOK_1_DURATION} fps={30} height={800} id="body-otto-hook-single-invoice" width={1080} />
      <Composition component={OttoHookBatchInvoicesVideo} durationInFrames={OTTO_HOOK_2_DURATION} fps={30} height={800} id="body-otto-hook-batch-invoices" width={1080} />
      <Composition component={OttoHookAutomatedFinanceVideo} durationInFrames={OTTO_HOOK_3_DURATION} fps={30} height={800} id="body-otto-hook-automated-finance" width={1080} />
      <Composition component={OttoHookManageByChatVideo} durationInFrames={OTTO_HOOK_4_DURATION} fps={30} height={800} id="body-otto-hook-manage-by-chat" width={1080} />
      <Composition component={OttoHookBoletoPixVideo} durationInFrames={OTTO_HOOK_5_DURATION} fps={30} height={800} id="body-otto-hook-boleto-pix" width={1080} />
      <Composition component={OttoBodySystemBehindVideo} durationInFrames={OTTO_BODY_1_DURATION} fps={30} height={800} id="body-otto-system-behind" width={1080} />
      <Composition component={OttoBodyManageByConversationVideo} durationInFrames={OTTO_BODY_2_DURATION} fps={30} height={800} id="body-otto-manage-by-conversation" width={1080} />
    </>
  )
}

registerRoot(RemotionDownloadRoot)
