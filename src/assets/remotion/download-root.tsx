import { Composition, registerRoot } from 'remotion'

import {
  ChatGptClaudeOttoAiEmployeesVideo,
  OTTO_AI_EMPLOYEES_CHATGPT_CLAUDE_DURATION,
  OTTO_AI_EMPLOYEES_CLAUDE_DURATION,
  ClaudeOttoAiEmployeesVideo,
} from './compositions/ChatGptClaudeOttoAiEmployeesVideo'
import {
  OTTO_LOGO_REVEAL_HORIZONTAL_DURATION,
  OttoLogoRevealHorizontal,
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
        component={OttoLogoRevealHorizontal}
        durationInFrames={OTTO_LOGO_REVEAL_HORIZONTAL_DURATION}
        fps={30}
        height={720}
        id="otto-logo-reveal-horizontal"
        width={1280}
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
