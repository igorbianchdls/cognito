import fs from 'node:fs'
import path from 'node:path'

const DASHBOARD_SKILL_RELATIVE_PATH = 'src/products/chat/backend/agents/skills/dashboard.md'
const VENDAS_SKILL_RELATIVE_PATH = 'src/products/chat/backend/agents/skills/vendasSkill.md'
const COMPRAS_SKILL_RELATIVE_PATH = 'src/products/chat/backend/agents/skills/comprasSkill.md'
const FINANCEIRO_SKILL_RELATIVE_PATH = 'src/products/chat/backend/agents/skills/financeiroSkill.md'
const MARKETING_SKILL_RELATIVE_PATH = 'src/products/chat/backend/agents/skills/marketingSkill.md'
const ECOMMERCE_SKILL_RELATIVE_PATH = 'src/products/chat/backend/agents/skills/ecommerceSkill.md'

const DASHBOARD_SKILL_FALLBACK = `
# Dashboard Skill

Skill de dashboard indisponivel no momento.
Use o runtime atual de dashboard em JSX, com layout HTML/JSX puro e dataQuery valida nos componentes suportados.
`.trim()

const VENDAS_SKILL_FALLBACK = `
# Vendas Skill

Skill de vendas indisponivel no momento.
Use o template /apps/vendas e os campos do dashboard atual para mapear tabelas, medidas e KPIs.
`.trim()

const COMPRAS_SKILL_FALLBACK = `
# Compras Skill

Skill de compras indisponivel no momento.
Use o template /apps/compras e os campos do dashboard atual para mapear tabelas, medidas e KPIs.
`.trim()

const FINANCEIRO_SKILL_FALLBACK = `
# Financeiro Skill

Skill de financeiro indisponivel no momento.
Use o template /apps/financeiro e os campos do dashboard atual para mapear tabelas, medidas e KPIs.
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

export function loadVendasSkillMarkdown(): string {
  return loadSkillMarkdown(VENDAS_SKILL_RELATIVE_PATH, VENDAS_SKILL_FALLBACK)
}

export function loadComprasSkillMarkdown(): string {
  return loadSkillMarkdown(COMPRAS_SKILL_RELATIVE_PATH, COMPRAS_SKILL_FALLBACK)
}

export function loadFinanceiroSkillMarkdown(): string {
  return loadSkillMarkdown(FINANCEIRO_SKILL_RELATIVE_PATH, FINANCEIRO_SKILL_FALLBACK)
}

export function loadMarketingSkillMarkdown(): string {
  return loadSkillMarkdown(MARKETING_SKILL_RELATIVE_PATH, MARKETING_SKILL_FALLBACK)
}

export function loadEcommerceSkillMarkdown(): string {
  return loadSkillMarkdown(ECOMMERCE_SKILL_RELATIVE_PATH, ECOMMERCE_SKILL_FALLBACK)
}
