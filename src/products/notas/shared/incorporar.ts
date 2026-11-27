// Notas — incorporar conteúdo: transforma o link colado no endereço de incorporação de serviços conhecidos. Só esses
// viram quadro (iframe); qualquer outro link vira um cartão com o endereço (nada de página externa desconhecida embutida).

export type Incorporacao = { tipo: 'quadro'; servico: string; src: string; proporcao: number } | { tipo: 'link'; url: string } | null

export function incorporacao(bruto: string): Incorporacao {
  const texto = bruto.trim()
  let url: URL
  try { url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`) } catch { return null }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '')
  const caminho = url.pathname
  // YouTube: watch?v=, youtu.be/, shorts/, embed/
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
    const id = host === 'youtu.be' ? caminho.slice(1) : url.searchParams.get('v') ?? caminho.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)?.[1]
    if (id && /^[\w-]{6,20}$/.test(id)) return { tipo: 'quadro', servico: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${id}`, proporcao: 16 / 9 }
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = caminho.match(/(\d{6,})/)?.[1]
    if (id) return { tipo: 'quadro', servico: 'Vimeo', src: `https://player.vimeo.com/video/${id}`, proporcao: 16 / 9 }
  }
  if (host === 'loom.com') {
    const id = caminho.match(/^\/(?:share|embed)\/([0-9a-f]{20,})/)?.[1]
    if (id) return { tipo: 'quadro', servico: 'Loom', src: `https://www.loom.com/embed/${id}`, proporcao: 16 / 9 }
  }
  if (host === 'figma.com' && /^\/(file|design|proto|board)\//.test(caminho)) {
    return { tipo: 'quadro', servico: 'Figma', src: `https://www.figma.com/embed?embed_host=otto&url=${encodeURIComponent(url.toString())}`, proporcao: 16 / 10 }
  }
  if ((host === 'google.com' || host.endsWith('.google.com')) && caminho.startsWith('/maps')) {
    const lugar = caminho.match(/\/maps\/place\/([^/]+)/)?.[1] ?? url.searchParams.get('q')
    if (lugar) return { tipo: 'quadro', servico: 'Google Maps', src: `https://maps.google.com/maps?q=${encodeURIComponent(decodeURIComponent(lugar).replace(/\+/g, ' '))}&output=embed`, proporcao: 16 / 10 }
  }
  if (/\.pdf$/i.test(caminho)) return { tipo: 'quadro', servico: 'PDF', src: url.toString(), proporcao: 3 / 4 }
  return { tipo: 'link', url: url.toString() }
}

/** Arquivo PDF enviado para as Notas (mesmo endereço do Otto): também vira quadro. */
export function incorporarArquivo(caminho: string): Incorporacao {
  return caminho.startsWith('/api/notas/arquivos/') && /\.pdf$/i.test(caminho) ? { tipo: 'quadro', servico: 'PDF', src: caminho, proporcao: 3 / 4 } : null
}
