import fs from 'node:fs'
import path from 'node:path'

const DASHBOARD_SKILL_RELATIVE_PATH = 'src/products/chat/backend/features/agents/skills/dashboard.md'
const ERP_SKILL_RELATIVE_PATH = 'src/products/chat/backend/features/agents/skills/erpSkill.md'
const MARKETING_SKILL_RELATIVE_PATH = 'src/products/chat/backend/features/agents/skills/marketingSkill.md'
const ECOMMERCE_SKILL_RELATIVE_PATH = 'src/products/chat/backend/features/agents/skills/ecommerceSkill.md'

const DASHBOARD_SKILL_FALLBACK = `
# Dashboard Skill

Skill de dashboard indisponivel no momento.
Use o catalogo em /api/modulos/query/catalog e gere JSON Render com dataQuery valida.
`.trim()

const ERP_SKILL_FALLBACK = `
# ERP Skill

Skill ERP indisponivel no momento.
Use o catalogo em /api/modulos/query/catalog para mapear model, metricas, dimensoes e filtros.
`.trim()

const MARKETING_SKILL_FALLBACK = `
# Marketing Skill

Skill Marketing indisponivel no momento.
Use os controllers de trafegopago para validar medidas, dimensoes e filtros.
`.trim()

const ECOMMERCE_SKILL_FALLBACK = `
# Ecommerce Skill

Skill Ecommerce indisponivel no momento.
Use o schema ecommerce e o query/options controller para mapear campos suportados.
`.trim()

function loadSkillMarkdown(relativePath: string, fallback: string): string {
  try {
    const filePath = path.join(process.cwd(), relativePath)
    const markdown = fs.readFileSync(filePath, 'utf8').trim()
    if (markdown) return markdown
  } catch {}
  return fallback
}

export function loadDashboardSkillMarkdown(): string {
  return loadSkillMarkdown(DASHBOARD_SKILL_RELATIVE_PATH, DASHBOARD_SKILL_FALLBACK)
}

export function loadErpSkillMarkdown(): string {
  return loadSkillMarkdown(ERP_SKILL_RELATIVE_PATH, ERP_SKILL_FALLBACK)
}

export function loadMarketingSkillMarkdown(): string {
  return loadSkillMarkdown(MARKETING_SKILL_RELATIVE_PATH, MARKETING_SKILL_FALLBACK)
}

export function loadEcommerceSkillMarkdown(): string {
  return loadSkillMarkdown(ECOMMERCE_SKILL_RELATIVE_PATH, ECOMMERCE_SKILL_FALLBACK)
}
