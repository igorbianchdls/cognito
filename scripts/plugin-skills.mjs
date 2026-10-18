// Skills of the MCP plugins come from one source, src/products/mcpcore/hosts/shared/skills. Text meant
// for one host only is written as {chatgpt}…{/chatgpt} or {claude}…{/claude}; each package keeps its own.
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const SKILLS_SOURCE = resolve(root, 'src/products/mcpcore/hosts/shared/skills')
export function renderSkill(text, host) {
  if (!['chatgpt', 'claude'].includes(host)) throw new Error(`Host desconhecido: ${host}`)
  const out = text.replace(/\{(chatgpt|claude)\}([\s\S]*?)\{\/\1\}/g, (_, owner, body) => owner === host ? body : '')
  if (/\{\/?(chatgpt|claude)\}/.test(out)) throw new Error('Marcação de host sem fechamento em uma skill.')
  return out
}
/** Contents of skills/<name>/SKILL.md for a host. */
export const skillFor = (name, host) => renderSkill(readFileSync(resolve(SKILLS_SOURCE, name, 'SKILL.md'), 'utf8'), host)
