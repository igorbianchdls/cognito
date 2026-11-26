// Notas — CSV: ler (vírgula ou ponto e vírgula, aspas), adivinhar o tipo de cada coluna ao importar como base e gerar
// o CSV de uma visão ao exportar. A primeira coluna vira o nome do item.
import { CORES, formatarData, novoId, textoDoValor, TITULO, valorDe, type Item, type Opcao, type Propriedade } from './bases'

/** Lê o CSV (detecta "," ou ";"); linhas vazias são ignoradas. */
export function lerCsv(texto: string): string[][] {
  const limpo = texto.replace(/^﻿/, '')
  const primeira = limpo.split(/\r?\n/, 1)[0] ?? ''
  const separador = (primeira.match(/;/g)?.length ?? 0) > (primeira.match(/,/g)?.length ?? 0) ? ';' : ','
  const linhas: string[][] = []
  let linha: string[] = [], campo = '', aspas = false
  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i]
    if (aspas) {
      if (c === '"' && limpo[i + 1] === '"') { campo += '"'; i++ }
      else if (c === '"') aspas = false
      else campo += c
    } else if (c === '"') aspas = true
    else if (c === separador) { linha.push(campo); campo = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && limpo[i + 1] === '\n') i++
      linha.push(campo); campo = ''
      if (linha.some(v => v.trim())) linhas.push(linha)
      linha = []
    } else campo += c
  }
  linha.push(campo)
  if (linha.some(v => v.trim())) linhas.push(linha)
  return linhas
}

const NUMERO = /^-?(R\$\s?)?(\d{1,3}(\.\d{3})+|\d+)(,\d+)?%?$|^-?\d+(\.\d+)?$/
const DATA_BR = /^(\d{2})\/(\d{2})\/(\d{4})$/
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/
const SIM = ['sim', 's', 'x', 'true', 'verdadeiro', '1', '✓', 'yes']
const NAO = ['não', 'nao', 'n', 'false', 'falso', '0', '', 'no']

function numero(v: string): number {
  const t = v.trim().replace(/^R\$\s?/, '').replace('%', '')
  if (/^-?\d+(\.\d+)?$/.test(t) && !/^\d{1,3}\.\d{3}$/.test(t)) return Number(t)
  return Number(t.replace(/\./g, '').replace(',', '.'))
}
function data(v: string): string {
  const br = DATA_BR.exec(v.trim())
  return br ? `${br[3]}-${br[2]}-${br[1]}` : v.trim()
}

/**
 * Esquema e itens a partir do CSV: número, data, caixa de seleção, seleção (poucos valores que se repetem),
 * seleção múltipla (valores separados por vírgula ou ponto e vírgula, todos curtos) ou texto.
 */
export function importarCsv(linhas: string[][], limite = 2000): { esquema: Propriedade[]; itens: { titulo: string; propriedades: Record<string, unknown> }[] } {
  if (!linhas.length) return { esquema: [], itens: [] }
  const [cabecalho, ...dados] = linhas
  const corpo = dados.slice(0, limite)
  const nomes = new Set<string>()
  const esquema: Propriedade[] = []
  const conversores: ((v: string) => unknown)[] = []
  cabecalho.slice(1).forEach((bruto, indice) => {
    let nome = bruto.trim().slice(0, 100) || `Coluna ${indice + 2}`
    while (nomes.has(nome.toLowerCase())) nome = `${nome} (2)`
    nomes.add(nome.toLowerCase())
    const valores = corpo.map(l => (l[indice + 1] ?? '').trim()).filter(Boolean)
    const id = novoId()
    const todos = (f: (v: string) => boolean) => valores.length > 0 && valores.every(f)
    if (todos(v => NUMERO.test(v.replace(/\s/g, '')))) {
      esquema.push({ id, nome, tipo: 'numero', formato: valores.some(v => v.includes('R$')) ? 'real' : valores.some(v => v.endsWith('%')) ? 'porcentagem' : 'numero' })
      conversores.push(v => v.trim() ? numero(v) : null)
    } else if (todos(v => DATA_BR.test(v) || DATA_ISO.test(v))) {
      esquema.push({ id, nome, tipo: 'data' }); conversores.push(v => v.trim() ? data(v) : null)
    } else if (todos(v => SIM.includes(v.toLowerCase()) || NAO.includes(v.toLowerCase()))) {
      esquema.push({ id, nome, tipo: 'checkbox' }); conversores.push(v => SIM.includes(v.trim().toLowerCase()))
    } else {
      const partes = valores.flatMap(v => v.split(/\s*[;,]\s*/)).filter(Boolean)
      const distintos = [...new Set(valores)]
      const distintosPartes = [...new Set(partes)]
      const opcoes = (lista: string[]): Opcao[] => lista.slice(0, 200).map((n, i) => ({ id: novoId(), nome: n.slice(0, 100), cor: CORES[(i + 1) % CORES.length] }))
      const porNome = (ops: Opcao[]) => new Map(ops.map(o => [o.nome.toLowerCase(), o.id]))
      if (valores.length >= 4 && distintos.length <= Math.max(2, Math.min(12, valores.length / 2)) && distintos.every(v => v.length <= 40)) {
        const ops = opcoes(distintos), mapa = porNome(ops)
        esquema.push({ id, nome, tipo: 'selecao', opcoes: ops }); conversores.push(v => mapa.get(v.trim().toLowerCase()) ?? null)
      } else if (valores.some(v => /[;,]/.test(v)) && distintosPartes.length <= 30 && distintosPartes.every(v => v.length <= 30)) {
        const ops = opcoes(distintosPartes), mapa = porNome(ops)
        esquema.push({ id, nome, tipo: 'multisselecao', opcoes: ops })
        conversores.push(v => { const ids = v.split(/\s*[;,]\s*/).map(p => mapa.get(p.trim().toLowerCase())).filter(Boolean); return ids.length ? [...new Set(ids)] : null })
      } else {
        esquema.push({ id, nome, tipo: 'texto' }); conversores.push(v => v.trim() ? v.slice(0, 10000) : null)
      }
    }
  })
  const itens = corpo.map(l => ({
    titulo: (l[0] ?? '').trim().slice(0, 500),
    propriedades: Object.fromEntries(esquema.map((p, i) => [p.id, conversores[i](l[i + 1] ?? '')]).filter(([, v]) => v !== null && v !== false)),
  }))
  return { esquema, itens }
}

const celula = (v: string) => /[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

/** CSV dos itens (na ordem e com as colunas visíveis da visão), com os valores como aparecem na tela. */
export function gerarCsv(itens: Item[], esquema: Propriedade[], colunas: string[]): string {
  const props = colunas.map(c => esquema.find(p => p.id === c)).filter((p): p is Propriedade => Boolean(p))
  const cabecalho = ['Nome', ...props.map(p => p.nome)]
  const linhas = itens.map(item => [item.titulo, ...props.map(p => {
    const v = valorDe(item, p.id, esquema)
    if (p.tipo === 'data' && typeof v === 'string') return formatarData(v)
    if (p.tipo === 'checkbox' || typeof v === 'boolean') return v ? 'Sim' : 'Não'
    if (p.tipo === 'numero' && typeof v === 'number') return String(v).replace('.', ',')
    return textoDoValor(p, v)
  })])
  return '﻿' + [cabecalho, ...linhas].map(l => l.map(c => celula(String(c ?? ''))).join(';')).join('\r\n')
}

export { TITULO }
