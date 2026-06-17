import { Check, Wrench } from 'lucide-react'
import { getToolLabel, humanizeKey } from '@/products/plugin/web/src/utils/format'

type ToolCallCardProps = {
  structuredContent?: unknown
  toolInput?: unknown
  status?: 'running' | 'done'
}

type Chip = {
  label: string
  value: string
}

const CHIP_KEYS = [
  'action',
  'resource',
  'domain',
  'provider',
  'platform',
  'view',
  'count',
  'limit',
  'period',
  'date_from',
  'date_to',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function getNestedRecord(value: unknown, key: string) {
  if (!isRecord(value)) return null
  return isRecord(value[key]) ? value[key] as Record<string, unknown> : null
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function getToolName(value: unknown): string | null {
  if (!isRecord(value)) return null
  const direct = pickString(value, ['tool', 'name', 'toolName'])
  if (direct) return direct

  const params = getNestedRecord(value, 'params')
  const nested = params ? pickString(params, ['tool', 'name', 'toolName']) : null
  if (nested) return nested

  return null
}

function getArguments(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {}
  const args = getNestedRecord(value, 'arguments') || getNestedRecord(value, 'args') || getNestedRecord(value, 'input')
  if (args) return args

  const params = getNestedRecord(value, 'params')
  if (!params) return {}
  return getNestedRecord(params, 'arguments') || getNestedRecord(params, 'args') || getNestedRecord(params, 'input') || {}
}

function formatChipValue(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function collectChips(structuredContent: unknown, toolInput: unknown) {
  const resultRecord = isRecord(structuredContent) ? structuredContent : {}
  const argsRecord = getArguments(toolInput)
  const chips: Chip[] = []

  for (const key of CHIP_KEYS) {
    const value = formatChipValue(resultRecord[key] ?? argsRecord[key])
    if (!value) continue
    chips.push({
      label: humanizeKey(key),
      value: value.length > 34 ? `${value.slice(0, 31)}...` : value,
    })
    if (chips.length >= 4) break
  }

  return chips
}

export function ToolCallCard({
  structuredContent,
  toolInput,
  status = structuredContent ? 'done' : 'running',
}: ToolCallCardProps) {
  const toolName = getToolName(structuredContent) || getToolName(toolInput)
  if (!toolName) return null

  const chips = collectChips(structuredContent, toolInput)
  const statusLabel = status === 'done' ? 'Concluida' : 'Executando'

  return (
    <section className="tool-call-card" aria-label={`Tool ${toolName}`}>
      <span className="tool-call-card__icon" aria-hidden="true">
        <Wrench size={18} strokeWidth={1.5} />
      </span>
      <div className="tool-call-card__body">
        <div className="tool-call-card__main">
          <span className="tool-call-card__name">{toolName}</span>
          <span className={`tool-call-card__status tool-call-card__status--${status}`}>
            {status === 'done' ? <Check size={14} strokeWidth={1.5} /> : null}
            {statusLabel}
          </span>
        </div>
        <span className="tool-call-card__label">{getToolLabel(toolName)}</span>
        {chips.length ? (
          <div className="tool-call-card__chips" aria-label="Argumentos principais">
            {chips.map((chip) => (
              <span className="tool-call-card__chip" key={`${chip.label}:${chip.value}`}>
                <span>{chip.label}</span>
                {chip.value}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
