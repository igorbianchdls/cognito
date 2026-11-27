// Notas: regras puras dos artefatos (páginas escritas em HTML por um agente). Usadas pelo servidor, pelo MCP e pela tela.

/** Tamanho máximo do HTML de um artefato (1 MB). */
export const LIMITE_HTML = 1024 * 1024

/** Confere o HTML enviado: texto, não vazio e dentro do limite. */
export function validarHtml(html: unknown): { ok: true; valor: string } | { ok: false; erro: string } {
  if (typeof html !== 'string' || !html.trim()) return { ok: false, erro: 'Envie o HTML do artefato.' }
  const bytes = new TextEncoder().encode(html).length
  if (bytes > LIMITE_HTML) return { ok: false, erro: `O HTML tem ${Math.ceil(bytes / 1024)} KB; o limite é ${LIMITE_HTML / 1024} KB.` }
  return { ok: true, valor: html }
}

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/** O texto visível do HTML (sem scripts, estilos e marcações), para a busca das Notas encontrar o artefato. */
export function textoDoHtml(html: string, limite = 20000) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (inteira, nome: string) => {
      if (nome[0] === '#') { const n = nome[1].toLowerCase() === 'x' ? parseInt(nome.slice(2), 16) : parseInt(nome.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ' ' }
      return ENTIDADES[nome.toLowerCase()] ?? inteira
    })
    .replace(/[ \t\f\v\r]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
    .slice(0, limite)
}

/** O <title> do HTML, se houver (o agente pode não mandar um título à parte). */
export function tituloDoHtml(html: string) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m ? textoDoHtml(m[1], 200).replace(/\s+/g, ' ') : ''
}

/**
 * Política de segurança dentro do artefato: scripts e estilos inline e das CDNs conhecidas, imagens e mídia de
 * qualquer https; nenhuma conexão de rede (fetch, XHR, WebSocket), nenhum formulário enviado, nenhum <base>.
 * Junto com o iframe em sandbox (sem allow-same-origin), o artefato não enxerga a sessão nem fala com o Otto.
 */
export const CSP_ARTEFATO = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
  "style-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net data:',
  'img-src https: data: blob:',
  'media-src https: data: blob:',
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-src 'none'",
  "worker-src blob:",
].join('; ')

const META_CSP = `<meta http-equiv="Content-Security-Policy" content="${CSP_ARTEFATO}">`
const BASE_ESTILO = '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'

/**
 * O documento que vai para o iframe: a política de segurança vem antes de tudo (nenhum script do artefato roda antes
 * dela, mesmo que ele tenha conteúdo antes do <head>). O <!doctype> do artefato é trocado pelo nosso, no começo, para
 * a página não cair no modo de compatibilidade antigo do navegador.
 */
export function documentoIsolado(html: string) {
  return `<!doctype html>${META_CSP}${BASE_ESTILO}${html.replace(/^\s*<!doctype[^>]*>/i, '')}`
}

/** Atributo sandbox do iframe: scripts sim; mesma origem, navegação do topo e formulários, não. */
export const SANDBOX_ARTEFATO = 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads'

/**
 * Trocas pontuais no HTML (para o agente mudar um trecho sem reenviar tudo): cada `antigo` precisa aparecer exatamente
 * uma vez, e as trocas valem em ordem. Devolve o erro da primeira que não der certo.
 */
export function aplicarSubstituicoes(html: string, trocas: { antigo: string; novo: string }[]): { ok: true; valor: string } | { ok: false; erro: string } {
  let atual = html
  for (const [i, { antigo, novo }] of trocas.entries()) {
    if (!antigo) return { ok: false, erro: `A troca ${i + 1} está com o trecho antigo vazio.` }
    const primeira = atual.indexOf(antigo)
    if (primeira < 0) return { ok: false, erro: `A troca ${i + 1} não achou o trecho antigo no HTML atual. Leia o artefato de novo.` }
    if (atual.indexOf(antigo, primeira + 1) >= 0) return { ok: false, erro: `O trecho antigo da troca ${i + 1} aparece mais de uma vez; inclua mais contexto para ficar único.` }
    atual = atual.slice(0, primeira) + novo + atual.slice(primeira + antigo.length)
  }
  return { ok: true, valor: atual }
}

/** Um pedaço do HTML (as respostas do MCP têm limite de tamanho): de `inicio`, até `tamanho` caracteres. */
export function parteDoHtml(html: string, inicio = 0, tamanho = 150_000) {
  const de = Math.max(0, Math.min(Math.trunc(inicio), html.length))
  const ate = Math.min(html.length, de + tamanho)
  return { trecho: html.slice(de, ate), inicio: de, fim: ate, total: html.length, proximo_inicio: ate < html.length ? ate : null }
}
