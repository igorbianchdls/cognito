// As consultas do Analytics (tendência, funil, retenção e caminhos), os filtros e as coortes: o formato que as telas
// montam, que fica salvo nos insights e que o servidor transforma em SQL. Os campos são uma lista fechada (mais as
// propriedades do evento, "prop:<nome>"), então nada do que a pessoa digita vira SQL.
import { z } from 'zod'

/** Campos dos eventos usáveis em filtros e quebras. */
export const CAMPOS = {
  evento: 'Evento', pagina: 'Página', titulo: 'Título da página', host: 'Domínio', url: 'URL',
  origem: 'Origem', referrer: 'Site de origem', utm_source: 'UTM source', utm_medium: 'UTM medium', utm_campaign: 'UTM campaign',
  utm_content: 'UTM content', utm_term: 'UTM term', aparelho: 'Aparelho', navegador: 'Navegador', sistema: 'Sistema',
  pais: 'País', regiao: 'Região', idioma: 'Idioma', usuario: 'Usuário identificado',
} as const
export type Campo = keyof typeof CAMPOS | `prop:${string}`
export const campo = () => z.string().regex(/^(evento|pagina|titulo|host|url|origem|referrer|utm_source|utm_medium|utm_campaign|utm_content|utm_term|aparelho|navegador|sistema|pais|regiao|idioma|usuario|prop:[A-Za-z0-9_$.:-]{1,64})$/, 'Campo desconhecido.')
export const rotuloCampo = (c: string) => c.startsWith('prop:') ? c.slice(5) : CAMPOS[c as keyof typeof CAMPOS] ?? c

export const OPERADORES = { igual: 'é', diferente: 'não é', contem: 'contém', nao_contem: 'não contém', existe: 'existe', nao_existe: 'não existe', maior: 'maior que', menor: 'menor que' } as const
export const filtro = z.union([
  z.object({ campo: campo(), op: z.enum(['igual', 'diferente', 'contem', 'nao_contem', 'existe', 'nao_existe', 'maior', 'menor']), valor: z.string().max(500).optional() }).strict(),
  z.object({ campo: z.literal('coorte'), op: z.enum(['igual', 'diferente']), valor: z.string().uuid() }).strict(),
])
export type Filtro = z.infer<typeof filtro>
const filtros = () => z.array(filtro).max(20).default([])
const nomeEvento = () => z.string().min(1).max(120).regex(/^[$A-Za-z0-9_.:\- ]+$/, 'Evento inválido.')
/** `$todos` = qualquer evento. */
export const TODOS = '$todos'

const periodo = {
  de: z.string().datetime({ offset: true }),
  ate: z.string().datetime({ offset: true }),
}

export const tendencia = z.object({
  tipo: z.literal('tendencia'),
  series: z.array(z.object({ evento: nomeEvento(), metrica: z.enum(['total', 'pessoas', 'sessoes']).default('total'), nome: z.string().max(80).optional(), filtros: filtros() }).strict()).min(1).max(5),
  intervalo: z.enum(['hora', 'dia', 'semana', 'mes']).default('dia'),
  quebra: campo().optional(),
  filtros: filtros(),
  comparar: z.boolean().default(false),
  ...periodo,
}).strict()

export const funil = z.object({
  tipo: z.literal('funil'),
  passos: z.array(z.object({ evento: nomeEvento(), nome: z.string().max(80).optional(), filtros: filtros() }).strict()).min(2).max(10),
  janela_dias: z.number().int().min(1).max(90).default(7),
  quebra: campo().optional(),
  filtros: filtros(),
  ...periodo,
}).strict()

export const retencao = z.object({
  tipo: z.literal('retencao'),
  inicial: z.object({ evento: nomeEvento(), filtros: filtros() }).strict(),
  retorno: z.object({ evento: nomeEvento(), filtros: filtros() }).strict(),
  intervalo: z.enum(['dia', 'semana', 'mes']).default('semana'),
  periodos: z.number().int().min(2).max(12).default(8),
  filtros: filtros(),
  ...periodo,
}).strict()

export const caminhos = z.object({
  tipo: z.literal('caminhos'),
  pagina: z.string().max(500).optional(),             // começa (ou termina) nesta página; sem ela, no início da sessão
  direcao: z.enum(['depois', 'antes']).default('depois'),
  passos: z.number().int().min(2).max(6).default(4),
  filtros: filtros(),
  ...periodo,
}).strict()

export const consulta = z.discriminatedUnion('tipo', [tendencia, funil, retencao, caminhos])
export type Consulta = z.infer<typeof consulta>
export type ConsultaTendencia = z.infer<typeof tendencia>
export type ConsultaFunil = z.infer<typeof funil>
export type ConsultaRetencao = z.infer<typeof retencao>
export type ConsultaCaminhos = z.infer<typeof caminhos>

// ---------- coortes ----------
export const regraCoorte = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('fez'), evento: nomeEvento(), vezes: z.number().int().min(1).max(1000).default(1), dias: z.number().int().min(1).max(400).default(30), filtros: filtros() }).strict(),
  z.object({ tipo: z.literal('nao_fez'), evento: nomeEvento(), dias: z.number().int().min(1).max(400).default(30) }).strict(),
  z.object({ tipo: z.literal('propriedade'), campo: campo(), op: z.enum(['igual', 'diferente', 'contem', 'nao_contem', 'existe', 'nao_existe']), valor: z.string().max(500).optional() }).strict(),
])
export const definicaoCoorte = z.object({ combinar: z.enum(['todas', 'qualquer']).default('todas'), regras: z.array(regraCoorte).min(1).max(10) }).strict()
export type DefinicaoCoorte = z.infer<typeof definicaoCoorte>

// ---------- resultados ----------
export type ResultadoTendencia = {
  tipo: 'tendencia'; rotulos: string[]
  series: { nome: string; quebra?: string; valores: number[]; total: number }[]
  anterior?: { rotulos: string[]; series: { nome: string; quebra?: string; valores: number[]; total: number }[] }
}
export type PassoFunil = { nome: string; pessoas: number; conversao: number; do_anterior: number; tempo_mediano_s: number | null }
export type ResultadoFunil = { tipo: 'funil'; passos: PassoFunil[]; quebras: { quebra: string; passos: PassoFunil[] }[] }
export type ResultadoRetencao = { tipo: 'retencao'; rotulos: string[]; coortes: { inicio: string; tamanho: number; valores: (number | null)[] }[] }
export type ResultadoCaminhos = { tipo: 'caminhos'; inicio: { pagina: string; sessoes: number }[]; ligacoes: { passo: number; de: string; para: string; sessoes: number }[] }
export type Resultado = ResultadoTendencia | ResultadoFunil | ResultadoRetencao | ResultadoCaminhos

/** Rótulo de período legível: "28/11", "28/11 14h", "sem. 24/11", "nov/26". */
export function rotuloPeriodo(p: string, intervalo: string) {
  const [data, hora] = p.split('T'), [a, m, d] = data.split('-')
  if (intervalo === 'hora') return `${d}/${m} ${hora?.slice(0, 2)}h`
  if (intervalo === 'mes') return `${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(m) - 1]}/${a.slice(2)}`
  if (intervalo === 'semana') return `sem. ${d}/${m}`
  return `${d}/${m}`
}
