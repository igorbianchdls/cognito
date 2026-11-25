// Regras gerais do ERP (catálogo: geral.md). Funções puras, usadas pela tela, pelo servidor e pelo chat.
import { ok, primeiraRecusa, recusa, type Resultado } from './resultado'

/** Fuso padrão das empresas, quando não há outro configurado. */
export const FUSO_PADRAO = 'America/Sao_Paulo'

const fusosConferidos = new Map<string, boolean>()

/** O texto é um fuso IANA que o ambiente reconhece (ex.: America/Sao_Paulo). */
export function fusoValido(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^[A-Za-z][A-Za-z0-9_+\-/]{1,63}$/.test(valor)) return false
  if (!fusosConferidos.has(valor)) {
    try { new Intl.DateTimeFormat('en-US', { timeZone: valor }); fusosConferidos.set(valor, true) }
    catch { fusosConferidos.set(valor, false) }
  }
  return fusosConferidos.get(valor)!
}

/** O fuso informado, ou o padrão quando ausente ou inválido. */
export function fusoDaEmpresa(valor: unknown): string {
  return fusoValido(valor) ? valor : FUSO_PADRAO
}

/**
 * GE-01: "hoje" é sempre a data (AAAA-MM-DD) no fuso da empresa, nunca a data UTC do servidor.
 * Às 22h de 24/11 em São Paulo já é 25/11 em UTC; para o ERP ainda é 24/11.
 */
export function hojeDaEmpresa(fuso?: string | null, agora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: fusoDaEmpresa(fuso), year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(agora)
  const parte = (tipo: string) => partes.find(p => p.type === tipo)!.value
  return `${parte('year')}-${parte('month')}-${parte('day')}`
}

/** Soma dias a uma data AAAA-MM-DD (calculado ao meio-dia UTC para não mudar de dia com o fuso). */
export function somarDias(dia: string, quantidade: number): string {
  const data = new Date(`${dia}T12:00:00Z`)
  data.setUTCDate(data.getUTCDate() + quantidade)
  return data.toISOString().slice(0, 10)
}

/** Primeiro e último dia do mês de `dia`, deslocado em `deslocamento` meses. */
export function limitesDoMes(dia: string, deslocamento = 0): { inicio: string; fim: string } {
  const [ano, mes] = dia.split('-').map(Number)
  const inicio = new Date(Date.UTC(ano, mes - 1 + deslocamento, 1, 12))
  const fim = new Date(Date.UTC(ano, mes + deslocamento, 0, 12))
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) }
}

// ---- Parcelas (GE-11, GE-12) e versão (GE-30) ----

/** Máximo de parcelas por documento (GE-12). */
export const MAXIMO_PARCELAS = 48

/**
 * GE-11, GE-12: um documento tem de 1 a 48 parcelas, sem número repetido, e elas somam exatamente o total
 * (comparado em centavos). `documento` completa a mensagem: "da venda", "da compra", "da despesa", "do título".
 */
export function validarParcelas(dados: { valores: number[]; numeros?: number[]; total: number; documento: string }): Resultado {
  const { valores, numeros = [], total, documento } = dados
  if (valores.length === 0) return recusa('GE-12', 'Informe pelo menos uma parcela.')
  if (valores.length > MAXIMO_PARCELAS) return recusa('GE-12', `A condição de pagamento aceita no máximo ${MAXIMO_PARCELAS} parcelas.`)
  const vistos = new Set<number>()
  for (const numero of numeros) {
    if (!Number.isInteger(numero) || numero <= 0 || numero > MAXIMO_PARCELAS) return recusa('GE-12', 'Número de parcela inválido.')
    if (vistos.has(numero)) return recusa('GE-12', 'Existem parcelas com o mesmo número.')
    vistos.add(numero)
  }
  const soma = valores.reduce((acumulado, valor) => acumulado + Math.round(valor * 100), 0)
  return primeiraRecusa(soma === Math.round(total * 100) ? ok()
    : recusa('GE-11', `A soma das parcelas precisa ser igual ao total ${documento}.`, { detalhes: { soma: soma / 100, total: Math.round(total * 100) / 100 } }))
}

/**
 * GE-30: quem salva precisa estar vendo a versão atual; se outra pessoa salvou antes, recusa.
 * `documento` completa a mensagem: "Esta venda", "Este título"...
 */
export function conferirVersao(dados: { atual: number; esperada: number; documento: string }): Resultado {
  return Number(dados.atual) === Number(dados.esperada) ? ok() : versaoMudou(dados.documento)
}

/** GE-30 quando a gravação não encontrou mais a versão esperada (outra pessoa salvou no meio). */
export function versaoMudou(documento: string): Resultado {
  return recusa('GE-30', `${documento} mudou desde que você abriu (outra pessoa salvou antes). Atualize antes de continuar.`, { codigo: 'VERSION_CONFLICT', status: 409 })
}
