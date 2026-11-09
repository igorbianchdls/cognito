import type { CSSProperties, ReactNode } from 'react'
import { random } from 'remotion'
import { loadFont as loadArimo } from '@remotion/google-fonts/Arimo'

// A DANFSe (the PDF of a national-standard NFS-e) drawn as faithfully as possible: A4 sheet, thin-bordered boxes,
// gray section bars, small uppercase labels. Sections follow the national model: header with access key and QR
// Code, issuer, client, intermediary, service, municipal and federal taxes, IBS/CBS (2026), totals, approximate
// taxes and additional information. Everything can be revealed progressively for animations.
// No official coat of arms or logos: only the "NFS-e" wordmark. All data are made up.

export const DANFSE_W = 794 // A4 at 96 dpi
export const DANFSE_H = 1123

const ARIMO = loadArimo('normal', { subsets: ['latin'], weights: ['400', '700'] }).fontFamily
const INK = '#111', LABEL = '#3d3d3d', BORDER = '#9a9a9a', BAR = '#e3e3e3'

export type DanfseData = {
  numero: number
  competencia: string
  emissao: string
  dps: { numero: number; serie: string; emissao: string }
  chave: string
  emitente: { cnpj: string; im: string; telefone: string; nome: string; email: string; endereco: string; municipio: string; cep: string; simples: string; regime: string }
  tomador: { cnpj: string; im: string; telefone: string; nome: string; email: string; endereco: string; municipio: string; cep: string }
  servico: { codigoNacional: string; codigoMunicipal: string; local: string; pais: string; descricao: string }
  valor: number
  aliquotaIss: number
  retencoes: { irrf: number; csll: number; pis: number; cofins: number }
  info: string
}

export const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const money = (v: number) => `R$ ${brl(v)}`
export const pct = (v: number) => `${(v * 100).toFixed(2).replace('.', ',')}%`

export function danfseTotals(d: DanfseData) {
  const iss = d.valor * d.aliquotaIss
  const r = d.retencoes
  const irrf = d.valor * r.irrf, csll = d.valor * r.csll, pis = d.valor * r.pis, cofins = d.valor * r.cofins
  const federais = irrf + csll + pis + cofins
  const cbs = d.valor * 0.009, ibs = d.valor * 0.001
  return { iss, irrf, csll, pis, cofins, federais, liquido: d.valor - federais, cbs, ibs }
}

/** Builds a 50-digit national access key from its parts (city, environment, issuer, number, year-month, code). */
export function makeChave(cnpj: string, numero: number, aamm: string, seed: string) {
  const code = String(Math.floor(random(seed) * 1e9)).padStart(9, '0')
  const base = `3550308` + `1` + `2` + cnpj.replace(/\D/g, '') + String(numero).padStart(13, '0') + aamm + code
  let sum = 0
  for (let i = 0; i < base.length; i++) sum += Number(base[base.length - 1 - i]) * (2 + (i % 8))
  const dv = (11 - (sum % 11)) % 10
  return base + dv
}

export const SAMPLE: DanfseData = (() => {
  const emitente = { cnpj: '41.208.556/0001-30', im: '7.384.215-0', telefone: '(11) 3456-7890', nome: 'OTTO CONSULTORIA EM GESTÃO LTDA', email: 'financeiro@ottoconsultoria.com.br',
    endereco: 'Rua Fradique Coutinho, 1632, Sala 41, Pinheiros', municipio: 'São Paulo - SP', cep: '05416-001', simples: 'Não Optante', regime: '-' }
  return {
    numero: 127, competencia: '10/2026', emissao: '09/11/2026 14:32:18',
    dps: { numero: 127, serie: '900', emissao: '09/11/2026 14:32:11' },
    chave: makeChave(emitente.cnpj, 127, '2611', 'chave-127'),
    emitente,
    tomador: { cnpj: '28.417.903/0001-62', im: '5.902.118-7', telefone: '(11) 2987-4410', nome: 'AURORA TECNOLOGIA LTDA', email: 'contas@auroratec.com.br',
      endereco: 'Avenida Paulista, 1842, Conj. 155, Bela Vista', municipio: 'São Paulo - SP', cep: '01310-200' },
    servico: { codigoNacional: '17.01.01 - Assessoria ou consultoria de qualquer natureza, não contida em outros itens desta lista.', codigoMunicipal: '03115', local: 'São Paulo - SP', pais: 'Brasil',
      descricao: 'Consultoria em gestão financeira e implantação de rotinas de conciliação bancária referente ao mês de outubro/2026, conforme contrato nº 2026/031.' },
    valor: 4000, aliquotaIss: 0.05, retencoes: { irrf: 0.015, csll: 0.01, pis: 0.0065, cofins: 0.03 },
    info: 'Retenção de IRRF (1,5%) e CSRF (4,65%) conforme legislação vigente. Valores de IBS e CBS destacados apenas para fins informativos (art. 348, LC 214/2025). Pagamento via PIX até 20/11/2026.',
  }
})()

export type DanfseSection = 'header' | 'emitente' | 'tomador' | 'intermediario' | 'servico' | 'municipal' | 'federal' | 'ibscbs' | 'total' | 'aproximados' | 'info'
export const SECTIONS: DanfseSection[] = ['header', 'emitente', 'tomador', 'intermediario', 'servico', 'municipal', 'federal', 'ibscbs', 'total', 'aproximados', 'info']

/** y (top) and height of each section on the sheet, used to frame the camera. */
export const SECTION_Y: Record<DanfseSection, [number, number]> = {
  header: [22, 195], emitente: [217, 134], tomador: [351, 105], intermediario: [456, 35], servico: [491, 103], municipal: [594, 134],
  federal: [728, 76], ibscbs: [804, 44], total: [848, 76], aproximados: [924, 45], info: [969, 129],
}

type Reveal = (s: DanfseSection) => number

/** A value that types in as its section is revealed (0…1). */
function V({ children, p, style }: { children: ReactNode; p: number; style?: CSSProperties }) {
  return <div style={{ fontSize: 11.5, color: INK, lineHeight: '14px', minHeight: 14, clipPath: `inset(0 ${(1 - Math.min(1, Math.max(0, p))) * 100}% 0 0)`, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', ...style }}>{children}</div>
}
function Cell({ label, children, w, p, style, valueStyle }: { label: string; children?: ReactNode; w?: number | string; p: number; style?: CSSProperties; valueStyle?: CSSProperties }) {
  return <div style={{ flex: w === undefined ? 1 : undefined, width: w, padding: '2px 5px 3px', borderLeft: `0.75px solid ${BORDER}`, minWidth: 0, ...style }}>
    <div style={{ fontSize: 7.4, fontWeight: 700, color: LABEL, letterSpacing: 0.15, textTransform: 'uppercase', lineHeight: '10px', whiteSpace: 'nowrap', overflow: 'hidden' }}>{label}</div>
    <V p={p} style={valueStyle}>{children}</V>
  </div>
}
function Row({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ display: 'flex', borderTop: `0.75px solid ${BORDER}`, marginLeft: -0.75, ...style }}>{children}</div>
}
function Bar({ children }: { children: ReactNode }) {
  return <div style={{ background: BAR, borderTop: `0.75px solid ${BORDER}`, fontSize: 8.6, fontWeight: 700, color: INK, padding: '2px 6px', letterSpacing: 0.4, textTransform: 'uppercase' }}>{children}</div>
}

/** A QR Code look-alike: the three finder patterns, timing lines and seeded modules, drawn up to `p` (0…1). */
export function QrCode({ size, p = 1, seed = 'qr' }: { size: number; p?: number; seed?: string }) {
  const N = 33, m = size / N
  const finder = (x: number, y: number) => x < 7 && y < 7 || x >= N - 7 && y < 7 || x < 7 && y >= N - 7
  const cells: ReactNode[] = []
  let k = 0
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (finder(x, y)) continue
    const timing = (x === 6 || y === 6) && (x + y) % 2 === 0
    const on = timing || (!(x === 6 || y === 6) && random(`${seed}-${x}-${y}`) > 0.52)
    k++
    const order = random(`${seed}-o-${x}-${y}`) * 0.85 + (y / N) * 0.15
    if (on && order <= p) cells.push(<rect key={k} x={x * m} y={y * m} width={m + 0.15} height={m + 0.15} fill={INK} />)
  }
  const F = (x: number, y: number) => <g key={`f${x}-${y}`} opacity={Math.min(1, p * 4)}>
    <rect x={x * m} y={y * m} width={7 * m} height={7 * m} fill={INK} />
    <rect x={(x + 1) * m} y={(y + 1) * m} width={5 * m} height={5 * m} fill="#fff" />
    <rect x={(x + 2) * m} y={(y + 2) * m} width={3 * m} height={3 * m} fill={INK} />
  </g>
  return <svg width={size} height={size} style={{ display: 'block' }}><rect width={size} height={size} fill="#fff" />{F(0, 0)}{F(N - 7, 0)}{F(0, N - 7)}{cells}</svg>
}

/** Chave de acesso in blocks of 4; digits not settled yet roll (random) until `p` reaches them. */
export function chaveText(chave: string, p: number, frame: number) {
  const settled = Math.floor(p * chave.length)
  const digits = chave.split('').map((c, i) => i < settled ? c : p > 0 ? String(Math.floor(random(`roll-${i}-${frame}`) * 10)) : ' ')
  const out: string[] = []
  for (let i = 0; i < digits.length; i += 4) out.push(digits.slice(i, i + 4).join(''))
  return out.join(' ')
}

export type DanfseProps = {
  data?: DanfseData
  /** How much of each section is filled (0…1). Defaults to everything filled. */
  reveal?: Reveal
  /** 0…1: the access key settling digit by digit. */
  chave?: number
  /** 0…1: the QR Code drawing. */
  qr?: number
  /** The section in focus gets a soft highlight. */
  focus?: DanfseSection | null
  /** Values of the money fields can count up: 0…1 multiplier per section. */
  count?: Reveal
  frame?: number
  style?: CSSProperties
}

export function Danfse({ data = SAMPLE, reveal = () => 1, chave = 1, qr = 1, focus = null, count = () => 1, frame = 0, style }: DanfseProps) {
  const d = data, t = danfseTotals(d)
  const r = reveal
  const c = (s: DanfseSection, v: number) => money(v * Math.min(1, Math.max(0, count(s))))
  const hl = (s: DanfseSection): CSSProperties => focus === s ? { background: 'rgb(255 214 10 / .18)', boxShadow: 'inset 0 0 0 2px rgb(234 179 8 / .9)' } : {}
  const e = d.emitente, tm = d.tomador, sv = d.servico
  return <div style={{ position: 'relative', width: DANFSE_W, height: DANFSE_H, background: '#fff', fontFamily: ARIMO, color: INK, padding: 22, boxSizing: 'border-box', ...style }}>
    <div style={{ border: `1px solid ${BORDER}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ ...hl('header') }}>
        <div style={{ display: 'flex', alignItems: 'stretch', height: 104 }}>
          <div style={{ width: 172, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: `0.75px solid ${BORDER}` }}>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>NFS<span style={{ color: '#5a5a5a' }}>-e</span></div>
            <div style={{ fontSize: 7.4, color: LABEL, marginTop: 4, textAlign: 'center', lineHeight: '9px' }}>Nota Fiscal de<br />Serviço eletrônica</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.4 }}>DANFSe v1.0</div>
            <div style={{ fontSize: 10.5 }}>Documento Auxiliar da NFS-e</div>
            <div style={{ fontSize: 8, color: LABEL, marginTop: 4 }}>Prefeitura do Município de São Paulo · Ambiente Nacional</div>
          </div>
          <div style={{ width: 104, display: 'grid', placeItems: 'center', borderLeft: `0.75px solid ${BORDER}` }}><QrCode size={88} p={qr} seed={`qr-${d.numero}`} /></div>
        </div>
        <Row><Cell label="Chave de Acesso da NFS-e" p={chave > 0 ? 1 : 0} valueStyle={{ fontFamily: 'Arimo, monospace', fontSize: 12, letterSpacing: 0.6, fontWeight: 700 }}>{chaveText(d.chave, chave, frame)}</Cell></Row>
        <Row><Cell label="Número da NFS-e" p={r('header')}>{d.numero}</Cell><Cell label="Competência da NFS-e" p={r('header')}>{d.competencia}</Cell><Cell label="Data e Hora da emissão da NFS-e" p={r('header')}>{d.emissao}</Cell></Row>
        <Row><Cell label="Número da DPS" p={r('header')}>{d.dps.numero}</Cell><Cell label="Série da DPS" p={r('header')}>{d.dps.serie}</Cell><Cell label="Data e Hora da emissão da DPS" p={r('header')}>{d.dps.emissao}</Cell></Row>
      </div>
      {/* Emitente */}
      <div style={hl('emitente')}>
        <Bar>Emitente da NFS-e · Prestador do Serviço</Bar>
        <Row><Cell label="CNPJ / CPF / NIF" p={r('emitente')}>{e.cnpj}</Cell><Cell label="Inscrição Municipal" p={r('emitente')}>{e.im}</Cell><Cell label="Telefone" p={r('emitente')}>{e.telefone}</Cell></Row>
        <Row><Cell label="Nome / Nome Empresarial" w="58%" p={r('emitente')}>{e.nome}</Cell><Cell label="E-mail" p={r('emitente')}>{e.email}</Cell></Row>
        <Row><Cell label="Endereço" w="58%" p={r('emitente')}>{e.endereco}</Cell><Cell label="Município" p={r('emitente')}>{e.municipio}</Cell><Cell label="CEP" w={90} p={r('emitente')}>{e.cep}</Cell></Row>
        <Row><Cell label="Simples Nacional na Data de Competência" w="58%" p={r('emitente')}>{e.simples}</Cell><Cell label="Regime de Apuração Tributária pelo SN" p={r('emitente')}>{e.regime}</Cell></Row>
      </div>
      {/* Tomador */}
      <div style={hl('tomador')}>
        <Bar>Tomador do Serviço</Bar>
        <Row><Cell label="CNPJ / CPF / NIF" p={r('tomador')}>{tm.cnpj}</Cell><Cell label="Inscrição Municipal" p={r('tomador')}>{tm.im}</Cell><Cell label="Telefone" p={r('tomador')}>{tm.telefone}</Cell></Row>
        <Row><Cell label="Nome / Nome Empresarial" w="58%" p={r('tomador')}>{tm.nome}</Cell><Cell label="E-mail" p={r('tomador')}>{tm.email}</Cell></Row>
        <Row><Cell label="Endereço" w="58%" p={r('tomador')}>{tm.endereco}</Cell><Cell label="Município" p={r('tomador')}>{tm.municipio}</Cell><Cell label="CEP" w={90} p={r('tomador')}>{tm.cep}</Cell></Row>
      </div>
      {/* Intermediário */}
      <div style={hl('intermediario')}>
        <Bar>Intermediário do Serviço</Bar>
        <Row><div style={{ flex: 1, textAlign: 'center', fontSize: 9.5, padding: '4px 0', borderLeft: `0.75px solid ${BORDER}`, opacity: r('intermediario') > 0 ? 1 : 0 }}>NÃO IDENTIFICADO NA NFS-e</div></Row>
      </div>
      {/* Serviço */}
      <div style={hl('servico')}>
        <Bar>Serviço Prestado</Bar>
        <Row><Cell label="Código de Tributação Nacional" w="58%" p={r('servico')}>{sv.codigoNacional}</Cell><Cell label="Código Trib. Municipal" p={r('servico')}>{sv.codigoMunicipal}</Cell><Cell label="Local da Prestação" p={r('servico')}>{sv.local}</Cell><Cell label="País" w={60} p={r('servico')}>{sv.pais}</Cell></Row>
        <Row><div style={{ flex: 1, padding: '2px 5px 4px', borderLeft: `0.75px solid ${BORDER}` }}>
          <div style={{ fontSize: 7.4, fontWeight: 700, color: LABEL, textTransform: 'uppercase', letterSpacing: 0.15 }}>Descrição do Serviço</div>
          <div style={{ fontSize: 11, lineHeight: '14px', height: 42, clipPath: `inset(0 0 ${(1 - Math.min(1, r('servico'))) * 100}% 0)` }}>{sv.descricao}</div>
        </div></Row>
      </div>
      {/* Tributação municipal */}
      <div style={hl('municipal')}>
        <Bar>Tributação Municipal</Bar>
        <Row><Cell label="Tributação do ISSQN" p={r('municipal')}>Operação Tributável</Cell><Cell label="País Resultado da Prestação" p={r('municipal')}>-</Cell><Cell label="Município de Incidência do ISSQN" p={r('municipal')}>São Paulo - SP</Cell><Cell label="Regime Especial de Tributação" p={r('municipal')}>Nenhum</Cell></Row>
        <Row><Cell label="Tipo de Imunidade" p={r('municipal')}>-</Cell><Cell label="Suspensão da Exigibilidade" p={r('municipal')}>Não</Cell><Cell label="Número Processo Suspensão" p={r('municipal')}>-</Cell><Cell label="Benefício Municipal" p={r('municipal')}>-</Cell></Row>
        <Row><Cell label="Valor do Serviço" p={r('municipal')}>{c('municipal', d.valor)}</Cell><Cell label="Desconto Incondicionado" p={r('municipal')}>-</Cell><Cell label="Total Deduções / Reduções" p={r('municipal')}>-</Cell><Cell label="Cálculo do BM" p={r('municipal')}>-</Cell></Row>
        <Row><Cell label="BC ISSQN" p={r('municipal')}>{c('municipal', d.valor)}</Cell><Cell label="Alíquota Aplicada" p={r('municipal')}>{pct(d.aliquotaIss)}</Cell><Cell label="Retenção do ISSQN" p={r('municipal')}>Não Retido</Cell><Cell label="ISSQN Apurado" p={r('municipal')} valueStyle={{ fontWeight: 700 }}>{c('municipal', t.iss)}</Cell></Row>
      </div>
      {/* Tributação federal */}
      <div style={hl('federal')}>
        <Bar>Tributação Federal</Bar>
        <Row><Cell label="IRRF" p={r('federal')}>{c('federal', t.irrf)}</Cell><Cell label="Contribuição Previdenciária - Retida" p={r('federal')}>-</Cell><Cell label="Contribuições Sociais - Retidas" p={r('federal')}>{c('federal', t.csll + t.pis + t.cofins)}</Cell><Cell label="Descrição Contrib. Sociais" p={r('federal')}>CSLL, PIS e COFINS</Cell></Row>
        <Row><Cell label="CSLL" p={r('federal')}>{c('federal', t.csll)}</Cell><Cell label="PIS - Débito Apuração Própria" p={r('federal')}>{c('federal', t.pis)}</Cell><Cell label="COFINS - Débito Apuração Própria" p={r('federal')}>{c('federal', t.cofins)}</Cell><Cell label="Total Retenções Federais" p={r('federal')} valueStyle={{ fontWeight: 700 }}>{c('federal', t.federais)}</Cell></Row>
      </div>
      {/* IBS / CBS */}
      <div style={hl('ibscbs')}>
        <Bar>IBS e CBS · Destaque Informativo (2026)</Bar>
        <Row><Cell label="Base de Cálculo" p={r('ibscbs')}>{c('ibscbs', d.valor)}</Cell><Cell label="Alíquota CBS" p={r('ibscbs')}>0,90%</Cell><Cell label="Valor CBS" p={r('ibscbs')}>{c('ibscbs', t.cbs)}</Cell><Cell label="Alíquota IBS" p={r('ibscbs')}>0,10%</Cell><Cell label="Valor IBS" p={r('ibscbs')}>{c('ibscbs', t.ibs)}</Cell></Row>
      </div>
      {/* Total */}
      <div style={hl('total')}>
        <Bar>Valor Total da NFS-e</Bar>
        <Row><Cell label="Valor do Serviço" p={r('total')}>{c('total', d.valor)}</Cell><Cell label="Desconto Condicionado" p={r('total')}>-</Cell><Cell label="Desconto Incondicionado" p={r('total')}>-</Cell><Cell label="ISSQN Retido" p={r('total')}>-</Cell></Row>
        <Row><Cell label="IRRF, CP, CSLL - Retidos" p={r('total')}>{c('total', t.irrf + t.csll)}</Cell><Cell label="PIS / COFINS - Retidos" p={r('total')}>{c('total', t.pis + t.cofins)}</Cell>
          <Cell label="Valor Líquido da NFS-e" w="36%" p={r('total')} style={{ background: '#f2f2f2' }} valueStyle={{ fontSize: 15, fontWeight: 700, lineHeight: '16px' }}>{c('total', t.liquido)}</Cell></Row>
      </div>
      {/* Aproximados */}
      <div style={hl('aproximados')}>
        <Bar>Totais Aproximados dos Tributos</Bar>
        <Row><Cell label="Federais" p={r('aproximados')}>{c('aproximados', d.valor * 0.1343)} (13,43%)</Cell><Cell label="Estaduais" p={r('aproximados')}>R$ 0,00 (0,00%)</Cell><Cell label="Municipais" p={r('aproximados')}>{c('aproximados', t.iss)} (5,00%)</Cell></Row>
      </div>
      {/* Info */}
      <div style={{ ...hl('info'), flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Bar>Informações Complementares</Bar>
        <div style={{ borderTop: `0.75px solid ${BORDER}`, padding: '4px 6px', fontSize: 9.5, lineHeight: '12px', flex: 1, clipPath: `inset(0 0 ${(1 - Math.min(1, r('info'))) * 100}% 0)` }}>{d.info}</div>
      </div>
    </div>
  </div>
}
