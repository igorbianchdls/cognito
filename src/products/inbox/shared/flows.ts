// The shape of an automation (shared by the editor and the engine) and the checks before publishing.

export type Rule =
  | { tipo: 'etiqueta'; etiqueta: string; tem: boolean }
  | { tipo: 'campo'; campo: string; operador: 'igual' | 'contem' | 'existe' | 'nao_existe'; valor?: string }
  | { tipo: 'horario'; dentro: boolean }
  | { tipo: 'canal'; canal: 'whatsapp' | 'instagram' | 'messenger' | 'teste' }

export type Button = { id: string; label: string; next?: string | null }
export type FlowNode =
  | { id: string; type: 'mensagem'; texto: string; botoes?: Button[]; next?: string | null }
  | { id: string; type: 'pergunta'; texto: string; campo: string; validar?: 'texto' | 'email' | 'telefone' | 'numero'; next?: string | null }
  | { id: string; type: 'condicao'; regra: Rule; sim?: string | null; nao?: string | null }
  | { id: string; type: 'etiqueta'; acao: 'colocar' | 'tirar'; etiqueta: string; next?: string | null }
  | { id: string; type: 'campo'; campo: string; valor: string; next?: string | null }
  | { id: string; type: 'esperar'; minutos: number; next?: string | null }
  | { id: string; type: 'humano'; texto?: string }
  | { id: string; type: 'webhook'; url: string; next?: string | null }
  | { id: string; type: 'ir_para'; fluxo: string }
  | { id: string; type: 'ia'; next?: string | null }
  | { id: string; type: 'negocio'; funil: string; etapa: string; titulo?: string; next?: string | null }

export type NodeType = FlowNode['type']
export type Graph = { start: string | null; nodes: FlowNode[]; positions?: Record<string, { x: number; y: number }> }

export const NODE_LABEL: Record<NodeType, string> = {
  mensagem: 'Enviar mensagem', pergunta: 'Fazer pergunta', condicao: 'Condição', etiqueta: 'Etiqueta', campo: 'Preencher campo',
  esperar: 'Esperar', humano: 'Passar para humano', webhook: 'Chamar link externo', ir_para: 'Ir para outra automação', ia: 'IA responde', negocio: 'Criar negócio',
}

export const TRIGGER_LABEL = {
  palavra_chave: 'Palavra-chave', primeira_mensagem: 'Primeira mensagem', fora_do_horario: 'Fora do horário', link_ref: 'Link com código',
  comentario: 'Comentário em post', story: 'Resposta ou menção no story', compra: 'Compra aprovada', reembolso: 'Reembolso', carrinho_abandonado: 'Carrinho abandonado',
} as const
export type TriggerKind = keyof typeof TRIGGER_LABEL

export const MAX_BUTTONS = 10
export const FIELD = /^[a-z][a-z0-9_]{0,39}$/

/** Where a node goes next, by output (the same names the editor uses for handles). */
export function outputs(n: FlowNode): { handle: string; target: string | null | undefined; label?: string }[] {
  switch (n.type) {
    case 'mensagem': return n.botoes?.length ? n.botoes.map(b => ({ handle: 'b:' + b.id, target: b.next, label: b.label })) : [{ handle: 'next', target: n.next }]
    case 'condicao': return [{ handle: 'sim', target: n.sim, label: 'Sim' }, { handle: 'nao', target: n.nao, label: 'Não' }]
    case 'humano': case 'ir_para': return []
    default: return [{ handle: 'next', target: n.next }]
  }
}

/** Problems that keep a flow from being published (empty list = ok). */
export function validate(g: Graph): string[] {
  const problems: string[] = []
  const ids = new Set(g.nodes.map(n => n.id))
  if (!g.nodes.length) return ['A automação não tem blocos.']
  if (!g.start || !ids.has(g.start)) problems.push('Escolha o bloco inicial.')
  if (ids.size !== g.nodes.length) problems.push('Há blocos com o mesmo id.')
  if (g.nodes.length > 200) problems.push('Use no máximo 200 blocos.')
  for (const n of g.nodes) {
    const name = NODE_LABEL[n.type] ?? n.type
    for (const o of outputs(n)) if (o.target && !ids.has(o.target)) problems.push(`"${name}" aponta para um bloco que não existe.`)
    if ((n.type === 'mensagem' || n.type === 'pergunta') && !n.texto?.trim()) problems.push(`"${name}" está sem texto.`)
    if (n.type === 'mensagem' && (n.botoes?.length ?? 0) > MAX_BUTTONS) problems.push(`Use no máximo ${MAX_BUTTONS} botões por mensagem.`)
    if (n.type === 'mensagem' && n.botoes?.some(b => !b.label.trim() || b.label.length > 20)) problems.push('Botões precisam de texto com até 20 caracteres (limite do WhatsApp).')
    if ((n.type === 'pergunta' || n.type === 'campo') && !FIELD.test(n.campo ?? '')) problems.push(`"${name}": nome de campo com letras minúsculas, números e _ (ex.: tamanho).`)
    if (n.type === 'etiqueta' && !n.etiqueta) problems.push('Escolha a etiqueta.')
    if (n.type === 'esperar' && !(n.minutos >= 1 && n.minutos <= 60 * 24 * 30)) problems.push('Espera entre 1 minuto e 30 dias.')
    if (n.type === 'webhook' && !/^https:\/\//.test(n.url ?? '')) problems.push('O link externo precisa começar com https://.')
    if (n.type === 'ir_para' && !n.fluxo) problems.push('Escolha a automação de destino.')
    if (n.type === 'negocio' && (!n.funil || !n.etapa)) problems.push('Escolha o funil e a etapa do negócio.')
    if (n.type === 'condicao' && !n.regra) problems.push('Defina a condição.')
  }
  return [...new Set(problems)]
}

/** Business hours: {"seg": [["09:00","18:00"]], ...}; null = always open. */
export type Hours = Partial<Record<'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab', [string, string][]>> | null
const DAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const
export function isOpen(hours: Hours, timezone = 'America/Sao_Paulo', now = new Date()) {
  if (!hours) return true
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  const day = DAYS[['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))]
  const minute = Number(get('hour')) * 60 + Number(get('minute'))
  const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0) }
  return (hours[day] ?? []).some(([a, b]) => minute >= toMin(a) && minute < toMin(b))
}

/** "Olá {{nome}}, seu tamanho é {{tamanho}}" with the contact's name and fields. */
export function fill(text: string, values: Record<string, unknown>) {
  return text.replace(/\{\{\s*([a-z_][a-z0-9_]*)\s*\}\}/gi, (_, k: string) => { const v = values[k.toLowerCase()]; return v === undefined || v === null ? '' : String(v) })
}
