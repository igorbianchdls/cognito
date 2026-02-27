import fs from 'node:fs'
import path from 'node:path'

const DASHBOARD_SKILL_RELATIVE_PATHS = [
  'src/products/chat/backend/features/agents/skills/dashboard.md',
  'src/products/chat/backend/features/agents/skills/dashboardSKILL.md',
]

const DASHBOARD_SKILL_FALLBACK = `
# Dashboard Skill

Skill de dashboard indisponivel no momento.
Use o catalogo em /api/modulos/query/catalog e gere JSON Render com dataQuery valida.
`.trim()

export function loadDashboardSkillMarkdown(): string {
  for (const relativePath of DASHBOARD_SKILL_RELATIVE_PATHS) {
    try {
      const filePath = path.join(process.cwd(), relativePath)
      const markdown = fs.readFileSync(filePath, 'utf8').trim()
      if (markdown) return markdown
    } catch {}
  }
  return DASHBOARD_SKILL_FALLBACK
}
