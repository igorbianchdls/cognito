import { createHash } from 'node:crypto'

import { XMLParser } from 'fast-xml-parser'

type XmlNode = Record<string, unknown>

export type ParsedNfe = {
  chave_acesso: string
  numero: string
  serie: string
  data_emissao: string
  data_vencimento: string
  destinatario_documento: string
  fornecedor: { nome: string; documento: string }
  valor_produtos: number
  valor_total: number
  frete: number
  desconto: number
  itens: Array<{
    codigo: string
    descricao: string
    ncm: string
    cfop: string
    unidade: string
    quantidade: number
    valor_unitario: number
    valor_total: number
  }>
  xml: string
  xml_hash: string
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: true,
})

function object(value: unknown): XmlNode {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as XmlNode : {}
}

function array(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  return value == null ? [] : [value]
}

function string(value: unknown) {
  return value == null ? '' : String(value).trim()
}

function number(value: unknown) {
  const parsed = Number(string(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function documentOf(node: XmlNode) {
  return string(node.CNPJ || node.CPF).replace(/\D/g, '')
}

function dateOf(value: unknown) {
  const raw = string(value)
  return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : ''
}

export function parseNfeXml(xmlValue: unknown): ParsedNfe {
  const xml = string(xmlValue)
  if (!xml || xml.length > 10_000_000) throw new Error('XML da NF-e ausente ou acima de 10 MB.')

  let parsed: XmlNode
  try {
    parsed = object(parser.parse(xml))
  } catch {
    throw new Error('O arquivo XML da NF-e esta invalido.')
  }

  const processNode = object(parsed.nfeProc)
  const nfeNode = object(processNode.NFe || parsed.NFe)
  const info = object(nfeNode.infNFe)
  if (Object.keys(info).length === 0) throw new Error('O XML nao contem uma NF-e autorizavel.')

  const ide = object(info.ide)
  const issuer = object(info.emit)
  const recipient = object(info.dest)
  const total = object(object(info.total).ICMSTot)
  const billing = object(info.cobr)
  const firstInstallment = object(array(billing.dup)[0])
  const accessKey = string(info['@_Id'] || object(processNode.protNFe).infProt)
    .replace(/^NFe/, '')
    .replace(/\D/g, '')

  if (accessKey.length !== 44) throw new Error('Chave de acesso da NF-e invalida.')

  const supplierDocument = documentOf(issuer)
  const recipientDocument = documentOf(recipient)
  const supplierName = string(issuer.xNome)
  const valueProducts = number(total.vProd)
  const valueTotal = number(total.vNF)
  if (!supplierName || supplierDocument.length < 11) throw new Error('Emitente da NF-e invalido.')
  if (valueTotal <= 0) throw new Error('Valor total da NF-e precisa ser maior que zero.')

  const items = array(info.det).map((rawDetail) => {
    const product = object(object(rawDetail).prod)
    const quantity = number(product.qCom)
    const unitValue = number(product.vUnCom)
    const itemTotal = number(product.vProd)
    if (!string(product.xProd) || quantity <= 0 || unitValue < 0 || itemTotal < 0) {
      throw new Error('A NF-e possui item com dados invalidos.')
    }
    return {
      codigo: string(product.cProd),
      descricao: string(product.xProd),
      ncm: string(product.NCM),
      cfop: string(product.CFOP),
      unidade: string(product.uCom) || 'UN',
      quantidade: quantity,
      valor_unitario: unitValue,
      valor_total: itemTotal,
    }
  })
  if (items.length === 0) throw new Error('A NF-e nao possui itens.')

  const itemSum = Number(items.reduce((sum, item) => sum + item.valor_total, 0).toFixed(2))
  if (Math.abs(itemSum - Number(valueProducts.toFixed(2))) > 0.02) {
    throw new Error('A soma dos itens nao confere com o total de produtos da NF-e.')
  }

  const issueDate = dateOf(ide.dhEmi || ide.dEmi)
  if (!issueDate) throw new Error('Data de emissao da NF-e invalida.')

  return {
    chave_acesso: accessKey,
    numero: string(ide.nNF),
    serie: string(ide.serie),
    data_emissao: issueDate,
    data_vencimento: dateOf(firstInstallment.dVenc) || issueDate,
    destinatario_documento: recipientDocument,
    fornecedor: { nome: supplierName, documento: supplierDocument },
    valor_produtos: valueProducts,
    valor_total: valueTotal,
    frete: number(total.vFrete),
    desconto: number(total.vDesc),
    itens: items,
    xml,
    xml_hash: createHash('sha256').update(xml).digest('hex'),
  }
}
