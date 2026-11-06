import { DASHBOARD_BUILD_DURATION, DashboardBuildAgents } from './compositions/DashboardBuildAgents'
import { DASHBOARD_SEARCH_DURATION, DashboardBuildSearch } from './compositions/DashboardBuildSearch'
import { Composition, registerRoot } from 'remotion'

import {
  BARS_COUNT_DURATION,
  CUTOUT_COLLAGE_DURATION,
  DOCUMENT_ZOOM_DURATION,
  BIG_NUMBER_DURATION,
  BRAZIL_STATES_MAP_DURATION,
  CHAT_PAPER_DEMO_DURATION,
  CHECKLIST_DURATION,
  CLOCK_COMPARE_DURATION,
  EXPLAINER_EXAMPLE_DURATION,
  ExplainerChatDemo,
  ExplainerChecklistDemo,
  ExplainerClockDemo,
  ExplainerExampleDemo,
  ExplainerFlowDemo,
  ExplainerGlobeDemo,
  ExplainerHeadlinesDemo,
  ExplainerStatesDemo,
  FLOW_DIAGRAM_DURATION,
  GLOBE_SPIN_DURATION,
  HEADLINE_STACK_DURATION,
  DONUT_CHART_DURATION,
  EVIDENCE_BOARD_DURATION,
  ExplainerCaptionsDemo,
  ExplainerDonutDemo,
  ExplainerEvidenceDemo,
  ExplainerIconGridDemo,
  ExplainerNewspaperDemo,
  ExplainerScreenshotDemo,
  ICON_GRID_DURATION,
  SCREENSHOT_SPOTLIGHT_DURATION,
  SPINNING_NEWSPAPER_DURATION,
  WORD_CAPTIONS_DURATION,
  ExplainerBarsDemo,
  ExplainerBigNumberDemo,
  ExplainerCollageDemo,
  ExplainerLowerThirdDemo,
  ExplainerPaperTearDemo,
  ExplainerQuoteDemo,
  ExplainerSplitDemo,
  ExplainerTimelineDemo,
  LOWER_THIRD_DURATION,
  PAPER_TEAR_DEMO_DURATION,
  QUOTE_CARD_DURATION,
  SPLIT_COMPARE_DURATION,
  TIMELINE_RULER_DURATION,
  ExplainerDocumentDemo,
  ExplainerHeadlineCircleDemo,
  ExplainerHeadlineDemo,
  ExplainerLineChartDemo,
  ExplainerMapDemo,
  HIGHLIGHT_HEADLINE_DURATION,
  LINE_CHART_DRAW_DURATION,
  MAP_ZOOM_DURATION,
} from './explainer'
import { loadExplainerFonts } from './explainer/fonts'

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
  CHATGPT_MOBILE_PENDING_SALES_BILLS_DURATION,
  CHATGPT_MOBILE_TODAY_SALES_FULL_DURATION,
  CHATGPT_MOBILE_BATCH_INVOICES_DURATION,
  CHATGPT_MOBILE_DIRECT_BATCH_INVOICES_DURATION,
  CHATGPT_MOBILE_COMPLETE_SALE_DURATION,
  CHATGPT_MOBILE_RECONCILIATION_INVOICES_DURATION,
  CHATGPT_MOBILE_FINANCIAL_SCROLL_DURATION,
  CHATGPT_MOBILE_FINANCIAL_SCROLL_ITEMS_DURATION,
  ChatGptMobileExactReplica,
  ChatGptMobilePixWhatsappVideo,
  ChatGptMobileFinancialOperationsVideo,
  ChatGptMobileStockWhatsappVideo,
  ChatGptMobileBoletoWhatsappVideo,
  ChatGptMobilePendingSalesBillsVideo,
  ChatGptMobileTodaySalesFullVideo,
  ChatGptMobileBatchInvoicesVideo,
  ChatGptMobileDirectBatchInvoicesVideo,
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
  JULY_TIMED_BODY_1_DURATION,
  JULY_TIMED_BODY_2_DURATION,
  JULY_TIMED_HOOK_1_DURATION,
  JULY_TIMED_HOOK_2_DURATION,
  JULY_TIMED_HOOK_3_DURATION,
  JULY_TIMED_HOOK_4_DURATION,
  JulyTimedBody1Video,
  JulyTimedBody2Video,
  JulyTimedHook1Video,
  JulyTimedHook2Video,
  JulyTimedHook3Video,
  JulyTimedHook4Video,
} from './compositions/JulyTimedIllustrativeVideos'
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

loadExplainerFonts()

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
        component={ChatGptMobilePendingSalesBillsVideo}
        durationInFrames={CHATGPT_MOBILE_PENDING_SALES_BILLS_DURATION}
        fps={90}
        height={1792}
        id="video-chatgpt-mobile-pending-sales-bills"
        width={828}
      />
      <Composition
        component={ChatGptMobileTodaySalesFullVideo}
        durationInFrames={CHATGPT_MOBILE_TODAY_SALES_FULL_DURATION}
        fps={90}
        height={1792}
        id="video-chatgpt-mobile-today-sales-full"
        width={828}
      />
      <Composition
        component={ChatGptMobileBatchInvoicesVideo}
        durationInFrames={CHATGPT_MOBILE_BATCH_INVOICES_DURATION}
        fps={90}
        height={1792}
        id="video-chatgpt-mobile-batch-invoices"
        width={828}
      />
      <Composition
        component={ChatGptMobileDirectBatchInvoicesVideo}
        durationInFrames={CHATGPT_MOBILE_DIRECT_BATCH_INVOICES_DURATION}
        fps={90}
        height={1792}
        id="video-chatgpt-mobile-direct-batch-invoices"
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
      <Composition component={JulyTimedBody1Video} durationInFrames={JULY_TIMED_BODY_1_DURATION} fps={30} height={800} id="body-july-timed-1" width={1080} />
      <Composition component={JulyTimedBody2Video} durationInFrames={JULY_TIMED_BODY_2_DURATION} fps={30} height={800} id="body-july-timed-2" width={1080} />
      <Composition component={JulyTimedHook1Video} durationInFrames={JULY_TIMED_HOOK_1_DURATION} fps={30} height={800} id="hook-july-timed-1" width={1080} />
      <Composition component={JulyTimedHook2Video} durationInFrames={JULY_TIMED_HOOK_2_DURATION} fps={30} height={800} id="hook-july-timed-2" width={1080} />
      <Composition component={JulyTimedHook3Video} durationInFrames={JULY_TIMED_HOOK_3_DURATION} fps={30} height={800} id="hook-july-timed-3" width={1080} />
      <Composition component={JulyTimedHook4Video} durationInFrames={JULY_TIMED_HOOK_4_DURATION} fps={30} height={800} id="hook-july-timed-4" width={1080} />
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
      {/* Explainer (ids match the catalog values in /remotion-preview, so exports land where the download button looks). */}
      <Composition component={ExplainerHeadlineDemo} durationInFrames={HIGHLIGHT_HEADLINE_DURATION} fps={30} height={1080} id="explainer-headline-marcador" width={1920} />
      <Composition component={ExplainerHeadlineCircleDemo} durationInFrames={HIGHLIGHT_HEADLINE_DURATION} fps={30} height={1080} id="explainer-headline-circulo" width={1920} />
      <Composition component={ExplainerDocumentDemo} durationInFrames={DOCUMENT_ZOOM_DURATION} fps={30} height={1080} id="explainer-documento" width={1920} />
      <Composition component={ExplainerLineChartDemo} durationInFrames={LINE_CHART_DRAW_DURATION} fps={30} height={1080} id="explainer-grafico-linha" width={1920} />
      <Composition component={ExplainerBarsDemo} durationInFrames={BARS_COUNT_DURATION} fps={30} height={1080} id="explainer-barras" width={1920} />
      <Composition component={ExplainerMapDemo} durationInFrames={MAP_ZOOM_DURATION} fps={30} height={1080} id="explainer-mapa" width={1920} />
      <Composition component={ExplainerCollageDemo} durationInFrames={CUTOUT_COLLAGE_DURATION} fps={30} height={1080} id="explainer-colagem" width={1920} />
      <Composition component={ExplainerTimelineDemo} durationInFrames={TIMELINE_RULER_DURATION} fps={30} height={1080} id="explainer-linha-do-tempo" width={1920} />
      <Composition component={ExplainerQuoteDemo} durationInFrames={QUOTE_CARD_DURATION} fps={30} height={1080} id="explainer-citacao" width={1920} />
      <Composition component={ExplainerSplitDemo} durationInFrames={SPLIT_COMPARE_DURATION} fps={30} height={1080} id="explainer-comparacao" width={1920} />
      <Composition component={ExplainerLowerThirdDemo} durationInFrames={LOWER_THIRD_DURATION} fps={30} height={1080} id="explainer-rotulo" width={1920} />
      <Composition component={ExplainerBigNumberDemo} durationInFrames={BIG_NUMBER_DURATION} fps={30} height={1080} id="explainer-numero" width={1920} />
      <Composition component={ExplainerPaperTearDemo} durationInFrames={PAPER_TEAR_DEMO_DURATION} fps={30} height={1080} id="explainer-papel-rasgado" width={1920} />
      <Composition component={ExplainerCaptionsDemo} durationInFrames={WORD_CAPTIONS_DURATION} fps={30} height={1080} id="explainer-legenda" width={1920} />
      <Composition component={ExplainerScreenshotDemo} durationInFrames={SCREENSHOT_SPOTLIGHT_DURATION} fps={30} height={1080} id="explainer-print" width={1920} />
      <Composition component={ExplainerDonutDemo} durationInFrames={DONUT_CHART_DURATION} fps={30} height={1080} id="explainer-rosca" width={1920} />
      <Composition component={ExplainerIconGridDemo} durationInFrames={ICON_GRID_DURATION} fps={30} height={1080} id="explainer-bonecos" width={1920} />
      <Composition component={ExplainerEvidenceDemo} durationInFrames={EVIDENCE_BOARD_DURATION} fps={30} height={1080} id="explainer-mural" width={1920} />
      <Composition component={ExplainerNewspaperDemo} durationInFrames={SPINNING_NEWSPAPER_DURATION} fps={30} height={1080} id="explainer-jornal" width={1920} />
      <Composition component={DashboardBuildAgents} durationInFrames={DASHBOARD_BUILD_DURATION} fps={30} height={1080} id="claude-dashboard-agentes" width={1920} />
      <Composition component={DashboardBuildSearch} durationInFrames={DASHBOARD_SEARCH_DURATION} fps={30} height={1080} id="claude-dashboard-busca" width={1920} />
      <Composition component={ExplainerExampleDemo} durationInFrames={EXPLAINER_EXAMPLE_DURATION} fps={30} height={1080} id="explainer-exemplo" width={1920} />
      <Composition component={ExplainerFlowDemo} durationInFrames={FLOW_DIAGRAM_DURATION} fps={30} height={1080} id="explainer-fluxo" width={1920} />
      <Composition component={ExplainerChatDemo} durationInFrames={CHAT_PAPER_DEMO_DURATION} fps={30} height={1080} id="explainer-conversa" width={1920} />
      <Composition component={ExplainerClockDemo} durationInFrames={CLOCK_COMPARE_DURATION} fps={30} height={1080} id="explainer-relogio" width={1920} />
      <Composition component={ExplainerChecklistDemo} durationInFrames={CHECKLIST_DURATION} fps={30} height={1080} id="explainer-checklist" width={1920} />
      <Composition component={ExplainerHeadlinesDemo} durationInFrames={HEADLINE_STACK_DURATION} fps={30} height={1080} id="explainer-manchetes" width={1920} />
      <Composition component={ExplainerStatesDemo} durationInFrames={BRAZIL_STATES_MAP_DURATION} fps={30} height={1080} id="explainer-mapa-estados" width={1920} />
      <Composition component={ExplainerGlobeDemo} durationInFrames={GLOBE_SPIN_DURATION} fps={30} height={1080} id="explainer-globo" width={1920} />
    </>
  )
}

registerRoot(RemotionDownloadRoot)
