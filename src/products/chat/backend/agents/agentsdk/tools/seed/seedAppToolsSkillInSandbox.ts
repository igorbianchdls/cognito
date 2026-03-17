import type { Sandbox } from '@vercel/sandbox'
import { APP_TOOLS_SKILL_MD } from '@/products/chat/backend/agents/agentsdk/tools/skills/appToolsSkill'
import type { AgentSdkSeedTimelineEntry } from '@/products/chat/backend/agents/agentsdk/tools/seed/types'

export async function seedAppToolsSkillInSandbox(
  sandbox: Sandbox,
  timeline?: AgentSdkSeedTimelineEntry[],
) {
  const t0 = Date.now()
  const mkdir = await sandbox.runCommand({
    cmd: 'node',
    args: ['-e', "require('fs').mkdirSync('/vercel/sandbox/.claude/skills/Tools', { recursive: true });"],
  })
  timeline?.push({ name: 'mkdir-skills-tools', ms: Date.now() - t0, ok: mkdir.exitCode === 0, exitCode: mkdir.exitCode })
  if (mkdir.exitCode !== 0) return
  await sandbox.writeFiles([
    {
      path: '/vercel/sandbox/.claude/skills/Tools/SKILL.md',
      content: Buffer.from(APP_TOOLS_SKILL_MD),
    },
  ])
}

