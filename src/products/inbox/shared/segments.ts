// Segment rules shared by the screens and the server: what can be filtered, how it reads, and the checks before saving.
import type { ChannelKind } from './rules'

export type SegmentField =
  | 'etiqueta' | 'origem' | 'canal' | 'comprou' | 'reembolsou' | 'total_gasto' | 'ultima_mensagem' | 'criado'
  | 'negocio' | 'etapa' | 'campo' | 'telefone' | 'email'
export type SegmentOp =
  | 'tem' | 'nao_tem' | 'igual' | 'contem' | 'vazio' | 'preenchido' | 'maior' | 'menor' | 'ha_menos' | 'ha_mais'
  | 'sim' | 'nao' | 'aberto' | 'ganho' | 'perdido' | 'nenhum'
export type SegmentCondition = { campo: SegmentField; op: SegmentOp; valor?: string | number | null; chave?: string | null }
export type SegmentRules = { modo: 'todas' | 'qualquer'; condicoes: SegmentCondition[] }

export const EMPTY_RULES: SegmentRules = { modo: 'todas', condicoes: [] }
export const MAX_CONDITIONS = 20

/** For each field: label, the operators it accepts and what its value is. */
export const SEGMENT_FIELDS: Record<SegmentField, { label: string; ops: SegmentOp[]; valor: 'nenhum' | 'etiqueta' | 'canal' | 'texto' | 'numero' | 'dias' | 'etapa' | 'campo' }> = {
  etiqueta: { label: 'Etiqueta', ops: ['tem', 'nao_tem'], valor: 'etiqueta' },
  origem: { label: 'Origem', ops: ['igual', 'contem', 'vazio', 'preenchido'], valor: 'texto' },
  canal: { label: 'Canal', ops: ['tem', 'nao_tem'], valor: 'canal' },
  comprou: { label: 'Comprou', ops: ['sim', 'nao'], valor: 'texto' },
  reembolsou: { label: 'Pediu reembolso', ops: ['sim', 'nao'], valor: 'texto' },
  total_gasto: { label: 'Total gasto (R$)', ops: ['maior', 'menor'], valor: 'numero' },
  ultima_mensagem: { label: 'Última mensagem do contato', ops: ['ha_menos', 'ha_mais'], valor: 'dias' },
  criado: { label: 'Contato criado', ops: ['ha_menos', 'ha_mais'], valor: 'dias' },
  negocio: { label: 'Negócio', ops: ['aberto', 'ganho', 'perdido', 'nenhum'], valor: 'nenhum' },
  etapa: { label: 'Etapa do funil', ops: ['igual'], valor: 'etapa' },
  campo: { label: 'Campo personalizado', ops: ['igual', 'contem', 'vazio', 'preenchido'], valor: 'campo' },
  telefone: { label: 'Telefone', ops: ['preenchido', 'vazio'], valor: 'nenhum' },
  email: { label: 'E-mail', ops: ['preenchido', 'vazio'], valor: 'nenhum' },
}

export const OP_LABEL: Record<SegmentOp, string> = {
  tem: 'tem', nao_tem: 'não tem', igual: 'é igual a', contem: 'contém', vazio: 'está vazio', preenchido: 'está preenchido',
  maior: 'maior que', menor: 'menor que', ha_menos: 'há menos de', ha_mais: 'há mais de', sim: 'sim', nao: 'não',
  aberto: 'tem aberto', ganho: 'tem ganho', perdido: 'tem perdido', nenhum: 'não tem nenhum',
}

/** Operators that need no value. */
const NO_VALUE = new Set<SegmentOp>(['vazio', 'preenchido', 'aberto', 'ganho', 'perdido', 'nenhum'])
export const needsValue = (c: SegmentCondition) => {
  if (NO_VALUE.has(c.op) || SEGMENT_FIELDS[c.campo].valor === 'nenhum') return false
  // "comprou"/"reembolsou" take an optional product name.
  return c.campo !== 'comprou' && c.campo !== 'reembolsou'
}

const CHANNELS: ChannelKind[] = ['whatsapp', 'instagram', 'messenger', 'teste']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Cleans rules from the browser or a tool; throws a message in Portuguese when something is off. */
export function parseRules(input: unknown): SegmentRules {
  const raw = (input && typeof input === 'object' ? input : {}) as { modo?: unknown; condicoes?: unknown }
  const modo = raw.modo === 'qualquer' ? 'qualquer' : 'todas'
  if (!Array.isArray(raw.condicoes)) return { modo, condicoes: [] }
  if (raw.condicoes.length > MAX_CONDITIONS) throw new Error(`Use no máximo ${MAX_CONDITIONS} condições.`)
  const condicoes = raw.condicoes.map((x, i): SegmentCondition => {
    const c = (x ?? {}) as Record<string, unknown>
    const n = `Condição ${i + 1}`
    const campo = c.campo as SegmentField
    const spec = SEGMENT_FIELDS[campo]
    if (!spec) throw new Error(`${n}: campo desconhecido.`)
    const op = c.op as SegmentOp
    if (!spec.ops.includes(op)) throw new Error(`${n}: escolha uma opção válida para ${spec.label.toLowerCase()}.`)
    const out: SegmentCondition = { campo, op }
    const v = c.valor
    if (spec.valor === 'campo') {
      const chave = typeof c.chave === 'string' ? c.chave.trim() : ''
      if (!/^[\p{L}\p{N}_ .-]{1,40}$/u.test(chave)) throw new Error(`${n}: informe o nome do campo.`)
      out.chave = chave
    }
    if (!needsValue(out)) {
      if ((campo === 'comprou' || campo === 'reembolsou') && typeof v === 'string' && v.trim()) out.valor = v.trim().slice(0, 120)
      return out
    }
    switch (spec.valor) {
      case 'etiqueta': case 'etapa':
        if (typeof v !== 'string' || !UUID.test(v)) throw new Error(`${n}: escolha ${spec.valor === 'etapa' ? 'a etapa' : 'a etiqueta'}.`)
        out.valor = v; break
      case 'canal':
        if (!CHANNELS.includes(v as ChannelKind)) throw new Error(`${n}: escolha o canal.`)
        out.valor = v as string; break
      case 'numero': case 'dias': {
        const num = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'))
        if (!Number.isFinite(num) || num < 0 || num > 1e9) throw new Error(`${n}: informe um número.`)
        out.valor = spec.valor === 'dias' ? Math.round(num) : num; break
      }
      default:
        if (typeof v !== 'string' || !v.trim()) throw new Error(`${n}: informe o valor.`)
        out.valor = v.trim().slice(0, 120)
    }
    return out
  })
  return { modo, condicoes }
}

/** One line per condition, for lists and tool answers. */
export function describeCondition(c: SegmentCondition, names: { tags?: Map<string, string>; stages?: Map<string, string> } = {}) {
  const spec = SEGMENT_FIELDS[c.campo]
  const label = c.campo === 'campo' ? `Campo “${c.chave}”` : spec.label
  if (c.campo === 'negocio') return c.op === 'nenhum' ? 'Não tem negócio' : `Tem negócio ${c.op}`
  if (c.campo === 'comprou' || c.campo === 'reembolsou') return `${label}${c.valor ? ` “${c.valor}”` : ''}: ${OP_LABEL[c.op]}`
  let v = c.valor == null ? '' : String(c.valor)
  if (spec.valor === 'etiqueta') v = names.tags?.get(v) ?? 'etiqueta removida'
  if (spec.valor === 'etapa') v = names.stages?.get(v) ?? 'etapa removida'
  if (spec.valor === 'dias') v = `${v} dia(s)`
  if (spec.valor === 'canal') v = ({ whatsapp: 'WhatsApp', instagram: 'Instagram', messenger: 'Messenger', teste: 'Canal de teste' } as Record<string, string>)[v] ?? v
  return `${label} ${OP_LABEL[c.op]}${v ? ` ${v}` : ''}`
}
