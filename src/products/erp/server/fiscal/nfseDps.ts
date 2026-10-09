import { createHash } from 'node:crypto'

// DPS (Declaração de Prestação de Serviço) no formato da NFS-e Nacional. É o pedido que um provedor real recebe:
// a simulação monta e valida exatamente este conteúdo; ligar o provedor real passa a ser só trocar o adaptador.
// Os nomes dos campos seguem o leiaute nacional (infDPS, prest, toma, serv, valores).

type Row = Record<string, unknown>
export type DpsIssue = { campo: string; mensagem: string }
export type FederalRetentions = { irrf?: number; inss?: number; pis?: number; cofins?: number; csll?: number }

const digits = (value: unknown) => String(value ?? '').replace(/\D/g, '')
const money = (value: number) => Math.round(value * 100) / 100

export function validCnpj(value: unknown) {
  const cnpj = digits(value)
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false
  const check = (size: number) => {
    let sum = 0, weight = size - 7
    for (let i = 0; i < size; i++) { sum += Number(cnpj[i]) * weight--; if (weight < 2) weight = 9 }
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }
  return check(12) === Number(cnpj[12]) && check(13) === Number(cnpj[13])
}

export function validCpf(value: unknown) {
  const cpf = digits(value)
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false
  const check = (size: number) => {
    let sum = 0
    for (let i = 0; i < size; i++) sum += Number(cpf[i]) * (size + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return check(9) === Number(cpf[9]) && check(10) === Number(cpf[10])
}

// Endereço nacional do tomador (opcional no leiaute): só vai quando há código IBGE, CEP e logradouro.
function tomadorAddress(customer: Row) {
  const cMun = String(customer.codigo_municipio || ''), cep = digits(customer.cep), xLgr = String(customer.logradouro || '').trim()
  if (!/^\d{7}$/.test(cMun) || cep.length !== 8 || !xLgr) return null
  return { endNac: { cMun, CEP: cep }, xLgr: xLgr.slice(0, 255), nro: String(customer.numero || 'S/N').trim().slice(0, 60) || 'S/N',
    ...(customer.complemento ? { xCpl: String(customer.complemento).trim().slice(0, 156) } : {}), xBairro: String(customer.bairro || '-').trim().slice(0, 60) || '-' }
}

const SIMPLES = ['simples_nacional', 'simples_nacional_excesso', 'mei']
// opSimpNac do leiaute: 1 não optante, 2 MEI, 3 ME/EPP optante.
const simplesOption = (regime: unknown) => regime === 'mei' ? 2 : SIMPLES.includes(String(regime)) ? 3 : 1

export type DpsInput = {
  ambiente: 'homologacao' | 'producao'; serie: string; numero: number; competencia: string; emitidaEm: string
  municipioPrestacao: string; config: Row | null; customer: Row
  items: Array<{ descricao: string; quantidade: number; valor_unitario: number; desconto: number; total: number; servico: Row }>
  totals: { total: number; valor_iss: number; retencao_iss: number }; aliquotaIss: number; issRetido: boolean
  retencoesFederais: FederalRetentions; observacoes?: string
}

// Monta o DPS e devolve todos os problemas que um provedor real recusaria (por campo do leiaute).
export function buildDps(input: DpsInput) {
  const issues: DpsIssue[] = []
  const config = input.config || {}
  const require = (ok: boolean, campo: string, mensagem: string) => { if (!ok) issues.push({ campo, mensagem }) }

  // Prestador (emitente): vem da configuração fiscal da empresa.
  require(Boolean(input.config), 'prest', 'Cadastre os dados fiscais da empresa (CNPJ, inscrição municipal, regime e endereço).')
  if (input.config) {
    require(validCnpj(config.cnpj), 'prest.CNPJ', 'CNPJ da empresa ausente ou inválido.')
    require(Boolean(String(config.razao_social || '').trim()), 'prest.xNome', 'Informe a razão social da empresa.')
    require(Boolean(digits(config.inscricao_municipal)), 'prest.IM', 'Informe a inscrição municipal da empresa.')
    require(Boolean(config.regime_tributario) && config.regime_tributario !== 'outro', 'prest.regTrib', 'Informe o regime tributário da empresa.')
    require(/^\d{7}$/.test(String(config.endereco_codigo_municipio || '')), 'prest.end.cMun', 'Código IBGE do município da empresa deve ter 7 dígitos.')
  }
  // Tomador.
  const document = digits(input.customer.documento)
  const isCompany = document.length === 14
  require(isCompany ? validCnpj(document) : validCpf(document), isCompany ? 'toma.CNPJ' : 'toma.CPF', 'CPF/CNPJ do cliente ausente ou inválido.')
  require(Boolean(String(input.customer.nome || '').trim()), 'toma.xNome', 'Informe o nome do cliente.')
  if (input.issRetido) require(isCompany, 'valores.trib.tribMun.tpRetISSQN', 'Retenção de ISS só ocorre quando o tomador é pessoa jurídica.')
  // Serviço (o leiaute nacional aceita um serviço por DPS; vários itens viram a discriminação do mesmo serviço).
  const services = [...new Map(input.items.map(item => [String(item.servico.id), item.servico])).values()]
  const codes = [...new Set(services.map(service => String(service.codigo_tributacao_nacional || '')))]
  require(codes.length === 1, 'serv.cServ.cTribNac', 'Todos os itens da nota precisam ter o mesmo código de tributação nacional (uma NFS-e por tipo de serviço).')
  for (const service of services) require(/^\d{6}$/.test(String(service.codigo_tributacao_nacional || '')), 'serv.cServ.cTribNac',
    `Informe o código de tributação nacional (6 dígitos, item da LC 116) no serviço "${service.nome}".`)
  require(/^\d{7}$/.test(input.municipioPrestacao), 'serv.locPrest.cLocPrestacao', 'Código IBGE do local da prestação deve ter 7 dígitos.')
  require(input.totals.total > 0, 'valores.vServPrest.vServ', 'O valor dos serviços deve ser maior que zero.')
  // ISS: 2% a 5% (LC 116, art. 8º-A); no Simples/MEI a alíquota vem da faixa do Simples, ainda nesse intervalo.
  require(input.aliquotaIss >= 2 && input.aliquotaIss <= 5, 'valores.trib.tribMun.pAliq', 'Alíquota de ISS deve estar entre 2% e 5%.')
  require(input.competencia <= input.emitidaEm.slice(0, 10), 'infDPS.dCompet', 'A competência não pode ser futura.')
  const federal = input.retencoesFederais
  const federalTotal = money(Object.values(federal).reduce((sum: number, value) => sum + Number(value || 0), 0))
  if (federalTotal > 0) require(isCompany, 'valores.trib.tribFed', 'Retenções federais só se aplicam a tomador pessoa jurídica.')
  const retained = money(input.totals.retencao_iss + federalTotal)
  require(retained < input.totals.total, 'valores', 'As retenções não podem ser maiores que o valor dos serviços.')

  const description = input.items.map(item => `${item.descricao} — ${item.quantidade} x ${item.valor_unitario.toFixed(2)}${item.desconto ? ` (desconto ${item.desconto.toFixed(2)})` : ''}`).join('; ')
  const service = services[0] || {}
  const dps = {
    infDPS: {
      tpAmb: input.ambiente === 'producao' ? 1 : 2, dhEmi: input.emitidaEm, verAplic: 'cognito-erp', serie: input.serie, nDPS: input.numero,
      dCompet: input.competencia, tpEmit: 1, cLocEmi: String(config.endereco_codigo_municipio || ''),
      prest: {
        CNPJ: digits(config.cnpj), IM: digits(config.inscricao_municipal), xNome: config.razao_social,
        end: { endNac: { cMun: config.endereco_codigo_municipio, CEP: digits(config.endereco_cep) }, xLgr: config.endereco_logradouro, nro: config.endereco_numero, xBairro: config.endereco_bairro },
        regTrib: { opSimpNac: simplesOption(config.regime_tributario), regEspTrib: 0 },
      },
      toma: {
        ...(isCompany ? { CNPJ: document } : { CPF: document }), xNome: input.customer.nome,
        ...(tomadorAddress(input.customer) ? { end: tomadorAddress(input.customer) } : {}),
        ...(input.customer.email ? { email: input.customer.email } : {}),
      },
      serv: {
        locPrest: { cLocPrestacao: input.municipioPrestacao },
        cServ: { cTribNac: service.codigo_tributacao_nacional, ...(service.codigo_servico_municipal ? { cTribMun: service.codigo_servico_municipal } : {}),
          xDescServ: [description, input.observacoes].filter(Boolean).join(' | ').slice(0, 2000), ...(service.codigo_nbs ? { cNBS: service.codigo_nbs } : {}) },
      },
      valores: {
        vServPrest: { vServ: input.totals.total },
        trib: {
          tribMun: { tribISSQN: 1, pAliq: input.aliquotaIss, tpRetISSQN: input.issRetido ? 2 : 1 },
          ...(federalTotal > 0 ? { tribFed: { vRetIRRF: money(federal.irrf || 0), vRetCP: money(federal.inss || 0), piscofins: { vPis: money(federal.pis || 0), vCofins: money(federal.cofins || 0) }, vRetCSLL: money(federal.csll || 0) } } : {}),
          totTrib: { indTotTrib: 0 },
        },
      },
    },
  }
  return { dps, issues, retencoes: { iss: input.totals.retencao_iss, federais: federalTotal, total: retained }, valorLiquido: money(input.totals.total - retained) }
}

// Chave de acesso da NFS-e Nacional (50 posições): município, ambiente, tipo de inscrição, CNPJ, número, ano/mês,
// código numérico e dígito verificador. Na simulação o código numérico vem de um hash estável.
export function nfseAccessKey(input: { municipio: string; ambiente: 'homologacao' | 'producao'; cnpj: string; numero: number; competencia: string; semente: string }) {
  const code = String(parseInt(createHash('sha256').update(input.semente).digest('hex').slice(0, 8), 16) % 1e9).padStart(9, '0')
  const base = `${input.municipio.padStart(7, '0')}${input.ambiente === 'producao' ? 1 : 2}2${digits(input.cnpj).padStart(14, '0')}${String(input.numero).padStart(13, '0')}${input.competencia.slice(2, 4)}${input.competencia.slice(5, 7)}${code}`
  let sum = 0, weight = 2
  for (let i = base.length - 1; i >= 0; i--) { sum += Number(base[i]) * weight; weight = weight === 9 ? 2 : weight + 1 }
  const dv = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return (base + dv).slice(0, 50).padEnd(50, '0')
}

const xmlEscape = (value: unknown) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
function toXml(name: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  if (Array.isArray(value)) return value.map(item => toXml(name, item)).join('')
  if (typeof value === 'object') return `<${name}>${Object.entries(value as Row).map(([key, child]) => toXml(key, child)).join('')}</${name}>`
  return `<${name}>${xmlEscape(value)}</${name}>`
}

// XML da NFS-e simulada: o DPS enviado mais os dados de autorização (como o retorno de um provedor real),
// marcado como simulação e sem assinatura digital.
export function simulatedNfseXml(input: { dps: Row; chave: string; numero: string; codigoVerificacao: string; autorizadaEm: string; status: string }) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<!-- SIMULAÇÃO - SEM VALIDADE FISCAL. Documento não assinado e não transmitido. -->\n'
    + `<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00"><infNFSe Id="NFS${input.chave}">`
    + toXml('nNFSe', input.numero) + toXml('cVerif', input.codigoVerificacao) + toXml('dhProc', input.autorizadaEm) + toXml('situacao', input.status)
    + `<DPS versao="1.00">${toXml('infDPS', (input.dps as { infDPS: Row }).infDPS)}</DPS></infNFSe></NFSe>\n`
}
