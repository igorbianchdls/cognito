// Notas — fórmulas das bases de dados (como as do Notion), interpretadas aqui sem eval: texto → símbolos → árvore →
// valor. Funções em português e os nomes do Notion em inglês. Propriedades: prop("Nome").
//   Ex.: if(prop("Prazo") < today(), "Atrasado", "No prazo")   ·   prop("Preço") * prop("Quantidade")
//        concat(prop("Nome"), " — ", formatDate(prop("Data")))   ·   dateBetween(prop("Fim"), prop("Início"), "dias")

export type ValorFormula = number | string | boolean | Date | null
export type ResultadoFormula = { ok: true; valor: ValorFormula } | { ok: false; erro: string }

type No =
  | { t: 'num'; v: number } | { t: 'txt'; v: string } | { t: 'bool'; v: boolean }
  | { t: 'un'; op: string; a: No } | { t: 'bin'; op: string; a: No; b: No } | { t: 'fn'; nome: string; args: No[] }

class ErroFormula extends Error {}
const falha = (msg: string): never => { throw new ErroFormula(msg) }

// ---------------------------------------------------------------- símbolos

type Simbolo = { t: 'num' | 'txt' | 'id' | 'op' | 'fim'; v: string }
const OPERADORES = ['==', '!=', '>=', '<=', '&&', '||', '>', '<', '+', '-', '*', '/', '%', '^', '(', ')', ',', '!']

function simbolos(texto: string): Simbolo[] {
  const lista: Simbolo[] = []
  let i = 0
  while (i < texto.length) {
    const c = texto[i]
    if (/\s/.test(c)) { i++; continue }
    if (/\d/.test(c) || (c === '.' && /\d/.test(texto[i + 1] ?? ''))) {
      const m = /^\d*\.?\d+(e[+-]?\d+)?/i.exec(texto.slice(i))!
      lista.push({ t: 'num', v: m[0] }); i += m[0].length; continue
    }
    if (c === '"' || c === "'" || c === '“') {
      const fecha = c === '“' ? '”' : c
      let j = i + 1, s = ''
      while (j < texto.length && texto[j] !== fecha) { if (texto[j] === '\\' && j + 1 < texto.length) j++; s += texto[j]; j++ }
      if (j >= texto.length) falha('Texto sem as aspas de fechamento.')
      lista.push({ t: 'txt', v: s }); i = j + 1; continue
    }
    if (/[\p{L}_]/u.test(c)) {
      const m = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(texto.slice(i))!
      lista.push({ t: 'id', v: m[0] }); i += m[0].length; continue
    }
    const op = OPERADORES.find(o => texto.startsWith(o, i))
    if (!op) falha(`Símbolo inesperado: ${c}`)
    lista.push({ t: 'op', v: op! }); i += op!.length
  }
  lista.push({ t: 'fim', v: '' })
  return lista
}

// ---------------------------------------------------------------- árvore (precedência: ou < e < comparação < + - < * / % < ^ < unário)

const NIVEIS: string[][] = [['||', 'or', 'ou'], ['&&', 'and', 'e'], ['==', '!=', '>', '<', '>=', '<='], ['+', '-'], ['*', '/', '%'], ['^']]

function analisar(texto: string): No {
  const s = simbolos(texto)
  let p = 0
  const ver = () => s[p]
  const ehOp = (v: string) => (ver().t === 'op' || ver().t === 'id') && ver().v.toLowerCase() === v
  const esperar = (v: string) => { if (!ehOp(v)) falha(`Esperava “${v}”.`); p++ }

  const nivel = (n: number): No => {
    if (n === NIVEIS.length) return unario()
    let a = nivel(n + 1)
    for (;;) {
      const op = NIVEIS[n].find(o => ehOp(o))
      if (!op) return a
      p++
      // ^ associa à direita
      const b = op === '^' ? nivel(n) : nivel(n + 1)
      a = { t: 'bin', op: op === 'or' || op === 'ou' ? '||' : op === 'and' || op === 'e' ? '&&' : op, a, b }
      if (op === '^') return a
    }
  }
  const unario = (): No => {
    if (ehOp('-')) { p++; return { t: 'un', op: '-', a: unario() } }
    if (ehOp('!') || ehOp('not') || ehOp('nao') || ehOp('não')) { p++; return { t: 'un', op: '!', a: unario() } }
    return primario()
  }
  const primario = (): No => {
    const x = ver()
    if (x.t === 'num') { p++; return { t: 'num', v: Number(x.v) } }
    if (x.t === 'txt') { p++; return { t: 'txt', v: x.v } }
    if (x.t === 'op' && x.v === '(') { p++; const dentro = nivel(0); esperar(')'); return dentro }
    if (x.t === 'id') {
      p++
      const nome = x.v.toLowerCase()
      if (['true', 'verdadeiro'].includes(nome)) return { t: 'bool', v: true }
      if (['false', 'falso'].includes(nome)) return { t: 'bool', v: false }
      if (!ehOp('(')) falha(`“${x.v}” não é uma função. Para usar uma propriedade, escreva prop("${x.v}").`)
      p++
      const args: No[] = []
      if (!ehOp(')')) { do { args.push(nivel(0)) } while (ehOp(',') && ++p) }
      esperar(')')
      return { t: 'fn', nome, args }
    }
    return falha(x.t === 'fim' ? 'A fórmula terminou antes do esperado.' : `Símbolo inesperado: ${x.v}`)
  }
  const raiz = nivel(0)
  if (ver().t !== 'fim') falha(`Símbolo inesperado: ${ver().v}`)
  return raiz
}

// ---------------------------------------------------------------- valores

const ehData = (v: unknown): v is Date => v instanceof Date
const vazio = (v: ValorFormula) => v === null || v === '' || v === false
export function comoTexto(v: ValorFormula): string {
  if (v === null) return ''
  if (ehData(v)) return formatarDataFormula(v)
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e10) / 1e10)
  if (typeof v === 'boolean') return v ? 'verdadeiro' : 'falso'
  return v
}
const comoNumero = (v: ValorFormula): number => {
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (ehData(v)) return v.getTime()
  if (v === null || v === '') return 0
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : falha(`“${v}” não é um número.`)
}
const comoData = (v: ValorFormula): Date => {
  if (ehData(v)) return v
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) { const d = new Date(v.length === 10 ? `${v}T00:00:00` : v); if (!Number.isNaN(d.getTime())) return d }
  return falha('Esperava uma data.')
}
function formatarDataFormula(d: Date) {
  const temHora = d.getHours() || d.getMinutes()
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', ...(temHora ? { hour: '2-digit', minute: '2-digit' } : {}) })
}

const UNIDADES: Record<string, 'anos' | 'meses' | 'semanas' | 'dias' | 'horas' | 'minutos'> = {
  ano: 'anos', anos: 'anos', year: 'anos', years: 'anos', mes: 'meses', meses: 'meses', mês: 'meses', month: 'meses', months: 'meses',
  semana: 'semanas', semanas: 'semanas', week: 'semanas', weeks: 'semanas', dia: 'dias', dias: 'dias', day: 'dias', days: 'dias',
  hora: 'horas', horas: 'horas', hour: 'horas', hours: 'horas', minuto: 'minutos', minutos: 'minutos', minute: 'minutos', minutes: 'minutos',
}
const unidade = (v: ValorFormula) => UNIDADES[comoTexto(v).toLowerCase()] ?? falha(`Unidade inválida: “${comoTexto(v)}”. Use dias, semanas, meses, anos, horas ou minutos.`)
function somarData(d: Date, n: number, u: ReturnType<typeof unidade>) {
  const r = new Date(d)
  if (u === 'anos') r.setFullYear(r.getFullYear() + n)
  else if (u === 'meses') r.setMonth(r.getMonth() + n)
  else r.setTime(r.getTime() + n * { semanas: 7 * 864e5, dias: 864e5, horas: 36e5, minutos: 6e4 }[u])
  return r
}
function diferenca(a: Date, b: Date, u: ReturnType<typeof unidade>) {
  if (u === 'anos' || u === 'meses') {
    const meses = (a.getFullYear() - b.getFullYear()) * 12 + a.getMonth() - b.getMonth() - (a.getDate() < b.getDate() && a > b ? 1 : 0)
    return u === 'anos' ? Math.trunc(meses / 12) : meses
  }
  return Math.trunc((a.getTime() - b.getTime()) / { semanas: 7 * 864e5, dias: 864e5, horas: 36e5, minutos: 6e4 }[u])
}

type Contexto = { prop: (nome: string) => ValorFormula; agora: Date }
type Funcao = (args: ValorFormula[], ctx: Contexto) => ValorFormula
const aridade = (nome: string, args: unknown[], min: number, max = min) => {
  if (args.length < min || args.length > max) falha(`${nome}() recebe ${min === max ? min : `de ${min} a ${max}`} valor${max > 1 ? 'es' : ''}.`)
}
const FUNCOES: Record<string, Funcao> = {
  concat: a => a.map(comoTexto).join(''),
  length: a => (aridade('length', a, 1), comoTexto(a[0]).length),
  lower: a => (aridade('lower', a, 1), comoTexto(a[0]).toLowerCase()),
  upper: a => (aridade('upper', a, 1), comoTexto(a[0]).toUpperCase()),
  contains: a => (aridade('contains', a, 2), comoTexto(a[0]).toLowerCase().includes(comoTexto(a[1]).toLowerCase())),
  replace: a => (aridade('replace', a, 3), comoTexto(a[0]).split(comoTexto(a[1])).join(comoTexto(a[2]))),
  slice: a => (aridade('slice', a, 2, 3), comoTexto(a[0]).slice(comoNumero(a[1]), a[2] === undefined ? undefined : comoNumero(a[2]))),
  round: a => { aridade('round', a, 1, 2); const f = 10 ** (a[1] === undefined ? 0 : comoNumero(a[1])); return Math.round(comoNumero(a[0]) * f) / f },
  floor: a => (aridade('floor', a, 1), Math.floor(comoNumero(a[0]))),
  ceil: a => (aridade('ceil', a, 1), Math.ceil(comoNumero(a[0]))),
  abs: a => (aridade('abs', a, 1), Math.abs(comoNumero(a[0]))),
  sqrt: a => (aridade('sqrt', a, 1), Math.sqrt(comoNumero(a[0]))),
  min: a => (a.length ? Math.min(...a.map(comoNumero)) : falha('min() precisa de valores.')),
  max: a => (a.length ? Math.max(...a.map(comoNumero)) : falha('max() precisa de valores.')),
  sum: a => a.reduce<number>((s, v) => s + comoNumero(v), 0),
  tonumber: a => (aridade('toNumber', a, 1), a[0] === null || a[0] === '' ? null : comoNumero(a[0])),
  format: a => (aridade('format', a, 1), comoTexto(a[0])),
  empty: a => (aridade('empty', a, 1), vazio(a[0])),
  now: (a, ctx) => (aridade('now', a, 0), new Date(ctx.agora)),
  today: (a, ctx) => { aridade('today', a, 0); const d = new Date(ctx.agora); d.setHours(0, 0, 0, 0); return d },
  dateadd: a => (aridade('dateAdd', a, 3), somarData(comoData(a[0]), comoNumero(a[1]), unidade(a[2]))),
  datesubtract: a => (aridade('dateSubtract', a, 3), somarData(comoData(a[0]), -comoNumero(a[1]), unidade(a[2]))),
  datebetween: a => (aridade('dateBetween', a, 3), diferenca(comoData(a[0]), comoData(a[1]), unidade(a[2]))),
  formatdate: a => (aridade('formatDate', a, 1), formatarDataFormula(comoData(a[0]))),
  year: a => (aridade('year', a, 1), comoData(a[0]).getFullYear()),
  month: a => (aridade('month', a, 1), comoData(a[0]).getMonth() + 1),
  day: a => (aridade('day', a, 1), comoData(a[0]).getDate()),
  date: a => { aridade('date', a, 3); return new Date(comoNumero(a[0]), comoNumero(a[1]) - 1, comoNumero(a[2])) },
}
// Nomes em português.
const APELIDOS: Record<string, string> = {
  concatenar: 'concat', tamanho: 'length', minusculas: 'lower', minúsculas: 'lower', maiusculas: 'upper', maiúsculas: 'upper', contem: 'contains',
  contém: 'contains', substituir: 'replace', trecho: 'slice', arredondar: 'round', piso: 'floor', teto: 'ceil', absoluto: 'abs', raiz: 'sqrt',
  minimo: 'min', mínimo: 'min', maximo: 'max', máximo: 'max', soma: 'sum', numero: 'tonumber', número: 'tonumber', texto: 'format', vazio: 'empty',
  agora: 'now', hoje: 'today', somardata: 'dateadd', subtrairdata: 'datesubtract', diferencadatas: 'datebetween', diferençadatas: 'datebetween',
  formatardata: 'formatdate', ano: 'year', mes: 'month', mês: 'month', dia: 'day', data: 'date',
}
/** Nomes aceitos (para a ajuda do editor de fórmulas). */
export const FUNCOES_FORMULA = ['prop', 'if', 'concat', 'length', 'lower', 'upper', 'contains', 'replace', 'slice', 'round', 'floor', 'ceil', 'abs', 'sqrt',
  'min', 'max', 'sum', 'toNumber', 'format', 'empty', 'now', 'today', 'dateAdd', 'dateSubtract', 'dateBetween', 'formatDate', 'year', 'month', 'day', 'date']

function avaliar(no: No, ctx: Contexto): ValorFormula {
  switch (no.t) {
    case 'num': case 'txt': case 'bool': return no.v
    case 'un': { const v = avaliar(no.a, ctx); return no.op === '-' ? -comoNumero(v) : vazio(v) }
    case 'bin': {
      if (no.op === '&&') return !vazio(avaliar(no.a, ctx)) && !vazio(avaliar(no.b, ctx))
      if (no.op === '||') return !vazio(avaliar(no.a, ctx)) || !vazio(avaliar(no.b, ctx))
      const a = avaliar(no.a, ctx), b = avaliar(no.b, ctx)
      switch (no.op) {
        case '+':
          if (ehData(a) && typeof b === 'number') return new Date(a.getTime() + b * 864e5)
          return typeof a === 'string' || typeof b === 'string' ? comoTexto(a) + comoTexto(b) : comoNumero(a) + comoNumero(b)
        case '-':
          if (ehData(a) && ehData(b)) return diferenca(a, b, 'dias')
          if (ehData(a)) return new Date(a.getTime() - comoNumero(b) * 864e5)
          return comoNumero(a) - comoNumero(b)
        case '*': return comoNumero(a) * comoNumero(b)
        case '/': { const d = comoNumero(b); return d === 0 ? falha('Divisão por zero.') : comoNumero(a) / d }
        case '%': return comoNumero(a) % comoNumero(b)
        case '^': return comoNumero(a) ** comoNumero(b)
        default: {
          const [x, y] = ehData(a) || ehData(b) ? [comoData(a).getTime(), comoData(b).getTime()]
            : typeof a === 'number' || typeof b === 'number' ? [comoNumero(a), comoNumero(b)] : [comoTexto(a), comoTexto(b)]
          return { '==': x === y, '!=': x !== y, '>': x > y, '<': x < y, '>=': x >= y, '<=': x <= y }[no.op as '==']
        }
      }
    }
    case 'fn': {
      const nome = APELIDOS[no.nome] ?? no.nome
      if (nome === 'prop' || nome === 'propriedade') {
        aridade('prop', no.args, 1)
        if (no.args[0].t !== 'txt') falha('Use prop("Nome da propriedade").')
        return ctx.prop((no.args[0] as { v: string }).v)
      }
      if (nome === 'if' || nome === 'se') {
        aridade('if', no.args, 2, 3)
        return !vazio(avaliar(no.args[0], ctx)) ? avaliar(no.args[1], ctx) : no.args[2] ? avaliar(no.args[2], ctx) : null
      }
      const f = FUNCOES[nome] ?? falha(`Função desconhecida: ${no.nome}().`)
      return f(no.args.map(a => avaliar(a, ctx)), ctx)
    }
  }
}

const cache = new Map<string, No | ErroFormula>()
/** Confere a fórmula sem calcular (para o editor avisar o erro na hora). */
export function validarFormula(expressao: string): string | null {
  try { compilar(expressao); return null } catch (e) { return (e as Error).message }
}
function compilar(expressao: string): No {
  const guardado = cache.get(expressao)
  if (guardado instanceof ErroFormula) throw guardado
  if (guardado) return guardado
  try { const no = analisar(expressao); if (cache.size > 500) cache.clear(); cache.set(expressao, no); return no }
  catch (e) { if (e instanceof ErroFormula) cache.set(expressao, e); throw e }
}

/** Calcula a fórmula. `prop` devolve o valor de uma propriedade pelo nome (com erro se não existir). */
export function calcularFormula(expressao: string, prop: (nome: string) => ValorFormula, agora = new Date()): ResultadoFormula {
  if (!expressao.trim()) return { ok: true, valor: null }
  try {
    const valor = avaliar(compilar(expressao), { prop, agora })
    if (typeof valor === 'number' && !Number.isFinite(valor)) return { ok: false, erro: 'O resultado não é um número válido.' }
    return { ok: true, valor }
  } catch (e) {
    if (e instanceof ErroFormula) return { ok: false, erro: e.message }
    if (e instanceof RangeError) return { ok: false, erro: 'Fórmula grande demais ou que usa a si mesma.' }
    throw e
  }
}
