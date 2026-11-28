// Animação de saída para menus, painéis e janelas: quando o elemento sai da tela, uma cópia só visual (sem eventos,
// fora da acessibilidade) fica no lugar dele fazendo o movimento de saída e some em seguida. Assim nenhum componente
// precisa esperar a animação para fechar.
import x from './notas.module.css'

function fantasma(el: HTMLElement, classe: string, desde: number) {
  const pai = el.parentNode
  // Montado e desmontado na hora (o React faz isso em desenvolvimento): não anima.
  if (!pai || !el.isConnected || performance.now() - desde < 150) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const copia = el.cloneNode(true) as HTMLElement
  copia.classList.add(classe)
  copia.setAttribute('aria-hidden', 'true')
  copia.setAttribute('inert', '')
  copia.removeAttribute('role')
  copia.style.pointerEvents = 'none'
  copia.querySelectorAll('[role], [id], [data-id], [contenteditable]').forEach(n => {
    n.removeAttribute('role'); n.removeAttribute('id'); n.removeAttribute('data-id'); n.removeAttribute('contenteditable')
  })
  // Vídeos e páginas incorporadas não são recarregados só para a animação.
  copia.querySelectorAll('iframe, video, audio').forEach(n => n.replaceWith(Object.assign(document.createElement('div'), { style: `height:${(n as HTMLElement).offsetHeight}px` })))
  pai.insertBefore(copia, el.nextSibling)
  const tirar = () => copia.remove()
  copia.addEventListener('animationend', tirar, { once: true })
  setTimeout(tirar, 400)
}

/** Ref que anima a saída do elemento com a classe dada (uma por elemento; use as constantes abaixo). */
export function saidaAnimada(classe: string) {
  return (el: HTMLElement | null) => {
    if (!el) return
    const desde = performance.now()
    return () => fantasma(el, classe, desde)
  }
}

export const saidaPainel = saidaAnimada(x.painelSaindo)
export const saidaJanela = saidaAnimada(x.janelaSaindo)
export const saidaAviso = saidaAnimada(x.avisoSaindo)
export const saidaMenu = (el: HTMLElement) => { const desde = performance.now(); return () => fantasma(el, x.menuSaindo, desde) }
