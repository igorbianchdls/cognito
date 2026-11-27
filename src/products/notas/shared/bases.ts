import { calcularFormula, validarFormula, type ValorFormula } from './formula'

// Notas — bases de dados (etapas 2 e 3): regras puras usadas pela tela e pelo servidor. Uma base é uma página do tipo
// "base" com um esquema (as propriedades) e visões (tabela, quadro, lista); cada item é uma página com base_id e os
// valores das propriedades em `propriedades` (chave = id da propriedade). O nome do item é o título da página.

export const TIPOS_PROPRIEDADE = [
  'texto', 'numero', 'selecao', 'multisselecao', 'status', 'data', 'pessoa', 'checkbox', 'url', 'email', 'telefone',
  'criado_em', 'editado_em', 'criado_por', 'editado_por', 'relacao', 'agregacao', 'formula',
] as const
export type TipoPropriedade = typeof TIPOS_PROPRIEDADE[number]

export const NOME_TIPO: Record<TipoPropriedade, string> = {
  texto: 'Texto', numero: 'Número', selecao: 'Seleção', multisselecao: 'Seleção múltipla', status: 'Status', data: 'Data',
  pessoa: 'Pessoa', checkbox: 'Caixa de seleção', url: 'URL', email: 'E-mail', telefone: 'Telefone',
  criado_em: 'Criado em', editado_em: 'Editado em', criado_por: 'Criado por', editado_por: 'Editado por',
  relacao: 'Relação', agregacao: 'Agregação', formula: 'Fórmula',
}
/** Tipos calculados na hora (fórmula e agregação): o valor não é guardado no item. */
export const CALCULADOS: TipoPropriedade[] = ['agregacao', 'formula']
/** Tipos preenchidos pelo sistema (não se edita a célula). */
export const AUTOMATICOS: TipoPropriedade[] = ['criado_em', 'editado_em', 'criado_por', 'editado_por', ...CALCULADOS]
export const COM_OPCOES: TipoPropriedade[] = ['selecao', 'multisselecao', 'status']

export const CORES = ['padrao', 'cinza', 'marrom', 'laranja', 'amarelo', 'verde', 'azul', 'roxo', 'rosa', 'vermelho'] as const
export type Cor = typeof CORES[number]
export const NOME_COR: Record<Cor, string> = {
  padrao: 'Padrão', cinza: 'Cinza', marrom: 'Marrom', laranja: 'Laranja', amarelo: 'Amarelo', verde: 'Verde', azul: 'Azul', roxo: 'Roxo', rosa: 'Rosa', vermelho: 'Vermelho',
}

export type GrupoStatus = 'a_fazer' | 'em_andamento' | 'concluido'
export const NOME_GRUPO_STATUS: Record<GrupoStatus, string> = { a_fazer: 'A fazer', em_andamento: 'Em andamento', concluido: 'Concluído' }
export type Opcao = { id: string; nome: string; cor: Cor; grupo?: GrupoStatus }
export type FormatoNumero = 'numero' | 'real' | 'porcentagem'
export type Propriedade = {
  id: string; nome: string; tipo: TipoPropriedade; opcoes?: Opcao[]; formato?: FormatoNumero
  /** Relação: a base cujos itens podem ser ligados. */
  baseRelacionada?: string
  /** Agregação: qual relação, qual propriedade da outra base (ou "titulo") e o cálculo ("mostrar" lista os valores). */
  relacao?: string; alvo?: string; calculo?: Calculo | 'mostrar'
  /** Fórmula: a expressão (ver formula.ts). */
  expressao?: string
  /** Relação nos dois sentidos: a propriedade de relação na outra base que espelha esta. */
  reciproca?: string
  /** Data: avisar na caixa de entrada no dia ou um dia antes. */
  lembrete?: 'no_dia' | 'um_dia_antes'
}

/** "titulo" é o nome do item (a primeira coluna); as demais chaves são ids de propriedades. */
export const TITULO = 'titulo'

export type Operador =
  | 'contem' | 'nao_contem' | 'igual' | 'diferente' | 'comeca' | 'termina' | 'vazio' | 'nao_vazio'
  | 'maior' | 'menor' | 'maior_igual' | 'menor_igual' | 'antes' | 'depois' | 'marcado' | 'desmarcado' | 'tem' | 'nao_tem'
export type Filtro = { prop: string; operador: Operador; valor?: unknown }
export type Ordenacao = { prop: string; direcao: 'asc' | 'desc' }
export type Calculo = 'nenhum' | 'contar' | 'vazios' | 'preenchidos' | 'unicos' | 'soma' | 'media' | 'minimo' | 'maximo' | 'marcados' | 'pct_marcados'
export type TipoVisao = 'tabela' | 'quadro' | 'lista' | 'galeria' | 'calendario' | 'linha_tempo'
export const TIPOS_VISAO: TipoVisao[] = ['tabela', 'quadro', 'lista', 'galeria', 'calendario', 'linha_tempo']
export type Visao = {
  id: string; nome: string; tipo: TipoVisao
  filtros: Filtro[]; juncao: 'e' | 'ou'; ordenacao: Ordenacao[]
  /** Quadro: propriedade de seleção ou status que forma as colunas. */
  agruparPor?: string | null
  /** Propriedades mostradas (na ordem); o título aparece sempre. */
  visiveis: string[]
  larguras?: Record<string, number>
  calculos?: Record<string, Calculo>
  /** Quadro: colunas escondidas (ids de opção; "" = sem valor). */
  colunasOcultas?: string[]
  /** Calendário e linha do tempo: propriedade de data que posiciona os itens (início). */
  dataPor?: string | null
  /** Linha do tempo: propriedade de data do fim (sem ela, cada item ocupa um dia). */
  dataFim?: string | null
  /** Tabela: relação "Item pai" que monta a hierarquia de subitens. */
  subitens?: string | null
  /** Galeria: tamanho do cartão e se mostra a capa do item. */
  tamanhoCartao?: 'pequeno' | 'medio' | 'grande'
  capaCartao?: boolean
}

export type Item = {
  id: string; titulo: string; icone: string | null; posicao: number; propriedades: Record<string, unknown>
  created_at: string; updated_at: string; created_by: string; updated_by: string | null
  capa?: string | null
  /** Modelo de item da base (não aparece nas visões; usado no "Novo ▾"). */
  e_modelo?: boolean
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string }
const ok = <T>(valor: T): Resultado<T> => ({ ok: true, valor })
const erro = (mensagem: string): Resultado<never> => ({ ok: false, erro: mensagem })

const DATA = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const novoId = () => Math.random().toString(36).slice(2, 10)

/** Valida e normaliza o valor de uma célula (null = vazio). Recusa valores que não cabem no tipo. */
export function validarValor(prop: Propriedade, valor: unknown): Resultado<unknown> {
  if (AUTOMATICOS.includes(prop.tipo)) return erro(`“${prop.nome}” é preenchido automaticamente.`)
  if (valor === null || valor === undefined || valor === '' || (Array.isArray(valor) && !valor.length)) return ok(prop.tipo === 'checkbox' ? false : null)
  const ids = new Set((prop.opcoes ?? []).map(o => o.id))
  switch (prop.tipo) {
    case 'texto': case 'telefone':
      return typeof valor === 'string' && valor.length <= 10_000 ? ok(valor) : erro(`“${prop.nome}” precisa ser um texto.`)
    case 'url':
      return typeof valor === 'string' && valor.length <= 2000 ? ok(valor.trim()) : erro(`“${prop.nome}” precisa ser um endereço.`)
    case 'email':
      return typeof valor === 'string' && EMAIL.test(valor.trim()) ? ok(valor.trim()) : erro(`“${prop.nome}” precisa ser um e-mail válido.`)
    case 'numero': {
      const n = typeof valor === 'string' ? Number(valor.replace(/\./g, '').replace(',', '.')) : valor
      return typeof n === 'number' && Number.isFinite(n) ? ok(n) : erro(`“${prop.nome}” precisa ser um número.`)
    }
    case 'checkbox':
      return typeof valor === 'boolean' ? ok(valor) : erro(`“${prop.nome}” é marcado ou desmarcado.`)
    case 'data':
      return typeof valor === 'string' && DATA.test(valor) && !Number.isNaN(Date.parse(`${valor}T00:00:00Z`)) ? ok(valor) : erro(`“${prop.nome}” precisa ser uma data.`)
    case 'selecao': case 'status':
      return typeof valor === 'string' && ids.has(valor) ? ok(valor) : erro(`Opção inexistente em “${prop.nome}”.`)
    case 'multisselecao':
      return Array.isArray(valor) && valor.every(v => typeof v === 'string' && ids.has(v)) ? ok([...new Set(valor as string[])]) : erro(`Opção inexistente em “${prop.nome}”.`)
    case 'relacao':
      return Array.isArray(valor) && valor.length <= 100 && valor.every(v => typeof v === 'string' && UUID.test(v)) ? ok([...new Set(valor as string[])]) : erro(`“${prop.nome}” precisa ser uma lista de itens.`)
    case 'pessoa':
      return Array.isArray(valor) && valor.length <= 50 && valor.every(v => typeof v === 'string' && v.length <= 100) ? ok([...new Set(valor as string[])]) : erro(`“${prop.nome}” precisa ser uma lista de pessoas.`)
    default:
      return erro('Tipo de propriedade desconhecido.')
  }
}

/** Valida o esquema inteiro: nomes, tipos, opções com ids únicos e status com grupo. */
export function validarEsquema(esquema: unknown): Resultado<Propriedade[]> {
  if (!Array.isArray(esquema) || esquema.length > 100) return erro('A base pode ter até 100 propriedades.')
  const ids = new Set<string>(), nomes = new Set<string>()
  const limpo: Propriedade[] = []
  for (const bruto of esquema as Record<string, unknown>[]) {
    const id = String(bruto?.id ?? ''), nome = String(bruto?.nome ?? '').trim(), tipo = bruto?.tipo as TipoPropriedade
    if (!/^[\w-]{1,40}$/.test(id) || id === TITULO || ids.has(id)) return erro('Propriedade com identificador inválido.')
    if (!nome || nome.length > 100) return erro('Toda propriedade precisa de um nome (até 100 letras).')
    if (nomes.has(nome.toLowerCase())) return erro(`Já existe uma propriedade chamada “${nome}”.`)
    if (!TIPOS_PROPRIEDADE.includes(tipo)) return erro(`Tipo inválido em “${nome}”.`)
    ids.add(id); nomes.add(nome.toLowerCase())
    const prop: Propriedade = { id, nome, tipo }
    if (COM_OPCOES.includes(tipo)) {
      const opcoes = Array.isArray(bruto.opcoes) ? bruto.opcoes as Record<string, unknown>[] : []
      if (opcoes.length > 200) return erro(`“${nome}” pode ter até 200 opções.`)
      const idsOpcao = new Set<string>()
      prop.opcoes = []
      for (const o of opcoes) {
        const oid = String(o?.id ?? ''), onome = String(o?.nome ?? '').trim()
        if (!/^[\w-]{1,40}$/.test(oid) || idsOpcao.has(oid) || !onome || onome.length > 100) return erro(`Opção inválida em “${nome}”.`)
        idsOpcao.add(oid)
        const cor = CORES.includes(o.cor as Cor) ? o.cor as Cor : 'padrao'
        prop.opcoes.push(tipo === 'status'
          ? { id: oid, nome: onome, cor, grupo: (['a_fazer', 'em_andamento', 'concluido'] as const).includes(o.grupo as GrupoStatus) ? o.grupo as GrupoStatus : 'a_fazer' }
          : { id: oid, nome: onome, cor })
      }
    }
    if (tipo === 'numero' || tipo === 'formula' || tipo === 'agregacao') {
      prop.formato = (['numero', 'real', 'porcentagem'] as const).includes(bruto.formato as FormatoNumero) ? bruto.formato as FormatoNumero : 'numero'
    }
    if (tipo === 'relacao') {
      if (typeof bruto.baseRelacionada !== 'string' || !UUID.test(bruto.baseRelacionada)) return erro(`Escolha a base ligada em “${nome}”.`)
      prop.baseRelacionada = bruto.baseRelacionada
      if (typeof bruto.reciproca === 'string' && /^[\w-]{1,40}$/.test(bruto.reciproca)) prop.reciproca = bruto.reciproca
    }
    if (tipo === 'data' && (bruto.lembrete === 'no_dia' || bruto.lembrete === 'um_dia_antes')) prop.lembrete = bruto.lembrete
    if (tipo === 'formula') {
      const expressao = typeof bruto.expressao === 'string' ? bruto.expressao.slice(0, 2000) : ''
      const problema = expressao.trim() ? validarFormula(expressao) : null
      if (problema) return erro(`Fórmula de “${nome}”: ${problema}`)
      prop.expressao = expressao
    }
    if (tipo === 'agregacao') {
      prop.relacao = typeof bruto.relacao === 'string' ? bruto.relacao : undefined
      prop.alvo = typeof bruto.alvo === 'string' && /^[\w-]{1,40}$/.test(bruto.alvo) ? bruto.alvo : TITULO
      prop.calculo = typeof bruto.calculo === 'string' && [...Object.keys(NOME_CALCULO), 'mostrar'].includes(bruto.calculo) ? bruto.calculo as Calculo | 'mostrar' : 'mostrar'
    }
    limpo.push(prop)
  }
  // A agregação aponta para uma relação desta base (ou fica sem relação até a pessoa escolher).
  for (const prop of limpo) {
    if (prop.tipo === 'agregacao' && prop.relacao && !limpo.some(p => p.id === prop.relacao && p.tipo === 'relacao')) delete prop.relacao
  }
  return ok(limpo)
}

/** Valida as visões contra o esquema (propriedades que não existem mais são descartadas). */
export function validarVisoes(visoes: unknown, esquema: Propriedade[]): Resultado<Visao[]> {
  if (!Array.isArray(visoes) || !visoes.length || visoes.length > 30) return erro('A base precisa de 1 a 30 visões.')
  const existe = (p: unknown) => p === TITULO || esquema.some(e => e.id === p)
  const ids = new Set<string>()
  const limpas: Visao[] = []
  for (const v of visoes as Record<string, unknown>[]) {
    const id = String(v?.id ?? ''), nome = String(v?.nome ?? '').trim().slice(0, 100) || 'Visão'
    if (!/^[\w-]{1,40}$/.test(id) || ids.has(id)) return erro('Visão com identificador inválido.')
    ids.add(id)
    const tipo = TIPOS_VISAO.includes(v.tipo as TipoVisao) ? v.tipo as TipoVisao : 'tabela'
    const filtros = (Array.isArray(v.filtros) ? v.filtros as Filtro[] : []).filter(f => f && existe(f.prop) && typeof f.operador === 'string').slice(0, 20)
    const ordenacao = (Array.isArray(v.ordenacao) ? v.ordenacao as Ordenacao[] : []).filter(o => o && existe(o.prop))
      .map(o => ({ prop: o.prop, direcao: o.direcao === 'desc' ? 'desc' as const : 'asc' as const })).slice(0, 10)
    const agrupavel = (p: unknown) => esquema.some(e => e.id === p && (e.tipo === 'selecao' || e.tipo === 'status'))
    const visao: Visao = {
      id, nome, tipo, filtros, ordenacao, juncao: v.juncao === 'ou' ? 'ou' : 'e',
      agruparPor: agrupavel(v.agruparPor) ? v.agruparPor as string : null,
      visiveis: (Array.isArray(v.visiveis) ? v.visiveis as string[] : []).filter(p => p !== TITULO && existe(p)),
      larguras: Object.fromEntries(Object.entries((v.larguras ?? {}) as Record<string, unknown>)
        .filter(([p, l]) => existe(p) && typeof l === 'number' && l >= 60 && l <= 1000)) as Record<string, number>,
      calculos: Object.fromEntries(Object.entries((v.calculos ?? {}) as Record<string, unknown>).filter(([p, c]) => existe(p) && typeof c === 'string')) as Record<string, Calculo>,
      colunasOcultas: (Array.isArray(v.colunasOcultas) ? v.colunasOcultas as unknown[] : []).filter((c): c is string => typeof c === 'string').slice(0, 200),
      dataPor: esquema.some(e => e.id === v.dataPor && ['data', 'criado_em', 'editado_em'].includes(e.tipo)) ? v.dataPor as string : null,
      tamanhoCartao: (['pequeno', 'medio', 'grande'] as const).includes(v.tamanhoCartao as 'medio') ? v.tamanhoCartao as 'medio' : 'medio',
      capaCartao: v.capaCartao !== false,
      dataFim: esquema.some(e => e.id === v.dataFim && e.tipo === 'data') ? v.dataFim as string : null,
      subitens: esquema.some(e => e.id === v.subitens && e.tipo === 'relacao') ? v.subitens as string : null,
    }
    if ((tipo === 'calendario' || tipo === 'linha_tempo') && !visao.dataPor) visao.dataPor = esquema.find(e => e.tipo === 'data')?.id ?? esquema.find(e => e.tipo === 'criado_em')?.id ?? null
    if (tipo === 'quadro' && !visao.agruparPor) visao.agruparPor = esquema.find(e => e.tipo === 'status')?.id ?? esquema.find(e => e.tipo === 'selecao')?.id ?? null
    limpas.push(visao)
  }
  return ok(limpas)
}

/** Texto do valor (para converter tipos, buscar e ordenar textos). */
export function textoDoValor(prop: Propriedade | undefined, valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  if (!prop) return String(valor)
  const nomeOpcao = (id: unknown) => prop.opcoes?.find(o => o.id === id)?.nome ?? ''
  switch (prop.tipo) {
    case 'selecao': case 'status': return nomeOpcao(valor)
    case 'multisselecao': return Array.isArray(valor) ? valor.map(nomeOpcao).filter(Boolean).join(', ') : ''
    case 'checkbox': return valor ? 'Sim' : ''
    case 'pessoa': return Array.isArray(valor) ? valor.join(', ') : ''
    case 'relacao': return Array.isArray(valor) ? `${valor.length} ${valor.length === 1 ? 'item' : 'itens'}` : ''
    case 'formula': case 'agregacao': return typeof valor === 'boolean' ? (valor ? 'Sim' : '') : typeof valor === 'number' ? String(valor) : String(valor)
    case 'numero': return typeof valor === 'number' ? String(valor) : ''
    default: return String(valor)
  }
}

/**
 * Converte o valor quando a propriedade muda de tipo (como o Notion: texto vira opção criando a opção; número que
 * não é número fica vazio). Devolve o valor novo e as opções criadas na conversão.
 */
export function converterValor(de: Propriedade, para: Propriedade, valor: unknown): { valor: unknown; opcoesNovas: Opcao[] } {
  const vazio = { valor: para.tipo === 'checkbox' ? false : null, opcoesNovas: [] as Opcao[] }
  if (valor === null || valor === undefined || AUTOMATICOS.includes(para.tipo)) return vazio
  if (de.tipo === para.tipo) return { valor, opcoesNovas: [] }
  // Entre seleção, múltipla e status, as opções são as mesmas (o esquema novo traz as opções da antiga).
  if (COM_OPCOES.includes(de.tipo) && COM_OPCOES.includes(para.tipo)) {
    const lista = Array.isArray(valor) ? valor as string[] : [valor as string]
    const validos = lista.filter(id => para.opcoes?.some(o => o.id === id))
    return { valor: para.tipo === 'multisselecao' ? (validos.length ? validos : null) : validos[0] ?? null, opcoesNovas: [] }
  }
  const texto = textoDoValor(de, valor).trim()
  if (!texto) return vazio
  switch (para.tipo) {
    case 'texto': case 'url': case 'telefone': return { valor: texto, opcoesNovas: [] }
    case 'email': return EMAIL.test(texto) ? { valor: texto, opcoesNovas: [] } : vazio
    case 'numero': { const n = Number(texto.replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return Number.isFinite(n) ? { valor: n, opcoesNovas: [] } : vazio }
    case 'checkbox': return { valor: !['', '0', 'nao', 'não', 'false', 'falso'].includes(texto.toLowerCase()), opcoesNovas: [] }
    case 'data': return DATA.test(texto) ? { valor: texto, opcoesNovas: [] } : vazio
    case 'selecao': case 'status': case 'multisselecao': {
      const nomes = para.tipo === 'multisselecao' ? texto.split(',').map(t => t.trim()).filter(Boolean) : [texto.slice(0, 100)]
      const opcoesNovas: Opcao[] = []
      const ids = nomes.map(nome => {
        const existente = [...(para.opcoes ?? []), ...opcoesNovas].find(o => o.nome.toLowerCase() === nome.toLowerCase())
        if (existente) return existente.id
        const nova: Opcao = { id: novoId(), nome, cor: CORES[(opcoesNovas.length + (para.opcoes?.length ?? 0)) % CORES.length], ...(para.tipo === 'status' ? { grupo: 'a_fazer' as const } : {}) }
        opcoesNovas.push(nova)
        return nova.id
      })
      return { valor: para.tipo === 'multisselecao' ? [...new Set(ids)] : ids[0], opcoesNovas }
    }
    default: return vazio
  }
}

/** Valor da "coluna" num item (título, propriedade ou campo automático). */
export function valorDe(item: Item, prop: string, esquema: Propriedade[]): unknown {
  if (prop === TITULO) return item.titulo
  const def = esquema.find(p => p.id === prop)
  switch (def?.tipo) {
    case 'criado_em': return item.created_at
    case 'editado_em': return item.updated_at
    case 'criado_por': return [item.created_by]
    case 'editado_por': return item.updated_by ? [item.updated_by] : null
    case 'checkbox': return Boolean(item.propriedades[prop])
    default: return item.propriedades[prop] ?? null
  }
}

const estaVazio = (v: unknown) => v === null || v === undefined || v === '' || v === false || (Array.isArray(v) && !v.length)
const normal = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Operadores que cada tipo oferece no filtro (o primeiro é o padrão). */
export function operadoresDe(tipo: TipoPropriedade | 'titulo'): Operador[] {
  switch (tipo) {
    case 'titulo': case 'texto': case 'url': case 'email': case 'telefone': return ['contem', 'nao_contem', 'igual', 'diferente', 'comeca', 'termina', 'vazio', 'nao_vazio']
    case 'numero': return ['igual', 'diferente', 'maior', 'menor', 'maior_igual', 'menor_igual', 'vazio', 'nao_vazio']
    case 'selecao': case 'status': return ['igual', 'diferente', 'vazio', 'nao_vazio']
    case 'multisselecao': case 'pessoa': case 'criado_por': case 'editado_por': return ['tem', 'nao_tem', 'vazio', 'nao_vazio']
    case 'data': case 'criado_em': case 'editado_em': return ['igual', 'antes', 'depois', 'vazio', 'nao_vazio']
    case 'checkbox': return ['marcado', 'desmarcado']
    case 'relacao': return ['vazio', 'nao_vazio']
    case 'formula': case 'agregacao': return ['contem', 'igual', 'diferente', 'maior', 'menor', 'vazio', 'nao_vazio', 'marcado', 'desmarcado']
  }
}
export const NOME_OPERADOR: Record<Operador, string> = {
  contem: 'contém', nao_contem: 'não contém', igual: 'é', diferente: 'não é', comeca: 'começa com', termina: 'termina com',
  vazio: 'está vazio', nao_vazio: 'não está vazio', maior: '>', menor: '<', maior_igual: '≥', menor_igual: '≤',
  antes: 'é antes de', depois: 'é depois de', marcado: 'está marcado', desmarcado: 'não está marcado', tem: 'contém', nao_tem: 'não contém',
}
/** Operadores que não precisam de valor. */
export const SEM_VALOR: Operador[] = ['vazio', 'nao_vazio', 'marcado', 'desmarcado']

/** O item passa no filtro? Filtro sem valor (ainda sendo montado) não filtra nada. */
export function passaNoFiltro(item: Item, filtro: Filtro, esquema: Propriedade[]): boolean {
  const def = esquema.find(p => p.id === filtro.prop)
  const valor = valorDe(item, filtro.prop, esquema)
  const alvo = filtro.valor
  if (filtro.operador === 'vazio') return estaVazio(valor)
  if (filtro.operador === 'nao_vazio') return !estaVazio(valor)
  if (filtro.operador === 'marcado') return valor === true
  if (filtro.operador === 'desmarcado') return valor !== true
  if (alvo === undefined || alvo === null || alvo === '') return true
  // Fórmula e agregação têm o tipo do resultado: número compara como número; o resto, como texto.
  const calculado = def && CALCULADOS.includes(def.tipo)
  const tipo = filtro.prop === TITULO ? 'texto' : calculado ? (typeof valor === 'number' ? 'numero' : 'texto') : def?.tipo
  if (tipo === 'numero') {
    const n = typeof valor === 'number' ? valor : NaN, m = Number(alvo)
    if (Number.isNaN(n)) return filtro.operador === 'diferente'
    return { igual: n === m, diferente: n !== m, maior: n > m, menor: n < m, maior_igual: n >= m, menor_igual: n <= m }[filtro.operador as 'igual'] ?? true
  }
  if (tipo === 'data' || tipo === 'criado_em' || tipo === 'editado_em') {
    const dia = typeof valor === 'string' ? valor.slice(0, 10) : ''
    if (!dia) return false
    return { igual: dia === alvo, antes: dia < String(alvo), depois: dia > String(alvo) }[filtro.operador as 'igual'] ?? true
  }
  if (tipo === 'selecao' || tipo === 'status') return filtro.operador === 'igual' ? valor === alvo : valor !== alvo
  if (Array.isArray(valor) || tipo === 'multisselecao' || tipo === 'pessoa' || tipo === 'criado_por' || tipo === 'editado_por') {
    const tem = Array.isArray(valor) && valor.includes(alvo)
    return filtro.operador === 'nao_tem' ? !tem : tem
  }
  const t = normal(textoDoValor(def, valor)), a = normal(String(alvo))
  switch (filtro.operador) {
    case 'contem': return t.includes(a)
    case 'nao_contem': return !t.includes(a)
    case 'igual': return t === a
    case 'diferente': return t !== a
    case 'comeca': return t.startsWith(a)
    case 'termina': return t.endsWith(a)
    default: return true
  }
}

/** Itens que passam nos filtros (todos com "e", ao menos um com "ou") e na busca rápida (título e textos). */
export function filtrar(itens: Item[], visao: Pick<Visao, 'filtros' | 'juncao'>, esquema: Propriedade[], busca = ''): Item[] {
  const termo = normal(busca.trim())
  return itens.filter(item => {
    if (visao.filtros.length) {
      const passa = visao.filtros.map(f => passaNoFiltro(item, f, esquema))
      if (visao.juncao === 'ou' ? !passa.some(Boolean) : !passa.every(Boolean)) return false
    }
    if (!termo) return true
    return normal([item.titulo, ...esquema.map(p => textoDoValor(p, item.propriedades[p.id]))].join(' ')).includes(termo)
  })
}

/** Chave de ordenação de um valor (opções seguem a ordem do esquema, como no Notion; vazios sempre no fim). */
function chave(item: Item, prop: string, esquema: Propriedade[]): string | number | null {
  const def = esquema.find(p => p.id === prop)
  const valor = valorDe(item, prop, esquema)
  if (estaVazio(valor) && def?.tipo !== 'checkbox') return null
  if (def?.tipo === 'numero' || typeof valor === 'number') return valor as number
  if (def?.tipo === 'checkbox') return valor ? 1 : 0
  if (def && COM_OPCOES.includes(def.tipo)) {
    const primeiro = Array.isArray(valor) ? valor[0] : valor
    return def.opcoes?.findIndex(o => o.id === primeiro) ?? -1
  }
  return normal(textoDoValor(def, valor) || String(valor))
}

/** Ordena pelas regras da visão; sem regras (ou empate), vale a ordem manual (posição). */
export function ordenar(itens: Item[], ordenacao: Ordenacao[], esquema: Propriedade[]): Item[] {
  return [...itens].sort((a, b) => {
    for (const regra of ordenacao) {
      const x = chave(a, regra.prop, esquema), y = chave(b, regra.prop, esquema)
      if (x === y) continue
      if (x === null) return 1
      if (y === null) return -1
      const comparacao = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR', { numeric: true })
      if (comparacao) return regra.direcao === 'desc' ? -comparacao : comparacao
    }
    return a.posicao - b.posicao
  })
}

export type Grupo = { id: string; nome: string; cor: Cor; itens: Item[] }
/** Colunas do quadro: uma por opção (na ordem do esquema) e "Sem <propriedade>" no começo, como no Notion. */
export function agrupar(itens: Item[], propId: string | null | undefined, esquema: Propriedade[]): Grupo[] {
  const def = esquema.find(p => p.id === propId)
  if (!def || !(def.tipo === 'selecao' || def.tipo === 'status')) return [{ id: '', nome: 'Todos', cor: 'padrao', itens }]
  const grupos: Grupo[] = [{ id: '', nome: `Sem ${def.nome.toLowerCase()}`, cor: 'padrao', itens: [] },
    ...(def.opcoes ?? []).map(o => ({ id: o.id, nome: o.nome, cor: o.cor, itens: [] as Item[] }))]
  for (const item of itens) (grupos.find(g => g.id === item.propriedades[def.id]) ?? grupos[0]).itens.push(item)
  return grupos
}

/** Cálculos que cada tipo oferece no rodapé da tabela. */
export function calculosDe(tipo: TipoPropriedade | 'titulo'): Calculo[] {
  const base: Calculo[] = ['nenhum', 'contar', 'vazios', 'preenchidos', 'unicos']
  if (tipo === 'numero') return [...base, 'soma', 'media', 'minimo', 'maximo']
  if (tipo === 'checkbox') return ['nenhum', 'contar', 'marcados', 'pct_marcados']
  if (tipo === 'formula' || tipo === 'agregacao') return [...base, 'soma', 'media', 'minimo', 'maximo', 'marcados', 'pct_marcados']
  return base
}
export const NOME_CALCULO: Record<Calculo, string> = {
  nenhum: 'Nenhum', contar: 'Contar tudo', vazios: 'Vazios', preenchidos: 'Preenchidos', unicos: 'Valores únicos',
  soma: 'Soma', media: 'Média', minimo: 'Mínimo', maximo: 'Máximo', marcados: 'Marcados', pct_marcados: '% marcados',
}

/** Resultado do cálculo do rodapé (número; a tela formata). null = sem resultado (lista vazia em média/mín/máx). */
export function calcular(itens: Item[], prop: string, calculo: Calculo, esquema: Propriedade[]): number | null {
  const valores = itens.map(i => valorDe(i, prop, esquema))
  const numeros = valores.filter((v): v is number => typeof v === 'number')
  switch (calculo) {
    case 'nenhum': return null
    case 'contar': return itens.length
    case 'vazios': return valores.filter(estaVazio).length
    case 'preenchidos': return valores.filter(v => !estaVazio(v)).length
    case 'unicos': return new Set(valores.filter(v => !estaVazio(v)).flatMap(v => Array.isArray(v) ? v : [v]).map(v => JSON.stringify(v))).size
    case 'soma': return numeros.reduce((s, n) => s + n, 0)
    case 'media': return numeros.length ? numeros.reduce((s, n) => s + n, 0) / numeros.length : null
    case 'minimo': return numeros.length ? Math.min(...numeros) : null
    case 'maximo': return numeros.length ? Math.max(...numeros) : null
    case 'marcados': return valores.filter(v => v === true).length
    case 'pct_marcados': return itens.length ? valores.filter(v => v === true).length / itens.length * 100 : null
  }
}

/** Número no formato da propriedade (pt-BR). */
export function formatarNumero(n: number, formato: FormatoNumero = 'numero') {
  if (formato === 'real') return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  if (formato === 'porcentagem') return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 6 })
}

/** Data "2026-11-26" → "26 de nov. de 2026". */
export function formatarData(valor: string) {
  const data = new Date(valor.length === 10 ? `${valor}T12:00:00` : valor)
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Esquema e visões padrão de uma base nova (vazia ou o modelo "Tarefas"). */
export function modeloDeBase(modelo: 'vazia' | 'tarefas', visaoInicial: TipoVisao = 'tabela'): { esquema: Propriedade[]; visoes: Visao[]; itens: { titulo: string; propriedades: Record<string, unknown> }[] } {
  const visao = (id: string, nome: string, tipo: TipoVisao, visiveis: string[], agruparPor: string | null = null): Visao =>
    ({ id, nome, tipo, filtros: [], juncao: 'e', ordenacao: [], visiveis, agruparPor, larguras: {}, calculos: {}, colunasOcultas: [] })
  if (modelo === 'tarefas') {
    const esquema: Propriedade[] = [
      { id: 'status', nome: 'Status', tipo: 'status', opcoes: [
        { id: 'nao-iniciada', nome: 'Não iniciada', cor: 'padrao', grupo: 'a_fazer' },
        { id: 'em-andamento', nome: 'Em andamento', cor: 'azul', grupo: 'em_andamento' },
        { id: 'concluida', nome: 'Concluída', cor: 'verde', grupo: 'concluido' },
      ] },
      { id: 'responsavel', nome: 'Responsável', tipo: 'pessoa' },
      { id: 'prazo', nome: 'Prazo', tipo: 'data' },
      { id: 'prioridade', nome: 'Prioridade', tipo: 'selecao', opcoes: [
        { id: 'alta', nome: 'Alta', cor: 'vermelho' }, { id: 'media', nome: 'Média', cor: 'amarelo' }, { id: 'baixa', nome: 'Baixa', cor: 'verde' },
      ] },
    ]
    const todas = esquema.map(p => p.id)
    const quadro = visao('quadro', 'Quadro', 'quadro', ['responsavel', 'prazo', 'prioridade'], 'status')
    const tabela = visao('tabela', 'Tabela', 'tabela', todas)
    return {
      esquema, visoes: visaoInicial === 'quadro' ? [quadro, tabela] : [tabela, quadro],
      itens: [
        { titulo: 'Tarefa 1', propriedades: { status: 'nao-iniciada', prioridade: 'alta' } },
        { titulo: 'Tarefa 2', propriedades: { status: 'em-andamento', prioridade: 'media' } },
        { titulo: 'Tarefa 3', propriedades: { status: 'concluida', prioridade: 'baixa' } },
      ],
    }
  }
  const esquema: Propriedade[] = [
    { id: 'status', nome: 'Status', tipo: 'status', opcoes: [
      { id: 'nao-iniciado', nome: 'Não iniciado', cor: 'padrao', grupo: 'a_fazer' },
      { id: 'em-andamento', nome: 'Em andamento', cor: 'azul', grupo: 'em_andamento' },
      { id: 'concluido', nome: 'Concluído', cor: 'verde', grupo: 'concluido' },
    ] },
    { id: 'tags', nome: 'Tags', tipo: 'multisselecao', opcoes: [] },
  ]
  const nomes: Record<TipoVisao, string> = { tabela: 'Tabela', quadro: 'Quadro', lista: 'Lista', galeria: 'Galeria', calendario: 'Calendário', linha_tempo: 'Linha do tempo' }
  return {
    esquema,
    visoes: [visao(visaoInicial, nomes[visaoInicial], visaoInicial, visaoInicial === 'quadro' ? ['tags'] : ['status', 'tags'], visaoInicial === 'quadro' ? 'status' : null)],
    itens: visaoInicial === 'tabela' ? [{ titulo: '', propriedades: {} }, { titulo: '', propriedades: {} }, { titulo: '', propriedades: {} }] : [],
  }
}

// ---------------------------------------------------------------- etapa 3: relação, agregação e fórmula

/** Outra base ligada por relação: o esquema e os itens dela (para mostrar títulos e calcular agregações). */
export type BaseLigada = { id: string; titulo: string; esquema: Propriedade[]; itens: Item[] }

/** Valor de uma propriedade como a fórmula enxerga: opção vira nome, data vira data, relação vira os títulos. */
function valorParaFormula(item: Item, prop: Propriedade, ligadas: Map<string, BaseLigada>): ValorFormula {
  const v = valorDe(item, prop.id, [prop])
  if (v === null || v === undefined) return null
  switch (prop.tipo) {
    case 'numero': return typeof v === 'number' ? v : null
    case 'checkbox': return Boolean(v)
    case 'data': case 'criado_em': case 'editado_em': { const d = new Date(String(v).length === 10 ? `${v}T00:00:00` : String(v)); return Number.isNaN(d.getTime()) ? null : d }
    case 'relacao': {
      const outra = prop.baseRelacionada ? ligadas.get(prop.baseRelacionada) : undefined
      return (v as string[]).map(id => outra?.itens.find(i => i.id === id)?.titulo ?? '').filter(Boolean).join(', ')
    }
    case 'formula': case 'agregacao': {
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(T|$)/.test(v)) return new Date(v.length === 10 ? `${v}T00:00:00` : v)
      return v as ValorFormula
    }
    default: return textoDoValor(prop, v) || null
  }
}

/** Resultado da fórmula guardável (data vira texto ISO; dia sem hora vira AAAA-MM-DD). */
function guardar(v: ValorFormula): unknown {
  if (!(v instanceof Date)) return v === '' ? null : v
  if (!v.getHours() && !v.getMinutes() && !v.getSeconds()) return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`
  return v.toISOString()
}

/** Agregação: valores da propriedade alvo nos itens ligados, com o cálculo escolhido. */
function agregar(item: Item, prop: Propriedade, esquema: Propriedade[], ligadas: Map<string, BaseLigada>): unknown {
  const relacao = esquema.find(p => p.id === prop.relacao && p.tipo === 'relacao')
  const outra = relacao?.baseRelacionada ? ligadas.get(relacao.baseRelacionada) : undefined
  if (!relacao || !outra) return null
  const ids = (item.propriedades[relacao.id] as string[] | undefined) ?? []
  const itens = ids.map(id => outra.itens.find(i => i.id === id)).filter((i): i is Item => Boolean(i))
  const alvo = prop.alvo ?? TITULO
  if (!prop.calculo || prop.calculo === 'mostrar') {
    const def = outra.esquema.find(p => p.id === alvo)
    const textos = itens.map(i => alvo === TITULO ? i.titulo : textoDoValor(def, valorDe(i, alvo, outra.esquema))).filter(Boolean)
    return textos.length ? textos.join(', ') : null
  }
  return calcular(itens, alvo, prop.calculo, outra.esquema)
}

/**
 * Preenche as propriedades calculadas dos itens: agregações (a partir das bases ligadas) e fórmulas (que podem usar
 * outras fórmulas; uma fórmula que depende de si mesma fica vazia). As bases ligadas também têm as fórmulas
 * calculadas antes, para a agregação poder somar uma fórmula da outra base.
 */
export function computar(itens: Item[], esquema: Propriedade[], ligadas: BaseLigada[] = [], agora = new Date()): Item[] {
  const calculadas = esquema.filter(p => CALCULADOS.includes(p.tipo))
  if (!calculadas.length) return itens
  const mapa = new Map(ligadas.map(b => [b.id, { ...b, itens: computar(b.itens, b.esquema, [], agora) }]))
  return itens.map(item => {
    const propriedades = { ...item.propriedades }
    const atual: Item = { ...item, propriedades }
    for (const p of calculadas) if (p.tipo === 'agregacao') propriedades[p.id] = agregar(atual, p, esquema, mapa)
    const calculando = new Set<string>()
    const prontas = new Set<string>()
    const formula = (p: Propriedade): ValorFormula => {
      if (prontas.has(p.id)) return valorParaFormula(atual, p, mapa)
      if (calculando.has(p.id)) throw new Error('ciclo')
      calculando.add(p.id)
      const r = calcularFormula(p.expressao ?? '', nome => {
        if (nome.toLowerCase() === 'nome' && !esquema.some(e => e.nome.toLowerCase() === 'nome')) return atual.titulo
        const alvo = esquema.find(e => e.nome.toLowerCase() === nome.toLowerCase())
        if (!alvo) throw new Error(`Propriedade inexistente: “${nome}”.`)
        return alvo.tipo === 'formula' ? formula(alvo) : valorParaFormula(atual, alvo, mapa)
      }, agora)
      calculando.delete(p.id)
      propriedades[p.id] = r.ok ? guardar(r.valor) : null
      prontas.add(p.id)
      return r.ok ? r.valor : null
    }
    for (const p of calculadas) {
      if (p.tipo !== 'formula' || prontas.has(p.id)) continue
      try { formula(p) } catch { propriedades[p.id] = null; prontas.add(p.id); calculando.clear() }
    }
    return atual
  })
}

// ---------------------------------------------------------------- etapa 6: relação nos dois sentidos, subitens, linha do tempo, lembretes

/** O que entrou e o que saiu de uma lista de ids (relação, pessoas). */
export function diferencaIds(antes: unknown, depois: unknown) {
  const a = new Set(Array.isArray(antes) ? antes as string[] : []), d = new Set(Array.isArray(depois) ? depois as string[] : [])
  return { entraram: [...d].filter(id => !a.has(id)), sairam: [...a].filter(id => !d.has(id)) }
}

/**
 * Subitens: árvore pela relação "Item pai" (o primeiro id da relação). Itens cuja mãe não está na lista (filtrada) vão
 * para a raiz; ciclos são cortados. Devolve a ordem de exibição com o nível de cada um.
 */
export function hierarquia(itens: Item[], propPai: string): { item: Item; nivel: number; temFilhos: boolean }[] {
  const ids = new Set(itens.map(i => i.id))
  const pai = (i: Item) => { const v = i.propriedades[propPai]; const p = Array.isArray(v) ? v[0] as string : null; return p && ids.has(p) && p !== i.id ? p : null }
  const filhos = new Map<string | null, Item[]>()
  for (const i of itens) filhos.set(pai(i), [...(filhos.get(pai(i)) ?? []), i])
  const saida: { item: Item; nivel: number; temFilhos: boolean }[] = []
  const vistos = new Set<string>()
  const descer = (mae: string | null, nivel: number) => {
    for (const i of filhos.get(mae) ?? []) {
      if (vistos.has(i.id)) continue
      vistos.add(i.id)
      saida.push({ item: i, nivel, temFilhos: (filhos.get(i.id) ?? []).length > 0 })
      descer(i.id, nivel + 1)
    }
  }
  descer(null, 0)
  // Ciclo (A é mãe de B e B de A): os que sobraram entram na raiz.
  for (const i of itens) if (!vistos.has(i.id)) { vistos.add(i.id); saida.push({ item: i, nivel: 0, temFilhos: false }) }
  return saida
}

/** Linha do tempo: início e fim (AAAA-MM-DD) do item; sem fim, um dia; fim antes do início é corrigido. */
export function periodoDoItem(item: Item, inicioPor: string, fimPor: string | null | undefined, esquema: Propriedade[]) {
  const dia = (v: unknown) => typeof v === 'string' && v ? v.slice(0, 10) : null
  const inicio = dia(valorDe(item, inicioPor, esquema))
  if (!inicio) return null
  const fim = fimPor ? dia(valorDe(item, fimPor, esquema)) : null
  return { inicio, fim: fim && fim >= inicio ? fim : inicio }
}

/** Soma dias a uma data AAAA-MM-DD. */
export function somarDias(data: string, dias: number) {
  const d = new Date(`${data}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/**
 * Lembretes devidos hoje: datas com lembrete "no dia" iguais a hoje, ou "um dia antes" iguais a amanhã. Avisa as
 * pessoas das propriedades de pessoa do item; se não houver, quem criou o item.
 */
export function lembretesDevidos(itens: Item[], esquema: Propriedade[], hoje: string) {
  const amanha = somarDias(hoje, 1)
  const pessoasProps = esquema.filter(p => p.tipo === 'pessoa')
  const devidos: { item: Item; prop: Propriedade; data: string; para: string[] }[] = []
  for (const prop of esquema.filter(p => p.tipo === 'data' && p.lembrete)) {
    for (const item of itens) {
      const data = item.propriedades[prop.id]
      if (typeof data !== 'string') continue
      if ((prop.lembrete === 'no_dia' && data === hoje) || (prop.lembrete === 'um_dia_antes' && data === amanha)) {
        const pessoas = [...new Set(pessoasProps.flatMap(p => Array.isArray(item.propriedades[p.id]) ? item.propriedades[p.id] as string[] : []))]
        devidos.push({ item, prop, data, para: pessoas.length ? pessoas : [item.created_by] })
      }
    }
  }
  return devidos
}
