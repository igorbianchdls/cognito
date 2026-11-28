// O motor de consultas do Analytics no Postgres: tendência, funil, retenção, caminhos, pessoas, coortes e os dados do
// mapa de calor. As telas e o conector do Otto usam as mesmas funções; quando os eventos forem para o BigQuery, só este
// arquivo muda. Tudo roda como a pessoa (as regras de acesso valem) e com parâmetros: campos vêm de uma lista fechada.
import { CAMPOS, TODOS, type Consulta, type ConsultaCaminhos, type ConsultaFunil, type ConsultaRetencao, type ConsultaTendencia,
  type DefinicaoCoorte, type Filtro, type PassoFunil, type Resultado, type ResultadoTendencia } from '../shared/consulta'
import { AnalyticsError, type Db } from './pg'

const TZ = 'America/Sao_Paulo'
const COLUNAS: Record<keyof typeof CAMPOS, string> = {
  evento: 'e.event', pagina: 'e.path', titulo: 'e.title', host: 'e.host', url: 'e.url',
  origem: "COALESCE(e.utm_source, e.referrer_host, '(direto)')", referrer: 'e.referrer_host',
  utm_source: 'e.utm_source', utm_medium: 'e.utm_medium', utm_campaign: 'e.utm_campaign', utm_content: 'e.utm_content', utm_term: 'e.utm_term',
  aparelho: 'e.device', navegador: 'e.browser', sistema: 'e.os', pais: 'e.country', regiao: 'e.region', idioma: 'e.language', usuario: 'e.user_id',
}
const INTERVALO = { hora: 'hour', dia: 'day', semana: 'week', mes: 'month' } as const

/** Montador de SQL com parâmetros numerados. */
class Sql {
  params: unknown[] = []
  p(v: unknown) { this.params.push(v); return `$${this.params.length}` }
}

/** Uma propriedade da empresa que a pessoa pode ver; o resto das consultas usa só o id dela. */
export async function propriedadeVisivel(db: Db, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new AnalyticsError('Site inválido.', 400)
  const [p] = await db.query<{ id: string; workspace_id: string; name: string }>('SELECT id, workspace_id, name FROM analytics.properties WHERE id = $1', [id])
  if (!p) throw new AnalyticsError('Site não encontrado nesta empresa.', 404)
  return p
}

function campoSql(campo: string, q: Sql) {
  if (campo.startsWith('prop:')) return `(e.properties ->> ${q.p(campo.slice(5))})`
  const c = COLUNAS[campo as keyof typeof CAMPOS]
  if (!c) throw new AnalyticsError(`Campo desconhecido: ${campo}`)
  return c
}

/** Coortes usadas nos filtros, já lidas do banco (id → definição). */
type Coortes = Map<string, DefinicaoCoorte>

function filtroSql(f: Filtro, q: Sql, prop: string, coortes: Coortes): string {
  if (f.campo === 'coorte') {
    const def = coortes.get(f.valor as string)
    if (!def) throw new AnalyticsError('Coorte não encontrada.', 404)
    return `e.person ${f.op === 'diferente' ? 'NOT ' : ''}IN (${coorteSql(def, q, prop, coortes)})`
  }
  const col = campoSql(f.campo, q)
  const v = f.valor ?? ''
  switch (f.op) {
    case 'igual': return `${col} = ${q.p(v)}`
    case 'diferente': return `${col} IS DISTINCT FROM ${q.p(v)}`
    case 'contem': return `${col} ILIKE ${q.p(`%${v.replace(/[%_\\]/g, m => '\\' + m)}%`)}`
    case 'nao_contem': return `COALESCE(${col}, '') NOT ILIKE ${q.p(`%${v.replace(/[%_\\]/g, m => '\\' + m)}%`)}`
    case 'existe': return `${col} IS NOT NULL AND ${col} <> ''`
    case 'nao_existe': return `(${col} IS NULL OR ${col} = '')`
    case 'maior': return `(CASE WHEN ${col} ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (${col})::numeric END) > ${q.p(Number(v) || 0)}`
    case 'menor': return `(CASE WHEN ${col} ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (${col})::numeric END) < ${q.p(Number(v) || 0)}`
  }
}
const filtrosSql = (fs: Filtro[] | undefined, q: Sql, prop: string, coortes: Coortes) => (fs ?? []).map(f => ` AND ${filtroSql(f, q, prop, coortes)}`).join('')
const eventoSql = (evento: string, q: Sql) => evento === TODOS ? '' : ` AND e.event = ${q.p(evento)}`

/** As pessoas de uma coorte, como subconsulta (cada regra vira um conjunto; "todas" cruza, "qualquer" junta). */
export function coorteSql(def: DefinicaoCoorte, q: Sql, prop: string, coortes: Coortes = new Map()): string {
  const partes = def.regras.map(r => {
    if (r.tipo === 'fez') return `SELECT e.person FROM analytics.events_people e WHERE e.property_id = ${prop} AND e."timestamp" >= now() - make_interval(days => ${q.p(r.dias)})`
      + `${eventoSql(r.evento, q)}${filtrosSql(r.filtros, q, prop, coortes)} GROUP BY e.person HAVING count(*) >= ${q.p(r.vezes)}`
    if (r.tipo === 'nao_fez') {
      const dias = q.p(r.dias)
      return `(SELECT e.person FROM analytics.events_people e WHERE e.property_id = ${prop} AND e."timestamp" >= now() - make_interval(days => ${dias})`
        + ` EXCEPT SELECT e.person FROM analytics.events_people e WHERE e.property_id = ${prop} AND e."timestamp" >= now() - make_interval(days => ${dias})${eventoSql(r.evento, q)})`
    }
    return `SELECT DISTINCT e.person FROM analytics.events_people e WHERE e.property_id = ${prop} AND ${filtroSql({ campo: r.campo, op: r.op, valor: r.valor }, q, prop, coortes)}`
  })
  return partes.map(p => `(${p})`).join(def.combinar === 'qualquer' ? ' UNION ' : ' INTERSECT ')
}

/** A coorte como SQL com os próprios parâmetros ($1 = site), para quem não monta a consulta aqui (flags). */
export function coorteSqlPublico(def: DefinicaoCoorte, propertyId: string) {
  const q = new Sql(), prop = q.p(propertyId)
  return { sql: coorteSql(def, q, prop), params: q.params }
}

/** Lê as coortes que aparecem nos filtros (de qualquer parte da consulta). */
async function coortesUsadas(db: Db, propertyId: string, consulta: unknown): Promise<Coortes> {
  const ids = new Set<string>()
  const visitar = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(visitar)
    else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      if (o.campo === 'coorte' && typeof o.valor === 'string') ids.add(o.valor)
      Object.values(o).forEach(visitar)
    }
  }
  visitar(consulta)
  if (!ids.size) return new Map()
  const rows = await db.query<{ id: string; rules: DefinicaoCoorte }>('SELECT id, rules FROM analytics.cohorts WHERE property_id = $1 AND id = ANY($2::uuid[])', [propertyId, [...ids]])
  const mapa = new Map(rows.map(r => [r.id, r.rules]))
  // Uma coorte pode usar outra; até dois níveis bastam.
  const internas = rows.flatMap(r => r.rules.regras).filter(r => r.tipo === 'fez').flatMap(r => r.filtros).filter(f => f.campo === 'coorte').map(f => f.valor as string).filter(id => !mapa.has(id))
  if (internas.length) (await db.query<{ id: string; rules: DefinicaoCoorte }>('SELECT id, rules FROM analytics.cohorts WHERE property_id = $1 AND id = ANY($2::uuid[])', [propertyId, internas])).forEach(r => mapa.set(r.id, r.rules))
  return mapa
}

function janela(de: string, ate: string) {
  const a = new Date(de), b = new Date(ate)
  if (!(b > a)) throw new AnalyticsError('O período precisa terminar depois de começar.')
  if (b.getTime() - a.getTime() > 400 * 86400000) throw new AnalyticsError('O período pode ter no máximo 400 dias.')
  return { de: a, ate: b }
}

// ---------------------------------------------------------------- tendência

async function rotulos(db: Db, intervalo: ConsultaTendencia['intervalo'], de: Date, ate: Date) {
  const rows = await db.query<{ r: string }>(`SELECT to_char(g, 'YYYY-MM-DD"T"HH24:MI') AS r FROM generate_series(date_trunc($1, $2::timestamptz AT TIME ZONE '${TZ}'),
    ($3::timestamptz AT TIME ZONE '${TZ}') - interval '1 microsecond', ('1 ' || $1)::interval) g`, [INTERVALO[intervalo], de.toISOString(), ate.toISOString()])
  return rows.map(r => r.r)
}

async function seriesTendencia(db: Db, c: ConsultaTendencia, propertyId: string, coortes: Coortes, de: Date, ate: Date) {
  const lista = await rotulos(db, c.intervalo, de, ate)
  if (lista.length > 800) throw new AnalyticsError('Período longo demais para esse intervalo; use semana ou mês.')
  const series: ResultadoTendencia['series'] = []
  for (const s of c.series) {
    const q = new Sql(), prop = q.p(propertyId)
    const quebra = c.quebra ? `COALESCE(${campoSql(c.quebra, q)}, '(vazio)')` : `''`
    const sql = `SELECT to_char(date_trunc(${q.p(INTERVALO[c.intervalo])}, e."timestamp" AT TIME ZONE '${TZ}'), 'YYYY-MM-DD"T"HH24:MI') AS periodo, ${quebra} AS quebra,
        count(*)::int AS total, count(DISTINCT e.person)::int AS pessoas, count(DISTINCT e.session_id)::int AS sessoes
      FROM analytics.events_people e
      WHERE e.property_id = ${prop} AND e."timestamp" >= ${q.p(de.toISOString())} AND e."timestamp" < ${q.p(ate.toISOString())}${eventoSql(s.evento, q)}
        ${filtrosSql(c.filtros, q, prop, coortes)}${filtrosSql(s.filtros, q, prop, coortes)}
      GROUP BY 1, 2`
    const rows = await db.query<{ periodo: string; quebra: string; total: number; pessoas: number; sessoes: number }>(sql, q.params)
    const nome = s.nome || (s.evento === TODOS ? 'Todos os eventos' : s.evento === '$pageview' ? 'Páginas vistas' : s.evento)
    const porQuebra = new Map<string, Map<string, number>>()
    for (const r of rows) {
      const m = porQuebra.get(r.quebra) ?? new Map<string, number>()
      m.set(r.periodo, r[s.metrica])
      porQuebra.set(r.quebra, m)
    }
    // Com quebra: os 10 valores com mais resultado no período.
    const valores = [...porQuebra.entries()].map(([quebra, m]) => ({ quebra, valores: lista.map(l => m.get(l) ?? 0) }))
      .map(v => ({ ...v, total: v.valores.reduce((a, b) => a + b, 0) })).sort((a, b) => b.total - a.total).slice(0, c.quebra ? 10 : 1)
    if (!valores.length) valores.push({ quebra: '', valores: lista.map(() => 0), total: 0 })
    // Pessoas e sessões distintas não somam entre os períodos: o total é contado de novo no período inteiro.
    if (s.metrica !== 'total') {
      const q2 = new Sql(), p2 = q2.p(propertyId)
      const qb = c.quebra ? `COALESCE(${campoSql(c.quebra, q2)}, '(vazio)')` : `''`
      const totais = await db.query<{ quebra: string; n: number }>(`SELECT ${qb} AS quebra, count(DISTINCT ${s.metrica === 'pessoas' ? 'e.person' : 'e.session_id'})::int AS n
        FROM analytics.events_people e WHERE e.property_id = ${p2} AND e."timestamp" >= ${q2.p(de.toISOString())} AND e."timestamp" < ${q2.p(ate.toISOString())}${eventoSql(s.evento, q2)}
        ${filtrosSql(c.filtros, q2, p2, coortes)}${filtrosSql(s.filtros, q2, p2, coortes)} GROUP BY 1`, q2.params)
      const t = new Map(totais.map(r => [r.quebra, r.n]))
      valores.forEach(v => { v.total = t.get(v.quebra) ?? 0 })
    }
    for (const v of valores) series.push({ nome: c.quebra ? `${nome} · ${v.quebra}` : nome, ...(c.quebra ? { quebra: v.quebra } : {}), valores: v.valores, total: v.total })
  }
  return { rotulos: lista, series }
}

export async function tendencia(db: Db, c: ConsultaTendencia, propertyId: string): Promise<ResultadoTendencia> {
  const { de, ate } = janela(c.de, c.ate)
  const coortes = await coortesUsadas(db, propertyId, c)
  const atual = await seriesTendencia(db, c, propertyId, coortes, de, ate)
  if (!c.comparar) return { tipo: 'tendencia', ...atual }
  const d = ate.getTime() - de.getTime()
  const anterior = await seriesTendencia(db, c, propertyId, coortes, new Date(de.getTime() - d), new Date(ate.getTime() - d))
  return { tipo: 'tendencia', ...atual, anterior }
}

// ---------------------------------------------------------------- funil

export async function funil(db: Db, c: ConsultaFunil, propertyId: string) {
  const { de, ate } = janela(c.de, c.ate)
  const coortes = await coortesUsadas(db, propertyId, c)
  const q = new Sql(), prop = q.p(propertyId), pDe = q.p(de.toISOString()), pAte = q.p(ate.toISOString()), w = q.p(c.janela_dias)
  const cond = (i: number) => `TRUE${eventoSql(c.passos[i].evento, q)}${filtrosSql(c.passos[i].filtros, q, prop, coortes)}`
  const quebra = c.quebra ? `COALESCE(${campoSql(c.quebra, q)}, '(vazio)')` : `'Todos'`
  // ev: os eventos do período (mais a janela, para os passos seguintes); p1: o primeiro passo de cada pessoa.
  let sql = `WITH ev AS (SELECT e.* FROM analytics.events_people e WHERE e.property_id = ${prop} AND e."timestamp" >= ${pDe}
      AND e."timestamp" < ${pAte}::timestamptz + make_interval(days => ${w})${filtrosSql(c.filtros, q, prop, coortes)}),
    p1 AS (SELECT DISTINCT ON (e.person) e.person, e."timestamp" AS t1, ${quebra} AS quebra FROM ev e WHERE ${cond(0)} AND e."timestamp" < ${pAte} ORDER BY e.person, e."timestamp")`
  for (let i = 1; i < c.passos.length; i++) {
    const ant = Array.from({ length: i }, (_, k) => `p.t${k + 1}`).join(', ')
    sql += `, p${i + 1} AS (SELECT p.person, ${ant}, min(e."timestamp") AS t${i + 1} FROM p${i} p JOIN ev e ON e.person = p.person AND ${cond(i)}
      AND e."timestamp" > p.t${i} AND e."timestamp" <= p.t1 + make_interval(days => ${w}) GROUP BY p.person, ${ant})`
  }
  const cols = c.passos.map((_, i) => `count(p${i + 1}.person)::int AS n${i + 1}` + (i ? `, percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM p${i + 1}.t${i + 1} - p${i + 1}.t${i})) AS m${i + 1}` : '')).join(', ')
  const joins = c.passos.slice(1).map((_, i) => ` LEFT JOIN p${i + 2} ON p${i + 2}.person = p1.person`).join('')
  sql += ` SELECT p1.quebra, ${cols} FROM p1${joins} GROUP BY ROLLUP (p1.quebra) ORDER BY n1 DESC`
  const rows = await db.query<Record<string, number | string | null>>(sql, q.params)
  const passos = (r: Record<string, number | string | null>): PassoFunil[] => c.passos.map((s, i) => {
    const n = Number(r[`n${i + 1}`] ?? 0), primeiro = Number(r.n1 ?? 0), antes = i ? Number(r[`n${i}`] ?? 0) : n
    return { nome: s.nome || (s.evento === '$pageview' ? 'Página vista' : s.evento), pessoas: n, conversao: primeiro ? Math.round(n / primeiro * 1000) / 10 : 0,
      do_anterior: antes ? Math.round(n / antes * 1000) / 10 : 0, tempo_mediano_s: i && r[`m${i + 1}`] != null ? Math.round(Number(r[`m${i + 1}`])) : null }
  })
  const total = rows.find(r => r.quebra === null) ?? { n1: 0 }
  return { tipo: 'funil' as const, passos: passos(total), quebras: c.quebra ? rows.filter(r => r.quebra !== null).slice(0, 10).map(r => ({ quebra: String(r.quebra), passos: passos(r) })) : [] }
}

// ---------------------------------------------------------------- retenção

export async function retencao(db: Db, c: ConsultaRetencao, propertyId: string) {
  const { de, ate } = janela(c.de, c.ate)
  const coortes = await coortesUsadas(db, propertyId, c)
  const q = new Sql(), prop = q.p(propertyId), iv = q.p(INTERVALO[c.intervalo])
  const local = `date_trunc(${iv}, e."timestamp" AT TIME ZONE '${TZ}')`
  const indice = c.intervalo === 'mes'
    ? `((extract(year FROM r.periodo) * 12 + extract(month FROM r.periodo)) - (extract(year FROM i.coorte) * 12 + extract(month FROM i.coorte)))::int`
    : `floor(extract(epoch FROM r.periodo - i.coorte) / ${c.intervalo === 'semana' ? 604800 : 86400})::int`
  const sql = `WITH i AS (SELECT e.person, min(${local}) AS coorte FROM analytics.events_people e WHERE e.property_id = ${prop}
        AND e."timestamp" >= ${q.p(de.toISOString())} AND e."timestamp" < ${q.p(ate.toISOString())}${eventoSql(c.inicial.evento, q)}${filtrosSql(c.filtros, q, prop, coortes)}${filtrosSql(c.inicial.filtros, q, prop, coortes)} GROUP BY e.person),
      r AS (SELECT DISTINCT e.person, ${local} AS periodo FROM analytics.events_people e WHERE e.property_id = ${prop}
        AND e."timestamp" >= ${q.p(de.toISOString())}${eventoSql(c.retorno.evento, q)}${filtrosSql(c.filtros, q, prop, coortes)}${filtrosSql(c.retorno.filtros, q, prop, coortes)})
    SELECT to_char(i.coorte, 'YYYY-MM-DD"T"HH24:MI') AS coorte, (SELECT count(*) FROM i i2 WHERE i2.coorte = i.coorte)::int AS tamanho, ${indice} AS k, count(DISTINCT r.person)::int AS n
    FROM i JOIN r ON r.person = i.person AND r.periodo >= i.coorte GROUP BY 1, 2, 3 ORDER BY 1, 3`
  const rows = await db.query<{ coorte: string; tamanho: number; k: number; n: number }>(sql, q.params)
  const tamanhos = await db.query<{ coorte: string; tamanho: number }>(`WITH i AS (SELECT e.person, min(${local}) AS coorte FROM analytics.events_people e WHERE e.property_id = ${prop}
      AND e."timestamp" >= $3 AND e."timestamp" < $4${c.inicial.evento === TODOS ? '' : ' AND e.event = $5'} GROUP BY e.person)
    SELECT to_char(coorte, 'YYYY-MM-DD"T"HH24:MI') AS coorte, count(*)::int AS tamanho FROM i GROUP BY 1 ORDER BY 1`, [propertyId, INTERVALO[c.intervalo], de.toISOString(), ate.toISOString(), ...(c.inicial.evento === TODOS ? [] : [c.inicial.evento])])
  // Os filtros mudam o tamanho de cada coorte: quando há filtros, vale o tamanho da consulta principal.
  const tam = new Map(tamanhos.map(t => [t.coorte, t.tamanho]))
  rows.forEach(r => tam.set(r.coorte, r.tamanho))
  const coorteRows = [...tam.entries()].sort(([a], [b]) => a.localeCompare(b))
  const agora = Date.now()
  return {
    tipo: 'retencao' as const,
    rotulos: Array.from({ length: c.periodos }, (_, k) => `${c.intervalo === 'dia' ? 'Dia' : c.intervalo === 'semana' ? 'Semana' : 'Mês'} ${k}`),
    coortes: coorteRows.map(([inicio, tamanho]) => {
      const inicioMs = new Date(inicio + ':00-03:00').getTime(), passo = c.intervalo === 'dia' ? 86400000 : c.intervalo === 'semana' ? 604800000 : 30 * 86400000
      return { inicio, tamanho, valores: Array.from({ length: c.periodos }, (_, k) => {
        if (inicioMs + k * passo > agora) return null // período que ainda não chegou
        const n = rows.find(r => r.coorte === inicio && r.k === k)?.n ?? 0
        return tamanho ? Math.round(n / tamanho * 1000) / 10 : 0
      }) }
    }),
  }
}

// ---------------------------------------------------------------- caminhos

export async function caminhos(db: Db, c: ConsultaCaminhos, propertyId: string) {
  const { de, ate } = janela(c.de, c.ate)
  const coortes = await coortesUsadas(db, propertyId, c)
  const q = new Sql(), prop = q.p(propertyId)
  const pagina = q.p(c.pagina ?? null), passos = q.p(c.passos)
  // pv: páginas de cada sessão em ordem (sem repetir a mesma página seguida); ancora: onde começa (ou termina) o caminho.
  const sql = `WITH bruto AS (SELECT e.session_id, e.path, e."timestamp", lag(e.path) OVER (PARTITION BY e.session_id ORDER BY e."timestamp") AS antes
        FROM analytics.events_people e WHERE e.property_id = ${prop} AND e.event = '$pageview' AND e.session_id IS NOT NULL AND e.path IS NOT NULL
        AND e."timestamp" >= ${q.p(de.toISOString())} AND e."timestamp" < ${q.p(ate.toISOString())}${filtrosSql(c.filtros, q, prop, coortes)}),
      pv AS (SELECT session_id, path, row_number() OVER (PARTITION BY session_id ORDER BY "timestamp") AS n FROM bruto WHERE antes IS DISTINCT FROM path),
      ancora AS (SELECT session_id, ${c.direcao === 'depois' ? 'min' : 'max'}(n) AS n0 FROM pv WHERE ${pagina}::text IS NULL OR path = ${pagina}::text GROUP BY session_id),
      seq AS (SELECT pv.session_id, (${c.direcao === 'depois' ? 'pv.n - a.n0' : 'a.n0 - pv.n'})::int AS passo, pv.path FROM pv JOIN ancora a USING (session_id)
        WHERE ${c.direcao === 'depois' ? 'pv.n >= a.n0 AND pv.n < a.n0 + ' : 'pv.n <= a.n0 AND pv.n > a.n0 - '}${passos})
    SELECT a.passo, a.path AS de, b.path AS para, count(*)::int AS sessoes FROM seq a JOIN seq b ON b.session_id = a.session_id AND b.passo = a.passo + 1
    GROUP BY 1, 2, 3 ORDER BY 1, 4 DESC`
  const rows = await db.query<{ passo: number; de: string; para: string; sessoes: number }>(sql, q.params)
  const q2 = new Sql(), p2 = q2.p(propertyId), pag2 = q2.p(c.pagina ?? null)
  const inicio = await db.query<{ pagina: string; sessoes: number }>(`WITH bruto AS (SELECT e.session_id, e.path, e."timestamp" FROM analytics.events_people e WHERE e.property_id = ${p2} AND e.event = '$pageview'
      AND e.session_id IS NOT NULL AND e.path IS NOT NULL AND e."timestamp" >= ${q2.p(de.toISOString())} AND e."timestamp" < ${q2.p(ate.toISOString())}${filtrosSql(c.filtros, q2, p2, coortes)}),
      primeira AS (SELECT DISTINCT ON (session_id) session_id, path FROM bruto WHERE ${pag2}::text IS NULL OR path = ${pag2}::text ORDER BY session_id, "timestamp" ${c.direcao === 'depois' ? 'ASC' : 'DESC'})
    SELECT path AS pagina, count(*)::int AS sessoes FROM primeira GROUP BY 1 ORDER BY 2 DESC LIMIT 8`, q2.params)
  // Por passo, as 8 ligações mais comuns.
  const porPasso = new Map<number, number>()
  const ligacoes = rows.filter(r => { const n = porPasso.get(r.passo) ?? 0; porPasso.set(r.passo, n + 1); return n < 8 })
  return { tipo: 'caminhos' as const, inicio, ligacoes }
}

export async function executar(db: Db, c: Consulta, propertyId: string): Promise<Resultado> {
  switch (c.tipo) {
    case 'tendencia': return tendencia(db, c, propertyId)
    case 'funil': return funil(db, c, propertyId)
    case 'retencao': return retencao(db, c, propertyId)
    case 'caminhos': return caminhos(db, c, propertyId)
  }
}

// ---------------------------------------------------------------- web (painel geral)

/** Os números do painel geral (o "web analytics"): totais, páginas, origens, aparelhos, eventos e ao vivo. */
export async function relatorio(db: Db, nome: string, propertyId: string, de: Date, ate: Date, evento = '') {
  const base = `e.property_id = $1 AND e."timestamp" >= $2 AND e."timestamp" < $3`
  const p = [propertyId, de.toISOString(), ate.toISOString()]
  switch (nome) {
    case 'resumo': return db.query(`SELECT to_char(date_trunc('day', e."timestamp" AT TIME ZONE '${TZ}'), 'YYYY-MM-DD') AS dia, count(DISTINCT e.person)::int AS visitantes,
      count(DISTINCT e.session_id)::int AS sessoes, (count(*) FILTER (WHERE e.event = '$pageview'))::int AS paginas FROM analytics.events_people e WHERE ${base} GROUP BY 1 ORDER BY 1`, p)
    case 'totais': return db.query(`SELECT count(DISTINCT e.person)::int AS visitantes, count(DISTINCT e.session_id)::int AS sessoes, (count(*) FILTER (WHERE e.event = '$pageview'))::int AS paginas,
      (SELECT round(avg(n)::numeric, 1) FROM (SELECT count(*) AS n FROM analytics.events e2 WHERE e2.property_id = $1 AND e2."timestamp" >= $2 AND e2."timestamp" < $3 AND e2.event = '$pageview' AND e2.session_id IS NOT NULL GROUP BY e2.session_id) s) AS paginas_por_sessao,
      (SELECT round(100.0 * count(*) FILTER (WHERE n = 1) / nullif(count(*), 0), 1) FROM (SELECT count(*) AS n FROM analytics.events e2 WHERE e2.property_id = $1 AND e2."timestamp" >= $2 AND e2."timestamp" < $3 AND e2.event = '$pageview' AND e2.session_id IS NOT NULL GROUP BY e2.session_id) s) AS rejeicao,
      (SELECT round(avg(d)::numeric) FROM (SELECT extract(epoch FROM max(e2."timestamp") - min(e2."timestamp")) AS d FROM analytics.events e2 WHERE e2.property_id = $1 AND e2."timestamp" >= $2 AND e2."timestamp" < $3 AND e2.session_id IS NOT NULL GROUP BY e2.session_id) s) AS duracao_media_s
      FROM analytics.events_people e WHERE ${base}`, p)
    case 'paginas': return db.query(`SELECT e.path AS pagina, count(*)::int AS visualizacoes, count(DISTINCT e.person)::int AS visitantes FROM analytics.events_people e
      WHERE ${base} AND e.event = '$pageview' AND e.path IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 20`, p)
    case 'entradas': return db.query(`SELECT path AS pagina, count(*)::int AS sessoes FROM (SELECT DISTINCT ON (e.session_id) e.session_id, e.path FROM analytics.events e
      WHERE ${base} AND e.event = '$pageview' AND e.session_id IS NOT NULL ORDER BY e.session_id, e."timestamp") s GROUP BY 1 ORDER BY 2 DESC LIMIT 20`, p)
    case 'origens': return db.query(`SELECT COALESCE(e.utm_source, e.referrer_host, '(direto)') AS origem, count(DISTINCT e.person)::int AS visitantes, count(DISTINCT e.session_id)::int AS sessoes
      FROM analytics.events_people e WHERE ${base} AND e.event = '$pageview' GROUP BY 1 ORDER BY 2 DESC LIMIT 20`, p)
    case 'campanhas': return db.query(`SELECT e.utm_campaign AS campanha, COALESCE(e.utm_source, '—') AS origem, COALESCE(e.utm_medium, '—') AS meio, count(DISTINCT e.person)::int AS visitantes
      FROM analytics.events_people e WHERE ${base} AND e.utm_campaign IS NOT NULL GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 20`, p)
    case 'aparelhos': return db.query(`SELECT 'aparelho' AS tipo, COALESCE(e.device, 'outro') AS nome, count(DISTINCT e.person)::int AS visitantes FROM analytics.events_people e WHERE ${base} GROUP BY 2
      UNION ALL SELECT 'navegador', COALESCE(e.browser, 'Outro'), count(DISTINCT e.person)::int FROM analytics.events_people e WHERE ${base} GROUP BY 2
      UNION ALL SELECT 'sistema', COALESCE(e.os, 'Outro'), count(DISTINCT e.person)::int FROM analytics.events_people e WHERE ${base} GROUP BY 2
      UNION ALL SELECT 'pais', COALESCE(e.country, '—'), count(DISTINCT e.person)::int FROM analytics.events_people e WHERE ${base} GROUP BY 2 ORDER BY 1, 3 DESC`, p)
    case 'eventos': return db.query(`SELECT e.event AS evento, count(*)::int AS total, count(DISTINCT e.person)::int AS visitantes, max(e."timestamp") AS ultimo
      FROM analytics.events_people e WHERE ${base} GROUP BY 1 ORDER BY 2 DESC LIMIT 50`, p)
    case 'ao-vivo': return db.query(`SELECT e."timestamp" AS quando, e.event AS evento, e.path AS pagina, e.distinct_id AS visitante, e.user_id AS usuario, e.person AS pessoa,
      e.country AS pais, e.device AS aparelho, e.browser AS navegador, COALESCE(e.utm_source, e.referrer_host) AS origem, e.session_id AS sessao, e.properties::text AS propriedades
      FROM analytics.events_people e WHERE ${base} AND ($4 = '' OR e.event = $4) ORDER BY e."timestamp" DESC LIMIT 100`, [...p, evento])
    case 'agora': return db.query(`SELECT count(DISTINCT e.person)::int AS pessoas FROM analytics.events_people e WHERE e.property_id = $1 AND e."timestamp" >= now() - interval '5 minutes'`, [propertyId])
    default: throw new AnalyticsError('Relatório desconhecido.')
  }
}

// ---------------------------------------------------------------- catálogo (para os seletores das telas)

export async function eventosConhecidos(db: Db, propertyId: string) {
  return db.query<{ evento: string; total: number; ultimo: string }>(`SELECT e.event AS evento, count(*)::int AS total, max(e."timestamp") AS ultimo FROM analytics.events e
    WHERE e.property_id = $1 AND e."timestamp" >= now() - interval '90 days' GROUP BY 1 ORDER BY 2 DESC LIMIT 200`, [propertyId])
}
export async function propriedadesConhecidas(db: Db, propertyId: string, evento?: string) {
  return db.query<{ chave: string; eventos: number }>(`SELECT k AS chave, count(*)::int AS eventos FROM (SELECT jsonb_object_keys(e.properties) AS k FROM analytics.events e
    WHERE e.property_id = $1 AND e.properties IS NOT NULL AND jsonb_typeof(e.properties) = 'object' AND e."timestamp" >= now() - interval '90 days' AND ($2::text IS NULL OR e.event = $2) LIMIT 20000) s
    GROUP BY 1 ORDER BY 2 DESC LIMIT 100`, [propertyId, evento ?? null])
}
export async function valoresDoCampo(db: Db, propertyId: string, campo: string, busca = '') {
  const q = new Sql(), prop = q.p(propertyId), col = campoSql(campo, q)
  return db.query<{ valor: string; total: number }>(`SELECT ${col} AS valor, count(*)::int AS total FROM analytics.events_people e WHERE e.property_id = ${prop}
    AND e."timestamp" >= now() - interval '90 days' AND ${col} IS NOT NULL AND ${col} ILIKE ${q.p(`%${busca}%`)} GROUP BY 1 ORDER BY 2 DESC LIMIT 30`, q.params)
}

// ---------------------------------------------------------------- pessoas e coortes

export async function pessoas(db: Db, propertyId: string, o: { busca?: string; coorte?: string; pagina?: number }) {
  const q = new Sql(), prop = q.p(propertyId)
  const coortes = o.coorte ? await coortesUsadas(db, propertyId, { campo: 'coorte', valor: o.coorte }) : new Map()
  const filtroCoorte = o.coorte ? ` AND ${filtroSql({ campo: 'coorte', op: 'igual', valor: o.coorte }, q, prop, coortes)}` : ''
  const busca = o.busca ? ` AND (e.person ILIKE ${q.p(`%${o.busca}%`)} OR e.distinct_id ILIKE ${q.p(`%${o.busca}%`)})` : ''
  const limite = 50, pagina = Math.max(0, o.pagina ?? 0)
  const rows = await db.query(`SELECT e.person AS pessoa, max(e.user_id) AS usuario, min(e."timestamp") AS primeira_vez, max(e."timestamp") AS ultima_vez, count(*)::int AS eventos,
      count(DISTINCT e.session_id)::int AS sessoes,
      (array_agg(e.country ORDER BY e."timestamp" DESC) FILTER (WHERE e.country IS NOT NULL))[1] AS pais,
      (array_agg(e.device ORDER BY e."timestamp" DESC) FILTER (WHERE e.device IS NOT NULL))[1] AS aparelho,
      (array_agg(e.browser ORDER BY e."timestamp" DESC) FILTER (WHERE e.browser IS NOT NULL))[1] AS navegador,
      (array_agg(COALESCE(e.utm_source, e.referrer_host) ORDER BY e."timestamp") FILTER (WHERE COALESCE(e.utm_source, e.referrer_host) IS NOT NULL))[1] AS origem
    FROM analytics.events_people e WHERE e.property_id = ${prop} AND e."timestamp" >= now() - interval '400 days'${filtroCoorte}${busca}
    GROUP BY e.person ORDER BY ultima_vez DESC LIMIT ${limite + 1} OFFSET ${pagina * limite}`, q.params)
  return { pessoas: rows.slice(0, limite), mais: rows.length > limite }
}

export async function pessoa(db: Db, propertyId: string, id: string) {
  const [resumo] = await db.query(`SELECT e.person AS pessoa, max(e.user_id) AS usuario, min(e."timestamp") AS primeira_vez, max(e."timestamp") AS ultima_vez, count(*)::int AS eventos,
      count(DISTINCT e.session_id)::int AS sessoes, array_agg(DISTINCT e.distinct_id) AS visitantes,
      (array_agg(e.country ORDER BY e."timestamp" DESC) FILTER (WHERE e.country IS NOT NULL))[1] AS pais,
      (array_agg(e.region ORDER BY e."timestamp" DESC) FILTER (WHERE e.region IS NOT NULL))[1] AS regiao,
      (array_agg(e.device ORDER BY e."timestamp" DESC) FILTER (WHERE e.device IS NOT NULL))[1] AS aparelho,
      (array_agg(e.browser ORDER BY e."timestamp" DESC) FILTER (WHERE e.browser IS NOT NULL))[1] AS navegador,
      (array_agg(e.os ORDER BY e."timestamp" DESC) FILTER (WHERE e.os IS NOT NULL))[1] AS sistema,
      (array_agg(COALESCE(e.utm_source, e.referrer_host, '(direto)') ORDER BY e."timestamp"))[1] AS origem_inicial,
      (array_agg(e.path ORDER BY e."timestamp") FILTER (WHERE e.event = '$pageview'))[1] AS primeira_pagina,
      (array_agg(e.properties ORDER BY e."timestamp" DESC) FILTER (WHERE e.event = '$identify' AND e.properties IS NOT NULL))[1] AS dados
    FROM analytics.events_people e WHERE e.property_id = $1 AND e.person = $2 GROUP BY e.person`, [propertyId, id])
  if (!resumo) throw new AnalyticsError('Pessoa não encontrada.', 404)
  const eventos = await db.query(`SELECT e."timestamp" AS quando, e.event AS evento, e.path AS pagina, e.title AS titulo, e.session_id AS sessao, e.properties AS propriedades,
      COALESCE(e.utm_source, e.referrer_host) AS origem FROM analytics.events_people e WHERE e.property_id = $1 AND e.person = $2 ORDER BY e."timestamp" DESC LIMIT 300`, [propertyId, id])
  const gravacoes = await db.query(`SELECT r.session_id AS sessao, r.started_at AS inicio, r.ended_at AS fim, r.first_url AS url FROM analytics.recordings r
      WHERE r.property_id = $1 AND r.distinct_id = ANY($2::text[]) ORDER BY r.started_at DESC LIMIT 20`, [propertyId, (resumo as { visitantes: string[] }).visitantes])
  return { ...resumo, eventos, gravacoes }
}

/** Quantas pessoas estão numa coorte agora (e algumas delas, para conferir). */
export async function membrosDaCoorte(db: Db, propertyId: string, def: DefinicaoCoorte) {
  const q = new Sql(), prop = q.p(propertyId)
  const coortes = await coortesUsadas(db, propertyId, def)
  const sub = coorteSql(def, q, prop, coortes)
  const [{ n }] = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM (${sub}) c`, q.params)
  const amostra = await db.query<{ person: string }>(`SELECT person FROM (${sub}) c LIMIT 20`, q.params)
  return { total: n, amostra: amostra.map(a => a.person) }
}

// ---------------------------------------------------------------- mapa de calor e rolagem

export async function mapaDeCalor(db: Db, propertyId: string, o: { pagina: string; aparelho: 'desktop' | 'mobile' | 'tablet'; de: Date; ate: Date }) {
  const p = [propertyId, o.pagina, o.aparelho, o.de.toISOString(), o.ate.toISOString()]
  const base = `e.property_id = $1 AND e.path = $2 AND COALESCE(e.device, 'desktop') = $3 AND e."timestamp" >= $4 AND e."timestamp" < $5`
  // Pontos agrupados (0,5% da largura × 8 px da altura), para o desenho não depender de milhares de cliques soltos.
  const pontos = await db.query<{ x: number; y: number; n: number }>(`SELECT round((e.properties ->> 'x')::numeric * 200) / 2 AS x, round((e.properties ->> 'y')::numeric / 8) * 8 AS y, count(*)::int AS n
    FROM analytics.events e WHERE ${base} AND e.event IN ('$autocapture', '$rageclick') AND e.properties ->> 'x' ~ '^[0-9.]+$' AND e.properties ->> 'y' ~ '^[0-9.]+$'
    GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 3000`, p)
  const elementos = await db.query(`SELECT e.properties ->> 'seletor' AS seletor, max(e.properties ->> 'texto') AS texto, max(e.properties ->> 'tag') AS tag, count(*)::int AS cliques,
      (count(*) FILTER (WHERE e.event = '$rageclick'))::int AS raiva FROM analytics.events e WHERE ${base} AND e.event IN ('$autocapture', '$rageclick')
    GROUP BY 1 ORDER BY 4 DESC LIMIT 20`, p)
  const rolagem = await db.query<{ faixa: number; pessoas: number }>(`SELECT f AS faixa, count(DISTINCT s.person)::int AS pessoas FROM (
      SELECT e.person, max(CASE WHEN e.properties ->> 'rolagem' ~ '^[0-9.]+$' THEN (e.properties ->> 'rolagem')::numeric ELSE 0 END) AS maximo
      FROM analytics.events_people e WHERE ${base} AND e.event = '$pageleave' GROUP BY e.person) s, unnest(ARRAY[0, 25, 50, 75, 100]) AS f WHERE s.maximo >= f GROUP BY 1 ORDER BY 1`, p)
  const [{ largura, altura }] = await db.query<{ largura: number | null; altura: number | null }>(`SELECT round(avg((e.properties ->> 'vw')::numeric))::int AS largura, round(max((e.properties ->> 'dh')::numeric))::int AS altura
    FROM analytics.events e WHERE ${base} AND e.event = '$autocapture' AND e.properties ->> 'vw' ~ '^[0-9.]+$' AND e.properties ->> 'dh' ~ '^[0-9.]+$'`, p)
  const [{ visitas }] = await db.query<{ visitas: number }>(`SELECT count(*)::int AS visitas FROM analytics.events e WHERE ${base} AND e.event = '$pageview'`, p)
  return { pontos, elementos, rolagem, largura, altura, visitas }
}

/** As páginas com cliques (para escolher no mapa de calor). */
export async function paginasComCliques(db: Db, propertyId: string) {
  return db.query<{ pagina: string; url: string; cliques: number }>(`SELECT e.path AS pagina, max(e.url) AS url, count(*)::int AS cliques FROM analytics.events e
    WHERE e.property_id = $1 AND e.event IN ('$autocapture', '$rageclick') AND e."timestamp" >= now() - interval '90 days' AND e.path IS NOT NULL GROUP BY 1 ORDER BY 3 DESC LIMIT 50`, [propertyId])
}
