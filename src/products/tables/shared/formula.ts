// Formulas of Tables: {Campo} references, numbers, "texts", + - * / & (joins texts), comparisons
// (= <> != < > <= >=) and functions with Portuguese names (English aliases accepted).
// Parsed into a tree and evaluated without eval: a formula only reads values of the same record.
export type FormulaValue = number | string | boolean | null
type Node = { k: 'num'; v: number } | { k: 'str'; v: string } | { k: 'ref'; name: string } | { k: 'call'; name: string; args: Node[] } | { k: 'bin'; op: string; a: Node; b: Node } | { k: 'neg'; a: Node }
export class FormulaError extends Error {}

const FUNCTIONS: Record<string, string> = {
  SE: 'SE', IF: 'SE', E: 'E', AND: 'E', OU: 'OU', OR: 'OU', NAO: 'NAO', NOT: 'NAO', ARRED: 'ARRED', ROUND: 'ARRED', ABS: 'ABS',
  SOMA: 'SOMA', SUM: 'SOMA', MEDIA: 'MEDIA', AVERAGE: 'MEDIA', MIN: 'MIN', MAX: 'MAX', CONCAT: 'CONCAT', MAIUSCULA: 'MAIUSCULA', UPPER: 'MAIUSCULA',
  MINUSCULA: 'MINUSCULA', LOWER: 'MINUSCULA', TAMANHO: 'TAMANHO', LEN: 'TAMANHO', HOJE: 'HOJE', TODAY: 'HOJE', DIAS: 'DIAS', DAYS: 'DIAS',
  ANO: 'ANO', YEAR: 'ANO', MES: 'MES', MONTH: 'MES', VAZIO: 'VAZIO', BLANK: 'VAZIO', TEXTO: 'TEXTO', TEXT: 'TEXTO',
}
export const FORMULA_FUNCTIONS = [...new Set(Object.values(FUNCTIONS))]

function tokenize(source: string) {
  const tokens: { t: string; v: string }[] = []
  let i = 0
  while (i < source.length) {
    const c = source[i]
    if (/\s/.test(c)) { i++; continue }
    if (c === '{') { const end = source.indexOf('}', i); if (end < 0) throw new FormulaError('Feche a referência com }.'); tokens.push({ t: 'ref', v: source.slice(i + 1, end).trim() }); i = end + 1; continue }
    if (c === '"') { let j = i + 1, text = ''; while (j < source.length && source[j] !== '"') { if (source[j] === '\\' && source[j + 1] === '"') { text += '"'; j += 2 } else text += source[j++] } if (j >= source.length) throw new FormulaError('Feche o texto com aspas.'); tokens.push({ t: 'str', v: text }); i = j + 1; continue }
    const number = source.slice(i).match(/^\d+(\.\d+)?/)
    if (number) { tokens.push({ t: 'num', v: number[0] }); i += number[0].length; continue }
    const word = source.slice(i).match(/^[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ_0-9]*/)
    if (word) { tokens.push({ t: 'name', v: word[0] }); i += word[0].length; continue }
    const op = ['<=', '>=', '<>', '!='].find(o => source.startsWith(o, i)) ?? (/[-+*/&=<>(),;]/.test(c) ? c : null)
    if (!op) throw new FormulaError(`Caractere inesperado: ${c}`)
    tokens.push({ t: 'op', v: op === ';' ? ',' : op }); i += op.length
  }
  return tokens
}
const PRECEDENCE: Record<string, number> = { '=': 1, '<>': 1, '!=': 1, '<': 1, '>': 1, '<=': 1, '>=': 1, '&': 2, '+': 3, '-': 3, '*': 4, '/': 4 }
export function parseFormula(source: string): Node {
  const tokens = tokenize(source); let pos = 0
  const peek = () => tokens[pos], next = () => tokens[pos++]
  const expect = (v: string) => { const t = next(); if (!t || t.v !== v) throw new FormulaError(`Esperava "${v}".`) }
  function primary(): Node {
    const t = next()
    if (!t) throw new FormulaError('A fórmula terminou antes do esperado.')
    if (t.t === 'num') return { k: 'num', v: Number(t.v) }
    if (t.t === 'str') return { k: 'str', v: t.v }
    if (t.t === 'ref') { if (!t.v) throw new FormulaError('Informe o nome do campo entre { }.'); return { k: 'ref', name: t.v } }
    if (t.t === 'op' && t.v === '(') { const inner = expression(0); expect(')'); return inner }
    if (t.t === 'op' && t.v === '-') return { k: 'neg', a: primary() }
    if (t.t === 'name') {
      const upper = t.v.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()
      if (upper === 'VERDADEIRO' || upper === 'TRUE') return { k: 'num', v: 1 }
      if (upper === 'FALSO' || upper === 'FALSE') return { k: 'num', v: 0 }
      const name = FUNCTIONS[upper]
      if (!name) throw new FormulaError(`Função desconhecida: ${t.v}. Use ${FORMULA_FUNCTIONS.join(', ')}.`)
      expect('('); const args: Node[] = []
      if (peek()?.v !== ')') { args.push(expression(0)); while (peek()?.v === ',') { next(); args.push(expression(0)) } }
      expect(')'); return { k: 'call', name, args }
    }
    throw new FormulaError(`Não esperava "${t.v}".`)
  }
  function expression(min: number): Node {
    let left = primary()
    for (;;) {
      const t = peek(), p = t && t.t === 'op' ? PRECEDENCE[t.v] : undefined
      if (p === undefined || p < min) break
      next(); left = { k: 'bin', op: t.v, a: left, b: expression(p + 1) }
    }
    return left
  }
  const tree = expression(0)
  if (pos < tokens.length) throw new FormulaError(`Sobrou "${tokens[pos].v}" no fim da fórmula.`)
  return tree
}
export function formulaReferences(node: Node): string[] {
  if (node.k === 'ref') return [node.name]
  if (node.k === 'call') return node.args.flatMap(formulaReferences)
  if (node.k === 'bin') return [...formulaReferences(node.a), ...formulaReferences(node.b)]
  if (node.k === 'neg') return formulaReferences(node.a)
  return []
}

const num = (v: FormulaValue) => { if (v === null || v === '') return 0; if (typeof v === 'boolean') return v ? 1 : 0; const n = Number(v); if (!Number.isFinite(n)) throw new FormulaError(`"${v}" não é um número.`); return n }
const text = (v: FormulaValue) => v === null ? '' : typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : typeof v === 'number' ? String(Math.round(v * 1e10) / 1e10) : v
const truthy = (v: FormulaValue) => !(v === null || v === '' || v === 0 || v === false)
const day = (v: FormulaValue) => { const t = Date.parse(text(v).length === 10 ? text(v) + 'T00:00:00Z' : text(v)); if (!Number.isFinite(t)) throw new FormulaError(`"${text(v)}" não é uma data.`); return t }
const today = () => new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) + 'T00:00:00Z').getTime()

export function evaluateFormula(node: Node, value: (name: string) => FormulaValue): FormulaValue {
  const ev = (n: Node) => evaluateFormula(n, value)
  switch (node.k) {
    case 'num': return node.v
    case 'str': return node.v
    case 'ref': return value(node.name)
    case 'neg': return -num(ev(node.a))
    case 'bin': {
      const a = ev(node.a), b = ev(node.b)
      switch (node.op) {
        case '+': return num(a) + num(b)
        case '-': return num(a) - num(b)
        case '*': return num(a) * num(b)
        case '/': { if (num(b) === 0) throw new FormulaError('Divisão por zero.'); return num(a) / num(b) }
        case '&': return text(a) + text(b)
        default: {
          const both = typeof a === 'number' && typeof b === 'number', x = both ? a : text(a), y = both ? b : text(b)
          return { '=': x === y, '<>': x !== y, '!=': x !== y, '<': x < y, '>': x > y, '<=': x <= y, '>=': x >= y }[node.op] ?? null
        }
      }
    }
    case 'call': {
      const args = node.name === 'SE' ? [] : node.args.map(ev), arity = (n: number) => { if (node.args.length !== n) throw new FormulaError(`${node.name} recebe ${n} ${n === 1 ? 'valor' : 'valores'}.`) }
      switch (node.name) {
        case 'SE': { if (node.args.length < 2 || node.args.length > 3) throw new FormulaError('SE recebe condição, valor se verdadeiro e (opcional) valor se falso.'); return truthy(ev(node.args[0])) ? ev(node.args[1]) : node.args[2] ? ev(node.args[2]) : null }
        case 'E': return args.every(truthy)
        case 'OU': return args.some(truthy)
        case 'NAO': arity(1); return !truthy(args[0])
        case 'ARRED': { const d = args.length > 1 ? num(args[1]) : 0, f = 10 ** d; return Math.round(num(args[0]) * f) / f }
        case 'ABS': arity(1); return Math.abs(num(args[0]))
        case 'SOMA': return args.reduce<number>((s, v) => s + num(v), 0)
        case 'MEDIA': return args.length ? args.reduce<number>((s, v) => s + num(v), 0) / args.length : null
        case 'MIN': return args.length ? Math.min(...args.map(num)) : null
        case 'MAX': return args.length ? Math.max(...args.map(num)) : null
        case 'CONCAT': return args.map(text).join('')
        case 'MAIUSCULA': arity(1); return text(args[0]).toLocaleUpperCase('pt-BR')
        case 'MINUSCULA': arity(1); return text(args[0]).toLocaleLowerCase('pt-BR')
        case 'TAMANHO': arity(1); return text(args[0]).length
        case 'TEXTO': arity(1); return text(args[0])
        case 'VAZIO': arity(1); return !truthy(args[0]) && args[0] !== 0
        case 'HOJE': arity(0); return new Date(today()).toISOString().slice(0, 10)
        case 'DIAS': { arity(2); if (args[0] === null || args[1] === null) return null; return Math.round((day(args[0]) - day(args[1])) / 86_400_000) }
        case 'ANO': arity(1); return args[0] === null ? null : new Date(day(args[0])).getUTCFullYear()
        case 'MES': arity(1); return args[0] === null ? null : new Date(day(args[0])).getUTCMonth() + 1
      }
      throw new FormulaError(`Função desconhecida: ${node.name}.`)
    }
  }
}
